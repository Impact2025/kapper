export type PlanId = "essential" | "pro" | "elite";

export interface Plan {
  id: PlanId;
  name: string;
  price: number; // euro / month
  tagline: string;
  audience: string;
  /** Short, concrete value-for-money framing shown on the pricing page. */
  valueLine: string;
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
    valueLine: "Terugverdiend met 1 extra afspraak per maand.",
    features: [
      "AI beantwoordt WhatsApp 24/7 en boekt direct de juiste afspraak",
      "Synct automatisch met Salonized of Phorest — geen dubbele invoer",
      "Onthoudt het gesprek, voelt als een medewerker en niet als een bot",
      "Automatische afspraakherinneringen via SMS — minder no-shows",
    ],
  },
  {
    id: "pro",
    name: "Pro Assistent",
    price: 299,
    tagline: "Voor midden-grote salons (3–10 stoelen).",
    audience: "Midden-groot",
    popular: true,
    valueLine: "Verdient zich gemiddeld al in de eerste maand terug.",
    features: [
      "Alles uit Essential",
      "AI beantwoordt ook de telefoon — dag en nacht, nooit meer een gemiste oproep",
      "Vult wachttijd tijdens kleurbehandelingen slim op met een extra klant",
      "WhatsApp-berichtkosten zitten al in de prijs, geen aparte factuur",
    ],
  },
  {
    id: "elite",
    name: "Elite Salon Cockpit",
    price: 499,
    tagline: "Voor grote salons en ketens.",
    audience: "Keten / groot",
    valueLine: "Eén AI-team voor al je vestigingen, in plaats van losse abonnementen.",
    features: [
      "Alles uit Pro",
      "Schrijft automatisch SEO-blogs die nieuwe klanten via Google trekken",
      "Reageert automatisch op Google-reviews",
      "Beheer al je vestigingen en agenda's vanuit één cockpit",
      "Maandelijks rapport: precies wat de AI je heeft opgeleverd",
    ],
  },
];

export const SETUP_FEE_FROM = 250;
