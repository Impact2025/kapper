import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { salons, conversations, messages, appointments } from "@/lib/db/schema";
import { trackEvent } from "@/lib/analytics/track";
import { env } from "@/lib/env";
import { decrypt } from "@/lib/crypto";
import { captureError } from "@/lib/observability";

export const runtime = "nodejs";
export const maxDuration = 30;

interface VapiMessage {
  role: "assistant" | "user" | "bot" | "user";
  message?: string;
  content?: string;
}

interface VapiCall {
  id?: string;
  phoneNumberId?: string;
  customer?: { number?: string; name?: string };
  endedReason?: string;
}

interface VapiPayload {
  message?: {
    type?: string;
    call?: VapiCall;
    artifact?: {
      transcript?: string;
      messages?: VapiMessage[];
    };
    durationSeconds?: number;
  };
  // Vapi also sends flat structure for some events
  type?: string;
  call?: VapiCall;
}

function authorized(req: Request): boolean {
  if (!env.VAPI_API_KEY) return true; // skip auth if not configured (dev)
  return req.headers.get("authorization") === `Bearer ${env.VAPI_API_KEY}`;
}

/** Find salon by matching stored Vapi phone number in settings. */
async function findSalonByPhone(customerPhone: string): Promise<typeof salons.$inferSelect | null> {
  // Normalize: remove spaces and leading zeros, keep E.164 format
  const normalized = customerPhone.replace(/\s/g, "");

  const rows = await db
    .select()
    .from(salons)
    .where(eq(salons.status, "active"))
    .limit(100);

  for (const salon of rows) {
    const ai = (salon.settings as Record<string, unknown>)?.ai as Record<string, unknown> | undefined;
    if (!ai?.phoneNumber) continue;
    const storedPhone = String(ai.phoneNumber).replace(/\s/g, "");
    if (storedPhone === normalized || normalized.endsWith(storedPhone.replace(/^\+31/, "0"))) {
      return salon;
    }
  }
  return null;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: VapiPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Vapi wraps events inside a `message` object
  const event = body.message?.type ?? body.type ?? "";

  // We only care about end-of-call reports
  if (event !== "end-of-call-report" && event !== "call-ended") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const call = body.message?.call ?? body.call;
  const artifact = body.message?.artifact;
  const vapiCallId = call?.id ?? "";
  const customerPhone = call?.customer?.number ?? "";
  const customerName = call?.customer?.name ?? "";
  const durationSeconds = body.message?.durationSeconds ?? 0;
  const transcriptRaw = artifact?.transcript ?? "";
  const vapiMessages: VapiMessage[] = artifact?.messages ?? [];

  // Determine which salon owns this call number
  const salon = customerPhone ? await findSalonByPhone(customerPhone) : null;
  const salonId = salon?.id ?? "";

  // Create conversation record
  const [conv] = await db
    .insert(conversations)
    .values({
      salonId,
      channel: "phone",
      externalId: vapiCallId || null,
      phoneNumber: customerPhone || null,
      customerName: customerName || null,
      status: "closed",
      closedAt: new Date(),
    })
    .returning({ id: conversations.id });

  const conversationId = conv!.id;

  // Persist transcript as messages
  if (vapiMessages.length > 0) {
    const msgRows = vapiMessages.map((m) => ({
      conversationId,
      role: (m.role === "assistant" || m.role === "bot" ? "assistant" : "user") as "user" | "assistant",
      content: m.message ?? m.content ?? "",
    }));
    if (msgRows.length > 0) {
      await db.insert(messages).values(msgRows);
    }
  } else if (transcriptRaw) {
    // Fallback: store raw transcript as a single assistant message
    await db.insert(messages).values({
      conversationId,
      role: "assistant",
      content: transcriptRaw,
    });
  }

  // Track call_handled event
  await trackEvent({
    type: "call_handled",
    salonId: salonId || null,
    props: { durationSeconds, vapiCallId, customerPhone },
    dedupeKey: `call:${vapiCallId}`,
  });

  // Detect appointment from transcript using a simple pattern
  // Vapi should be configured to pass booking data in call metadata or structured output
  const bookedMatch = transcriptRaw.match(
    /BOEKING:\s*naam=([^,]+),\s*telefoon=([^,]+),\s*dienst=([^,]+),\s*datum=(\d{4}-\d{2}-\d{2}),\s*tijd=(\d{2}:\d{2})/i,
  );

  if (bookedMatch && salonId) {
    const provider = salon?.agendaProvider ?? "manual";
    const [apt] = await db
      .insert(appointments)
      .values({
        salonId,
        conversationId,
        agendaProvider: provider,
        customerName: bookedMatch[1]!.trim(),
        customerPhone: bookedMatch[2]!.trim() || customerPhone,
        serviceType: bookedMatch[3]!.trim(),
        appointmentTime: new Date(`${bookedMatch[4]}T${bookedMatch[5]}:00`),
        source: "ai_phone",
      })
      .returning({ id: appointments.id });

    // Attempt live agenda booking
    try {
      const aiSettings = ((salon?.settings ?? {}) as Record<string, unknown>)?.ai as
        | Record<string, unknown>
        | undefined;
      const rawKey = aiSettings?.agendaApiKey as string | null | undefined;
      const apiKey = rawKey ? (decrypt(rawKey) ?? rawKey) : null;
      const { getAgendaAdapter } = await import("@/lib/agenda");
      const adapter = getAgendaAdapter(provider, apiKey);
      if (adapter && apt?.id) {
        const result = await adapter.bookAppointment({
          customerName: bookedMatch[1]!.trim(),
          customerPhone: bookedMatch[2]!.trim() || customerPhone,
          serviceType: bookedMatch[3]!.trim(),
          date: bookedMatch[4]!,
          time: bookedMatch[5]!,
        });
        if (result.ok && result.externalId) {
          await db
            .update(appointments)
            .set({ externalId: result.externalId })
            .where(eq(appointments.id, apt.id));
        }
      }
    } catch (err) {
      captureError("vapi/agenda-booking", err);
    }

    await trackEvent({
      type: "booking_made",
      salonId,
      props: { via: "ai_phone", serviceType: bookedMatch[3]!.trim(), date: bookedMatch[4] },
      dedupeKey: `booking:phone:${vapiCallId}`,
    });
  }

  return NextResponse.json({ ok: true });
}
