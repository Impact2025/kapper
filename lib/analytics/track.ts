import "server-only";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { env } from "@/lib/env";

export interface TrackInput {
  type: string;
  props?: Record<string, unknown>;
  salonId?: string | null;
  /** Idempotency key for external (e.g. n8n) webhook events. */
  dedupeKey?: string;
}

/**
 * Record an analytics event. Best-effort and non-throwing: analytics must never
 * break a user-facing request. Duplicate `dedupeKey`s are silently ignored.
 */
export async function trackEvent(input: TrackInput): Promise<void> {
  if (!env.DATABASE_URL) return;
  try {
    await db
      .insert(events)
      .values({
        type: input.type,
        props: input.props ?? {},
        salonId: input.salonId ?? null,
        dedupeKey: input.dedupeKey ?? null,
      })
      .onConflictDoNothing({ target: events.dedupeKey });
  } catch (e) {
    console.error("[analytics] track failed:", e);
  }
}
