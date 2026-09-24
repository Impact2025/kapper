import type { Metadata } from "next";
import Link from "next/link";
import { requireJobOwner } from "@/lib/jobs/access";
import { getJobStats } from "@/lib/jobs/queries";
import { listDocuments } from "@/lib/jobs/documents";
import { INVOICE_STATUS_LABEL, QUOTE_STATUS_LABEL, formatMoney, invoicePaymentState, isQuoteExpired } from "@/lib/jobs/model";
import { missingInvoiceFields, parseBusinessProfile } from "@/lib/jobs/business";
import { PageHeader, Card, StatCard, Badge, EmptyState } from "@/components/salon/dash-ui";
import { Icon } from "@/components/ui/icon";
import { LinkTabs, fmtDate, btnOutline } from "@/components/salon/jobs/ui";

export const metadata: Metadata = { title: "Offertes & facturen" };

export default async function FacturatiePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: tabRaw } = await searchParams;
  const tab = tabRaw === "invoices" ? "invoices" : "quotes";
  const ctx = await requireJobOwner();
  const kind = tab === "invoices" ? "invoice" : "quote";

  const [stats, docs] = await Promise.all([getJobStats(ctx.salonId), listDocuments(ctx.salonId, kind)]);
  const missing = missingInvoiceFields(parseBusinessProfile(ctx.settings, ctx.salonName));
  const now = new Date();

  return (
    <div>
      <PageHeader
        eyebrow="Facturatie"
        title="Offertes & facturen"
        subtitle="Maak een offerte vanuit een klus, laat de klant online accepteren en factureer met één klik."
        action={
          <Link href="/dashboard/facturatie/instellingen" className={btnOutline}>
            <Icon name="business" className="text-[18px]" />
            Bedrijfsgegevens
          </Link>
        }
      />

      {!ctx.can.quotes && (
        <Card tint="secondary" className="mb-lg">
          <p className="text-body-md text-on-surface">
            Offertes en facturen zijn onderdeel van het Pro-abonnement.{" "}
            <Link href="/dashboard/abonnement" className="text-primary hover:underline">
              Upgrade
            </Link>{" "}
            om ze te gebruiken.
          </p>
        </Card>
      )}

      {missing.length > 0 && (
        <p className="mb-md rounded-lg bg-secondary-fixed/50 px-sm py-xs text-label-md text-on-surface">
          Vul je bedrijfsgegevens aan ({missing.join(", ")}) — die zijn wettelijk verplicht op een factuur.{" "}
          <Link href="/dashboard/facturatie/instellingen" className="text-primary hover:underline">
            Nu invullen
          </Link>
        </p>
      )}

      <div className="mb-lg grid grid-cols-2 gap-md xl:grid-cols-4">
        <StatCard label="Offertes open" value={`${stats.quotesAwaiting}`} icon="request_quote" hint={formatMoney(stats.quotesAwaitingCents)} />
        <StatCard label="Openstaand" value={formatMoney(stats.invoicesOpenCents)} icon="hourglass_top" hint={`${stats.invoicesOpenCount} facturen`} />
        <StatCard
          label="Achterstallig"
          value={formatMoney(stats.invoicesOverdueCents)}
          icon="warning"
          hint={`${stats.invoicesOverdueCount} facturen`}
          tint={stats.invoicesOverdueCount ? "secondary" : "plain"}
        />
        <StatCard label="Betaald deze maand" value={formatMoney(stats.paidThisMonthCents)} icon="payments" />
      </div>

      <LinkTabs
        active={tab}
        tabs={[
          { key: "quotes", label: "Offertes", href: "/dashboard/facturatie?tab=quotes" },
          { key: "invoices", label: "Facturen", href: "/dashboard/facturatie?tab=invoices" },
        ]}
      />

      {docs.length === 0 ? (
        <EmptyState
          icon="receipt_long"
          title={tab === "quotes" ? "Nog geen offertes" : "Nog geen facturen"}
          description="Open een klus en kies “Offerte maken” of “Factuur maken”."
        />
      ) : (
        <Card className="p-0">
          <div className="divide-y divide-outline-variant/30">
            {docs.map((d) => {
              const payState = kind === "invoice" ? invoicePaymentState({ status: d.status, dueAt: d.dueAt }, now) : null;
              const expired = kind === "quote" && isQuoteExpired({ status: d.status, validUntil: d.validUntil }, now);
              const label =
                kind === "quote"
                  ? expired
                    ? "Verlopen"
                    : QUOTE_STATUS_LABEL[d.status as keyof typeof QUOTE_STATUS_LABEL] ?? d.status
                  : payState === "overdue"
                    ? "Achterstallig"
                    : INVOICE_STATUS_LABEL[d.status as keyof typeof INVOICE_STATUS_LABEL] ?? d.status;
              const tone =
                d.status === "paid" || d.status === "accepted"
                  ? "success"
                  : payState === "overdue" || d.status === "declined" || d.status === "void" || expired
                    ? "error"
                    : d.status === "sent"
                      ? "warning"
                      : "neutral";
              return (
                <Link key={d.id} href={`/dashboard/facturatie/${d.id}`} className="flex flex-col gap-xs px-md py-sm transition-colors hover:bg-primary/5 md:flex-row md:items-center md:gap-md">
                  <div className="w-40 shrink-0 text-label-md font-label-md text-on-surface">{d.number.startsWith("CONCEPT") ? "Concept" : d.number}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-body-md text-on-surface">{d.billTo.companyName || d.billTo.name}</div>
                    <div className="truncate text-label-sm text-on-surface-variant">{d.title}</div>
                  </div>
                  <div className="shrink-0 text-label-sm text-on-surface-variant md:w-40">
                    {kind === "invoice" ? (d.dueAt ? `Vervalt ${fmtDate(d.dueAt)}` : "—") : d.validUntil ? `Geldig tot ${fmtDate(d.validUntil)}` : "—"}
                  </div>
                  <div className="shrink-0 text-label-md font-label-md md:w-28 md:text-right">{formatMoney(d.totalCents)}</div>
                  <div className="shrink-0 md:w-32 md:text-right">
                    <Badge tone={tone}>{label}</Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
