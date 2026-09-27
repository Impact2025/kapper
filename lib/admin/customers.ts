import "server-only";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  agentRuns,
  aiUsage,
  conversations,
  events,
  salonDailyStats,
  salonNotes,
  salons,
  subscriptions,
  supportTickets,
  users,
} from "@/lib/db/schema";
import { env } from "@/lib/env";
import { computeHealth, type HealthResult } from "@/lib/admin/health";
import { monthlyMargin, type Margin } from "@/lib/admin/margin";
import { previousDays } from "@/lib/admin/day-window";

const DAY = 86_400_000;

export interface CustomerRow {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  vertical: string;
  plan: "essential" | "pro" | "elite";
  status: "trial" | "active" | "past_due" | "canceled";
  mrrCents: number;
  createdAt: Date;
  lastLoginAt: Date | null;
  conversations14d: number;
  bookings14d: number;
  openTickets: number;
  aiCostMicroEur30d: number;
  margin: Margin;
  health: HealthResult;
}

type SalonBase = Pick<CustomerRow, "id" | "name" | "slug" | "city" | "vertical" | "plan" | "status" | "mrrCents" | "createdAt">;

const n = (v: unknown) => Number(v ?? 0);

/**
 * Health + usage signals for a set of salons in a handful of grouped queries
 * (not one query per salon), so the customer list stays fast as it grows.
 */
async function enrich(base: SalonBase[], now = new Date()): Promise<CustomerRow[]> {
  if (!base.length) return [];
  const ids = base.map((s) => s.id);
  const recentStart = new Date(now.getTime() - 14 * DAY);
  const priorStart = new Date(now.getTime() - 28 * DAY);
  const monthStart = new Date(now.getTime() - 30 * DAY);

  const [loginRows, convRows, bookingRows, escRows, ticketRows, aiRows] = await Promise.all([
    db
      .select({ salonId: users.salonId, last: sql<Date | null>`max(${users.lastLoginAt})` })
      .from(users)
      .where(inArray(users.salonId, ids))
      .groupBy(users.salonId),
    db
      .select({
        salonId: conversations.salonId,
        recent: sql<number>`count(*) filter (where ${conversations.createdAt} >= ${recentStart.toISOString()})`,
        prior: sql<number>`count(*) filter (where ${conversations.createdAt} < ${recentStart.toISOString()})`,
      })
      .from(conversations)
      .where(and(inArray(conversations.salonId, ids), gte(conversations.createdAt, priorStart)))
      .groupBy(conversations.salonId),
    db
      .select({ salonId: events.salonId, c: sql<number>`count(*)` })
      .from(events)
      .where(and(inArray(events.salonId, ids), eq(events.type, "booking_made"), gte(events.createdAt, recentStart)))
      .groupBy(events.salonId),
    db
      .select({ salonId: agentRuns.salonId, c: sql<number>`count(*)` })
      .from(agentRuns)
      .where(and(inArray(agentRuns.salonId, ids), eq(agentRuns.escalated, true), gte(agentRuns.createdAt, recentStart)))
      .groupBy(agentRuns.salonId),
    db
      .select({
        salonId: supportTickets.salonId,
        open: sql<number>`count(*)`,
        breached: sql<number>`count(*) filter (where ${supportTickets.firstResponseAt} is null and ${supportTickets.slaDueAt} < ${now.toISOString()})`,
      })
      .from(supportTickets)
      .where(and(inArray(supportTickets.salonId, ids), sql`${supportTickets.status} not in ('opgelost', 'gesloten')`))
      .groupBy(supportTickets.salonId),
    db
      .select({ salonId: aiUsage.salonId, cost: sql<number>`coalesce(sum(${aiUsage.costMicroEur}), 0)` })
      .from(aiUsage)
      .where(and(inArray(aiUsage.salonId, ids), gte(aiUsage.createdAt, monthStart)))
      .groupBy(aiUsage.salonId),
  ]);

  const byId = <T extends { salonId: string | null }>(rows: T[]) => new Map(rows.map((r) => [r.salonId, r]));
  const logins = byId(loginRows);
  const convs = byId(convRows);
  const bookings = byId(bookingRows);
  const escs = byId(escRows);
  const tickets = byId(ticketRows);
  const ai = byId(aiRows);

  return base.map((s) => {
    const lastRaw = logins.get(s.id)?.last;
    const lastLoginAt = lastRaw ? new Date(lastRaw) : null;
    const conversations14d = n(convs.get(s.id)?.recent);
    const bookings14d = n(bookings.get(s.id)?.c);
    const openTickets = n(tickets.get(s.id)?.open);
    const aiCostMicroEur30d = n(ai.get(s.id)?.cost);
    const margin = monthlyMargin({ mrrCents: s.status === "active" ? s.mrrCents : 0, costMicroEur: aiCostMicroEur30d, days: 30 });
    const health = computeHealth({
      status: s.status,
      tenureDays: Math.floor((now.getTime() - s.createdAt.getTime()) / DAY),
      daysSinceLogin: lastLoginAt ? Math.floor((now.getTime() - lastLoginAt.getTime()) / DAY) : null,
      conversationsRecent: conversations14d,
      conversationsPrior: n(convs.get(s.id)?.prior),
      bookingsRecent: bookings14d,
      escalationsRecent: n(escs.get(s.id)?.c),
      openTickets,
      breachedTickets: n(tickets.get(s.id)?.breached),
      marginTone: margin.tone,
    });
    return { ...s, lastLoginAt, conversations14d, bookings14d, openTickets, aiCostMicroEur30d, margin, health };
  });
}

