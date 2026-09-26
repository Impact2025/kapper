import type { VerticalPack } from "./types";

/**
 * Kozijnen — derde job-vertical voor kozijnleveranciers en montagebedrijven:
 * een project in plaats van een klus (opname → offerte → bestelling → montage),
 * dus offertes zijn het hart en de AI kwalificeert vooral aanvragen.
 *
 * `live: false`: de pack bestaat voor validatie in de app; in dev is de site
 * bereikbaar op /sites/kozijn en kun je inloggen via `?vertical=kozijn`.
 * Pas op `live: true` zetten als kozijnassistent.nl op Vercel/Resend hangt.
 *
 * Alles in de landing- en prijs-copy hieronder bestaat nu echt (klus-CRM,
 * planbord, werkbon, offerte/factuur, object per adres, contracten, foto's).
 * Positielijst-offertes (B×H, profiel, glas), offerte-varianten, orderfase
 * (besteld → geleverd) en termijnfacturatie zijn gepland en worden pas
 * gecommuniceerd als ze gebouwd zijn — zie de kwartaal-check op claims vs. code.
 */
export const KOZIJN_VERTICAL: VerticalPack = {
  id: "kozijn",
  label: "Kozijnen",
  archetype: "job",
  live: false,
  // Kozijnen leveren én plaatsen is een 21%-dienst/levering. Het verlaagde
  // tarief van 9% kan gelden voor isolerende maatregelen (o.a. isolatieglas)
  // bij woningen ouder dan 2 jaar, maar alleen onder voorwaarden — nooit een
  // blanket default. De eigenaar kiest het tarief per regel; verifieer het
  // actuele tarief bij de Belastingdienst.
  vatRates: { treatment: 21, product: 21 },
  terms: {
    practitioner: "monteur",
    practitionerPlural: "monteurs",
    treatment: "project",
    treatmentPlural: "projecten",
    establishment: "bedrijf",
    owner: "vakman",
    appointment: "afspraak",
    asset: { singular: "kozijn", plural: "kozijnen", passport: "kozijnpaspoort" },
  },
  // Kozijnen worden per stuk/set geoffreerd, glas en afwerking per m² of m.
  lineUnits: ["stuk", "set", "m", "m²", "uur", "post"],
  hasHealthDataGuard: false,
  brand: {
    name: "KozijnAssistent",
    domain: "kozijnassistent.nl",
    siteUrl: "https://www.kozijnassistent.nl",
    supportEmail: "support@kozijnassistent.nl",
    tagline: "Van kozijnaanvraag tot opgeleverd project",
    description:
      "Het klus-CRM met AI-receptionist voor kozijnbedrijven: telefoon en WhatsApp 24/7, aanvragen gekwalificeerd, opname ingepland, offerte en factuur in één plek.",
    hosts: ["kozijnassistent.nl", "www.kozijnassistent.nl"],
    dashboardTitle: "Mijn KozijnAssistent",
  },
  // Staalblauw met koel steengrijs: glas, aluminium en gevel. Wit op primary ≥ 6:1.
  theme: {
    primary: "#2c5a7a",
    onPrimary: "#ffffff",
    primaryContainer: "#8bb4d1",
    onPrimaryContainer: "#0b2438",
    primaryFixed: "#cfe5f6",
    primaryFixedDim: "#b1cadf",
    onPrimaryFixed: "#061d2e",
    onPrimaryFixedVariant: "#1c4562",
    inversePrimary: "#b1cadf",
    surface: "#f2f4f6",
    surfaceContainerLow: "#e9edf0",
    surfaceContainer: "#dfe4e9",
  },
  features: {
    jobs: true,
    quotes: true,
    assets: true,
    contracts: true,
    seasonalContracts: false,
    photoTimeline: true,
    treatmentCards: false,
    healthRecords: false,
    webshop: false,
    doubleBooking: false,
    loyalty: false,
  },
  pricing: {
    essential: {
      name: "Essential Assistent",
      tagline: "Voor zelfstandige kozijnmonteurs.",
      audience: "Zelfstandig",
      valueLine: "Terugverdiend met 1 extra opname per maand.",
      features: [
        "AI neemt telefoon én WhatsApp op, 24/7 — ook als je op de steiger of in een woning staat",
        "Legt adres, aantal kozijnen, materiaal en foto's direct vast als project in je CRM",
        "Klanten met meerdere adressen en een volledige projecthistorie",
        "Planbord per monteur: opnames en montages, spoed bovenaan",
        "Foto's voor/na en een checklist per project op je telefoon",
        "Automatische afspraakherinneringen en review-verzoeken",
      ],
    },
    pro: {
      name: "Pro Assistent",
      tagline: "Voor kozijnbedrijven met meerdere montageploegen.",
      audience: "Meerdere ploegen",
      valueLine: "Sneller offreren, sneller betaald.",
      features: [
        "Alles uit Essential",
        "Offertes die de klant online accepteert; facturen met IBAN en automatische betalingsherinneringen",
        "Kozijnpaspoort per adres: kozijnen, deuren en schuifpuien met merk, type en garantie",
        "Onderhoudscontracten: het nazorgbezoek en de klantherinnering ontstaan vanzelf",
        "Aanbetaling bij inplannen — minder afzeggingen op het laatste moment",
        "Kan een gesprek direct doorzetten naar de monteur van dienst",
        "WhatsApp-berichtkosten zitten al in de prijs, geen aparte factuur",
      ],
    },
    elite: {
      name: "Elite Cockpit",
      tagline: "Voor grotere kozijnbedrijven en leveranciers.",
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
        "een acuut probleem (inbraakschade, een kapot of ingeslagen raam of een kozijn of deur die niet meer dicht of op slot kan, of een kozijn dat na storm loskomt of openwaait) behandel je als spoed. Geef eerst korte veiligheidstips: blijf uit de buurt van gebroken glas, zet de ruimte af en probeer zelf geen losgekomen kozijn of glas te verplaatsen. Bij inbraak of gevaar voor personen: 112. Leg daarna direct de klus vast en laat een monteur van dienst tijdelijk dichtzetten.",
      hazardExamples: "gebroken glas met gevaar voor personen, een losgekomen kozijn na storm of een woning die niet meer af te sluiten is",
      quoteExamples: "nieuwe kunststof kozijnen, HR++- of triple glas of een schuifpui",
      photoRule:
        "gebruik die om in te schatten welke {treatment} het is (aantal kozijnen, materiaal, type glas, dubbele deuren of een schuifpui) en welke opname nodig is, en noem dat kort in je antwoord. Vraag zo nodig om een foto van de hele gevel en van het kozijn van binnen. Geef nooit een vaste prijs: een kozijnprijs hangt af van maat, profiel, glas en afwerking en volgt pas na de opname. Bij een woning die niet meer af te sluiten of glas met gevaar altijd escalate_to_staff gebruiken. De foto wordt automatisch bij het project gevoegd.",
      scene: "op een steiger of in een woning aan het monteren",
      urgencyHint: "spoed = acuut (inbraakschade, ingeslagen glas, kozijn of deur dat niet meer sluit); anders normaal",
      photoSubjects: "een gevel, kozijn, raam, deur of glasschade",
    },
  },
  integrations: ["whatsapp", "phone", "moneybird", "eboekhouden", "exact_online", "google_calendar"],
  jobTitleExample: "Kunststof kozijnen voor- en achtergevel",
  jobFields: [
    {
      key: "aantalKozijnen",
      label: "Aantal kozijnen/ramen",
      type: "number",
      unit: "stuks",
      placeholder: "8",
      categories: ["vervanging", "nieuwbouw", "deuren", "glas"],
    },
    {
      key: "materiaal",
      label: "Materiaal",
      type: "select",
      options: ["Onbekend", "Kunststof", "Aluminium", "Hout", "Hout-aluminium"],
      hint: "Bepaalt levertijd, prijs en onderhoud — bespreek het bij de opname.",
      categories: ["vervanging", "nieuwbouw", "deuren"],
    },
    {
      key: "beglazing",
      label: "Gewenst glas",
      type: "select",
      options: ["Onbekend", "HR++", "Triple", "Veiligheidsglas", "Geluidswerend", "Blijft zoals het is"],
      categories: ["vervanging", "nieuwbouw", "deuren", "glas"],
    },
    {
      key: "bouwjaar",
      label: "Bouwjaar woning",
      type: "number",
      placeholder: "1975",
      hint: "Bepaalt onder meer of een verlaagd btw-tarief of subsidie in aanmerking komt — controleer de actuele regels.",
    },
    {
      key: "beschermd",
      label: "Monument of beschermd stadsgezicht?",
      type: "select",
      options: ["Onbekend", "Ja", "Nee"],
      hint: "Kan een omgevingsvergunning of welstandseisen betekenen voor profiel en kleur.",
      categories: ["vervanging", "nieuwbouw", "deuren"],
    },
    {
      key: "vve",
      label: "Appartement met VvE?",
      type: "select",
      options: ["Onbekend", "Ja", "Nee"],
      hint: "Bij een VvE moet vaak toestemming worden gevraagd voor gevelwijzigingen.",
      categories: ["vervanging", "deuren", "glas"],
    },
    {
      key: "verdieping",
      label: "Hoogste verdieping / steiger nodig",
      type: "select",
      options: ["Onbekend", "Begane grond", "1e verdieping", "2e verdieping of hoger"],
      hint: "Bepaalt materieel, veiligheid en montagetijd.",
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
      "Het klus-CRM met AI-receptionist voor kozijnbedrijven: elke aanvraag opgevangen, van opname tot betaalde factuur op één plek.",
    logoIcon: "window",
    landing: {
      badge: "Voor kozijnbedrijven en leveranciers",
      headline: "Geen kozijnaanvraag meer missen, ook niet op de steiger.",
      sub: "Terwijl jij monteert, neemt KozijnAssistent 24/7 de telefoon en WhatsApp op, kwalificeert de aanvraag en zet een opname klaar in je klus-CRM.",
      chat: {
        title: "WhatsApp — KozijnAssistent",
        messages: [
          { from: "customer", text: "Hoi, ik wil de kozijnen aan de voorkant van mijn woning vervangen door kunststof met triple glas. Kunnen jullie langskomen om te meten?" },
          {
            from: "ai",
            text: "Graag! Hoeveel kozijnen en ramen gaat het ongeveer om, en in welk jaar is de woning gebouwd? Stuur ook een foto van de voorgevel, dan leg ik het vast en plan ik een opname in.",
          },
        ],
      },
      stats: [
        { icon: "call", value: "Nooit gemist", label: "Ook als je op een steiger staat." },
        { icon: "straighten", value: "Aanvraag gekwalificeerd", label: "Aantal, materiaal en foto's bij het project." },
        { icon: "receipt_long", value: "Van aanvraag tot factuur", label: "Alles in één systeem." },
      ],
      steps: [
        {
          title: "Jij stelt je bedrijf in",
          body: "Diensten, tarieven, monteurs en wat als spoed geldt. We geven je een startcatalogus mee; jij past hem aan.",
        },
        {
          title: "De AI kwalificeert de aanvragen",
          body: "Telefoon en WhatsApp: naam, adres, wat er vervangen moet worden en of het dringend is. Foto's van de gevel komen bij het project.",
        },
        {
          title: "Jij meet, offreert en plant",
          body: "Plan de opname op het planbord, maak een offerte of werkbon, laat de klant online accepteren en stuur de factuur.",
        },
      ],
      features: [
        { icon: "smart_toy", title: "AI-receptionist 24/7", body: "Neemt telefoon en WhatsApp op, herkent vervanging, glas of deurwerk en legt het adres vast. Bij twijfel of gevaar verbindt hij door." },
        { icon: "emergency", title: "Inbraak- en glasschade", body: "Ingeslagen glas of een kozijn dat niet meer sluit: de AI geeft veiligheidstips, markeert het project als spoed en waarschuwt jou direct." },
        { icon: "group", title: "Klant-CRM met adressen", body: "Klanten met meerdere adressen, toegangsinfo, contactpersoon ter plaatse en de volledige projecthistorie." },
        { icon: "calendar_view_week", title: "Planbord per ploeg", body: "Opnames en montages per monteur. Spoed bovenaan, overlappende afspraken worden gemarkeerd." },
        { icon: "checklist", title: "Werkbon op je telefoon", body: "Checklist per soort project, foto's voor en na, werkverslag en opleverhandtekening." },
        { icon: "request_quote", title: "Offertes en facturen", body: "Offerte online accepteren, één klik naar factuur, IBAN op de factuur en automatische betalingsherinneringen." },
        { icon: "window", title: "Kozijnpaspoort", body: "Kozijnen, deuren en schuifpuien per adres, met merk, type en garantie op één plek." },
        { icon: "event_repeat", title: "Nazorg en onderhoud", body: "Het afstel- of nazorgbezoek ontstaat vanzelf als project en de klant krijgt automatisch bericht." },
      ],
      faq: [
        {
          q: "Werkt dit ook zonder planningssoftware?",
          a: "Ja. Projecten, planning, offertes en facturen zitten in KozijnAssistent zelf — je hoeft niets te koppelen om te starten.",
        },
        {
          q: "Geeft de AI klanten een prijs?",
          a: "Nee. Een kozijnprijs hangt af van maat, profiel, glas en afwerking en volgt pas na de opname. De AI verzamelt de gegevens en plant de opname in.",
        },
        {
          q: "Wat gebeurt er bij inbraakschade of een ingeslagen raam?",
          a: "De AI geeft eerst veiligheidstips, legt het project vast als spoed en waarschuwt jou direct per mail en WhatsApp. Bij inbraak of gevaar voor personen verwijst hij naar 112.",
        },
        {
          q: "Kan ik mijn eigen tarieven en soorten projecten instellen?",
          a: "Ja. Je begint met een voorbeeldcatalogus (opname, montage per kozijn, glasvervanging, afwerking, nazorg) en past prijzen, duur en teksten aan.",
        },
        {
          q: "Hoe zit het met btw en facturen?",
          a: "Facturen bevatten de wettelijk verplichte gegevens (KvK, btw-nummer, factuurnummer, btw per tarief). Het btw-tarief kies je per regel — 21%, 9% of 0% — omdat het tarief per project kan verschillen, bijvoorbeeld bij isolerende maatregelen aan een woning.",
        },
        {
          q: "Zit er een looptijd of overage op de AI?",
          a: "Nee. Je betaalt een vast bedrag per maand, opzegbaar per maand, zonder kosten per gesprek of per minuut.",
        },
      ],
      ctaTitle: "Klaar om geen kozijnaanvraag meer te missen?",
      ctaBody: "Plan een gratis kennismaking — binnen 48 uur werkend, geen creditcard nodig.",
    },
  },
  nav: [
    { key: "overview" },
    { key: "jobs", label: "Projecten" },
    { key: "planner" },
    { key: "customers", label: "Klanten & adressen" },
    { key: "billing" },
    { key: "maintenance", label: "Nazorg & onderhoud" },
    { key: "ai" },
    { key: "conversations" },
    { key: "escalations", label: "Spoed & doorverbinden" },
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
    { key: "team", label: "Monteurs en ploegen toegevoegd" },
    { key: "whatsapp" },
    { key: "phone" },
    { key: "firstJob", label: "Eerste project aangemaakt" },
  ],
  jobCategories: [
    {
      key: "vervanging",
      label: "Kozijnen vervangen",
      urgent: false,
      estimatedMinutes: 480,
      keywords: ["kozijn", "kozijnen", "vervangen", "kunststof kozijnen", "aluminium kozijnen", "houten kozijnen", "renovatie", "ramen vervangen"],
      checklist: [
        "Opname en maatvoering gedaan, maten dubbel gecontroleerd",
        "Profiel, kleur, glas en draairichting met klant vastgelegd",
        "Oude kozijnen gedemonteerd en afgevoerd",
        "Nieuwe kozijnen waterpas geplaatst en gevuld/gekit",
        "Hang- en sluitwerk afgesteld, ventilatieroosters gecontroleerd",
        "Afwerking (aftimmering/stucwerk) en opruimen gedaan",
        "Oplevering met klant, onderhoudstips en garantie meegegeven",
      ],
    },
    {
      key: "nieuwbouw",
      label: "Nieuwbouw / verbouwing",
      urgent: false,
      estimatedMinutes: 600,
      keywords: ["nieuwbouw", "verbouwing", "uitbouw", "aanbouw", "dakkapel", "gevelkozijn", "projectmatig"],
      checklist: [
        "Tekeningen en maatvoering gecontroleerd met aannemer of klant",
        "Bouwkundige aansluitingen en levertijd afgestemd",
        "Kozijnen geplaatst en gestel- of ankerpunten gecontroleerd",
        "Waterdicht aangesloten (folie/kit) en glas geplaatst",
        "Oplevering met aannemer of klant",
      ],
    },
    {
      key: "deuren",
      label: "Deuren en schuifpuien",
      urgent: false,
      estimatedMinutes: 360,
      keywords: ["voordeur", "achterdeur", "schuifpui", "vouwwand", "openslaande deuren", "tuindeuren", "deur vervangen"],
      checklist: [
        "Opname gedaan (dagmaat, dorpel, draairichting)",
        "Veiligheid en inbraakwering (o.a. slot en scharnieren) met klant besproken",
        "Oude deur of pui verwijderd",
        "Nieuwe deur of pui geplaatst en afgesteld",
        "Sluiting, dorpel en aftimmering gecontroleerd",
        "Oplevering met klant, sleutels overhandigd",
      ],
    },
    {
      key: "glas",
      label: "Glas / isolatieglas",
      urgent: false,
      estimatedMinutes: 180,
      keywords: ["glas", "isolatieglas", "dubbel glas", "hr++", "triple glas", "condens", "beslagen glas", "glasvervanging"],
      checklist: [
        "Type en maat glas gecontroleerd (opname van bestaand glas)",
        "Oud glas verwijderd, glaslatten en kit gecontroleerd",
        "Nieuw glas geplaatst en afgekit",
        "Opruimen en oplevering met klant",
      ],
    },
    {
      key: "zonwering",
      label: "Rolluiken en zonwering",
      urgent: false,
      estimatedMinutes: 240,
      keywords: ["rolluik", "rolluiken", "zonwering", "screens", "zonneschermen", "jaloezie", "luiken"],
      checklist: [
        "Opname en positie kast/geleiders gedaan",
        "Rolluik of zonwering gemonteerd en bedrading/aansturing aangesloten",
        "Werking en eindstanden getest",
        "Oplevering met klant, bediening uitgelegd",
      ],
    },
    {
      key: "herstel",
      label: "Herstel en nazorg",
      urgent: false,
      estimatedMinutes: 120,
      keywords: ["herstel", "nazorg", "klemt", "sluit niet", "tocht", "lekt", "afstellen", "garantie", "klacht"],
      checklist: [
        "Klacht of storing met klant doorgenomen en vastgelegd met foto's",
        "Hang- en sluitwerk afgesteld of onderdeel vervangen",
        "Aansluiting/kitwerk gecontroleerd",
        "Controle of de klacht is verholpen, klant akkoord",
      ],
    },
    {
      key: "storm",
      label: "Spoed: inbraak- of glasschade",
      urgent: true,
      estimatedMinutes: 120,
      keywords: ["inbraak", "ingeslagen", "glas kapot", "raam kapot", "kozijn waait open", "deur sluit niet", "stormschade", "spoed", "glasschade"],
      checklist: [
        "Veiligheid ter plaatse beoordeeld (glas, scherven, toegang)",
        "Schade en risico's vastgelegd met foto's",
        "Opening tijdelijk dichtgezet of veiliggesteld",
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
    { key: "kozijn", label: "Kozijn / raam", icon: "window", serviceIntervalMonths: 24 },
    { key: "buitendeur", label: "Buitendeur", icon: "door_front", serviceIntervalMonths: 24 },
    { key: "schuifpui", label: "Schuifpui / vouwwand", icon: "door_sliding", serviceIntervalMonths: 12 },
    { key: "dakraam", label: "Dakraam", icon: "roofing", serviceIntervalMonths: 36 },
    { key: "rolluik", label: "Rolluik / zonwering", icon: "blinds", serviceIntervalMonths: 24 },
    { key: "hangsluitwerk", label: "Hang- en sluitwerk", icon: "lock", serviceIntervalMonths: 24 },
    { key: "overig", label: "Overig", icon: "build", serviceIntervalMonths: null },
  ],
  // Voorbeeldprijzen — de eigenaar past ze aan; bedoeld als startpunt.
  serviceTemplates: [
    { name: "Voorrijkosten", category: "overig", durationMinutes: 0, priceCents: 2500, vatRatePercent: 21, description: "Voorrijkosten per bezoek." },
    { name: "Opname en advies aan huis", category: "vervanging", durationMinutes: 60, priceCents: 6500, vatRatePercent: 21, description: "Opname, maatvoering en advies; te verrekenen bij opdracht." },
    { name: "Monteur per uur", category: "overig", durationMinutes: 60, priceCents: 6500, vatRatePercent: 21, description: "Uurtarief monteur (excl. materiaal en afvoer)." },
    { name: "Kozijn plaatsen per stuk", category: "vervanging", durationMinutes: 120, priceCents: 15000, vatRatePercent: 21, description: "Demontage oud kozijn, plaatsen en afstellen nieuw kozijn (excl. kozijn en glas)." },
    { name: "Glas vervangen per m²", category: "glas", durationMinutes: 60, priceCents: 9000, vatRatePercent: 21, description: "Plaatsen van glas per m² (excl. glas)." },
    { name: "Aftimmeren en afwerken per kozijn", category: "vervanging", durationMinutes: 45, priceCents: 4500, vatRatePercent: 21, description: "Afwerking binnen en buiten na plaatsing." },
    { name: "Nazorgbezoek afstellen", category: "herstel", durationMinutes: 60, priceCents: 7500, vatRatePercent: 21, description: "Afstellen van hang- en sluitwerk en controle kitwerk." },
    { name: "Spoedtarief inbraak- of glasschade", category: "storm", durationMinutes: 60, priceCents: 9500, vatRatePercent: 21, description: "Spoedklus, ook buiten kantoortijd, om de woning weer dicht te zetten." },
  ],
  messages: {
    reminder: ({ salonName, serviceType, date, time }) =>
      `Hoi! Een herinnering van ${salonName}: we komen ${date} rond ${time} bij je langs voor ${serviceType}. ` +
      `Kunnen we er niet bij of past het niet meer? Laat het ons tijdig weten via WhatsApp. Tot dan!`,
    review: ({ salonName, reviewLink }) =>
      `Hoi! Bedankt dat wij je kozijnen mochten plaatsen. Was je tevreden over ${salonName}? Een review helpt ons enorm: ${reviewLink}`,
    retention: ({ salonName, firstName }) =>
      `Hoi ${firstName}! ${salonName} hier. Werken alle ramen en deuren nog goed? Stuur gerust een berichtje als er iets afgesteld of vervangen moet worden.`,
    maintenanceDue: ({ salonName, firstName, assetLabel, dueDate }) =>
      `Hoi ${firstName}! ${salonName} hier: het onderhoud aan je ${assetLabel} staat gepland voor ${dueDate}. Zullen we een dag en tijd afspreken? Stuur ons gerust een berichtje.`,
    greetingFallback: "vakman",
  },
  content: {
    audience: "eigenaren van kozijnbedrijven en kozijnleveranciers",
    blogSystemPrompt: `Je bent een Nederlandse SEO-contentspecialist voor kozijnbedrijven en kozijnleveranciers.
Schrijf praktische, autoritaire en nuchtere blogartikelen (B2B, voor eigenaren van kozijnbedrijven).
Gebruik Markdown met ## en ### tussenkoppen, korte alinea's en bullets.
Vermijd overdrijving en holle marketingtaal. Schrijf in het Nederlands.
Noem alleen feiten waar je zeker van bent; verzin geen wetten, tarieven, subsidiebedragen of vergunningsregels.`,
    blogTopicPlaceholder: "bijv. Kozijnofferte sneller versturen na de opname",
    blogKeywordPlaceholder: "software kozijnbedrijf, offerte kozijnen, planning kozijnmonteur",
    blogSuggestions: [
      "Van aanvraag naar opname: zo kwalificeer je kozijnaanvragen sneller",
      "Kozijnofferte sneller versturen na de opname",
      "Levertijden aan klanten uitleggen zonder gedoe",
      "Nazorg en garantie bij kozijnen goed vastleggen",
    ],
    blogMetaTitle: "Blog — Tips voor kozijnbedrijven",
    blogMetaDescription: "Praktische tips over offertes, opnames, planning en nazorg voor kozijnbedrijven.",
    blogHeading: "Tips voor kozijnbedrijven",
    blogSubheading: "Praktische inzichten over aanvragen, offertes, planning en nazorg.",
    postCta: {
      title: "Geen kozijnaanvraag meer missen?",
      body: "Ontdek wat KozijnAssistent voor jouw bedrijf kan betekenen.",
      href: "/contact",
      label: "Plan een gratis kennismaking",
    },
    kennisbankCategories: {
      Spoed: "Inbraak- & glasschade",
      Offertes: "Offertes & facturen",
      Planning: "Opname & planning",
      Onderhoud: "Nazorg & garantie",
      Vakkennis: "Vakkennis",
      Marketing: "Gevonden worden",
    },
    kennisbankHeading: "Kennisbank voor kozijnbedrijven",
    kennisbankTitle: "Kennisbank — Praktijktips voor kozijnbedrijven",
    kennisbankDescription:
      "Gratis kennisbank-artikelen over aanvragen kwalificeren, opname en offerte, planning van montage en nazorg voor kozijnbedrijven.",
    kennisbankIntro:
      "Praktijktips voor kozijnbedrijven: van aanvraag en opname tot offerte, montage en nazorg.",
  },
};
