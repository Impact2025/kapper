import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { salons, conversations, messages, appointments, agentRuns } from "@/lib/db/schema";
import { executeReceptionistTool } from "@/lib/ai/receptionist";
import { loadSalonContext } from "@/lib/salon/receptionist-context";
import { trackEvent } from "@/lib/analytics/track";
import { env } from "@/lib/env";
import { captureError } from "@/lib/observability";
import { sendBookingFallbackSms } from "@/lib/sms/twilio";

export const runtime = "nodejs";
export const maxDuration = 30;

interface VapiMessage {
  role: "assistant" | "user" | "bot" | "system" | "tool_calls" | "tool_call_result";
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

/**
 * Live tool-calls arrive while the call is still in progress, but the
 * `conversations` row for this call is normally only created afterwards, in
 * the end-of-call-report handler below. A booking made mid-call needs a real
 * `conversations.id` to satisfy `appointments.conversation_id`'s foreign
 * key — Vapi's own call id is never a row in that table, so passing it
 * straight through crashed every phone booking with an FK violation.
 * Find-or-create by `externalId` (the Vapi call id) so every tool-call
 * during the same call reuses one row, and the end-of-call handler later
 * finishes that same row instead of inserting a duplicate.
 */
async function findOrCreateLiveConversation(
  salonId: string,
  vapiCallId: string,
  customerPhone: string,
): Promise<string> {
  const [existing] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(eq(conversations.externalId, vapiCallId))
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(conversations)
    .values({
      salonId,
      channel: "phone",
      externalId: vapiCallId,
      phoneNumber: customerPhone || null,
      status: "active",
    })
    .returning({ id: conversations.id });
  return created!.id;
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
  const vapiCallId = message.call?.id ?? "";
  const conversationId = vapiCallId
    ? await findOrCreateLiveConversation(salon.id, vapiCallId, customerPhone)
    : null;
  const results = await Promise.all(
    toolCalls.map(async (tc) => {
      try {
        const { resultText, bookedAppointment, escalated } = await executeReceptionistTool(
          tc.function.name,
          tc.function.arguments ?? {},
          salonContext,
          customerPhone,
          conversationId,
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
          if (conversationId) {
            await db
              .update(conversations)
              .set({ status: "escalated", escalationReason: escalated.reason })
              .where(eq(conversations.id, conversationId));
          }
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

  // A tool-call during the call may already have created this row (see
  // findOrCreateLiveConversation) — finish that same row rather than
  // inserting a duplicate, so any mid-call booking stays linked to it.
  const [existingConv] = vapiCallId
    ? await db.select({ id: conversations.id }).from(conversations).where(eq(conversations.externalId, vapiCallId)).limit(1)
    : [];

  const conversationId = existingConv
    ? existingConv.id
    : (
        await db
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
          .returning({ id: conversations.id })
      )[0]!.id;

  if (existingConv) {
    await db
      .update(conversations)
      .set({ customerName: customerName || null, status: "closed", closedAt: new Date() })
      .where(eq(conversations.id, conversationId));
  }

  // Persist transcript as messages — skip system prompts and tool-call noise,
  // those aren't part of the conversation the salon owner should read.
  const conversationalMessages = vapiMessages.filter(
    (m) => m.role === "assistant" || m.role === "bot" || m.role === "user",
  );
  if (conversationalMessages.length > 0) {
    const msgRows = conversationalMessages.map((m) => ({
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

  const [finalConv] = salonId
    ? await db
        .select({ escalationReason: conversations.escalationReason })
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1)
    : [];

  // Fase 6 Artikel 50/17: phone calls never went through lib/ai/manager.ts
  // (they call executeReceptionistTool directly per tool-call event, see
  // handleToolCalls above), so unlike WhatsApp they had no agent_runs audit
  // row at all. One row per call, logged here at call-end, closes that gap —
  // it also doubles as the provenance record for the AI Act's machine-
  // readable-marking requirement on generated audio: Vapi/Cartesia don't
  // expose an actual audio watermarking API as of this writing (checked
  // their docs), so this ledger (which AI handled the call, when, whether
  // escalated) is the best available substitute until they do. The verbal
  // "u spreekt met een AI-assistent" disclosure (lib/ai/vapi-assistant.ts
  // firstMessage) remains the primary, always-on Artikel 50 measure for
  // voice.
  if (salonId) {
    await db.insert(agentRuns).values({
      salonId,
      conversationId,
      channel: "phone",
      agent: "receptionist",
      guardTriggered: false,
      escalated: Boolean(finalConv?.escalationReason),
    });
  }

  // Fase 4 SMS-fallback: the call ended without a booking and without being
  // handed off to a human — text the customer a way to still get booked
  // instead of silently losing the lead. escalationReason survives the
  // status-overwrite to "closed" above (that update never clears it), so
  // it's still a reliable "was this escalated mid-call" signal here.
  if (salonId && customerPhone) {
    const hasBooking = Boolean(bookedMatch) || (
      await db.select({ id: appointments.id }).from(appointments).where(eq(appointments.conversationId, conversationId)).limit(1)
    ).length > 0;

    if (!hasBooking && !finalConv?.escalationReason) {
      await sendBookingFallbackSms({
        toPhone: customerPhone,
        salonName: salon?.name ?? "de salon",
        salonPhone: salon?.phone ?? null,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
