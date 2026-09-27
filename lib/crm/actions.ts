"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { leads, crmActivities, emailMessages } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/dal";
import { auditAdmin } from "@/lib/admin/audit";
import { sendEmail } from "@/lib/mail/resend";
import { renderOutreach, sendOutreach, outreachAudience, MAX_PER_SEND } from "@/lib/crm/outreach";
import { unknownPlaceholders } from "@/lib/crm/outreach-template";
import { isVerticalId } from "@/lib/verticals";
import { env } from "@/lib/env";
import { LEAD_STAGES, LEAD_STAGE_LABELS, type LeadStage } from "@/lib/crm/constants";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const stageSchema = z.object({
  leadId: z.string().uuid(),
  stage: z.enum(LEAD_STAGES),
});

export async function updateLeadStage(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireRole("admin");
  const parsed = stageSchema.safeParse({
    leadId: formData.get("leadId"),
    stage: formData.get("stage"),
  });
  if (!parsed.success) return { ok: false, error: "Ongeldige invoer." };

  const { leadId, stage } = parsed.data;
  const [current] = await db
    .select({ stage: leads.stage })
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);
  if (!current) return { ok: false, error: "Lead niet gevonden." };
  if (current.stage === stage) return { ok: true };

  await db.update(leads).set({ stage }).where(eq(leads.id, leadId));
  await db.insert(crmActivities).values({
    leadId,
    type: "stage_change",
    userId: user.id,
    body: `Fase gewijzigd van ${LEAD_STAGE_LABELS[current.stage as LeadStage]} naar ${LEAD_STAGE_LABELS[stage]}.`,
    meta: { from: current.stage, to: stage },
  });
  await auditAdmin(user, "lead.stage", { type: "lead", id: leadId }, { from: current.stage, to: stage });

  revalidatePath(`/admin/crm/${leadId}`);
  revalidatePath("/admin/crm");
  return { ok: true };
}

const noteSchema = z.object({
  leadId: z.string().uuid(),
  body: z.string().min(1, "Notitie mag niet leeg zijn.").max(5000),
});

