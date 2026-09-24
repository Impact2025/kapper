import type { VerticalPack } from "./types";

/**
 * Schilder — het bewijs dat de job-archetype echt herbruikbaar is: dit pack
 * gebruikt exact dezelfde klus-CRM als de loodgieter, alleen andere
 * categorieën, objecten en teksten. `live: false` = geen publieke site/
 * signup; het pack bestaat om de core/vertical-scheiding te blijven toetsen.
 */
export const SCHILDER_VERTICAL: VerticalPack = {
  id: "schilder",
  label: "Schilder",
  archetype: "job",
  live: false,
  // Verlaagd btw-tarief op schilder-/stucwerk aan woningen (>2 jaar) is
  // voorwaardelijk per klus en kan wetgevend wijzigen — nooit een blanket
  // default. Eigenaar overschrijft per regel; verifieer het actuele tarief bij
  // de Belastingdienst.
  vatRates: { treatment: 21, product: 21 },
  terms: {
    practitioner: "schilder",
    practitionerPlural: "schilders",
    treatment: "klus",
    treatmentPlural: "klussen",
    establishment: "bedrijf",
    owner: "vakman",
    appointment: "afspraak",
  },
  hasHealthDataGuard: false,
  brand: {
    name: "SchildersAssistent",
    domain: "schildersassistent.nl",
    siteUrl: "https://www.schildersassistent.nl",
    supportEmail: "support@schildersassistent.nl",
    tagline: "Meer tijd op de steiger, minder achter de administratie",
    description:
      "Het klus-CRM met AI-receptionist voor schildersbedrijven: aanvragen, offertes, planning en facturen in één plek.",
    hosts: ["schildersassistent.nl", "www.schildersassistent.nl"],
    dashboardTitle: "Mijn SchildersAssistent",
  },
  features: {
    jobs: true,
    quotes: true,
    assets: true,
    contracts: true,
    treatmentCards: false,
    healthRecords: false,
    webshop: false,
    doubleBooking: false,
    loyalty: false,
  },
  agent: {
    tools: ["check_availability", "find_appointments", "book_appointment", "reschedule_appointment", "cancel_appointment", "register_job", "escalate_to_staff"],
  },
  integrations: ["whatsapp", "phone", "moneybird", "eboekhouden", "exact_online", "google_calendar"],
  jobFields: [
    { key: "oppervlak", label: "Oppervlak", type: "number", unit: "m²", placeholder: "45" },
    { key: "kleur", label: "Kleur / RAL-code", type: "text", placeholder: "bv. RAL 9010" },
    { key: "aantalLagen", label: "Aantal lagen", type: "number", placeholder: "2" },
    {
      key: "ondergrond",
      label: "Ondergrond",
      type: "select",
      options: ["Muur (sauswerk)", "Stuc", "Hout", "Kunststof", "Metaal", "Behang", "Anders"],
    },
    { key: "verfMerk", label: "Verfmerk / systeem", type: "text", placeholder: "bv. Sikkens Rubbol" },
    {
      key: "woningOuderDan2Jaar",
      label: "Woning ouder dan 2 jaar?",
      type: "select",
      options: ["Onbekend", "Ja", "Nee"],
      hint: "Bepaalt of het verlaagde btw-tarief op arbeid mogelijk is — controleer het actuele tarief bij de Belastingdienst.",
    },
    { key: "steigerNodig", label: "Steiger of hoogwerker nodig?", type: "select", options: ["Nee", "Steiger", "Hoogwerker"], categories: ["buiten", "houtrot"] },
  ],
  marketing: {
    navLinks: [
      { href: "/#functies", label: "Functies" },
      { href: "/prijzen", label: "Prijzen" },
      { href: "/blog", label: "Blog" },
      { href: "/contact", label: "Contact" },
    ],
    cta: { href: "/contact", label: "Gratis kennismaking" },
    footerBlurb: "Het klus-CRM met AI-receptionist voor schildersbedrijven.",
    logoIcon: "format_paint",
    landing: {
      badge: "Voor schildersbedrijven",
      headline: "Meer tijd op de steiger, minder achter de administratie.",
      sub: "SchildersAssistent neemt aanvragen aan via telefoon en WhatsApp, legt oppervlak, ondergrond en adres vast en zet alles klaar voor je offerte, planning en factuur.",
      chat: {
        title: "WhatsApp — SchildersAssistent",
        messages: [
          { from: "customer", text: "Hoi, ik wil de buitenkant van ons huis laten schilderen, kozijnen en gevel. Wat kost dat ongeveer?" },
          {
            from: "ai",
            text: "Leuk! Om een goede offerte te maken komt de schilder eerst kijken. Wat is je adres, en hoeveel kozijnen ongeveer? Een foto van de voorkant helpt ook.",
          },
        ],
      },
      stats: [
        { icon: "call", value: "Geen aanvraag mist", label: "Ook als je op het dak staat." },
        { icon: "straighten", value: "Opname vastgelegd", label: "Oppervlak, kleur en ondergrond per project." },
        { icon: "receipt_long", value: "Van offerte tot factuur", label: "Alles in één systeem." },
      ],
      steps: [
        { title: "Jij stelt je bedrijf in", body: "Diensten, tarieven en wat jouw werkgebied is." },
        { title: "De AI neemt aanvragen aan", body: "Adres, soort werk en foto's komen bij het project." },
        { title: "Jij offreert, plant en factureert", body: "Offerte online accepteren, projecten op het planbord, factuur met één klik." },
      ],
      features: [
        { icon: "smart_toy", title: "AI-receptionist 24/7", body: "Neemt telefoon en WhatsApp op en legt aanvragen compleet vast." },
        { icon: "format_paint", title: "Projectgegevens", body: "Oppervlak, kleur/RAL, aantal lagen, ondergrond en verfsysteem per klus." },
        { icon: "request_quote", title: "Offertes en facturen", body: "Online accepteren, btw per regel, IBAN op de factuur." },
        { icon: "calendar_view_week", title: "Planbord", body: "Meerdaagse projecten en je team in één overzicht." },
        { icon: "event_repeat", title: "Onderhoudscycli", body: "Buitenschilderwerk elke paar jaar? De klant krijgt vanzelf bericht." },
        { icon: "photo_camera", title: "Foto's voor en na", body: "Vastgelegd bij het project, klaar voor oplevering." },
      ],
      faq: [
        { q: "Zit er een looptijd of overage op de AI?", a: "Nee. Een vast bedrag per maand, opzegbaar per maand." },
        { q: "Hoe zit het met btw?", a: "Je kiest het btw-tarief per regel (21%, 9% of 0%); het verlaagde tarief hangt van de klus af." },
      ],
      ctaTitle: "Klaar voor minder administratie?",
      ctaBody: "Plan een gratis kennismaking — binnen 48 uur werkend.",
    },
  },
  nav: [
    { key: "overview" },
    { key: "jobs", label: "Projecten" },
    { key: "planner" },
    { key: "customers" },
    { key: "billing" },
    { key: "maintenance", label: "Onderhoudscycli" },
    { key: "ai", label: "AI-Receptie" },
    { key: "conversations" },
    { key: "escalations" },
    { key: "practice", label: "Diensten & team" },
    { key: "reports" },
    { key: "retention", label: "Reviews & terugkeer" },
    { key: "noshow", label: "Annulering & aanbetaling" },
    { key: "integrations" },
    { key: "subscription" },
  ],
  jobCategories: [
    {
      key: "binnen",
      label: "Binnenschilderwerk",
      urgent: false,
      estimatedMinutes: 480,
      keywords: ["binnen", "muren", "plafond", "woonkamer", "slaapkamer", "sauzen", "verven"],
      checklist: [
        "Opname en kleuradvies gedaan",
        "Ondergrond geschuurd/gerepareerd",
        "Afgeplakt en afgedekt",
        "Grondverf en aflak/latex aangebracht",
        "Opleverpunten met klant doorgelopen",
      ],
    },
    {
      key: "buiten",
      label: "Buitenschilderwerk",
      urgent: false,
      estimatedMinutes: 960,
      keywords: ["buiten", "gevel", "kozijnen", "boeiboorden", "dakrand", "buitenschilderwerk"],
      checklist: [
        "Weersvoorspelling gecontroleerd",
        "Houtrot/gebreken vastgelegd en hersteld",
        "Ondergrond geschuurd en ontvet",
        "Grondlaag en afwerklaag aangebracht",
        "Oplevering met klant",
      ],
    },
    {
      key: "houtrot",
      label: "Houtrot herstel",
      urgent: false,
      estimatedMinutes: 240,
      keywords: ["houtrot", "rot hout", "rotte kozijn", "kozijn hersteld"],
      checklist: ["Omvang houtrot vastgelegd (foto's)", "Rot hout verwijderd", "Herstel aangebracht", "Afgewerkt en geschilderd"],
    },
    {
      key: "stucwerk",
      label: "Stucwerk / behang",
      urgent: false,
      estimatedMinutes: 480,
      keywords: ["stucen", "stucwerk", "behangen", "behang", "spachtelputz", "glad afgewerkt"],
      checklist: ["Ondergrond beoordeeld", "Stuc/behang aangebracht", "Uitgehard/droog gecontroleerd", "Oplevering met klant"],
    },
    {
      key: "overig",
      label: "Overig",
      urgent: false,
      estimatedMinutes: 240,
      keywords: [],
      checklist: ["Werkzaamheden uitgevoerd", "Opgeruimd en opgeleverd"],
    },
  ],
  assetKinds: [
    { key: "gevel", label: "Gevel / buitenschilderwerk", icon: "home", serviceIntervalMonths: 60 },
    { key: "kozijnen", label: "Kozijnen", icon: "window", serviceIntervalMonths: 48 },
    { key: "binnenwerk", label: "Binnenschilderwerk", icon: "format_paint", serviceIntervalMonths: null },
    { key: "overig", label: "Overig", icon: "build", serviceIntervalMonths: null },
  ],
  serviceTemplates: [
    { name: "Schilder per uur", category: "overig", durationMinutes: 60, priceCents: 5500, vatRatePercent: 21, description: "Uurtarief schilder (excl. materiaal)." },
    { name: "Voorrijkosten", category: "overig", durationMinutes: 0, priceCents: 2500, vatRatePercent: 21, description: "Voorrijkosten per bezoek." },
  ],
  messages: {
    reminder: ({ salonName, serviceType, date, time }) =>
      `Hoi! Een herinnering van ${salonName}: we komen ${date} rond ${time} bij je langs voor ${serviceType}. ` +
      `Past het niet meer? Laat het ons tijdig weten via WhatsApp. Tot dan! 🎨`,
    review: ({ salonName, reviewLink }) =>
      `Hoi! Bedankt dat we bij je aan de slag mochten. Was je tevreden over ${salonName}? Een review helpt ons enorm: ${reviewLink}`,
    retention: ({ salonName, firstName }) =>
      `Hoi ${firstName}! ${salonName} hier. Nog iets dat een likje verf kan gebruiken? Stuur gerust een berichtje 🎨`,
    maintenanceDue: ({ salonName, firstName, assetLabel, dueDate }) =>
      `Hoi ${firstName}! ${salonName} hier: het onderhoud aan je ${assetLabel} staat gepland voor ${dueDate}. Zullen we een dag en tijd afspreken?`,
    greetingFallback: "vakman",
  },
  content: {
    audience: "eigenaren van schildersbedrijven",
    blogSystemPrompt: `Je bent een Nederlandse SEO-contentspecialist voor schildersbedrijven.
Schrijf praktische, autoritaire en nuchtere blogartikelen (B2B, voor eigenaren van schildersbedrijven).
Gebruik Markdown met ## en ### tussenkoppen, korte alinea's en bullets.
Vermijd overdrijving en holle marketingtaal. Schrijf in het Nederlands.`,
    blogTopicPlaceholder: "bijv. Offertes voor schilderwerk sneller versturen",
    blogKeywordPlaceholder: "schilder software, offerte schilder, planning schilder",
    blogSuggestions: [
      "Offertes voor schilderwerk sneller versturen",
      "Planning van meerdaagse schilderprojecten",
      "Onderhoudscycli voor buitenschilderwerk als terugkerende omzet",
    ],
    blogMetaTitle: "Blog — Tips voor schildersbedrijven",
    blogMetaDescription: "Praktische tips over offertes, planning en onderhoudscycli voor schilders.",
    blogHeading: "Tips voor schilders",
    blogSubheading: "Praktische inzichten over offertes, planning en terugkerende omzet.",
    postCta: {
      title: "Meer tijd op de steiger?",
      body: "Ontdek wat SchildersAssistent voor jouw bedrijf kan betekenen.",
      href: "/contact",
      label: "Plan een gratis kennismaking",
    },
    kennisbankCategories: {},
    kennisbankHeading: "Kennisbank voor schilders",
    kennisbankTitle: "Kennisbank — Praktijktips voor schilders",
    kennisbankDescription: "Gratis kennisbank-artikelen over offertes, planning en het runnen van een schildersbedrijf.",
    kennisbankIntro: "Praktijktips voor schilders: van offertes en planning tot onderhoudscycli.",
  },
};
