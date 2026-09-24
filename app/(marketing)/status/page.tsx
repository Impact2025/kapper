import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { listRecentIncidents, probeSystem } from "@/lib/status/store";
import {
  INCIDENT_STATUS_LABEL,
  OVERALL_HEADLINE,
  SEVERITY_LABEL,
  STATE_LABEL,
  STATUS_COMPONENTS,
  componentStates,
  isActive,
  overallState,
  type ComponentState,
  type IncidentStatus,
  type Severity,
} from "@/lib/status/model";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Systeemstatus",
  description: "Actuele status van KapperAssistent: website, AI-receptie, agenda-koppelingen, betalingen en support.",
  alternates: { canonical: "/status" },
};

// Fresh enough for an outage page, cheap enough to cache.
export const revalidate = 60;

const STATE_STYLE: Record<ComponentState, { dot: string; banner: string; icon: string }> = {
  operational: { dot: "bg-primary", banner: "bg-primary-fixed text-on-primary-fixed", icon: "check_circle" },
  maintenance: { dot: "bg-tertiary", banner: "bg-tertiary-fixed text-on-tertiary-fixed", icon: "build" },
  degraded: { dot: "bg-secondary", banner: "bg-secondary-fixed text-on-secondary-fixed", icon: "warning" },
  outage: { dot: "bg-error", banner: "bg-error-container text-on-error-container", icon: "error" },
};

const dateFmt = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });

export default async function StatusPage() {
  const [incidents, probe] = await Promise.all([listRecentIncidents(30), probeSystem()]);
  const states = componentStates(incidents, { app: probe.app });
  const overall = overallState(states);
  const active = incidents.filter(isActive);
  const past = incidents.filter((i) => !isActive(i));
  const style = STATE_STYLE[overall];

  return (
    <section className="bg-surface py-xl">
      <div className="mx-auto max-w-3xl px-margin-mobile md:px-xl">
        <h1 className="mkt-h1 mb-md text-display-lg text-on-surface">Systeemstatus</h1>

        <div className={cn("mb-lg flex items-center gap-sm rounded-xl p-md", style.banner)} role="status">
          <Icon name={style.icon} filled className="text-[28px]" />
          <div className="text-body-lg font-label-md">{OVERALL_HEADLINE[overall]}</div>
        </div>

        {active.length > 0 && (
          <div className="mb-lg space-y-md">
            <h2 className="text-label-md font-label-md uppercase tracking-wide text-on-surface-variant">Actueel</h2>
            {active.map((i) => (
              <IncidentCard key={i.id} incident={i} />
            ))}
          </div>
        )}

        <h2 className="mb-sm text-label-md font-label-md uppercase tracking-wide text-on-surface-variant">Onderdelen</h2>
        <ul className="mb-lg divide-y divide-outline-variant/40 rounded-xl border border-outline-variant/50 bg-white">
          {STATUS_COMPONENTS.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-md px-md py-sm">
              <span className="text-body-md text-on-surface">{c.label}</span>
              <span className="flex items-center gap-xs text-label-md text-on-surface-variant">
                <span className={cn("h-[10px] w-[10px] rounded-full", STATE_STYLE[states[c.id]].dot)} aria-hidden />
                {STATE_LABEL[states[c.id]]}
              </span>
            </li>
          ))}
        </ul>
        <p className="mb-xl text-label-sm text-on-surface-variant">
          De bereikbaarheid van website en dashboard wordt automatisch gemeten (databaseverbinding
          {probe.dbLatencyMs != null ? `, nu ${probe.dbLatencyMs} ms` : ""}). Overige onderdelen tonen wat ons team meldt.
        </p>

        <h2 className="mb-sm text-label-md font-label-md uppercase tracking-wide text-on-surface-variant">Afgelopen 30 dagen</h2>
        {past.length === 0 ? (
          <p className="rounded-xl border border-outline-variant/50 bg-white p-md text-body-md text-on-surface-variant">Geen meldingen in de afgelopen 30 dagen.</p>
        ) : (
          <div className="space-y-md">
            {past.map((i) => (
              <IncidentCard key={i.id} incident={i} />
            ))}
          </div>
        )}

        <div className="mt-xl rounded-xl bg-primary-fixed/40 p-lg text-center">
          <p className="text-body-md text-on-surface">Merk je iets wat hier niet staat?</p>
          <Link href="/contact" className="mt-sm inline-block text-label-md text-primary underline">
            Maak een ticket
          </Link>
        </div>
      </div>
    </section>
  );
}

function IncidentCard({ incident }: { incident: Awaited<ReturnType<typeof listRecentIncidents>>[number] }) {
  const comps = incident.components.map((c) => STATUS_COMPONENTS.find((x) => x.id === c)?.label ?? c);
  return (
    <article className="rounded-xl border border-outline-variant/50 bg-white p-md">
      <div className="flex flex-wrap items-center gap-xs text-label-sm">
        <span className="rounded-full bg-surface-container-high px-sm py-[2px]">{SEVERITY_LABEL[incident.severity as Severity] ?? incident.severity}</span>
        <span className="text-on-surface-variant">{dateFmt.format(incident.startedAt)}</span>
        {comps.length > 0 && <span className="text-on-surface-variant">· {comps.join(", ")}</span>}
      </div>
      <h3 className="mt-xs text-body-lg font-label-md text-on-surface">{incident.title}</h3>
      <ol className="mt-sm space-y-sm border-l-2 border-outline-variant/50 pl-md">
        {[...incident.updates].reverse().map((u, idx) => (
          <li key={idx}>
            <div className="text-label-sm text-on-surface-variant">
              <strong className="text-on-surface">{INCIDENT_STATUS_LABEL[u.status as IncidentStatus] ?? u.status}</strong> · {dateFmt.format(new Date(u.at))}
            </div>
            <p className="whitespace-pre-wrap text-body-md text-on-surface">{u.message}</p>
          </li>
        ))}
      </ol>
    </article>
  );
}
