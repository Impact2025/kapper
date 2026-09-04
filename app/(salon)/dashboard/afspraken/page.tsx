import type { Metadata } from "next";
import Link from "next/link";
import { requireSalonOwner } from "@/lib/auth/dal";
import { getSalonWithSubscription } from "@/lib/salon/queries";
import { listUpcomingAppointments } from "@/lib/salon/appointments";
import { SALON_TIMEZONE, amsterdamTimeKey } from "@/lib/salon/timezone";
import { PageHeader, Card, Badge } from "@/components/admin/ui";
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
  const [salon, upcoming] = await Promise.all([
    getSalonWithSubscription(user.salonId),
    listUpcomingAppointments(user.salonId),
  ]);
  const hasAgenda = !!salon?.agendaProvider;
  const isDemo = upcoming.length === 0;

  const appointmentRows = isDemo
    ? DEMO_APPOINTMENTS.map((a) => ({ id: a.id, time: a.time, client: a.client, service: a.service, duration: a.duration, location: null as string | null, reminded: a.reminded }))
    : upcoming.map((a) => ({
        id: a.id,
        time: amsterdamTimeKey(a.appointmentTime),
        client: a.customerName,
        service: a.serviceType,
        duration: a.durationMinutes,
        location: a.locationName,
        reminded: a.reminded,
      }));

  const today = new Date().toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: SALON_TIMEZONE,
  });

  return (
    <div>
      <PageHeader
        title="Afspraken"
        subtitle="Overzicht van aankomende afspraken uit je agenda"
      />

      <div className="flex flex-col gap-md">
        {isDemo ? (
          <div className="flex items-center gap-sm rounded-xl border border-outline-variant/40 bg-surface-container px-md py-sm text-label-md text-on-surface-variant">
            <Icon name="auto_awesome" className="text-[18px] text-primary shrink-0" />
            Voorbeeldafspraken — worden vervangen zodra je eerste echte boeking binnenkomt.
          </div>
        ) : (
          <div className="flex items-center gap-sm rounded-xl border border-outline-variant/40 bg-primary-fixed/30 px-md py-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span className="text-label-md text-on-surface">
              {hasAgenda ? (
                <>
                  Geboekt door je AI-receptioniste, gesynchroniseerd met{" "}
                  <strong className="capitalize">{salon?.agendaProvider}</strong> waar dat lukt.
                </>
              ) : (
                "Geboekt door je AI-receptioniste, rechtstreeks vastgelegd in KapperAssistent."
              )}
            </span>
          </div>
        )}

        {/* Upcoming appointments */}
        <Card>
          <div className="mb-md flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md text-on-surface">
              {isDemo ? "Vandaag" : "Aankomend"}
            </h2>
            {isDemo && <Badge tone="primary">{today}</Badge>}
          </div>

          <div className="flex flex-col divide-y divide-outline-variant/30">
            {appointmentRows.map((apt) => (
              <div key={apt.id} className="flex items-center gap-md py-sm">
                <div className="w-12 shrink-0">
                  <span className="text-label-md font-label-md text-on-surface">{apt.time}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-body-md text-on-surface">{apt.client}</div>
                  <div className="text-label-sm text-on-surface-variant">
                    {apt.service} · {apt.duration} min{apt.location ? ` · ${apt.location}` : ""}
                  </div>
                </div>
                <Badge tone={apt.reminded ? "success" : "neutral"}>
                  {apt.reminded ? "Herinnerd" : "Gepland"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {!hasAgenda && (
          <div className="flex items-center gap-sm rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-md py-sm">
            <Icon name="cable" className="text-[18px] text-on-surface-variant shrink-0" />
            <span className="text-label-sm text-on-surface-variant">
              Nog geen salonssoftware gekoppeld — boekingen blijven in KapperAssistent staan.
            </span>
            <Link href="/dashboard/integraties" className="ml-auto text-label-sm text-primary hover:underline">
              Koppelen →
            </Link>
          </div>
        )}

          {/* No-show stats */}
          <Card>
            <h2 className="mb-md font-headline-md text-headline-md text-on-surface">
              No-show statistieken (30d)
            </h2>
            <div className="grid grid-cols-3 gap-md text-center">
              <div>
                <div className="stat-figure text-headline-md text-primary">94%</div>
                <div className="text-label-sm text-on-surface-variant">Klanten verschijnt</div>
              </div>
              <div>
                <div className="stat-figure text-headline-md text-secondary">4</div>
                <div className="text-label-sm text-on-surface-variant">No-shows</div>
              </div>
              <div>
                <div className="stat-figure text-headline-md text-on-surface">87%</div>
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
    </div>
  );
}
