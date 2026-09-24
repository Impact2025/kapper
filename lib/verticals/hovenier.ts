import type { VerticalPack } from "./types";

/**
 * Hovenier — tweede job-vertical met een eigen gezicht: groen thema, eigen
 * spoedregels (stormschade i.p.v. gas/water), eigen klusvelden en prijs-copy.
 *
 * `live: false` tot hovenierassistent.nl op Vercel/Resend is aangesloten:
 * zolang het pack niet live is claimt het geen host (proxy.ts), en is de
 * site alleen bereikbaar via /sites/hovenier in dev. Zet `live: true` om te
 * lanceren.
 *
 * Alles in de landing- en prijs-copy hieronder is functionaliteit die nu echt
 * bestaat (klus-CRM, planbord, werkbon, offerte/factuur, objecten per adres,
 * onderhoudscontracten met vast interval). Seizoensschema's, weerkoppeling en
 * offerte-eenheden (m²/m³) zijn gepland en worden pas gecommuniceerd als ze
 * gebouwd zijn — zie de kwartaal-check op claims vs. code.
 */
export const HOVENIER_VERTICAL: VerticalPack = {
  id: "hovenier",
  label: "Hovenier",
  archetype: "job",
  live: false,
  // Tuinaanleg en -onderhoud zijn diensten tegen 21%. Het verlaagde tarief van
  // 9% geldt voor de *levering* van planten, en kan voorwaardelijk gelden voor
  // arbeid aan woningen ouder dan 2 jaar — nooit een blanket default. De
  // eigenaar kiest het tarief per regel; verifieer het actuele tarief bij de
  // Belastingdienst.
  vatRates: { treatment: 21, product: 21 },
  terms: {
    practitioner: "hovenier",
    practitionerPlural: "hoveniers",
    treatment: "klus",
    treatmentPlural: "klussen",
    establishment: "bedrijf",
    owner: "vakman",
    appointment: "afspraak",
  },
  hasHealthDataGuard: false,
  brand: {
    name: "HovenierAssistent",
    domain: "hovenierassistent.nl",
    siteUrl: "https://www.hovenierassistent.nl",
    supportEmail: "support@hovenierassistent.nl",
    tagline: "Meer tijd in de tuin, minder achter je bureau",
    description:
      "Het klus-CRM met AI-receptionist voor hoveniers: telefoon en WhatsApp 24/7, tuinadres en stormschade direct vastgelegd, planbord, offerte en factuur in één plek.",
    hosts: ["hovenierassistent.nl", "www.hovenierassistent.nl"],
    dashboardTitle: "Mijn HovenierAssistent",
  },
  // Blad-groen; contrast getoetst (wit op primary ≥ 6:1).
  theme: {
    primary: "#2f6b3a",
    onPrimary: "#ffffff",
    primaryContainer: "#7fb08a",
    onPrimaryContainer: "#0d2b14",
    primaryFixed: "#c8ecce",
    primaryFixedDim: "#accfb2",
    onPrimaryFixed: "#06210f",
    onPrimaryFixedVariant: "#1f5029",
    inversePrimary: "#accfb2",
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
  pricing: {
    essential: {
      name: "Essential Assistent",
      tagline: "Voor zelfstandige hoveniers.",
      audience: "Zelfstandig",
      valueLine: "Terugverdiend met 1 extra tuinklus per maand.",
      features: [
        "AI neemt telefoon én WhatsApp op, 24/7 — ook als je met de bosmaaier in een tuin staat",
        "Legt tuinadres, klus en foto's direct vast als klus in je CRM",
        "Klanten met meerdere adressen en een volledige klushistorie",
        "Planbord per hovenier: wie werkt waar, en stormschade staat bovenaan",
        "Foto's voor/na en een checklist per klus op je telefoon",
        "Automatische afspraakherinneringen en review-verzoeken",
      ],
    },
    pro: {
      name: "Pro Assistent",
      tagline: "Voor hoveniersbedrijven met meerdere ploegen.",
      audience: "Meerdere ploegen",
      valueLine: "Sneller offreren, sneller betaald.",
      features: [
        "Alles uit Essential",
        "Offertes die de klant online accepteert; facturen met IBAN en automatische betalingsherinneringen",
        "Tuinpaspoort per adres: gazon, haag, bomen, vijver en beregening met het volgende onderhoud in beeld",
        "Onderhoudscontracten: de klus en de klantherinnering ontstaan vanzelf",
        "Aanbetaling bij inplannen — minder afzeggingen op het laatste moment",
        "Kan een gesprek bij stormschade direct doorzetten naar de hovenier van dienst",
        "WhatsApp-berichtkosten zitten al in de prijs, geen aparte factuur",
      ],
    },
    elite: {
      name: "Elite Cockpit",
      tagline: "Voor grotere hoveniers- en groenbedrijven.",
      audience: "Groot bedrijf",
      valueLine: "Eén cockpit voor al je ploegen en vestigingen.",
      features: [
        "Alles uit Pro",
        "Beheer meerdere vestigingen vanuit één cockpit",
        "Maandelijks rapport: precies wat de AI je heeft opgeleverd",
      ],
    },
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
        "een acuut probleem (een omgevallen boom of afgebroken tak die een woning, auto, weg of pad blokkeert of dreigt te vallen, of een tak die op een stroomkabel hangt) behandel je als spoed. Geef eerst korte veiligheidstips: blijf uit de buurt van de boom of tak, raak nooit een tak aan die op een stroomleiding of kabel hangt en probeer zelf geen boom te zagen of te verplaatsen. Bij gevaar voor personen of een boom op de openbare weg: 112; bij een tak op een stroomkabel: de netbeheerder waarschuwen.",
      hazardExamples: "een boom of tak op een stroomkabel, een dreigend omvallende boom of personen in gevaar",
      quoteExamples: "een nieuwe tuin, een terras of het rooien van een boom",
      photoRule:
        "gebruik die om in te schatten welke {treatment} en hoeveel tijd, materiaal en groenafvoer nodig zijn, en noem dat kort in je antwoord. Vraag zo nodig om een tweede foto van het geheel of naar het oppervlak van de tuin. Bij een mogelijk gevaarlijke situatie (een boom of tak op een stroomkabel of een dreigend omvallende boom) altijd escalate_to_staff gebruiken in plaats van zelf gerust te stellen. De foto wordt automatisch bij de klus gevoegd.",
      scene: "onderweg of in een tuin aan het werk",
      urgencyHint: "spoed = acuut (boom of tak die gevaar of schade veroorzaakt, stormschade); anders normaal",
      photoSubjects: "een tuin, boom, haag of stormschade",
    },
  },
  integrations: ["whatsapp", "phone", "moneybird", "eboekhouden", "exact_online", "google_calendar"],
  jobFields: [
    {
      key: "oppervlak",
      label: "Oppervlak tuin",
      type: "number",
      unit: "m²",
      placeholder: "120",
      categories: ["onderhoud", "aanleg", "bestrating", "gazon"],
    },
    {
      key: "bereikbaarheid",
      label: "Bereikbaarheid",
      type: "select",
      options: ["Onbekend", "Met bus/aanhanger tot aan de tuin", "Alleen via woning of smalle doorgang"],
      hint: "Bepaalt materieel en tijd — vooral bij aanleg en bestrating.",
    },
    {
      key: "groenafvoer",
      label: "Groenafval",
      type: "select",
      options: ["Onbekend", "Wij voeren af", "Klant regelt zelf"],
      categories: ["onderhoud", "snoeien", "bomen", "gazon", "storm"],
    },
    {
      key: "kabelsLeidingen",
      label: "Kabels/leidingen in de grond bekend?",
      type: "select",
      options: ["Onbekend", "Ja", "Nee"],
      hint: "Bij graafwerk is een KLIC-melding verplicht voordat je begint.",
      categories: ["aanleg", "bestrating"],
    },
    {
      key: "boomhoogte",
      label: "Hoogte boom",
      type: "number",
      unit: "m",
      placeholder: "12",
      hint: "Kappen of ingrijpend snoeien kan vergunningplichtig zijn — controleer de regels van de gemeente.",
      categories: ["bomen", "storm"],
    },
    {
      key: "buitenkraanStroom",
      label: "Buitenkraan en stroom beschikbaar?",
      type: "select",
      options: ["Onbekend", "Beide", "Alleen water", "Alleen stroom", "Geen van beide"],
    },
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
      "Het klus-CRM met AI-receptionist voor hoveniers: geen aanvraag of stormmelding missen, van tuinklus tot betaalde factuur op één plek.",
    logoIcon: "yard",
    landing: {
      badge: "Voor hoveniers en groenbedrijven",
      headline: "Meer tijd in de tuin, minder achter je bureau.",
      sub: "Terwijl jij met de bosmaaier of kettingzaag aan het werk bent, rinkelt de telefoon. HovenierAssistent neemt 24/7 op via telefoon en WhatsApp, legt tuinadres en klus vast en zet alles klaar in je klus-CRM: van aanvraag tot betaalde factuur.",
      chat: {
        title: "WhatsApp — HovenierAssistent",
        messages: [
          { from: "customer", text: "Hoi, na de storm ligt er een grote tak in mijn achtertuin en er hangt nog één half af boven het pad. Kunnen jullie komen kijken?" },
          {
            from: "ai",
            text: "Vervelend! Blijf uit de buurt van die tak, dat is veiliger. Stuur me een foto en je adres, dan leg ik het direct vast en laat ik de hovenier van dienst meteen weten dat het spoed is.",
          },
        ],
      },
      stats: [
        { icon: "call", value: "Nooit gemist", label: "Ook als je op een dak of in de boom zit." },
        { icon: "emergency", value: "Stormschade direct gemeld", label: "Jij krijgt meteen een mail en WhatsApp." },
        { icon: "receipt_long", value: "Van klus tot factuur", label: "Alles in één systeem." },
      ],
      steps: [
        {
          title: "Jij stelt je bedrijf in",
          body: "Diensten, tarieven, ploegen en wat als spoed geldt. We geven je een startcatalogus mee; jij past hem aan.",
        },
        {
          title: "De AI neemt de aanvragen aan",
          body: "Telefoon en WhatsApp: naam, tuinadres, wat er moet gebeuren en of het dringend is. Foto's van de tuin komen bij de klus.",
        },
        {
          title: "Jij plant, werkt en factureert",
          body: "Zet de klus op het planbord, maak een offerte of werkbon, laat de klant online accepteren en stuur de factuur.",
        },
      ],
      features: [
        { icon: "smart_toy", title: "AI-receptionist 24/7", body: "Neemt telefoon en WhatsApp op, herkent de soort klus en legt het tuinadres vast. Bij twijfel of gevaar verbindt hij door." },
        { icon: "emergency", title: "Storm- en spoedmelding", body: "Omgevallen boom of afgebroken tak: de AI geeft veiligheidstips, markeert de klus als spoed en waarschuwt jou direct." },
        { icon: "group", title: "Klant-CRM met adressen", body: "Klanten met meerdere tuinen, toegangsinfo, contactpersoon ter plaatse en de volledige klushistorie." },
        { icon: "calendar_view_week", title: "Planbord per ploeg", body: "Wie werkt waar en wanneer. Spoed bovenaan, overlappende klussen worden gemarkeerd." },
        { icon: "checklist", title: "Werkbon op je telefoon", body: "Checklist per soort klus, foto's voor en na, werkverslag en opleverhandtekening." },
        { icon: "request_quote", title: "Offertes en facturen", body: "Offerte online accepteren, één klik naar factuur, IBAN op de factuur en automatische betalingsherinneringen." },
        { icon: "yard", title: "Tuinpaspoort", body: "Gazon, haag, bomen, vijver en beregening per adres, met het volgende onderhoud in beeld." },
        { icon: "event_repeat", title: "Onderhoudscontracten", body: "Elke beurt ontstaat vanzelf als klus en de klant krijgt automatisch bericht. Terugkerende omzet zonder handwerk." },
      ],
      faq: [
        {
          q: "Werkt dit ook zonder planningssoftware?",
          a: "Ja. Klussen, planning, offertes en facturen zitten in HovenierAssistent zelf — je hoeft niets te koppelen om te starten.",
        },
        {
          q: "Wat gebeurt er bij stormschade?",
          a: "De AI geeft eerst veiligheidstips (blijf uit de buurt van de boom of tak, raak nooit een tak op een stroomkabel aan), legt de klus vast als spoed en waarschuwt jou direct per mail en WhatsApp. Bij gevaar voor personen verwijst hij naar 112.",
        },
        {
          q: "Kan ik mijn eigen tarieven en soorten klussen instellen?",
          a: "Ja. Je begint met een voorbeeldcatalogus (tuinonderhoud, snoeiwerk, gazon, groenafvoer, stormschade) en past prijzen, duur en teksten aan.",
        },
        {
          q: "Hoe zit het met btw en facturen?",
          a: "Facturen bevatten de wettelijk verplichte gegevens (KvK, btw-nummer, factuurnummer, btw per tarief). Het btw-tarief kies je per regel — 21%, 9% of 0% — omdat het tarief per klus kan verschillen, bijvoorbeeld bij de levering van planten.",
        },
        {
          q: "Zit er een looptijd of overage op de AI?",
          a: "Nee. Je betaalt een vast bedrag per maand, opzegbaar per maand, zonder kosten per gesprek of per minuut.",
        },
      ],
      ctaTitle: "Klaar om geen aanvraag of stormmelding meer te missen?",
      ctaBody: "Plan een gratis kennismaking — binnen 48 uur werkend, geen creditcard nodig.",
    },
  },
  nav: [
    { key: "overview" },
    { key: "jobs", label: "Klussen" },
    { key: "planner" },
    { key: "customers", label: "Klanten & tuinen" },
    { key: "billing" },
    { key: "maintenance", label: "Onderhoudscontracten" },
    { key: "ai", label: "AI-Receptie" },
    { key: "conversations" },
    { key: "escalations", label: "Storm & doorverbinden" },
    { key: "practice", label: "Diensten & team" },
    { key: "reports" },
    { key: "retention", label: "Reviews & terugkeer" },
    { key: "noshow", label: "Annulering & voorrijkosten" },
    { key: "integrations" },
    { key: "subscription" },
  ],
  onboarding: [
    { key: "services", label: "Diensten en tarieven (start met de voorbeeldcatalogus)" },
    { key: "business" },
    { key: "team", label: "Hoveniers en ploegen toegevoegd" },
    { key: "whatsapp" },
    { key: "phone" },
    { key: "firstJob", label: "Eerste tuinklus aangemaakt" },
  ],
  jobCategories: [
    {
      key: "onderhoud",
      label: "Tuinonderhoud",
      urgent: false,
      estimatedMinutes: 120,
      keywords: ["onderhoud", "tuinonderhoud", "tuinman", "wieden", "onkruid", "bijhouden", "tuin bijhouden", "seizoensonderhoud"],
      checklist: [
        "Tuin doorgelopen met klant of vorige notities",
        "Onkruid verwijderd en borders bijgewerkt",
        "Gras gemaaid en randen afgestoken",
        "Groenafval opgeruimd/afgevoerd",
        "Foto's voor/na gemaakt",
      ],
    },
    {
      key: "aanleg",
      label: "Tuinaanleg / herinrichting",
      urgent: false,
      estimatedMinutes: 960,
      keywords: ["tuinaanleg", "nieuwe tuin", "herinrichten", "tuinontwerp", "borders", "beplanting", "aanleggen", "tuin renoveren"],
      checklist: [
        "Opname en maatvoering gedaan",
        "KLIC-melding gedaan bij graafwerk",
        "Grondwerk en ondergrond klaargemaakt",
        "Beplanting en materialen aangebracht",
        "Groenafval en overtollige grond afgevoerd",
        "Oplevering met klant, verzorgingstips meegegeven",
      ],
    },
    {
      key: "bestrating",
      label: "Bestrating / terras",
      urgent: false,
      estimatedMinutes: 720,
      keywords: ["bestrating", "terras", "tegels", "klinkers", "oprit", "pad", "opnieuw bestraten", "verzakt"],
      checklist: [
        "Opname en maatvoering gedaan",
        "KLIC-melding gedaan bij graafwerk",
        "Uitgegraven en fundering/zandbed aangebracht",
        "Bestrating gelegd en afgewerkt",
        "Voegen en trilwerk gedaan",
        "Oplevering met klant",
      ],
    },
    {
      key: "snoeien",
      label: "Snoeien / haag",
      urgent: false,
      estimatedMinutes: 180,
      keywords: ["snoeien", "haag", "hagen", "heester", "coniferen", "bijsnoeien"],
      checklist: [
        "Te snoeien beplanting doorgelopen met klant",
        "Gesnoeid en in vorm gebracht",
        "Snoeiafval opgeruimd/afgevoerd",
        "Foto's voor/na gemaakt",
      ],
    },
    {
      key: "bomen",
      label: "Boomverzorging / kappen",
      urgent: false,
      estimatedMinutes: 300,
      keywords: ["boom", "bomen", "kappen", "rooien", "boom snoeien", "boomverzorging", "stobbe", "stronk"],
      checklist: [
        "Boom en omgeving beoordeeld (hoogte, obstakels, kabels)",
        "Vergunningsplicht kap/snoei met klant besproken",
        "Werkzone afgezet en veiligheid geborgd",
        "Werk uitgevoerd",
        "Hout/snoeiafval afgevoerd of gestapeld",
        "Oplevering met klant",
      ],
    },
    {
      key: "gazon",
      label: "Gazon / grasmat",
      urgent: false,
      estimatedMinutes: 240,
      keywords: ["gazon", "gras", "grasmat", "verticuteren", "doorzaaien", "graszoden", "mos", "kaal gras"],
      checklist: [
        "Toestand gazon beoordeeld (mos, kale plekken, drainage)",
        "Gazon verticuteerd/bewerkt",
        "Doorgezaaid of zoden gelegd",
        "Bemest en klant instructies gegeven (water geven, niet betreden)",
      ],
    },
    {
      key: "storm",
      label: "Stormschade",
      urgent: true,
      estimatedMinutes: 120,
      keywords: ["storm", "omgevallen boom", "afgebroken tak", "tak op dak", "boom op de weg", "hek omgewaaid", "stormschade", "boom gevallen"],
      checklist: [
        "Veiligheid ter plaatse beoordeeld (kabels, omgeving afgezet)",
        "Schade en risico's vastgelegd met foto's",
        "Gevaarlijke delen verwijderd of veiliggesteld",
        "Puin en snoeiafval opgeruimd of afspraak gemaakt voor afvoer",
        "Klant geïnformeerd over vervolgwerk en schademelding bij verzekering",
      ],
    },
    {
      key: "overig",
      label: "Overig",
      urgent: false,
      estimatedMinutes: 120,
      keywords: [],
      checklist: ["Werkzaamheden uitgevoerd", "Opgeruimd en opgeleverd"],
    },
  ],
  assetKinds: [
    { key: "tuin", label: "Tuin (algemeen)", icon: "yard", serviceIntervalMonths: null },
    { key: "gazon", label: "Gazon", icon: "grass", serviceIntervalMonths: null },
    { key: "haag", label: "Haag / heesters", icon: "forest", serviceIntervalMonths: 6 },
    { key: "boom", label: "Boom", icon: "park", serviceIntervalMonths: 36 },
    { key: "vijver", label: "Vijver", icon: "water", serviceIntervalMonths: 12 },
    { key: "beregening", label: "Beregeningssysteem", icon: "water_drop", serviceIntervalMonths: 12 },
    { key: "bestrating", label: "Bestrating / terras", icon: "grid_view", serviceIntervalMonths: null },
    { key: "tuinverlichting", label: "Tuinverlichting", icon: "lightbulb", serviceIntervalMonths: null },
    { key: "overig", label: "Overig", icon: "build", serviceIntervalMonths: null },
  ],
  // Voorbeeldprijzen — de eigenaar past ze aan; bedoeld als startpunt.
  serviceTemplates: [
    { name: "Voorrijkosten", category: "overig", durationMinutes: 0, priceCents: 2500, vatRatePercent: 21, description: "Voorrijkosten per bezoek." },
    { name: "Hovenier per uur", category: "overig", durationMinutes: 60, priceCents: 5500, vatRatePercent: 21, description: "Uurtarief hovenier (excl. materiaal en groenafvoer)." },
    { name: "Tuinonderhoud per beurt (2 uur)", category: "onderhoud", durationMinutes: 120, priceCents: 11000, vatRatePercent: 21, description: "Onkruid, borders, gras en randen bijhouden." },
    { name: "Snoeiwerk per beurt (2 uur)", category: "snoeien", durationMinutes: 120, priceCents: 11000, vatRatePercent: 21, description: "Haag en heesters snoeien in vorm." },
    { name: "Gazon verticuteren en doorzaaien", category: "gazon", durationMinutes: 180, priceCents: 14500, vatRatePercent: 21, description: "Mos verwijderen, gazon beluchten en doorzaaien (excl. graszaad/mest)." },
    { name: "Groenafvoer per aanhanger", category: "onderhoud", durationMinutes: 30, priceCents: 4500, vatRatePercent: 21, description: "Afvoeren van groenafval per aanhangerlading." },
    { name: "Stormschade — spoedtarief per uur", category: "storm", durationMinutes: 60, priceCents: 8500, vatRatePercent: 21, description: "Spoedklus na storm, ook buiten kantoortijd." },
  ],
  messages: {
    reminder: ({ salonName, serviceType, date, time }) =>
      `Hoi! Een herinnering van ${salonName}: we komen ${date} rond ${time} bij je langs voor ${serviceType}. ` +
      `Past het niet meer of is de tuin onbereikbaar? Laat het ons tijdig weten via WhatsApp. Tot dan! 🌿`,
    review: ({ salonName, reviewLink }) =>
      `Hoi! Bedankt dat we in je tuin aan de slag mochten. Was je tevreden over ${salonName}? Een review helpt ons enorm: ${reviewLink}`,
    retention: ({ salonName, firstName }) =>
      `Hoi ${firstName}! ${salonName} hier. Is de tuin klaar voor het nieuwe seizoen? Stuur gerust een berichtje als er iets gedaan moet worden 🌱`,
    maintenanceDue: ({ salonName, firstName, assetLabel, dueDate }) =>
      `Hoi ${firstName}! ${salonName} hier: het onderhoud aan je ${assetLabel} staat gepland voor ${dueDate}. Zullen we een dag en tijd afspreken? Stuur ons gerust een berichtje.`,
    greetingFallback: "vakman",
  },
  content: {
    audience: "eigenaren van hoveniersbedrijven en groenbedrijven",
    blogSystemPrompt: `Je bent een Nederlandse SEO-contentspecialist voor hoveniers en groenbedrijven.
Schrijf praktische, autoritaire en nuchtere blogartikelen (B2B, voor eigenaren van hoveniersbedrijven).
Gebruik Markdown met ## en ### tussenkoppen, korte alinea's en bullets.
Vermijd overdrijving en holle marketingtaal. Schrijf in het Nederlands.
Noem alleen feiten waar je zeker van bent; verzin geen wetten, tarieven of vergunningsregels.`,
    blogTopicPlaceholder: "bijv. Stormschade snel afhandelen als hovenier",
    blogKeywordPlaceholder: "hovenier software, offerte hovenier, planning hovenier",
    blogSuggestions: [
      "Stormschade snel afhandelen: zo mis je geen spoedopdracht",
      "Offertes voor tuinaanleg sneller versturen",
      "Terugkerende omzet met tuinonderhoudscontracten",
      "Planning van meerdere ploegen op één bord",
    ],
    blogMetaTitle: "Blog — Tips voor hoveniers",
    blogMetaDescription: "Praktische tips over offertes, planning en tuinonderhoudscontracten voor hoveniers.",
    blogHeading: "Tips voor hoveniers",
    blogSubheading: "Praktische inzichten over offertes, planning en terugkerende omzet.",
    postCta: {
      title: "Meer tijd in de tuin?",
      body: "Ontdek wat HovenierAssistent voor jouw bedrijf kan betekenen.",
      href: "/contact",
      label: "Plan een gratis kennismaking",
    },
    kennisbankCategories: {
      Spoed: "Storm & spoed",
      Offertes: "Offertes & facturen",
      Planning: "Planning & werkbonnen",
      Onderhoud: "Onderhoud & contracten",
      Vakkennis: "Vakkennis",
      Marketing: "Gevonden worden",
    },
    kennisbankHeading: "Kennisbank voor hoveniers",
    kennisbankTitle: "Kennisbank — Praktijktips voor hoveniers",
    kennisbankDescription:
      "Gratis kennisbank-artikelen over stormschade, offertes en werkbonnen, onderhoudscontracten en het runnen van een hoveniersbedrijf.",
    kennisbankIntro:
      "Praktijktips voor hoveniers: van stormschade en offertes tot onderhoudscontracten en planning.",
  },
};
