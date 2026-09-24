import "server-only";
import { randomBytes } from "node:crypto";
import { and, asc, desc, eq, gte, ilike, inArray, lt, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { salons, supportTickets, ticketMessages, users } from "@/lib/db/schema";
import { env, publicEnv } from "@/lib/env";
import { sendEmail } from "@/lib/mail/resend";
import { captureError } from "@/lib/observability";
import { trackEvent } from "@/lib/analytics/track";
import {
  AUTO_CLOSE_AFTER_DAYS,
  STATUS_LABEL,
  canTransition,
  categoryLabel,
  defaultPriority,
  firstResponseDeadline,
  formatTicketNumber,
  isClosed,
  slaTier,
  statusAfterMessage,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
  SLA_HOURS,
} from "@/lib/support/ticket-model";
import {
  ticketConfirmationEmail,
  ticketNotifyStaffEmail,
  ticketReplyEmail,
  ticketStatusEmail,
  ticketSubject,
  ticketUrlForGuest,
} from "@/lib/support/emails";

export type TicketRow = typeof supportTickets.$inferSelect;
export type TicketMessageRow = typeof ticketMessages.$inferSelect;
export type Attachment = { url: string; name: string; size: number; type: string };

/** Max tickets one e-mail address may open per hour (spam / abuse brake). */
export const MAX_TICKETS_PER_EMAIL_PER_HOUR = 5;

function staffRecipient(): string {
  return env.SUPPORT_RECIPIENT ?? env.REPORT_RECIPIENT;
}

function dueLabel(tier: keyof typeof SLA_HOURS): string {
  const h = SLA_HOURS[tier];
  return h === 1 ? "binnen 1 uur" : h < 24 ? `binnen ${h} uur` : "binnen 1 werkdag";
}

async function safeSend(input: Parameters<typeof sendEmail>[0]): Promise<void> {
  try {
    await sendEmail(input);
  } catch (err) {
    captureError("support/email", err);
  }
}

/* ------------------------------ create ------------------------------ */

export interface CreateTicketInput {
  subject: string;
  body: string;
  category: TicketCategory;
  source: "formulier" | "chat" | "dashboard" | "mail";
  requesterName: string;
  requesterEmail: string;
  salon?: { id: string; plan: string } | null;
  userId?: string | null;
  chatId?: string | null;
  attachments?: Attachment[];
}

export type CreateTicketResult =
  | { ok: true; ticket: { id: string; ticketNumber: number; guestToken: string } }
  | { ok: false; error: "rate_limited" | "no_db" };

export async function createTicket(input: CreateTicketInput): Promise<CreateTicketResult> {
  if (!env.DATABASE_URL) return { ok: false, error: "no_db" };
  const email = input.requesterEmail.trim().toLowerCase();

  const [recent] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(supportTickets)
    .where(and(eq(supportTickets.requesterEmail, email), gte(supportTickets.createdAt, new Date(Date.now() - 3_600_000))));
  if (Number(recent?.n ?? 0) >= MAX_TICKETS_PER_EMAIL_PER_HOUR) return { ok: false, error: "rate_limited" };

  const tier = slaTier(input.salon?.plan);
  const priority: TicketPriority = defaultPriority(input.category, input.salon?.plan);
  const now = new Date();
  const guestToken = randomBytes(24).toString("base64url");

  const [ticket] = await db
    .insert(supportTickets)
    .values({
      subject: input.subject.trim().slice(0, 200),
      category: input.category,
      priority,
      source: input.source,
      salonId: input.salon?.id ?? null,
      userId: input.userId ?? null,
      requesterName: input.requesterName.trim().slice(0, 120),
      requesterEmail: email,
      guestToken,
      slaTier: tier,
      slaDueAt: firstResponseDeadline(now, tier, priority),
      chatId: input.chatId ?? null,
    })
    .returning({ id: supportTickets.id, ticketNumber: supportTickets.ticketNumber });
  if (!ticket) return { ok: false, error: "no_db" };

  await db.insert(ticketMessages).values({
    ticketId: ticket.id,
    authorType: "klant",
    authorUserId: input.userId ?? null,
    authorName: input.requesterName,
    body: input.body.trim(),
    attachments: input.attachments ?? [],
  });

  const url = ticketUrlForGuest(guestToken);
  await safeSend({
    to: email,
    replyTo: env.SUPPORT_INBOUND_ADDRESS,
    subject: ticketSubject(ticket.ticketNumber, `We hebben je vraag ontvangen`),
    html: ticketConfirmationEmail({
      name: input.requesterName,
      ticketNumber: ticket.ticketNumber,
      subject: input.subject,
      url,
      dueLabel: dueLabel(tier),
    }),
  });
  await safeSend({
    to: staffRecipient(),
    replyTo: email,
    subject: ticketSubject(ticket.ticketNumber, input.subject),
    html: ticketNotifyStaffEmail({
      ticketNumber: ticket.ticketNumber,
      subject: input.subject,
      requester: `${input.requesterName} <${email}>`,
      category: categoryLabel(input.category),
      priority,
      body: input.body,
      adminUrl: `${publicEnv.NEXT_PUBLIC_SITE_URL}/admin/support/${ticket.id}`,
      kind: "nieuw",
    }),
  });

  await trackEvent({
    type: "support_ticket_created",
    salonId: input.salon?.id ?? null,
    props: { category: input.category, source: input.source, tier },
  });

  return { ok: true, ticket: { id: ticket.id, ticketNumber: ticket.ticketNumber, guestToken } };
}

/* ------------------------------ reads ------------------------------ */

export async function getTicketByNumber(n: number): Promise<TicketRow | null> {
  if (!env.DATABASE_URL) return null;
  const [row] = await db.select().from(supportTickets).where(eq(supportTickets.ticketNumber, n)).limit(1);
  return row ?? null;
}

export async function getTicketById(id: string): Promise<TicketRow | null> {
  if (!env.DATABASE_URL) return null;
  const [row] = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
  return row ?? null;
}

export async function getTicketByGuestToken(token: string): Promise<TicketRow | null> {
  if (!env.DATABASE_URL || token.length < 16) return null;
  const [row] = await db.select().from(supportTickets).where(eq(supportTickets.guestToken, token)).limit(1);
  return row ?? null;
}

/** A salon owner may only ever see tickets that belong to their own salon. */
export async function getTicketForSalon(id: string, salonId: string): Promise<TicketRow | null> {
  if (!env.DATABASE_URL) return null;
  const [row] = await db
    .select()
    .from(supportTickets)
    .where(and(eq(supportTickets.id, id), eq(supportTickets.salonId, salonId)))
    .limit(1);
  return row ?? null;
}

export async function listMessages(ticketId: string, opts: { includeInternal: boolean }): Promise<TicketMessageRow[]> {
  if (!env.DATABASE_URL) return [];
  const rows = await db
    .select()
    .from(ticketMessages)
    .where(eq(ticketMessages.ticketId, ticketId))
    .orderBy(asc(ticketMessages.createdAt));
  return opts.includeInternal ? rows : rows.filter((m) => m.authorType !== "notitie");
}

export async function listSalonTickets(salonId: string): Promise<TicketRow[]> {
  if (!env.DATABASE_URL) return [];
  return db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.salonId, salonId))
    .orderBy(desc(supportTickets.updatedAt))
    .limit(100);
}

