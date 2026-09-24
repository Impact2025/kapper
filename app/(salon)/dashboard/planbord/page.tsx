import type { Metadata } from "next";
import Link from "next/link";
import { requireJobOwner } from "@/lib/jobs/access";
import { listActiveStaff, listScheduledJobs, listUnscheduledJobs, type JobListItem } from "@/lib/jobs/queries";
import { blocksOverlap } from "@/lib/jobs/model";
import { parseDateInput, startOfAmsterdamWeek } from "@/lib/jobs/datetime";
import { amsterdamDateKey, amsterdamWallTimeToUtc } from "@/lib/salon/timezone";
import { PageHeader, Card, EmptyState } from "@/components/salon/dash-ui";
import { Icon } from "@/components/ui/icon";
import { PriorityBadge, StatusBadge, btnOutline, fmtTime } from "@/components/salon/jobs/ui";
import { QuickScheduleForm } from "@/components/salon/jobs/quick-schedule";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Planbord" };

const DAY_LABEL = new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", weekday: "short", day: "numeric", month: "short" });
const UNASSIGNED = "__none";

export default async function PlanbordPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const { week } = await searchParams;
  const ctx = await requireJobOwner();

  const anchor = parseDateInput(week) ?? new Date();
  const weekStart = startOfAmsterdamWeek(anchor);
  const weekEnd = amsterdamWallTimeToUtc(weekStart, 7, 0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const start = amsterdamWallTimeToUtc(weekStart, i, 0);
    return { key: amsterdamDateKey(start), start };
  });
  const todayKey = amsterdamDateKey(new Date());
  const shift = (n: number) => amsterdamDateKey(amsterdamWallTimeToUtc(weekStart, n * 7, 12 * 60));

  const [scheduled, unscheduled, staff] = await Promise.all([
    listScheduledJobs(ctx.salonId, weekStart, weekEnd),
    listUnscheduledJobs(ctx.salonId),
    listActiveStaff(ctx.salonId),
  ]);

  const rows = [...staff.map((s) => ({ id: s.id, name: s.name })), { id: UNASSIGNED, name: "Niet toegewezen" }];
  const cell = new Map<string, JobListItem[]>();
  for (const j of scheduled) {
    if (!j.scheduledStart) continue;
    const key = `${j.staffId ?? UNASSIGNED}|${amsterdamDateKey(j.scheduledStart)}`;
    cell.set(key, [...(cell.get(key) ?? []), j]);
  }
  const conflicts = (list: JobListItem[], job: JobListItem) =>
    list.some(
      (o) =>
        o.id !== job.id &&
        o.staffId &&
        o.scheduledStart &&
        job.scheduledStart &&
        blocksOverlap({ start: job.scheduledStart, minutes: job.estimatedMinutes }, { start: o.scheduledStart, minutes: o.estimatedMinutes }),
    );

  const label = `${DAY_LABEL.format(days[0]!.start)} – ${DAY_LABEL.format(days[6]!.start)}`;

  return (
    <div>
      <PageHeader
        eyebrow="Planning"
        title="Planbord"
        subtitle={`Week van ${label}`}
        action={
          <div className="flex items-center gap-xs">
            <Link href={`/dashboard/planbord?week=${shift(-1)}`} className={btnOutline} aria-label="Vorige week">
              <Icon name="chevron_left" className="text-[18px]" />
            </Link>
            <Link href="/dashboard/planbord" className={btnOutline}>
              Deze week
            </Link>
            <Link href={`/dashboard/planbord?week=${shift(1)}`} className={btnOutline} aria-label="Volgende week">
              <Icon name="chevron_right" className="text-[18px]" />
            </Link>
          </div>
        }
      />

      {unscheduled.length > 0 && (
        <Card tint="tertiary" className="mb-lg">
          <h2 className="dash-h2 mb-sm text-headline-md text-on-surface">Te plannen ({unscheduled.length})</h2>
          <div className="flex flex-col gap-sm">
            {unscheduled.slice(0, 12).map((j) => (
              <div key={j.id} className="flex flex-col gap-xs rounded-lg bg-surface-container-lowest p-sm md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-xs">
                    <Link href={`/dashboard/klussen/${j.id}`} className="text-label-md font-label-md text-primary hover:underline">
                      {j.number}
                    </Link>
                    <PriorityBadge priority={j.priority} />
                    <StatusBadge status={j.status} />
                  </div>
                  <div className="truncate text-body-md text-on-surface">{j.title}</div>
                  <div className="truncate text-label-sm text-on-surface-variant">
                    {j.customerName ?? "Klant onbekend"}
                    {j.addressLine ? ` · ${j.addressLine}` : ""}
                  </div>
                </div>
                <QuickScheduleForm jobId={j.id} staff={staff} defaultMinutes={j.estimatedMinutes} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {staff.length === 0 && (
        <p className="mb-md rounded-lg bg-secondary-fixed/50 px-sm py-xs text-label-md text-on-surface">
          Voeg je monteurs toe onder{" "}
          <Link className="text-primary hover:underline" href="/dashboard/praktijk">
            Diensten &amp; team
          </Link>{" "}
          om per monteur te plannen.
        </p>
      )}

      {scheduled.length === 0 && unscheduled.length === 0 ? (
        <EmptyState icon="calendar_view_week" title="Niets gepland deze week" description="Geplande klussen verschijnen hier per monteur en per dag." />
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[56rem]">
            <div className="grid grid-cols-[9rem_repeat(7,minmax(0,1fr))] gap-xs">
              <div />
              {days.map((d) => (
                <div
                  key={d.key}
                  className={cn(
                    "rounded-lg px-sm py-xs text-center text-label-md font-label-md",
                    d.key === todayKey ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant",
                  )}
                >
                  {DAY_LABEL.format(d.start)}
                </div>
              ))}
              {rows.map((r) => (
                <div key={r.id} className="contents">
                  <div className="flex items-start pt-sm text-label-md font-label-md text-on-surface">{r.name}</div>
                  {days.map((d) => {
                    const list = (cell.get(`${r.id}|${d.key}`) ?? []).sort(
                      (a, b) => (a.scheduledStart?.getTime() ?? 0) - (b.scheduledStart?.getTime() ?? 0),
                    );
                    return (
                      <div key={d.key} className={cn("min-h-[5rem] rounded-lg border p-xs", d.key === todayKey ? "border-primary/40 bg-primary-fixed/20" : "border-outline-variant/30")}>
                        <div className="flex flex-col gap-xs">
                          {list.map((j) => (
                            <Link
                              key={j.id}
                              href={`/dashboard/klussen/${j.id}`}
                              className={cn(
                                "block rounded-md border-l-4 bg-surface-container-lowest px-xs py-[3px] shadow-sm transition-colors hover:bg-surface",
                                j.priority === "urgent" ? "border-error" : "border-primary",
                                conflicts(list, j) && "ring-2 ring-error",
                              )}
                              title={conflicts(list, j) ? "Overlapt met een andere klus" : undefined}
                            >
                              <div className="text-label-sm font-label-md text-on-surface">
                                {fmtTime(j.scheduledStart)} · {j.estimatedMinutes}m
                              </div>
                              <div className="truncate text-label-sm text-on-surface">{j.title}</div>
                              <div className="truncate text-label-sm text-on-surface-variant">{j.addressLine ?? j.customerName ?? ""}</div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
