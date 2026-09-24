import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/dal";
import { getTicketById, listMessages } from "@/lib/support/tickets";
import { getSalonWithSubscription } from "@/lib/salon/queries";
import { assignAction, setPriorityAction, setStatusAction } from "@/lib/support/actions";
import {
  PRIORITY_LABEL,
  STATUS_LABEL,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  categoryLabel,
  formatTicketNumber,
  slaState,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/support/ticket-model";
import { PageHeader, Card } from "@/components/admin/ui";
import { PriorityBadge, SlaBadge, StatusBadge } from "@/components/support/ticket-badges";
import { TicketThread } from "@/components/support/ticket-thread";
import { TicketReplyForm } from "@/components/support/ticket-reply-form";

const dateFmt = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });

export default async function AdminTicketPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("admin");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const ticket = await getTicketById(id);
  if (!ticket) notFound();

  const [messages, salon, assignee] = await Promise.all([
    listMessages(ticket.id, { includeInternal: true }),
    ticket.salonId ? getSalonWithSubscription(ticket.salonId) : Promise.resolve(null),
    ticket.assignedTo ? db.select({ name: users.name }).from(users).where(eq(users.id, ticket.assignedTo)).limit(1) : Promise.resolve([]),
  ]);
  const status = ticket.status as TicketStatus;
  const sla = slaState(ticket.slaDueAt, status, ticket.firstResponseAt);

  return (
    <div>
      <Link href="/admin/support" className="mb-md inline-block text-label-md text-on-surface-variant hover:text-primary">
        ← Alle tickets
      </Link>
      <PageHeader
        title={ticket.subject}
        subtitle={`${formatTicketNumber(ticket.ticketNumber)} · ${categoryLabel(ticket.category)} · aangemaakt ${dateFmt.format(ticket.createdAt)}`}
        action={
          <div className="flex items-center gap-xs">
            <SlaBadge state={sla} />
            <PriorityBadge priority={ticket.priority as TicketPriority} />
            <StatusBadge status={status} />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-[1fr_20rem]">
        <div className="space-y-md">
          <TicketThread messages={messages} viewer="agent" />
          {status !== "gesloten" && <TicketReplyForm ticketId={ticket.id} allowInternal customerName={ticket.requesterName} />}
        </div>

        <aside className="space-y-md">
          <Card>
            <h2 className="mb-sm text-label-md font-label-md uppercase tracking-wide text-on-surface-variant">Aanvrager</h2>
            <div className="text-body-md text-on-surface">{ticket.requesterName}</div>
            <a href={`mailto:${ticket.requesterEmail}`} className="text-label-md text-primary underline">{ticket.requesterEmail}</a>
            {salon ? (
              <dl className="mt-sm space-y-xs text-label-md">
                <div className="flex justify-between"><dt className="text-on-surface-variant">Salon</dt><dd>{salon.name}</dd></div>
                <div className="flex justify-between"><dt className="text-on-surface-variant">Plan</dt><dd className="capitalize">{salon.plan}</dd></div>
                <div className="flex justify-between"><dt className="text-on-surface-variant">Status</dt><dd>{salon.status}</dd></div>
                <div className="flex justify-between"><dt className="text-on-surface-variant">Agenda</dt><dd>{salon.agendaProvider ?? "—"}</dd></div>
              </dl>
            ) : (
              <p className="mt-sm text-label-md text-on-surface-variant">Prospect (geen account)</p>
            )}
            <p className="mt-sm text-label-sm text-on-surface-variant">Bron: {ticket.source}{ticket.chatId ? " · chat-transcript staat in het eerste bericht" : ""}</p>
          </Card>

          <Card>
            <h2 className="mb-sm text-label-md font-label-md uppercase tracking-wide text-on-surface-variant">Afhandeling</h2>
            <form action={setStatusAction.bind(null, ticket.id)} className="mb-sm flex gap-xs">
              <select name="status" defaultValue={status} className="flex-1 rounded-lg border border-outline-variant bg-white px-sm py-xs text-label-md">
                {TICKET_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
              <button className="rounded-full bg-primary px-md py-xs text-label-md text-on-primary">Zet</button>
            </form>
            <form action={setPriorityAction.bind(null, ticket.id)} className="mb-sm flex gap-xs">
              <select name="priority" defaultValue={ticket.priority} className="flex-1 rounded-lg border border-outline-variant bg-white px-sm py-xs text-label-md">
                {TICKET_PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
              </select>
              <button className="rounded-full border border-primary px-md py-xs text-label-md text-primary">Zet</button>
            </form>
            <form action={assignAction.bind(null, ticket.id)} className="flex items-center justify-between gap-xs">
              <span className="text-label-md text-on-surface-variant">Toegewezen: {assignee[0]?.name ?? "niemand"}</span>
              <div className="flex gap-xs">
                <button name="to" value="me" className="rounded-full border border-primary px-sm py-[2px] text-label-sm text-primary">Aan mij</button>
                <button name="to" value="none" className="rounded-full border border-outline-variant px-sm py-[2px] text-label-sm">Vrijgeven</button>
              </div>
            </form>
          </Card>

          <Card>
            <h2 className="mb-sm text-label-md font-label-md uppercase tracking-wide text-on-surface-variant">Tijdlijn</h2>
            <dl className="space-y-xs text-label-md">
              <div className="flex justify-between"><dt className="text-on-surface-variant">SLA-deadline</dt><dd>{ticket.slaDueAt ? dateFmt.format(ticket.slaDueAt) : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-on-surface-variant">Eerste reactie</dt><dd>{ticket.firstResponseAt ? dateFmt.format(ticket.firstResponseAt) : "nog niet"}</dd></div>
              <div className="flex justify-between"><dt className="text-on-surface-variant">Opgelost</dt><dd>{ticket.resolvedAt ? dateFmt.format(ticket.resolvedAt) : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-on-surface-variant">Tevredenheid</dt><dd>{ticket.csatScore ? `${ticket.csatScore}/5` : "—"}</dd></div>
            </dl>
            {ticket.csatComment && <p className="mt-sm rounded-lg bg-surface-container-low p-sm text-label-md">“{ticket.csatComment}”</p>}
          </Card>
        </aside>
      </div>
    </div>
  );
}
