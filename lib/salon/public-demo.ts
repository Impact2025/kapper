import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { salons } from "@/lib/db/schema";

/**
 * Public sales-demo chat only ever runs against a salon that has explicitly
 * opted in via settings.publicDemo — never resolvable by guessing a real
 * customer's slug. A real customer's AI receptionist and data must never
 * be reachable by an unauthenticated visitor.
 */
export async function getPublicDemoSalon(slug: string): Promise<typeof salons.$inferSelect | null> {
  const [row] = await db
    .select()
    .from(salons)
    .where(and(eq(salons.slug, slug), eq(salons.status, "active")))
    .limit(1);
  if (!row) return null;
  const publicDemo = (row.settings as Record<string, unknown>).publicDemo;
  return publicDemo === true ? row : null;
}
