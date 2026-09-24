import "server-only";
import { desc, eq, gte, ne, or, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { statusIncidents } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { captureError } from "@/lib/observability";
import { type ComponentState, type IncidentStatus, type Severity } from "@/lib/status/model";

export type IncidentRow = typeof statusIncidents.$inferSelect;

/** Incidents that are active or were resolved within `days` (public history). */
export async function listRecentIncidents(days = 30): Promise<IncidentRow[]> {
  if (!env.DATABASE_URL) return [];
  try {
    const since = new Date(Date.now() - days * 86_400_000);
    return await db
      .select()
      .from(statusIncidents)
      .where(or(ne(statusIncidents.status, "resolved"), gte(statusIncidents.startedAt, since), isNull(statusIncidents.resolvedAt)))
      .orderBy(desc(statusIncidents.startedAt))
      .limit(50);
  } catch (err) {
    captureError("status/list", err);
    return [];
  }
}

export async function listActiveIncidents(): Promise<IncidentRow[]> {
  return (await listRecentIncidents(1)).filter((i) => i.status !== "resolved");
}

export async function getIncident(id: string): Promise<IncidentRow | null> {
  if (!env.DATABASE_URL) return null;
  const [row] = await db.select().from(statusIncidents).where(eq(statusIncidents.id, id)).limit(1);
  return row ?? null;
}

export async function createIncident(input: {
  title: string;
  severity: Severity;
  components: string[];
  message: string;
  createdBy: string;
}): Promise<string> {
  const [row] = await db
    .insert(statusIncidents)
    .values({
      title: input.title,
      severity: input.severity,
      components: input.components,
      createdBy: input.createdBy,
      updates: [{ at: new Date().toISOString(), status: "investigating", message: input.message }],
    })
    .returning({ id: statusIncidents.id });
  return row!.id;
}

export async function addIncidentUpdate(id: string, status: IncidentStatus, message: string): Promise<boolean> {
  const incident = await getIncident(id);
  if (!incident) return false;
  const now = new Date();
  await db
    .update(statusIncidents)
    .set({
      status,
      resolvedAt: status === "resolved" ? now : null,
      updates: [...incident.updates, { at: now.toISOString(), status, message }],
    })
    .where(eq(statusIncidents.id, id));
  return true;
}

export interface ProbeResult {
  app: ComponentState;
  dbLatencyMs: number | null;
}

/** The only automatic check we can do honestly: can this app reach its own database? */
export async function probeSystem(): Promise<ProbeResult> {
  if (!env.DATABASE_URL) return { app: "operational", dbLatencyMs: null };
  const t0 = Date.now();
  try {
    await db.execute(sql`select 1`);
    const ms = Date.now() - t0;
    return { app: ms > 3000 ? "degraded" : "operational", dbLatencyMs: ms };
  } catch {
    return { app: "outage", dbLatencyMs: null };
  }
}
