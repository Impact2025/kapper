/**
 * Oplossingspagina's: één pagina per zoekintentie ("no-shows voorkomen",
 * "offertesoftware voor schilders"), per site. De tekst beschrijft uitsluitend
 * wat het product aantoonbaar doet (zie de landing/features van de pack en het
 * hulpcentrum) — geen pagina belooft meer dan de code levert.
 */
import { LOODGIETER_SOLUTIONS } from "./solutions-loodgieter";

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
  /** Optional free tool that belongs to this pillar (e.g. a calculator). `blurb` replaces the default (salon) sentence. */
  tool?: { href: string; label: string; blurb?: string };
  /** Optional overview/comparison table, rendered under the sections (good for featured snippets). */
  table?: { title: string; headers: string[]; rows: string[][] };
  /** Related blog posts or tools, linked next to the kennisbank cluster. */
  links?: { href: string; label: string }[];
}

const KAPPER: SolutionPage[] = [
  {
    // Pijlerpagina: de categorieterm zelf. Staat bovenaan zodat footer en
    // "Ook interessant" op elke andere oplossingspagina hiernaar linken.
    slug: "ai-assistent-voor-kappers",
    category: "Receptie",
    metaTitle: "AI-assistent voor kappers",
    metaDescription:
      "Een AI-assistent voor kappers neemt 24/7 op via telefoon en WhatsApp, boekt in Salonized, Phorest of Treatwell en stuurt herinneringen. Zo werkt het.",
    badge: "AI-assistent",
    headline: "AI-assistent voor kappers: je receptie die nooit pauze neemt",
    intro:
      "Een AI-assistent voor kappers neemt de telefoon en WhatsApp van je salon op, beantwoordt vragen en boekt afspraken direct in je agenda. Jij blijft knippen, de assistent regelt de rest. KapperAssistent doet dat 24/7, vanaf €149 per maand.",
    sections: [
      { title: "Wat is een AI-assistent voor kappers?", body: "Software die gesprekken met je klanten voert zoals een receptionist dat doet. Hij verstaat gewone taal, kent je behandelingen, kijkt in je agenda en plant de afspraak in. Het verschil met een keuzemenu of voicemail: de klant hoeft niets in te toetsen en niet terug te bellen." },
      { title: "Wat doet hij precies?", body: "Hij neemt op via telefoon en WhatsApp, ook 's avonds en in het weekend. Hij zoekt een vrij moment en boekt, verzet of annuleert afspraken. Daarnaast stuurt hij automatisch herinneringen zodat minder klanten wegblijven, vraagt hij na een geslaagde afspraak om een review en stuurt hij klanten die lang niet geweest zijn een berichtje om terug te komen." },
      { title: "Werkt het met mijn agenda?", body: "Ja. KapperAssistent koppelt met Salonized, Phorest, Treatwell en Acuity. Afspraken komen direct in de agenda die je al gebruikt, zonder dubbele invoer." },
      { title: "Wat doet hij níet?", body: "Hij neemt geen beslissingen die bij jou horen. Twijfelt hij, of vraagt de klant om een mens, dan zet hij het gesprek door naar jou of je team. En hij doet zich niet voor als mens: aan het begin van elk gesprek zegt hij dat de klant met een AI-assistent praat, zoals de Europese AI-verordening voorschrijft." },
      { title: "Wat kost een AI-assistent voor een kapsalon?", body: "Een vast bedrag per maand: €149 voor Essential, €299 voor Pro en €649 voor Elite. Er zijn geen kosten per gesprek. Bij Pro zitten de WhatsApp-berichtkosten al in de prijs, en krijg je er onder meer een kassa met automatische btw-splitsing en aanbetalingen bij dure behandelingen bij." },
      { title: "AI-assistent of receptionist?", body: "Een receptionist kan dingen die een AI niet kan: een klant bij de deur ontvangen, koffie zetten, aanvoelen hoe iemand erbij zit. Maar een receptionist is er niet om elf uur 's avonds en neemt geen twee telefoons tegelijk op. Veel salons zetten de AI juist in voor de momenten waarop niemand kan opnemen." },
      { title: "Hoe begin je?", body: "Doe de gratis AI-scan: in een minuut zie je hoeveel oproepen en afspraken je salon nu misloopt. Daarna koppel je je agenda en zet je je behandelingen, prijzen en openingstijden erin. De assistent werkt met jouw gegevens, niet met gokwerk." },
    ],
    features: [
      { icon: "call", title: "Telefoon én WhatsApp, 24/7", body: "Klanten kiezen zelf hun kanaal, ook buiten openingstijden." },
      { icon: "event_available", title: "Boekt in je eigen agenda", body: "Salonized, Phorest, Treatwell en Acuity." },
      { icon: "support_agent", title: "Overdracht aan een mens", body: "Bij twijfel of op verzoek neemt jouw team het over." },
    ],
    tips: { title: "Zo haal je het meeste uit een AI-assistent", items: ["Zet je behandelingen, duur en prijzen compleet en actueel in het systeem.","Leg vast wanneer de AI moet doorverbinden, bijvoorbeeld bij klachten of een kleurcorrectie.","Zet je WhatsApp-nummer op je website en in je Google Bedrijfsprofiel.","Lees de eerste weken mee met de gesprekken en scherp je instructies aan."] },
    faq: [
      { q: "Merken klanten dat ze met een AI praten?", a: "Ja, en dat is bewust. De assistent meldt aan het begin van het gesprek dat hij een AI is. Wie liever een mens spreekt, vraagt daarom en wordt doorgezet." },
      { q: "Kan de AI-assistent afspraken verzetten en annuleren?", a: "Ja. Hij zoekt de afspraak van de klant op en verzet of annuleert hem." },
      { q: "Welke salonsoftware wordt ondersteund?", a: "Salonized, Phorest, Treatwell en Acuity. Gebruik je iets anders, neem dan contact op." },
      { q: "Zijn er kosten per gesprek?", a: "Nee. Je betaalt een vast maandbedrag. Zie de prijzenpagina." },
      { q: "Wat als de AI iets niet weet?", a: "Dan zet hij het gesprek door naar jou of je team, in plaats van iets te verzinnen." },
    ],
  },
  {
    slug: "no-shows-voorkomen",
    category: "No-shows",
    tool: { href: "/tools/no-showkosten-calculator", label: "Bereken je no-showkosten" },
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

const LOODGIETER: SolutionPage[] = LOODGIETER_SOLUTIONS;

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
    slug: "ai-assistent-voor-hoveniers",
    category: "Onderhoud",
    metaTitle: "AI-assistent voor hoveniers",
    metaDescription:
      "Een AI-assistent voor hoveniers neemt 24/7 op via telefoon en WhatsApp, legt tuinadres en foto's vast en plant de klus in. Ook bij stormschade. Zo werkt het.",
    badge: "AI-assistent",
    headline: "AI-assistent voor hoveniers: bereikbaar, ook met de bosmaaier in je handen",
    intro:
      "Een AI-assistent voor hoveniers neemt je telefoon en WhatsApp op als jij in een tuin staat. Hij legt het tuinadres, de klus en foto's vast en plant de klus in. HovenierAssistent doet dat 24/7, vanaf €149 per maand.",
    sections: [
      { title: "Wat is een AI-assistent voor hoveniers?", body: "Software die klantgesprekken voert zoals een planner op kantoor dat doet. Hij verstaat gewone taal, vraagt door naar wat de klant wil en zet de klus klaar in je systeem. Jij hoeft niet te stoppen met werken om op te nemen, en de klant hoeft niet terug te bellen." },
      { title: "Van telefoontje naar tuinklus", body: "Tuinadres, klus en foto's worden meteen vastgelegd als klus in je klus-CRM. Klanten met meerdere adressen en hun volledige klushistorie staan op één plek. Op het planbord zie je per hovenier wie waar werkt, en op je telefoon heb je per klus foto's voor en na en een checklist." },
      { title: "Stormschade gaat voor", body: "Een omgevallen boom of afgebroken tak die een woning, auto of pad blokkeert, of een tak op een stroomkabel: dat herkent de AI als spoed. Hij geeft eerst veiligheidstips, zoals uit de buurt blijven en nooit een tak aanraken die op een kabel hangt. Stormschade komt bovenaan het planbord, en met Pro kan hij het gesprek direct doorzetten naar de hovenier van dienst." },
      { title: "Onderhoud dat zichzelf plant", body: "Met Pro houd je per adres een tuinpaspoort bij: gazon, haag, bomen, vijver en beregening, met het volgende onderhoud in beeld. Bij onderhoudscontracten ontstaan de klus en de klantherinnering vanzelf. Offertes accepteert de klant online, en facturen gaan met IBAN en automatische betalingsherinneringen de deur uit." },
      { title: "Wat doet hij níet?", body: "Hij beslist niet over dingen die bij jou horen, zoals een prijs voor een tuinontwerp. Twijfelt hij, of vraagt de klant om een mens, dan zet hij het gesprek door. Hij doet zich ook niet voor als mens: aan het begin van het gesprek zegt hij dat de klant met een AI-assistent praat, zoals de Europese AI-verordening voorschrijft." },
      { title: "Wat kost een AI-assistent voor een hoveniersbedrijf?", body: "Een vast bedrag per maand: €149 voor Essential, €299 voor Pro en €649 voor Elite. Er zijn geen kosten per gesprek. Bij Pro zitten de WhatsApp-berichtkosten al in de prijs." },
      { title: "Hoe begin je?", body: "Doe de gratis scan en zie hoeveel aanvragen je nu misloopt. Daarna zet je je diensten en tarieven in het systeem. Je hebt geen aparte planningssoftware nodig: klussen, planning, offertes en facturen zitten in HovenierAssistent zelf." },
    ],
    features: [
      { icon: "yard", title: "Tuinklus direct vastgelegd", body: "Adres, klus en foto's in je klus-CRM." },
      { icon: "emergency", title: "Stormschade bovenaan", body: "Spoed herkend, veiligheidstips eerst." },
      { icon: "event_repeat", title: "Onderhoud vanzelf gepland", body: "Tuinpaspoort en onderhoudscontracten." },
    ],
    tips: { title: "Zo haal je het meeste uit een AI-assistent", items: ["Zet je diensten en tarieven compleet in het systeem, zodat de AI de juiste klus aanmaakt.","Leg vast wat voor jou spoed is en wie er bij storm dienst heeft.","Vraag klanten om foto's van de tuin via WhatsApp; dan kun je vooraf inschatten hoeveel tijd een klus kost.","Plan je vaste onderhoudsklanten in als contract, zodat het voorjaar zichzelf vult."] },
    faq: [
      { q: "Merken klanten dat ze met een AI praten?", a: "Ja. De assistent meldt aan het begin van het gesprek dat hij een AI is. Wie liever een mens spreekt, wordt doorgezet." },
      { q: "Kunnen klanten foto's van hun tuin sturen?", a: "Ja, via WhatsApp. De foto's komen automatisch bij de klus." },
      { q: "Wat doet de AI bij stormschade?", a: "Hij herkent het als spoed, geeft eerst veiligheidstips en zet de klus bovenaan het planbord." },
      { q: "Heb ik planningssoftware nodig?", a: "Nee. Klussen, planning, offertes en facturen zitten in HovenierAssistent zelf." },
      { q: "Zijn er kosten per gesprek?", a: "Nee. Je betaalt een vast maandbedrag. Zie de prijzenpagina." },
    ],
  },
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
    slug: "ai-assistent-voor-kozijnbedrijven",
    category: "Offertes",
    metaTitle: "AI-assistent voor kozijnbedrijven",
    metaDescription:
      "Een AI-assistent voor kozijnbedrijven neemt 24/7 op via telefoon en WhatsApp, vraagt naar aantal kozijnen, materiaal en foto's en plant de opname in.",
    badge: "AI-assistent",
    headline: "AI-assistent voor kozijnbedrijven: geen aanvraag meer kwijt, ook op de steiger",
    intro:
      "Een AI-assistent voor kozijnbedrijven neemt je telefoon en WhatsApp op als jij op de steiger staat. Hij verzamelt wat je voor een opname nodig hebt en plant die meteen in. KozijnAssistent doet dat 24/7, vanaf €149 per maand.",
    sections: [
      { title: "Wat is een AI-assistent voor kozijnbedrijven?", body: "Software die klantgesprekken voert zoals een binnendienst dat doet. Hij verstaat gewone taal, stelt de vragen die jij anders zelf stelt en zet het project klaar in je systeem. Een aanvraag die niet wordt opgenomen gaat vaak naar de concurrent; met een AI-assistent wordt elke aanvraag opgevangen." },
      { title: "De juiste vragen vooraf", body: "De AI vraagt naar adres, aantal kozijnen, materiaal en bouwjaar, en vraagt om foto's van de gevel. Alles komt als project in je klus-CRM, zodat je met een volledig beeld naar de opname gaat. Een vaste prijs noemt hij niet: die volgt na de opname. Hij plant de opname wel meteen in." },
      { title: "Spoed: inbraak en kapot glas", body: "Inbraakschade, een ingeslagen raam of een deur die niet meer op slot kan: dat herkent de AI als spoed. Hij geeft eerst veiligheidstips, zoals uit de buurt blijven van gebroken glas, en bij inbraak of gevaar verwijst hij naar 112. Daarna legt hij de klus vast, zodat een monteur van dienst tijdelijk kan dichtzetten." },
      { title: "Offerte, factuur en nazorg", body: "Met Pro verstuur je offertes die de klant online accepteert, en facturen met IBAN en automatische betalingsherinneringen. Het kozijnpaspoort legt per adres kozijnen, deuren en schuifpuien vast met merk, type en garantie. Bij onderhoudscontracten ontstaan het nazorgbezoek en de klantherinnering vanzelf." },
      { title: "Wat doet hij níet?", body: "Hij geeft geen prijs zonder opname en neemt geen beslissingen die bij jou horen. Twijfelt hij, of vraagt de klant om een mens, dan zet hij het gesprek door. Hij doet zich ook niet voor als mens: aan het begin van het gesprek zegt hij dat de klant met een AI-assistent praat, zoals de Europese AI-verordening voorschrijft." },
      { title: "Wat kost een AI-assistent voor een kozijnbedrijf?", body: "Een vast bedrag per maand: €149 voor Essential, €299 voor Pro en €649 voor Elite. Er zijn geen kosten per gesprek. Bij Pro zitten de WhatsApp-berichtkosten al in de prijs." },
      { title: "Hoe begin je?", body: "Plan een gratis kennismaking. Daarna zet je je diensten en planning in het systeem. Je hebt geen aparte planningssoftware nodig: projecten, opnames, montages, offertes en facturen zitten in KozijnAssistent zelf." },
    ],
    features: [
      { icon: "smart_toy", title: "Elke aanvraag opgevangen", body: "Telefoon en WhatsApp, ook buiten kantooruren." },
      { icon: "straighten", title: "Klaar voor de opname", body: "Aantal kozijnen, materiaal, bouwjaar en foto's." },
      { icon: "window", title: "Kozijnpaspoort en nazorg", body: "Merk, type en garantie per adres." },
    ],
    tips: { title: "Zo haal je het meeste uit een AI-assistent", items: ["Leg vast welke gegevens je voor een opname altijd nodig hebt; dan vraagt de AI ernaar.","Vraag altijd om foto's van de gevel: je ziet vooraf of het een eenvoudige of complexe klus is.","Leg vast wat voor jou spoed is en wie er dienst heeft.","Lees de eerste weken mee met de gesprekken en scherp je instructies aan."] },
    faq: [
      { q: "Merken klanten dat ze met een AI praten?", a: "Ja. De assistent meldt aan het begin van het gesprek dat hij een AI is. Wie liever een mens spreekt, wordt doorgezet." },
      { q: "Noemt de AI prijzen?", a: "Nee, geen vaste prijs. Die volgt na de opname. De AI plant de opname wel meteen in." },
      { q: "Worden foto's bij het project bewaard?", a: "Ja, foto's die de klant stuurt worden automatisch bij het project gevoegd." },
      { q: "Heb ik planningssoftware nodig?", a: "Nee. Projecten, planning, offertes en facturen zitten in KozijnAssistent zelf." },
      { q: "Zijn er kosten per gesprek?", a: "Nee. Je betaalt een vast maandbedrag. Zie de prijzenpagina." },
    ],
  },
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
