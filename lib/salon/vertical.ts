/**
 * Back-compat entry point. The vertical registry now lives in
 * lib/verticals/ (Vertical Pack: terms, brand, nav, job categories, messages,
 * content per doelgroep). Existing imports of `@/lib/salon/vertical` keep
 * working; new code should import from `@/lib/verticals`.
 */
export {
  KAPPER_VERTICAL,
  LOODGIETER_VERTICAL,
  SCHILDER_VERTICAL,
  getVerticalConfig,
  type VerticalConfig,
} from "@/lib/verticals";
