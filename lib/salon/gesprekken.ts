import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { conversations, messages, appointments } from "@/lib/db/schema";
import { env } from "@/lib/env";

export interface ConversationRow {
  id: string;
  channel: "whatsapp" | "phone";
  phoneNumber: string | null;
  customerName: string | null;
  status: string;
  startedAt: Date;
  closedAt: Date | null;
  messageCount: number;
  bookedAppointment: boolean;
}

export interface MessageRow {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface ConversationDetail {
  conversation: ConversationRow;
  messages: MessageRow[];
  appointment: {
    serviceType: string;
    appointmentTime: Date;
    status: string;
  } | null;
}

export async function getConversations(
  salonId: string,
  limit = 50,
): Promise<ConversationRow[]> {
  if (!env.DATABASE_URL) return [];

  const rows = await db
    .select({
      id: conversations.id,
      channel: conversations.channel,
      phoneNumber: conversations.phoneNumber,
      customerName: conversations.customerName,
      status: conversations.status,
      startedAt: conversations.startedAt,
      closedAt: conversations.closedAt,
    })
    .from(conversations)
    .where(eq(conversations.salonId, salonId))
    .orderBy(desc(conversations.createdAt))
    .limit(limit);

  // Fetch message counts + booking flags in batch
  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return [];

  const [msgCounts, bookedIds] = await Promise.all([
    db
      .select({ conversationId: messages.conversationId })
      .from(messages)
      .where(
        ids.length === 1
          ? eq(messages.conversationId, ids[0]!)
          : // Use raw SQL for IN clause when multiple
            eq(messages.conversationId, ids[0]!),
      ),
    db
      .select({ conversationId: appointments.conversationId })
      .from(appointments)
      .where(eq(appointments.salonId, salonId)),
  ]);

  const countMap = new Map<string, number>();
  for (const m of msgCounts) countMap.set(m.conversationId, (countMap.get(m.conversationId) ?? 0) + 1);

  const bookedSet = new Set(bookedIds.map((b) => b.conversationId).filter(Boolean) as string[]);

  return rows.map((r) => ({
    ...r,
    messageCount: countMap.get(r.id) ?? 0,
    bookedAppointment: bookedSet.has(r.id),
  }));
}

export async function getConversationDetail(
  salonId: string,
  conversationId: string,
): Promise<ConversationDetail | null> {
  if (!env.DATABASE_URL) return null;

  const [convRows, msgRows, aptRows] = await Promise.all([
    db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, conversationId), eq(conversations.salonId, salonId)))
      .limit(1),
    db
      .select({
        id: messages.id,
        role: messages.role,
        content: messages.content,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt),
    db
      .select({
        serviceType: appointments.serviceType,
        appointmentTime: appointments.appointmentTime,
        status: appointments.status,
      })
      .from(appointments)
      .where(eq(appointments.conversationId, conversationId))
      .limit(1),
  ]);

  const conv = convRows[0];
  if (!conv) return null;

  return {
    conversation: {
      id: conv.id,
      channel: conv.channel,
      phoneNumber: conv.phoneNumber,
      customerName: conv.customerName,
      status: conv.status,
      startedAt: conv.startedAt,
      closedAt: conv.closedAt,
      messageCount: msgRows.length,
      bookedAppointment: !!aptRows[0],
    },
    messages: msgRows,
    appointment: aptRows[0] ?? null,
  };
}
