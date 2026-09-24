import "server-only";
import { and, avg, count, desc, gte, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { helpFeedback, helpSearchMisses, supportChatMessages, supportChats, supportTickets } from "@/lib/db/schema";
import { env } from "@/lib/env";

export interface SupportInsights {
  days: number;
  tickets: { total: number; avgFirstResponseMinutes: number | null; slaBreachRate: number | null; avgCsat: number | null; csatCount: number };
  chat: { chats: number; ticketsFromChat: number; deflectionRate: number | null; thumbsDown: number; thumbsUp: number };
  unanswered: { query: string; n: number }[];
  weakArticles: { slug: string; down: number; up: number; comments: string[] }[];
}

/** Deflectie = aandeel chats dat NIET in een ticket eindigde. */
export function deflectionRate(chats: number, ticketsFromChat: number): number | null {
  return chats > 0 ? Math.round(((chats - ticketsFromChat) / chats) * 100) : null;
}

export async function getSupportInsights(days = 30): Promise<SupportInsights> {
  const empty: SupportInsights = {
    days,
    tickets: { total: 0, avgFirstResponseMinutes: null, slaBreachRate: null, avgCsat: null, csatCount: 0 },
    chat: { chats: 0, ticketsFromChat: 0, deflectionRate: null, thumbsDown: 0, thumbsUp: 0 },
    unanswered: [],
    weakArticles: [],
  };
  if (!env.DATABASE_URL) return empty;
  const since = new Date(Date.now() - days * 86_400_000);

  const [t] = await db
    .select({
      total: count(),
      avgFirst: sql<number | null>`avg(extract(epoch from (${supportTickets.firstResponseAt} - ${supportTickets.createdAt})) / 60)`,
      answered: sql<number>`count(${supportTickets.firstResponseAt})::int`,
      breached: sql<number>`count(*) filter (where ${supportTickets.firstResponseAt} is not null and ${supportTickets.slaDueAt} is not null and ${supportTickets.firstResponseAt} > ${supportTickets.slaDueAt})::int`,
      csat: avg(supportTickets.csatScore),
      csatN: sql<number>`count(${supportTickets.csatScore})::int`,
    })
    .from(supportTickets)
    .where(gte(supportTickets.createdAt, since));

  const [c] = await db
    .select({ chats: count(), withTicket: sql<number>`count(${supportChats.ticketId})::int` })
    .from(supportChats)
    .where(gte(supportChats.createdAt, since));

  const [fb] = await db
    .select({
      down: sql<number>`count(*) filter (where ${supportChatMessages.helpful} = false)::int`,
      up: sql<number>`count(*) filter (where ${supportChatMessages.helpful} = true)::int`,
    })
    .from(supportChatMessages)
    .where(and(gte(supportChatMessages.createdAt, since), isNotNull(supportChatMessages.helpful)));

  const unanswered = await db
    .select({ query: sql<string>`lower(${helpSearchMisses.query})`, n: count() })
    .from(helpSearchMisses)
    .where(gte(helpSearchMisses.createdAt, since))
    .groupBy(sql`lower(${helpSearchMisses.query})`)
    .orderBy(desc(count()))
    .limit(15);

  const weak = await db
    .select({
      slug: helpFeedback.articleSlug,
      down: sql<number>`count(*) filter (where ${helpFeedback.helpful} = false)::int`,
      up: sql<number>`count(*) filter (where ${helpFeedback.helpful} = true)::int`,
      comments: sql<string[]>`coalesce(array_agg(${helpFeedback.comment}) filter (where ${helpFeedback.comment} is not null and ${helpFeedback.helpful} = false), '{}')`,
    })
    .from(helpFeedback)
    .where(gte(helpFeedback.createdAt, since))
    .groupBy(helpFeedback.articleSlug)
    .having(sql`count(*) filter (where ${helpFeedback.helpful} = false) > 0`)
    .orderBy(desc(sql`count(*) filter (where ${helpFeedback.helpful} = false)`))
    .limit(10);

  const chats = Number(c?.chats ?? 0);
  const withTicket = Number(c?.withTicket ?? 0);
  return {
    days,
    tickets: {
      total: Number(t?.total ?? 0),
      avgFirstResponseMinutes: t?.avgFirst != null ? Math.round(Number(t.avgFirst)) : null,
      slaBreachRate: Number(t?.answered ?? 0) > 0 ? Math.round((Number(t?.breached ?? 0) / Number(t?.answered ?? 1)) * 100) : null,
      avgCsat: t?.csat != null ? Math.round(Number(t.csat) * 10) / 10 : null,
      csatCount: Number(t?.csatN ?? 0),
    },
    chat: {
      chats,
      ticketsFromChat: withTicket,
      deflectionRate: deflectionRate(chats, withTicket),
      thumbsDown: Number(fb?.down ?? 0),
      thumbsUp: Number(fb?.up ?? 0),
    },
    unanswered: unanswered.map((u) => ({ query: u.query, n: Number(u.n) })),
    weakArticles: weak.map((w) => ({ slug: w.slug, down: Number(w.down), up: Number(w.up), comments: w.comments ?? [] })),
  };
}