export interface AdminTicketFilter {
  status?: TicketStatus | "actief";
  category?: string;
  assignedTo?: string | "none";
  q?: string;
}

export interface AdminTicketRow extends TicketRow {
  salonName: string | null;
  assigneeName: string | null;
}

export async function listAdminTickets(filter: AdminTicketFilter = {}): Promise<AdminTicketRow[]> {
  if (!env.DATABASE_URL) return [];
  const conds = [];
  if (filter.status === "actief") {
    conds.push(inArray(supportTickets.status, ["open", "in_behandeling", "wacht_op_klant"]));
  } else if (filter.status) {
    conds.push(eq(supportTickets.status, filter.status));
  }
  if (filter.category) conds.push(eq(supportTickets.category, filter.category));
  if (filter.assignedTo === "none") conds.push(sql`${supportTickets.assignedTo} is null`);
  else if (filter.assignedTo) conds.push(eq(supportTickets.assignedTo, filter.assignedTo));
  if (filter.q) {
    const like = `%${filter.q.replace(/[%_]/g, "")}%`;
    conds.push(or(ilike(supportTickets.subject, like), ilike(supportTickets.requesterEmail, like), ilike(supportTickets.requesterName, like)));
  }
  const rows = await db
    .select({ t: supportTickets, salonName: salons.name, assigneeName: users.name })
    .from(supportTickets)
    .leftJoin(salons, eq(salons.id, supportTickets.salonId))
    .leftJoin(users, eq(users.id, supportTickets.assignedTo))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(asc(supportTickets.slaDueAt), desc(supportTickets.createdAt))
    .limit(200);
  return rows.map((r) => ({ ...r.t, salonName: r.salonName, assigneeName: r.assigneeName }));
}

