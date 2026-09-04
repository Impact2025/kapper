import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { salons, conversations, messages, users, events as eventsTable } from "@/lib/db/schema";
import { getReceptionistReply, type WatiConfirmationPayload } from "@/lib/ai/receptionist";
import { loadSalonContext } from "@/lib/salon/receptionist-context";
import { confirmAppointment, setExternalId } from "@/lib/salon/appointments";
import { getAgendaAdapter } from "@/lib/agenda";
import { amsterdamDateKey, amsterdamTimeKey } from "@/lib/salon/timezone";
import { trackEvent } from "@/lib/analytics/track";
import { env } from "@/lib/env";
import { decrypt } from "@/lib/crypto";
import { sendEmail } from "@/lib/mail/resend";
import { aiLiveEmail } from "@/lib/mail/templates";
import { publicEnv } from "@/lib/env";
import { captureError } from "@/lib/observability";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Verify WATI HMAC-SHA256 webhook signature. Exported for tests. */
export function verifyWatiSignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  return signature === expected;
}

/** Send a WhatsApp message via WATI. */
async function sendWatiMessage(
  baseUrl: string,
  apiKey: string,
  phoneNumber: string,
  message: string,
): Promise<void> {
  const url = `${baseUrl}/api/v1/sendSessionMessage/${encodeURIComponent(phoneNumber)}`;
  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messageText: message }),
  });
}

/** Send a WhatsApp interactive-button message via WATI (Middelburg-norm booking confirmation). */
async function sendWatiInteractiveMessage(
  baseUrl: string,
  apiKey: string,
  phoneNumber: string,
  payload: WatiConfirmationPayload,
): Promise<void> {
  const url = `${baseUrl}/api/v1/sendInteractiveButtonsMessage/${encodeURIComponent(phoneNumber)}`;
  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      body: payload.text,
      buttons: [{ text: payload.buttonTitle, id: payload.buttonId }],
    }),
  });
}

