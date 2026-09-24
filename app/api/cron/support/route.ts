import { NextResponse } from "next/server";
import { lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { helpSearchMisses, supportChats } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { autoCloseStaleTickets } from "@/lib/support/tickets";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Chat logs are kept 30 days (privacy statement); search misses are only a content backlog. */
const CHAT_RETENTION_DAYS = 30;
const MISS_RETENTION_DAYS = 90;

function authorized(req: Request): boolean {
  if (!env.CRON_SECRET) return false;
  return req.headers.get("authorization") === `Bearer ${env.CRON_SECRET}`;
}

/**
 * Daily support housekeeping:
 *  - "wacht op klant" > 7 dagen → opgelost; "opgelost" > 7 dagen → gesloten
 *  - support-chats (met berichten, via cascade) ouder dan 30 dagen verwijderen
 *  - onbeantwoorde zoekopdrachten ouder dan 90 dagen opruimen
 */
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tickets = await autoCloseStaleTickets();
  const chatCutoff = new Date(Date.now() - CHAT_RETENTION_DAYS * 86_400_000);
  const missCutoff = new Date(Date.now() - MISS_RETENTION_DAYS * 86_400_000);
  const deletedChats = await db.delete(supportChats).where(lt(supportChats.createdAt, chatCutoff)).returning({ id: supportChats.id });
  const deletedMisses = await db.delete(helpSearchMisses).where(lt(helpSearchMisses.createdAt, missCutoff)).returning({ id: helpSearchMisses.id });

  return NextResponse.json({ ...tickets, deletedChats: deletedChats.length, deletedMisses: deletedMisses.length });
}
