import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTicketByGuestToken, listMessages } from "@/lib/support/tickets";
import { categoryLabel, formatTicketNumber, isClosed, type TicketStatus } from "@/lib/support/ticket-model";
import { TicketThread } from "@/components/support/ticket-thread";
import { TicketReplyForm } from "@/components/support/ticket-reply-form";
import { StatusBadge } from "@/components/support/ticket-badges";
import { CsatForm } from "@/components/support/csat-form";

// Private per-ticket link: never indexed, never cached.
export const metadata: Metadata = {
  title: "Jouw ticket",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function GuestTicketPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ticket = await getTicketByGuestToken(token);
  if (!ticket) notFound();

  const messages = await listMessages(ticket.id, { includeInternal: false });
  const status = ticket.status as TicketStatus;
  const closed = status === "gesloten";

  return (
    <section className="bg-surface py-xl">
      <div className="mx-auto max-w-3xl px-margin-mobile md:px-xl">
        <Link href="/help" className="mb-md inline-block text-label-md text-on-surface-variant hover:text-primary">
          ← Hulpcentrum
        </Link>
        <div className="mb-lg flex flex-wrap items-start justify-between gap-sm">
          <div>
            <div className="text-label-md text-on-surface-variant">
              {formatTicketNumber(ticket.ticketNumber)} · {categoryLabel(ticket.category)}
            </div>
            <h1 className="mkt-h1 text-display-lg text-on-surface">{ticket.subject}</h1>
          </div>
          <StatusBadge status={status} customerFacing />
        </div>

        <TicketThread messages={messages} viewer="klant" />

        <div className="mt-lg space-y-md">
          {isClosed(status) && <CsatForm token={token} existingScore={ticket.csatScore} />}
          {closed ? (
            <p className="rounded-xl bg-surface-container-low p-md text-center text-body-md text-on-surface-variant">
              Dit ticket is gesloten. Heb je een nieuwe vraag? <Link href="/contact" className="text-primary underline">Maak een nieuw ticket</Link>.
            </p>
          ) : (
            <TicketReplyForm token={token} placeholder={status === "wacht_op_klant" ? "We wachten op jouw antwoord…" : "Voeg iets toe of stel een vervolgvraag…"} />
          )}
        </div>
      </div>
    </section>
  );
}
