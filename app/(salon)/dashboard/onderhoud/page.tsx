import type { Metadata } from "next";
import Link from "next/link";
import { requireJobOwner } from "@/lib/jobs/access";
import { listAssetsDueForService, listContracts } from "@/lib/jobs/crm";
import { assetKindLabeler } from "@/lib/jobs/labels";
import { customerDisplayName, formatMoney } from "@/lib/jobs/model";
import { PageHeader, Card, Badge, EmptyState, StatCard } from "@/components/salon/dash-ui";
import { InlineActionButton } from "@/components/salon/jobs/action-form";
import { fmtDate } from "@/components/salon/jobs/ui";
import { setContractStatusAction } from "@/lib/jobs/actions";

export const metadata: Metadata = { title: "Onderhoud" };

export default async function OnderhoudPage() {
  const ctx = await requireJobOwner();

  if (!ctx.pack.features.contracts) {
    return <EmptyState icon="event_repeat" title="Niet beschikbaar" description="Onderhoudscontracten zijn niet beschikbaar voor dit vak." />;
  }
  if (!ctx.can.contracts) {
    return (
      <div>
        <PageHeader title="Onderhoud" subtitle="Onderhoudscontracten met automatische klus en klantherinnering." />
        <Card tint="secondary">
          <p className="text-body-md text-on-surface">
            Onderhoudscontracten zijn onderdeel van het Pro-abonnement. <Link href="/dashboard/abonnement" className="text-primary hover:underline">Upgrade</Link> om ze te gebruiken.
          </p>
        </Card>
      </div>
    );
  }

  const [contracts, due] = await Promise.all([listContracts(ctx.salonId), listAssetsDueForService(ctx.salonId, 90)]);
  const assetLabel = assetKindLabeler(ctx.pack);
  const now = new Date();
  const active = contracts.filter((c) => c.status === "active");
  const yearlyRevenue = active.reduce((s, c) => s + Math.round((c.priceCents * 12) / c.intervalMonths), 0);
  const dueSoon = active.filter((c) => c.nextDueAt.getTime() < now.getTime() + 30 * 24 * 3600_000).length;

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader title="Onderhoud" subtitle="Terugkerend werk: contracten die vanzelf een klus en een klantbericht opleveren." />

      <div className="grid grid-cols-2 gap-md xl:grid-cols-4">
        <StatCard label="Actieve contracten" value={String(active.length)} icon="event_repeat" />
        <StatCard label="Jaaromzet contracten" value={formatMoney(yearlyRevenue)} icon="savings" hint="excl. btw, op basis van interval" />
        <StatCard label="Binnen 30 dagen" value={String(dueSoon)} icon="upcoming" />
        <StatCard label="Installaties aan de beurt" value={String(due.length)} icon="build_circle" hint="komende 90 dagen" />
      </div>

      <Card>
        <h2 className="dash-h2 mb-sm text-headline-md">Contracten</h2>
        {contracts.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">
            Nog geen contracten. Open een klant en kies &ldquo;Contract toevoegen&rdquo; — daarna ontstaat elke beurt vanzelf als klus.
          </p>
        ) : (
          <div className="divide-y divide-outline-variant/30">
            {contracts.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-sm py-sm">
                <div className="min-w-0 flex-1">
                  <Link href={`/dashboard/klanten/${c.customerId}`} className="text-body-md text-primary hover:underline">
                    {customerDisplayName({ name: c.customerName, companyName: c.customerCompany })}
                  </Link>
                  <div className="text-label-sm text-on-surface-variant">
                    {c.name} · elke {c.intervalMonths} mnd · {formatMoney(c.priceCents)}
                  </div>
                </div>
                <div className="text-label-md text-on-surface">Volgende beurt: {fmtDate(c.nextDueAt)}</div>
                <Badge tone={c.status === "active" ? (c.nextDueAt < now ? "warning" : "success") : "neutral"}>
                  {c.status === "active" ? (c.nextDueAt < now ? "Achterstallig" : "Actief") : c.status === "paused" ? "Gepauzeerd" : "Beëindigd"}
                </Badge>
                <InlineActionButton action={setContractStatusAction} fields={{ contractId: c.id, status: c.status === "active" ? "paused" : "active" }} label={c.status === "active" ? "Pauzeer" : "Activeer"} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="dash-h2 mb-sm text-headline-md">Installaties waar onderhoud aankomt</h2>
        {due.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">Geen installaties met onderhoud in de komende 90 dagen.</p>
        ) : (
          <div className="divide-y divide-outline-variant/30">
            {due.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-sm py-sm">
                <div className="min-w-0 flex-1">
                  <Link href={`/dashboard/klanten/${a.customerId}`} className="text-body-md text-primary hover:underline">
                    {customerDisplayName({ name: a.customerName, companyName: a.customerCompany })}
                  </Link>
                  <div className="text-label-sm text-on-surface-variant">
                    {assetLabel(a.kind)} {[a.brand, a.model].filter(Boolean).join(" ")} · laatste onderhoud {fmtDate(a.lastServiceAt)}
                  </div>
                </div>
                <span className="text-label-md text-on-surface">{fmtDate(a.nextServiceDue)}</span>
                {a.nextServiceDue && a.nextServiceDue < now && <Badge tone="warning">Te laat</Badge>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
