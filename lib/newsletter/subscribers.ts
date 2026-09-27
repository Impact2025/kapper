import "server-only";
import { randomBytes } from "node:crypto";
import { and, desc, eq, ilike, inArray, isNotNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { newsletterSends, newsletterSubscribers, salons, users } from "@/lib/db/schema";
import { env, publicEnv } from "@/lib/env";
import { sendEmail } from "@/lib/mail/resend";
import { button, shell } from "@/lib/mail/templates";
import { matchesSegment, type Segment } from "@/lib/newsletter/segment";

export type SubscriberRow = typeof newsletterSubscribers.$inferSelect;

const newToken = () => randomBytes(24).toString("base64url");
const siteUrl = () => publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

export const unsubscribeUrl = (token: string) => `${siteUrl()}/nieuwsbrief/afmelden/${token}`;
export const oneClickUnsubscribeUrl = (token: string) => `${siteUrl()}/api/newsletter/unsubscribe?t=${encodeURIComponent(token)}`;

export type SubscribeOutcome = "confirm_sent" | "already_subscribed" | "resubscribe_confirm_sent" | "no_database";

/**
 * Public sign-up (double opt-in). Never reveals whether an address already
 * exists: the caller shows the same "check je inbox" message for every outcome.
 */
export async function subscribePublic(input: {
  email: string;
  name?: string | null;
  vertical?: string | null;
  consentSource: string;
  ip: string | null;
}): Promise<SubscribeOutcome> {
  if (!env.DATABASE_URL) return "no_database";
  const email = input.email.trim().toLowerCase();
  const [existing] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, email)).limit(1);
  if (existing?.status === "subscribed") return "already_subscribed";

  const token = existing?.token ?? newToken();
  if (existing) {
    // Re-subscribe after unsubscribing/bouncing still needs a fresh confirmation.
    await db
      .update(newsletterSubscribers)
      .set({ status: "pending", name: input.name || existing.name, consentSource: input.consentSource, consentIp: input.ip })
      .where(eq(newsletterSubscribers.id, existing.id));
  } else {
    await db.insert(newsletterSubscribers).values({
      email,
      name: input.name || null,
      vertical: input.vertical || null,
      source: "formulier",
      status: "pending",
      consentSource: input.consentSource,
      consentIp: input.ip,
      token,
    });
  }

  const confirmUrl = `${siteUrl()}/nieuwsbrief/bevestig/${token}`;
  await sendEmail({
    to: email,
    subject: "Bevestig je aanmelding voor de nieuwsbrief",
    html: shell(
      "Bijna klaar",
      `<p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Klik op de knop om je aanmelding te bevestigen. Heb je je niet aangemeld? Dan hoef je niets te doen — je ontvangt dan niets van ons.</p>${button(confirmUrl, "Aanmelding bevestigen")}`,
    ),
  });
  return existing ? "resubscribe_confirm_sent" : "confirm_sent";
}

/** Double-opt-in confirmation. The consent timestamp is set only here. */
export async function confirmSubscription(token: string): Promise<SubscriberRow | null> {
  if (!env.DATABASE_URL || !token) return null;
  const [row] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.token, token)).limit(1);
  if (!row) return null;
  if (row.status === "subscribed") return row;
  if (row.status === "complained") return null; // a spam complaint is final
  const [updated] = await db
    .update(newsletterSubscribers)
    .set({ status: "subscribed", consentAt: new Date(), unsubscribedAt: null })
    .where(eq(newsletterSubscribers.id, row.id))
    .returning();
  return updated ?? null;
}

/** Unsubscribe by token (link in every mail + one-click header). Idempotent. */
export async function unsubscribeByToken(token: string, sendId?: string | null): Promise<SubscriberRow | null> {
  if (!env.DATABASE_URL || !token) return null;
  const [row] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.token, token)).limit(1);
  if (!row) return null;
  if (row.status !== "unsubscribed") {
    await db
      .update(newsletterSubscribers)
      .set({ status: row.status === "complained" ? "complained" : "unsubscribed", unsubscribedAt: new Date() })
      .where(eq(newsletterSubscribers.id, row.id));
  }
  if (sendId) {
    await db
      .update(newsletterSends)
      .set({ unsubscribedAt: new Date() })
      .where(and(eq(newsletterSends.id, sendId), eq(newsletterSends.subscriberId, row.id)));
  }
  return row;
}

/**
 * Admin: add a contact directly. The operator attests the legal basis
 * (e.g. "beurs 2026, visitekaartje") — stored verbatim as consent proof.
 */
export async function addSubscriberManually(input: {
  email: string;
  name?: string | null;
  vertical?: string | null;
  tags: string[];
  consentSource: string;
}): Promise<"added" | "exists" | "blocked"> {
  const email = input.email.trim().toLowerCase();
  const [existing] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, email)).limit(1);
  // Someone who unsubscribed or complained is never re-added by an operator.
  if (existing && ["unsubscribed", "complained", "bounced"].includes(existing.status)) return "blocked";
  if (existing) return "exists";
  await db.insert(newsletterSubscribers).values({
    email,
    name: input.name || null,
    vertical: input.vertical || null,
    tags: input.tags,
    source: "handmatig",
    status: "subscribed",
    consentAt: new Date(),
    consentSource: input.consentSource,
    token: newToken(),
  });
  return "added";
}

