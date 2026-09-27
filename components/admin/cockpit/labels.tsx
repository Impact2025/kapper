import { Badge } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";
import type { HealthBand, HealthResult } from "@/lib/admin/health";

export const STATUS_LABELS = {
  trial: "Proefperiode",
  active: "Actief",
  past_due: "Achterstallig",
  canceled: "Opgezegd",
} as const;

export const STATUS_TONES = {
  trial: "primary",
  active: "success",
  past_due: "error",
  canceled: "neutral",
} as const;

export const PLAN_LABELS = { essential: "Essential", pro: "Pro", elite: "Elite" } as const;

export const BAND_LABELS: Record<HealthBand, string> = {
  gezond: "Gezond",
  aandacht: "Aandacht",
  risico: "Risico",
  opgezegd: "Opgezegd",
};

const BAND_TONES = { gezond: "success", aandacht: "warning", risico: "error", opgezegd: "neutral" } as const;
const BAND_ICONS = { gezond: "check_circle", aandacht: "error", risico: "warning", opgezegd: "cancel" } as const;

/** Status never by color alone: score + label + icon (dataviz status rule). */
export function HealthBadge({ health }: { health: HealthResult }) {
  return (
    <Badge tone={BAND_TONES[health.band]}>
      <Icon name={BAND_ICONS[health.band]} className="mr-[2px] text-[14px]" />
      {health.band === "opgezegd" ? BAND_LABELS[health.band] : `${health.score} · ${BAND_LABELS[health.band]}`}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: keyof typeof STATUS_LABELS }) {
  return <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>;
}

const rel = new Intl.RelativeTimeFormat("nl-NL", { numeric: "auto" });

/** "vandaag", "3 dagen geleden", "nooit". */
export function relativeDays(date: Date | null, now = new Date()): string {
  if (!date) return "nooit";
  const days = Math.round((date.getTime() - now.getTime()) / 86_400_000);
  if (Math.abs(days) < 1) return "vandaag";
  if (Math.abs(days) < 60) return rel.format(days, "day");
  return rel.format(Math.round(days / 30), "month");
}