export async function ticketCounts(): Promise<Record<string, number>> {
  if (!env.DATABASE_URL) return {};
  const rows = await db
    .select({ status: supportTickets.status, n: sql<number>`count(*)::int` })
    .from(supportTickets)
    .groupBy(supportTickets.status);
  return Object.fromEntries(rows.map((r) => [r.status, Number(r.n)]));
}

/* ------------------------------ writes ------------------------------ */

export type ActorType = "klant" | "agent";

export interface AddMessageInput {
  ticketId: string;
  authorType: ActorType | "notitie";
  authorUserId?: string | null;
  authorName: string;
  body: string;
  attachments?: Attachment[];
}

export async function addMessage(input: AddMessageInput): Promise<{ ok: boolean }> {
  const ticket = await getTicketById(input.ticketId);
  if (!ticket) return { ok: false };
  const body = input.body.trim();
  if (!body) return { ok: false };

  await db.insert(ticketMessages).values({
    ticketId: ticket.id,
    authorType: input.authorType,
    authorUserId: input.authorUserId ?? null,
    authorName: input.authorName,
    body,
    attachments: input.attachments ?? [],
  });

  // Internal notes never change state or notify anyone.
  if (input.authorType === "notitie") return { ok: true };

  const current = ticket.status as TicketStatus;
  const next = statusAfterMessage(current, input.authorType);
  const now = new Date();
  await db
    .update(supportTickets)
    .set({
      status: next,
      updatedAt: now,
      resolvedAt: next === "open" && isClosed(current) ? null : ticket.resolvedAt,
      firstResponseAt: input.authorType === "agent" && !ticket.firstResponseAt ? now : ticket.firstResponseAt,
    })
    .where(eq(supportTickets.id, ticket.id));

  if (input.authorType === "agent") {
    await safeSend({
      to: ticket.requesterEmail,
      replyTo: env.SUPPORT_INBOUND_ADDRESS,
      subject: ticketSubject(ticket.ticketNumber, ticket.subject),
      html: ticketReplyEmail({
        name: ticket.requesterName,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        agentName: input.authorName,
        body,
        url: ticketUrlForGuest(ticket.guestToken),
      }),
    });
  } else {
    await safeSend({
      to: staffRecipient(),
      replyTo: ticket.requesterEmail,
      subject: ticketSubject(ticket.ticketNumber, ticket.subject),
      html: ticketNotifyStaffEmail({
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        requester: `${ticket.requesterName} <${ticket.requesterEmail}>`,
        category: categoryLabel(ticket.category),
        priority: ticket.priority,
        body,
        adminUrl: `${publicEnv.NEXT_PUBLIC_SITE_URL}/admin/support/${ticket.id}`,
        kind: "reactie",
      }),
    });
  }
  return { ok: true };
}

