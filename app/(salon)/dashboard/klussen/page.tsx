import type { Metadata } from "next";
import Link from "next/link";
import { requireJobOwner } from "@/lib/jobs/access";
import { getJobStats, listActiveStaff, listJobs, type JobListItem } from "@/lib/jobs/queries";
import { CLOSED_JOB_STATUSES, OPEN_JOB_STATUSES, compareJobsForBoard, customerDisplayName } from "@/lib/jobs/model";
import { PageHeader, Card, StatCard, EmptyState, AdminLink } from "@/components/salon/dash-ui";
import { Icon } from "@/components/ui/icon";
import { LinkTabs, PriorityBadge, StatusBadge, fmtDateTime, inputCls, btnOutline } from "@/components/salon/jobs/ui";
import { capitalize, categoryLabeler } from "@/lib/jobs/labels";

export const metadata: Metadata = { title: "Klussen" };

type Tab = "open" | "plan" | "done" | "all";
const isTab = (v: string | undefined): v is Tab => v === "open" || v === "plan" || v === "done" || v === "all";

export default async function KlussenPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; staff?: string }>;
}) {
  const sp = await searchParams;
  const tab: Tab = isTab(sp.tab) ? sp.tab : "open";
  const q = (sp.q ?? "").trim();
  const ctx = await requireJobOwner();
  const noun = ctx.pack.terms.treatmentPlural;
  const Noun = capitalize(noun);

  const [stats, staff] = await Promise.all([getJobStats(ctx.salonId), listActiveStaff(ctx.salonId)]);

  let jobs: JobListItem[];
  if (tab === "open") jobs = await listJobs(ctx.salonId, { statuses: OPEN_JOB_STATUSES, q, staffId: sp.staff || undefined });
  else if (tab === "plan") jobs = await listJobs(ctx.salonId, { statuses: ["new", "quoted", "on_hold"], q, staffId: sp.staff || undefined });
  else if (tab === "done") jobs = await listJobs(ctx.salonId, { statuses: CLOSED_JOB_STATUSES, q, staffId: sp.staff || undefined });
  else jobs = await listJobs(ctx.salonId, { q, staffId: sp.staff || undefined });

  if (tab === "plan") jobs = jobs.filter((j) => !j.scheduledStart);
  if (tab !== "done" && tab !== "all") jobs = [...jobs].sort(compareJobsForBoard);

  const urgent = jobs.filter((j) => j.priority === "urgent" && OPEN_JOB_STATUSES.includes(j.status as never));
  const categoryLabel = categoryLabeler(ctx.pack);

  const href = (t: Tab) => `/dashboard/klussen?tab=${t}${q ? `&q=${encodeURIComponent(q)}` : ""}${sp.staff ? `&staff=${sp.staff}` : ""}`;

  return (
    <div>
      <PageHeader
        eyebrow="Klus-CRM"
        title={Noun}
        subtitle="Elke aanvraag, van AI-intake tot betaalde factuur."
        action={
          <AdminLink href="/dashboard/klussen/nieuw">
            <Icon name="add" className="text-[18px]" />
            Nieuwe {ctx.pack.terms.treatment}
          </AdminLink>
        }
      />

      <div className="mb-lg grid grid-cols-2 gap-md xl:grid-cols-4">
        <StatCard label="Spoed open" value={String(stats.urgentOpen)} icon="emergency" tint={stats.urgentOpen ? "secondary" : "plain"} />
        <StatCard label="Te plannen" value={String(stats.toSchedule)} icon="event_upcoming" />
        <StatCard label="Vandaag" value={String(stats.scheduledToday)} icon="today" />
        <StatCard label="Bezig" value={String(stats.inProgress)} icon="handyman" />
      </div>

      {urgent.length > 0 && tab !== "done" && (
        <Card tint="secondary" className="mb-lg">
          <div className="mb-sm flex items-center gap-sm">
            <Icon name="emergency" className="text-[22px] text-secondary" />
            <h2 className="dash-h2 text-headline-md text-on-surface">Spoed — nu oppakken</h2>
          </div>
          <div className="flex flex-col gap-xs">
            {urgent.slice(0, 5).map((j) => (
              <Link
                key={j.id}
                href={`/dashboard/klussen/${j.id}`}
                className="flex flex-wrap items-center gap-sm rounded-lg bg-surface-container-lowest px-sm py-xs hover:bg-surface"
              >
                <span className="text-label-md font-label-md text-secondary">{j.number}</span>
                <span className="min-w-0 flex-1 truncate text-body-md text-on-surface">{j.title}</span>
                <span className="text-label-sm text-on-surface-variant">{j.addressLine ?? "adres onbekend"}</span>
                <StatusBadge status={j.status} />
              </Link>
            ))}
          </div>
        </Card>
      )}

      <LinkTabs
        active={tab}
        tabs={[
          { key: "open", label: "Open", href: href("open") },
          { key: "plan", label: "Te plannen", href: href("plan"), count: tab === "plan" ? jobs.length : stats.toSchedule },
          { key: "done", label: "Afgerond", href: href("done") },
          { key: "all", label: "Alles", href: href("all") },
        ]}
      />

      <form method="get" className="mb-md flex flex-wrap gap-sm">
        <input type="hidden" name="tab" value={tab} />
        <input type="search" name="q" defaultValue={q} placeholder="Zoek op klant, adres, nummer of omschrijving…" className={`${inputCls} max-w-[28rem]`} />
        <select name="staff" defaultValue={sp.staff ?? ""} className={`${inputCls} max-w-[14rem]`}>
          <option value="">Alle {ctx.pack.terms.practitionerPlural}</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button type="submit" className={btnOutline}>
          Zoeken
        </button>
      </form>

      {jobs.length === 0 ? (
        <EmptyState
          icon="construction"
          title={q ? "Niets gevonden" : `Nog geen ${noun} in deze lijst`}
          description={
            q
              ? "Probeer een andere zoekterm."
              : `Zodra de AI-receptionist een aanvraag vastlegt of je er zelf een aanmaakt, verschijnt die hier.`
          }
          action={
            !q && (
              <AdminLink href="/dashboard/klussen/nieuw">
                <Icon name="add" className="text-[18px]" />
                Nieuwe {ctx.pack.terms.treatment}
              </AdminLink>
            )
          }
        />
      ) : (
        <Card className="p-0">
          <div className="divide-y divide-outline-variant/30">
            {jobs.map((j) => (
              <Link
                key={j.id}
                href={`/dashboard/klussen/${j.id}`}
                className="flex flex-col gap-xs px-md py-sm transition-colors hover:bg-primary/5 md:flex-row md:items-center md:gap-md"
              >
                <div className="flex w-full shrink-0 items-center gap-sm md:w-44">
                  <span className="text-label-md font-label-md text-on-surface">{j.number}</span>
                  <PriorityBadge priority={j.priority} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-body-md text-on-surface">{j.title}</div>
                  <div className="truncate text-label-sm text-on-surface-variant">
                    {j.customerName ? customerDisplayName({ name: j.customerName, companyName: j.customerCompany }) : "Klant onbekend"}
                    {j.addressLine ? ` · ${j.addressLine}` : ""}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-sm md:w-72 md:justify-end">
                  <span className="text-label-sm text-on-surface-variant">{categoryLabel(j.category)}</span>
                  <span className="text-label-sm text-on-surface-variant">
                    {j.scheduledStart ? fmtDateTime(j.scheduledStart) : "Nog niet ingepland"}
                    {j.staffName ? ` · ${j.staffName}` : ""}
                  </span>
                  <StatusBadge status={j.status} />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
