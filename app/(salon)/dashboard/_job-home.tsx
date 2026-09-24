import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { staff, treatments } from "@/lib/db/schema";
import { jobs } from "@/lib/db/schema-jobs";
import { resolveOnboarding } from "@/lib/verticals/onboarding";
import type { JobContext } from "@/lib/jobs/access";
import { getJobStats, listOpenJobsForBoard, listScheduledJobs } from "@/lib/jobs/queries";
import { missingInvoiceFields, parseBusinessProfile } from "@/lib/jobs/business";
import { formatMoney } from "@/lib/jobs/model";
import { amsterdamWallTimeToUtc } from "@/lib/salon/timezone";
import { PageHeader, Card, StatCard, AdminLink } from "@/components/salon/dash-ui";
import { Icon } from "@/components/ui/icon";
import { PriorityBadge, StatusBadge, fmtTime } from "@/components/salon/jobs/ui";

export async function JobDashboardHome({ ctx }: { ctx: JobContext }) {
  const now = new Date();
  const dayStart = amsterdamWallTimeToUtc(now, 0, 0);
  const dayEnd = amsterdamWallTimeToUtc(now, 1, 0);

  const [stats, today, open, [treatmentCount], [staffCount], [jobCount]] = await Promise.all([
    getJobStats(ctx.salonId, now),
    listScheduledJobs(ctx.salonId, dayStart, dayEnd),
    listOpenJobsForBoard(ctx.salonId),
    db.select({ n: sql<number>`count(*)::int` }).from(treatments).where(eq(treatments.salonId, ctx.salonId)),
    db.select({ n: sql<number>`count(*)::int` }).from(staff).where(eq(staff.salonId, ctx.salonId)),
    db.select({ n: sql<number>`count(*)::int` }).from(jobs).where(eq(jobs.salonId, ctx.salonId)),
  ]);

  const ai = (ctx.settings.ai as Record<string, unknown> | undefined) ?? {};
  const business = parseBusinessProfile(ctx.settings, ctx.salonName);
  const steps = resolveOnboarding(ctx.pack, {
    business: missingInvoiceFields(business).length === 0,
    services: (treatmentCount?.n ?? 0) > 0,
    team: (staffCount?.n ?? 0) > 0,
    whatsapp: !!ai.whatsappEnabled,
    phone: !!ai.phoneEnabled,
    firstJob: (jobCount?.n ?? 0) > 0,
  });
  const doneCount = steps.filter((s) => s.done).length;
  const urgent = open.filter((j) => j.priority === "urgent");
  const firstName = ctx.userName?.split(" ")[0] ?? ctx.pack.terms.owner;

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        title={`Welkom terug, ${firstName}`}
        subtitle={`${ctx.salonName} · vandaag`}
        action={
          <AdminLink href="/dashboard/klussen/nieuw">
            <Icon name="add" className="text-[18px]" />
            Nieuwe {ctx.pack.terms.treatment}
          </AdminLink>
        }
      />

      {doneCount < steps.length && (
        <div className="rounded-xl border border-secondary/30 bg-secondary-fixed/40 p-md">
          <div className="mb-sm flex items-center gap-sm">
            <Icon name="checklist" className="text-[22px] text-secondary" />
            <h2 className="dash-h2 text-headline-md text-on-surface">
              Maak je bedrijf klaar ({doneCount}/{steps.length})
            </h2>
          </div>
          <div className="flex flex-col gap-xs">
            {steps.map((s) => (
              <div key={s.key} className="flex items-center gap-sm">
                <Icon name={s.done ? "check_circle" : "radio_button_unchecked"} filled={s.done} className={`text-[20px] ${s.done ? "text-primary" : "text-outline"}`} />
                <span className={`text-body-md ${s.done ? "text-on-surface-variant line-through" : "text-on-surface"}`}>{s.label}</span>
                {!s.done && (
                  <Link href={s.href} className="ml-auto text-label-sm text-primary hover:underline">
                    Instellen →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-md xl:grid-cols-4">
        <StatCard label="Spoed open" value={String(stats.urgentOpen)} icon="emergency" tint={stats.urgentOpen ? "secondary" : "plain"} />
        <StatCard label="Vandaag ingepland" value={String(stats.scheduledToday)} icon="today" hint={`${stats.inProgress} bezig`} />
        <StatCard label="Te plannen" value={String(stats.toSchedule)} icon="event_upcoming" />
        <StatCard label="Offertes open" value={String(stats.quotesAwaiting)} icon="request_quote" hint={formatMoney(stats.quotesAwaitingCents)} />
        <StatCard label="Openstaand" value={formatMoney(stats.invoicesOpenCents)} icon="hourglass_top" hint={`${stats.invoicesOpenCount} facturen`} />
        <StatCard
          label="Achterstallig"
          value={formatMoney(stats.invoicesOverdueCents)}
          icon="warning"
          tint={stats.invoicesOverdueCount ? "secondary" : "plain"}
          hint={`${stats.invoicesOverdueCount} facturen`}
        />
        <StatCard label="Betaald deze maand" value={formatMoney(stats.paidThisMonthCents)} icon="payments" />
        <StatCard label="Onderhoud komende 30 d." value={String(stats.maintenanceDueSoon)} icon="event_repeat" />
      </div>

      <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
        <Card>
          <div className="mb-sm flex items-center justify-between">
            <h2 className="dash-h2 text-headline-md">Vandaag</h2>
            <Link href="/dashboard/planbord" className="text-label-md text-primary hover:underline">
              Planbord →
            </Link>
          </div>
          {today.length === 0 ? (
            <p className="text-body-md text-on-surface-variant">Niets ingepland vandaag.</p>
          ) : (
            <div className="divide-y divide-outline-variant/30">
              {today.map((j) => (
                <Link key={j.id} href={`/dashboard/klussen/${j.id}`} className="flex items-center gap-sm py-xs hover:bg-primary/5">
                  <span className="w-12 text-label-md font-label-md">{fmtTime(j.scheduledStart)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-body-md">{j.title}</div>
                    <div className="truncate text-label-sm text-on-surface-variant">
                      {j.addressLine ?? j.customerName}
                      {j.staffName ? ` · ${j.staffName}` : ""}
                    </div>
                  </div>
                  <StatusBadge status={j.status} />
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card tint={urgent.length ? "secondary" : "plain"}>
          <div className="mb-sm flex items-center justify-between">
            <h2 className="dash-h2 text-headline-md">{urgent.length ? "Spoed — nu oppakken" : "Nog te doen"}</h2>
            <Link href="/dashboard/klussen" className="text-label-md text-primary hover:underline">
              Alle klussen →
            </Link>
          </div>
          {open.length === 0 ? (
            <p className="text-body-md text-on-surface-variant">Geen openstaande klussen. 🎉</p>
          ) : (
            <div className="divide-y divide-outline-variant/30">
              {open.slice(0, 6).map((j) => (
                <Link key={j.id} href={`/dashboard/klussen/${j.id}`} className="flex items-center gap-sm py-xs hover:bg-primary/5">
                  <span className="w-20 text-label-md font-label-md">{j.number}</span>
                  <span className="min-w-0 flex-1 truncate text-body-md">{j.title}</span>
                  <PriorityBadge priority={j.priority} />
                  <StatusBadge status={j.status} />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
