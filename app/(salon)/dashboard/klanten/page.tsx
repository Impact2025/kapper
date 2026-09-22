import type { Metadata } from "next";
import Link from "next/link";
import { requireSalonOwner } from "@/lib/auth/dal";
import { searchCustomers } from "@/lib/customers/queries";
import { listTodayAppointments } from "@/lib/salon/appointments";
import { amsterdamTimeKey, SALON_TIMEZONE } from "@/lib/salon/timezone";
import { PageHeader, Card, Badge, EmptyState } from "@/components/salon/dash-ui";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Klanten" };

export default async function KlantenPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const user = await requireSalonOwner();
  const [today, customers] = await Promise.all([
    listTodayAppointments(user.salonId),
    searchCustomers(user.salonId, q),
  ]);

  const todayLabel = new Date().toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: SALON_TIMEZONE,
  });

  return (
    <div>
      <PageHeader title="Klanten" subtitle="Dagplanning en klantendossier" />

      {/* Vandaag */}
      <Card className="mb-lg">
        <div className="mb-md flex items-center justify-between">
          <h2 className="dash-h2 text-headline-md text-on-surface">Vandaag</h2>
          <Badge tone="primary">{todayLabel}</Badge>
        </div>

        {today.length === 0 ? (
          <p className="py-sm text-body-md text-on-surface-variant">Geen afspraken meer vandaag.</p>
        ) : (
          <div className="flex flex-col divide-y divide-outline-variant/30">
            {today.map((apt) => (
              <Link
                key={apt.id}
                href={apt.customerId ? `/dashboard/klanten/${apt.customerId}` : "#"}
                className={`flex items-center gap-md py-sm ${apt.customerId ? "transition-colors hover:bg-primary/5 -mx-sm px-sm rounded-lg" : "cursor-default"}`}
              >
                <div className="w-12 shrink-0">
                  <span className="text-label-md font-label-md text-on-surface">
                    {amsterdamTimeKey(apt.appointmentTime)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-body-md text-on-surface">{apt.customerName}</div>
                  <div className="truncate text-label-sm text-on-surface-variant">
                    {apt.serviceType} · {apt.durationMinutes} min{apt.staffName ? ` · ${apt.staffName}` : ""}
                  </div>
                </div>
                <Badge tone={apt.status === "confirmed" ? "success" : "neutral"}>
                  {apt.status === "confirmed" ? "Bevestigd" : "Gepland"}
                </Badge>
                {apt.customerId && <Icon name="chevron_right" className="text-[20px] text-on-surface-variant" />}
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Zoeken */}
      <form method="get" className="mb-md">
        <div className="relative max-w-md">
          <Icon
            name="search"
            className="pointer-events-none absolute left-sm top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant"
          />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Zoek op naam of telefoonnummer…"
            className="w-full rounded-full border border-outline-variant bg-surface py-sm pl-2xl pr-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </form>

      {/* Klantenlijst */}
      {customers.length === 0 ? (
        <EmptyState
          icon="group"
          title={q ? "Geen klanten gevonden" : "Nog geen klanten"}
          description={
            q
              ? `Niemand gevonden voor "${q}".`
              : "Zodra de AI een boeking maakt of je een klant handmatig toevoegt, verschijnt die hier."
          }
        />
      ) : (
        <Card>
          <div className="flex flex-col divide-y divide-outline-variant/30">
            {customers.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/klanten/${c.id}`}
                className="flex items-center gap-md py-sm transition-colors hover:bg-primary/5 -mx-sm px-sm rounded-lg"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-label-sm font-label-sm text-on-primary-fixed">
                  {c.name
                    .split(" ")
                    .slice(0, 2)
                    .map((w) => w[0]?.toUpperCase() ?? "")
                    .join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-body-md text-on-surface">{c.name}</div>
                  <div className="truncate text-label-sm text-on-surface-variant">{c.phone}</div>
                </div>
                {c.blockedFromOnlineBooking && <Badge tone="error">Geblokkeerd</Badge>}
                {!c.blockedFromOnlineBooking && c.noShowCount > 0 && (
                  <Badge tone="warning">{c.noShowCount} no-show{c.noShowCount === 1 ? "" : "s"}</Badge>
                )}
                <Icon name="chevron_right" className="text-[20px] text-on-surface-variant" />
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
