/**
 * Oplossingspagina's: één pagina per zoekintentie ("no-shows voorkomen",
 * "offertesoftware voor schilders"), per site. De tekst beschrijft uitsluitend
 * wat het product aantoonbaar doet (zie de landing/features van de pack en het
 * hulpcentrum) — geen pagina belooft meer dan de code levert.
 */
export interface SolutionPage {
  slug: string;
  /** <title> without the site suffix; keep it <= 34 chars so the whole title fits in 60. */
  metaTitle: string;
  metaDescription: string;
  badge: string;
  headline: string;
  intro: string;
  sections: { title: string; body: string }[];
  features: { icon: string; title: string; body: string }[];
  faq: { q: string; a: string }[];
  /** Practical, product-independent advice — no numbers or claims about the product. */
  tips?: { title: string; items: string[] };
  /** Kennisbank category whose newest articles are linked from this page (topic cluster). */
  category?: string;
}

const KAPPER: SolutionPage[] = [
  {
    slug: "no-shows-voorkomen",
    category: "No-shows",
    tips: { title: "Zo pak je no-shows ook zelf aan", items: ["Leg je annuleringstermijn vast en vermeld hem bij het boeken, niet pas erna.","Vraag bij lange of dure behandelingen om bevestiging, of overweeg een aanbetaling.","Houd een lijst met klanten die kort van tevoren een plek willen, zodat een geannuleerde afspraak snel gevuld wordt.","Kijk terug welke dagen en behandelingen het vaakst uitvallen en pas je beleid daarop aan."] },
    metaTitle: "No-shows voorkomen in je salon",
    metaDescription:
      "Een no-show kost al snel €40 tot €80. Zo voorkom je lege stoelen met automatische herinneringen, bevestigen met één woord en een eigen no-show beleid.",
    badge: "No-shows voorkomen",
    headline: "Minder lege stoelen door no-shows",
    intro:
      "Een no-show kost al snel €40 tot €80 aan gemiste omzet, en de tijd is niet terug te halen. KapperAssistent stuurt automatisch herinneringen, laat klanten bevestigen met één woord en geeft je op tijd zicht op open plekken.",
    sections: [
      { title: "Herinneringen die klanten echt lezen", body: "Klanten krijgen automatisch een herinnering vóór hun afspraak en bevestigen met één woord. Hoe minder moeite het kost, hoe vaker het gebeurt." },
      { title: "Weet het op tijd", body: "Reageert iemand niet, dan weet je het vroeg genoeg om de plek nog op te vullen in plaats van te ontdekken dat de stoel leeg blijft." },
      { title: "Jouw beleid, helder voor de klant", body: "Onder No-show beleid stel je in hoe je met no-shows omgaat. Klanten bevestigen de annuleringsvoorwaarden actief, zodat er achteraf geen discussie is." },
    ],
    features: [
      { icon: "notifications_active", title: "Automatische herinneringen", body: "Zonder dat jij of je team er tijd aan kwijt bent." },
      { icon: "task_alt", title: "Bevestigen met één woord", body: "Lage drempel voor de klant, duidelijkheid voor jou." },
      { icon: "policy", title: "Eigen no-show beleid", body: "Klanten bevestigen de voorwaarden actief." },
    ],
    faq: [
      { q: "Hoeveel kost een no-show gemiddeld?", a: "Al snel €40 tot €80 per gemiste afspraak, afhankelijk van de behandeling en de tijd die je niet meer kunt opvullen." },
      { q: "Moet ik zelf berichten versturen?", a: "Nee. Herinneringen gaan automatisch; jij stelt alleen je beleid in." },
      { q: "Werkt dit met mijn agenda?", a: "Bekijk de koppelingen met Phorest en Acuity. Neem contact op als je een ander systeem gebruikt." },
    ],
  },
  {
    slug: "gemiste-telefoontjes",
    category: "Receptie",
    tips: { title: "Wat je zelf kunt doen om minder te missen", items: ["Zet je openingstijden en behandelingen overal gelijk: website, Google Bedrijfsprofiel en social media.","Vraag klanten bij de afspraak om hun voorkeurskanaal, telefoon of WhatsApp.","Bekijk wanneer je de meeste oproepen mist; dat zijn meestal drukke uren en de avond.","Leg vast wat de AI mag beantwoorden en wanneer hij moet doorverbinden."] },
    metaTitle: "Nooit meer een gemiste oproep",
    metaDescription:
      "Tijdens het knippen kun je niet opnemen. KapperAssistent neemt 24/7 op via telefoon en WhatsApp en boekt de afspraak direct in je agenda.",
    badge: "AI-receptie",
    headline: "Nooit meer een gemiste oproep in je salon",
    intro:
      "Met je handen in het haar van een klant kun je de telefoon niet opnemen, en wie niet wordt opgenomen belt de volgende salon. KapperAssistent neemt 24/7 op via telefoon en WhatsApp.",
    sections: [
      { title: "Altijd bereikbaar", body: "Ook 's avonds en in het weekend krijgt de klant direct antwoord, in plaats van een voicemail." },
      { title: "Klinkt als een collega", body: "De AI onthoudt het gesprek en voelt niet als een keuzemenu. Weet hij het niet zeker, dan draagt hij over aan jou of je team." },
      { title: "Uitrekenen wat het je kost", body: "Met de gratis scan zie je in een minuut hoeveel omzet je salon misloopt door gemiste oproepen." },
    ],
    features: [
      { icon: "call", title: "Telefoon én WhatsApp", body: "Klanten kiezen zelf hun kanaal." },
      { icon: "event_available", title: "Boekt in je agenda", body: "Met koppeling naar o.a. Phorest en Acuity." },
      { icon: "support_agent", title: "Overdracht aan jou", body: "Bij twijfel neemt een mens het over." },
    ],
    faq: [
      { q: "Wat als de AI een vraag niet kan beantwoorden?", a: "Dan draagt hij het gesprek over aan jou of je team." },
      { q: "Zijn er kosten per gesprek?", a: "Nee, je betaalt een vast maandbedrag. Zie de prijzenpagina." },
    ],
  },
];

