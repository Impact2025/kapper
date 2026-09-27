import "server-only";
import { headers } from "next/headers";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminAuditLog } from "@/lib/db/schema";
import type { CurrentUser } from "@/lib/auth/dal";
import { env } from "@/lib/env";

export interface AuditTarget {
  type: string;
  id: string;
}

/**
 * Append one line to the admin audit log. Best-effort: a logging failure
 * must never undo or block the admin action it describes.
 */
export async function auditAdmin(
  actor: Pick<CurrentUser, "id" | "email">,
  action: string,
  target?: AuditTarget | null,
  meta: Record<string, unknown> = {},
): Promise<void> {
  if (!env.DATABASE_URL) return;
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
    await db.insert(adminAuditLog).values({
      actorId: actor.id,
      actorEmail: actor.email,
      action,
      targetType: target?.type ?? null,
      targetId: target?.id ?? null,
      meta,
      ip,
    });
  } catch (err) {
    console.error("[audit] insert failed:", err);
  }
}

export type AuditRow = typeof adminAuditLog.$inferSelect;

export async function listAuditLog(limit = 200): Promise<AuditRow[]> {
  if (!env.DATABASE_URL) return [];
  return db.select().from(adminAuditLog).orderBy(desc(adminAuditLog.createdAt)).limit(limit);
}
