import type { Metadata } from "next";
import { requireSalonOwner } from "@/lib/auth/dal";
import { getKasopmaak } from "@/lib/pos/queries";
import { amsterdamDateKey } from "@/lib/salon/timezone";
import { PageHeader, Card } from "@/components/salon/dash-ui";

export const metadata: Metadata = { title: "Dagafsluiting" };

function euro(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

const PAYMENT_LABELS: Record<string, string> = { cash: "Contant", pin: "Pin", card: "Kaart", onbekend: "Onbekend" };

export default async function DagafsluitingPage() {
  const user = await requireSalonOwner();
  const dateKey = amsterdamDateKey(new Date());
  const summary = await getKasopmaak(user.salonId, dateKey);

  return (
    <div>
      <PageHeader title="Dagafsluiting" subtitle={`Kasopmaak voor ${dateKey} — alleen kassaverkopen`} />

      <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
        <Card>
          <h3 className="mb-sm text-body-md font-medium text-on-surface">Per betaalmethode</h3>
          {summary.orderCount === 0 ? (
            <p className="text-label-sm text-on-surface-variant">Nog geen kassaverkopen vandaag.</p>
          ) : (
            <div className="flex flex-col gap-xs">
              {Object.entries(summary.byPaymentMethod).map(([method, cents]) => (
                <div key={method} className="flex items-center justify-between text-label-sm">
                  <span className="text-on-surface-variant">{PAYMENT_LABELS[method] ?? method}</span>
                  <span className="text-on-surface">{euro(cents)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="mb-sm text-body-md font-medium text-on-surface">Btw-uitsplitsing</h3>
          <div className="flex flex-col gap-xs">
            {Object.entries(summary.vatBreakdown).map(([rate, b]) => (
              <div key={rate} className="flex items-center justify-between text-label-sm">
                <span className="text-on-surface-variant">Btw {rate}%</span>
                <span className="text-on-surface">
                  {euro(b.subtotalCents)} excl. + {euro(b.vatCents)} btw
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-outline-variant/40 pt-sm text-label-sm">
              <span className="text-on-surface-variant">Fooien</span>
              <span className="text-on-surface">{euro(summary.tipTotalCents)}</span>
            </div>
            <div className="flex items-center justify-between text-body-md font-medium text-on-surface">
              <span>Totaal ({summary.orderCount} verkopen)</span>
              <span>{euro(summary.totalCents)}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-md">
        <h3 className="mb-xs text-body-md font-medium text-on-surface">Boekhouding exporteren</h3>
        <p className="mb-sm text-label-sm text-on-surface-variant">
          CSV met omzet per order, uitgesplitst naar btw-tarief — te importeren in Moneybird, Exact of
          e-Boekhouden.
        </p>
        <a
          href={`/api/pos/export?from=${dateKey}&to=${dateKey}`}
          className="text-label-sm text-primary hover:underline"
        >
          Download CSV van vandaag →
        </a>
      </Card>
    </div>
  );
}
