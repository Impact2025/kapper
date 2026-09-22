import "server-only";
import { Client } from "@upstash/qstash";
import { env, publicEnv } from "@/lib/env";
import { captureError } from "@/lib/observability";

/** Fase 4 message-buffering: true only when QStash is actually configured —
 * every call site must degrade to immediate processing when this is false,
 * never treat QStash as a hard dependency. */
export function isQstashConfigured(): boolean {
  return Boolean(env.QSTASH_TOKEN);
}

let client: Client | null = null;
function getClient(): Client | null {
  if (!env.QSTASH_TOKEN) return null;
  if (!client) client = new Client({ token: env.QSTASH_TOKEN });
  return client;
}

/**
 * Schedule a delayed POST to one of our own API routes. Used for WhatsApp
 * message-debouncing (Fase 4) — Vercel functions aren't long-lived, so
 * "wait 6s for more messages, then reply once" needs an external delayed-job
 * primitive rather than an in-process timer.
 */
export async function scheduleDelayedCall(
  path: string,
  body: Record<string, unknown>,
  delaySeconds: number,
): Promise<void> {
  const qstash = getClient();
  if (!qstash) return; // not configured — caller already handled the sync fallback
  try {
    await qstash.publishJSON({
      url: `${publicEnv.NEXT_PUBLIC_SITE_URL}${path}`,
      body,
      delay: delaySeconds,
    });
  } catch (err) {
    captureError("qstash/schedule-delayed-call", err);
  }
}
