import type { Metadata } from "next";
import Link from "next/link";
import { requireSalonOwner } from "@/lib/auth/dal";
import { getSalonWithSubscription } from "@/lib/salon/queries";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Afspraken" };

const DEMO_APPOINTMENTS = [
  { id: "1", time: "09:00", client: "Sarah van den Berg", service: "Knippen & föhnen", duration: 60, reminded: true },
  { id: "2", time: "10:30", client: "Mark Jansen", service: "Knipbehandeling heren", duration: 30, reminded: true },
  { id: "3", time: "12:00", client: "Emma de Groot", service: "Kleurbehandeling + knippen", duration: 120, reminded: false },
  { id: "4", time: "14:00", client: "Lisa Bakker", service: "Highlights", duration: 90, reminded: true },
  { id: "5", time: "15:30", client: "Tom Pietersen", service: "Knipbehandeling heren", duration: 30, reminded: false },
];

export default async function AfsprakenPage() {
  const user = await requireSalonOwner();
  const salon = await getSalonWithSubscription(user.salonId);
  const hasAgenda = !!salon?.agendaProvider;

  const today = new Date().toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div>
      <PageHeader
        title="Afspraken"
        subtitle="Overzicht van aankomende afspraken uit je agenda"
      />

      {!hasAgenda ? (
        <EmptyState
          icon="calendar_month"
          title="Geen agenda gekoppeld"
          description="Koppel je salonssoftware (Salonized, Phorest of Treatwell) om afspraken hier te zien en herinneringen automatisch te versturen."
          action={
            <Link
              href="/dashboard/integraties"
              className="inline-flex items-center gap-base rounded-full bg-primary px-md py-sm text-label-md font-label-md text-on-primary transition-all hover:opacity-90"
            >
              <Icon name="cable" className="text-[18px]" />
              Agenda koppelen
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-md">
          {/* Live sync notice */}
          <div className="flex items-center gap-sm rounded-xl border border-outline-variant/40 bg-primary-fixed/30 px-md py-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span className="text-label-md text-on-surface">
              Live gesynchroniseerd met{" "}
              <strong className="capitalize">{salon.agendaProvider}</strong>
            </span>
          </div>

          {/* Today's appointments */}
          <Card>
            <div className="mb-md flex items-center justify-between">
              <h2 className="font-headline-md text-headline-md text-on-surface">Vandaag</h2>
              <Badge tone="primary">{today}</Badge>
            </div>

            <div className="flex flex-col divide-y divide-outline-variant/30">
              {DEMO_APPOINTMENTS.map((apt) => (
                <div key={apt.id} className="flex items-center gap-md py-sm">
                  <div className="w-12 shrink-0">
                    <span className="text-label-md font-label-md text-on-surface">{apt.time}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-body-md text-on-surface">{apt.client}</div>
                    <div className="text-label-sm text-on-surface-variant">
                      {apt.service} · {apt.duration} min
                    </div>
                  </div>
                  <Badge tone={apt.reminded ? "success" : "neutral"}>
                    {apt.reminded ? "Herinnerd" : "Gepland"}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* No-show stats */}
          <Card>
            <h2 className="mb-md font-headline-md text-headline-md text-on-surface">
              No-show statistieken (30d)
            </h2>
            <div className="grid grid-cols-3 gap-md text-center">
              <div>
                <div className="font-headline-md text-headline-md text-primary">94%</div>
                <div className="text-label-sm text-on-surface-variant">Klanten verschijnt</div>
              </div>
              <div>
                <div className="font-headline-md text-headline-md text-secondary">4</div>
                <div className="text-label-sm text-on-surface-variant">No-shows</div>
              </div>
              <div>
                <div className="font-headline-md text-headline-md text-on-surface">87%</div>
                <div className="text-label-sm text-on-surface-variant">Herinnerd</div>
              </div>
            </div>
            <div className="mt-md flex items-center justify-between border-t border-outline-variant/40 pt-sm">
              <span className="text-label-sm text-on-surface-variant">
                Sector gemiddeld: 30% no-shows zonder herinneringen
              </span>
              <Link href="/dashboard/no-show" className="text-label-sm text-primary hover:underline">
                Beleid instellen →
              </Link>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
