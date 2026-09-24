import type { VerticalPack } from "./types";

export const KAPPER_VERTICAL: VerticalPack = {
  id: "kapper",
  label: "Kapper",
  archetype: "appointment",
  live: true,
  // Kapper's reduced 9% on treatments is a flat sector rate (kapperschappelijke
  // dienst); products are 21%.
  vatRates: { treatment: 9, product: 21 },
  terms: {
    practitioner: "styliste",
    practitionerPlural: "stylisten",
    treatment: "behandeling",
    treatmentPlural: "behandelingen",
    establishment: "salon",
    owner: "kapper",
    appointment: "afspraak",
  },
  hasHealthDataGuard: true,
  brand: {
    name: "KapperAssistent",
    domain: "kappersassistent.nl",
    siteUrl: "https://www.kappersassistent.nl",
    supportEmail: "support@kappersassistent.nl",
    tagline: "Focus op je vak, niet op de telefoon",
    description:
      "De AI-gedreven operationele cockpit voor de moderne kapsalon. Je AI-assistent neemt op via WhatsApp en telefoon, direct gekoppeld aan je agenda. Nooit meer gemiste boekingen.",
    hosts: ["kappersassistent.nl", "www.kappersassistent.nl"],
    dashboardTitle: "Mijn KapperAssistent",
  },
  features: {
    jobs: false,
    quotes: false,
    assets: false,
    contracts: false,
    treatmentCards: true,
    healthRecords: true,
    webshop: true,
    doubleBooking: true,
    loyalty: true,
  },
  agent: {
    tools: [
      "check_availability",
      "find_appointments",
      "book_appointment",
      "reschedule_appointment",
      "cancel_appointment",
      "escalate_to_staff",
    ],
  },
  integrations: ["whatsapp", "phone", "salonized", "phorest", "treatwell", "acuity"],
  jobFields: [],
  marketing: {
    navLinks: [
      { href: "/#functies", label: "Functies" },
      { href: "/#hoe-het-werkt", label: "Hoe het werkt" },
      { href: "/diensten", label: "Diensten" },
      { href: "/prijzen", label: "Prijzen" },
      { href: "/over-ons", label: "Over Ons" },
      { href: "/help", label: "Hulp" },
      { href: "/contact", label: "Contact" },
    ],
    cta: { href: "/scan", label: "Gratis AI-scan" },
    footerBlurb:
      "De AI-gedreven operationele cockpit voor de moderne kapsalon. Meer boekingen, minder no-shows, meer rust.",
    logoIcon: "content_cut",
    // The kapper homepage is a bespoke page (app/(marketing)/page.tsx).
    landing: null,
  },
  nav: [
    { key: "overview" },
    { key: "customers" },
    { key: "ai" },
    { key: "practice" },
    { key: "webshop" },
    { key: "conversations" },
    { key: "escalations" },
    { key: "appointments" },
    { key: "kassa" },
    { key: "reports" },
    { key: "retention" },
    { key: "noshow" },
    { key: "integrations" },
    { key: "subscription" },
  ],
  jobCategories: [],
  assetKinds: [],
  serviceTemplates: [],
  messages: {
    reminder: ({ salonName, serviceType, date, time }) =>
      `Hoi! Een herinnering van ${salonName}: je hebt een afspraak voor ${serviceType} op ${date} om ${time}. ` +
      `Kun je niet komen? Annuleer dan tijdig via WhatsApp. Tot dan! 👋`,
    review: ({ salonName, reviewLink }) =>
      `Hoi! Bedankt voor je bezoek aan ${salonName}. Was je tevreden? Een review helpt ons enorm: ${reviewLink}`,
    retention: ({ salonName, firstName }) =>
      `Hoi ${firstName}! We hebben je een tijdje niet gezien bij ${salonName}. Zin om weer een afspraak te maken? Stuur gerust een berichtje 😊`,
    maintenanceDue: ({ salonName, firstName, assetLabel, dueDate }) =>
      `Hoi ${firstName}! ${salonName} hier: ${assetLabel} is toe aan een controle (${dueDate}). Zullen we een afspraak inplannen?`,
    greetingFallback: "kapper",
  },
  content: {
    audience: "saloneigenaren en kappers",
    blogSystemPrompt: `Je bent een Nederlandse SEO-contentspecialist voor kapsalons.
Schrijf praktische, autoritaire en warme blogartikelen (B2B, voor saloneigenaren).
Gebruik Markdown met ## en ### tussenkoppen, korte alinea's en bullets.
Vermijd overdrijving en holle marketingtaal. Schrijf in het Nederlands.`,
    blogTopicPlaceholder: "bijv. No-show preventie voor kapsalons",
    blogKeywordPlaceholder: "kapsalon SEO, no-show, online afspraken",
    blogSuggestions: [
      "No-show preventie voor kapsalons",
      "Lokale SEO voor je kapperszaak",
      "Hoe AI je salonagenda vult",
      "Meer terugkerende klanten met slimme herinneringen",
    ],
    blogMetaTitle: "Blog — Groeitips voor je kapsalon",
    blogMetaDescription: "Praktische tips over salonmarketing, lokale SEO, no-show preventie en AI voor kappers.",
    blogHeading: "Groeitips voor je kapsalon",
    blogSubheading: "Praktische inzichten over lokale SEO, no-show preventie en slim klantcontact.",
    postCta: {
      title: "Klaar om geen boeking meer te missen?",
      body: "Ontdek wat KapperAssistent voor jouw salon kan betekenen.",
      href: "/scan",
      label: "Start je gratis AI-scan",
    },
    kennisbankCategories: {
      Techniek: "Kleur- & lichtingstechnieken",
      Hoofdhuid: "Hoofdhuid & haarstructuur",
      Producten: "Producten & aftercare",
      Aftercare: "Aftercare & onderhoud",
      Inwerktijd: "Inwerktijd & planning",
      Balayage: "Balayage & highlights",
      Kleurcorrectie: "Kleurcorrectie",
      Salonsoftware: "Salonsoftware & tools",
    },
    kennisbankHeading: "Kennisbank voor kapsalons",
    kennisbankTitle: "Kennisbank — Praktijktips voor kapsalons",
    kennisbankDescription:
      "Gratis kennisbank-artikelen over haarsoorten, kleuringstechnieken, aftercare en salonmanagement voor professionele kappers.",
    kennisbankIntro:
      "Praktijktips, technieken en handleidingen voor professionele kappers. Van balayage tot aftercare, van salonsoftware tot hoofdhuidgezondheid.",
  },
};
