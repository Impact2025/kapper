import "server-only";
import { sql, eq, gte, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads, salons, subscriptions, blogPosts, events } from "@/lib/db/schema";
import { env } from "@/lib/env";

export interface OverviewMetrics {
  totalLeads: number;
  newLeads: number;
  leadsByStage: Record<string, number>;
  pipelineRevenue: number; // sum of missed-revenue estimates (euro/month)
  activeSalons: number;
  mrr: number; // euro/month
  publishedPosts: number;
  eventsLast7d: number;
}

const EMPTY: OverviewMetrics = {
  totalLeads: 0,
  newLeads: 0,
  leadsByStage: {},
  pipelineRevenue: 0,
  activeSalons: 0,
  mrr: 0,
  publishedPosts: 0,
  eventsLast7d: 0,
};

export async function getOverviewMetrics(): Promise<OverviewMetrics> {
  if (!env.DATABASE_URL) return EMPTY;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    stageRows,
    pipeline,
    activeSalonRows,
    mrrRows,
    postRows,
    eventRows,
  ] = await Promise.all([
    db.select({ stage: leads.stage, c: count() }).from(leads).groupBy(leads.stage),
    db
      .select({ total: sql<number>`coalesce(sum(${leads.missedRevenueEstimate}), 0)` })
      .from(leads),
    db.select({ c: count() }).from(salons).where(eq(salons.status, "active")),
    db
      .select({ total: sql<number>`coalesce(sum(${salons.mrr}), 0)` })
      .from(salons)
      .where(eq(salons.status, "active")),
    db.select({ c: count() }).from(blogPosts).where(eq(blogPosts.status, "published")),
    db.select({ c: count() }).from(events).where(gte(events.createdAt, sevenDaysAgo)),
  ]);

  const leadsByStage: Record<string, number> = {};
  let totalLeads = 0;
  for (const row of stageRows) {
    leadsByStage[row.stage] = Number(row.c);
    totalLeads += Number(row.c);
  }

  // subscriptions table reserved for Stripe-synced detail; mrr derived from salons.
  void subscriptions;

  return {
    totalLeads,
    newLeads: leadsByStage["new"] ?? 0,
    leadsByStage,
    pipelineRevenue: Number(pipeline[0]?.total ?? 0),
    activeSalons: Number(activeSalonRows[0]?.c ?? 0),
    mrr: Math.round(Number(mrrRows[0]?.total ?? 0) / 100),
    publishedPosts: Number(postRows[0]?.c ?? 0),
    eventsLast7d: Number(eventRows[0]?.c ?? 0),
  };
}
