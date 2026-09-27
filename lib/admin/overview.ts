import "server-only";
import { and, asc, desc, eq, gte, inArray, isNotNull, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { aiUsage, events, mrrSnapshots, salons, supportTickets } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { mrrMovements, type MrrMovements } from "@/lib/admin/mrr";
import { amsterdamDayOf } from "@/lib/admin/day-window";

const DAY = 86_400_000;

/** Platform events worth showing in the live feed (no PII-bearing types like login_failed). */
export const FEED_EVENT_TYPES = ["booking_made", "call_handled", "escalated", "no_show_prevented", "webshop_order_paid", "login"] as const;

export interface CockpitOverview {
  mrrCents: number;
  activeCustomers: number;
  trials: number;
  pastDue: number;
  /** Of customers that signed up in the last 90 days and left trial: share that became active. */
  trialConversionPct: number | null;
  movements: (MrrMovements & { fromDay: string; toDay: string }) | null;
  aiCostMicroEur30d: number;
  openTickets: number;
  breachedTickets: number;
  feed: { type: string; createdAt: Date; salonId: string | null; salonName: string | null }[];
}

export async function getCockpitOverview(): Promise<CockpitOverview> {
  const empty: CockpitOverview = {
    mrrCents: 0,
    activeCustomers: 0,
    trials: 0,
    pastDue: 0,
    trialConversionPct: null,
    movements: null,
    aiCostMicroEur30d: 0,
    openTickets: 0,
    breachedTickets: 0,
    feed: [],
  };
  if (!env.DATABASE_URL) return empty;

  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * DAY);
  const since90 = new Date(now.getTime() - 90 * DAY);

  const [salonRow, cohortRow, aiRow, ticketRow, feed, snapshotDays] = await Promise.all([
    db
      .select({
        mrr: sql<number>`coalesce(sum(${salons.mrr}) filter (where ${salons.status} = 'active'), 0)`,
        active: sql<number>`count(*) filter (where ${salons.status} = 'active')`,
        trials: sql<number>`count(*) filter (where ${salons.status} = 'trial')`,
        pastDue: sql<number>`count(*) filter (where ${salons.status} = 'past_due')`,
      })
      .from(salons),
    db
      .select({
        converted: sql<number>`count(*) filter (where ${salons.status} in ('active', 'past_due'))`,
        decided: sql<number>`count(*) filter (where ${salons.status} <> 'trial')`,
      })
      .from(salons)
      .where(gte(salons.createdAt, since90)),
    db
      .select({ cost: sql<number>`coalesce(sum(${aiUsage.costMicroEur}), 0)` })
      .from(aiUsage)
      .where(gte(aiUsage.createdAt, since30)),
    db
      .select({
        open: sql<number>`count(*)`,
        breached: sql<number>`count(*) filter (where ${supportTickets.firstResponseAt} is null and ${supportTickets.slaDueAt} < ${now.toISOString()})`,
      })
      .from(supportTickets)
      .where(sql`${supportTickets.status} not in ('opgelost', 'gesloten')`),
    db
      .select({ type: events.type, createdAt: events.createdAt, salonId: events.salonId, salonName: salons.name })
      .from(events)
      .leftJoin(salons, eq(salons.id, events.salonId))
      .where(and(inArray(events.type, [...FEED_EVENT_TYPES]), isNotNull(events.salonId)))
      .orderBy(desc(events.createdAt))
      .limit(15),
    // Snapshot days bracketing the last 30 days: the oldest one on/after the
    // window start, and the newest one overall.
    Promise.all([
      db
        .select({ day: mrrSnapshots.day })
        .from(mrrSnapshots)
        .where(gte(mrrSnapshots.day, amsterdamDayOf(since30)))
        .orderBy(asc(mrrSnapshots.day))
        .limit(1),
      db.select({ day: mrrSnapshots.day }).from(mrrSnapshots).where(lte(mrrSnapshots.day, amsterdamDayOf(now))).orderBy(desc(mrrSnapshots.day)).limit(1),
    ]),
  ]);

  const n = (v: unknown) => Number(v ?? 0);
  const s = salonRow[0];
  const cohort = cohortRow[0];

  let movements: CockpitOverview["movements"] = null;
  const fromDay = snapshotDays[0][0]?.day;
  const toDay = snapshotDays[1][0]?.day;
  if (fromDay && toDay && fromDay < toDay) {
    const load = (day: string) =>
      db
        .select({ salonId: mrrSnapshots.salonId, mrrCents: mrrSnapshots.mrrCents, status: mrrSnapshots.status })
        .from(mrrSnapshots)
        .where(eq(mrrSnapshots.day, day));
    const [a, b] = await Promise.all([load(fromDay), load(toDay)]);
    // Same definition as the MRR tile: only active salons count as revenue.
    const effective = (rows: typeof a) => rows.map((r) => ({ salonId: r.salonId, mrrCents: r.status === "active" ? r.mrrCents : 0 }));
    movements = { ...mrrMovements(effective(a), effective(b)), fromDay, toDay };
  }

  return {
    mrrCents: n(s?.mrr),
    activeCustomers: n(s?.active),
    trials: n(s?.trials),
    pastDue: n(s?.pastDue),
    trialConversionPct: n(cohort?.decided) ? Math.round((n(cohort?.converted) / n(cohort?.decided)) * 100) : null,
    movements,
    aiCostMicroEur30d: n(aiRow[0]?.cost),
    openTickets: n(ticketRow[0]?.open),
    breachedTickets: n(ticketRow[0]?.breached),
    feed,
  };
}
