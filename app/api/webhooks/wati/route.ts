import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { salons, conversations, messages, appointments, users, events as eventsTable } from "@/lib/db/schema";
import { getReceptionistReply, type SalonContext } from "@/lib/ai/receptionist";
import { trackEvent } from "@/lib/analytics/track";
import { env } from "@/lib/env";
import { decrypt } from "@/lib/crypto";
import { sendEmail } from "@/lib/mail/resend";
import { aiLiveEmail } from "@/lib/mail/templates";
import { publicEnv } from "@/lib/env";
import { captureError } from "@/lib/observability";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Verify WATI HMAC-SHA256 webhook signature. */
function verifyWatiSignature(body: string, signature: string | null, secret: string): boolean {
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
    // If no per-salon key, try global env config (single-tenant dev mode)
    if (!env.WATI_API_KEY || !env.WATI_BASE_URL) {
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }
  }

  const salonId = salon?.id ?? "";
  const aiSettings = ((salon?.settings ?? {}) as Record<string, unknown>)?.ai as
    | Record<string, unknown>
    | undefined;

  const watiApiKey = env.WATI_API_KEY ?? (aiSettings?.watiApiKey ? (decrypt(String(aiSettings.watiApiKey)) ?? String(aiSettings.watiApiKey)) : null);
  const watiBaseUrl = env.WATI_BASE_URL ?? "";

  if (!watiApiKey || !watiBaseUrl) {
    return NextResponse.json({ error: "WATI not configured" }, { status: 500 });
  }

  // Upsert conversation
  const existing = salonId
    ? await db
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
        .limit(1)
    : [];

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

  // Build salon context
  const noShow = ((salon?.settings ?? {}) as Record<string, unknown>)?.noShow as
    | Record<string, unknown>
    | undefined;

  const salonContext: SalonContext = {
    name: salon?.name ?? "Salon",
    city: salon?.city ?? null,
    phone: salon?.phone ?? null,
    plan: salon?.plan ?? "essential",
    agendaProvider: salon?.agendaProvider ?? null,
    aiSettings: {
      agendaApiKey: aiSettings?.agendaApiKey as string | null | undefined,
      watiApiKey: watiApiKey,
    },
    noShowSettings: {
      enabled: Boolean(noShow?.enabled),
      freeCancelHours: Number(noShow?.freeCancelHours ?? 24),
      chargePercent: Number(noShow?.chargePercent ?? 100),
    },
  };

  const { reply, bookedAppointment } = await getReceptionistReply(
    salonContext,
    history.map((h) => ({ role: h.role, content: h.content })),
    fromPhone,
  );

  // Persist assistant reply
  await db.insert(messages).values({
    conversationId,
    role: "assistant",
    content: reply,
  });

  // Send reply via WATI
  await sendWatiMessage(watiBaseUrl, watiApiKey, fromPhone, reply);

  // Track analytics event
  await trackEvent({
    type: "whatsapp_message",
    salonId: salonId || null,
    props: { fromPhone, conversationId },
    dedupeKey: `wa:${watiConvId}:${Date.now()}`,
  });

  // If a booking was detected, persist it and track
  if (bookedAppointment && salonId) {
    const provider = salon?.agendaProvider ?? "manual";
    const [apt] = await db
      .insert(appointments)
      .values({
        salonId,
        conversationId,
        agendaProvider: provider,
        customerName: bookedAppointment.customerName,
        customerPhone: bookedAppointment.customerPhone,
        serviceType: bookedAppointment.serviceType,
        appointmentTime: new Date(`${bookedAppointment.date}T${bookedAppointment.time}:00`),
        source: "ai_whatsapp",
      })
      .returning({ id: appointments.id });

    // Attempt to book in the actual agenda provider
    try {
      const rawKey = aiSettings?.agendaApiKey as string | null | undefined;
      const apiKey = rawKey ? (decrypt(rawKey) ?? rawKey) : null;
      const { getAgendaAdapter } = await import("@/lib/agenda");
      const adapter = getAgendaAdapter(provider, apiKey);
      if (adapter) {
        const result = await adapter.bookAppointment({
          customerName: bookedAppointment.customerName,
          customerPhone: bookedAppointment.customerPhone,
          serviceType: bookedAppointment.serviceType,
          date: bookedAppointment.date,
          time: bookedAppointment.time,
        });
        if (result.ok && result.externalId && apt?.id) {
          await db
            .update(appointments)
            .set({ externalId: result.externalId })
            .where(eq(appointments.id, apt.id));
        }
      }
    } catch (err) {
      captureError("wati/agenda-booking", err);
    }

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
