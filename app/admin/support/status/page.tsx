import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { listRecentIncidents } from "@/lib/status/store";
import { addUpdateAction } from "@/lib/status/actions";
import {
  INCIDENT_STATUSES,
  INCIDENT_STATUS_LABEL,
  SEVERITY_LABEL,
  STATUS_COMPONENTS,
  isActive,
  type IncidentStatus,
  type Severity,
} from "@/lib/status/model";
import { PageHeader, Card, Badge, EmptyState, AdminLink } from "@/components/admin/ui";

const dateFmt = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });

export default async function AdminStatusPage() {
  await requireRole("admin");
  const incidents = await listRecentIncidents(90);
  const active = incidents.filter(isActive);
  const past = incidents.filter((i) => !isActive(i));

  return (
    <div>
      <Link href="/admin/support" className="mb-md inline-block text-label-md text-on-surface-variant hover:text-primary">
        ← Tickets
      </Link>
      <PageHeader
        title="Storingen & onderhoud"
        subtitle="Meldingen verschijnen direct op /status, in het dashboard van salons en in de kennis van de support-chat."
        action={<AdminLink href="/admin/support/status/nieuw">Nieuwe melding</AdminLink>}
      />

      <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">Actief</h2>
      {active.length === 0 ? (
        <EmptyState icon="check_circle" title="Geen actieve meldingen" description="Alle systemen staan op operationeel." />
      ) : (
        <div className="space-y-md">
          {active.map((i) => (
            <Card key={i.id}>
              <div className="mb-xs flex flex-wrap items-center gap-xs">
                <Badge tone={i.severity === "major" ? "error" : i.severity === "maintenance" ? "primary" : "warning"}>{SEVERITY_LABEL[i.severity as Severity]}</Badge>
                <Badge>{INCIDENT_STATUS_LABEL[i.status as IncidentStatus]}</Badge>
                <span className="text-label-sm text-on-surface-variant">sinds {dateFmt.format(i.startedAt)} · {i.components.map((c) => STATUS_COMPONENTS.find((x) => x.id === c)?.label ?? c).join(", ")}</span>
              </div>
              <div className="mb-sm text-body-lg font-label-md text-on-surface">{i.title}</div>
              <p className="mb-sm whitespace-pre-wrap text-label-md text-on-surface-variant">Laatste update: {i.updates[i.updates.length - 1]?.message}</p>
              <form action={addUpdateAction.bind(null, i.id)} className="flex flex-wrap items-start gap-xs">
                <select name="status" defaultValue={i.status} className="rounded-lg border border-outline-variant bg-white px-sm py-xs text-label-md">
                  {INCIDENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {INCIDENT_STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
                <input name="message" required minLength={3} maxLength={2000} placeholder="Update voor klanten…" className="min-w-[16rem] flex-1 rounded-lg border border-outline-variant bg-white px-md py-xs text-label-md outline-none focus:border-primary" />
                <button className="rounded-full bg-primary px-md py-xs text-label-md text-on-primary">Plaats update</button>
              </form>
            </Card>
          ))}
        </div>
      )}

      <h2 className="mb-sm mt-lg font-headline-md text-headline-md text-on-surface">Opgelost (90 dagen)</h2>
      {past.length === 0 ? (
        <p className="text-body-md text-on-surface-variant">Geen afgeronde meldingen.</p>
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-outline-variant/30">
            {past.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-md px-md py-sm">
                <span className="text-body-md text-on-surface">{i.title}</span>
                <span className="text-label-sm text-on-surface-variant">{dateFmt.format(i.startedAt)} → {i.resolvedAt ? dateFmt.format(i.resolvedAt) : "—"}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
