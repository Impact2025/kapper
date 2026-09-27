/**
 * Pure margin maths for the cockpit: what a salon pays (MRR, euro cents)
 * against what its AI + voice usage costs us (micro-euro over `days` days),
 * normalised to a 30-day month.
 */

export type MarginTone = "healthy" | "watch" | "loss" | "unknown";

export interface Margin {
  costEurMonth: number;
  revenueEurMonth: number;
  marginEurMonth: number;
  /** null when there's no revenue to divide by (trial, free, canceled). */
  marginPct: number | null;
  tone: MarginTone;
}

/** AI cost above this share of revenue is worth a look; above 100% it's a loss. */
export const WATCH_COST_SHARE = 0.3;

export function monthlyMargin(input: { mrrCents: number; costMicroEur: number; days: number }): Margin {
  const days = Math.max(1, input.days);
  const costEurMonth = (input.costMicroEur / 1_000_000) * (30 / days);
  const revenueEurMonth = Math.max(0, input.mrrCents) / 100;
  const marginEurMonth = revenueEurMonth - costEurMonth;
  if (revenueEurMonth === 0) {
    return { costEurMonth, revenueEurMonth, marginEurMonth, marginPct: null, tone: costEurMonth > 0 ? "loss" : "unknown" };
  }
  const share = costEurMonth / revenueEurMonth;
  return {
    costEurMonth,
    revenueEurMonth,
    marginEurMonth,
    marginPct: Math.round((marginEurMonth / revenueEurMonth) * 1000) / 10,
    tone: share >= 1 ? "loss" : share >= WATCH_COST_SHARE ? "watch" : "healthy",
  };
}

/** Euro with cents — AI costs are often fractions of a euro. */
export function formatEurPrecise(amount: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: amount !== 0 && Math.abs(amount) < 0.1 ? 4 : 2,
  }).format(amount);
}

/** 1234567 → "1,2 mln", 12345 → "12,3k". */
export function formatCompact(n: number): string {
  return new Intl.NumberFormat("nl-NL", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}
