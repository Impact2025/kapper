import { getCurrentUser } from "@/lib/auth/dal";
import { listSalonBilling, getBillingTotals } from "@/lib/billing/queries";
import { PageHeader, Card, StatCard, Badge, EmptyState } from "@/components/admin/ui";
import { formatEur } from "@/lib/utils";

const PLAN_LABEL = { essential: "Essential", pro: "Pro", elite: "Elite" } as const;
const STATUS_TONE = {
  trial: "warning",
  active: "success",
  past_due: "error",
  canceled: "neutral",
} as const;
const STATUS_LABEL = {
  trial: "Trial",
  active: "Actief",
  past_due: "Achterstallig",
  canceled: "Opgezegd",
} as const;

export default async function BillingPage() {
  await getCurrentUser();
  const [salons, totals] = await Promise.all([listSalonBilling(), getBillingTotals()]);
  const dateFmt = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div>
      <PageHeader title="Abonnementen" subtitle="Omzet, plannen en facturatiestatus." />

      <div className="mb-lg grid grid-cols-1 gap-md sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="MRR" value={formatEur(totals.mrr)} icon="payments" hint={`${formatEur(totals.arr)} ARR`} />
        <StatCard label="Actief" value={String(totals.activeCount)} icon="check_circle" />
        <StatCard label="Trials" value={String(totals.trialCount)} icon="schedule" />
        <StatCard label="Achterstallig" value={String(totals.pastDueCount)} icon="warning" />
      </div>

      {salons.length === 0 ? (
        <EmptyState
          icon="credit_card"
          title="Nog geen abonnementen"
          description="Zodra een salon afrekent via Stripe verschijnt het hier. Stel STRIPE_SECRET_KEY en de webhook in om live te gaan."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant/40 text-label-sm uppercase tracking-wide text-on-surface-variant">
                <th className="px-md py-sm font-label-sm">Salon</th>
                <th className="px-md py-sm font-label-sm">Plan</th>
                <th className="px-md py-sm font-label-sm">Status</th>
                <th className="px-md py-sm text-right font-label-sm">MRR</th>
                <th className="px-md py-sm text-right font-label-sm">Verlengt</th>
              </tr>
            </thead>
            <tbody>
              {salons.map((s) => (
                <tr key={s.id} className="border-b border-outline-variant/20">
                  <td className="px-md py-sm">
                    <div className="text-body-md font-label-md text-on-surface">{s.name}</div>
                    {s.city && <div className="text-label-sm text-on-surface-variant">{s.city}</div>}
                  </td>
                  <td className="px-md py-sm text-body-md text-on-surface-variant">
                    {PLAN_LABEL[s.plan]}
                  </td>
                  <td className="px-md py-sm">
                    <Badge tone={STATUS_TONE[s.status]}>{STATUS_LABEL[s.status]}</Badge>
                  </td>
                  <td className="px-md py-sm text-right text-body-md font-label-md text-on-surface">
                    {formatEur(Math.round(s.mrr / 100))}
                  </td>
                  <td className="px-md py-sm text-right text-label-sm text-on-surface-variant">
                    {s.currentPeriodEnd ? dateFmt.format(s.currentPeriodEnd) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
