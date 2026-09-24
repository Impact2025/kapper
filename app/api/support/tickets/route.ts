import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { supportChatMessages, supportChats } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { getSupportActor } from "@/lib/support/actor";
import { clientIp, rateLimit } from "@/lib/support/rate-limit";
import { createTicket } from "@/lib/support/tickets";
import { ticketUrlForGuest } from "@/lib/support/emails";
import { TICKET_CATEGORY_IDS, formatTicketNumber } from "@/lib/support/ticket-model";
import { isAllowedAttachmentUrl } from "@/lib/support/attachments";
import { captureError } from "@/lib/observability";

export const runtime = "nodejs";

const attachmentSchema = z.object({
  url: z.string().url().max(600),
  name: z.string().min(1).max(200),
  size: z.number().int().min(0).max(10 * 1024 * 1024),
  type: z.string().max(100),
});

const schema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().max(200).optional(),
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(5).max(5000),
  category: z.enum(TICKET_CATEGORY_IDS).default("overig"),
  attachments: z.array(attachmentSchema).max(3).default([]),
  chatSessionId: z.string().regex(/^[a-zA-Z0-9_-]{16,64}$/).optional(),
  /** Honeypot: real users never fill this hidden field. */
  website: z.string().max(500).optional(),
});

/**
 * One ticket endpoint for all entry points: the /contact form (guest), the
 * chat's "maak een ticket" button and the salon dashboard. For a logged-in
 * salon owner the identity and SLA tier come from the session, never the body.
 */
export async function POST(req: Request) {
  if (!env.DATABASE_URL) {
    return NextResponse.json({ error: "Tickets zijn tijdelijk niet beschikbaar. Mail ons via hallo@kappersassistent.nl." }, { status: 503 });
  }
  const ip = clientIp(req);
  const rl = rateLimit(`ticket:${ip}`, 5, 3_600_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Je hebt recent al meerdere tickets aangemaakt. Probeer het later opnieuw of mail ons." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Controleer je gegevens." }, { status: 422 });
  }
  const data = parsed.data;
  // Honeypot tripped → pretend success so bots learn nothing.
  if (data.website) return NextResponse.json({ ok: true, ticketNumber: "KA-00000" });

  const actor = await getSupportActor();
  const name = actor.name ?? data.name;
  const email = actor.email ?? data.email;
  if (!name || !email) {
    return NextResponse.json({ error: "Naam en e-mailadres zijn verplicht." }, { status: 422 });
  }
  if (!data.attachments.every((a) => isAllowedAttachmentUrl(a.url))) {
    return NextResponse.json({ error: "Ongeldige bijlage." }, { status: 422 });
  }

  try {
    // Optionally attach the chat transcript so the agent has full context.
    let message = data.message;
    let chatId: string | null = null;
    if (data.chatSessionId) {
      const [chat] = await db.select().from(supportChats).where(eq(supportChats.sessionId, data.chatSessionId)).limit(1);
      const allowed = chat && (!chat.salonId || chat.salonId === (actor.salon?.id ?? null));
      if (chat && allowed) {
        chatId = chat.id;
        const rows = await db
          .select({ role: supportChatMessages.role, content: supportChatMessages.content })
          .from(supportChatMessages)
          .where(eq(supportChatMessages.chatId, chat.id))
          .orderBy(asc(supportChatMessages.createdAt));
        const transcript = rows.map((m) => `${m.role === "user" ? "Klant" : "AI-assistent"}: ${m.content}`).join("\n");
        message = `${data.message}\n\n— Chatgeschiedenis —\n${transcript}`.slice(0, 9000);
      }
    }

    const source = chatId ? "chat" : actor.salon && req.headers.get("referer")?.includes("/dashboard") ? "dashboard" : "formulier";
    const result = await createTicket({
      subject: data.subject,
      body: message,
      category: data.category,
      source,
      requesterName: name,
      requesterEmail: email,
      salon: actor.salon,
      userId: actor.userId,
      chatId,
      attachments: data.attachments,
    });
    if (!result.ok) {
      const rateLimited = result.error === "rate_limited";
      return NextResponse.json(
        { error: rateLimited ? "Er zijn al meerdere tickets met dit e-mailadres aangemaakt. Wacht een uur of mail ons." : "Ticket aanmaken mislukt." },
        { status: rateLimited ? 429 : 500 },
      );
    }

    if (chatId) {
      await db.update(supportChats).set({ ticketId: result.ticket.id }).where(eq(supportChats.id, chatId));
    }

    return NextResponse.json({
      ok: true,
      ticketNumber: formatTicketNumber(result.ticket.ticketNumber),
      // Salons continue in their dashboard; guests via their private link.
      // Relative on purpose: works on preview/dev hosts too. The absolute link is what we e-mail.
      url: actor.salon ? `/dashboard/support/${result.ticket.id}` : `/support/${result.ticket.guestToken}`,
      guestUrl: ticketUrlForGuest(result.ticket.guestToken),
    });
  } catch (err) {
    captureError("support/tickets", err);
    return NextResponse.json({ error: "Er ging iets mis. Probeer het opnieuw." }, { status: 500 });
  }
}
