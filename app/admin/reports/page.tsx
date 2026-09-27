import { getCurrentUser } from "@/lib/auth/dal";
import { listReports } from "@/lib/reports/queries";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";
import { GenerateReport } from "@/components/admin/reports/generate-report";
import { formatEur } from "@/lib/utils";
import { formatEurPrecise } from "@/lib/admin/margin";
import type { PlatformSection, ReportSegment } from "@/lib/reports/generate";
import Link from "next/link";

export default async function ReportsPage() {
  await getCurrentUser();
  const reports = await listReports();
  const dt = new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div>
      <PageHeader
        title="Rapporten"
        subtitle="Automatische dag- en maandrapporten met AI-samenvatting."
        action={<GenerateReport />}
      />

      {reports.length === 0 ? (
        <EmptyState
          icon="monitoring"
          title="Nog geen rapporten"
          description="Genereer er handmatig één, of plan de cron-route /api/cron/report in (beschermd met CRON_SECRET)."
        />
      ) : (
        <div className="flex flex-col gap-md">
          {reports.map((r) => (
            <Card key={r.id}>
              <div className="mb-sm flex flex-wrap items-center justify-between gap-sm">
                <div className="flex items-center gap-sm">
                  <Badge tone={r.period === "monthly" ? "primary" : "neutral"}>
                    {r.period === "monthly" ? "Maand" : "Dag"}
                  </Badge>
                  <span className="font-headline-md text-headline-md text-on-surface">
                    {r.periodKey}
                  </span>
                </div>
                <span className="text-label-sm text-on-surface-variant">{dt.format(r.sentAt)}</span>
              </div>
              {r.summary && (
                <p className="mb-sm text-body-md text-on-surface-variant">{r.summary}</p>
              )}
              <div className="grid grid-cols-2 gap-sm sm:grid-cols-4">
                <Metric label="Nieuwe leads" value={String(r.payload.newLeads)} />
                <Metric label="Scans" value={String(r.payload.scans)} />
                <Metric label="Nieuwe salons" value={String(r.payload.newSalons)} />
                <Metric label="Actieve MRR" value={formatEur(r.payload.activeMrr)} />
              </div>
              {r.payload.platform && <Platform p={r.payload.platform} />}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-container-low p-sm">
      <div className="text-label-sm uppercase tracking-wide text-on-surface-variant">{label}</div>
      <div className="font-headline-md text-headline-md text-on-surface">{value}</div>
    </div>
  );
}

function Platform({ p }: { p: PlatformSection }) {
  return (
    <div className="mt-sm flex flex-col gap-sm">
      <div className="grid grid-cols-2 gap-sm sm:grid-cols-4">
        <Metric label="AI-kosten 30d" value={formatEurPrecise(p.aiCostEur30d)} />
        <Metric label="AI-marge" value={p.aiMarginPct == null ? "—" : `${p.aiMarginPct.toLocaleString("nl-NL")}%`} />
        <Metric label="Gezond / aandacht" value={`${p.health.gezond} / ${p.health.aandacht}`} />
        <Metric label="Risico" value={String(p.health.risico)} />
      </div>
      {p.anomalies.length > 0 && (
        <div className="rounded-lg bg-secondary-fixed/40 p-sm">
          <div className="mb-xs text-label-sm uppercase tracking-wide text-on-surface-variant">Afwijkingen</div>
          <ul className="flex flex-col gap-[2px] text-label-md">
            {p.anomalies.map((a, i) => (
              <li key={i}>
                <Link href={`/admin/klanten/${a.salonId}`} className="font-label-md text-on-surface hover:text-primary hover:underline">
                  {a.name}
                </Link>{" "}
                <span className="text-on-surface-variant">— {a.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid grid-cols-1 gap-sm md:grid-cols-2">
        <Segments title="Per vak" rows={p.byVertical} />
        <Segments title="Per plan" rows={p.byPlan} />
      </div>
    </div>
  );
}

function Segments({ title, rows }: { title: string; rows: ReportSegment[] }) {
  if (!rows.length) return null;
  return (
    <div className="rounded-lg bg-surface-container-low p-sm">
      <div className="mb-xs text-label-sm uppercase tracking-wide text-on-surface-variant">{title}</div>
      <div className="overflow-x-auto"><table className="w-full text-label-md">
        <tbody>
          {rows.map((s) => (
            <tr key={s.key}>
              <td className="py-[2px] text-on-surface">{s.label}</td>
              <td className="py-[2px] text-right tabular-nums text-on-surface-variant">{s.customers} klanten</td>
              <td className="py-[2px] text-right tabular-nums text-on-surface">{formatEur(s.mrrEur)}</td>
              <td className="py-[2px] text-right tabular-nums text-on-surface-variant">AI {formatEurPrecise(s.aiCostEur)}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
  );
}