const LOODGIETER: SolutionPage[] = [
  {
    slug: "spoedoproepen",
    category: "Spoed",
    metaTitle: "Spoedoproepen voor loodgieters",
    metaDescription:
      "Lekkage, gaslucht of geen verwarming: de AI herkent spoed, geeft veiligheidstips, markeert de klus als spoed en waarschuwt jou direct per mail en WhatsApp.",
    badge: "Spoed-triage",
    headline: "Elke spoedoproep direct bij jou",
    intro:
      "Terwijl jij onder een lekkende leiding ligt, rinkelt de telefoon. De AI neemt op, herkent spoed en zorgt dat jij het meteen weet.",
    sections: [
      { title: "Eerst veiligheid", body: "De AI geeft veiligheidstips, bijvoorbeeld de hoofdkraan dicht, bij gaslucht ramen open en 112 of het gasstoringsnummer bellen." },
      { title: "Alles vastgelegd", body: "Klusadres, probleem en spoed worden vastgelegd; foto's van de klant komen bij de klus." },
      { title: "Jij hoort het direct", body: "Spoed krijgt een markering en jij ontvangt meteen een mail en WhatsApp. Op het planbord staat spoed bovenaan." },
    ],
    features: [
      { icon: "emergency", title: "Spoed-triage", body: "Lekkage, gaslucht, geen verwarming." },
      { icon: "notifications_active", title: "Directe melding", body: "Per mail en WhatsApp." },
      { icon: "calendar_view_week", title: "Planbord", body: "Spoed bovenaan, overlappende klussen gemarkeerd." },
    ],
    faq: [
      { q: "Wat doet de AI bij gevaar?", a: "Bij twijfel of gevaar verbindt hij door en geeft hij eerst veiligheidstips." },
      { q: "Werkt dit zonder planningssoftware?", a: "Ja. Klussen, planning, offertes en facturen zitten in LoodgietersAssistent zelf." },
    ],
  },
  {
    slug: "offertesoftware",
    category: "Offertes",
    tips: { title: "Wat een goede offerte bevat", items: ["Een duidelijke omschrijving van het werk en wat er niet bij hoort.","Prijzen per regel, met het btw-tarief dat voor die klus geldt.","Een geldigheidsduur en de geplande uitvoeringsperiode.","Een korte uitleg hoe de klant kan accepteren en wat er daarna gebeurt."] },
    metaTitle: "Offertesoftware voor loodgieters",
    metaDescription:
      "Maak een offerte, laat de klant online accepteren en zet hem met één klik om in een factuur met IBAN en de wettelijk verplichte gegevens.",
    badge: "Offertes en facturen",
    headline: "Van offerte tot betaalde factuur",
    intro:
      "Offerte online laten accepteren, met één klik omzetten naar een factuur, en herinneringen laten sturen als er niet betaald wordt.",
    sections: [
      { title: "Online accepteren", body: "De klant accepteert de offerte online; jij hoeft niet meer te bellen of te wachten op een handtekening." },
      { title: "Factuur met alle verplichte gegevens", body: "Facturen bevatten KvK, btw-nummer, factuurnummer en btw per tarief. Het btw-tarief (21%, 9% of 0%) kies je per regel." },
      { title: "Betalingsherinneringen", body: "Automatische herinneringen en het IBAN op de factuur." },
    ],
    features: [
      { icon: "request_quote", title: "Offertes", body: "Online accepteren." },
      { icon: "receipt_long", title: "Facturen", body: "Eén klik vanaf de offerte." },
      { icon: "checklist", title: "Werkbon", body: "Checklist, foto's voor en na, opleverhandtekening." },
    ],
    faq: [
      { q: "Kan ik eigen tarieven instellen?", a: "Ja. Je begint met een voorbeeldcatalogus en past prijzen, duur en teksten aan." },
    ],
  },
  {
    slug: "onderhoudscontracten",
    category: "Onderhoud",
    metaTitle: "Onderhoudscontracten cv-ketels",
    metaDescription:
      "Elke onderhoudsbeurt ontstaat vanzelf als klus en de klant krijgt automatisch bericht. Terugkerende omzet zonder handwerk.",
    badge: "Terugkerende omzet",
    headline: "Onderhoudscontracten die zichzelf plannen",
    intro:
      "Een installatiepaspoort per ketel of boiler en contracten die vanzelf klussen aanmaken: zo groeit je terugkerende omzet zonder handwerk.",
    sections: [
      { title: "Installatiepaspoort", body: "Merk, type, serienummer en garantie van elke ketel of boiler, met het volgende onderhoud in beeld." },
      { title: "Elke beurt vanzelf", body: "Volgens je contract ontstaat elke beurt als klus en de klant krijgt automatisch bericht." },
    ],
    features: [
      { icon: "build_circle", title: "Installatiepaspoort", body: "Merk, type, serienummer, garantie." },
      { icon: "event_repeat", title: "Contracten", body: "Beurten ontstaan automatisch." },
    ],
    faq: [{ q: "Krijgt de klant bericht?", a: "Ja, automatisch wanneer een beurt aan de orde is." }],
  },
  {
    slug: "werkbon-en-planbord",
    category: "Planning",
    tips: {
      title: "Zo leg je een klus goed vast",
      items: [
        "Noteer symptoom, oorzaak en wat je hebt gedaan, niet alleen de uren.",
        "Maak foto's van de situatie voor en na.",
        "Gebruik een checklist per soort klus, zodat niets wordt vergeten.",
        "Laat de klant tekenen bij oplevering van grotere klussen.",
      ],
    },
    metaTitle: "Werkbon en planbord",
    metaDescription:
      "Een werkbon op je telefoon met checklist, foto's en handtekening, en een planbord met spoed bovenaan. Van werkbon naar factuur zonder overtypen.",
    badge: "Werkbon en planning",
    headline: "Van spoedoproep tot betaalde klus, zonder papier",
    intro:
      "Zet een klus op het planbord, werk hem af op je telefoon met checklist en foto's, en maak er met één klik een factuur van.",
    sections: [
      { title: "Planbord per monteur", body: "Je ziet wie waar werkt. Spoed staat bovenaan en overlappende klussen worden gemarkeerd." },
      { title: "Werkbon op je telefoon", body: "Checklist per soort klus, foto's voor en na, werkverslag en opleverhandtekening." },
      { title: "Van werkbon naar factuur", body: "Met één klik wordt de klus een factuur, met het IBAN erop en automatische betalingsherinneringen." },
    ],
    features: [
      { icon: "calendar_view_week", title: "Planbord per monteur", body: "Spoed bovenaan." },
      { icon: "checklist", title: "Werkbon", body: "Checklist, foto's en handtekening." },
      { icon: "request_quote", title: "Factuur met één klik", body: "Zonder overtypen." },
    ],
    faq: [
      { q: "Kan ik per soort klus een eigen checklist gebruiken?", a: "Ja, er is een checklist per soort klus, van lekkage en ontstopping tot cv-onderhoud, riool en boiler." },
      { q: "Worden foto's bij de klus bewaard?", a: "Ja, foto's voor en na worden bij de klus vastgelegd." },
    ],
  },
];

