import type { VerticalPack } from "./types";

export const LOODGIETER_VERTICAL: VerticalPack = {
  id: "loodgieter",
  label: "Loodgieter",
  archetype: "job",
  live: true,
  // A plumber's reduced 9% only applies conditionally per klus (verbouwing/
  // herstel aan een woning ouder dan 2 jaar, arbeidsloon only) — never a
  // blanket sector default, so this defaults to 21/21 and the owner overrides
  // per klus/regel where the reduced rate genuinely applies. Do NOT "fix" this
  // back to 9%.
  vatRates: { treatment: 21, product: 21 },
  terms: {
    practitioner: "loodgieter",
    practitionerPlural: "monteurs",
    treatment: "klus",
    treatmentPlural: "klussen",
    establishment: "bedrijf",
    owner: "vakman",
    appointment: "afspraak",
  },
  hasHealthDataGuard: false,
  brand: {
    name: "LoodgietersAssistent",
    domain: "loodgietersassistent.nl",
    siteUrl: "https://www.loodgietersassistent.nl",
    supportEmail: "support@loodgietersassistent.nl",
    tagline: "Nooit meer een gemiste noodoproep",
    description:
      "Het klus-CRM met AI-receptionist voor loodgietersbedrijven: telefoon en WhatsApp 24/7, klusadres en spoed direct vastgelegd, werkbon, offerte en factuur in één plek.",
    hosts: ["loodgietersassistent.nl", "www.loodgietersassistent.nl"],
    dashboardTitle: "Mijn LoodgietersAssistent",
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
    tools: [
      "check_availability",
      "find_appointments",
      "book_appointment",
      "reschedule_appointment",
      "cancel_appointment",
      "register_job",
      "escalate_to_staff",
    ],
    prompt: {
      spoedRule:
        "een acuut probleem (water dat blijft lopen of door het plafond komt, gaslucht, geen warm water of verwarming bij kou, veiligheidsrisico) behandel je als spoed. Geef eerst korte veiligheidstips (bijv. hoofdkraan afsluiten, stroom uit bij water bij stopcontacten). Bij gaslucht: ramen open, geen vuur of lichtschakelaars aanraken, het pand verlaten en het gasstoringsnummer 0800-9009 bellen; bij acuut gevaar 112.",
      hazardExamples: "gaslek, ernstige waterschade",
      quoteExamples: "een nieuwe ketel of badkamer",
      photoRule:
        "gebruik die om in te schatten welke {treatment} en hoeveel tijd nodig is, en noem dat kort in je antwoord. Bij een mogelijk gevaarlijke situatie (gaslek, ernstige waterschade) altijd escalate_to_staff gebruiken in plaats van zelf gerust te stellen. De foto wordt automatisch bij de klus gevoegd.",
      scene: "onderweg of onder een gootsteen ligt",
      urgencyHint: "spoed = acuut (water/gas/geen verwarming in de kou/veiligheid); anders normaal",
      photoSubjects: "een lekkage, leiding of cv-ketel",
    },
  },
  integrations: ["whatsapp", "phone", "moneybird", "eboekhouden", "exact_online", "google_calendar"],
  jobFields: [
    {
      key: "woningOuderDan2Jaar",
      label: "Woning ouder dan 2 jaar?",
      type: "select",
      options: ["Onbekend", "Ja", "Nee"],
      hint: "Bepaalt of het verlaagde btw-tarief op arbeid mogelijk is — controleer het actuele tarief bij de Belastingdienst.",
    },
    { key: "bouwjaar", label: "Bouwjaar woning", type: "number", placeholder: "1985" },
    {
      key: "hoofdkraanBereikbaar",
      label: "Hoofdkraan bereikbaar?",
      type: "select",
      options: ["Onbekend", "Ja", "Nee"],
      categories: ["lekkage", "sanitair", "badkamer"],
    },
    { key: "foutcode", label: "Foutcode ketel", type: "text", placeholder: "bv. F.22", categories: ["cv_storing", "cv_onderhoud"] },
    {
      key: "toestelType",
      label: "Type toestel",
      type: "select",
      options: ["CV-ketel", "Hybride", "Warmtepomp", "Boiler", "Geiser", "Anders"],
      categories: ["cv_storing", "cv_onderhoud", "cv_installatie"],
    },
    { key: "aantalRadiatoren", label: "Aantal radiatoren", type: "number", categories: ["cv_installatie"] },
  ],
  marketing: {
    navLinks: [
      { href: "/#functies", label: "Functies" },
      { href: "/#hoe-het-werkt", label: "Hoe het werkt" },
      { href: "/prijzen", label: "Prijzen" },
      { href: "/blog", label: "Blog" },
      { href: "/kennisbank", label: "Kennisbank" },
      { href: "/help", label: "Hulp" },
      { href: "/contact", label: "Contact" },
    ],
    cta: { href: "/contact", label: "Gratis kennismaking" },
    footerBlurb:
      "Het klus-CRM met AI-receptionist voor loodgietersbedrijven: geen spoedoproep meer missen, van aanvraag tot betaalde factuur op één plek.",
    logoIcon: "plumbing",
    landing: {
      badge: "Voor loodgieters en installatiebedrijven",
      headline: "Nooit meer een gemiste noodoproep.",
      sub: "Terwijl jij onder een lekkende leiding ligt, rinkelt de telefoon. LoodgietersAssistent neemt 24/7 op via telefoon en WhatsApp, legt klusadres en spoed vast en zet alles klaar in je klus-CRM: van aanvraag tot betaalde factuur.",
      chat: {
        title: "WhatsApp — LoodgietersAssistent",
        messages: [
          { from: "customer", text: "Hoi, mijn cv-ketel lekt en het water staat al op de vloer. Kunnen jullie vandaag nog komen?" },
          {
            from: "ai",
            text: "Dat klinkt als spoed. Kun je de hoofdkraan afsluiten? Stuur me je adres, dan leg ik het direct vast en waarschuw ik de monteur van dienst.",
          },
        ],
      },
      stats: [
        { icon: "call", value: "Nooit gemist", label: "Ook 's avonds en in het weekend." },
        { icon: "emergency", value: "Spoed direct gemeld", label: "Jij krijgt meteen een mail en WhatsApp." },
        { icon: "receipt_long", value: "Van klus tot factuur", label: "Alles in één systeem." },
      ],
      steps: [
        {
          title: "Jij stelt je bedrijf in",
          body: "Diensten, tarieven, monteurs en wat als spoed geldt. We geven je een startcatalogus mee; jij past hem aan.",
        },
        {
          title: "De AI neemt de oproepen aan",
          body: "Telefoon en WhatsApp: naam, klusadres, probleem en spoed worden vastgelegd. Foto's van de klant komen bij de klus.",
        },
        {
          title: "Jij plant, werkt en factureert",
          body: "Zet de klus op het planbord, maak een offerte of werkbon, laat de klant online accepteren en stuur de factuur.",
        },
      ],
      features: [
        { icon: "smart_toy", title: "AI-receptionist 24/7", body: "Neemt telefoon en WhatsApp op, herkent spoed en legt het klusadres vast. Bij twijfel of gevaar verbindt hij door." },
        { icon: "emergency", title: "Spoed-triage", body: "Lekkage, gaslucht, geen verwarming: spoed krijgt veiligheidstips, een spoedmarkering en een directe melding aan jou." },
        { icon: "group", title: "Klant-CRM met adressen", body: "Klanten met meerdere adressen, toegangsinfo, contactpersoon ter plaatse en de volledige klushistorie." },
        { icon: "calendar_view_week", title: "Planbord per monteur", body: "Wie is waar en wanneer. Spoed bovenaan, overlappende klussen worden gemarkeerd." },
        { icon: "checklist", title: "Werkbon op je telefoon", body: "Checklist per soort klus, foto's voor en na, werkverslag en opleverhandtekening met garantie." },
        { icon: "request_quote", title: "Offertes en facturen", body: "Offerte online accepteren, één klik naar factuur, IBAN op de factuur en automatische betalingsherinneringen." },
        { icon: "build_circle", title: "Installatiepaspoort", body: "Merk, type, serienummer en garantie van elke ketel of boiler, met het volgende onderhoud in beeld." },
        { icon: "event_repeat", title: "Onderhoudscontracten", body: "Elke beurt ontstaat vanzelf als klus en de klant krijgt automatisch bericht. Terugkerende omzet zonder handwerk." },
      ],
      faq: [
        {
          q: "Werkt dit ook zonder planningssoftware?",
          a: "Ja. Klussen, planning, offertes en facturen zitten in LoodgietersAssistent zelf — je hoeft niets te koppelen om te starten.",
        },
        {
          q: "Wat gebeurt er bij een spoedgeval?",
          a: "De AI geeft eerst veiligheidstips (bijvoorbeeld hoofdkraan dicht, bij gaslucht ramen open en 112 of het gasstoringsnummer), legt de klus vast als spoed en waarschuwt jou direct per mail en WhatsApp.",
        },
        {
          q: "Kan ik mijn eigen tarieven en categorieën instellen?",
          a: "Ja. Je begint met een voorbeeldcatalogus (ontstopping, lekkage, cv-onderhoud, spoedtarief) en past prijzen, duur en teksten aan.",
        },
        {
          q: "Hoe zit het met btw en facturen?",
          a: "Facturen bevatten de wettelijk verplichte gegevens (KvK, btw-nummer, factuurnummer, btw per tarief). Het btw-tarief kies je per regel — 21%, 9% of 0% — omdat het verlaagde tarief per klus kan verschillen.",
        },
        {
          q: "Zit er een looptijd of overage op de AI?",
          a: "Nee. Je betaalt een vast bedrag per maand, opzegbaar per maand, zonder kosten per gesprek of per minuut.",
        },
      ],
      ctaTitle: "Klaar om geen spoedklus meer te missen?",
      ctaBody: "Plan een gratis kennismaking — binnen 48 uur werkend, geen creditcard nodig.",
    },
  },
  nav: [
    { key: "overview" },
    { key: "jobs" },
    { key: "planner" },
    { key: "customers" },
    { key: "billing" },
    { key: "maintenance" },
    { key: "ai", label: "AI-Receptie" },
    { key: "conversations" },
    { key: "escalations", label: "Spoed & doorverbinden" },
    { key: "practice", label: "Diensten & team" },
    { key: "reports" },
    { key: "retention", label: "Reviews & terugkeer" },
    { key: "noshow", label: "Annulering & voorrijkosten" },
    { key: "integrations" },
    { key: "subscription" },
  ],
  jobCategories: [
    {
      key: "lekkage",
      label: "Lekkage",
      urgent: true,
      estimatedMinutes: 90,
      keywords: ["lek", "lekkage", "druppelt", "waterschade", "natte plek", "water door het plafond", "leiding gesprongen"],
      checklist: [
        "Hoofdkraan afgesloten / water uit",
        "Lekbron gelokaliseerd",
        "Lek verholpen",
        "Druk- en dichtheidscontrole gedaan",
        "Foto's voor/na gemaakt",
        "Opgeruimd en klant geïnstrueerd",
      ],
    },
    {
      key: "gaslucht",
      label: "Gaslucht / gasstoring",
      urgent: true,
      estimatedMinutes: 60,
      keywords: ["gaslucht", "gaslek", "gas ruiken", "gasgeur"],
      checklist: [
        "Veiligheid ter plaatse gecontroleerd (ventilatie, geen ontstekingsbronnen)",
        "Gasleiding/aansluitingen gecontroleerd",
        "Lekzoekspray of meter gebruikt",
        "Eventueel netbeheerder ingeschakeld",
        "Bevindingen vastgelegd",
      ],
    },
    {
      key: "verstopping",
      label: "Verstopping / ontstopping",
      urgent: false,
      estimatedMinutes: 60,
      keywords: ["verstopt", "ontstoppen", "afvoer", "riool", "gootsteen loopt niet door", "toilet verstopt", "stinkt"],
      checklist: [
        "Locatie verstopping bepaald",
        "Ontstopt (spiraal/hogedruk)",
        "Doorstroming getest",
        "Eventueel camera-inspectie aangeboden",
        "Opgeruimd en klant geïnstrueerd",
      ],
    },
    {
      key: "cv_storing",
      label: "CV-storing / geen warm water",
      urgent: false,
      estimatedMinutes: 75,
      keywords: ["cv", "ketel", "storing", "geen warm water", "geen verwarming", "foutcode", "cv-ketel", "radiator wordt niet warm"],
      checklist: [
        "Foutcode/symptoom genoteerd",
        "Ketel en druk gecontroleerd",
        "Oorzaak vastgesteld en verholpen",
        "Ketel getest onder belasting",
        "Klant geïnstrueerd",
      ],
    },
    {
      key: "cv_onderhoud",
      label: "CV-onderhoud",
      urgent: false,
      estimatedMinutes: 60,
      keywords: ["onderhoud", "jaarlijks onderhoud", "cv onderhoud", "keuring", "servicebeurt"],
      checklist: [
        "Ketel schoongemaakt",
        "Brander en warmtewisselaar gecontroleerd",
        "Rookgasanalyse gedaan",
        "Waterdruk gecontroleerd",
        "Onderhoudsdatum in installatiepaspoort bijgewerkt",
      ],
    },
    {
      key: "cv_installatie",
      label: "CV-ketel vervangen / installatie",
      urgent: false,
      estimatedMinutes: 300,
      keywords: ["nieuwe ketel", "ketel vervangen", "installeren", "warmtepomp", "hybride"],
      checklist: [
        "Oude installatie afgetapt en gedemonteerd",
        "Nieuwe installatie geplaatst en aangesloten",
        "Gas-/rookgasafvoer gecontroleerd",
        "Ingeregeld en getest",
        "Installatiepaspoort en garantie ingevuld",
        "Klant geïnstrueerd",
      ],
    },
    {
      key: "sanitair",
      label: "Sanitair / kraan / toilet",
      urgent: false,
      estimatedMinutes: 90,
      keywords: ["kraan", "toilet", "wastafel", "douche", "sanitair", "stortbak", "mengkraan"],
      checklist: [
        "Water afgesloten",
        "Onderdeel gedemonteerd/vervangen",
        "Aansluitingen dichtheid getest",
        "Opgeruimd",
      ],
    },
    {
      key: "badkamer",
      label: "Badkamer / renovatie",
      urgent: false,
      estimatedMinutes: 480,
      keywords: ["badkamer", "verbouwen", "renovatie", "nieuwe badkamer", "leidingwerk"],
      checklist: [
        "Opname en maatvoering gedaan",
        "Leidingwerk aangelegd",
        "Sanitair geplaatst",
        "Druk- en dichtheidsproef gedaan",
        "Oplevering met klant",
      ],
    },
    {
      key: "overig",
      label: "Overig",
      urgent: false,
      estimatedMinutes: 60,
      keywords: [],
      checklist: ["Werkzaamheden uitgevoerd", "Opgeruimd en klant geïnstrueerd"],
    },
  ],
  assetKinds: [
    { key: "cv_ketel", label: "CV-ketel", icon: "heat_pump", serviceIntervalMonths: 12 },
    { key: "warmtepomp", label: "Warmtepomp", icon: "ac_unit", serviceIntervalMonths: 12 },
    { key: "boiler", label: "Boiler / warmwatertoestel", icon: "water_heater", serviceIntervalMonths: 24 },
    { key: "geiser", label: "Geiser", icon: "local_fire_department", serviceIntervalMonths: 12 },
    { key: "vloerverwarming", label: "Vloerverwarming", icon: "layers", serviceIntervalMonths: null },
    { key: "sanitair", label: "Sanitair", icon: "bathtub", serviceIntervalMonths: null },
    { key: "riolering", label: "Riolering / afvoer", icon: "plumbing", serviceIntervalMonths: null },
    { key: "overig", label: "Overig", icon: "build", serviceIntervalMonths: null },
  ],
  // Voorbeeldprijzen — de eigenaar past ze aan; bedoeld als startpunt.
  serviceTemplates: [
    { name: "Voorrijkosten", category: "overig", durationMinutes: 0, priceCents: 3500, vatRatePercent: 21, description: "Voorrijkosten per bezoek." },
    { name: "Ontstopping afvoer", category: "verstopping", durationMinutes: 60, priceCents: 9500, vatRatePercent: 21, description: "Ontstoppen van gootsteen, wastafel, douche of toilet." },
    { name: "Lekkage opsporen en verhelpen", category: "lekkage", durationMinutes: 90, priceCents: 12500, vatRatePercent: 21, description: "Lekkage lokaliseren en herstellen (excl. materiaal)." },
    { name: "CV-onderhoud", category: "cv_onderhoud", durationMinutes: 60, priceCents: 8900, vatRatePercent: 21, description: "Jaarlijks onderhoud aan de cv-ketel." },
    { name: "CV-storing", category: "cv_storing", durationMinutes: 75, priceCents: 9500, vatRatePercent: 21, description: "Storing diagnosticeren en verhelpen (excl. onderdelen)." },
    { name: "Spoedtarief buiten kantoortijd", category: "lekkage", durationMinutes: 60, priceCents: 15500, vatRatePercent: 21, description: "Spoedklus in avond, nacht of weekend." },
  ],
  messages: {
    reminder: ({ salonName, serviceType, date, time }) =>
      `Hoi! Een herinnering van ${salonName}: onze monteur komt ${date} rond ${time} bij je langs voor ${serviceType}. ` +
      `Kun je niet thuis zijn? Laat het ons tijdig weten via WhatsApp. Tot dan! 👷`,
    review: ({ salonName, reviewLink }) =>
      `Hoi! Bedankt dat we bij je langs mochten komen. Was je tevreden over ${salonName}? Een review helpt ons enorm: ${reviewLink}`,
    retention: ({ salonName, firstName }) =>
      `Hoi ${firstName}! ${salonName} hier. Is alles nog in orde bij je thuis? Heb je iets waar we naar kunnen kijken, stuur gerust een berichtje 👷`,
    maintenanceDue: ({ salonName, firstName, assetLabel, dueDate }) =>
      `Hoi ${firstName}! ${salonName} hier: het onderhoud aan je ${assetLabel} staat gepland voor ${dueDate}. Zullen we een dag en tijd afspreken? Stuur ons gerust een berichtje.`,
    greetingFallback: "vakman",
  },
  content: {
    audience: "eigenaren van loodgietersbedrijven en installatiebedrijven",
    blogSystemPrompt: `Je bent een Nederlandse SEO-contentspecialist voor loodgieters- en installatiebedrijven.
Schrijf praktische, autoritaire en nuchtere blogartikelen (B2B, voor eigenaren van loodgietersbedrijven).
Gebruik Markdown met ## en ### tussenkoppen, korte alinea's en bullets.
Noem concrete voorbeelden uit de praktijk (gemiste spoedoproepen, offertes, werkbonnen, onderhoudscontracten, planning).
Vermijd overdrijving en holle marketingtaal. Schrijf in het Nederlands.`,
    blogTopicPlaceholder: "bijv. Gemiste spoedoproepen voorkomen als loodgieter",
    blogKeywordPlaceholder: "loodgieter software, spoedklus, offerte loodgieter, onderhoudscontract",
    blogSuggestions: [
      "Gemiste spoedoproepen voorkomen als loodgieter",
      "Sneller offreren: van aanvraag naar geaccepteerde offerte",
      "Onderhoudscontracten voor cv-ketels: zo bouw je terugkerende omzet op",
      "Werkbonnen op je telefoon in plaats van papier",
      "Lokaal gevonden worden als loodgieter in jouw regio",
    ],
    blogMetaTitle: "Blog — Tips voor loodgieters en installatiebedrijven",
    blogMetaDescription:
      "Praktische tips over spoedklussen, offertes, onderhoudscontracten en het runnen van een loodgietersbedrijf.",
    blogHeading: "Tips voor loodgieters en installateurs",
    blogSubheading: "Praktische inzichten over spoedklussen, offertes, planning en terugkerende omzet.",
    postCta: {
      title: "Geen spoedklus meer missen?",
      body: "Ontdek wat LoodgietersAssistent voor jouw bedrijf kan betekenen.",
      href: "/contact",
      label: "Plan een gratis kennismaking",
    },
    kennisbankCategories: {
      Spoed: "Spoed & storingen",
      Offertes: "Offertes & facturen",
      Planning: "Planning & werkbonnen",
      Onderhoud: "Onderhoud & contracten",
      Vakkennis: "Vakkennis",
      Marketing: "Gevonden worden",
    },
    kennisbankHeading: "Kennisbank voor loodgieters",
    kennisbankTitle: "Kennisbank — Praktijktips voor loodgieters",
    kennisbankDescription:
      "Gratis kennisbank-artikelen over spoedklussen, offertes en werkbonnen, onderhoudscontracten en het runnen van een loodgietersbedrijf.",
    kennisbankIntro:
      "Praktijktips voor loodgieters en installateurs: van spoedklussen en offertes tot onderhoudscontracten en planning.",
  },
};
