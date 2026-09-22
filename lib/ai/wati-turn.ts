import "server-only";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { salons, conversations, messages, users, events as eventsTable } from "@/lib/db/schema";
import { runAiManager } from "@/lib/ai/manager";
import type { ConversationMessage } from "@/lib/ai/receptionist";
import { loadSalonContext } from "@/lib/salon/receptionist-context";
import { sendWatiMessage, sendWatiInteractiveMessage } from "@/lib/salon/wati-client";
import { amsterdamDateKey, amsterdamTimeKey } from "@/lib/salon/timezone";
import { trackEvent } from "@/lib/analytics/track";
import { sendEmail } from "@/lib/mail/resend";
import { aiLiveEmail } from "@/lib/mail/templates";
import { publicEnv } from "@/lib/env";
import { captureError } from "@/lib/observability";

/**
 * Fase 4 message-buffering can deliver several consecutive user messages
 * (a WhatsApp "burst") before a single reply is generated — collapse
 * consecutive same-role rows into one turn so the model always sees a
 * cleanly alternating conversation, regardless of provider strictness about
 * back-to-back same-role messages. The last image in a run wins.
 */
export function collapseConsecutiveRoles(history: ConversationMessage[]): ConversationMessage[] {
  const out: ConversationMessage[] = [];
  for (const msg of history) {
    const last = out[out.length - 1];
    if (last && last.role === msg.role) {
      last.content = [last.content, msg.content].filter(Boolean).join("\n");
      last.imageUrl = msg.imageUrl ?? last.imageUrl;
    } else {
      out.push({ ...msg });
    }
  }
  return out;
}

/**
 * Fase 4 message-buffering: true once `latestCreatedAt` (the newest message
 * in the conversation) is old enough that no message-still-arriving debounce
 * job is expected to overtake it. `jitterSlackMs` is a safety margin below
 * the full debounce window to account for QStash's own scheduling jitter —
 * without it, a job firing a few hundred ms early could wrongly conclude the
 * burst isn't over yet and skip replying (the next job, if any, then does).
 */
export function isDebounceQuiet(
  latestCreatedAt: Date,
  debounceMs: number,
  jitterSlackMs: number,
  now: Date = new Date(),
): boolean {
  return now.getTime() - latestCreatedAt.getTime() >= debounceMs - jitterSlackMs;
}

/** Resolve the WATI credentials this salon replies with — per-salon key from
 * settings, or the shared env fallback used in dev/single-tenant setups. */
export function resolveWatiCredentials(
  salon: typeof salons.$inferSelect,
  envApiKey: string | undefined,
  envBaseUrl: string | undefined,
  decrypt: (v: string) => string | null,
): { watiApiKey: string; watiBaseUrl: string } | null {
  const aiSettings = (salon.settings as Record<string, unknown>).ai as Record<string, unknown> | undefined;
  const watiApiKey =
    envApiKey ?? (aiSettings?.watiApiKey ? (decrypt(String(aiSettings.watiApiKey)) ?? String(aiSettings.watiApiKey)) : null);
  const watiBaseUrl = envBaseUrl ?? "";
  if (!watiApiKey || !watiBaseUrl) return null;
  return { watiApiKey, watiBaseUrl };
}

/**
 * Run one AI-manager turn for a WhatsApp conversation and send the reply —
 * the shared tail of both the immediate (no debounce configured) and
 * debounced (Fase 4 QStash) WATI webhook paths. Everything up to "persist
 * the incoming message(s)" already happened in the caller.
 */
export async function processWatiTurn(input: {
  salon: typeof salons.$inferSelect;
  conversationId: string;
  fromPhone: string;
  watiApiKey: string;
  watiBaseUrl: string;
}): Promise<void> {
  const { salon, conversationId, fromPhone, watiApiKey, watiBaseUrl } = input;
  const salonId = salon.id;

  const rawHistory = await db
    .select({ role: messages.role, content: messages.content, imageUrl: messages.imageUrl })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt)
    .limit(20);

  const history = collapseConsecutiveRoles(
    rawHistory.map((h) => ({ role: h.role, content: h.content, imageUrl: h.imageUrl })),
  );
  const isNewConversation = !rawHistory.some((h) => h.role === "assistant");

  const salonContext = await loadSalonContext(salon);
  salonContext.aiSettings.watiApiKey = watiApiKey;

  const { reply, bookedAppointment, escalated } = await runAiManager({
    salonId,
    salon: salonContext,
    history,
    customerPhone: fromPhone,
    conversationId,
    isNewConversation,
    channel: "whatsapp",
  });

  await db.insert(messages).values({ conversationId, role: "assistant", content: reply });

  if (bookedAppointment?.depositPayment) {
    await sendWatiMessage(
      watiBaseUrl,
      watiApiKey,
      fromPhone,
      `Rond je afspraak af met een aanbetaling van €${(bookedAppointment.depositPayment.amountCents / 100).toFixed(2)}: ${bookedAppointment.depositPayment.checkoutUrl}`,
    );
  } else if (bookedAppointment?.confirmationPayload) {
    await sendWatiInteractiveMessage(watiBaseUrl, watiApiKey, fromPhone, bookedAppointment.confirmationPayload);
  } else {
    await sendWatiMessage(watiBaseUrl, watiApiKey, fromPhone, reply);
  }

  if (bookedAppointment) {
    await trackEvent({
      type: "booking_made",
      salonId,
      props: { via: "ai_whatsapp", serviceType: bookedAppointment.serviceType, date: bookedAppointment.date },
      dedupeKey: `booking:${conversationId}:${bookedAppointment.date}:${bookedAppointment.time}`,
    });
  }

  if (escalated) {
    await db
      .update(conversations)
      .set({ status: "escalated", escalationReason: escalated.reason })
      .where(eq(conversations.id, conversationId));
    await trackEvent({
      type: "escalated",
      salonId,
      props: { via: "ai_whatsapp", reason: escalated.reason, conversationId },
      dedupeKey: `escalate:${conversationId}:${Date.now()}`,
    });
  }

  await maybeSendAiLiveEmail(salon);
}

/** Send the one-time "AI is live" email on the first real event for a salon. */
async function maybeSendAiLiveEmail(salon: typeof salons.$inferSelect): Promise<void> {
  const salonId = salon.id;
  try {
    const aiLiveSent = (salon.settings as Record<string, unknown>)?.aiLiveNotificationSent;
    if (aiLiveSent) return;

    const [countRow] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(eventsTable)
      .where(eq(eventsTable.salonId, salonId));
    if (Number(countRow?.n ?? 0) > 1) return;

    const ownerRows = await db
      .select({ email: users.email })
      .from(users)
      .where(and(eq(users.salonId, salonId), eq(users.role, "owner")))
      .limit(1);
    if (!ownerRows[0]) return;

    await sendEmail({
      to: ownerRows[0].email,
      subject: `Je AI-assistent staat live — ${salon.name ?? "Jouw salon"}`,
      html: aiLiveEmail({
        salonName: salon.name ?? "Jouw salon",
        dashboardUrl: `${publicEnv.NEXT_PUBLIC_SITE_URL}/dashboard/gesprekken`,
      }),
    });
    await db
      .update(salons)
      .set({ settings: sql`${salons.settings} || '{"aiLiveNotificationSent": true}'::jsonb` })
      .where(eq(salons.id, salonId));
  } catch (err) {
    captureError("wati/ai-live-notification", err);
  }
}
