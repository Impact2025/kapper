import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { salons, subscriptions } from "@/lib/db/schema";
import { env } from "@/lib/env";

export interface SalonBilling {
  id: string;
  name: string;
  plan: "essential" | "pro" | "elite";
  status: "trial" | "active" | "past_due" | "canceled";
  mrr: number; // euro cents
  city: string | null;
  subStatus: string | null;
  currentPeriodEnd: Date | null;
  createdAt: Date;
}

export async function listSalonBilling(): Promise<SalonBilling[]> {
  if (!env.DATABASE_URL) return [];
  return db
    .select({
      id: salons.id,
      name: salons.name,
      plan: salons.plan,
      status: salons.status,
      mrr: salons.mrr,
      city: salons.city,
      subStatus: subscriptions.status,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      createdAt: salons.createdAt,
    })
    .from(salons)
    .leftJoin(subscriptions, eq(subscriptions.salonId, salons.id))
    .orderBy(desc(salons.createdAt));
}

export interface BillingTotals {
  mrr: number; // euro
  arr: number; // euro
  activeCount: number;
  trialCount: number;
  pastDueCount: number;
}

export async function getBillingTotals(): Promise<BillingTotals> {
  if (!env.DATABASE_URL) {
    return { mrr: 0, arr: 0, activeCount: 0, trialCount: 0, pastDueCount: 0 };
  }
  const [row] = await db
    .select({
      mrr: sql<number>`coalesce(sum(case when ${salons.status} = 'active' then ${salons.mrr} else 0 end), 0)`,
      activeCount: sql<number>`count(*) filter (where ${salons.status} = 'active')`,
      trialCount: sql<number>`count(*) filter (where ${salons.status} = 'trial')`,
      pastDueCount: sql<number>`count(*) filter (where ${salons.status} = 'past_due')`,
    })
    .from(salons);

  const mrrEuro = Math.round(Number(row?.mrr ?? 0) / 100);
  return {
    mrr: mrrEuro,
    arr: mrrEuro * 12,
    activeCount: Number(row?.activeCount ?? 0),
    trialCount: Number(row?.trialCount ?? 0),
    pastDueCount: Number(row?.pastDueCount ?? 0),
  };
}
