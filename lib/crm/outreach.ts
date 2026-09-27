import "server-only";
import { and, eq, inArray, isNotNull, isNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads, crmActivities, emailMessages, newsletterSubscribers } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { getResend, brandedFrom } from "@/lib/mail/resend";
import { brandFor, simpleEmail } from "@/lib/mail/templates";
import { captureError } from "@/lib/observability";
import { siteUrlFor } from "@/lib/verticals/site-url";
import type { LeadStage } from "@/lib/crm/constants";
import { fillPlaceholders, skipReason, type SkipReason } from "@/lib/crm/outreach-template";

/** Resend's batch endpoint takes at most 100 messages per call. */
const BATCH_SIZE = 100;
/** Hard cap per send action, so one click stays well inside a request timeout. */
export const MAX_PER_SEND = 300;

export interface OutreachFilters {
  vertical: string;
  stages: LeadStage[];
  onlyNeverEmailed: boolean;
}

export interface OutreachRecipient {
  id: string;
  salonName: string;
  email: string | null;
  city: string | null;
  stage: LeadStage;
  vertical: string;
  optOutToken: string;
  emailsSent: number;
  skip: SkipReason | null;
}

/** Emails that must never get outreach: opted-out leads + newsletter unsubscribes/bounces/complaints. */
async function suppressedEmails(): Promise<Set<string>> {
  const [optedOut, newsletter] = await Promise.all([
    db.select({ email: leads.email }).from(leads).where(and(isNotNull(leads.optedOutAt), isNotNull(leads.email))),
    db
      .select({ email: newsletterSubscribers.email })
      .from(newsletterSubscribers)
      .where(inArray(newsletterSubscribers.status, ["unsubscribed", "bounced", "complained"])),
  ]);
  return new Set([...optedOut, ...newsletter].map((r) => r.email!.trim().toLowerCase()));
}

/** Leads matching the filters, each annotated with why it would be skipped (if at all). */
export async function outreachAudience(filters: OutreachFilters): Promise<OutreachRecipient[]> {
  if (!env.DATABASE_URL) return [];
  const conditions: SQL[] = [eq(leads.vertical, filters.vertical)];
  if (filters.stages.length) conditions.push(inArray(leads.stage, filters.stages));
  return annotate(conditions, filters.onlyNeverEmailed);
}

async function annotate(conditions: SQL[], onlyNeverEmailed: boolean): Promise<OutreachRecipient[]> {
  const sentCount = sql<number>`(select count(*) from ${emailMessages} m where m.lead_id = ${leads.id} and m.direction = 'outbound')`;
  const [rows, suppressed] = await Promise.all([
    db
      .select({
        id: leads.id,
        salonName: leads.salonName,
        email: leads.email,
        city: leads.city,
        stage: leads.stage,
        vertical: leads.vertical,
        optOutToken: leads.optOutToken,
        optedOutAt: leads.optedOutAt,
        emailsSent: sentCount,
      })
      .from(leads)
      .where(and(...conditions))
      .orderBy(leads.salonName)
      .limit(1000),
    suppressedEmails(),
  ]);
  return rows.map(({ optedOutAt, ...r }) => {
    const emailsSent = Number(r.emailsSent);
    return { ...r, emailsSent, skip: skipReason({ ...r, optedOutAt, emailsSent }, { onlyNeverEmailed }, suppressed) };
  });
}

export const optOutPageUrl = (vertical: string, token: string) =>
  `${siteUrlFor(vertical).replace(/\/$/, "")}/afmelden/${encodeURIComponent(token)}`;
export const optOutOneClickUrl = (vertical: string, token: string) =>
  `${siteUrlFor(vertical).replace(/\/$/, "")}/api/outreach/afmelden?t=${encodeURIComponent(token)}`;

type LeadForMail = Pick<OutreachRecipient, "salonName" | "city" | "vertical" | "optOutToken">;