const SCHILDER: SolutionPage[] = [
  {
    slug: "offertesoftware",
    category: "Offertes",
    tips: {
      title: "Zo maak je een offerte die opvalt",
      items: [
        "Zet de voorbereiding (schuren, herstellen, afplakken) er apart in: hier besparen goedkopere offertes op.",
        "Noem verfsysteem en aantal lagen, niet alleen de prijs.",
        "Zet er duidelijk bij wat niet bij de prijs hoort, zoals steiger en houtrot herstel.",
        "Spreek vooraf af hoe je met meerwerk omgaat.",
      ],
    },
    metaTitle: "Offertesoftware voor schilders",
    metaDescription:
      "Offreer per m², kamer, kozijn of rol, met projectgegevens erbij. De klant accepteert online, met één klik wordt het een factuur met IBAN.",
    badge: "Offertes en facturen",
    headline: "Offertes voor schilders, zonder gedoe",
    intro:
      "Leg oppervlak, kleur, aantal lagen, ondergrond en verfsysteem vast en maak er een offerte van die de klant online accepteert. Daarna zet je hem met één klik om in een factuur.",
    sections: [
      { title: "Projectgegevens bij de klus", body: "Oppervlak, aantal kozijnen, kleur of RAL, aantal lagen, ondergrond, verfsysteem en bouwjaar staan bij het project, zodat je niets dubbel invoert." },
      { title: "Offreer in jouw eenheden", body: "In de offerte-editor reken je per m², kamer, stuk, rol of uur, met btw per regel." },
      { title: "Van offerte naar factuur", body: "De klant accepteert online. Met één klik wordt de offerte een factuur, met het IBAN erop en automatische betalingsherinneringen." },
    ],
    features: [
      { icon: "format_paint", title: "Projectgegevens", body: "Oppervlak, kleur, lagen, ondergrond en verfsysteem per klus vastgelegd." },
      { icon: "request_quote", title: "Offertes en facturen", body: "Online accepteren, btw per regel, IBAN op de factuur." },
      { icon: "straighten", title: "Eenheden voor schilderwerk", body: "Per m², kamer, stuk, rol of uur." },
      { icon: "photo_camera", title: "Foto's voor en na", body: "Vastgelegd bij het project, klaar voor oplevering." },
    ],
    faq: [
      { q: "Neemt de AI ook aanvragen aan?", a: "Ja, via telefoon en WhatsApp legt hij adres, soort werk, oppervlak en foto's compleet vast." },
      { q: "Kan ik het btw-tarief per regel kiezen?", a: "Ja. Je kiest 21%, 9% of 0% per regel, omdat het tarief per klus kan verschillen." },
      { q: "Noemt de AI ook een prijs?", a: "Nee. De prijs komt uit jouw offerte, na de opname." },
    ],
  },
  {
    slug: "onderhoudscycli",
    category: "Onderhoud",
    tips: {
      title: "Zo bouw je terugkerend werk op",
      items: [
        "Noem de volgende beurt al bij de eerste offerte.",
        "Leg bij de oplevering kleur, verfsysteem en het advies-interval vast.",
        "Bewaar foto's van de staat na de beurt, zodat je bij de volgende opname kunt vergelijken.",
        "Houd het bericht persoonlijk en kort, en dring niet aan.",
      ],
    },
    metaTitle: "Onderhoudscycli voor schilders",
    metaDescription:
      "Buitenschilderwerk elke paar jaar? Met een onderhoudspaspoort per adres krijgt de klant vanzelf bericht wanneer het weer aan de beurt is.",
    badge: "Terugkerend werk",
    headline: "Buitenschilderwerk dat vanzelf terugkomt",
    intro:
      "Leg per adres gevel, kozijnen en dakrand vast en stel een onderhoudscyclus in. Als het weer tijd is, ontstaat de klus vanzelf en krijgt de klant automatisch bericht.",
    sections: [
      { title: "Onderhoudspaspoort per adres", body: "Gevel, kozijnen, deuren, dakrand, dakkapel en schutting, met kleur, verfsysteem en het volgende onderhoud in beeld." },
      { title: "Elke beurt vanzelf", body: "Volgens je interval ontstaat elke beurt als klus en de klant krijgt automatisch bericht." },
      { title: "Meerdaagse projecten", body: "Op het planbord zie je meerdaagse projecten en je ploegen in één overzicht." },
    ],
    features: [
      { icon: "home", title: "Onderhoudspaspoort", body: "Gevel, kozijnen en dakrand per adres." },
      { icon: "event_repeat", title: "Onderhoudscycli", body: "Automatisch bericht aan de klant." },
      { icon: "calendar_view_week", title: "Planbord", body: "Meerdaagse projecten en ploegen." },
    ],
    faq: [
      { q: "Kan ik foto's van het project bewaren?", a: "Ja, foto's voor en na worden bij het project vastgelegd en staan op het klantdossier." },
      { q: "Kan ik het interval per onderdeel instellen?", a: "Ja. Je kiest per onderdeel een interval, bijvoorbeeld anders voor kozijnen dan voor een schutting." },
    ],
  },
  {
    slug: "opname-en-spoedherstel",
    category: "Vakkennis",
    tips: {
      title: "Zo pak je de opname veilig aan",
      items: [
        "Leg oppervlak, ondergrond, staat en bouwjaar vast, met foto's.",
        "Vermoed je asbest of loodhoudende verf, dan schuur, krab of boor je er niet in tot het is onderzocht.",
        "Kies bewust het middel voor werken op hoogte en reken de kosten mee.",
        "Leg vast wat je de klant hebt verteld.",
      ],
    },
    metaTitle: "Opname en spoedherstel schilder",
    metaDescription:
      "Leg de opname vast, van oppervlak tot bouwjaar. Bij een vermoeden van asbest of lood of bij spoedherstel verbindt de AI door naar jou.",
    badge: "Opname en spoed",
    headline: "Eerst opmeten, dan offreren, en veilig aan de slag",
    intro:
      "De AI legt de aanvraag compleet vast en plant de opname. Bij schade, een harde deadline of een vermoeden van asbest of loodhoudende verf verbindt hij door naar jou.",
    sections: [
      { title: "Opname vastgelegd", body: "Oppervlak, aantal kozijnen, ondergrond, bouwjaar en of steiger nodig is, staan bij het project." },
      { title: "Spoedherstel bovenaan", body: "Schade of een harde deadline wordt als spoed gemarkeerd. Jij krijgt direct een melding en het planbord toont spoed bovenaan." },
      { title: "Veiligheid eerst", body: "Bij een vermoeden van asbest of loodhoudende verf vraagt de AI de klant nergens aan te schuren of te krabben en verbindt hij door naar jou." },
    ],
    features: [
      { icon: "straighten", title: "Opname per project", body: "Oppervlak, ondergrond en bouwjaar vastgelegd." },
      { icon: "emergency", title: "Spoedherstel", body: "Markeert schade of een deadline als spoed." },
      { icon: "support_agent", title: "Doorverbinden", body: "De AI verbindt door bij twijfel of gevaar." },
    ],
    faq: [
      { q: "Wat gebeurt er bij waterschade?", a: "De AI geeft veiligheidstips, legt de klus vast als spoed en waarschuwt jou direct." },
      { q: "Beslist de AI over asbest of lood?", a: "Nee. Hij vraagt de klant nergens aan te schuren of te krabben en verbindt door naar jou, die het laat onderzoeken." },
    ],
  },
];

