import { NextResponse } from "next/server";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { helpSearchMisses, supportChatMessages, supportChats } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { answerSupportQuestion } from "@/lib/support/chat";
import { getSupportActor } from "@/lib/support/actor";
import { MAX_MESSAGE_LEN, MAX_USER_MESSAGES_PER_CHAT, shouldOfferTicketAfterMisses } from "@/lib/support/chat-guard";
import { clientIp, rateLimit } from "@/lib/support/rate-limit";
import { trackEvent } from "@/lib/analytics/track";
import { captureError } from "@/lib/observability";

export const runtime = "nodejs";
export const maxDuration = 30;

const LIMIT_REPLY =
  "Dit gesprek heeft het maximale aantal berichten bereikt. Start een nieuw gesprek of maak een ticket aan, dan helpt een medewerker je verder.";

export async function POST(req: Request) {
  if (!env.DATABASE_URL) {
    return NextResponse.json({ error: "Support-chat is tijdelijk niet beschikbaar." }, { status: 503 });
  }

  const ip = clientIp(req);
  // Two windows: burst (typing spam) and hourly (cost cap on this public endpoint).
  const burst = rateLimit(`chat:burst:${ip}`, 8, 60_000);
  const hourly = rateLimit(`chat:hour:${ip}`, 60, 3_600_000);
  if (!burst.ok || !hourly.ok) {
    const wait = Math.max(burst.retryAfterSeconds, hourly.retryAfterSeconds);
    return NextResponse.json(
      { error: "Je stuurt te snel berichten. Probeer het over een moment opnieuw." },
      { status: 429, headers: { "Retry-After": String(wait) } },
    );
  }

  let body: { sessionId?: string; message?: string; pagePath?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  }
  const sessionId = String(body.sessionId ?? "").trim();
  const message = String(body.message ?? "").trim().slice(0, MAX_MESSAGE_LEN);
  const pagePath = typeof body.pagePath === "string" ? body.pagePath.slice(0, 200) : null;
  if (!/^[a-zA-Z0-9_-]{16,64}$/.test(sessionId) || !message) {
    return NextResponse.json({ error: "sessionId en message zijn verplicht." }, { status: 400 });
  }

  try {
    const actor = await getSupportActor();

    let [chat] = await db.select().from(supportChats).where(eq(supportChats.sessionId, sessionId)).limit(1);
    if (chat) {
      // A chat is bound to whoever started it: never let another logged-in
      // salon (or a logged-out browser) continue with someone else's account tools.
      if (chat.salonId && chat.salonId !== (actor.salon?.id ?? null)) {
        return NextResponse.json({ error: "Deze chat is niet meer beschikbaar. Start een nieuwe." }, { status: 403 });
      }
    } else {
      [chat] = await db
        .insert(supportChats)
        .values({
          sessionId,
          audience: actor.audience,
          salonId: actor.salon?.id ?? null,
          userId: actor.userId,
          pagePath,
        })
        .returning();
    }
    if (!chat) return NextResponse.json({ error: "Kon de chat niet starten." }, { status: 500 });

    const [count] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(supportChatMessages)
      .where(and(eq(supportChatMessages.chatId, chat.id), eq(supportChatMessages.role, "user")));
    if (Number(count?.n ?? 0) >= MAX_USER_MESSAGES_PER_CHAT) {
      return NextResponse.json({ audience: actor.audience, reply: LIMIT_REPLY, sources: [], suggestTicket: true, suggestedCategory: "overig", limitReached: true });
    }

    await db.insert(supportChatMessages).values({ chatId: chat.id, role: "user", content: message });

    const rows = await db
      .select({ role: supportChatMessages.role, content: supportChatMessages.content })
      .from(supportChatMessages)
      .where(eq(supportChatMessages.chatId, chat.id))
      .orderBy(asc(supportChatMessages.createdAt));

    const result = await answerSupportQuestion(rows, { audience: actor.audience, salonId: actor.salon?.id ?? null });

    const misses = result.miss ? chat.consecutiveMisses + 1 : 0;
    const suggestTicket = result.suggestTicket || shouldOfferTicketAfterMisses(misses);

    const [saved] = await db
      .insert(supportChatMessages)
      .values({
        chatId: chat.id,
        role: "assistant",
        content: result.reply,
        sources: result.sources.map((s) => s.slug),
      })
      .returning({ id: supportChatMessages.id });

    await db
      .update(supportChats)
      .set({ consecutiveMisses: misses, escalationReason: result.escalationReason ?? chat.escalationReason })
      .where(eq(supportChats.id, chat.id));

    if (result.miss) {
      await db.insert(helpSearchMisses).values({ query: message.slice(0, 300), source: "chat" });
    }
    await trackEvent({
      type: "support_chat_message",
      salonId: actor.salon?.id ?? null,
      props: { miss: result.miss, escalated: Boolean(result.escalationReason), audience: actor.audience },
    });

    return NextResponse.json({
      audience: actor.audience,
      messageId: saved?.id ?? null,
      reply: result.reply,
      sources: result.sources,
      suggestTicket,
      suggestedCategory: result.suggestedCategory,
    });
  } catch (err) {
    captureError("support-chat/route", err);
    return NextResponse.json({ error: "Er ging iets mis. Probeer het zo opnieuw." }, { status: 500 });
  }
}
