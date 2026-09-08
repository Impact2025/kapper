import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { salons } from "@/lib/db/schema";

const PLAN_ORDER = { essential: 0, pro: 1, elite: 2 } as const;
export type Plan = keyof typeof PLAN_ORDER;

export function salonHasPlan(plan: string, minimum: Plan): boolean {
  return (PLAN_ORDER[plan as Plan] ?? -1) >= PLAN_ORDER[minimum];
}

/** Fetch just a salon's plan — cheap check used to gate Pro-only features. */
export async function getSalonPlan(salonId: string): Promise<Plan> {
  const [salon] = await db
    .select({ plan: salons.plan })
    .from(salons)
    .where(eq(salons.id, salonId))
    .limit(1);
  return (salon?.plan ?? "essential") as Plan;
}
