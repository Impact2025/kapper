import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { salons, conversations, messages } from "@/lib/db/schema";
import { confirmAppointment, pushBookingToAgenda } from "@/lib/salon/appointments";
import { amsterdamDateKey, amsterdamTimeKey } from "@/lib/salon/timezone";
import { trackEvent } from "@/lib/analytics/track";
import { env } from "@/lib/env";
import { decrypt } from "@/lib/crypto";
import { captureError } from "@/lib/observability";
import { sendWatiMessage } from "@/lib/salon/wati-client";
import { resolveWatiCredentials, processWatiTurn } from "@/lib/ai/wati-turn";
import { isQstashConfigured, scheduleDelayedCall } from "@/lib/queue/qstash";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Fase 4: seconds to wait for more messages before the AI replies once
 * (message-buffering/debouncing) — matches the approved fasenplan default. */
const DEBOUNCE_SECONDS = 6;

/** Re-exported for lib/billing/provision.ts (Stripe deposit webhook needs to
 * notify the customer once a deposit checkout completes). */
export { sendWatiMessage };

/** Verify WATI HMAC-SHA256 webhook signature. Exported for tests. */
export function verifyWatiSignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  return signature === expected;
}

/** Look up the salon whose WATI API key matches the inbound request. */
async function findSalonByWatiKey(rawKey: string): Promise<typeof salons.$inferSelect | null> {
  const rows = await db
    .select()
    .from(salons)
    .where(eq(salons.status, "active"))
    .limit(100);

  for (const salon of rows) {
    const ai = (salon.settings as Record<string, unknown>)?.ai as
      | Record<string, unknown>
      | undefined;
    if (!ai?.watiApiKey) continue;
    const storedKey = String(ai.watiApiKey);
    const decrypted = decrypt(storedKey) ?? storedKey; // support both encrypted and plain
    if (decrypted === rawKey) return salon;
  }
  return null;
}

