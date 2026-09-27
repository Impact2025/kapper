import type { VerticalPack } from "./types";

/**
 * Schilder — derde job-vertical met een eigen gezicht: inktblauw thema, eigen
 * veiligheidsregels (lood- en asbestverdenking, hoogte, waterschade), eigen
 * projectvelden (oppervlak, ondergrond, kleur/RAL, verfsysteem, bouwjaar),
 * offerte-eenheden (m², kamer, rol), onderhoudspaspoort per object en prijs-copy.
 *
 * `live: false` tot schildersassistent.nl op Vercel/Resend is aangesloten:
 * zolang het pack niet live is claimt het geen host (proxy.ts), en is de site
 * alleen bereikbaar via /sites/schilder in dev. Zet `live: true` om te
 * lanceren.
 *
 * Alles in de landing- en prijs-copy hieronder is functionaliteit die nu echt
 * bestaat (klus-CRM, planbord, werkbon, offerte/factuur, objecten per adres,
 * onderhoudscontracten met vast interval, fotodossier voor/na). Weerkoppeling
 * en kleurkaart-/verfverbruiksberekening zijn gepland en worden pas
 * gecommuniceerd als ze gebouwd zijn — zie de kwartaal-check op claims vs. code.
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
    asset: { singular: "object", plural: "objecten", passport: "onderhoudspaspoort" },
  },
  // Schilderwerk wordt per m², per kamer, per kozijn en per rol behang geoffreerd.
  lineUnits: ["uur", "dag", "stuk", "m", "m²", "kamer", "rol", "post"],
  hasHealthDataGuard: false,
  brand: {
    name: "SchildersAssistent",
    domain: "schildersassistent.nl",
    siteUrl: "https://www.schildersassistent.nl",
    supportEmail: "support@schildersassistent.nl",
    tagline: "Meer tijd op de steiger, minder achter de administratie",
    description:
      "Het klus-CRM met AI-receptionist voor schildersbedrijven: telefoon en WhatsApp 24/7, opname vastgelegd, planbord, offerte, onderhoudscycli en factuur in één plek.",
    hosts: ["schildersassistent.nl", "www.schildersassistent.nl"],
    dashboardTitle: "Mijn SchildersAssistent",
  },
  // Inktblauw; contrast getoetst (wit op primary ≥ 8:1). Koele, papierwitte
  // vlakken in plaats van de warme standaard: een schilder verkoopt strak werk.
  theme: {
    primary: "#2b4a7a",
    onPrimary: "#ffffff",
    primaryContainer: "#8fa9d4",
    onPrimaryContainer: "#0c1e3d",
    primaryFixed: "#d6e3ff",
    primaryFixedDim: "#b0c6f0",
    onPrimaryFixed: "#0a1b3a",
    onPrimaryFixedVariant: "#1d3760",
    inversePrimary: "#b0c6f0",
    surface: "#f6f8fc",
    surfaceContainerLow: "#edf0f7",
    surfaceContainer: "#e3e8f2",
  },
  features: {
    jobs: true,
    quotes: true,
    assets: true,
    contracts: true,
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
      tagline: "Voor zelfstandige schilders.",
      audience: "Zelfstandig",
      valueLine: "Terugverdiend met 1 extra project per maand.",
      features: [
        "AI neemt telefoon én WhatsApp op, 24/7 — ook als je met de kwast op een ladder staat",
        "Legt adres, soort werk, oppervlak en foto's direct vast als project in je CRM",
        "Klanten met meerdere adressen en een volledige projecthistorie",
        "Planbord per schilder: meerdaagse projecten en spoedherstel in één overzicht",
        "Foto's voor/na en een checklist per klus op je telefoon",
        "Automatische afspraakherinneringen en review-verzoeken",
      ],
    },
    pro: {
      name: "Pro Assistent",
      tagline: "Voor schildersbedrijven met meerdere ploegen.",
      audience: "Meerdere ploegen",
      valueLine: "Sneller offreren, sneller betaald.",
      features: [
        "Alles uit Essential",
        "Offertes die de klant online accepteert; facturen met IBAN en automatische betalingsherinneringen",
        "Onderhoudspaspoort per adres: gevel, kozijnen en dakrand met kleur, verfsysteem en het volgende schilderbeurt in beeld",
        "Onderhoudscycli: de klus en de klantherinnering ontstaan vanzelf",
        "Aanbetaling bij inplannen — minder afzeggingen op het laatste moment",
        "Kan een gesprek bij spoedherstel direct doorzetten naar de schilder van dienst",
        "WhatsApp-berichtkosten zitten al in de prijs, geen aparte factuur",
      ],
    },
    elite: {
      name: "Elite Cockpit",
      tagline: "Voor grotere schilders- en afwerkbedrijven.",
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
        "schilderwerk is zelden acuut; behandel alleen spoed als er schade of een harde deadline is: waterschade of een lekkage die door plafond of muur komt (dat stopt eerst de loodgieter, de schilder herstelt daarna), brand- of inbraakschade, loszittend hout, dakrand of ander materiaal aan de gevel dat naar beneden kan vallen, of een oplevering, verkoop of verhuur binnen enkele dagen. Geef eerst korte veiligheidstips: blijf uit de buurt van loszittende delen aan de gevel, klim niet zelf op een ladder of dak en zet bij lekkage water en stroom uit waar dat veilig kan. Bij gevaar voor personen: 112.",
      hazardExamples:
        "een vermoeden van asbest (plafondplaten, golfplaten, oude coating of latex van voor 1994), oude loodhoudende verf van voor de jaren zeventig die geschuurd of afgekrabd zou worden, of materiaal dat van de gevel dreigt te vallen",
      quoteExamples: "de buitenkant van de woning of alle kozijnen, een woonkamer sauzen of een trap lakken",
      photoRule:
        "gebruik die om in te schatten welke {treatment}, ondergrond en voorbereiding nodig zijn (schuren, houtrot herstellen, gronden), en noem dat kort in je antwoord. Vraag zo nodig om een tweede foto van het geheel en een close-up van loslatende verf of houtrot, en naar het aantal kozijnen of het oppervlak. Een foto is een eerste indicatie: nooit een vaste prijs noemen, de schilder komt eerst opmeten. Bij een vermoeden van asbest of loodhoudende verf altijd escalate_to_staff gebruiken en de klant vragen er niet aan te schuren, krabben of boren. De foto wordt automatisch bij de klus gevoegd.",
      scene: "op een steiger of in een woning aan het werk",
      urgencyHint: "spoed = schade of harde deadline (waterschade, brandschade, loszittend materiaal, oplevering binnen dagen); anders normaal",
      photoSubjects: "een gevel, kozijn, plafond, muur of houtrot",
    },
  },
  integrations: ["whatsapp", "phone", "moneybird", "eboekhouden", "exact_online", "google_calendar"],
  jobFields: [
    { key: "oppervlak", label: "Oppervlak", type: "number", unit: "m²", placeholder: "45", hint: "Te schilderen of te stucen oppervlak — bepaalt materiaal en dagen." },
    {
      key: "aantalKozijnen",
      label: "Aantal kozijnen",
      type: "number",
      placeholder: "12",
      categories: ["buiten", "kozijnen", "houtrot"],
    },
    { key: "kleur", label: "Kleur / RAL-code", type: "text", placeholder: "bv. RAL 9010" },
    { key: "aantalLagen", label: "Aantal lagen", type: "number", placeholder: "2" },
    {
      key: "ondergrond",
      label: "Ondergrond",
      type: "select",
      options: ["Muur (sauswerk)", "Stuc", "Hout", "Kunststof", "Metaal", "Behang", "Steen of beton", "Anders"],
    },
    { key: "verfMerk", label: "Verfmerk / systeem", type: "text", placeholder: "bv. Sikkens Rubbol" },
    {
      key: "bouwjaar",
      label: "Bouwjaar woning",
      type: "select",
      options: ["Onbekend", "Voor 1970", "1970 – 1994", "Na 1994"],
      hint: "Oude verf kan lood bevatten en oude coatings of platen asbest. Vermoed je dat, niet schuren of krabben: laat het eerst onderzoeken.",
    },
    {
      key: "woningOuderDan2Jaar",
      label: "Woning ouder dan 2 jaar?",
      type: "select",
      options: ["Onbekend", "Ja", "Nee"],
      hint: "Bepaalt of het verlaagde btw-tarief op arbeid mogelijk is — controleer het actuele tarief bij de Belastingdienst.",
    },
    {
      key: "steigerNodig",
      label: "Steiger of hoogwerker nodig?",
      type: "select",
      options: ["Nee", "Steiger", "Hoogwerker"],
      categories: ["buiten", "kozijnen", "houtrot", "spoedherstel"],
    },
    {
      key: "bewoond",
      label: "Woning bewoond tijdens het werk?",
      type: "select",
      options: ["Onbekend", "Ja, bewoond", "Nee, leeg"],
      hint: "Bepaalt afdekken, geuroverlast en de volgorde van de kamers.",
      categories: ["binnen", "stucwerk", "behang", "lakwerk"],
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
      "Het klus-CRM met AI-receptionist voor schilders: geen aanvraag missen, van opname en offerte tot betaalde factuur op één plek.",
    logoIcon: "format_paint",
    landing: {
      badge: "Voor schilders en afwerkbedrijven",
      headline: "Meer tijd op de steiger, minder achter de administratie.",
      sub: "Terwijl jij de kwast vasthoudt, neemt SchildersAssistent 24/7 de telefoon en WhatsApp op, legt adres, oppervlak en ondergrond vast en zet alles klaar in je klus-CRM.",
      chat: {
        title: "WhatsApp — SchildersAssistent",
        messages: [
          { from: "customer", text: "Hoi, ik wil de buitenkant van ons huis laten schilderen, kozijnen en gevel. Wat kost dat ongeveer?" },
          {
            from: "ai",
            text: "Leuk! Om een eerlijke offerte te maken komt de schilder eerst opmeten. Wat is je adres, hoeveel kozijnen ongeveer en welk bouwjaar heeft de woning? Een foto van de voorkant helpt ook.",
          },
        ],
      },
      stats: [
        { icon: "call", value: "Geen aanvraag mist", label: "Ook als je op een ladder of dak staat." },
        { icon: "straighten", value: "Opname vastgelegd", label: "Oppervlak, kleur en ondergrond per project." },
        { icon: "receipt_long", value: "Van offerte tot factuur", label: "Alles in één systeem." },
      ],
      steps: [
        {
          title: "Jij stelt je bedrijf in",
          body: "Diensten, tarieven, ploegen en je werkgebied. We geven je een startcatalogus mee; jij past hem aan.",
        },
        {
          title: "De AI neemt de aanvragen aan",
          body: "Telefoon en WhatsApp: naam, adres, soort werk, oppervlak en foto's. Bij spoed of een vermoeden van asbest of lood verbindt hij door.",
        },
        {
          title: "Jij offreert, plant en factureert",
          body: "Zet het project op het planbord, maak een offerte, laat de klant online accepteren en stuur de factuur.",
        },
      ],
      features: [
        { icon: "smart_toy", title: "AI-receptionist 24/7", body: "Neemt telefoon en WhatsApp op, herkent de soort schilderwerk en legt adres, oppervlak en foto's vast. Bij twijfel of gevaar verbindt hij door." },
        { icon: "straighten", title: "Opname per project", body: "Oppervlak, kleur/RAL, aantal lagen, ondergrond, verfsysteem en bouwjaar vastgelegd, klaar voor je offerte." },
        { icon: "request_quote", title: "Offertes en facturen", body: "Offreer per m², kamer, kozijn of rol. De klant accepteert online, met één klik wordt het een factuur met IBAN en betalingsherinneringen." },
        { icon: "calendar_view_week", title: "Planbord per ploeg", body: "Meerdaagse projecten en spoedherstel in één overzicht. Overlappende klussen worden gemarkeerd." },
        { icon: "checklist", title: "Werkbon op je telefoon", body: "Checklist per soort klus, foto's voor en na, werkverslag en opleverhandtekening." },
        { icon: "photo_camera", title: "Foto's voor en na", body: "Vastgelegd bij het project en terug te vinden op het klantdossier, klaar voor oplevering en reviews." },
        { icon: "home", title: "Onderhoudspaspoort", body: "Gevel, kozijnen en dakrand per adres, met kleur en verfsysteem en de volgende schilderbeurt in beeld." },
        { icon: "event_repeat", title: "Onderhoudscycli", body: "Buitenschilderwerk elke paar jaar? De klus ontstaat vanzelf en de klant krijgt automatisch bericht. Terugkerende omzet zonder handwerk." },
      ],
      faq: [
        {
          q: "Werkt dit ook zonder planningssoftware?",
          a: "Ja. Projecten, planning, offertes en facturen zitten in SchildersAssistent zelf — je hoeft niets te koppelen om te starten.",
        },
        {
          q: "Kan de AI een prijs noemen aan de klant?",
          a: "Nee, en dat is bewust. De AI legt oppervlak, ondergrond en foto's vast en plant de opname; de prijs komt uit jouw offerte. Zo beloof je nooit iets voordat je hebt opgemeten.",
        },
        {
          q: "Wat als er asbest of loodhoudende verf in het spel is?",
          a: "Bij een vermoeden, bijvoorbeeld bij een oude woning of plafondplaten, vraagt de AI de klant nergens aan te schuren of te krabben en verbindt hij door naar jou. Je legt het bouwjaar vast bij de klus, zodat je het niet vergeet.",
        },
        {
          q: "Kan ik mijn eigen tarieven en soorten klussen instellen?",
          a: "Ja. Je begint met een voorbeeldcatalogus (kamer sauzen, kozijnen, lakwerk, houtrot, spoedherstel) en past prijzen, duur en teksten aan.",
        },
        {
          q: "Hoe zit het met btw en facturen?",
          a: "Facturen bevatten de wettelijk verplichte gegevens (KvK, btw-nummer, factuurnummer, btw per tarief). Het btw-tarief kies je per regel — 21%, 9% of 0% — omdat het tarief per klus kan verschillen, bijvoorbeeld bij woningen ouder dan twee jaar.",
        },
        {
          q: "Zit er een looptijd of overage op de AI?",
          a: "Nee. Je betaalt een vast bedrag per maand, opzegbaar per maand, zonder kosten per gesprek of per minuut.",
        },
      ],
      ctaTitle: "Klaar om geen aanvraag meer te missen?",
      ctaBody: "Plan een gratis kennismaking — binnen 48 uur werkend, geen creditcard nodig.",
    },
  },
  nav: [
    { key: "overview" },
    { key: "jobs", label: "Projecten" },
    { key: "planner" },
    { key: "customers", label: "Klanten & adressen" },
    { key: "billing" },
    { key: "maintenance", label: "Onderhoudscycli" },
    { key: "ai", label: "AI-Receptie" },
    { key: "conversations" },
    { key: "escalations", label: "Spoed & doorverbinden" },
    { key: "practice", label: "Diensten & team" },
    { key: "reports" },
    { key: "retention", label: "Reviews & terugkeer" },
    { key: "noshow", label: "Annulering & aanbetaling" },
    { key: "integrations" },
    { key: "subscription" },
  ],
  onboarding: [
    { key: "services", label: "Diensten en tarieven (start met de voorbeeldcatalogus)" },
    { key: "business" },
    { key: "team", label: "Schilders en ploegen toegevoegd" },
    { key: "whatsapp" },
    { key: "phone" },
    { key: "firstJob", label: "Eerste project aangemaakt" },
  ],
  jobCategories: [
    {
      key: "binnen",
      label: "Binnenschilderwerk",
      urgent: false,
      estimatedMinutes: 480,
      keywords: ["binnen", "muren", "plafond", "woonkamer", "slaapkamer", "sauzen", "verven", "latex", "wanden", "kamer schilderen"],
      checklist: [
        "Opname en kleuradvies gedaan",
        "Meubels en vloer afgedekt",
        "Ondergrond geschuurd en gerepareerd (gaatjes, scheuren)",
        "Afgeplakt en gegrond",
        "Latex of aflak in het afgesproken aantal lagen aangebracht",
        "Opleverpunten met klant doorgelopen",
      ],
    },
    {
      key: "buiten",
      label: "Buitenschilderwerk",
      urgent: false,
      estimatedMinutes: 960,
      keywords: ["buiten", "gevel", "boeiboorden", "dakrand", "windveren", "buitenschilderwerk", "schutting", "dakkapel", "steiger"],
      checklist: [
        "Weersvoorspelling gecontroleerd",
        "Veilige werkomgeving en steiger/hoogwerker geregeld",
        "Houtrot en gebreken vastgelegd (foto's) en hersteld",
        "Ondergrond geschuurd en ontvet",
        "Grondlaag en afwerklagen aangebracht (droogtijden aangehouden)",
        "Oplevering met klant",
      ],
    },
    {
      key: "kozijnen",
      label: "Kozijnen, ramen en deuren",
      urgent: false,
      estimatedMinutes: 600,
      keywords: ["kozijn", "kozijnen", "raamkozijn", "voordeur", "achterdeur", "tuindeuren", "draairaam", "buitendeur", "ramen schilderen"],
      checklist: [
        "Aantal kozijnen en type (hout/kunststof) opgenomen",
        "Beslag en glas afgeplakt of losgehaald",
        "Ondergrond geschuurd, ontvet en gebreken hersteld",
        "Grondlaag en afwerklagen aangebracht",
        "Kitranden en beslag gecontroleerd",
        "Ramen en deuren gangbaar opgeleverd",
      ],
    },
    {
      key: "houtrot",
      label: "Houtrot herstel",
      urgent: false,
      estimatedMinutes: 240,
      keywords: ["houtrot", "rot hout", "rotte kozijn", "kozijn hersteld", "rot", "zacht hout", "vochtig hout"],
      checklist: [
        "Omvang houtrot vastgelegd (foto's)",
        "Rot hout verwijderd tot in gezond hout",
        "Herstel aangebracht (houtrotvuller of nieuw hout)",
        "Afgewerkt en geschilderd",
        "Oorzaak met klant besproken (vocht, kit, afwatering)",
      ],
    },
    {
      key: "stucwerk",
      label: "Stucwerk",
      urgent: false,
      estimatedMinutes: 480,
      keywords: ["stucen", "stucwerk", "spachtelputz", "glad afgewerkt", "muren gladmaken", "sierpleister", "scheuren repareren"],
      checklist: [
        "Ondergrond beoordeeld (droogte, scheuren, hechting)",
        "Ondergrond voorbehandeld en afgeplakt",
        "Stuc of sierpleister aangebracht",
        "Uitharding en droogtijd gecontroleerd",
        "Oplevering met klant",
      ],
    },
    {
      key: "behang",
      label: "Behangwerk",
      urgent: false,
      estimatedMinutes: 360,
      keywords: ["behang", "behangen", "vliesbehang", "fotobehang", "behang verwijderen", "wandbekleding"],
      checklist: [
        "Aantal rollen en patroon bepaald",
        "Oud behang verwijderd en ondergrond hersteld",
        "Ondergrond gegrond of afgelijmd",
        "Behang aangebracht en naden gecontroleerd",
        "Oplevering met klant",
      ],
    },
    {
      key: "lakwerk",
      label: "Lakwerk en spuitwerk",
      urgent: false,
      estimatedMinutes: 480,
      keywords: ["lakken", "lakwerk", "trap lakken", "binnendeuren", "keuken spuiten", "keukenkastjes", "plinten", "spuiten", "meubels"],
      checklist: [
        "Onderdelen benoemd en genummerd (deuren, kastjes)",
        "Ondergrond ontvet, geschuurd en gegrond",
        "Afgeplakt en ruimte stofvrij gemaakt",
        "Aflak aangebracht in het afgesproken aantal lagen",
        "Droogtijd met klant afgestemd (niet aanraken)",
        "Opleverpunten met klant doorgelopen",
      ],
    },
    {
      key: "spoedherstel",
      label: "Spoedherstel (schade of deadline)",
      urgent: true,
      estimatedMinutes: 240,
      keywords: [
        "waterschade",
        "lekkage plafond",
        "brandschade",
        "inbraakschade",
        "vandaag nog",
        "snel klaar",
        "oplevering morgen",
        "verhuur",
        "verkocht",
        "spoed",
      ],
      checklist: [
        "Schade en omvang vastgelegd met foto's",
        "Veiligheid beoordeeld (nat plafond, losse delen, hoogte)",
        "Oorzaak verholpen of afspraak met loodgieter/verzekering vastgelegd",
        "Herstelwerk uitgevoerd en dichtgezet",
        "Vervolgwerk en droogtijd met klant besproken",
      ],
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
    { key: "deuren", label: "Voordeur en buitendeuren", icon: "door_front", serviceIntervalMonths: 48 },
    { key: "dakrand", label: "Boeiboorden en dakrand", icon: "roofing", serviceIntervalMonths: 60 },
    { key: "dakkapel", label: "Dakkapel", icon: "home_work", serviceIntervalMonths: 60 },
    { key: "schutting", label: "Schutting en houten bijgebouw", icon: "fence", serviceIntervalMonths: 36 },
    { key: "binnenwerk", label: "Binnenschilderwerk", icon: "format_paint", serviceIntervalMonths: null },
    { key: "trap", label: "Trap, deuren en lakwerk binnen", icon: "stairs", serviceIntervalMonths: null },
    { key: "overig", label: "Overig", icon: "build", serviceIntervalMonths: null },
  ],
  // Voorbeeldprijzen — de eigenaar past ze aan; bedoeld als startpunt.
  serviceTemplates: [
    { name: "Voorrijkosten", category: "overig", durationMinutes: 0, priceCents: 2500, vatRatePercent: 21, description: "Voorrijkosten per bezoek." },
    { name: "Schilder per uur", category: "overig", durationMinutes: 60, priceCents: 5500, vatRatePercent: 21, description: "Uurtarief schilder (excl. materiaal)." },
    { name: "Kamer sauzen (wanden, tot 25 m²)", category: "binnen", durationMinutes: 300, priceCents: 42500, vatRatePercent: 21, description: "Wanden voorbereiden en in twee lagen sauzen (incl. afdekken, excl. verf)." },
    { name: "Plafond sauzen per kamer", category: "binnen", durationMinutes: 120, priceCents: 16500, vatRatePercent: 21, description: "Plafond voorbereiden en in twee lagen sauzen." },
    { name: "Kozijn buiten schilderen per stuk", category: "kozijnen", durationMinutes: 90, priceCents: 12500, vatRatePercent: 21, description: "Kozijn schuren, gronden en afwerken, incl. klein herstel." },
    { name: "Voordeur of buitendeur lakken", category: "kozijnen", durationMinutes: 120, priceCents: 11500, vatRatePercent: 21, description: "Deur schuren, gronden en afwerken in twee lagen." },
    { name: "Houtrot herstel per uur", category: "houtrot", durationMinutes: 60, priceCents: 6500, vatRatePercent: 21, description: "Rot hout verwijderen en herstellen (excl. materiaal)." },
    { name: "Wand stucen per m²", category: "stucwerk", durationMinutes: 30, priceCents: 2800, vatRatePercent: 21, description: "Stuclaag aanbrengen op een geschikte ondergrond." },
    { name: "Behangen per rol", category: "behang", durationMinutes: 40, priceCents: 1900, vatRatePercent: 21, description: "Behang aanbrengen (excl. behang en lijm)." },
    { name: "Spoedtarief per uur (schade of deadline)", category: "spoedherstel", durationMinutes: 60, priceCents: 8500, vatRatePercent: 21, description: "Spoedherstel bij schade of een harde deadline, ook buiten kantoortijd." },
  ],
  messages: {
    reminder: ({ salonName, serviceType, date, time }) =>
      `Hoi! Een herinnering van ${salonName}: we komen ${date} rond ${time} bij je langs voor ${serviceType}. ` +
      `Past het niet meer of is de ruimte niet vrij? Laat het ons tijdig weten via WhatsApp. Tot dan! 🎨`,
    review: ({ salonName, reviewLink }) =>
      `Hoi! Bedankt dat we bij je aan de slag mochten. Was je tevreden over ${salonName}? Een review helpt ons enorm: ${reviewLink}`,
    retention: ({ salonName, firstName }) =>
      `Hoi ${firstName}! ${salonName} hier. Is het schilderwerk aan huis nog in orde, of kan er iets een likje verf gebruiken? Stuur gerust een berichtje 🎨`,
    maintenanceDue: ({ salonName, firstName, assetLabel, dueDate }) =>
      `Hoi ${firstName}! ${salonName} hier: het schilderwerk aan je ${assetLabel} is weer aan de beurt, gepland voor ${dueDate}. Zullen we een dag en tijd afspreken? Stuur ons gerust een berichtje.`,
    greetingFallback: "vakman",
  },
  content: {
    audience: "eigenaren van schildersbedrijven en afwerkbedrijven",
    blogSystemPrompt: `Je bent een Nederlandse SEO-contentspecialist voor schildersbedrijven.
Schrijf praktische, autoritaire en nuchtere blogartikelen (B2B, voor eigenaren van schildersbedrijven).
Gebruik Markdown met ## en ### tussenkoppen, korte alinea's en bullets.
Vermijd overdrijving en holle marketingtaal. Schrijf in het Nederlands.
Noem alleen feiten waar je zeker van bent; verzin geen wetten, tarieven, btw-regels of normen voor lood en asbest.`,
    blogTopicPlaceholder: "bijv. Offertes voor buitenschilderwerk sneller versturen",
    blogKeywordPlaceholder: "schilder software, offerte schilder, planning schilder",
    blogSuggestions: [
      "Offertes voor schilderwerk sneller versturen",
      "Planning van meerdaagse schilderprojecten",
      "Onderhoudscycli voor buitenschilderwerk als terugkerende omzet",
      "Lood en asbest herkennen voordat je gaat schuren",
    ],
    blogMetaTitle: "Blog — Tips voor schilders",
    blogMetaDescription: "Praktische tips over offertes, planning en onderhoudscycli voor schilders.",
    blogHeading: "Tips voor schilders",
    blogSubheading: "Praktische inzichten over offertes, planning en terugkerende omzet.",
    postCta: {
      title: "Meer tijd op de steiger?",
      body: "Ontdek wat SchildersAssistent voor jouw bedrijf kan betekenen.",
      href: "/contact",
      label: "Plan een gratis kennismaking",
    },
    kennisbankCategories: {
      Spoed: "Schade & spoed",
      Offertes: "Offertes & facturen",
      Planning: "Planning & projecten",
      Onderhoud: "Onderhoud & cycli",
      Vakkennis: "Vakkennis",
      Marketing: "Gevonden worden",
    },
    kennisbankHeading: "Kennisbank voor schilders",
    kennisbankTitle: "Kennisbank — Praktijktips voor schilders",
    kennisbankDescription:
      "Gratis kennisbank-artikelen over offertes, opname en planning, onderhoudscycli en het runnen van een schildersbedrijf.",
    kennisbankIntro:
      "Praktijktips voor schilders: van opname en offertes tot onderhoudscycli, planning en veilig werken.",
  },
};