const HOVENIER: SolutionPage[] = [
  {
    slug: "storm-en-spoedmeldingen",
    category: "Spoed",
    metaTitle: "Stormschade en spoedmeldingen",
    metaDescription:
      "Omgevallen boom of afgebroken tak: de AI geeft veiligheidstips, markeert de klus als spoed en waarschuwt jou direct.",
    badge: "Storm- en spoedmelding",
    headline: "Na de storm staat je telefoon niet stil",
    intro:
      "Bij storm komen de meldingen tegelijk binnen. De AI neemt ze aan, legt het tuinadres vast en zorgt dat spoed bij jou bovenaan staat.",
    sections: [
      { title: "Veiligheid eerst", body: "De AI geeft veiligheidstips en verbindt bij twijfel of gevaar door." },
      { title: "Spoed bovenaan", body: "Spoed wordt gemarkeerd, jij krijgt direct een melding en het planbord toont spoed bovenaan." },
    ],
    features: [
      { icon: "emergency", title: "Storm- en spoedmelding", body: "Markeert de klus als spoed." },
      { icon: "calendar_view_week", title: "Planbord per ploeg", body: "Wie werkt waar en wanneer." },
    ],
    faq: [{ q: "Wordt het tuinadres vastgelegd?", a: "Ja, samen met de soort klus." }],
  },
  {
    slug: "onderhoudscontracten",
    category: "Onderhoud",
    metaTitle: "Tuinonderhoud met contracten",
    metaDescription:
      "Elke onderhoudsbeurt ontstaat vanzelf als klus en de klant krijgt automatisch bericht. Met een tuinpaspoort per adres.",
    badge: "Terugkerende omzet",
    headline: "Tuinonderhoud dat zichzelf plant",
    intro:
      "Leg per adres gazon, haag, bomen, vijver en beregening vast en laat onderhoudsbeurten automatisch als klus ontstaan.",
    sections: [
      { title: "Tuinpaspoort", body: "Gazon, haag, bomen, vijver en beregening per adres, met het volgende onderhoud in beeld." },
      { title: "Contracten", body: "Elke beurt ontstaat vanzelf als klus en de klant krijgt automatisch bericht." },
    ],
    features: [
      { icon: "yard", title: "Tuinpaspoort", body: "Per adres." },
      { icon: "event_repeat", title: "Onderhoudscontracten", body: "Terugkerende omzet zonder handwerk." },
    ],
    faq: [{ q: "Kan een klant meerdere tuinen hebben?", a: "Ja, klanten met meerdere tuinen en toegangsinfo worden ondersteund." }],
  },
  {
    slug: "offertesoftware",
    category: "Offertes",
    metaTitle: "Offertesoftware voor hoveniers",
    metaDescription:
      "Offerte online laten accepteren, met één klik naar factuur, IBAN op de factuur en automatische betalingsherinneringen.",
    badge: "Offertes en facturen",
    headline: "Van tuinofferte tot betaalde factuur",
    intro: "Offerte online accepteren, één klik naar factuur en automatische betalingsherinneringen.",
    sections: [
      { title: "Online accepteren", body: "De klant accepteert online; de klus staat daarna klaar om te plannen." },
      { title: "Werkbon op je telefoon", body: "Checklist per soort klus, foto's voor en na, werkverslag en opleverhandtekening." },
    ],
    features: [
      { icon: "request_quote", title: "Offertes en facturen", body: "Met IBAN en herinneringen." },
      { icon: "checklist", title: "Werkbon", body: "Op je telefoon." },
    ],
    faq: [{ q: "Kan ik tarieven aanpassen?", a: "Ja, je past prijzen, duur en teksten aan." }],
  },
];

