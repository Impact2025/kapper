import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { staff, treatments } from "@/lib/db/schema";
import { jobs } from "@/lib/db/schema-jobs";
import { resolveOnboarding } from "@/lib/verticals/onboarding";
import type { JobContext } from "@/lib/jobs/access";
import { listContracts } from "@/lib/jobs/crm";
import { cadenceLabel, customerDisplayName, formatMoney } from "@/lib/jobs/model";
import { getJobStats, listOpenJobsForBoard, listScheduledJobs } from "@/lib/jobs/queries";
import { missingInvoiceFields, parseBusinessProfile } from "@/lib/jobs/business";
import { amsterdamWallTimeToUtc } from "@/lib/salon/timezone";
import { PageHeader, Card, AdminLink } from "@/components/salon/dash-ui";
import { Icon } from "@/components/ui/icon";
import { PriorityBadge, StatusBadge, fmtDate, fmtTime } from "@/components/salon/jobs/ui";
import { cn } from "@/lib/utils";

const DAY_LABEL = new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", weekday: "long", day: "numeric", month: "long" });
const HOUR = new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", hour: "numeric", hour12: false });
const DONE_TODAY = ["completed", "invoiced", "paid"];

function greeting(now: Date) {
  const h = Number(HOUR.format(now)) % 24;
  return h < 6 ? "Goedenacht" : h < 12 ? "Goedemorgen" : h < 18 ? "Goedemiddag" : "Goedenavond";
}

function ago(from: Date, now: Date) {
  const min = Math.max(0, Math.round((now.getTime() - from.getTime()) / 60_000));
  if (min < 60) return `${min} min geleden`;
  const h = Math.round(min / 60);
  return h < 24 ? `${h} uur geleden` : `${Math.round(h / 24)} d geleden`;
}

