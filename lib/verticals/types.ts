/**
 * Vertical Pack — everything that differs per doelgroep (kapper, loodgieter,
 * schilder, ...) lives in one declarative object per vertical. The core
 * (customers, pos, payments-policy, ai/manager, jobs) stays sector-neutral;
 * adding a new trade means adding a pack, not touching the core.
 *
 * Two archetypes decide which product surface a salon gets:
 *  - "appointment": klant komt naar de locatie, vaste duur/prijs, dossier per
 *    bezoek (kapper, schoonheidsspecialist, fysio).
 *  - "job": monteur gaat naar de klant, klusadres, offerte → werkbon →
 *    factuur, installaties en onderhoudscontracten (loodgieter, schilder,
 *    elektricien).
 */
export type Archetype = "appointment" | "job";

/** Every tool the AI receptionist can be given (lib/ai/receptionist.ts). A
 * vertical lists exactly the ones it uses — see VerticalPack.agent. */
export type AgentToolId =
  | "check_availability"
  | "find_appointments"
  | "book_appointment"
  | "reschedule_appointment"
  | "cancel_appointment"
  | "register_job"
  | "escalate_to_staff";

/** Vak-specific behaviour rules for the job receptionist. Everything a
 * plumber's AI must say about gas or water is a *vak* rule, not a platform
 * rule, so it lives in the pack; a pack without them gets the generic wording
 * in lib/ai/job-receptionist.ts. */
export interface JobAgentPrompt {
  /** What counts as spoed for this vak and what to tell the customer first. */
  spoedRule: string;
  /** Situations where the AI must hand over instead of reassuring. */
  hazardExamples: string;
  /** Typical offerte-aanvraag examples ("een nieuwe ketel of badkamer"). */
  quoteExamples: string;
  /** What to do with a photo the customer sends. */
  photoRule: string;
  /** One-line scene: where the vakman is when he cannot pick up the phone. */
  scene: string;
  /** Tool-schema hint for register_job's urgency field. */
  urgencyHint: string;
  /** Example photo subjects for the model ("een lekkage, leiding of cv-ketel"). */
  photoSubjects: string;
}

/** A vak-specific field on a klus (the job-archetype counterpart of the
 * kapper's kleurkaart): oppervlak in m2 for a schilder, "woning ouder dan 2
 * jaar" for a loodgieter. Stored in jobs.details. */
export interface JobField {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  unit?: string;
  options?: string[];
  placeholder?: string;
  hint?: string;
  /** Category keys this field applies to; omitted = every category. */
  categories?: string[];
}

export type NavKey =
  | "overview"
  | "customers"
  | "jobs"
  | "planner"
  | "billing"
  | "maintenance"
  | "ai"
  | "practice"
  | "webshop"
  | "conversations"
  | "escalations"
  | "appointments"
  | "kassa"
  | "reports"
  | "retention"
  | "noshow"
  | "integrations"
  | "subscription"
  | "support"
  | "guide";

export interface NavEntry {
  key: NavKey;
  /** Overrides the catalog label for this vertical (e.g. "Klussen"). */
  label?: string;
}

export interface VerticalTerms {
  /** e.g. "styliste" / "loodgieter" / "schilder". */
  practitioner: string;
  practitionerPlural: string;
  /** Singular noun for one unit of work: "behandeling" / "klus". */
  treatment: string;
  treatmentPlural: string;
  /** "salon" / "bedrijf". */
  establishment: string;
  /** How the owner is greeted when no name is known: "kapper" / "vakman". */
  owner: string;
  /** "afspraak" / "afspraak" (a klus is planned via an afspraak). */
  appointment: string;
  /** What "an asset per adres" is called (job archetype). Omitted = the
   * installatie wording of the plumber. */
  asset?: { singular: string; plural: string; passport: string };
}

