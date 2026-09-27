import "server-only";
import { and, count, eq, gte, inArray, isNotNull, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { agentRuns, aiUsage, conversations, events, mrrSnapshots, salonDailyStats, salons, supportTickets } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { amsterdamDayWindow } from "@/lib/admin/day-window";

type Row = Omit<typeof salonDailyStats.$inferInsert, "updatedAt">;

const METRICS = [
  "conversations",
  "callsHandled",
  "voiceSeconds",
  "bookings",
  "escalations",
  "aiCalls",
  "aiInputTokens",
  "aiOutputTokens",
  "aiCostMicroEur",
  "ticketsOpened",
  "logins",
] as const;
type Metric = (typeof METRICS)[number];

/**
 * Roll one Amsterdam day up into salon_daily_stats. Idempotent (upsert on
 * salon+day), so re-running a day — or backfilling a range — is safe.
 * Only salons with any activity that day get a row; absent = all zeros.
 */
export async function rollupSalonDay(day: string): Promise<{ day: string; salons: number }> {
  if (!env.DATABASE_URL) return { day, salons: 0 };
  const { start, end } = amsterdamDayWindow(day);

  const [convRows, eventRows, escRows, aiRows, ticketRows] = await Promise.all([
    db
      .select({ salonId: conversations.salonId, c: count() })
      .from(conversations)
      .where(and(gte(conversations.createdAt, start), lt(conversations.createdAt, end)))
      .groupBy(conversations.salonId),
    db
      .select({ salonId: events.salonId, type: events.type, c: count() })
      .from(events)
      .where(
        and(
          gte(events.createdAt, start),
          lt(events.createdAt, end),
          isNotNull(events.salonId),
          inArray(events.type, ["call_handled", "booking_made", "login"]),
        ),
      )
      .groupBy(events.salonId, events.type),
    db
      .select({ salonId: agentRuns.salonId, c: count() })
      .from(agentRuns)
      .where(and(gte(agentRuns.createdAt, start), lt(agentRuns.createdAt, end), eq(agentRuns.escalated, true)))
      .groupBy(agentRuns.salonId),
    db
      .select({
        salonId: aiUsage.salonId,
        calls: sql<number>`count(*) filter (where ${aiUsage.kind} = 'llm')`,
        input: sql<number>`coalesce(sum(${aiUsage.inputTokens}), 0)`,
        output: sql<number>`coalesce(sum(${aiUsage.outputTokens}), 0)`,
        voice: sql<number>`coalesce(sum(${aiUsage.voiceSeconds}), 0)`,
        cost: sql<number>`coalesce(sum(${aiUsage.costMicroEur}), 0)`,
      })
      .from(aiUsage)
      .where(and(gte(aiUsage.createdAt, start), lt(aiUsage.createdAt, end), isNotNull(aiUsage.salonId)))
      .groupBy(aiUsage.salonId),
    db
      .select({ salonId: supportTickets.salonId, c: count() })
      .from(supportTickets)
      .where(and(gte(supportTickets.createdAt, start), lt(supportTickets.createdAt, end), isNotNull(supportTickets.salonId)))
      .groupBy(supportTickets.salonId),
  ]);

  const bySalon = new Map<string, Row>();
  const bump = (salonId: string | null, metric: Metric, value: number) => {
    if (!salonId || !value) return;
    let row = bySalon.get(salonId);
    if (!row) {
      row = { salonId, day };
      bySalon.set(salonId, row);
    }
    row[metric] = (row[metric] ?? 0) + Number(value);
  };

  for (const r of convRows) bump(r.salonId, "conversations", r.c);
  for (const r of eventRows) {
    if (r.type === "call_handled") bump(r.salonId, "callsHandled", r.c);
    else if (r.type === "booking_made") bump(r.salonId, "bookings", r.c);
    else if (r.type === "login") bump(r.salonId, "logins", r.c);
  }
  for (const r of escRows) bump(r.salonId, "escalations", r.c);
  for (const r of aiRows) {
    bump(r.salonId, "aiCalls", r.calls);
    bump(r.salonId, "aiInputTokens", r.input);
    bump(r.salonId, "aiOutputTokens", r.output);
    bump(r.salonId, "voiceSeconds", r.voice);
    bump(r.salonId, "aiCostMicroEur", r.cost);
  }
  for (const r of ticketRows) bump(r.salonId, "ticketsOpened", r.c);

  const rows = [...bySalon.values()].map((r) => ({
    ...Object.fromEntries(METRICS.map((m) => [m, r[m] ?? 0])),
    salonId: r.salonId,
    day,
  })) as Row[];

  if (rows.length) {
    await db
      .insert(salonDailyStats)
      .values(rows)
      .onConflictDoUpdate({
        target: [salonDailyStats.salonId, salonDailyStats.day],
        set: {
          ...Object.fromEntries(METRICS.map((m) => [m, sql.raw(`excluded.${toColumn(m)}`)])),
          updatedAt: new Date(),
        },
      });
  }
  return { day, salons: rows.length };
}

function toColumn(metric: Metric): string {
  return metric.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/**
 * Copy every salon's current MRR/plan/status under `day`. salons.mrr only
 * holds "now", so this must run for the day that just ended — a backfill
 * can't reconstruct past MRR and therefore never calls it.
 */
export async function snapshotMrr(day: string): Promise<number> {
  if (!env.DATABASE_URL) return 0;
  const rows = await db.select({ salonId: salons.id, mrrCents: salons.mrr, plan: salons.plan, status: salons.status }).from(salons);
  if (!rows.length) return 0;
  await db
    .insert(mrrSnapshots)
    .values(rows.map((r) => ({ ...r, day })))
    .onConflictDoUpdate({
      target: [mrrSnapshots.salonId, mrrSnapshots.day],
      set: { mrrCents: sql`excluded.mrr_cents`, plan: sql`excluded.plan`, status: sql`excluded.status` },
    });
  return rows.length;
}
