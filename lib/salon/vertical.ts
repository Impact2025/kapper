/**
 * Sector-neutral config seam: today this only ever resolves to "kapper", but
 * every place that hardcodes a kapper-specific term or Dutch btw-tarief
 * should read it from here instead of inlining it — that's what lets Fase 7
 * (schilder/garage/... verticals) reuse lib/customers, lib/pos,
 * lib/payments-policy and lib/ai/manager.ts unchanged, with only a new
 * VerticalConfig and its own system-prompt variant.
 */
export interface VerticalConfig {
  id: string;
  label: string;
  /** Dutch btw-tarieven (percent) — treatments/diensten vs. products/goederen. */
  vatRates: {
    treatment: number;
    product: number;
  };
  terms: {
    /** e.g. "styliste" for kapper, "schilder" for a painting vertical. */
    practitioner: string;
    /** e.g. "behandeling" vs. "klus"/"opdracht". */
    treatment: string;
    /** e.g. "salon" vs. "werkplaats". */
    establishment: string;
  };
}

export const KAPPER_VERTICAL: VerticalConfig = {
  id: "kapper",
  label: "Kapper",
  vatRates: { treatment: 9, product: 21 },
  terms: { practitioner: "styliste", treatment: "behandeling", establishment: "salon" },
};

/** Every salon is the kapper vertical today — this indirection exists so
 * Fase 7 can key off e.g. a future `salons.vertical` column instead of
 * every call site assuming kapper. */
export function getVerticalConfig(_salonId: string): VerticalConfig {
  return KAPPER_VERTICAL;
}
