import { getCurrentUser } from "@/lib/auth/dal";
import { listReports } from "@/lib/reports/queries";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";
import { GenerateReport } from "@/components/admin/reports/generate-report";
import { formatEur } from "@/lib/utils";

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