/** One personalised outreach mail, in the lead's own vertical brand, with an unsubscribe line. */
export function renderOutreach(lead: LeadForMail, subjectTpl: string, bodyTpl: string) {
  const brand = brandFor(lead.vertical);
  const vars = { naam: lead.salonName, plaats: lead.city, merk: brand.name, site: siteUrlFor(lead.vertical) };
  const subject = fillPlaceholders(subjectTpl, vars);
  const body = fillPlaceholders(bodyTpl, vars);
  const unsub = optOutPageUrl(lead.vertical, lead.optOutToken);
  const footerHtml = `<p style="font-size:12px;line-height:1.5;color:#747871;margin:24px 0 0;">Liever geen berichten meer van ${brand.name}? <a href="${unsub}" style="color:#747871;">Afmelden</a>.</p>`;
  return {
    subject,
    html: simpleEmail({ title: subject, body, brand, footerHtml }),
    text: `${body}\n\n—\nLiever geen berichten meer van ${brand.name}? Afmelden: ${unsub}`,
    from: brandedFrom(lead.vertical),
    headers: {
      // RFC 8058 one-click unsubscribe — Gmail/Yahoo expect it on bulk mail.
      "List-Unsubscribe": `<${optOutOneClickUrl(lead.vertical, lead.optOutToken)}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

export interface OutreachResult {
  sent: number;
  skipped: number;
  failed: number;
  /** True when RESEND_API_KEY is missing: logged as "skipped", nothing left the building. */
  dryRun: boolean;
}

/**
 * Sends the outreach mail to the given leads. Eligibility is re-checked
 * server-side (a lead may have opted out since the page loaded), and every
 * message is logged on the lead's timeline.
 */
export async function sendOutreach(input: {
  leadIds: string[];
  subject: string;
  body: string;
  onlyNeverEmailed: boolean;
  userId: string;
}): Promise<OutreachResult> {
  const result: OutreachResult = { sent: 0, skipped: 0, failed: 0, dryRun: false };
  if (!env.DATABASE_URL || !input.leadIds.length) return result;

  const recipients = await annotate([inArray(leads.id, input.leadIds.slice(0, MAX_PER_SEND))], input.onlyNeverEmailed);
  const eligible = recipients.filter((r) => !r.skip);
  result.skipped = input.leadIds.length - eligible.length;

  // One mail per address, even if two leads share it.
  const seen = new Set<string>();
  const unique = eligible.filter((r) => {
    const e = r.email!.trim().toLowerCase();
    if (seen.has(e)) return false;
    seen.add(e);
    return true;
  });
  result.skipped += eligible.length - unique.length;

  const resend = getResend();
  result.dryRun = !resend;

  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const chunk = unique.slice(i, i + BATCH_SIZE).map((lead) => ({ lead, mail: renderOutreach(lead, input.subject, input.body) }));
    let ids: (string | null)[] = chunk.map(() => null);
    let status = "skipped";
    if (resend) {
      try {
        const { data, error } = await resend.batch.send(
          chunk.map(({ lead, mail }) => ({
            from: mail.from,
            to: lead.email!,
            subject: mail.subject,
            html: mail.html,
            text: mail.text,
            replyTo: env.REPORT_RECIPIENT,
            headers: mail.headers,
            tags: [{ name: "type", value: "outreach" }],
          })),
        );
        if (error) throw new Error(error.message);
        ids = (data?.data ?? []).map((d) => d?.id ?? null);
        status = "sent";
        result.sent += chunk.length;
      } catch (err) {
        captureError("crm/outreach", err);
        status = "failed";
        result.failed += chunk.length;
      }
    }

    await db.insert(emailMessages).values(
      chunk.map(({ lead, mail }, j) => ({
        leadId: lead.id,
        direction: "outbound" as const,
        toAddress: lead.email!,
        fromAddress: mail.from,
        subject: mail.subject,
        html: mail.html,
        resendId: ids[j] ?? null,
        status,
      })),
    );
    await db.insert(crmActivities).values(
      chunk.map(({ lead, mail }, j) => ({
        leadId: lead.id,
        type: "email" as const,
        userId: input.userId,
        body:
          status === "sent"
            ? `Outreach-mail verstuurd: "${mail.subject}"`
            : `Outreach-mail niet verstuurd (${status === "failed" ? "fout bij Resend" : "RESEND_API_KEY ontbreekt"}): "${mail.subject}"`,
        meta: { to: lead.email, resendId: ids[j] ?? null, bulk: true },
      })),
    );
  }

  return result;
}

/** Lead behind an opt-out token, for the public unsubscribe page. */
export async function leadByOptOutToken(token: string) {
  if (!env.DATABASE_URL || !token || token.length > 100) return null;
  const [lead] = await db
    .select({ id: leads.id, email: leads.email, vertical: leads.vertical, optedOutAt: leads.optedOutAt })
    .from(leads)
    .where(eq(leads.optOutToken, token))
    .limit(1);
  return lead ?? null;
}

/**
 * Opts out the lead behind this token and every other lead with the same
 * email address. Idempotent; unknown tokens are a no-op.
 */
export async function optOutByToken(token: string): Promise<boolean> {
  const lead = await leadByOptOutToken(token);
  if (!lead) return false;
  if (lead.optedOutAt) return true;
  const email = lead.email?.trim().toLowerCase();
  const target = email ? or(eq(leads.id, lead.id), sql`lower(${leads.email}) = ${email}`) : eq(leads.id, lead.id);
  const updated = await db
    .update(leads)
    .set({ optedOutAt: new Date() })
    .where(and(target, isNull(leads.optedOutAt)))
    .returning({ id: leads.id });
  if (updated.length) {
    await db.insert(crmActivities).values(
      updated.map((u) => ({ leadId: u.id, type: "note" as const, body: "Afgemeld voor outreach-mails via de afmeldlink." })),
    );
  }
  return true;
}
