/**
 * Per-vertical settings for the free scan (/scan): the revenue model's inputs
 * and the copy around it. Pure — no env or DB. A vertical without a profile
 * has no scan page (its /scan is a 404).
 *
 * The trade numbers are deliberately conservative estimates; the page labels
 * the outcome as "geschat". Only kapper's baseline comes from the business
 * plan's Missed Call Revenue Formula (40 missed calls / 6 chairs, €65 ticket).
 */

export interface ScanProfile {
  vertical: string;
  /** Form label + default for the size input ("Aantal stoelen", 6). */
  sizeLabel: string;
  sizeDefault: number;
  sizeMax: number;
  /** Form label + placeholders for the business fields. */
  nameLabel: string;
  namePlaceholder: string;
  urlLabel: string;
  urlPlaceholder: string;
  emailPlaceholder: string;
  /** "kapper" in "Klanten zoeken op 'kapper [stad]'". */
  searchTerm: string;
  /** Revenue model, per size unit per month. */
  missedCallsPerUnit: number;
  avgTicket: number;
  recoveryRate: number;
  conversionRate: number;
  savingsPerUnit: number;
  /** Labels for the model's outputs. */
  bookingsLabel: string;
  savingsLabel: string;
  /** Page copy. */
  headline: string;
  intro: string;
  usps: { icon: string; text: string }[];
  /** Third and fourth checklist rows (the first two are website speed + SEO). */
  reachabilityHint: string;
  extraCheck: { label: string; hint: string };
  /** Who the AI summary speaks as, and how it refers to the business ("deze salon"). */
  advisorRole: string;
  businessNoun: string;
}

const KAPPER: ScanProfile = {
  vertical: "kapper",
  sizeLabel: "Aantal stoelen",
  sizeDefault: 6,
  sizeMax: 50,
  nameLabel: "Naam van je salon",
  namePlaceholder: "Salon Sanne",
  urlLabel: "Website van je salon",
  urlPlaceholder: "www.jouwsalon.nl",
  emailPlaceholder: "jij@jouwsalon.nl",
  searchTerm: "kapper",
  missedCallsPerUnit: 40 / 6,
  avgTicket: 65,
  recoveryRate: 0.6,
  conversionRate: 0.3,
  savingsPerUnit: 500 / 6,
  bookingsLabel: "Extra boekingen",
  savingsLabel: "No-show besparing",
  headline: "Hoeveel omzet laat jouw salon liggen?",
  intro:
    "Onze AI scant je website en berekent met de Missed Call Revenue-formule hoeveel je per maand misloopt aan gemiste oproepen en no-shows. In 60 seconden, direct in je inbox.",
  usps: [
    { icon: "call_missed", text: "Bereken je gemiste oproep-omzet" },
    { icon: "speed", text: "Check je website-snelheid & SEO" },
    { icon: "savings", text: "Zie je potentiële no-show besparing" },
  ],
  reachabilityHint: "85% van bellers met voicemail belt direct de concurrent.",
  extraCheck: { label: "No-show preventie", hint: "No-shows kosten een gemiddelde salon ~€12.000 per jaar." },
  advisorRole: "salon-groeiadviseur",
  businessNoun: "deze salon",
};

const LOODGIETER: ScanProfile = {
  vertical: "loodgieter",
  sizeLabel: "Aantal monteurs",
  sizeDefault: 2,
  sizeMax: 100,
  nameLabel: "Naam van je bedrijf",
  namePlaceholder: "Van Dijk Installatietechniek",
  urlLabel: "Website van je bedrijf",
  urlPlaceholder: "www.jouwbedrijf.nl",
  emailPlaceholder: "jij@jouwbedrijf.nl",
  searchTerm: "loodgieter",
  missedCallsPerUnit: 15,
  avgTicket: 225,
  recoveryRate: 0.6,
  conversionRate: 0.4,
  savingsPerUnit: 220,
  bookingsLabel: "Extra klussen",
  savingsLabel: "Tijdwinst planning & administratie",
  headline: "Hoeveel klussen mis jij terwijl je onder een aanrecht ligt?",
  intro:
    "Onze AI scant je website en rekent uit hoeveel omzet je per maand misloopt aan oproepen die je niet kunt aannemen, plus de tijd die je kwijt bent aan planning en administratie. In 60 seconden, direct in je inbox.",
  usps: [
    { icon: "call_missed", text: "Bereken wat gemiste (spoed)oproepen je kosten" },
    { icon: "speed", text: "Check je website-snelheid & lokale vindbaarheid" },
    { icon: "savings", text: "Zie hoeveel tijd je terugwint op administratie" },
  ],
  reachabilityHint: "Bij een lekkage belt een klant door tot er iemand opneemt. Neem jij niet op, dan krijgt een ander de klus.",
  extraCheck: {
    label: "Spoedoproepen buiten kantooruren",
    hint: "Lekkages en verstoppingen houden zich niet aan kantoortijden: ook 's avonds en in het weekend moet er iemand opnemen.",
  },
  advisorRole: "groeiadviseur voor loodgieters- en installatiebedrijven",
  businessNoun: "dit bedrijf",
};

const HOVENIER: ScanProfile = {
  vertical: "hovenier",
  sizeLabel: "Aantal mensen in de buitendienst",
  sizeDefault: 3,
  sizeMax: 100,
  nameLabel: "Naam van je bedrijf",
  namePlaceholder: "Groen & Zo Hoveniers",
  urlLabel: "Website van je bedrijf",
  urlPlaceholder: "www.jouwhoveniersbedrijf.nl",
  emailPlaceholder: "jij@jouwbedrijf.nl",
  searchTerm: "hovenier",
  missedCallsPerUnit: 8,
  avgTicket: 450,
  recoveryRate: 0.6,
  conversionRate: 0.25,
  savingsPerUnit: 200,
  bookingsLabel: "Extra klussen",
  savingsLabel: "Tijdwinst offertes & planning",
  headline: "Hoeveel tuinklussen lopen je mis terwijl jij buiten werkt?",
  intro:
    "Onze AI scant je website en rekent uit hoeveel omzet je per maand misloopt aan aanvragen die je niet kunt aannemen, plus de tijd die offertes en planning je kosten. In 60 seconden, direct in je inbox.",
  usps: [
    { icon: "call_missed", text: "Bereken wat gemiste aanvragen je kosten" },
    { icon: "speed", text: "Check je website-snelheid & lokale vindbaarheid" },
    { icon: "savings", text: "Zie hoeveel tijd je terugwint op offertes en planning" },
  ],
  reachabilityHint: "Aanvragen komen binnen terwijl jij met de bosmaaier bezig bent. Wie als eerste terugbelt, krijgt meestal de klus.",
  extraCheck: {
    label: "Aanvragen direct opvolgen",
    hint: "In het voorjaar stromen de aanvragen binnen. Wie traag opvolgt, verliest juist de mooiste projecten.",
  },
  advisorRole: "groeiadviseur voor hoveniers- en groenbedrijven",
  businessNoun: "dit bedrijf",
};

const PROFILES: Record<string, ScanProfile> = {
  [KAPPER.vertical]: KAPPER,
  [LOODGIETER.vertical]: LOODGIETER,
  [HOVENIER.vertical]: HOVENIER,
};

/** Profile for a vertical, or null when that vertical has no scan. */
export function scanProfileFor(vertical: string | null | undefined): ScanProfile | null {
  return PROFILES[vertical ?? "kapper"] ?? null;
}

export function scanVerticals(): string[] {
  return Object.keys(PROFILES);
}