export interface LandingCopy {
  badge: string;
  headline: string;
  sub: string;
  chat: { title: string; messages: { from: "customer" | "ai"; text: string }[] };
  stats: { icon: string; value: string; label: string }[];
  steps: { title: string; body: string }[];
  features: { icon: string; title: string; body: string }[];
  faq: { q: string; a: string }[];
  ctaTitle: string;
  ctaBody: string;
  /** Optional hero photo (in /public); the chat then floats on it as a phone mockup. */
  heroImage?: { src: string; alt: string };
  /** Optional app preview (phone mockup of the home screen) for the split hero when there is no photo or video. */
  appPreview?: HeroPhoneData;
  /** Optional full-bleed video hero (files in /public); replaces the split hero when set. */
  heroVideo?: {
    src: string;
    poster: string;
    label: string;
    eyebrow: string;
    accent?: string;
    /** Optional phone mockup of the app's home screen, shown beside the hero copy. */
    phone?: HeroPhoneData;
  };
}

export interface HeroPhoneData {
  company: string;
  date: string;
  greeting: string;
  summary: string;
  urgentTitle: string;
  urgent: { title: string; who: string; status: string; statusTone: "progress" | "new" }[];
  tabs: { icon: string; label: string }[];
}

export interface MarketingConfig {
  navLinks: { href: string; label: string }[];
  cta: { href: string; label: string };
  footerBlurb: string;
  /** Material Symbols icon used as the logo mark when there is no logo file. */
  logoIcon: string;
  /** Data-driven landing page for job verticals (kapper keeps its own page). */
  landing: LandingCopy | null;
}

/** Accent palette per doelgroep (see lib/verticals/theme.ts). Neutrals and
 * surfaces stay shared so every product keeps the same UI quality. */
export interface VerticalTheme {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  primaryFixed: string;
  primaryFixedDim: string;
  onPrimaryFixed: string;
  onPrimaryFixedVariant: string;
  inversePrimary: string;
  /** Optional warm surfaces (e.g. sand for outdoor trades); omitted = the shared neutrals. */
  surface?: string;
  surfaceContainerLow?: string;
  surfaceContainer?: string;
}

export type OnboardingKey = "business" | "services" | "team" | "whatsapp" | "phone" | "firstJob";

export interface OnboardingEntry {
  key: OnboardingKey;
  /** Overrides the catalog label / destination for this vertical. */
  label?: string;
  href?: string;
}

/** Pricing-page copy for one plan. Price and plan id always come from
 * lib/plans.ts; only the words differ per doelgroep. */
export interface PlanCopy {
  name: string;
  tagline: string;
  audience: string;
  valueLine: string;
  features: string[];
}

export interface VerticalBrand {
  name: string;
  domain: string;
  siteUrl: string;
  supportEmail: string;
  tagline: string;
  description: string;
  /** Hostnames (lowercase, no port) that serve this vertical's public site. */
  hosts: string[];
  /** Product name shown in the dashboard chrome ("Mijn LoodgietersAssistent"). */
  dashboardTitle: string;
}

export interface JobCategory {
  key: string;
  label: string;
  /** Spoed = the AI treats this as urgent by default and escalates. */
  urgent: boolean;
  /** Typical on-site time — feeds planner blocks and AI expectations. */
  estimatedMinutes: number;
  /** Words a customer uses for this — helps the AI classify. */
  keywords: string[];
  /** Starting checklist for the werkbon (monteur ticks these off). */
  checklist: string[];
}

export interface AssetKind {
  key: string;
  label: string;
  icon: string;
  /** Recommended service interval in months (null = none). */
  serviceIntervalMonths: number | null;
}

export interface ServiceTemplate {
  name: string;
  category: string;
  durationMinutes: number;
  priceCents: number;
  vatRatePercent: number;
  description: string;
}

/** A ready-made offerte (several regels in one click) for a typical klus. Prices
 * are example starting points; a regel with priceCents 0 is a placeholder the
 * owner fills in (toestel, materiaal). */
export interface QuotePackage {
  name: string;
  description: string;
  lines: {
    kind: "labor" | "material" | "travel" | "other";
    description: string;
    quantity: number;
    unit: string;
    priceCents: number;
  }[];
}

export interface VerticalMessages {
  /** WhatsApp reminder for an upcoming planned visit. */
  reminder: (p: { salonName: string; serviceType: string; date: string; time: string }) => string;
  /** WhatsApp review request after a completed visit/job. */
  review: (p: { salonName: string; reviewLink: string }) => string;
  /** WhatsApp reactivation message for a quiet customer. */
  retention: (p: { salonName: string; firstName: string }) => string;
  /** WhatsApp message for a due maintenance contract (job archetype). */
  maintenanceDue: (p: { salonName: string; firstName: string; assetLabel: string; dueDate: string }) => string;
  /** Salutation for a customer with no name on file. */
  greetingFallback: string;
}

