/**
 * Pure ticket-domein: categorieën, statussen, SLA's en overgangen. Geen I/O,
 * zodat alles unit-testbaar is (tests/support-tickets.test.ts).
 */

export const TICKET_CATEGORIES = [
  { id: "vraag_vooraf", label: "Vraag vóór aankoop", audience: "prospect" },
  { id: "koppeling", label: "Koppeling (agenda / WhatsApp)", audience: "salon" },
  { id: "ai_receptie", label: "AI-receptie", audience: "salon" },
  { id: "facturatie", label: "Facturatie & abonnement", audience: "salon" },
  { id: "technisch", label: "Technisch probleem", audience: "salon" },
  { id: "privacy", label: "Privacy (AVG)", audience: "both" },
  { id: "feedback", label: "Feedback of idee", audience: "both" },
  { id: "overig", label: "Overig", audience: "both" },
] as const;

export type TicketCategory = (typeof TICKET_CATEGORIES)[number]["id"];
export const TICKET_CATEGORY_IDS = TICKET_CATEGORIES.map((c) => c.id) as [TicketCategory, ...TicketCategory[]];

export const TICKET_STATUSES = ["open", "in_behandeling", "wacht_op_klant", "opgelost", "gesloten"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = ["laag", "normaal", "hoog", "urgent"] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Open",
  in_behandeling: "In behandeling",
  wacht_op_klant: "Wacht op jou",
  opgelost: "Opgelost",
  gesloten: "Gesloten",
};

export const PRIORITY_LABEL: Record<TicketPriority, string> = {
  laag: "Laag",
  normaal: "Normaal",
  hoog: "Hoog",
  urgent: "Urgent",
};

export function categoryLabel(id: string): string {
  return TICKET_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function isTicketCategory(v: unknown): v is TicketCategory {
  return TICKET_CATEGORIES.some((c) => c.id === v);
}

/** Tickets that still need work from our side (vs. waiting on the customer). */
export function isActionable(status: TicketStatus): boolean {
  return status === "open" || status === "in_behandeling";
}

export function isClosed(status: TicketStatus): boolean {
  return status === "opgelost" || status === "gesloten";
}

/** Streef-eerste-reactietijd in uren, per plan (belofte staat in het hulpcentrum). */
export const SLA_HOURS = { elite: 1, pro: 4, essential: 24, prospect: 24 } as const;
export type SlaTier = keyof typeof SLA_HOURS;

export function slaTier(plan: string | null | undefined): SlaTier {
  return plan === "elite" || plan === "pro" || plan === "essential" ? plan : "prospect";
}

/** Urgent tickets are answered twice as fast; never below 30 minutes. */
export function firstResponseDeadline(
  createdAt: Date,
  tier: SlaTier,
  priority: TicketPriority = "normaal",
): Date {
  const hours = SLA_HOURS[tier] * (priority === "urgent" ? 0.5 : 1);
  const ms = Math.max(30 * 60_000, hours * 3_600_000);
  return new Date(createdAt.getTime() + ms);
}

export type SlaState = "ok" | "due_soon" | "breached" | "n/a";

export function slaState(
  deadline: Date | null,
  status: TicketStatus,
  firstResponseAt: Date | null,
  now: Date = new Date(),
): SlaState {
  if (firstResponseAt || isClosed(status) || !deadline) return "n/a";
  const left = deadline.getTime() - now.getTime();
  if (left < 0) return "breached";
  if (left < 3_600_000) return "due_soon";
  return "ok";
}

/** AVG-verzoeken en betalingsproblemen krijgen automatisch een hogere prioriteit. */
export function defaultPriority(category: TicketCategory, plan: string | null | undefined): TicketPriority {
  if (category === "privacy" || category === "facturatie") return "hoog";
  if (category === "technisch" || category === "koppeling") {
    return plan === "elite" ? "hoog" : "normaal";
  }
  return plan === "elite" ? "hoog" : "normaal";
}

const TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  open: ["in_behandeling", "wacht_op_klant", "opgelost", "gesloten"],
  in_behandeling: ["open", "wacht_op_klant", "opgelost", "gesloten"],
  wacht_op_klant: ["open", "in_behandeling", "opgelost", "gesloten"],
  opgelost: ["open", "gesloten"],
  gesloten: [],
};

export function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  return from === to || TRANSITIONS[from].includes(to);
}

/** Status after a new message: customer reply reopens; agent reply waits on customer. */
export function statusAfterMessage(current: TicketStatus, author: "klant" | "agent"): TicketStatus {
  if (current === "gesloten") return current;
  if (author === "klant") return "open";
  return current === "open" || current === "in_behandeling" ? "wacht_op_klant" : current;
}

export function formatTicketNumber(n: number): string {
  return `KA-${n}`;
}

/** Parses "KA-10482" / "ka 10482" / "#10482" from subject lines of inbound mail. */
export function parseTicketNumber(text: string): number | null {
  const m = /(?:KA[-\s#]?|#)(\d{3,9})\b/i.exec(text);
  return m ? Number(m[1]) : null;
}

/** Days without customer reply after which a solved ticket is auto-closed. */
export const AUTO_CLOSE_AFTER_DAYS = 7;
