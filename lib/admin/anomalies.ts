/**
 * Pure usage-anomaly detection for the daily report. Compares the last 24h
 * per salon against its own 14-day daily baseline — a salon is judged
 * against itself, not against the platform average.
 */

export interface UsageWindow {
  salonId: string;
  name: string;
  recentTokens: number; // last 24h
  baselineDailyTokens: number; // average per day over the prior 14 days
  recentConversations: number;
  baselineDailyConversations: number;
}

export type AnomalyKind = "token_spike" | "possible_loop" | "silent";

export interface Anomaly {
  salonId: string;
  name: string;
  kind: AnomalyKind;
  message: string;
}

export interface AnomalyOptions {
  /** Last 24h at least this many times the baseline counts as a spike. */
  spikeFactor: number;
  /** Ignore spikes below this absolute token count — noise on tiny salons. */
  minSpikeTokens: number;
  /** Tokens per conversation above this smells like a tool loop / runaway prompt. */
  loopTokensPerConversation: number;
  /** A salon needs at least this daily baseline before silence is alarming. */
  silentMinBaseline: number;
}

export const DEFAULT_ANOMALY_OPTIONS: AnomalyOptions = {
  spikeFactor: 3,
  minSpikeTokens: 50_000,
  loopTokensPerConversation: 40_000,
  silentMinBaseline: 3,
};

const fmt = (n: number) => new Intl.NumberFormat("nl-NL", { notation: "compact", maximumFractionDigits: 1 }).format(n);

export function detectAnomalies(rows: UsageWindow[], opts: AnomalyOptions = DEFAULT_ANOMALY_OPTIONS): Anomaly[] {
  const out: Anomaly[] = [];
  for (const r of rows) {
    const base = { salonId: r.salonId, name: r.name };

    if (r.recentTokens >= opts.minSpikeTokens) {
      if (r.baselineDailyTokens > 0 && r.recentTokens / r.baselineDailyTokens >= opts.spikeFactor) {
        const factor = Math.round((r.recentTokens / r.baselineDailyTokens) * 10) / 10;
        out.push({ ...base, kind: "token_spike", message: `${fmt(r.recentTokens)} tokens in 24u — ${factor.toLocaleString("nl-NL")}× het normale niveau` });
      } else if (r.baselineDailyTokens === 0) {
        out.push({ ...base, kind: "token_spike", message: `${fmt(r.recentTokens)} tokens in 24u zonder eerder verbruik` });
      }
    }

    if (r.recentConversations > 0 && r.recentTokens / r.recentConversations >= opts.loopTokensPerConversation) {
      out.push({
        ...base,
        kind: "possible_loop",
        message: `${fmt(r.recentTokens / r.recentConversations)} tokens per gesprek — mogelijk een tool-loop of te lange context`,
      });
    }

    if (r.recentConversations === 0 && r.baselineDailyConversations >= opts.silentMinBaseline) {
      out.push({
        ...base,
        kind: "silent",
        message: `Geen gesprekken in 24u (normaal ~${Math.round(r.baselineDailyConversations)} per dag) — koppeling controleren`,
      });
    }
  }
  const order: Record<AnomalyKind, number> = { silent: 0, possible_loop: 1, token_spike: 2 };
  return out.sort((a, b) => order[a.kind] - order[b.kind]);
}
