import type { NavEntry, NavKey } from "./types";

export interface NavCatalogItem {
  href: string;
  label: string;
  icon: string;
}

/** Every dashboard destination once; a vertical picks (and may relabel) a
 * subset in its `nav`. The sidebar itself stays sector-neutral. */
export const NAV_CATALOG: Record<NavKey, NavCatalogItem> = {
  overview: { href: "/dashboard", label: "Overzicht", icon: "dashboard" },
  customers: { href: "/dashboard/klanten", label: "Klanten", icon: "group" },
  jobs: { href: "/dashboard/klussen", label: "Klussen", icon: "construction" },
  planner: { href: "/dashboard/planbord", label: "Planbord", icon: "calendar_view_week" },
  billing: { href: "/dashboard/facturatie", label: "Offertes & facturen", icon: "receipt_long" },
  maintenance: { href: "/dashboard/onderhoud", label: "Onderhoud", icon: "event_repeat" },
  ai: { href: "/dashboard/ai-receptie", label: "AI-Receptie", icon: "smart_toy" },
  practice: { href: "/dashboard/praktijk", label: "Praktijk", icon: "storefront" },
  webshop: { href: "/dashboard/webwinkel", label: "Webwinkel", icon: "shopping_bag" },
  conversations: { href: "/dashboard/gesprekken", label: "Gesprekken", icon: "forum" },
  escalations: { href: "/dashboard/escalaties", label: "Escalaties", icon: "support_agent" },
  appointments: { href: "/dashboard/afspraken", label: "Afspraken", icon: "calendar_month" },
  kassa: { href: "/dashboard/kassa", label: "Kassa", icon: "point_of_sale" },
  reports: { href: "/dashboard/rapportage", label: "Rapportage", icon: "monitoring" },
  retention: { href: "/dashboard/retentie", label: "Retentie & marketing", icon: "loyalty" },
  noshow: { href: "/dashboard/no-show", label: "No-show beleid", icon: "event_busy" },
  integrations: { href: "/dashboard/integraties", label: "Integraties", icon: "cable" },
  subscription: { href: "/dashboard/abonnement", label: "Abonnement", icon: "credit_card" },
  support: { href: "/dashboard/support", label: "Support", icon: "help" },
};

export interface ResolvedNavItem {
  key: NavKey;
  href: string;
  label: string;
  icon: string;
}

export function resolveNav(entries: NavEntry[]): ResolvedNavItem[] {
  // Support is sector-neutral: every vertical gets it, always last.
  const withSupport = entries.some((e) => e.key === "support") ? entries : [...entries, { key: "support" as const }];
  return withSupport.map((e) => {
    const base = NAV_CATALOG[e.key];
    return { key: e.key, href: base.href, icon: base.icon, label: e.label ?? base.label };
  });
}