/** Look up the salon whose WATI API key matches the inbound request. */
async function findSalonByWatiKey(rawKey: string): Promise<typeof salons.$inferSelect | null> {
  // We need to find the salon whose stored (encrypted) watiApiKey decrypts to rawKey
  // For performance: fetch all active salons with ai settings and check
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
  // conversational flow below — a button reply carries no free-text body.
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
    try {
      const rawKey = ai?.agendaApiKey ? String(ai.agendaApiKey) : null;
      const apiKey = rawKey ? (decrypt(rawKey) ?? rawKey) : null;
      const adapter = getAgendaAdapter(confirmedSalon?.agendaProvider, apiKey);
      if (adapter) {
        const pushResult = await adapter.bookAppointment({
          customerName: confirmed.customerName,
          customerPhone: confirmed.customerPhone,
          serviceType: confirmed.serviceType,
          date: amsterdamDateKey(confirmed.appointmentTime),
          time: amsterdamTimeKey(confirmed.appointmentTime),
        });
        if (pushResult.ok && pushResult.externalId) {
          await setExternalId(confirmed.id, pushResult.externalId);
        }
      }
    } catch (err) {
      captureError("wati/confirm-agenda-push", err);
    }

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
  const convObj = body.conversation as Record<string, unknown> | undefined;
  const watiConvId = String(body.id ?? convObj?.id ?? "");
  const customerName = String(body.senderName ?? body.contactName ?? "");

  if (!fromPhone || !messageText) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  // Find which salon this webhook belongs to
  const salon = webhookKey ? await findSalonByWatiKey(webhookKey) : null;
  if (!salon) {
    return NextResponse.json({ error: "Salon not found" }, { status: 404 });
  }
  const salonId = salon.id;

  const aiSettings = (salon.settings as Record<string, unknown>).ai as Record<string, unknown> | undefined;
  const watiApiKey = env.WATI_API_KEY ?? (aiSettings?.watiApiKey ? (decrypt(String(aiSettings.watiApiKey)) ?? String(aiSettings.watiApiKey)) : null);
  const watiBaseUrl = env.WATI_BASE_URL ?? "";

  if (!watiApiKey || !watiBaseUrl) {
    return NextResponse.json({ error: "WATI not configured" }, { status: 500 });
  }

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

  const isNewConversation = !existing[0];
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
    content: messageText,
  });

  // Load recent history for context
  const history = await db
    .select({ role: messages.role, content: messages.content })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt)
    .limit(20);

  const salonContext = await loadSalonContext(salon);
  // The WATI credential resolved above (per-salon or global env fallback)
  // is what actually authenticates outbound sends — keep it authoritative
  // over whatever loadSalonContext read from settings.
  salonContext.aiSettings.watiApiKey = watiApiKey;

  const { reply, bookedAppointment, escalated } = await getReceptionistReply(
    salonContext,
    history.map((h) => ({ role: h.role, content: h.content })),
    fromPhone,
    conversationId,
    isNewConversation,
  );

  // Persist assistant reply
  await db.insert(messages).values({
    conversationId,
    role: "assistant",
    content: reply,
  });

  // Send reply via WATI — a fresh booking gets the Middelburg-norm
  // interactive confirmation message (with its accept button) instead of
  // the assistant's plain-text reply for this turn.
  if (bookedAppointment) {
    await sendWatiInteractiveMessage(watiBaseUrl, watiApiKey, fromPhone, bookedAppointment.confirmationPayload);
  } else {
    await sendWatiMessage(watiBaseUrl, watiApiKey, fromPhone, reply);
  }

  // Track analytics event
  await trackEvent({
    type: "whatsapp_message",
    salonId,
    props: { fromPhone, conversationId },
    dedupeKey: `wa:${watiConvId}:${Date.now()}`,
  });

  // The receptionist tool already wrote the booking straight to our own
  // appointments table as pending_confirmation — the external agenda push
  // only happens once the customer taps the confirmation button above.
  if (bookedAppointment) {
    await trackEvent({
      type: "booking_made",
      salonId,
      props: {
        via: "ai_whatsapp",
        serviceType: bookedAppointment.serviceType,
        date: bookedAppointment.date,
      },
      dedupeKey: `booking:${conversationId}:${bookedAppointment.date}:${bookedAppointment.time}`,
    });
  }

  // The AI flagged this conversation for a human — surface it in Gesprekken.
  if (escalated) {
    await db.update(conversations).set({ status: "escalated" }).where(eq(conversations.id, conversationId));
    await trackEvent({
      type: "escalated",
      salonId,
      props: { via: "ai_whatsapp", reason: escalated.reason, conversationId },
      dedupeKey: `escalate:${conversationId}:${Date.now()}`,
    });
  }

  // Send "AI is live" email on first real event for this salon
  if (salonId) {
    try {
      const aiLiveSent = (salon?.settings as Record<string, unknown>)?.aiLiveNotificationSent;
      if (!aiLiveSent) {
        // Check this is the first event
        const [countRow] = await db
          .select({ n: sql<number>`count(*)::int` })
          .from(eventsTable)
          .where(eq(eventsTable.salonId, salonId));

        if (Number(countRow?.n ?? 0) <= 1) {
          // Find owner email
          const ownerRows = await db
            .select({ email: users.email })
            .from(users)
            .where(and(eq(users.salonId, salonId), eq(users.role, "owner")))
            .limit(1);

          if (ownerRows[0]) {
            await sendEmail({
              to: ownerRows[0].email,
              subject: `Je AI-assistent staat live — ${salon?.name ?? "Jouw salon"}`,
              html: aiLiveEmail({
                salonName: salon?.name ?? "Jouw salon",
                dashboardUrl: `${publicEnv.NEXT_PUBLIC_SITE_URL}/dashboard/gesprekken`,
              }),
            });
            // Mark as sent
            await db
              .update(salons)
              .set({
                settings: sql`${salons.settings} || '{"aiLiveNotificationSent": true}'::jsonb`,
              })
              .where(eq(salons.id, salonId));
          }
        }
      }
    } catch (err) {
      captureError("wati/ai-live-notification", err);
    }
  }

  return NextResponse.json({ ok: true });
}
