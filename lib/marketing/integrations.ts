/**
 * Landing pages per agenda-koppeling (kapper site). Only integrations whose
 * adapter really reads availability and books (lib/agenda) get a page — no
 * page may promise more than the adapter does. Salonized (no availability
 * endpoint yet) and Treatwell (no public booking API) are deliberately absent.
 */
export interface IntegrationPage {
  slug: string;
  name: string;
  /** <title> — the "— KapperAssistent.nl" suffix is added by the template. */
  metaTitle: string;
  metaDescription: string;
  headline: string;
  intro: string;
  steps: { title: string; body: string }[];
  benefits: { icon: string; title: string; body: string }[];
  /** What the salon needs before we can connect. */
  requirements: string[];
  faq: { q: string; a: string }[];
}

export const INTEGRATION_PAGES: IntegrationPage[] = [
  {
    slug: "phorest",
    name: "Phorest",
    metaTitle: "AI-receptionist voor Phorest",
    metaDescription:
      "KapperAssistent koppelt aan Phorest: de AI leest je beschikbaarheid, boekt afspraken via WhatsApp en telefoon en zet ze direct in je Phorest-agenda.",
    headline: "Je AI-receptionist voor Phorest",
    intro:
      "Werk je met Phorest? Dan leest KapperAssistent je beschikbare tijden rechtstreeks uit je agenda en boekt de afspraak voor klanten die je bellen of appen — ook als jij midden in een behandeling staat.",
    steps: [
      { title: "Je vraagt API-toegang aan", body: "Phorest geeft toegang tot zijn koppelingen via zijn support. Wij vertellen je precies wat je moet vragen en regelen de rest." },
      { title: "Wij richten de koppeling in", body: "We verbinden je vestiging, diensten en medewerkers en stellen jouw spelregels in: wie doet wat, en hoe lang duurt een behandeling." },
      { title: "De AI neemt op", body: "Klanten bellen of appen; de AI zoekt een vrij moment in je Phorest-agenda en boekt het in." },
    ],
    benefits: [
      { icon: "call", title: "Geen gemiste telefoontjes", body: "Ook tijdens het knippen of buiten openingstijden wordt er opgenomen." },
      { icon: "event_available", title: "Boekt in je eigen agenda", body: "Geen dubbele invoer: afspraken komen in Phorest te staan, waar je team ze al kent." },
      { icon: "notifications_active", title: "Minder no-shows", body: "Automatische herinneringen houden je agenda gevuld." },
    ],
    requirements: ["Een actief Phorest-account", "API-toegang die Phorest support voor je activeert", "Je vestiging en diensten staan al in Phorest"],
    faq: [
      { q: "Kan de AI echt afspraken in Phorest boeken?", a: "Ja. KapperAssistent leest beschikbare tijden per dienst uit Phorest en boekt de gekozen afspraak in je agenda." },
      { q: "Moet ik zelf iets technisch doen?", a: "Nee. Jij vraagt de toegang aan bij Phorest, wij zorgen voor de koppeling en de instellingen." },
      { q: "Wat als de AI er niet uitkomt?", a: "Dan draagt de AI het gesprek over aan jou of je team." },
    ],
  },
  {
    slug: "acuity",
    name: "Acuity Scheduling",
    metaTitle: "AI-receptionist voor Acuity Scheduling",
    metaDescription:
      "KapperAssistent koppelt aan Acuity Scheduling: de AI zoekt vrije tijden per afspraaktype en boekt via WhatsApp en telefoon direct in je Acuity-agenda.",
    headline: "Je AI-receptionist voor Acuity Scheduling",
    intro:
      "Gebruik je Acuity Scheduling voor je afspraken? KapperAssistent kijkt in je Acuity-agenda welke tijden vrij zijn per afspraaktype en boekt ze voor klanten die bellen of appen.",
    steps: [
      { title: "Je geeft toegang", body: "Je deelt je Acuity API-gegevens met ons via een beveiligde koppeling. Wij begeleiden je stap voor stap." },
      { title: "We stemmen je afspraaktypes af", body: "Elk afspraaktype in Acuity koppelen we aan de behandelingen die klanten aan de AI vragen." },
      { title: "De AI boekt", body: "Klanten vragen om een tijd; de AI controleert Acuity en zet de afspraak erin." },
    ],
    benefits: [
      { icon: "chat", title: "WhatsApp én telefoon", body: "Klanten kiezen hun eigen kanaal; de agenda blijft één bron van waarheid." },
      { icon: "sync", title: "Direct in Acuity", body: "Geen overtypen en geen dubbele boekingen." },
      { icon: "schedule", title: "24/7 bereikbaar", body: "Ook in de avond en het weekend worden vragen beantwoord." },
    ],
    requirements: ["Een actief Acuity Scheduling-account", "Je Acuity API-gegevens", "Je afspraaktypes zijn ingericht in Acuity"],
    faq: [
      { q: "Werkt dit met al mijn afspraaktypes?", a: "De AI werkt met de afspraaktypes uit je Acuity-account. Tijdens de setup bepalen we samen welke behandelingen via de AI te boeken zijn." },
      { q: "Zijn mijn gegevens veilig?", a: "Je API-gegevens worden versleuteld opgeslagen en alleen gebruikt om je agenda te lezen en afspraken te boeken." },
      { q: "Wat als de AI er niet uitkomt?", a: "Dan draagt de AI het gesprek over aan jou of je team." },
    ],
  },
];

export const getIntegrationPage = (slug: string) => INTEGRATION_PAGES.find((p) => p.slug === slug);
