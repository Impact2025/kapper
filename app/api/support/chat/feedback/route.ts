import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { supportChatMessages, supportChats } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { clientIp, rateLimit } from "@/lib/support/rate-limit";

export const runtime = "nodejs";

/** 👍/👎 on one assistant message. A 👎 counts as a miss towards offering a ticket. */
export async function POST(req: Request) {
  if (!env.DATABASE_URL) return NextResponse.json({ ok: false }, { status: 503 });
  if (!rateLimit(`chatfb:${clientIp(req)}`, 30, 60_000).ok) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  const body = (await req.json().catch(() => null)) as { sessionId?: string; messageId?: string; helpful?: boolean } | null;
  const sessionId = String(body?.sessionId ?? "");
  const messageId = String(body?.messageId ?? "");
  if (!body || typeof body.helpful !== "boolean" || !/^[0-9a-f-]{36}$/i.test(messageId) || !sessionId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const [chat] = await db.select({ id: supportChats.id }).from(supportChats).where(eq(supportChats.sessionId, sessionId)).limit(1);
  if (!chat) return NextResponse.json({ ok: false }, { status: 404 });

  const updated = await db
    .update(supportChatMessages)
    .set({ helpful: body.helpful })
    .where(and(eq(supportChatMessages.id, messageId), eq(supportChatMessages.chatId, chat.id), eq(supportChatMessages.role, "assistant")))
    .returning({ id: supportChatMessages.id });
  if (!updated.length) return NextResponse.json({ ok: false }, { status: 404 });

  if (body.helpful === false) {
    await db
      .update(supportChats)
      .set({ consecutiveMisses: sql`${supportChats.consecutiveMisses} + 1` })
      .where(eq(supportChats.id, chat.id));
  }
  return NextResponse.json({ ok: true });
}
