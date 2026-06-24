export type PlanId = "essential" | "pro" | "elite";

export interface Plan {
  id: PlanId;
  name: string;
  price: number; // euro / month
  tagline: string;
  audience: string;
  features: string[];
  popular?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "essential",
    name: "Essential Assistent",
    price: 149,
    tagline: "Voor solo-stylisten & kleine salons.",
    audience: "Solo & klein",
    features: [
      "AI WhatsApp-assistent",
      "Native agenda-sync (Salonized/Phorest)",
      "Contextgeheugen (10 interacties)",
      "SMS-herinneringen",
    ],
  },
  {
    id: "pro",
    name: "Pro Assistent",
    price: 299,
    tagline: "Voor midden-grote salons (3–10 stoelen).",
    audience: "Midden-groot",
    popular: true,
    features: [
      "Alles uit Essential",
      "AI Voice Agent (telefoon)",
      "Intelligent double-booking (inwerktijden)",
      "WhatsApp API-kosten inbegrepen",
    ],
  },
  {
    id: "elite",
    name: "Elite Salon Cockpit",
    price: 499,
    tagline: "Voor grote salons en ketens.",
    audience: "Keten / groot",
    features: [
      "Alles uit Pro",
      "Auto-Blog SEO AI-engine",
      "Geautomatiseerd reviewbeheer",
      "Multi-agenda support",
      "Maandelijkse ROI-audit",
    ],
  },
];

export const SETUP_FEE_FROM = 250;
