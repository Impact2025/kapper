import type { Metadata } from "next";
import Link from "next/link";
import { requireSalonOwner } from "@/lib/auth/dal";
import { getSalonPlan } from "@/lib/salon/plan";
import { listSalonTickets } from "@/lib/support/tickets";
import { SLA_HOURS, categoryLabel, formatTicketNumber, slaTier, type TicketStatus } from "@/lib/support/ticket-model";
import { PageHeader, Card, EmptyState } from "@/components/salon/dash-ui";
import { StatusBadge } from "@/components/support/ticket-badges";
import { OpenChatButton } from "@/components/help/open-chat-button";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Support" };

const dateFmt = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", timeZone: "Europe/Amsterdam" });

export default async function SalonSupportPage() {
  const user = await requireSalonOwner();
  const [plan, tickets] = await Promise.all([getSalonPlan(user.salonId), listSalonTickets(user.salonId)]);
  const hours = SLA_HOURS[slaTier(plan)];
  const sla = hours < 24 ? `binnen ${hours} uur` : "binnen 1 werkdag";

  return (
    <div>
      <PageHeader
        title="Support"
        subtitle={`Stel een vraag, volg je tickets en vind antwoorden. Streefreactietijd voor jouw plan: ${sla}.`}
        action={
          <Link
            href="/dashboard/support/nieuw"
            className="inline-flex items-center gap-base rounded-full bg-primary px-md py-sm text-label-md font-label-md text-on-primary transition-all hover:opacity-90"
          >
            <Icon name="add" className="text-[20px]" /> Nieuw ticket
          </Link>
        }
      />

      <div className="mb-lg grid grid-cols-1 gap-md md:grid-cols-2">
        <Card className="flex items-start gap-sm">
          <Icon name="smart_toy" className="text-primary" />
          <div>
            <div className="font-label-md text-body-md text-on-surface">Vraag het de AI-assistent</div>
            <p className="mb-sm text-label-md text-on-surface-variant">
              Direct antwoord, ook over je eigen account. Komt ze er niet uit, dan maakt ze een ticket.
            </p>
            <OpenChatButton className="px-md py-xs" />
          </div>
        </Card>
        <Card className="flex items-start gap-sm">
          <Icon name="menu_book" className="text-primary" />
          <div>
            <div className="font-label-md text-body-md text-on-surface">Hulpcentrum</div>
            <p className="mb-sm text-label-md text-on-surface-variant">Antwoorden op koppelingen, facturatie, privacy en meer.</p>
            <Link href="/help" target="_blank" className="text-label-md text-primary underline">Open het hulpcentrum</Link>
          </div>
        </Card>
      </div>

      <h2 className="dash-h2 mb-sm text-headline-md text-on-surface">Jouw tickets</h2>
      {tickets.length === 0 ? (
        <EmptyState
          icon="support_agent"
          title="Nog geen tickets"
          description="Heb je hulp nodig? Maak een ticket aan en volg hier de voortgang."
        />
      ) : (
        <div className="flex flex-col gap-xs">
          {tickets.map((t) => (
            <Link
              key={t.id}
              href={`/dashboard/support/${t.id}`}
              className="flex items-center gap-md rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-md py-sm transition-colors hover:bg-primary/5"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-label-md text-body-md text-on-surface">{t.subject}</div>
                <div className="text-label-sm text-on-surface-variant">
                  {formatTicketNumber(t.ticketNumber)} · {categoryLabel(t.category)} · bijgewerkt {dateFmt.format(t.updatedAt)}
                </div>
              </div>
              <StatusBadge status={t.status as TicketStatus} customerFacing />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
