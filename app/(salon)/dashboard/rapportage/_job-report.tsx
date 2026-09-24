import type { JobContext } from "@/lib/jobs/access";
import { getJobReport } from "@/lib/jobs/reports";
import { categoryLabeler } from "@/lib/jobs/labels";
import { formatMoney } from "@/lib/jobs/model";
import { PageHeader, Card, StatCard } from "@/components/salon/dash-ui";

export async function JobReportView({ ctx, days = 30 }: { ctx: JobContext; days?: number }) {
  const { report, staffNames } = await getJobReport(ctx.salonId, days);
  const catLabel = categoryLabeler(ctx.pack);
  const maxCat = Math.max(...report.perCategory.map((c) => c.count), 1);
  const maxTrend = Math.max(...report.trend.map((t) => t.count), 1);

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader title="Rapportage" subtitle={`Wat de AI en je team hebben opgeleverd — afgelopen ${days} dagen.`} />

      <div className="grid grid-cols-2 gap-md xl:grid-cols-4">
        <StatCard label="Nieuwe aanvragen" value={String(report.created)} icon="inbox" hint={`${report.viaAi} via de AI (${report.aiSharePercent}%)`} />
        <StatCard label="Afgerond" value={String(report.completed)} icon="task_alt" hint={report.avgLeadTimeHours !== null ? `gem. ${report.avgLeadTimeHours} uur van aanvraag tot klaar` : undefined} />
        <StatCard label="Spoedklussen" value={String(report.urgent)} icon="emergency" />
        <StatCard
          label="Offertes geaccepteerd"
          value={report.quoteAcceptancePercent === null ? "—" : `${report.quoteAcceptancePercent}%`}
          icon="request_quote"
          hint={`${report.quotesAccepted} van ${report.quotesSent}`}
        />
        <StatCard label="Gefactureerd (excl. btw)" value={formatMoney(report.invoicedCents)} icon="receipt_long" />
        <StatCard label="Betaald (excl. btw)" value={formatMoney(report.paidCents)} icon="payments" />
      </div>

      <div className="grid grid-cols-1 gap-md lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-md dash-h2 text-headline-md text-on-surface">Aanvragen per dag</h2>
          <div className="flex h-32 items-end gap-[3px]" role="img" aria-label="Aanvragen per dag">
            {report.trend.map((t) => (
              <div key={t.date} title={`${t.date}: ${t.count}`} className="flex-1 rounded-t bg-primary/70" style={{ height: `${Math.max((t.count / maxTrend) * 100, t.count ? 6 : 2)}%` }} />
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-md dash-h2 text-headline-md text-on-surface">Per soort werk</h2>
          {report.perCategory.length === 0 ? (
            <p className="text-body-md text-on-surface-variant">Nog geen klussen in deze periode.</p>
          ) : (
            <div className="flex flex-col gap-sm">
              {report.perCategory.map((c) => (
                <div key={c.category}>
                  <div className="mb-[2px] flex justify-between text-label-md text-on-surface">
                    <span>{catLabel(c.category)}</span>
                    <span>{c.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-container">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.round((c.count / maxCat) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="mb-md dash-h2 text-headline-md text-on-surface">Per {ctx.pack.terms.practitioner}</h2>
        {report.perStaff.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">Nog geen klussen in deze periode.</p>
        ) : (
          <table className="w-full text-left text-body-md">
            <thead>
              <tr className="border-b border-outline-variant/40 text-label-sm uppercase tracking-wide text-on-surface-variant">
                <th className="py-xs font-normal">Naam</th>
                <th className="py-xs text-right font-normal">Klussen</th>
                <th className="py-xs text-right font-normal">Afgerond</th>
                <th className="py-xs text-right font-normal">Gefactureerd (excl. btw)</th>
              </tr>
            </thead>
            <tbody>
              {report.perStaff.map((s) => (
                <tr key={s.staffId ?? "none"} className="border-b border-outline-variant/20">
                  <td className="py-xs">{s.staffId ? staffNames.get(s.staffId) ?? "Onbekend" : "Niet toegewezen"}</td>
                  <td className="py-xs text-right tabular-nums">{s.jobs}</td>
                  <td className="py-xs text-right tabular-nums">{s.completed}</td>
                  <td className="py-xs text-right tabular-nums">{formatMoney(s.invoicedCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
