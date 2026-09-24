/**
 * Klus-CRM domain model — pure, DB-free, fully unit tested (tests/jobs-model).
 * Statuses/kinds are string unions (the DB columns are plain text, see
 * lib/db/schema-jobs.ts), so a new status is a code change, not a migration.
 */

/* ------------------------------ statuses ------------------------------ */
export const JOB_STATUSES = [
  "new",
  "quoted",
  "scheduled",
  "en_route",
  "in_progress",
  "on_hold",
  "completed",
  "invoiced",
  "paid",
  "cancelled",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  new: "Nieuw",
  quoted: "Offerte uit",
  scheduled: "Ingepland",
  en_route: "Onderweg",
  in_progress: "Bezig",
  on_hold: "In de wacht",
  completed: "Uitgevoerd",
  invoiced: "Gefactureerd",
  paid: "Betaald",
  cancelled: "Geannuleerd",
};

export type Tone = "primary" | "secondary" | "tertiary" | "neutral" | "error";

export const JOB_STATUS_TONE: Record<JobStatus, Tone> = {
  new: "tertiary",
  quoted: "secondary",
  scheduled: "primary",
  en_route: "primary",
  in_progress: "primary",
  on_hold: "neutral",
  completed: "secondary",
  invoiced: "secondary",
  paid: "primary",
  cancelled: "neutral",
};

/** Statuses that still need work (shown on the board / planner). */
export const OPEN_JOB_STATUSES: JobStatus[] = ["new", "quoted", "scheduled", "en_route", "in_progress", "on_hold"];
/** Work done, money still to be collected or already collected. */
export const CLOSED_JOB_STATUSES: JobStatus[] = ["completed", "invoiced", "paid", "cancelled"];

const TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  new: ["quoted", "scheduled", "in_progress", "cancelled"],
  quoted: ["new", "scheduled", "cancelled"],
  scheduled: ["en_route", "in_progress", "on_hold", "new", "cancelled"],
  en_route: ["in_progress", "scheduled", "on_hold", "cancelled"],
  in_progress: ["completed", "on_hold", "scheduled", "cancelled"],
  on_hold: ["scheduled", "in_progress", "cancelled"],
  completed: ["invoiced", "paid", "in_progress"],
  invoiced: ["paid", "completed"],
  paid: [],
  cancelled: ["new"],
};

export function isJobStatus(v: unknown): v is JobStatus {
  return typeof v === "string" && (JOB_STATUSES as readonly string[]).includes(v);
}

export function canTransition(from: JobStatus, to: JobStatus): boolean {
  return from === to || TRANSITIONS[from].includes(to);
}

export function nextStatuses(from: JobStatus): JobStatus[] {
  return TRANSITIONS[from];
}

/* ------------------------------ priority ------------------------------ */
export const JOB_PRIORITIES = ["urgent", "high", "normal", "low"] as const;
export type JobPriority = (typeof JOB_PRIORITIES)[number];

export const JOB_PRIORITY_LABEL: Record<JobPriority, string> = {
  urgent: "Spoed",
  high: "Hoog",
  normal: "Normaal",
  low: "Laag",
};

export const JOB_PRIORITY_RANK: Record<JobPriority, number> = { urgent: 0, high: 1, normal: 2, low: 3 };

export function isJobPriority(v: unknown): v is JobPriority {
  return typeof v === "string" && (JOB_PRIORITIES as readonly string[]).includes(v);
}

/** Words that make a klus spoed regardless of the picked category. */
const URGENT_SIGNALS = [
  "gaslucht",
  "gaslek",
  "gas ruiken",
  "ruik gas",
  "water door het plafond",
  "water door plafond",
  "overstroming",
  "overstroomt",
  "leiding gesprongen",
  "gesprongen leiding",
  "water komt naar binnen",
  "water staat",
  "geen water",
  "stroomt",
  "spoed",
  "noodgeval",
  "dringend",
  "acuut",
];

/** Deterministic spoed-detection used by manual intake and as a safety net
 * behind the AI's own classification. */
export function detectUrgency(text: string, categoryUrgent = false): JobPriority {
  // A negated spoed ("geen spoed", "niet dringend") must not trip the signals.
  const t = text
    .toLowerCase()
    .replace(/\b(geen|niet|zonder)\s+(echt\s+|zo\s+)?(spoed|dringend|urgent|acuut|haast)\w*/g, " ");
  if (URGENT_SIGNALS.some((s) => t.includes(s))) return "urgent";
  return categoryUrgent ? "urgent" : "normal";
}

/* ------------------------------ sources ------------------------------ */
export const JOB_SOURCES = ["ai_whatsapp", "ai_phone", "manual", "contract", "web"] as const;
export type JobSource = (typeof JOB_SOURCES)[number];