/** Eén geldregel in de "Geld"-kaart. */
function MoneyRow({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "alert" | "good" }) {
  return (
    <div className="flex items-baseline justify-between gap-sm py-xs">
      <div className="min-w-0">
        <div className="text-body-md text-on-surface">{label}</div>
        {hint && <div className="text-label-sm text-on-surface-variant">{hint}</div>}
      </div>
      <div className={cn("stat-figure text-body-lg font-semibold", tone === "alert" && "text-error", tone === "good" && "text-primary")}>{value}</div>
    </div>
  );
}

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
  const seasonal = ctx.pack.features.seasonalContracts && ctx.can.contracts;
  const soon = seasonal
    ? (await listContracts(ctx.salonId)).filter((c) => c.status === "active" && c.nextDueAt.getTime() < now.getTime() + 14 * 24 * 3600_000)
    : [];
  const firstName = ctx.userName?.split(" ")[0] ?? ctx.pack.terms.owner;

  const t = ctx.pack.terms;
  const todayDone = today.filter((j) => DONE_TODAY.includes(j.status)).length;
  const todayPct = today.length ? Math.round((todayDone / today.length) * 100) : 0;
  const nextUp = today.find((j) => !DONE_TODAY.includes(j.status));
  const todoRest = open.filter((j) => j.priority !== "urgent" && !today.some((x) => x.id === j.id));
  const summary = [
    stats.scheduledToday
      ? `${stats.scheduledToday} ${stats.scheduledToday === 1 ? t.treatment : t.treatmentPlural} vandaag`
      : `Geen ${t.treatmentPlural} ingepland`,
    stats.inProgress ? `${stats.inProgress} bezig` : null,
    stats.toSchedule ? `${stats.toSchedule} nog in te plannen` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col gap-md md:gap-lg">
      <PageHeader
        eyebrow={DAY_LABEL.format(now)}
        title={`${greeting(now)}, ${firstName}`}
        subtitle={`${ctx.salonName} · ${summary}`}
        action={
          <AdminLink href="/dashboard/klussen/nieuw">
            <Icon name="add" className="text-[18px]" />
            Nieuwe {t.treatment}
          </AdminLink>
        }
      />

      {urgent.length > 0 && (
        <section aria-label="Spoed" className="overflow-hidden rounded-xl border border-error/40 bg-error-container/40">
          <div className="flex items-center gap-sm px-md pt-md">
            <Icon name="emergency" className="text-[22px] text-error" />
            <h2 className="dash-h2 text-headline-md">
              {urgent.length === 1 ? "1 spoedklus wacht op je" : `${urgent.length} spoedklussen wachten op je`}
            </h2>
          </div>
          <div className="mt-xs divide-y divide-error/15">
            {urgent.slice(0, 3).map((j) => (
              <div key={j.id} className="flex flex-wrap items-center gap-sm px-md py-sm">
                <Link href={`/dashboard/klussen/${j.id}`} className="min-w-0 flex-1 hover:underline">
                  <div className="truncate text-body-md font-semibold text-on-surface">{j.title}</div>
                  <div className="truncate text-label-sm text-on-surface-variant">
                    {[j.customerName, j.addressLine, `gemeld ${ago(j.createdAt, now)}`].filter(Boolean).join(" · ")}
                  </div>
                </Link>
                <StatusBadge status={j.status} />
                {j.customerPhone && (
                  <a
                    href={`tel:${j.customerPhone}`}
                    className="inline-flex items-center gap-base rounded-full bg-error px-sm py-xs text-label-md font-label-md text-on-error"
                  >
                    <Icon name="call" className="text-[16px]" />
                    Bel
                  </a>
                )}
              </div>
            ))}
          </div>
          {urgent.length > 3 && (
            <Link href="/dashboard/klussen" className="block border-t border-error/15 px-md py-sm text-label-md text-primary hover:underline">
              Alle {urgent.length} spoedklussen →
            </Link>
          )}
        </section>
      )}

      <div className="grid grid-cols-1 gap-md lg:grid-cols-3">
        <div className="flex flex-col gap-md lg:col-span-2">
          <Card>
            <div className="mb-sm flex items-center justify-between gap-sm">
              <div>
                <h2 className="dash-h2 text-headline-md">Vandaag</h2>
                {today.length > 0 && (
                  <div className="text-label-sm text-on-surface-variant">
                    {todayDone} van {today.length} klaar
                    {nextUp ? ` · volgende om ${fmtTime(nextUp.scheduledStart)}` : " · alles afgerond"}
                  </div>
                )}
              </div>
              <Link href="/dashboard/planbord" className="text-label-md text-primary hover:underline">
                Planbord →
              </Link>
            </div>
            {today.length > 0 && (
              <div
                className="mb-sm h-1.5 overflow-hidden rounded-full bg-surface-container-high"
                role="progressbar"
                aria-valuenow={todayPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Voortgang vandaag"
              >
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${todayPct}%` }} />
              </div>
            )}
            {today.length === 0 ? (
              <div className="flex flex-col items-start gap-xs py-sm">
                <p className="text-body-md text-on-surface-variant">
                  Niets ingepland vandaag
                  {stats.toSchedule
                    ? `, maar er wachten ${stats.toSchedule} ${stats.toSchedule === 1 ? t.treatment : t.treatmentPlural} op een moment.`
                    : "."}
                </p>
                <Link href="/dashboard/planbord" className="text-label-md text-primary hover:underline">
                  Naar het planbord →
                </Link>
              </div>
            ) : (
              <ol className="flex flex-col">
                {today.map((j) => {
                  const done = DONE_TODAY.includes(j.status);
                  const live = j.status === "in_progress" || j.status === "en_route";
                  const end = j.scheduledStart ? new Date(j.scheduledStart.getTime() + j.estimatedMinutes * 60_000) : null;
                  return (
                    <li
                      key={j.id}
                      className={cn("border-l-2 pl-sm", live ? "border-primary bg-primary/5" : "border-outline-variant/40", done && "opacity-60")}
                    >
                      <Link href={`/dashboard/klussen/${j.id}`} className="flex items-center gap-sm py-sm hover:bg-primary/5">
                        <div className="w-16 shrink-0">
                          <div className="stat-figure text-label-md font-semibold">{fmtTime(j.scheduledStart)}</div>
                          {end && <div className="stat-figure text-label-sm text-on-surface-variant">{fmtTime(end)}</div>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={cn("truncate text-body-md", done && "line-through")}>{j.title}</div>
                          <div className="truncate text-label-sm text-on-surface-variant">
                            {[j.addressLine ?? j.customerName, j.staffName].filter(Boolean).join(" · ")}
                          </div>
                        </div>
                        <PriorityBadge priority={j.priority} />
                        <StatusBadge status={j.status} />
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>

          <Card>
            <div className="mb-sm flex items-center justify-between">
              <h2 className="dash-h2 text-headline-md">Nog te doen</h2>
              <Link href="/dashboard/klussen" className="text-label-md text-primary hover:underline">
                Alle {t.treatmentPlural} →
              </Link>
            </div>
            {todoRest.length === 0 ? (
              <p className="text-body-md text-on-surface-variant">Alles staat ingepland of is opgepakt.</p>
            ) : (
              <div className="divide-y divide-outline-variant/30">
                {todoRest.slice(0, 6).map((j) => (
                  <Link
                    key={j.id}
                    href={`/dashboard/klussen/${j.id}`}
                    className="flex flex-col gap-[2px] py-xs hover:bg-primary/5 sm:flex-row sm:items-center sm:gap-sm"
                  >
                    <span className="text-label-sm font-label-md text-on-surface-variant sm:w-24 sm:text-label-md">{j.number}</span>
                    <span className="min-w-0 flex-1 sm:truncate">
                      <span className="text-body-md">{j.title}</span>
                      {j.addressLine && <span className="text-label-sm text-on-surface-variant"> · {j.addressLine}</span>}
                    </span>
                    <span className="flex items-center gap-xs">
                      <PriorityBadge priority={j.priority} />
                      <StatusBadge status={j.status} />
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-md">
          <Card>
            <div className="mb-xs flex items-center justify-between">
              <h2 className="dash-h2 text-headline-md">Geld</h2>
              <Link href="/dashboard/facturatie" className="text-label-md text-primary hover:underline">
                Facturen →
              </Link>
            </div>
            <div className="divide-y divide-outline-variant/30">
              <MoneyRow
                label="Achterstallig"
                value={formatMoney(stats.invoicesOverdueCents)}
                hint={
                  stats.invoicesOverdueCount
                    ? `${stats.invoicesOverdueCount} ${stats.invoicesOverdueCount === 1 ? "factuur" : "facturen"} over de datum`
                    : "Niets te laat"
                }
                tone={stats.invoicesOverdueCount ? "alert" : undefined}
              />
              <MoneyRow
                label="Openstaand"
                value={formatMoney(stats.invoicesOpenCents)}
                hint={`${stats.invoicesOpenCount} ${stats.invoicesOpenCount === 1 ? "factuur" : "facturen"} verstuurd`}
              />
              <MoneyRow label="Offertes open" value={formatMoney(stats.quotesAwaitingCents)} hint={`${stats.quotesAwaiting} wachten op antwoord`} />
              <MoneyRow label="Betaald deze maand" value={formatMoney(stats.paidThisMonthCents)} tone="good" />
            </div>
            <p className="mt-xs text-label-sm text-on-surface-variant">Bedragen incl. btw.</p>
          </Card>

          {seasonal && soon.length > 0 && (
            <Card>
              <div className="mb-sm flex items-center justify-between">
                <h2 className="dash-h2 text-headline-md">Onderhoud, 14 dagen</h2>
                <Link href="/dashboard/onderhoud" className="text-label-md text-primary hover:underline">
                  Alles →
                </Link>
              </div>
              <div className="divide-y divide-outline-variant/30">
                {soon.slice(0, 5).map((c) => (
                  <Link key={c.id} href={`/dashboard/klanten/${c.customerId}`} className="flex items-center gap-sm py-xs hover:bg-primary/5">
                    <span className="w-20 shrink-0 text-label-md font-label-md">{fmtDate(c.nextDueAt)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-body-md">{customerDisplayName({ name: c.customerName, companyName: c.customerCompany })}</div>
                      <div className="truncate text-label-sm text-on-surface-variant">
                        {c.name} · {cadenceLabel(c).toLowerCase()}
                      </div>
                    </div>
                    <span className="text-label-md">{formatMoney(c.priceCents)}</span>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {doneCount < steps.length && (
            <details open={doneCount < Math.ceil(steps.length / 2)} className="dash-card group p-md">
              <summary className="flex cursor-pointer list-none items-center gap-sm">
                <Icon name="checklist" className="text-[20px] text-primary" />
                <span className="dash-h2 flex-1 text-body-lg">Maak je bedrijf klaar</span>
                <span className="stat-figure text-label-md text-on-surface-variant">
                  {doneCount}/{steps.length}
                </span>
                <Icon name="expand_more" className="text-[20px] text-on-surface-variant transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-sm h-1.5 overflow-hidden rounded-full bg-surface-container-high">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((doneCount / steps.length) * 100)}%` }} />
              </div>
              <div className="mt-sm flex flex-col gap-xs">
                {steps.map((s) => (
                  <div key={s.key} className="flex items-start gap-sm">
                    <Icon
                      name={s.done ? "check_circle" : "radio_button_unchecked"}
                      filled={s.done}
                      className={cn("mt-[2px] text-[18px]", s.done ? "text-primary" : "text-outline")}
                    />
                    <span className={cn("min-w-0 flex-1 text-body-md", s.done ? "text-on-surface-variant line-through" : "text-on-surface")}>
                      {s.label}
                    </span>
                    {!s.done && (
                      <Link href={s.href} className="shrink-0 text-label-sm text-primary hover:underline">
                        Instellen →
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