export async function setTicketStatus(ticketId: string, to: TicketStatus, actorName: string): Promise<{ ok: boolean }> {
  const ticket = await getTicketById(ticketId);
  if (!ticket) return { ok: false };
  const from = ticket.status as TicketStatus;
  if (!canTransition(from, to)) return { ok: false };
  if (from === to) return { ok: true };

  const now = new Date();
  await db
    .update(supportTickets)
    .set({
      status: to,
      updatedAt: now,
      resolvedAt: to === "opgelost" || to === "gesloten" ? (ticket.resolvedAt ?? now) : null,
    })
    .where(eq(supportTickets.id, ticketId));
  await db.insert(ticketMessages).values({
    ticketId,
    authorType: "systeem",
    authorName: actorName,
    body: `Status gewijzigd naar “${STATUS_LABEL[to]}”.`,
  });

  if (to === "opgelost") {
    await safeSend({
      to: ticket.requesterEmail,
      subject: ticketSubject(ticket.ticketNumber, ticket.subject),
      html: ticketStatusEmail({
        name: ticket.requesterName,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        headline: "Je ticket is opgelost",
        message: `We denken dat je vraag is opgelost. Klopt dat niet? Reageer dan in je ticket; dan pakken we het weer op. Zonder reactie sluiten we het ticket na ${AUTO_CLOSE_AFTER_DAYS} dagen automatisch.\n\nBen je tevreden met de hulp? Laat het ons weten in je ticket — dat helpt ons verbeteren.`,
        url: ticketUrlForGuest(ticket.guestToken),
      }),
    });
  }
  return { ok: true };
}

export async function assignTicket(ticketId: string, userId: string | null): Promise<void> {
  await db.update(supportTickets).set({ assignedTo: userId }).where(eq(supportTickets.id, ticketId));
}

export async function setTicketPriority(ticketId: string, priority: TicketPriority): Promise<void> {
  await db.update(supportTickets).set({ priority }).where(eq(supportTickets.id, ticketId));
}

export async function submitCsat(token: string, score: number, comment: string | null): Promise<boolean> {
  const ticket = await getTicketByGuestToken(token);
  if (!ticket || !isClosed(ticket.status as TicketStatus)) return false;
  if (!Number.isInteger(score) || score < 1 || score > 5) return false;
  await db
    .update(supportTickets)
    .set({ csatScore: score, csatComment: comment?.trim().slice(0, 1000) || null })
    .where(eq(supportTickets.id, ticket.id));
  await trackEvent({ type: "support_csat", salonId: ticket.salonId, props: { score } });
  return true;
}

/* ------------------------------ housekeeping ------------------------------ */

/**
 * Cron-driven lifecycle: "wacht op klant" for 7 days → opgelost, "opgelost"
 * for 7 days without reply → gesloten. Returns how many tickets moved.
 */
export async function autoCloseStaleTickets(now: Date = new Date()): Promise<{ resolved: number; closed: number }> {
  if (!env.DATABASE_URL) return { resolved: 0, closed: 0 };
  const cutoff = new Date(now.getTime() - AUTO_CLOSE_AFTER_DAYS * 86_400_000);

  const waiting = await db
    .select({ id: supportTickets.id })
    .from(supportTickets)
    .where(and(eq(supportTickets.status, "wacht_op_klant"), lt(supportTickets.updatedAt, cutoff)));
  for (const t of waiting) await setTicketStatus(t.id, "opgelost", "Automatisch (geen reactie ontvangen)");

  const solved = await db
    .select({ id: supportTickets.id })
    .from(supportTickets)
    .where(and(eq(supportTickets.status, "opgelost"), lt(supportTickets.updatedAt, cutoff)));
  for (const t of solved) await setTicketStatus(t.id, "gesloten", "Automatisch (opgelost, geen reactie)");

  return { resolved: waiting.length, closed: solved.length };
}

export { formatTicketNumber };