const KOZIJN: SolutionPage[] = [
  {
    slug: "aanvragen-kwalificeren",
    category: "Planning",
    metaTitle: "Kozijnaanvragen sneller kwalificeren",
    metaDescription:
      "De AI neemt telefoon en WhatsApp op, vraagt naar aantal kozijnen, materiaal en bouwjaar en zet foto's van de gevel bij het project.",
    badge: "Aanvragen opvangen",
    headline: "Elke kozijnaanvraag opgevangen, ook op de steiger",
    intro:
      "Een aanvraag die niet wordt opgenomen gaat naar de concurrent. De AI neemt telefoon en WhatsApp op, verzamelt de gegevens die je voor een opname nodig hebt en zet alles klaar in je klus-CRM.",
    sections: [
      { title: "De juiste vragen vooraf", body: "De AI vraagt naar adres, aantal kozijnen, materiaal, bouwjaar en foto's van de gevel, zodat je met een volledig beeld naar de opname gaat." },
      { title: "Geen prijzen uit de lucht", body: "De AI noemt geen vaste prijs: die volgt na de opname. Hij plant wel meteen een afspraak in." },
    ],
    features: [
      { icon: "smart_toy", title: "AI-receptionist 24/7", body: "Telefoon en WhatsApp, ook buiten kantooruren." },
      { icon: "calendar_view_week", title: "Planbord per ploeg", body: "Opnames en montages op één bord." },
    ],
    faq: [{ q: "Worden foto's bij het project bewaard?", a: "Ja, foto's die de klant stuurt worden automatisch bij het project gevoegd." }],
  },
  {
    slug: "offertesoftware",
    category: "Offertes",
    metaTitle: "Offertesoftware voor kozijnbedrijven",
    metaDescription:
      "Offerte online laten accepteren, met één klik naar factuur, IBAN op de factuur en automatische betalingsherinneringen.",
    badge: "Offertes en facturen",
    headline: "Van kozijnofferte tot betaalde factuur",
    intro: "Offerte online accepteren, één klik naar factuur en automatische betalingsherinneringen.",
    sections: [
      { title: "Online accepteren", body: "De klant accepteert online; het project staat daarna klaar om te plannen." },
      { title: "Werkbon op je telefoon", body: "Checklist per soort project, foto's voor en na, werkverslag en opleverhandtekening." },
    ],
    features: [
      { icon: "request_quote", title: "Offertes en facturen", body: "Met IBAN en herinneringen." },
      { icon: "checklist", title: "Werkbon", body: "Op je telefoon." },
    ],
    faq: [{ q: "Kan ik tarieven aanpassen?", a: "Ja, je past prijzen, duur en teksten aan." }],
  },
  {
    slug: "nazorg-en-onderhoud",
    category: "Onderhoud",
    metaTitle: "Nazorg en onderhoud voor kozijnen",
    metaDescription:
      "Leg kozijnen, deuren en schuifpuien per adres vast en laat nazorg- en onderhoudsbezoeken automatisch als project ontstaan.",
    badge: "Nazorg en garantie",
    headline: "Nazorg die zichzelf plant",
    intro:
      "Leg per adres kozijnen, deuren en schuifpuien vast en laat afstel- en onderhoudsbezoeken automatisch als project ontstaan.",
    sections: [
      { title: "Kozijnpaspoort", body: "Kozijnen, deuren en schuifpuien per adres, met merk, type en garantie op één plek." },
      { title: "Contracten", body: "Elk bezoek ontstaat vanzelf als project en de klant krijgt automatisch bericht." },
    ],
    features: [
      { icon: "window", title: "Kozijnpaspoort", body: "Per adres." },
      { icon: "event_repeat", title: "Onderhoudscontracten", body: "Terugkerende omzet zonder handwerk." },
    ],
    faq: [{ q: "Kan een klant meerdere adressen hebben?", a: "Ja, klanten met meerdere adressen en toegangsinfo worden ondersteund." }],
  },
];

const SOLUTIONS: Record<string, SolutionPage[]> = {
  kapper: KAPPER,
  loodgieter: LOODGIETER,
  schilder: SCHILDER,
  hovenier: HOVENIER,
  kozijn: KOZIJN,
};

export const solutionsFor = (vertical: string): SolutionPage[] => SOLUTIONS[vertical] ?? [];
export const getSolution = (vertical: string, slug: string) => solutionsFor(vertical).find((s) => s.slug === slug);
