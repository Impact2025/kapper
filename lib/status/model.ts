/** Pure statuspagina-logica (geen I/O; unit-getest in tests/status.test.ts). */

export const STATUS_COMPONENTS = [
  { id: "app", label: "Website & dashboard" },
  { id: "whatsapp", label: "AI-receptie via WhatsApp" },
  { id: "telefoon", label: "AI-receptie via telefoon" },
  { id: "agenda", label: "Agenda-koppelingen" },
  { id: "betalingen", label: "Betalingen & facturatie" },
  { id: "mail", label: "E-mail & herinneringen" },
  { id: "support", label: "Support-chat & tickets" },
] as const;

export type ComponentId = (typeof STATUS_COMPONENTS)[number]["id"];
export const COMPONENT_IDS = STATUS_COMPONENTS.map((c) => c.id) as [ComponentId, ...ComponentId[]];

export const SEVERITIES = ["minor", "major", "maintenance"] as const;
export type Severity = (typeof SEVERITIES)[number];
export const INCIDENT_STATUSES = ["investigating", "identified", "monitoring", "resolved"] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const SEVERITY_LABEL: Record<Severity, string> = {
  minor: "Beperkte hinder",
  major: "Storing",
  maintenance: "Gepland onderhoud",
};
export const INCIDENT_STATUS_LABEL: Record<IncidentStatus, string> = {
  investigating: "We onderzoeken het",
  identified: "Oorzaak gevonden",
  monitoring: "We monitoren de oplossing",
  resolved: "Opgelost",
};

export type ComponentState = "operational" | "degraded" | "outage" | "maintenance";
export const STATE_LABEL: Record<ComponentState, string> = {
  operational: "Operationeel",
  degraded: "Verminderde prestaties",
  outage: "Storing",
  maintenance: "Onderhoud",
};

export interface IncidentLike {
  severity: string;
  status: string;
  components: string[];
}

export function isActive(i: Pick<IncidentLike, "status">): boolean {
  return i.status !== "resolved";
}

const RANK: Record<ComponentState, number> = { operational: 0, maintenance: 1, degraded: 2, outage: 3 };

function stateFor(severity: string): ComponentState {
  return severity === "major" ? "outage" : severity === "maintenance" ? "maintenance" : "degraded";
}

/** Worst active incident wins per component; `forced` are automatic probe results (e.g. DB down). */
export function componentStates(
  incidents: IncidentLike[],
  forced: Partial<Record<ComponentId, ComponentState>> = {},
): Record<ComponentId, ComponentState> {
  const out = Object.fromEntries(STATUS_COMPONENTS.map((c) => [c.id, forced[c.id] ?? "operational"])) as Record<ComponentId, ComponentState>;
  for (const inc of incidents.filter(isActive)) {
    const s = stateFor(inc.severity);
    for (const c of inc.components) {
      if ((c as ComponentId) in out && RANK[s] > RANK[out[c as ComponentId]]) out[c as ComponentId] = s;
    }
  }
  return out;
}

export function overallState(states: Record<string, ComponentState>): ComponentState {
  return Object.values(states).reduce<ComponentState>((worst, s) => (RANK[s] > RANK[worst] ? s : worst), "operational");
}

export const OVERALL_HEADLINE: Record<ComponentState, string> = {
  operational: "Alle systemen werken normaal",
  maintenance: "Gepland onderhoud loopt",
  degraded: "Sommige onderdelen ondervinden hinder",
  outage: "We hebben een storing",
};

/** Zin voor de support-chat: wat speelt er nu, zodat de AI niet blind "probeer het opnieuw" zegt. */
export function incidentsForPrompt(
  incidents: { title: string; severity: string; status: string; components: string[] }[],
): string {
  const active = incidents.filter(isActive);
  if (!active.length) return "Geen bekende storingen of onderhoud.";
  return active
    .map((i) => {
      const comps = i.components
        .map((c) => STATUS_COMPONENTS.find((x) => x.id === c)?.label ?? c)
        .join(", ");
      return `- ${SEVERITY_LABEL[i.severity as Severity] ?? i.severity}: ${i.title} (${INCIDENT_STATUS_LABEL[i.status as IncidentStatus] ?? i.status})${comps ? ` — betreft: ${comps}` : ""}`;
    })
    .join("\n");
}

export function isSeverity(v: unknown): v is Severity {
  return (SEVERITIES as readonly string[]).includes(v as string);
}
export function isIncidentStatus(v: unknown): v is IncidentStatus {
  return (INCIDENT_STATUSES as readonly string[]).includes(v as string);
}
