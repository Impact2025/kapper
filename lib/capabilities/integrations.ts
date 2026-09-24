import type { VerticalPack } from "@/lib/verticals";

/**
 * Integration registry — every external connection the platform offers,
 * described once. A vertical lists the ids it wants (VerticalPack.integrations)
 * and the integraties-pagina renders exactly those, so adding a tool =
 * one entry here + one id in the packs that should get it.
 *
 * status "live"    = built and usable today.
 * status "planned" = not built yet; shown honestly as "binnenkort" with an
 *                    interest button, so demand decides what is built next.
 */
export type IntegrationCategory = "channel" | "agenda" | "accounting";

export interface IntegrationDef {
  id: string;
  category: IntegrationCategory;
  label: string;
  description: string;
  icon: string;
  status: "live" | "planned";
}

export const INTEGRATIONS: Record<string, IntegrationDef> = {
  whatsapp: {
    id: "whatsapp",
    category: "channel",
    label: "WhatsApp",
    description: "De AI beantwoordt WhatsApp-berichten van klanten, 24/7.",
    icon: "chat",
    status: "live",
  },
  phone: {
    id: "phone",
    category: "channel",
    label: "Telefoon",
    description: "De AI neemt je zakelijke nummer aan en verbindt bij spoed of twijfel door.",
    icon: "phone",
    status: "live",
  },
  salonized: { id: "salonized", category: "agenda", label: "Salonized", description: "Synchroniseer afspraken met Salonized.", icon: "calendar_month", status: "live" },
  phorest: { id: "phorest", category: "agenda", label: "Phorest", description: "Synchroniseer afspraken met Phorest.", icon: "calendar_month", status: "live" },
  treatwell: { id: "treatwell", category: "agenda", label: "Treatwell", description: "Koppel via Treatwell Connect.", icon: "calendar_month", status: "live" },
  acuity: { id: "acuity", category: "agenda", label: "Acuity Scheduling", description: "Synchroniseer afspraken met Acuity.", icon: "calendar_month", status: "live" },
  google_calendar: {
    id: "google_calendar",
    category: "agenda",
    label: "Google Agenda",
    description: "Zie je ingeplande klussen in je eigen Google Agenda en op je telefoon.",
    icon: "event",
    status: "planned",
  },
  moneybird: {
    id: "moneybird",
    category: "accounting",
    label: "Moneybird",
    description: "Facturen en betalingen automatisch naar je boekhouding.",
    icon: "account_balance",
    status: "planned",
  },
  eboekhouden: {
    id: "eboekhouden",
    category: "accounting",
    label: "e-Boekhouden.nl",
    description: "Facturen en betalingen automatisch naar je boekhouding.",
    icon: "account_balance",
    status: "planned",
  },
  exact_online: {
    id: "exact_online",
    category: "accounting",
    label: "Exact Online",
    description: "Facturen en betalingen automatisch naar je boekhouding.",
    icon: "account_balance",
    status: "planned",
  },
};

export const INTEGRATION_CATEGORY_LABEL: Record<IntegrationCategory, string> = {
  channel: "Kanalen",
  agenda: "Agenda",
  accounting: "Boekhouding",
};

/** The integrations a vertical offers, in the order the pack lists them. */
export function integrationsFor(pack: VerticalPack): IntegrationDef[] {
  return pack.integrations.map((id) => INTEGRATIONS[id]).filter((d): d is IntegrationDef => !!d);
}

export function plannedIntegrationsFor(pack: VerticalPack): IntegrationDef[] {
  return integrationsFor(pack).filter((d) => d.status === "planned");
}

/** Agenda providers a vertical can connect to today (drives the dropdown). */
export function liveAgendaProvidersFor(pack: VerticalPack): IntegrationDef[] {
  return integrationsFor(pack).filter((d) => d.category === "agenda" && d.status === "live");
}