export const JOB_SOURCE_LABEL: Record<JobSource, string> = {
  ai_whatsapp: "AI · WhatsApp",
  ai_phone: "AI · Telefoon",
  manual: "Handmatig",
  contract: "Onderhoudscontract",
  web: "Website",
};

/* ------------------------------ checklist ------------------------------ */
export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export function buildChecklist(labels: string[]): ChecklistItem[] {
  return labels.map((label, i) => ({ id: `c${i + 1}`, label, done: false }));
}

export function checklistProgress(items: ChecklistItem[]): { done: number; total: number } {
  return { done: items.filter((i) => i.done).length, total: items.length };
}

/* ------------------------------ documents ------------------------------ */
export type DocumentKind = "quote" | "invoice";
export type QuoteStatus = "draft" | "sent" | "accepted" | "declined" | "expired";
export type InvoiceStatus = "draft" | "sent" | "paid" | "void";
export type DocumentStatus = QuoteStatus | InvoiceStatus;

export const DOCUMENT_KIND_LABEL: Record<DocumentKind, string> = { quote: "Offerte", invoice: "Factuur" };

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Concept",
  sent: "Verstuurd",
  accepted: "Geaccepteerd",
  declined: "Afgewezen",
  expired: "Verlopen",
};

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Concept",
  sent: "Openstaand",
  paid: "Betaald",
  void: "Vervallen",
};

export const LINE_KINDS = ["labor", "material", "travel", "other"] as const;
export type LineKind = (typeof LINE_KINDS)[number];

export const LINE_KIND_LABEL: Record<LineKind, string> = {
  labor: "Arbeid",
  material: "Materiaal",
  travel: "Voorrijkosten",
  other: "Overig",
};

export const LINE_UNITS = ["uur", "stuk", "m", "m²", "post", "dag"] as const;

/** btw-tarieven a Dutch klus can legitimately carry. 0 = verlegd/vrijgesteld. */
export const VAT_RATES = [21, 9, 0] as const;

export interface DocLineInput {
  quantity: number;
  unitPriceCents: number;
  vatRatePercent: number;
}

export interface VatBucket {
  ratePercent: number;
  netCents: number;
  vatCents: number;
}

export interface DocumentTotals {
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  breakdown: VatBucket[];
}

/** Line net = round(quantity × unit price). Kept explicit so a printed line
 * always equals what the totals add up. */
export function lineNetCents(line: Pick<DocLineInput, "quantity" | "unitPriceCents">): number {
  return Math.round(line.quantity * line.unitPriceCents);
}

/**
 * Totals per btw-tarief. Btw is computed once per rate group on the sum of
 * that group's nets (how a Dutch factuur is specified), not per line, so
 * cents never drift between the breakdown and the total.
 */
export function computeDocumentTotals(lines: DocLineInput[]): DocumentTotals {
  const byRate = new Map<number, number>();
  for (const l of lines) {
    byRate.set(l.vatRatePercent, (byRate.get(l.vatRatePercent) ?? 0) + lineNetCents(l));
  }
  const breakdown: VatBucket[] = [...byRate.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([ratePercent, netCents]) => ({
      ratePercent,
      netCents,
      vatCents: Math.round((netCents * ratePercent) / 100),
    }));
  const subtotalCents = breakdown.reduce((s, b) => s + b.netCents, 0);
  const vatCents = breakdown.reduce((s, b) => s + b.vatCents, 0);
  return { subtotalCents, vatCents, totalCents: subtotalCents + vatCents, breakdown };
}

