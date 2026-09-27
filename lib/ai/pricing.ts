/**
 * Pure cost pricing for the AI gateway. No hardcoded provider rates: the
 * gateway talks to OpenModel (model set by OPENMODEL_MODEL), whose rates
 * change and differ per contract, so a wrong built-in number would be worse
 * than none. Rates come from AI_PRICING_JSON, e.g.
 *
 *   {"deepseek-v4-flash":{"input":0.25,"output":1.1,"cacheRead":0.03},"*":{"input":1,"output":4}}
 *
 * — euro per million tokens. "*" is an optional fallback for unlisted models.
 * An unpriced call still records its tokens; only its cost stays null.
 */

export interface ModelRate {
  input: number;
  output: number;
  cacheRead?: number;
  cacheWrite?: number;
}

export type PricingTable = Record<string, ModelRate>;

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
}

function isRate(v: unknown): v is ModelRate {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  const ok = (x: unknown) => x === undefined || (typeof x === "number" && Number.isFinite(x) && x >= 0);
  return typeof r.input === "number" && typeof r.output === "number" && ok(r.input) && ok(r.output) && ok(r.cacheRead) && ok(r.cacheWrite);
}

/** Parse AI_PRICING_JSON leniently: invalid entries are dropped, never thrown. */
export function parsePricing(raw: string | undefined | null): PricingTable {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([, v]) => isRate(v))) as PricingTable;
  } catch {
    return {};
  }
}

/**
 * Exact model match first, then the longest configured prefix (so
 * "claude-sonnet" prices "claude-sonnet-5-20260101"), then "*".
 */
export function rateFor(model: string, table: PricingTable): ModelRate | null {
  if (table[model]) return table[model];
  const prefix = Object.keys(table)
    .filter((k) => k !== "*" && model.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  if (prefix) return table[prefix]!;
  return table["*"] ?? null;
}

/** Cost in micro-euro (millionths), rounded; null when the model has no rate. */
export function costMicroEur(model: string, usage: TokenUsage, table: PricingTable): number | null {
  const rate = rateFor(model, table);
  if (!rate) return null;
  // €/MTok × tokens = micro-euro × 1 — one million tokens at €1 is 1_000_000 µ€.
  const micro =
    usage.inputTokens * rate.input +
    usage.outputTokens * rate.output +
    (usage.cacheReadTokens ?? 0) * (rate.cacheRead ?? rate.input) +
    (usage.cacheWriteTokens ?? 0) * (rate.cacheWrite ?? rate.input);
  return Math.round(micro);
}

/** Voice provider cost (USD, as Vapi reports it) → micro-euro. */
export function usdToMicroEur(usd: number | null | undefined, usdEurRate: number): number | null {
  if (usd == null || !Number.isFinite(usd) || usd < 0) return null;
  return Math.round(usd * usdEurRate * 1_000_000);
}

/** Display helper: micro-euro → euro. */
export function microToEur(micro: number | null | undefined): number {
  return (micro ?? 0) / 1_000_000;
}
