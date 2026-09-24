import "server-only";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { getResend } from "@/lib/mail/resend";
import { captureError } from "@/lib/observability";
import { addMessage, createTicket, getTicketByNumber } from "@/lib/support/tickets";
import {
  extractSenderEmail,
  extractSenderName,
  isAutoReply,
  stripQuotedReply,
  ticketNumberFromMail,
} from "@/lib/support/inbound-parse";
import type { TicketStatus } from "@/lib/support/ticket-model";

export type InboundOutcome =
  | "duplicate"
  | "auto_reply_ignored"
  | "no_sender"
  | "empty"
  | "reply_added"
  | "sender_mismatch_new_ticket"
  | "new_ticket"
  | "failed";

/**
 * Handle one Resend `email.received` event: append to the ticket named in the
 * subject / plus-address when the sender is the ticket's requester, otherwise
 * open a new ticket. Idempotent per email id (Resend retries webhooks).
 */
export async function processInboundEmail(emailId: string): Promise<InboundOutcome> {
  const [claimed] = await db
    .insert(events)
    .values({ type: "support_inbound_mail", dedupeKey: `inbound:${emailId}`, props: {} })
    .onConflictDoNothing({ target: events.dedupeKey })
    .returning({ id: events.id });
  if (!claimed) return "duplicate";

  try {
    const resend = getResend();
    if (!resend) return "failed";
    const { data: mail, error } = await resend.emails.receiving.get(emailId);
    if (error || !mail) throw new Error(`receiving.get failed: ${error?.message ?? "no data"}`);

    if (isAutoReply(mail.headers, mail.from)) return "auto_reply_ignored";
    const sender = extractSenderEmail(mail.from);
    if (!sender) return "no_sender";

    const rawText = mail.text ?? mail.html?.replace(/<style[\s\S]*?<\/style>|<[^>]+>/g, " ").replace(/\s+/g, " ") ?? "";
    let body = stripQuotedReply(rawText);
    if (!body.trim()) return "empty";
    if (mail.attachments.length) body += `\n\n[${mail.attachments.length} bijlage(n) in de e-mail zijn niet overgenomen — upload ze in je ticket.]`;

    const number = ticketNumberFromMail(mail.subject ?? "", mail.to ?? []);
    const ticket = number ? await getTicketByNumber(number) : null;

    // Only the requester may write into an existing ticket by mail, and never into a closed one.
    if (ticket && ticket.requesterEmail === sender && (ticket.status as TicketStatus) !== "gesloten") {
      await addMessage({ ticketId: ticket.id, authorType: "klant", authorName: ticket.requesterName, body });
      return "reply_added";
    }

    const created = await createTicket({
      subject: (mail.subject ?? "Vraag per e-mail").replace(/^(re|fw|fwd|aw|doorst):\s*/gi, "").trim() || "Vraag per e-mail",
      body,
      category: "overig",
      source: "mail",
      requesterName: extractSenderName(mail.from),
      requesterEmail: sender,
    });
    if (!created.ok) return "failed";
    return ticket ? "sender_mismatch_new_ticket" : "new_ticket";
  } catch (err) {
    captureError("support/inbound", err);
    return "failed";
  }
}
