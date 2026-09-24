import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSalonOwner } from "@/lib/auth/dal";
import { getTicketForSalon, listMessages } from "@/lib/support/tickets";
import { categoryLabel, formatTicketNumber, isClosed, type TicketStatus } from "@/lib/support/ticket-model";
import { TicketThread } from "@/components/support/ticket-thread";
import { TicketReplyForm } from "@/components/support/ticket-reply-form";
import { StatusBadge } from "@/components/support/ticket-badges";
import { CsatForm } from "@/components/support/csat-form";

export const metadata: Metadata = { title: "Ticket" };

export default async function SalonTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireSalonOwner();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  // Scoped by salonId: another salon's ticket id simply 404s.
  const ticket = await getTicketForSalon(id, user.salonId);
  if (!ticket) notFound();

  const messages = await listMessages(ticket.id, { includeInternal: false });
  const status = ticket.status as TicketStatus;
  const dateFmt = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });

  return (
    <div className="max-w-3xl">
      <Link href="/dashboard/support" className="mb-md inline-block text-label-md text-on-surface-variant hover:text-primary">
        ← Support
      </Link>
      <div className="mb-lg flex flex-wrap items-start justify-between gap-sm">
        <div>
          <div className="text-label-md text-on-surface-variant">
            {formatTicketNumber(ticket.ticketNumber)} · {categoryLabel(ticket.category)}
          </div>
          <h1 className="dash-h1 text-headline-lg text-on-surface">{ticket.subject}</h1>
          {!ticket.firstResponseAt && !isClosed(status) && ticket.slaDueAt && (
            <p className="mt-xs text-label-md text-on-surface-variant">Streefreactie uiterlijk {dateFmt.format(ticket.slaDueAt)}</p>
          )}
        </div>
        <StatusBadge status={status} customerFacing />
      </div>

      <TicketThread messages={messages} viewer="klant" />

      <div className="mt-lg space-y-md">
        {isClosed(status) && <CsatForm token={ticket.guestToken} existingScore={ticket.csatScore} />}
        {status === "gesloten" ? (
          <p className="rounded-xl bg-surface-container-low p-md text-center text-body-md text-on-surface-variant">
            Dit ticket is gesloten. <Link href="/dashboard/support/nieuw" className="text-primary underline">Maak een nieuw ticket</Link> voor een nieuwe vraag.
          </p>
        ) : (
          <TicketReplyForm ticketId={ticket.id} />
        )}
      </div>
    </div>
  );
}