/** Prefixes: K = klus, O = offerte, F = factuur. */
export function formatNumber(key: "job" | "quote" | "invoice", year: number, seq: number): string {
  const prefix = key === "job" ? "K" : key === "quote" ? "O" : "F";
  return `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
}

export type InvoicePaymentState = "draft" | "open" | "overdue" | "paid" | "void";

export function invoicePaymentState(
  doc: { status: string; dueAt: Date | null },
  now: Date = new Date(),
): InvoicePaymentState {
  if (doc.status === "paid") return "paid";
  if (doc.status === "void") return "void";
  if (doc.status === "draft") return "draft";
  return doc.dueAt && doc.dueAt.getTime() < now.getTime() ? "overdue" : "open";
}

export function isQuoteExpired(doc: { status: string; validUntil: Date | null }, now: Date = new Date()): boolean {
  return doc.status === "sent" && !!doc.validUntil && doc.validUntil.getTime() < now.getTime();
}

export function addDays(from: Date, days: number): Date {
  const d = new Date(from.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/* ------------------------------ contracts ------------------------------ */
/** Month arithmetic that clamps to month end (31 jan + 1 mnd = 28/29 feb)
 * instead of rolling over into the next month. */
export function addMonths(from: Date, months: number): Date {
  const d = new Date(from.getTime());
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
}

export interface ContractDueInput {
  status: string;
  nextDueAt: Date;
  leadDays: number;
  lastGeneratedForDue: Date | null;
}

/** True when the klus for this contract's next beurt should be generated now:
 * inside the lead window and not yet generated for this due date. */
export function contractNeedsGeneration(c: ContractDueInput, now: Date = new Date()): boolean {
  if (c.status !== "active") return false;
  if (c.lastGeneratedForDue && c.lastGeneratedForDue.getTime() === c.nextDueAt.getTime()) return false;
  return addDays(c.nextDueAt, -c.leadDays).getTime() <= now.getTime();
}

/** Where nextDueAt moves to once a beurt has been generated/done. Skips over
 * missed cycles so a long-paused contract doesn't spawn a backlog. */
export function advanceDue(nextDueAt: Date, intervalMonths: number, now: Date = new Date()): Date {
  let next = addMonths(nextDueAt, intervalMonths);
  let guard = 0;
  while (next.getTime() < now.getTime() && guard++ < 240) next = addMonths(next, intervalMonths);
  return next;
}

/* ------------------------------ addresses ------------------------------ */
const POSTAL_RE = /^(\d{4})\s?([A-Za-z]{2})$/;

export function normalizePostalCode(input: string): string | null {
  const m = input.trim().match(POSTAL_RE);
  if (!m) return null;
  return `${m[1]} ${m[2]!.toUpperCase()}`;
}

export function formatAddressLine(a: {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
}): string {
  return `${a.street} ${a.houseNumber}, ${a.postalCode} ${a.city}`;
}

/** "Wie is de klant" line: company first when it's a zakelijke klant. */
export function customerDisplayName(c: { name: string; companyName?: string | null }): string {
  return c.companyName ? `${c.companyName} (${c.name})` : c.name;
}

export const CUSTOMER_TYPES = ["private", "business", "landlord", "vve"] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];
export const CUSTOMER_TYPE_LABEL: Record<CustomerType, string> = {
  private: "Particulier",
  business: "Zakelijk",
  landlord: "Verhuurder",
  vve: "VvE / beheerder",
};

/* ------------------------------ planner ------------------------------ */
/** Sort for the spoed-first board: urgent first, then by planned start,
 * then oldest created. */
export function compareJobsForBoard(
  a: { priority: string; scheduledStart: Date | null; createdAt: Date },
  b: { priority: string; scheduledStart: Date | null; createdAt: Date },
): number {
  const pa = JOB_PRIORITY_RANK[a.priority as JobPriority] ?? 2;
  const pb = JOB_PRIORITY_RANK[b.priority as JobPriority] ?? 2;
  if (pa !== pb) return pa - pb;
  const sa = a.scheduledStart?.getTime() ?? Number.POSITIVE_INFINITY;
  const sb = b.scheduledStart?.getTime() ?? Number.POSITIVE_INFINITY;
  if (sa !== sb) return sa - sb;
  return a.createdAt.getTime() - b.createdAt.getTime();
}

/** Do two planned blocks overlap? Used for the planner's conflict warning. */
export function blocksOverlap(
  a: { start: Date; minutes: number },
  b: { start: Date; minutes: number },
): boolean {
  const aEnd = a.start.getTime() + a.minutes * 60_000;
  const bEnd = b.start.getTime() + b.minutes * 60_000;
  return a.start.getTime() < bEnd && b.start.getTime() < aEnd;
}

/* ------------------------------ formatting ------------------------------ */
const MONEY = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });

/** "€ 1.234,50" — documents always show cents (formatEur in utils rounds). */
export function formatMoney(cents: number): string {
  return MONEY.format(cents / 100);
}

/** Decimal-comma quantity for print: 1,5 / 2. */
export function formatQuantity(q: number): string {
  return Number.isInteger(q) ? String(q) : q.toLocaleString("nl-NL", { maximumFractionDigits: 2 });
}

/* ------------------------------ payment reminders ------------------------------ */
/** Days after the due date at which the 1st/2nd/3rd reminder goes out. */
export const REMINDER_OFFSET_DAYS = [1, 8, 15] as const;

export function reminderDue(
  doc: { status: string; dueAt: Date | null; reminderCount: number },
  now: Date = new Date(),
): boolean {
  if (doc.status !== "sent" || !doc.dueAt) return false;
  const offset = REMINDER_OFFSET_DAYS[doc.reminderCount];
  if (offset === undefined) return false;
  return addDays(doc.dueAt, offset).getTime() <= now.getTime();
}
