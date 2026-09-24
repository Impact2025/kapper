import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { salonCounters } from "@/lib/db/schema-jobs";
import { amsterdamDateKey } from "@/lib/salon/timezone";
import { formatNumber } from "@/lib/jobs/model";

/**
 * Gapless per-salon, per-year numbers (K-/O-/F-). One atomic
 * INSERT … ON CONFLICT DO UPDATE … RETURNING, so two concurrent requests can
 * never draw the same number — required for factuurnummers, and the Neon HTTP
 * driver has no multi-statement transactions to lean on instead.
 */
export async function nextNumber(
  salonId: string,
  key: "job" | "quote" | "invoice",
  now: Date = new Date(),
): Promise<string> {
  const year = Number(amsterdamDateKey(now).slice(0, 4));
  const [row] = await db
    .insert(salonCounters)
    .values({ salonId, key, year, value: 1 })
    .onConflictDoUpdate({
      target: [salonCounters.salonId, salonCounters.key, salonCounters.year],
      set: { value: sql`${salonCounters.value} + 1` },
    })
    .returning({ value: salonCounters.value });
  return formatNumber(key, year, row!.value);
}