const baseColumns = {
  id: salons.id,
  name: salons.name,
  slug: salons.slug,
  city: salons.city,
  vertical: salons.vertical,
  plan: salons.plan,
  status: salons.status,
  mrrCents: salons.mrr,
  createdAt: salons.createdAt,
};

/** All customers with health, lowest score first (canceled last). */
export async function listCustomers(): Promise<CustomerRow[]> {
  if (!env.DATABASE_URL) return [];
  const base = await db.select(baseColumns).from(salons).orderBy(desc(salons.createdAt));
  const rows = await enrich(base);
  return rows.sort((a, b) => {
    const ca = a.status === "canceled" ? 1 : 0;
    const cb = b.status === "canceled" ? 1 : 0;
    return ca - cb || a.health.score - b.health.score || b.mrrCents - a.mrrCents;
  });
}

export interface DailyActivityPoint {
  day: string;
  conversations: number;
  bookings: number;
  aiCostMicroEur: number;
}

export interface CustomerDetail {
  customer: CustomerRow;
  subscription: { status: string; plan: string; currentPeriodEnd: Date | null; stripeCustomerId: string | null } | null;
  users: { id: string; name: string | null; email: string; lastLoginAt: Date | null; createdAt: Date }[];
  daily: DailyActivityPoint[];
  totals30d: { conversations: number; callsHandled: number; voiceSeconds: number; bookings: number; escalations: number; aiCalls: number };
  tickets: { id: string; ticketNumber: number; subject: string; status: string; priority: string; createdAt: Date }[];
  notes: { id: string; body: string; authorName: string | null; createdAt: Date }[];
  timeline: { type: string; createdAt: Date; props: Record<string, unknown> }[];
}

export async function getCustomerDetail(id: string): Promise<CustomerDetail | null> {
  if (!env.DATABASE_URL) return null;
  const [base] = await db.select(baseColumns).from(salons).where(eq(salons.id, id)).limit(1);
  if (!base) return null;

  const dayKeys = previousDays(new Date(Date.now() + DAY), 30); // last 30 days incl. today
  const [enriched, subRows, userRows, statRows, ticketRows, noteRows, eventRows] = await Promise.all([
    enrich([base]),
    db
      .select({ status: subscriptions.status, plan: subscriptions.plan, currentPeriodEnd: subscriptions.currentPeriodEnd, stripeCustomerId: subscriptions.stripeCustomerId })
      .from(subscriptions)
      .where(eq(subscriptions.salonId, id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1),
    db
      .select({ id: users.id, name: users.name, email: users.email, lastLoginAt: users.lastLoginAt, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.salonId, id)),
    db
      .select()
      .from(salonDailyStats)
      .where(and(eq(salonDailyStats.salonId, id), gte(salonDailyStats.day, dayKeys[0]!))),
    db
      .select({
        id: supportTickets.id,
        ticketNumber: supportTickets.ticketNumber,
        subject: supportTickets.subject,
        status: supportTickets.status,
        priority: supportTickets.priority,
        createdAt: supportTickets.createdAt,
      })
      .from(supportTickets)
      .where(eq(supportTickets.salonId, id))
      .orderBy(desc(supportTickets.createdAt))
      .limit(8),
    db
      .select({ id: salonNotes.id, body: salonNotes.body, authorName: salonNotes.authorName, createdAt: salonNotes.createdAt })
      .from(salonNotes)
      .where(eq(salonNotes.salonId, id))
      .orderBy(desc(salonNotes.createdAt))
      .limit(50),
    db
      .select({ type: events.type, createdAt: events.createdAt, props: events.props })
      .from(events)
      .where(eq(events.salonId, id))
      .orderBy(desc(events.createdAt))
      .limit(25),
  ]);

  const statsByDay = new Map(statRows.map((r) => [r.day, r]));
  const sum = (k: keyof typeof statRows[number]) => statRows.reduce((acc, r) => acc + n(r[k]), 0);

  return {
    customer: enriched[0]!,
    subscription: subRows[0] ?? null,
    users: userRows,
    daily: dayKeys.map((day) => {
      const r = statsByDay.get(day);
      return { day, conversations: n(r?.conversations), bookings: n(r?.bookings), aiCostMicroEur: n(r?.aiCostMicroEur) };
    }),
    totals30d: {
      conversations: sum("conversations"),
      callsHandled: sum("callsHandled"),
      voiceSeconds: sum("voiceSeconds"),
      bookings: sum("bookings"),
      escalations: sum("escalations"),
      aiCalls: sum("aiCalls"),
    },
    tickets: ticketRows,
    notes: noteRows,
    // Timeline shows event types and timestamps only — no conversation
    // content or customer PII leaves the salon's own dashboard.
    timeline: eventRows.map((e) => ({ type: e.type, createdAt: e.createdAt, props: pickSafeProps(e.props) })),
  };
}

/** Whitelist of event props that are safe to show in the platform cockpit. */
function pickSafeProps(props: Record<string, unknown>): Record<string, unknown> {
  const SAFE = ["durationSeconds", "role", "plan", "channel", "amount", "status"];
  return Object.fromEntries(Object.entries(props ?? {}).filter(([k]) => SAFE.includes(k)));
}
