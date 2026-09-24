import {
  PRIORITY_LABEL,
  STATUS_LABEL,
  type SlaState,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/support/ticket-model";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<TicketStatus, string> = {
  open: "bg-secondary-fixed text-on-secondary-fixed",
  in_behandeling: "bg-primary-fixed text-on-primary-fixed",
  wacht_op_klant: "bg-tertiary-fixed text-on-tertiary-fixed",
  opgelost: "bg-primary-fixed-dim text-on-primary-fixed",
  gesloten: "bg-surface-container-high text-on-surface-variant",
};

const PRIORITY_TONE: Record<TicketPriority, string> = {
  laag: "bg-surface-container-high text-on-surface-variant",
  normaal: "bg-surface-container-high text-on-surface",
  hoog: "bg-secondary-fixed text-on-secondary-fixed",
  urgent: "bg-error-container text-on-error-container",
};

const PILL = "inline-flex items-center rounded-full px-sm py-[2px] text-label-sm font-label-sm";

export function StatusBadge({ status, customerFacing = false }: { status: TicketStatus; customerFacing?: boolean }) {
  // Customers see "Wacht op jou"; agents see it phrased from our side.
  const label = !customerFacing && status === "wacht_op_klant" ? "Wacht op klant" : STATUS_LABEL[status];
  return <span className={cn(PILL, STATUS_TONE[status])}>{label}</span>;
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return <span className={cn(PILL, PRIORITY_TONE[priority])}>{PRIORITY_LABEL[priority]}</span>;
}

const SLA_TEXT: Record<Exclude<SlaState, "n/a">, { label: string; tone: string }> = {
  ok: { label: "Binnen SLA", tone: "bg-primary-fixed text-on-primary-fixed" },
  due_soon: { label: "SLA < 1 uur", tone: "bg-secondary-fixed text-on-secondary-fixed" },
  breached: { label: "SLA verlopen", tone: "bg-error-container text-on-error-container" },
};

export function SlaBadge({ state }: { state: SlaState }) {
  if (state === "n/a") return null;
  const s = SLA_TEXT[state];
  return <span className={cn(PILL, s.tone)}>{s.label}</span>;
}
