/**
 * Sector-neutral config seam — the concrete Fase 7 validation that the core
 * (lib/customers, lib/pos, lib/payments-policy, lib/ai/manager.ts) is
 * actually reusable: a second vertical (loodgieter) plugs in here and in a
 * system-prompt variant (lib/ai/receptionist.ts buildSystemPrompt), nowhere
 * else. `salons.vertical` keys into VERTICAL_REGISTRY below.
 */
export interface VerticalConfig {
  id: string;
  label: string;
  /** Dutch btw-tarieven (percent) — default used when a salon creates a new
   * treatment/product; always overridable per-item (treatments/products both
   * carry their own vatRatePercent, see Fase 3). Kapper's reduced 9% on
   * treatments is a flat sector rate (kapperschappelijke dienst); a
   * plumber's reduced 9% only applies conditionally per klus (verbouwing/
   * herstel aan een woning ouder dan 2 jaar, arbeidsloon only) — never a
   * blanket sector default, so this defaults to 21/21 for loodgieter and the
   * owner overrides per-klus where the reduced rate genuinely applies. */
  vatRates: {
    treatment: number;
    product: number;
  };
  terms: {
    /** e.g. "styliste" for kapper, "loodgieter" for de loodgieter-vertical. */
    practitioner: string;
    /** e.g. "behandeling" vs. "klus". */
    treatment: string;
    /** e.g. "salon" vs. "werkplaats". */
    establishment: string;
  };
  /**
   * Whether the Artikel 9 AVG special-category-data guard in
   * lib/ai/manager.ts applies — that guard scans for hoofdhuid-/huid-/
   * gezondheidssignalen, which are meaningless for a non-kapper vertical and
   * would misfire on ordinary plumbing vocabulary. Kapper-only until a
   * vertical actually collects special-category data.
   */
  hasHealthDataGuard: boolean;
}

export const KAPPER_VERTICAL: VerticalConfig = {
  id: "kapper",
  label: "Kapper",
  vatRates: { treatment: 9, product: 21 },
  terms: { practitioner: "styliste", treatment: "behandeling", establishment: "salon" },
  hasHealthDataGuard: true,
};

export const LOODGIETER_VERTICAL: VerticalConfig = {
  id: "loodgieter",
  label: "Loodgieter",
  vatRates: { treatment: 21, product: 21 },
  terms: { practitioner: "loodgieter", treatment: "klus", establishment: "bedrijf" },
  hasHealthDataGuard: false,
};

const VERTICAL_REGISTRY: Record<string, VerticalConfig> = {
  [KAPPER_VERTICAL.id]: KAPPER_VERTICAL,
  [LOODGIETER_VERTICAL.id]: LOODGIETER_VERTICAL,
};

/** Falls back to the kapper vertical for an unknown/missing id — every
 * salon row defaults `vertical` to "kapper" at the schema level too, so this
 * is a belt-and-suspenders default, not the primary source of truth. */
export function getVerticalConfig(vertical: string | null | undefined): VerticalConfig {
  return VERTICAL_REGISTRY[vertical ?? ""] ?? KAPPER_VERTICAL;
}
