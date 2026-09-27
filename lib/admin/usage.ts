import "server-only";
import { and, desc, eq, gte, inArray, isNotNull, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { aiUsage, conversations, salons } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { previousDays } from "@/lib/admin/day-window";
import type { UsageWindow } from "@/lib/admin/anomalies";

export interface UsageTotals {
  calls: number;
  inputTokens: number;
  outputTokens: number;
  voiceSeconds: number;
  costMicroEur: number;
  unpricedCalls: number;
}

export interface SalonUsageRow {
  salonId: string;
  name: string;
  plan: string;
  vertical: string;
  status: string;
  mrrCents: number;
  calls: number;
  tokens: number;
  voiceSeconds: number;
  costMicroEur: number;
}

export interface FeatureUsageRow {
  feature: string;
  calls: number;
  tokens: number;
  costMicroEur: number;
  avgLatencyMs: number | null;
}

export interface DailyUsagePoint {
  day: string;
  calls: number;
  costMicroEur: number;
}

export interface UsageOverview {
  days: number;
  totals: UsageTotals;
  bySalon: SalonUsageRow[];
  byFeature: FeatureUsageRow[];
  daily: DailyUsagePoint[];
  platformCostMicroEur: number; // calls without a salon (blog, scans, reports, prospect chat)
}

const EMPTY_TOTALS: UsageTotals = { calls: 0, inputTokens: 0, outputTokens: 0, voiceSeconds: 0, costMicroEur: 0, unpricedCalls: 0 };

/** Everything the "AI-verbruik & marge" page needs for the last `days` days. */
export async function getUsageOverview(days = 30): Promise<UsageOverview> {
  const dayKeys = previousDays(new Date(Date.now() + 86_400_000), days); // includes today
  if (!env.DATABASE_URL) {
    return { days, totals: EMPTY_TOTALS, bySalon: [], byFeature: [], daily: dayKeys.map((day) => ({ day, calls: 0, costMicroEur: 0 })), platformCostMicroEur: 0 };
  }
  const since = new Date(Date.now() - days * 86_400_000);
  const n = (v: unknown) => Number(v ?? 0);
  const localDay = sql<string>`to_char(${aiUsage.createdAt} at time zone 'Europe/Amsterdam', 'YYYY-MM-DD')`;

  const [totalRows, salonRows, featureRows, dailyRows] = await Promise.all([
    db
      .select({
        calls: sql<number>`count(*)`,
        input: sql<number>`coalesce(sum(${aiUsage.inputTokens}), 0)`,
        output: sql<number>`coalesce(sum(${aiUsage.outputTokens}), 0)`,
        voice: sql<number>`coalesce(sum(${aiUsage.voiceSeconds}), 0)`,
        cost: sql<number>`coalesce(sum(${aiUsage.costMicroEur}), 0)`,
        unpriced: sql<number>`count(*) filter (where ${aiUsage.costMicroEur} is null)`,
        platform: sql<number>`coalesce(sum(${aiUsage.costMicroEur}) filter (where ${aiUsage.salonId} is null), 0)`,
      })
      .from(aiUsage)
      .where(gte(aiUsage.createdAt, since)),
    db
      .select({
        salonId: salons.id,
        name: salons.name,
        plan: salons.plan,
        vertical: salons.vertical,
        status: salons.status,
        mrr: salons.mrr,
        calls: sql<number>`count(*)`,
        tokens: sql<number>`coalesce(sum(${aiUsage.inputTokens} + ${aiUsage.outputTokens}), 0)`,
        voice: sql<number>`coalesce(sum(${aiUsage.voiceSeconds}), 0)`,
        cost: sql<number>`coalesce(sum(${aiUsage.costMicroEur}), 0)`,
      })
      .from(aiUsage)
      .innerJoin(salons, eq(salons.id, aiUsage.salonId))
      .where(gte(aiUsage.createdAt, since))
      .groupBy(salons.id)
      .orderBy(desc(sql`coalesce(sum(${aiUsage.costMicroEur}), 0)`), desc(sql`count(*)`))
      .limit(100),
    db
      .select({
        feature: aiUsage.feature,
        calls: sql<number>`count(*)`,
        tokens: sql<number>`coalesce(sum(${aiUsage.inputTokens} + ${aiUsage.outputTokens}), 0)`,
        cost: sql<number>`coalesce(sum(${aiUsage.costMicroEur}), 0)`,
        latency: sql<number | null>`avg(${aiUsage.latencyMs})`,
      })
      .from(aiUsage)
      .where(gte(aiUsage.createdAt, since))
      .groupBy(aiUsage.feature)
      .orderBy(desc(sql`count(*)`)),
    db
      .select({ day: localDay, calls: sql<number>`count(*)`, cost: sql<number>`coalesce(sum(${aiUsage.costMicroEur}), 0)` })
      .from(aiUsage)
      .where(gte(aiUsage.createdAt, since))
      .groupBy(localDay),
  ]);

  const t = totalRows[0];
  const dailyMap = new Map(dailyRows.map((r) => [r.day, r]));

  return {
    days,
    totals: {
      calls: n(t?.calls),
      inputTokens: n(t?.input),
      outputTokens: n(t?.output),
      voiceSeconds: n(t?.voice),
      costMicroEur: n(t?.cost),
      unpricedCalls: n(t?.unpriced),
    },
    platformCostMicroEur: n(t?.platform),
    bySalon: salonRows.map((r) => ({
      salonId: r.salonId,
      name: r.name,
      plan: r.plan,
      vertical: r.vertical,
      status: r.status,
      mrrCents: n(r.mrr),
      calls: n(r.calls),
      tokens: n(r.tokens),
      voiceSeconds: n(r.voice),
      costMicroEur: n(r.cost),
    })),
    byFeature: featureRows.map((r) => ({
      feature: r.feature,
      calls: n(r.calls),
      tokens: n(r.tokens),
      costMicroEur: n(r.cost),
      avgLatencyMs: r.latency == null ? null : Math.round(Number(r.latency)),
    })),
    daily: dayKeys.map((day) => ({ day, calls: n(dailyMap.get(day)?.calls), costMicroEur: n(dailyMap.get(day)?.cost) })),
  };
}

/**
 * Per-salon usage for anomaly detection: the last 24h against the daily
 * average of the 14 days before it (lib/admin/anomalies.ts).
 */
export async function getUsageWindows(now = new Date()): Promise<UsageWindow[]> {
  if (!env.DATABASE_URL) return [];
  const DAY = 86_400_000;
  const recentStart = new Date(now.getTime() - DAY).toISOString();
  const baselineStart = new Date(now.getTime() - 15 * DAY);

  const [tokenRows, convRows] = await Promise.all([
    db
      .select({
        salonId: aiUsage.salonId,
        recent: sql<number>`coalesce(sum(${aiUsage.inputTokens} + ${aiUsage.outputTokens}) filter (where ${aiUsage.createdAt} >= ${recentStart}), 0)`,
        prior: sql<number>`coalesce(sum(${aiUsage.inputTokens} + ${aiUsage.outputTokens}) filter (where ${aiUsage.createdAt} < ${recentStart}), 0)`,
      })
      .from(aiUsage)
      .where(and(gte(aiUsage.createdAt, baselineStart), isNotNull(aiUsage.salonId)))
      .groupBy(aiUsage.salonId),
    db
      .select({
        salonId: conversations.salonId,
        recent: sql<number>`count(*) filter (where ${conversations.createdAt} >= ${recentStart})`,
        prior: sql<number>`count(*) filter (where ${conversations.createdAt} < ${recentStart})`,
      })
      .from(conversations)
      .where(gte(conversations.createdAt, baselineStart))
      .groupBy(conversations.salonId),
  ]);

  const ids = [...new Set([...tokenRows, ...convRows].map((r) => r.salonId).filter((id): id is string => !!id))];
  if (!ids.length) return [];
  const names = new Map(
    (await db.select({ id: salons.id, name: salons.name }).from(salons).where(and(inArray(salons.id, ids), ne(salons.status, "canceled")))).map((s) => [s.id, s.name]),
  );
  const tokens = new Map(tokenRows.map((r) => [r.salonId, r]));
  const convs = new Map(convRows.map((r) => [r.salonId, r]));

  return ids
    .filter((id) => names.has(id))
    .map((id) => ({
      salonId: id,
      name: names.get(id)!,
      recentTokens: Number(tokens.get(id)?.recent ?? 0),
      baselineDailyTokens: Number(tokens.get(id)?.prior ?? 0) / 14,
      recentConversations: Number(convs.get(id)?.recent ?? 0),
      baselineDailyConversations: Number(convs.get(id)?.prior ?? 0) / 14,
    }));
}
