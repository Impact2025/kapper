import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { salons, conversations, messages, appointments } from "@/lib/db/schema";
import { executeReceptionistTool } from "@/lib/ai/receptionist";
import { loadSalonContext } from "@/lib/salon/receptionist-context";
import { trackEvent } from "@/lib/analytics/track";
import { env } from "@/lib/env";
import { captureError } from "@/lib/observability";

export const runtime = "nodejs";
export const maxDuration = 30;

interface VapiMessage {
  role: "assistant" | "user" | "bot" | "user";
  message?: string;
  content?: string;
}

interface VapiToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: Record<string, unknown> };
}

interface VapiCall {
  id?: string;
  assistantId?: string;
  phoneNumberId?: string;
  customer?: { number?: string; name?: string };
  endedReason?: string;
}

interface VapiPayload {
  message?: {
    type?: string;
    call?: VapiCall;
    assistant?: { id?: string };
    toolCalls?: VapiToolCall[];
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

/**
 * Find the salon that owns this Vapi assistant. Exact match — every salon
 * with the voice channel enabled gets its own Vapi assistant (created via
 * lib/ai/vapi-assistant.ts) whose id is stored in settings.ai.vapiAssistantId,
 * so this is authoritative (unlike matching on the caller's own phone
 * number, which is never the salon's number).
 */
async function findSalonByAssistantId(assistantId: string): Promise<typeof salons.$inferSelect | null> {
  const rows = await db.select().from(salons).where(eq(salons.status, "active")).limit(200);
  for (const salon of rows) {
    const ai = (salon.settings as Record<string, unknown>)?.ai as Record<string, unknown> | undefined;
    if (ai?.vapiAssistantId === assistantId) return salon;
  }
  return null;
}

/** Handle a live tool-call during the call — Vapi's own model decided to
 * call one of our tools and is waiting synchronously for the result. */
async function handleToolCalls(payload: VapiPayload) {
  const message = payload.message!;
  const toolCalls = message.toolCalls ?? [];
  const assistantId = message.call?.assistantId ?? message.assistant?.id ?? "";
  const customerPhone = message.call?.customer?.number ?? "";

  const salon = assistantId ? await findSalonByAssistantId(assistantId) : null;
  if (!salon) {
    // Can't resolve which salon — fail every tool call clearly rather than
    // guessing, so the voice model tells the caller to phone back later.
    return NextResponse.json({
      results: toolCalls.map((tc) => ({ toolCallId: tc.id, result: "Systeemfout: kan salon niet vinden." })),
    });
  }

  const salonContext = await loadSalonContext(salon);
  const results = await Promise.all(
    toolCalls.map(async (tc) => {
      try {
        const { resultText, bookedAppointment, escalated } = await executeReceptionistTool(
          tc.function.name,
          tc.function.arguments ?? {},
          salonContext,
          customerPhone,
          message.call?.id ?? null,
        );
        if (bookedAppointment) {
          await trackEvent({
            type: "booking_made",
            salonId: salon.id,
            props: { via: "ai_phone", serviceType: bookedAppointment.serviceType, date: bookedAppointment.date },
            dedupeKey: `booking:phone:${tc.id}`,
          });
        }
        if (escalated) {
          await trackEvent({
            type: "escalated",
            salonId: salon.id,
            props: { via: "ai_phone", reason: escalated.reason },
            dedupeKey: `escalate:phone:${tc.id}`,
          });
        }
        return { toolCallId: tc.id, result: resultText };
      } catch (err) {
        captureError("vapi/tool-call", err);
        return { toolCallId: tc.id, result: "Er ging iets mis — bied aan om terug te bellen." };
      }
    }),
  );

  return NextResponse.json({ results });
}

/** Look up which salon this webhook belongs to. */
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

  const event = body.message?.type ?? body.type ?? "";

  if (event === "tool-calls") {
    return handleToolCalls(body);
  }

  // We only care about end-of-call reports beyond tool-calls.
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
  const assistantId = call?.assistantId ?? body.message?.assistant?.id ?? "";

  const salon = assistantId ? await findSalonByAssistantId(assistantId) : null;
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

  // Bookings now happen live via the tool-calls handler above (real
  // tool-use against our own DB, same as WhatsApp) — this transcript-regex
  // fallback only catches a booking mentioned in speech that somehow
  // bypassed the tool (e.g. an older assistant not yet re-synced).
  const bookedMatch = transcriptRaw.match(
    /BOEKING:\s*naam=([^,]+),\s*telefoon=([^,]+),\s*dienst=([^,]+),\s*datum=(\d{4}-\d{2}-\d{2}),\s*tijd=(\d{2}:\d{2})/i,
  );

  if (bookedMatch && salonId) {
    const provider = salon?.agendaProvider ?? "manual";
    await db.insert(appointments).values({
      salonId,
      conversationId,
      agendaProvider: provider,
      customerName: bookedMatch[1]!.trim(),
      customerPhone: bookedMatch[2]!.trim() || customerPhone,
      serviceType: bookedMatch[3]!.trim(),
      appointmentTime: new Date(`${bookedMatch[4]}T${bookedMatch[5]}:00`),
      source: "ai_phone",
    });

    await trackEvent({
      type: "booking_made",
      salonId,
      props: { via: "ai_phone", serviceType: bookedMatch[3]!.trim(), date: bookedMatch[4] },
      dedupeKey: `booking:phone:${vapiCallId}`,
    });
  }

  return NextResponse.json({ ok: true });
}
