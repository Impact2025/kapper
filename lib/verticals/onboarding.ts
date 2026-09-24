import type { OnboardingEntry, OnboardingKey, VerticalPack } from "./types";

/** What a salon has already done — computed by the caller (DB queries stay
 * out of this file so the resolver is pure and unit tested). */
export type OnboardingSignals = Record<OnboardingKey, boolean>;

export interface ResolvedOnboardingStep {
  key: OnboardingKey;
  label: string;
  href: string;
  done: boolean;
}

const cap = (s: string) => `${s.charAt(0).toUpperCase()}${s.slice(1)}`;

/** Every onboarding step once; a pack picks (and may relabel) the ones that
 * matter for its doelgroep, in the order that gets that doelgroep to value
 * fastest. */
const CATALOG: Record<OnboardingKey, (pack: VerticalPack) => { label: string; href: string }> = {
  business: () => ({ label: "Bedrijfsgegevens voor facturen", href: "/dashboard/facturatie/instellingen" }),
  services: () => ({ label: "Diensten en tarieven", href: "/dashboard/praktijk" }),
  team: (pack) => ({ label: `${cap(pack.terms.practitionerPlural)} toegevoegd`, href: "/dashboard/praktijk" }),
  whatsapp: () => ({ label: "WhatsApp-receptie actief", href: "/dashboard/integraties" }),
  phone: () => ({ label: "Telefonische receptie actief", href: "/dashboard/integraties" }),
  firstJob: (pack) => ({ label: `Eerste ${pack.terms.treatment} aangemaakt`, href: "/dashboard/klussen/nieuw" }),
};

/** Used when a pack declares no onboarding of its own. */
export const DEFAULT_ONBOARDING: OnboardingEntry[] = [
  { key: "business" },
  { key: "services" },
  { key: "team" },
  { key: "whatsapp" },
  { key: "phone" },
];

export function resolveOnboarding(pack: VerticalPack, signals: OnboardingSignals): ResolvedOnboardingStep[] {
  return (pack.onboarding ?? DEFAULT_ONBOARDING).map((entry) => {
    const base = CATALOG[entry.key](pack);
    return {
      key: entry.key,
      label: entry.label ?? base.label,
      href: entry.href ?? base.href,
      done: signals[entry.key] === true,
    };
  });
}