export async function POST(req: Request) {
  const bodyText = await req.text();

  // WATI sends the webhook key as a query param or header
  const url = new URL(req.url);
  const webhookKey = url.searchParams.get("watiKey") ?? req.headers.get("x-wati-key") ?? "";
  const signature = req.headers.get("x-wati-signature");

  // Verify signature if global WATI key is set
  if (env.WATI_API_KEY) {
    if (!verifyWatiSignature(bodyText, signature, env.WATI_API_KEY)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Extract fields from WATI payload
  const event = String(body.event ?? body.type ?? "");
  if (!event.includes("message") && event !== "message_received") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const messageObj = (body.message ?? body) as Record<string, unknown>;
  const fromPhone = String(
    body.waId ?? body.from ?? messageObj.from ?? "",
  ).replace(/[^\d+]/g, "");

  // Middelburg-norm confirmation: the customer tapped "Akkoord & Bevestigen"
  // on the interactive booking message. Handle this before the plain-text
  // conversational flow below — a button reply carries no free-text body,
  // and it must never be debounced (it's a direct user action, not a
  // conversational message).
  const buttonReplyObj = (messageObj.button ?? messageObj.interactiveButtonReply ?? messageObj.buttonReply) as
    | Record<string, unknown>
    | undefined;
  const buttonReplyId = String(
    body.buttonReplyId ?? buttonReplyObj?.payload ?? buttonReplyObj?.id ?? "",
  );
  if (buttonReplyId.startsWith("confirm_booking_")) {
    const appointmentId = buttonReplyId.slice("confirm_booking_".length);
    const confirmed = await confirmAppointment(appointmentId, "whatsapp_button");
    if (!confirmed) {
      // Already confirmed, cancelled, or unknown id — ignore idempotently.
      return NextResponse.json({ ok: true, alreadyHandled: true });
    }

    const confirmedSalonRows = await db.select().from(salons).where(eq(salons.id, confirmed.salonId)).limit(1);
    const confirmedSalon = confirmedSalonRows[0];
    const ai = (confirmedSalon?.settings as Record<string, unknown> | undefined)?.ai as
      | Record<string, unknown>
      | undefined;

    // Only now — after the customer explicitly accepted the cancellation
    // policy — push the booking to the connected agenda provider.
    await pushBookingToAgenda(
      confirmedSalon?.agendaProvider,
      ai?.agendaApiKey ? String(ai.agendaApiKey) : null,
      confirmed.id,
      {
        customerName: confirmed.customerName,
        customerPhone: confirmed.customerPhone,
        serviceType: confirmed.serviceType,
        date: amsterdamDateKey(confirmed.appointmentTime),
        time: amsterdamTimeKey(confirmed.appointmentTime),
      },
    );

    await trackEvent({
      type: "booking_confirmed",
      salonId: confirmed.salonId,
      props: { via: "ai_whatsapp", appointmentId: confirmed.id },
      dedupeKey: `booking-confirmed:${confirmed.id}`,
    });

    try {
      const watiApiKeyForReply =
        env.WATI_API_KEY ?? (ai?.watiApiKey ? (decrypt(String(ai.watiApiKey)) ?? String(ai.watiApiKey)) : null);
      if (watiApiKeyForReply && env.WATI_BASE_URL) {
        await sendWatiMessage(
          env.WATI_BASE_URL,
          watiApiKeyForReply,
          fromPhone,
          `Bedankt! Je afspraak op ${amsterdamDateKey(confirmed.appointmentTime)} om ${amsterdamTimeKey(confirmed.appointmentTime)} is definitief bevestigd.`,
        );
      }
    } catch (err) {
      captureError("wati/confirm-reply", err);
    }

    return NextResponse.json({ ok: true, confirmed: true });
  }

  const messageText = String(
    messageObj.text ?? messageObj.body ?? body.text ?? "",
  ).trim();
  // Fase 4 multimodale input: WATI's media message shape — best-effort field
  // names (type/data/filePath), unverified against live WATI docs since we
  // don't have a connected account to confirm the exact payload. Falls back
  // to no image gracefully if none of these match.
  const messageType = String(messageObj.type ?? body.type ?? "");
  const imageUrl =
    messageType === "image"
      ? String(messageObj.data ?? messageObj.filePath ?? messageObj.fileUrl ?? "") || null
      : null;
  const convObj = body.conversation as Record<string, unknown> | undefined;
  const watiConvId = String(body.id ?? convObj?.id ?? "");
  const customerName = String(body.senderName ?? body.contactName ?? "");

  if (!fromPhone || (!messageText && !imageUrl)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  // Find which salon this webhook belongs to
  const salon = webhookKey ? await findSalonByWatiKey(webhookKey) : null;
  if (!salon) {
    return NextResponse.json({ error: "Salon not found" }, { status: 404 });
  }
  const salonId = salon.id;

  const credentials = resolveWatiCredentials(salon, env.WATI_API_KEY, env.WATI_BASE_URL, decrypt);
  if (!credentials) {
    return NextResponse.json({ error: "WATI not configured" }, { status: 500 });
  }
  const { watiApiKey, watiBaseUrl } = credentials;

  // Upsert conversation
  const existing = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.salonId, salonId),
        eq(conversations.channel, "whatsapp"),
        eq(conversations.phoneNumber, fromPhone),
        eq(conversations.status, "active"),
      ),
    )
    .limit(1);

  let conversationId: string;
  if (existing[0]) {
    conversationId = existing[0].id;
  } else {
    const [newConv] = await db
      .insert(conversations)
      .values({
        salonId,
        channel: "whatsapp",
        externalId: watiConvId || null,
        phoneNumber: fromPhone,
        customerName: customerName || null,
        status: "active",
      })
      .returning({ id: conversations.id });
    conversationId = newConv!.id;
  }

  // Persist incoming message
  await db.insert(messages).values({
    conversationId,
    role: "user",
    content: messageText || (imageUrl ? "[Foto ontvangen]" : ""),
    imageUrl,
  });

  // Track analytics event for every inbound message, independent of debouncing.
  await trackEvent({
    type: "whatsapp_message",
    salonId,
    props: { fromPhone, conversationId },
    dedupeKey: `wa:${watiConvId}:${Date.now()}`,
  });

  // Fase 4 message-buffering: if QStash is configured, wait DEBOUNCE_SECONDS
  // for more messages from the same customer before replying once — a
  // WhatsApp burst ("hoi" / "ik wil een afspraak" / "morgen 14u graag" as
  // three separate messages) shouldn't get three separate AI replies. The
  // debounce endpoint below re-checks whether this is still the newest
  // message before actually processing, so scheduling on every message is
  // safe even if several land within the window.
  if (isQstashConfigured()) {
    await scheduleDelayedCall("/api/webhooks/wati/debounce", { conversationId }, DEBOUNCE_SECONDS);
    return NextResponse.json({ ok: true, queued: true });
  }

  await processWatiTurn({ salon, conversationId, fromPhone, watiApiKey, watiBaseUrl });
  return NextResponse.json({ ok: true });
}
