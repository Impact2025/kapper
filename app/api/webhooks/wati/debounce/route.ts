import { NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { salons, conversations, messages } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { decrypt } from "@/lib/crypto";
import { captureError } from "@/lib/observability";
import { resolveWatiCredentials, processWatiTurn, isDebounceQuiet } from "@/lib/ai/wati-turn";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Must match app/api/webhooks/wati/route.ts's DEBOUNCE_SECONDS. A small
 * safety margin below the full delay accounts for QStash's own scheduling
 * jitter — without it a legitimately-quiet burst could be skipped by every
 * job that fires a few hundred ms early. */
const DEBOUNCE_MS = 6_000;
const JITTER_SLACK_MS = 1_500;

async function verifyQstashSignature(req: Request, bodyText: string): Promise<boolean> {
  if (!env.QSTASH_CURRENT_SIGNING_KEY || !env.QSTASH_NEXT_SIGNING_KEY) {
    // Not configured for verification — QSTASH_TOKEN alone is enough to
    // *send*, but without signing keys we can't verify the sender. Accept
    // rather than hard-fail (matches this codebase's degrade-gracefully
    // pattern), but this should be tightened once signing keys are set.
    return true;
  }
  const signature = req.headers.get("upstash-signature");
  if (!signature) return false;
  const receiver = new Receiver({
    currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
  });
  try {
    return await receiver.verify({ signature, body: bodyText });
  } catch {
    return false;
  }
}

/**
 * Fase 4 message-buffering: the delayed re-trigger scheduled by the WATI
 * webhook (lib/queue/qstash.ts). Several of these can be in flight for the
 * same conversation at once (one per burst message) — only the one whose
 * message is still the newest after the full debounce window actually
 * replies; the others are safe no-ops, since whichever message turns out to
 * be last will get its own job that does the replying.
 */
export async function POST(req: Request) {
  const bodyText = await req.text();
  if (!(await verifyQstashSignature(req, bodyText))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { conversationId?: string };
  try {
    body = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const conversationId = body.conversationId;
  if (!conversationId) return NextResponse.json({ error: "conversationId required" }, { status: 400 });

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1);
  if (!conv || conv.channel !== "whatsapp" || conv.status !== "active" || !conv.phoneNumber) {
    return NextResponse.json({ ok: true, skipped: "conversation not active" });
  }

  const [latest] = await db
    .select({ role: messages.role, createdAt: messages.createdAt })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(1);

  if (!latest || latest.role !== "user") {
    // No messages, or the newest one is already an assistant reply — an
    // earlier-scheduled job (or the immediate path) already handled this.
    return NextResponse.json({ ok: true, skipped: "already answered" });
  }

  if (!isDebounceQuiet(latest.createdAt, DEBOUNCE_MS, JITTER_SLACK_MS)) {
    // A newer message landed after this job was scheduled — its own
    // later-firing job will do the replying instead.
    return NextResponse.json({ ok: true, skipped: "newer message pending" });
  }

  const [salon] = await db.select().from(salons).where(eq(salons.id, conv.salonId)).limit(1);
  if (!salon) return NextResponse.json({ ok: true, skipped: "salon not found" });

  const credentials = resolveWatiCredentials(salon, env.WATI_API_KEY, env.WATI_BASE_URL, decrypt);
  if (!credentials) return NextResponse.json({ ok: true, skipped: "WATI not configured" });

  try {
    await processWatiTurn({
      salon,
      conversationId,
      fromPhone: conv.phoneNumber,
      watiApiKey: credentials.watiApiKey,
      watiBaseUrl: credentials.watiBaseUrl,
    });
  } catch (err) {
    captureError("wati/debounce-process", err);
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, processed: true });
}