export interface VerticalFeatures {
  /** Klussen/werkbonnen, klusadressen, planbord. */
  jobs: boolean;
  /** Offertes + facturen incl. betaallink. */
  quotes: boolean;
  /** Installaties/objecten per adres. */
  assets: boolean;
  /** Onderhoudscontracten met automatische herinnering/klus. */
  contracts: boolean;
  /** Contracts by weeks and within a season (mrt–okt) — hovenier. */
  seasonalContracts?: boolean;
  /** Fotodossier per klant: voor/na-foto's per klus. */
  photoTimeline?: boolean;
  /** Kleurkaarten/behandelkaarten (dossier per bezoek). */
  treatmentCards: boolean;
  /** Artikel 9 AVG health records. */
  healthRecords: boolean;
  webshop: boolean;
  /** Intelligent double-booking (inwerktijd). */
  doubleBooking: boolean;
  /** Loyalty points (Elite). */
  loyalty: boolean;
}

export interface VerticalPack {
  id: string;
  label: string;
  archetype: Archetype;
  /** false = pack exists for in-app validation but has no public site yet. */
  live: boolean;
  /** Dutch btw-tarieven (percent) default for new items; always overridable
   * per item. See the kapper/loodgieter comments for why they differ. */
  vatRates: { treatment: number; product: number };
  terms: VerticalTerms;
  /** Eenheden in de offerte-editor; omitted = LINE_UNITS in lib/jobs/model.ts. */
  lineUnits?: string[];
  /** Whether the Artikel 9 AVG special-category-data guard in
   * lib/ai/manager.ts applies (kapper-only until a vertical actually collects
   * special-category data). */
  hasHealthDataGuard: boolean;
  brand: VerticalBrand;
  /** Optional accent palette; omitted = the default (sage) palette. */
  theme?: VerticalTheme;
  features: VerticalFeatures;
  /** Own pricing copy per plan (job archetype); omitted = the shared job copy
   * in lib/verticals/plans.ts. Must match what lib/jobs/access.ts gates. */
  pricing?: Partial<Record<"essential" | "pro" | "elite", PlanCopy>>;
  /** AI-receptionist tools this vertical uses. */
  agent: { tools: AgentToolId[]; prompt?: Partial<JobAgentPrompt> };
  /** Integration ids (lib/capabilities/integrations.ts) offered to this vertical. */
  integrations: string[];
  /** Extra klus fields (job archetype). */
  jobFields: JobField[];
  /** Voorbeeldtitel in het "nieuwe klus"-formulier ("bv. …"); default is loodgietertekst-vrij. */
  jobTitleExample?: string;
  marketing: MarketingConfig;
  nav: NavEntry[];
  /** Onboarding checklist (job archetype), in order; omitted = the default set. */
  onboarding?: OnboardingEntry[];
  /** Job archetype only. */
  jobCategories: JobCategory[];
  assetKinds: AssetKind[];
  /** Starter catalog offered during onboarding (job archetype). */
  serviceTemplates: ServiceTemplate[];
  /** Offerte-pakketten: complete offerteregels voor een typische klus (job archetype). */
  quotePackages?: QuotePackage[];
  messages: VerticalMessages;
  /** Blog/kennisbank generation context. */
  content: {
    audience: string;
    blogSystemPrompt: string;
    blogTopicPlaceholder: string;
    blogKeywordPlaceholder: string;
    /** One-click topic ideas in the admin generator. */
    blogSuggestions: string[];
    blogMetaTitle: string;
    blogMetaDescription: string;
    blogHeading: string;
    blogSubheading: string;
    /** Call-to-action box under every article. */
    postCta: { title: string; body: string; href: string; label: string };
    /** Category slug -> label, for the kennisbank filter chips. */
    kennisbankCategories: Record<string, string>;
    kennisbankHeading: string;
    kennisbankTitle: string;
    kennisbankDescription: string;
    kennisbankIntro: string;
  };
}

/** Back-compat alias — older code imports VerticalConfig. */
export type VerticalConfig = VerticalPack;
