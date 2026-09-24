import { PLANS, type Plan } from "@/lib/plans";
import type { VerticalPack } from "./types";

/**
 * Pakketten per vertical. Prijzen en plan-ids komen altijd uit lib/plans.ts
 * (één bron voor Stripe + gating); alleen de copy verschilt per doelgroep.
 * Elke regel hier moet kloppen met wat `jobPlanGate` / `salonHasPlan` in de
 * code daadwerkelijk afdwingt — zie lib/jobs/plan-gate.ts.
 */
const JOB_COPY: Record<Plan["id"], Pick<Plan, "name" | "tagline" | "audience" | "valueLine" | "features">> = {
  essential: {
    name: "Essential Assistent",
    tagline: "Voor zelfstandige vakmensen.",
    audience: "Zelfstandig",
    valueLine: "Terugverdiend met 1 gered spoedklusje per maand.",
    features: [
      "AI neemt telefoon én WhatsApp op, 24/7 — nooit meer een gemiste noodoproep",
      "Legt klusadres, spoed en probleem direct vast als klus in je CRM",
      "Klanten met meerdere adressen en een volledige klushistorie",
      "Planbord per monteur: wie is waar, wat is spoed",
      "Foto's voor/na en een checklist per klus op je telefoon",
      "Automatische afspraakherinneringen en review-verzoeken",
    ],
  },
  pro: {
    name: "Pro Assistent",
    tagline: "Voor bedrijven met meerdere monteurs.",
    audience: "Meerdere monteurs",
    valueLine: "Sneller offreren, sneller betaald.",
    features: [
      "Alles uit Essential",
      "Offertes die de klant online accepteert; facturen met IBAN en automatische betalingsherinneringen",
      "Installatiepaspoort per adres: merk, type, serienummer en garantie",
      "Onderhoudscontracten: de klus en de klantherinnering ontstaan vanzelf",
      "Aanbetaling bij inplannen — minder no-shows en afzeggingen op het laatste moment",
      "Kan een gesprek direct doorzetten naar de monteur van dienst",
      "WhatsApp-berichtkosten zitten al in de prijs, geen aparte factuur",
    ],
  },
  elite: {
    name: "Elite Cockpit",
    tagline: "Voor grotere installatiebedrijven.",
    audience: "Groot bedrijf",
    valueLine: "Eén cockpit voor al je monteurs en vestigingen.",
    features: [
      "Alles uit Pro",
      "Beheer meerdere vestigingen vanuit één cockpit",
      "Maandelijks rapport: precies wat de AI je heeft opgeleverd",
    ],
  },
};

export function plansFor(pack: VerticalPack): Plan[] {
  if (pack.archetype === "appointment") return PLANS;
  return PLANS.map((p) => ({ ...p, ...JOB_COPY[p.id], ...pack.pricing?.[p.id] }));
}