export async function addNote(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireRole("admin");
  const parsed = noteSchema.safeParse({
    leadId: formData.get("leadId"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ongeldige invoer." };
  }

  await db.insert(crmActivities).values({
    leadId: parsed.data.leadId,
    type: "note",
    userId: user.id,
    body: parsed.data.body,
  });

  revalidatePath(`/admin/crm/${parsed.data.leadId}`);
  return { ok: true };
}

const emailSchema = z.object({
  leadId: z.string().uuid(),
  to: z.string().email("Ongeldig e-mailadres."),
  subject: z.string().min(2, "Onderwerp is verplicht.").max(200),
  body: z.string().min(2, "Bericht is verplicht.").max(20000),
});

export async function sendLeadEmail(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireRole("admin");
  const parsed = emailSchema.safeParse({
    leadId: formData.get("leadId"),
    to: formData.get("to"),
    subject: formData.get("subject"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ongeldige invoer." };
  }

  const { leadId, to, subject, body } = parsed.data;
  const [lead] = await db
    .select({
      salonName: leads.salonName,
      city: leads.city,
      vertical: leads.vertical,
      optOutToken: leads.optOutToken,
      optedOutAt: leads.optedOutAt,
    })
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);
  if (!lead) return { ok: false, error: "Lead niet gevonden." };
  if (lead.optedOutAt) return { ok: false, error: "Deze lead heeft zich afgemeld — niet mailen." };

  // Same rendering as bulk outreach: vertical brand, {{placeholders}}, unsubscribe line.
  const mail = renderOutreach(lead, subject, body);
  const { from, html } = mail;
  const resendId = await sendEmail({ to, subject: mail.subject, html, from, replyTo: env.REPORT_RECIPIENT });

  await db.insert(emailMessages).values({
    leadId,
    direction: "outbound",
    toAddress: to,
    fromAddress: from,
    subject: mail.subject,
    html,
    resendId,
    status: resendId ? "sent" : "skipped",
  });
  await db.insert(crmActivities).values({
    leadId,
    type: "email",
    userId: user.id,
    body: `E-mail verstuurd: "${mail.subject}"`,
    meta: { to, resendId },
  });
  await auditAdmin(user, "lead.email", { type: "lead", id: leadId }, { subject });

  revalidatePath(`/admin/crm/${leadId}`);
  return resendId
    ? { ok: true }
    : { ok: true, error: "Verstuurd (let op: RESEND_API_KEY ontbreekt, e-mail niet daadwerkelijk verzonden)." };
}

const outreachSchema = z.object({
  vertical: z.string().refine(isVerticalId, "Onbekende vertical."),
  subject: z.string().trim().min(2, "Onderwerp is verplicht.").max(200),
  body: z.string().trim().min(20, "Bericht is te kort.").max(20000),
  onlyNeverEmailed: z.boolean(),
  leadIds: z.array(z.string().uuid()).min(1, "Selecteer minstens één lead.").max(MAX_PER_SEND, `Maximaal ${MAX_PER_SEND} leads per keer.`),
});

export interface OutreachActionResult extends ActionResult {
  message?: string;
}

function parseOutreach(formData: FormData) {
  const parsed = outreachSchema.safeParse({
    vertical: formData.get("vertical"),
    subject: formData.get("subject"),
    body: formData.get("body"),
    onlyNeverEmailed: formData.get("onlyNeverEmailed") === "1",
    leadIds: formData.getAll("leadIds"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ongeldige invoer." } as const;
  const unknown = unknownPlaceholders(`${parsed.data.subject}
${parsed.data.body}`);
  if (unknown.length) {
    return { error: `Onbekende placeholder: ${unknown.map((u) => `{{${u}}}`).join(", ")}. Gebruik {{naam}}, {{plaats}}, {{merk}} of {{site}}.` } as const;
  }
  return { data: parsed.data } as const;
}

/**
 * Bulk outreach to selected leads of one vertical ("send" button), or a
 * test copy of the first selected lead's mail to the admin ("test" button).
 */
export async function sendOutreachAction(
  _prev: OutreachActionResult | undefined,
  formData: FormData,
): Promise<OutreachActionResult> {
  const user = await requireRole("admin");
  const parsed = parseOutreach(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  const { vertical, subject, body, onlyNeverEmailed, leadIds } = parsed.data;

  if (formData.get("intent") === "test") {
    const audience = await outreachAudience({ vertical, stages: [], onlyNeverEmailed: false });
    const sample = audience.find((l) => l.id === leadIds[0]);
    if (!sample) return { ok: false, error: "Lead niet gevonden." };
    const mail = renderOutreach(sample, subject, body);
    const id = await sendEmail({ to: user.email, subject: `[TEST] ${mail.subject}`, html: mail.html, from: mail.from, replyTo: env.REPORT_RECIPIENT });
    return id
      ? { ok: true, message: `Testmail (zoals ${sample.salonName} hem krijgt) verstuurd naar ${user.email}.` }
      : { ok: false, error: "Testmail niet verstuurd — RESEND_API_KEY ontbreekt of Resend gaf een fout." };
  }

  const result = await sendOutreach({ leadIds, subject, body, onlyNeverEmailed, userId: user.id });
  await auditAdmin(user, "lead.outreach", null, { vertical, subject, ...result });
  revalidatePath("/admin/crm");
  revalidatePath("/admin/crm/outreach");

  if (result.dryRun) {
    return { ok: false, error: `Niets verstuurd: RESEND_API_KEY ontbreekt. Gelogd als "skipped" bij de leads.` };
  }
  const parts = [`${result.sent} verstuurd`];
  if (result.skipped) parts.push(`${result.skipped} overgeslagen`);
  if (result.failed) parts.push(`${result.failed} mislukt`);
  return { ok: result.failed === 0, message: parts.join(" · "), error: result.failed ? "Een deel is mislukt — zie Sentry/logs." : undefined };
}
