import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { getOverviewMetrics } from "@/lib/admin/metrics";
import { PageHeader, StatCard, Card, Badge } from "@/components/admin/ui";
import { formatEur } from "@/lib/utils";
import { LEAD_STAGE_LABELS } from "@/lib/crm/constants";

export default async function AdminOverviewPage() {
  const [user, metrics] = await Promise.all([getCurrentUser(), getOverviewMetrics()]);

  return (
    <div>
      <PageHeader
        title={`Welkom terug, ${user.name?.split(" ")[0] ?? "team"}`}
        subtitle="Een overzicht van je leads, omzet en groei."
      />

      <div className="grid grid-cols-1 gap-md sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Nieuwe leads"
          value={String(metrics.newLeads)}
          icon="person_add"
          hint={`${metrics.totalLeads} totaal`}
        />
        <StatCard
          label="Pipeline-waarde"
          value={formatEur(metrics.pipelineRevenue)}
          icon="trending_up"
          hint="geschat gemist/maand"
        />
        <StatCard
          label="Actieve salons"
          value={String(metrics.activeSalons)}
          icon="storefront"
          hint={`${formatEur(metrics.mrr)} MRR`}
        />
        <StatCard
          label="Events (7d)"
          value={String(metrics.eventsLast7d)}
          icon="bolt"
          hint={`${metrics.publishedPosts} blogposts live`}
        />
      </div>

      <div className="mt-lg grid grid-cols-1 gap-md lg:grid-cols-2">
        <Card>
          <div className="mb-md flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Pipeline per fase
            </h2>
            <Link
              href="/admin/crm"
              className="text-label-md font-label-md text-primary hover:underline"
            >
              Naar CRM →
            </Link>
          </div>
          <div className="flex flex-col gap-sm">
            {Object.entries(LEAD_STAGE_LABELS).map(([stage, label]) => (
              <div key={stage} className="flex items-center justify-between">
                <span className="text-body-md text-on-surface-variant">{label}</span>
                <Badge tone={stage === "customer" ? "success" : "neutral"}>
                  {metrics.leadsByStage[stage] ?? 0}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-md font-headline-md text-headline-md text-on-surface">
            Snel aan de slag
          </h2>
          <div className="flex flex-col gap-sm">
            <QuickLink href="/admin/crm" icon="groups" label="Leads opvolgen" />
            <QuickLink href="/admin/blog/new" icon="auto_awesome" label="AI-blogpost genereren" />
            <QuickLink href="/admin/coupons" icon="sell" label="Coupon aanmaken" />
            <QuickLink href="/admin/reports" icon="monitoring" label="Rapport bekijken" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-sm rounded-lg border border-outline-variant/40 px-sm py-sm text-body-md text-on-surface transition-colors hover:bg-primary/5 hover:text-primary"
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      {label}
    </Link>
  );
}
