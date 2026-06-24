import "server-only";
import { and, gte, lte, count, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads, events, salons } from "@/lib/db/schema";
import { complete } from "@/lib/ai/anthropic";
import { reports } from "@/lib/db/schema";
import { env } from "@/lib/env";

export type ReportPeriod = "daily" | "monthly";

export interface ReportPayload {
  period: ReportPeriod;
  periodKey: string;
  range: { from: string; to: string };
  newLeads: number;
  scans: number;
  pipelineValue: number; // euro/month, all open leads
  newSalons: number;
  activeMrr: number; // euro
  eventsByType: Record<string, number>;
}

function rangeFor(period: ReportPeriod, now: Date): { from: Date; to: Date; key: string } {
  const to = now;
  if (period === "monthly") {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const key = now.toISOString().slice(0, 7); // YYYY-MM
    return { from, to, key };
  }
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const key = now.toISOString().slice(0, 10); // YYYY-MM-DD
  return { from, to, key };
}

export async function aggregateReport(
  period: ReportPeriod,
  now: Date = new Date(),
): Promise<ReportPayload> {
  const { from, to, key } = rangeFor(period, now);
  const inRange = and(gte(events.createdAt, from), lte(events.createdAt, to));

  const [leadRows, scanRows, pipelineRows, salonRows, mrrRows, eventRows] = await Promise.all([
    db
      .select({ c: count() })
      .from(leads)
      .where(and(gte(leads.createdAt, from), lte(leads.createdAt, to))),
    db
      .select({ c: count() })
      .from(events)
      .where(and(inRange, sql`${events.type} = 'scan_completed'`)),
    db
      .select({ total: sql<number>`coalesce(sum(${leads.missedRevenueEstimate}), 0)` })
      .from(leads),
    db
      .select({ c: count() })
      .from(salons)
      .where(and(gte(salons.createdAt, from), lte(salons.createdAt, to))),
    db
      .select({ total: sql<number>`coalesce(sum(case when ${salons.status} = 'active' then ${salons.mrr} else 0 end), 0)` })
      .from(salons),
    db
      .select({ type: events.type, c: count() })
      .from(events)
      .where(inRange)
      .groupBy(events.type),
  ]);

  const eventsByType: Record<string, number> = {};
  for (const r of eventRows) eventsByType[r.type] = Number(r.c);

  return {
    period,
    periodKey: key,
    range: { from: from.toISOString(), to: to.toISOString() },
    newLeads: Number(leadRows[0]?.c ?? 0),
    scans: Number(scanRows[0]?.c ?? 0),
    pipelineValue: Number(pipelineRows[0]?.total ?? 0),
    newSalons: Number(salonRows[0]?.c ?? 0),
    activeMrr: Math.round(Number(mrrRows[0]?.total ?? 0) / 100),
    eventsByType,
  };
}

async function summarize(payload: ReportPayload): Promise<string> {
  const fallback = `${payload.period === "daily" ? "Dagrapport" : "Maandrapport"} ${payload.periodKey}: ${payload.newLeads} nieuwe leads, ${payload.scans} scans, ${payload.newSalons} nieuwe salons. Actieve MRR: €${payload.activeMrr}.`;
  const ai = await complete({
    model: env.ANTHROPIC_MODEL_FAST,
    maxTokens: 300,
    system:
      "Je bent een data-analist voor een SaaS-startup voor kapsalons. Schrijf een bondige, zakelijke samenvatting in het Nederlands (max 4 zinnen). Benoem trends en 1 concrete actie.",
    prompt: `Periode: ${payload.period} ${payload.periodKey}.
Nieuwe leads: ${payload.newLeads}
Scans: ${payload.scans}
Nieuwe salons: ${payload.newSalons}
Actieve MRR: €${payload.activeMrr}
Open pipeline (gemist/maand): €${payload.pipelineValue}
Events: ${JSON.stringify(payload.eventsByType)}`,
  });
  return ai?.trim() || fallback;
}

export interface StoredReport {
  payload: ReportPayload;
  summary: string;
}

/** Aggregate, summarize, and persist a report. */
export async function buildAndStoreReport(
  period: ReportPeriod,
  now: Date = new Date(),
): Promise<StoredReport> {
  const payload = await aggregateReport(period, now);
  const summary = await summarize(payload);

  if (env.DATABASE_URL) {
    await db.insert(reports).values({
      period,
      periodKey: payload.periodKey,
      payload: payload as unknown as Record<string, unknown>,
      summary,
    });
  }

  return { payload, summary };
}
