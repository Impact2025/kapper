import "server-only";
import { and, gte, lte, count, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads, events, salons } from "@/lib/db/schema";
import { complete } from "@/lib/ai/anthropic";
import { reports } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { listCustomers, type CustomerRow } from "@/lib/admin/customers";
import { getUsageWindows } from "@/lib/admin/usage";
import { detectAnomalies } from "@/lib/admin/anomalies";
import type { HealthBand } from "@/lib/admin/health";
import { getVerticalConfig } from "@/lib/verticals";

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
  /** Cockpit section (added with Rapporten 2.0 — absent on older stored reports). */
  platform?: PlatformSection;
}

export interface ReportSegment {
  key: string;
  label: string;
  customers: number;
  mrrEur: number;
  aiCostEur: number;
}

export interface PlatformSection {
  aiCostEur30d: number;
  /** 1 − AI cost / MRR over 30 days, %. */
  aiMarginPct: number | null;
  health: Record<HealthBand, number>;
  byVertical: ReportSegment[];
  byPlan: ReportSegment[];
  anomalies: { salonId: string; name: string; message: string }[];
}

function segment(customers: CustomerRow[], keyOf: (c: CustomerRow) => string, labelOf: (key: string) => string): ReportSegment[] {
  const map = new Map<string, ReportSegment>();
  for (const c of customers) {
    if (c.status === "canceled") continue;
    const key = keyOf(c);
    const seg = map.get(key) ?? { key, label: labelOf(key), customers: 0, mrrEur: 0, aiCostEur: 0 };
    seg.customers++;
    seg.mrrEur += c.status === "active" ? c.mrrCents / 100 : 0;
    seg.aiCostEur += c.aiCostMicroEur30d / 1_000_000;
    map.set(key, seg);
  }
  return [...map.values()].sort((a, b) => b.mrrEur - a.mrrEur);
}

async function aggregatePlatform(withAnomalies: boolean): Promise<PlatformSection> {
  const [customers, windows] = await Promise.all([listCustomers(), withAnomalies ? getUsageWindows() : Promise.resolve([])]);
  const health: Record<HealthBand, number> = { gezond: 0, aandacht: 0, risico: 0, opgezegd: 0 };
  for (const c of customers) health[c.health.band]++;
  const mrrEur = customers.reduce((sum, c) => sum + (c.status === "active" ? c.mrrCents / 100 : 0), 0);
  const aiCostEur30d = customers.reduce((sum, c) => sum + c.aiCostMicroEur30d / 1_000_000, 0);
  return {
    aiCostEur30d: Math.round(aiCostEur30d * 100) / 100,
    aiMarginPct: mrrEur > 0 ? Math.round((1 - aiCostEur30d / mrrEur) * 1000) / 10 : null,
    health,
    byVertical: segment(customers, (c) => c.vertical, (k) => getVerticalConfig(k).label),
    byPlan: segment(customers, (c) => c.plan, (k) => k.charAt(0).toUpperCase() + k.slice(1)),
    anomalies: detectAnomalies(windows).map(({ salonId, name, message }) => ({ salonId, name, message })),
  };
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
  // Anomalies compare the last 24h to a baseline — only meaningful for the daily report.
  const platform = await aggregatePlatform(period === "daily");

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
    platform,
  };
}

async function summarize(payload: ReportPayload): Promise<string> {
  const fallback = `${payload.period === "daily" ? "Dagrapport" : "Maandrapport"} ${payload.periodKey}: ${payload.newLeads} nieuwe leads, ${payload.scans} scans, ${payload.newSalons} nieuwe salons. Actieve MRR: €${payload.activeMrr}.`;
  const ai = await complete({
    feature: "report",
    model: env.OPENMODEL_MODEL,
    maxTokens: 300,
    system:
      "Je bent een data-analist voor een SaaS-platform voor vakbedrijven (kapsalons, loodgieters, schilders, hoveniers). Schrijf een bondige, zakelijke samenvatting in het Nederlands (max 5 zinnen). Benoem trends, noem afwijkingen of klanten met risico als die er zijn, en sluit af met 1 concrete actie.",
    prompt: `Periode: ${payload.period} ${payload.periodKey}.
Nieuwe leads: ${payload.newLeads}
Scans: ${payload.scans}
Nieuwe salons: ${payload.newSalons}
Actieve MRR: €${payload.activeMrr}
Open pipeline (gemist/maand): €${payload.pipelineValue}
Events: ${JSON.stringify(payload.eventsByType)}${platformPrompt(payload.platform)}`,
  });
  return ai?.trim() || fallback;
}

function platformPrompt(p: PlatformSection | undefined): string {
  if (!p) return "";
  const seg = (s: ReportSegment[]) => s.map((x) => `${x.label}: ${x.customers} klanten, MRR €${Math.round(x.mrrEur)}, AI €${x.aiCostEur.toFixed(2)}`).join("; ");
  return `
AI-kosten 30d: €${p.aiCostEur30d} (AI-marge ${p.aiMarginPct ?? "n.v.t."}%)
Klantgezondheid: ${p.health.gezond} gezond, ${p.health.aandacht} aandacht, ${p.health.risico} risico, ${p.health.opgezegd} opgezegd
Per vak: ${seg(p.byVertical) || "—"}
Per plan: ${seg(p.byPlan) || "—"}
Afwijkingen: ${p.anomalies.map((a) => `${a.name}: ${a.message}`).join("; ") || "geen"}`;
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
