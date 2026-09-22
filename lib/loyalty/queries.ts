import "server-only";
import { eq, desc, and, sql, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers, loyaltyMutations } from "@/lib/db/schema";

/** 1 loyaliteitspunt per €10 besteed — eenvoudig puntensysteem (Fase 5,
 * Elite-only). Afgerond naar beneden zodat een sale onder €10 geen punt geeft. */
const CENTS_PER_POINT = 1_000;

export interface LoyaltyMutation {
  id: string;
  delta: number;
  reason: string;
  createdAt: Date;
}

/**
 * Award points for a paid amount and log the mutation. Never throws on a
 * zero-point award (e.g. a sale under €10) — just a no-op, same
 * degrade-gracefully spirit as the rest of this codebase's optional flows.
 */
export async function awardLoyaltyPoints(input: {
  salonId: string;
  customerId: string;
  amountCents: number;
  reason: string;
  orderId?: string | null;
}): Promise<void> {
  const points = Math.floor(input.amountCents / CENTS_PER_POINT);
  if (points <= 0) return;

  await db.insert(loyaltyMutations).values({
    salonId: input.salonId,
    customerId: input.customerId,
    delta: points,
    reason: input.reason,
    orderId: input.orderId ?? null,
  });
  await db
    .update(customers)
    .set({ loyaltyPoints: sql`${customers.loyaltyPoints} + ${points}` })
    .where(eq(customers.id, input.customerId));
}

export async function listLoyaltyMutations(
  salonId: string,
  customerId: string,
  limit = 20,
): Promise<LoyaltyMutation[]> {
  return db
    .select({ id: loyaltyMutations.id, delta: loyaltyMutations.delta, reason: loyaltyMutations.reason, createdAt: loyaltyMutations.createdAt })
    .from(loyaltyMutations)
    .where(and(eq(loyaltyMutations.salonId, salonId), eq(loyaltyMutations.customerId, customerId)))
    .orderBy(desc(loyaltyMutations.createdAt))
    .limit(limit);
}

export interface TopLoyaltyCustomer {
  id: string;
  name: string;
  phone: string;
  loyaltyPoints: number;
}

/** For the /dashboard/retentie leaderboard — customers with at least one point. */
export async function listTopLoyaltyCustomers(salonId: string, limit = 10): Promise<TopLoyaltyCustomer[]> {
  return db
    .select({ id: customers.id, name: customers.name, phone: customers.phone, loyaltyPoints: customers.loyaltyPoints })
    .from(customers)
    .where(and(eq(customers.salonId, salonId), gt(customers.loyaltyPoints, 0)))
    .orderBy(desc(customers.loyaltyPoints))
    .limit(limit);
}
