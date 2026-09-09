import type { Metadata } from "next";
import { requireSalonOwner } from "@/lib/auth/dal";
import { getSalonWithSubscription } from "@/lib/salon/queries";
import { salonHasPlan } from "@/lib/salon/plan";
import { getSalonReportData } from "@/lib/salon/reports";
import { PageHeader, Card, StatCard, EmptyState, AdminLink } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";
import { formatEur } from "@/lib/utils";

export const metadata: Metadata = { title: "Rapportage" };

export default async function RapportagePage() {
  const user = await requireSalonOwner();
  const salon = await getSalonWithSubscription(user.salonId);
  const isPro = salonHasPlan(salon?.plan ?? "essential", "pro");

  return (
    <div>
      <PageHeader
        title="Rapportage"
        subtitle="Boekingen, annuleringen, verkopen en paginabezoekers — afgelopen 30 dagen."
      />

      {!isPro ? (
        <EmptyState
          icon="monitoring"
          title="Rapportage is een Pro-functie"
          description="Upgrade naar het Pro-abonnement voor managementinformatie: boekingen, annuleringen, webwinkelverkopen en paginabezoekers in één overzicht."
          action={<AdminLink href="/dashboard/abonnement">Bekijk abonnementen</AdminLink>}
        />
      ) : (
        <RapportageContent salonId={user.salonId} />
      )}
    </div>
  );
}

async function RapportageContent({ salonId }: { salonId: string }) {
  const data = await getSalonReportData(salonId, 30);

  return (
    <div>
      {data.isDemo && (
        <div className="mb-md flex items-center gap-sm rounded-xl border border-outline-variant/40 bg-surface-container px-md py-sm text-label-md text-on-surface-variant">
          <Icon name="auto_awesome" className="text-[18px] text-primary shrink-0" />
          Dit zijn voorbeeldcijfers. Zodra er boekingen en verkopen binnenkomen, zie je hier jouw echte data.
        </div>
      )}

      <div className="grid grid-cols-1 gap-md sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Boekingen" value={String(data.bookingsTotal)} icon="event_available" hint="afgelopen 30 dagen" />
        <StatCard
          label="Annuleringen"
          value={String(data.cancellations)}
          icon="event_busy"
          hint={`${data.noShows} no-show${data.noShows === 1 ? "" : "s"}`}
        />
        <StatCard label="Verkopen webwinkel" value={formatEur(data.salesRevenueCents / 100)} icon="shopping_bag" hint={`${data.ordersCount} bestelling${data.ordersCount === 1 ? "" : "en"}`} />
        <StatCard label="Paginabezoekers" value={String(data.pageViews)} icon="visibility" hint="webwinkel · afgelopen 30 dagen" />
      </div>

      <div className="mt-lg grid grid-cols-1 gap-md lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-md font-headline-md text-headline-md text-on-surface">Boekingen per dag</h2>
          <BookingsTrend points={data.bookingsTrend} />
        </Card>

        <Card>
          <h2 className="mb-md font-headline-md text-headline-md text-on-surface">Boekingen per kanaal</h2>
          {data.bookingsByChannel.length === 0 ? (
            <p className="text-body-md text-on-surface-variant">Nog geen boekingen.</p>
          ) : (
            <div className="flex flex-col gap-sm">
              {data.bookingsByChannel.map((c) => {
                const max = Math.max(...data.bookingsByChannel.map((x) => x.count), 1);
                const pct = Math.round((c.count / max) * 100);
                return (
                  <div key={c.label}>
                    <div className="mb-[2px] flex items-center justify-between text-label-md text-on-surface">
                      <span>{c.label}</span>
                      <span className="text-on-surface-variant">{c.count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function BookingsTrend({ points }: { points: { date: string; count: number }[] }) {
  const max = Math.max(...points.map((p) => p.count), 1);
  const dt = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short" });

  return (
    <div className="flex h-40 items-end gap-[3px]">
      {points.map((p) => {
        const heightPct = Math.max((p.count / max) * 100, p.count > 0 ? 6 : 2);
        return (
          <div
            key={p.date}
            className="h-full flex-1"
            title={`${dt.format(new Date(p.date))}: ${p.count} boeking${p.count === 1 ? "" : "en"}`}
          >
            <div
              className="w-full self-end rounded-t-[4px] bg-primary/80 transition-colors hover:bg-primary"
              style={{ height: `${heightPct}%`, marginTop: `${100 - heightPct}%`, minHeight: "2px" }}
            />
          </div>
        );
      })}
    </div>
  );
}
