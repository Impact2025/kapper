/**
 * Klus-CRM rapportage — pure aggregation over already-fetched rows, so every
 * number on the page is unit tested. (DB access lives in lib/jobs/reports.ts.)
 */
export interface ReportJob {
  id: string;
  category: string;
  source: string;
  priority: string;
  status: string;
  staffId: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

export interface ReportDoc {
  kind: string; // quote | invoice
  status: string;
  totalCents: number;
  vatCents: number;
  jobId: string | null;
  issuedAt: Date | null;
  paidAt: Date | null;
}

export interface JobReport {
  created: number;
  completed: number;
  urgent: number;
  viaAi: number;
  /** Share (0-100) of new klussen that came in through the AI receptionist. */
  aiSharePercent: number;
  /** Average hours from aanvraag to afgerond, over klussen completed in the period. */
  avgLeadTimeHours: number | null;
  quotesSent: number;
  quotesAccepted: number;
  /** Accepted / (accepted + declined-or-open sent), 0-100; null when no quotes. */
  quoteAcceptancePercent: number | null;
  invoicedCents: number;
  paidCents: number;
  perCategory: { category: string; count: number }[];
  perStaff: { staffId: string | null; jobs: number; completed: number; invoicedCents: number }[];
  trend: { date: string; count: number }[];
}

export function buildJobReport(input: {
  jobs: ReportJob[];
  docs: ReportDoc[];
  since: Date;
  dateKey: (d: Date) => string;
  days: number;
  now?: Date;
}): JobReport {
  const { jobs, docs, since, dateKey, days } = input;
  const now = input.now ?? new Date();

  const inPeriod = jobs.filter((j) => j.createdAt >= since);
  const completedInPeriod = jobs.filter((j) => j.completedAt && j.completedAt >= since);
  const viaAi = inPeriod.filter((j) => j.source === "ai_whatsapp" || j.source === "ai_phone").length;

  const leadTimes = completedInPeriod.map((j) => (j.completedAt!.getTime() - j.createdAt.getTime()) / 3_600_000).filter((h) => h >= 0);
  const avgLeadTimeHours = leadTimes.length ? Math.round((leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length) * 10) / 10 : null;

  const quotes = docs.filter((d) => d.kind === "quote" && d.issuedAt && d.issuedAt >= since && d.status !== "draft" && d.status !== "void");
  const quotesAccepted = quotes.filter((q) => q.status === "accepted").length;
  const invoices = docs.filter((d) => d.kind === "invoice" && d.issuedAt && d.issuedAt >= since && (d.status === "sent" || d.status === "paid"));
  const paid = docs.filter((d) => d.kind === "invoice" && d.status === "paid" && d.paidAt && d.paidAt >= since);

  const catCount = new Map<string, number>();
  for (const j of inPeriod) catCount.set(j.category, (catCount.get(j.category) ?? 0) + 1);

  const jobStaff = new Map(jobs.map((j) => [j.id, j.staffId]));
  const staff = new Map<string | null, { jobs: number; completed: number; invoicedCents: number }>();
  const bucket = (id: string | null) => {
    if (!staff.has(id)) staff.set(id, { jobs: 0, completed: 0, invoicedCents: 0 });
    return staff.get(id)!;
  };
  for (const j of inPeriod) bucket(j.staffId).jobs++;
  for (const j of completedInPeriod) bucket(j.staffId).completed++;
  for (const inv of invoices) if (inv.jobId && jobStaff.has(inv.jobId)) bucket(jobStaff.get(inv.jobId) ?? null).invoicedCents += inv.totalCents - inv.vatCents;

  const perDay = new Map<string, number>();
  for (const j of inPeriod) perDay.set(dateKey(j.createdAt), (perDay.get(dateKey(j.createdAt)) ?? 0) + 1);
  const trend = Array.from({ length: days }, (_, i) => {
    const key = dateKey(new Date(now.getTime() - (days - 1 - i) * 86_400_000));
    return { date: key, count: perDay.get(key) ?? 0 };
  });

  return {
    created: inPeriod.length,
    completed: completedInPeriod.length,
    urgent: inPeriod.filter((j) => j.priority === "urgent").length,
    viaAi,
    aiSharePercent: inPeriod.length ? Math.round((viaAi / inPeriod.length) * 100) : 0,
    avgLeadTimeHours,
    quotesSent: quotes.length,
    quotesAccepted,
    quoteAcceptancePercent: quotes.length ? Math.round((quotesAccepted / quotes.length) * 100) : null,
    // excl. btw: what the bedrijf actually earns
    invoicedCents: invoices.reduce((s, d) => s + d.totalCents - d.vatCents, 0),
    paidCents: paid.reduce((s, d) => s + d.totalCents - d.vatCents, 0),
    perCategory: [...catCount.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count),
    perStaff: [...staff.entries()].map(([staffId, v]) => ({ staffId, ...v })).sort((a, b) => b.invoicedCents - a.invoicedCents || b.jobs - a.jobs),
    trend,
  };
}