/**
 * Soft opt-in (Tw 11.7): existing paying/trial customers may receive mail
 * about similar services, provided every mail offers an easy opt-out. Adds
 * salon owners who aren't on the list yet; never touches anyone who opted out.
 */
export async function importCustomers(): Promise<{ added: number; skipped: number }> {
  if (!env.DATABASE_URL) return { added: 0, skipped: 0 };
  const owners = await db
    .select({ email: users.email, name: users.name, salonId: salons.id, vertical: salons.vertical })
    .from(users)
    .innerJoin(salons, eq(salons.id, users.salonId))
    .where(and(eq(users.role, "owner"), isNotNull(users.salonId), sql`${salons.status} <> 'canceled'`));
  if (!owners.length) return { added: 0, skipped: 0 };

  const emails = owners.map((o) => o.email.toLowerCase());
  const known = new Set(
    (await db.select({ email: newsletterSubscribers.email }).from(newsletterSubscribers).where(inArray(newsletterSubscribers.email, emails))).map((r) => r.email),
  );
  const fresh = owners.filter((o) => !known.has(o.email.toLowerCase()));
  if (fresh.length) {
    const now = new Date();
    await db
      .insert(newsletterSubscribers)
      .values(
        fresh.map((o) => ({
          email: o.email.toLowerCase(),
          name: o.name,
          vertical: o.vertical,
          salonId: o.salonId,
          source: "klant",
          status: "subscribed",
          consentAt: now,
          consentSource: "soft opt-in: bestaande klant (Tw 11.7)",
          token: newToken(),
        })),
      )
      .onConflictDoNothing({ target: newsletterSubscribers.email });
  }
  return { added: fresh.length, skipped: owners.length - fresh.length };
}

export interface AudienceMember {
  id: string;
  email: string;
  name: string | null;
  token: string;
}

/** Everyone a campaign with this segment would go to right now. */
export async function audienceFor(segment: Segment): Promise<AudienceMember[]> {
  if (!env.DATABASE_URL) return [];
  const rows = await db
    .select({
      id: newsletterSubscribers.id,
      email: newsletterSubscribers.email,
      name: newsletterSubscribers.name,
      token: newsletterSubscribers.token,
      status: newsletterSubscribers.status,
      source: newsletterSubscribers.source,
      tags: newsletterSubscribers.tags,
      vertical: sql<string | null>`coalesce(${salons.vertical}, ${newsletterSubscribers.vertical})`,
      salonStatus: salons.status,
    })
    .from(newsletterSubscribers)
    .leftJoin(salons, eq(salons.id, newsletterSubscribers.salonId))
    .where(eq(newsletterSubscribers.status, "subscribed"));
  return rows.filter((r) => matchesSegment(r, segment)).map(({ id, email, name, token }) => ({ id, email, name, token }));
}

export interface SubscriberCounts {
  total: number;
  subscribed: number;
  pending: number;
  unsubscribed: number;
  bounced: number;
}

export async function subscriberCounts(): Promise<SubscriberCounts> {
  if (!env.DATABASE_URL) return { total: 0, subscribed: 0, pending: 0, unsubscribed: 0, bounced: 0 };
  const [r] = await db
    .select({
      total: sql<number>`count(*)`,
      subscribed: sql<number>`count(*) filter (where ${newsletterSubscribers.status} = 'subscribed')`,
      pending: sql<number>`count(*) filter (where ${newsletterSubscribers.status} = 'pending')`,
      unsubscribed: sql<number>`count(*) filter (where ${newsletterSubscribers.status} = 'unsubscribed')`,
      bounced: sql<number>`count(*) filter (where ${newsletterSubscribers.status} in ('bounced', 'complained'))`,
    })
    .from(newsletterSubscribers);
  return {
    total: Number(r?.total ?? 0),
    subscribed: Number(r?.subscribed ?? 0),
    pending: Number(r?.pending ?? 0),
    unsubscribed: Number(r?.unsubscribed ?? 0),
    bounced: Number(r?.bounced ?? 0),
  };
}

export async function listSubscribers(opts: { status?: string; q?: string; limit?: number } = {}): Promise<SubscriberRow[]> {
  if (!env.DATABASE_URL) return [];
  const conds = [];
  if (opts.status) conds.push(eq(newsletterSubscribers.status, opts.status));
  if (opts.q) conds.push(or(ilike(newsletterSubscribers.email, `%${opts.q}%`), ilike(newsletterSubscribers.name, `%${opts.q}%`)));
  return db
    .select()
    .from(newsletterSubscribers)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(newsletterSubscribers.createdAt))
    .limit(opts.limit ?? 200);
}

/** Bounce / spam complaint from the Resend webhook: stop mailing this address. */
export async function markDeliveryProblem(resendId: string, kind: "bounced" | "complained"): Promise<void> {
  if (!env.DATABASE_URL) return;
  const [send] = await db
    .update(newsletterSends)
    .set({ status: kind })
    .where(eq(newsletterSends.resendId, resendId))
    .returning({ subscriberId: newsletterSends.subscriberId });
  if (!send) return;
  await db
    .update(newsletterSubscribers)
    .set({ status: kind, unsubscribedAt: new Date() })
    .where(eq(newsletterSubscribers.id, send.subscriberId));
}
