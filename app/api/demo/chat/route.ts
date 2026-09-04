import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";
import { getReceptionistReply } from "@/lib/ai/receptionist";
import { loadSalonContext } from "@/lib/salon/receptionist-context";
import { getPublicDemoSalon } from "@/lib/salon/public-demo";
import { trackEvent } from "@/lib/analytics/track";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_MESSAGE_LEN = 1000;
// Bounds Anthropic spend on this unauthenticated, public sales page.
const MAX_USER_MESSAGES_PER_SESSION = 20;
const LIMIT_REACHED_REPLY =
  "Deze demo heeft het maximum aantal berichten voor deze sessie bereikt. Klik op “Nieuw gesprek” hierboven om opnieuw te beginnen.";

export async function POST(req: Request) {
  let body: { slug?: string; sessionId?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slug = String(body.slug ?? "").trim();
  const sessionId = String(body.sessionId ?? "").trim();
  const messageText = String(body.message ?? "").trim().slice(0, MAX_MESSAGE_LEN);

  if (!slug || !sessionId || !messageText) {
    return NextResponse.json({ error: "slug, sessionId en message zijn verplicht." }, { status: 400 });
  }
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(sessionId)) {
    return NextResponse.json({ error: "Ongeldige sessionId." }, { status: 400 });
  }

  const salon = await getPublicDemoSalon(slug);
  if (!salon) {
    return NextResponse.json({ error: "Demo niet gevonden." }, { status: 404 });
  }

  const demoPhone = `demo:${sessionId}`;

  const existing = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.salonId, salon.id),
        eq(conversations.channel, "whatsapp"),
        eq(conversations.phoneNumber, demoPhone),
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
        salonId: salon.id,
        channel: "whatsapp",
        externalId: `demo:${sessionId}`,
        phoneNumber: demoPhone,
        customerName: "Demo — website",
        status: "active",
      })
      .returning({ id: conversations.id });
    conversationId = newConv!.id;
  }

  const [countRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(messages)
    .where(and(eq(messages.conversationId, conversationId), eq(messages.role, "user")));
  if (Number(countRow?.n ?? 0) >= MAX_USER_MESSAGES_PER_SESSION) {
    return NextResponse.json({ reply: LIMIT_REACHED_REPLY, limitReached: true });
  }

  await db.insert(messages).values({ conversationId, role: "user", content: messageText });

  const history = await db
    .select({ role: messages.role, content: messages.content })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt)
    .limit(20);

  const salonContext = await loadSalonContext(salon);
  const { reply, bookedAppointment, escalated } = await getReceptionistReply(
    salonContext,
    history.map((h) => ({ role: h.role, content: h.content })),
    demoPhone,
    conversationId,
  );

  await db.insert(messages).values({ conversationId, role: "assistant", content: reply });

  await trackEvent({ type: "demo_chat_message", salonId: salon.id, props: { slug } });

  if (escalated) {
    await db.update(conversations).set({ status: "escalated" }).where(eq(conversations.id, conversationId));
  }

  return NextResponse.json({
    reply,
    booked: bookedAppointment
      ? { treatment: bookedAppointment.serviceType, date: bookedAppointment.date, time: bookedAppointment.time }
      : null,
    escalated: Boolean(escalated),
  });
}
