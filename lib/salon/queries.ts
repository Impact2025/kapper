import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { salons, subscriptions } from "@/lib/db/schema";
import { env } from "@/lib/env";

export interface SalonWithSubscription {
  id: string;
  name: string;
  slug: string;
  plan: "essential" | "pro" | "elite";
  status: "trial" | "active" | "past_due" | "canceled";
  mrr: number;
  agendaProvider: string | null;
  city: string | null;
  phone: string | null;
  settings: Record<string, unknown>;
  stripeCustomerId: string | null;
  stripeSubId: string | null;
  currentPeriodEnd: Date | null;
  createdAt: Date;
}

export async function getSalonWithSubscription(
  salonId: string,
): Promise<SalonWithSubscription | null> {
  if (!env.DATABASE_URL) return null;
  const rows = await db
    .select({
      id: salons.id,
      name: salons.name,
      slug: salons.slug,
      plan: salons.plan,
      status: salons.status,
      mrr: salons.mrr,
      agendaProvider: salons.agendaProvider,
      city: salons.city,
      phone: salons.phone,
      settings: salons.settings,
      stripeCustomerId: subscriptions.stripeCustomerId,
      stripeSubId: subscriptions.stripeSubId,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      createdAt: salons.createdAt,
    })
    .from(salons)
    .leftJoin(subscriptions, eq(subscriptions.salonId, salons.id))
    .where(eq(salons.id, salonId))
    .limit(1);
  return rows[0] ?? null;
}
