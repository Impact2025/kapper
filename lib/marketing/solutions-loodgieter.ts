import type { SolutionPage } from "./solutions";

/**
 * Oplossingspagina's voor loodgietersassistent.nl: één pagina per manier
 * waarop een loodgieter zoekt (software, spoed, offertes, werkbon, onderhoud,
 * warmtepomp, installatiepaspoort, kiezen). Elke zin beschrijft wat het
 * product aantoonbaar doet; wat nog niet bestaat (boekhoudkoppelingen,
 * urenregistratie, voorraad) staat er eerlijk als "niet" of "gepland".
 * Prijzen: lib/plans.ts. Wat bij welk pakket hoort: lib/jobs/access.ts.
 */
export const LOODGIETER_SOLUTIONS: SolutionPage[] = [
  {
    slug: "ai-assistent-voor-loodgieters",
    category: "Spoed",
    metaTitle: "AI-assistent voor loodgieters",
    metaDescription:
      "Een AI-assistent voor loodgieters neemt 24/7 op via telefoon en WhatsApp, herkent spoed, legt de klus vast en plant hem in. Zo werkt het, en dit kost het.",
    badge: "AI-assistent",
    headline: "AI-assistent voor loodgieters: elke oproep opgenomen, ook onder de gootsteen",
    intro:
      "Een AI-assistent voor loodgieters neemt je telefoon en WhatsApp op als jij dat niet kunt. Hij herkent spoed, legt het klusadres en het probleem vast en plant de klus in. LoodgietersAssistent doet dat 24/7, vanaf €149 per maand.",
    sections: [
      { title: "Wat is een AI-assistent voor loodgieters?", body: "Software die klantgesprekken voert zoals een planner op kantoor dat doet. Hij verstaat gewone taal, vraagt door naar wat er aan de hand is en zet de klus klaar in je systeem. De klant hoeft niet naar je voicemail en niet terug te bellen, en jij hoeft niet met natte handen op te nemen." },
      { title: "Wat doet hij bij spoed?", body: "Water dat blijft lopen, gaslucht of geen verwarming in de kou: dat herkent de AI als spoed. Hij geeft eerst veiligheidstips, zoals de hoofdkraan dichtdraaien, en bij gaslucht: ramen open, het pand verlaten en het gasstoringsnummer bellen. Daarna markeert hij de klus als spoed en krijg jij direct een melding per mail en WhatsApp. Bij gevaar of twijfel verbindt hij door." },
      { title: "Van telefoontje naar klus", body: "Klusadres, probleem en spoed worden meteen vastgelegd als klus in je klus-CRM. Stuurt de klant een foto van de lekkage of de ketel, dan komt die bij de klus. Klanten met meerdere adressen en hun volledige klushistorie staan op één plek, en op het planbord zie je per monteur wie waar is." },
      { title: "Buiten je werkgebied", body: "Stel je werkgebied in met postcodes. Belt iemand van buiten dat gebied, dan weigert de AI de klus niet: hij zegt eerlijk dat jij beoordeelt of je kunt komen en belooft niets. Jij ziet de melding op de klus." },
      { title: "Offerte, factuur en onderhoud", body: "Met Pro verstuur je offertes die de klant online accepteert, en facturen met IBAN en automatische betalingsherinneringen. Het installatiepaspoort legt per adres merk, type, serienummer en garantie vast. Bij onderhoudscontracten ontstaan de klus en de klantherinnering vanzelf." },
      { title: "Wat doet hij níet?", body: "Hij stelt niemand gerust bij een mogelijk gevaarlijke situatie: dan schakelt hij altijd een mens in. Hij geeft geen diagnose en geen prijsindicatie voor een lastig geval. Hij doet zich ook niet voor als mens. Aan het begin van het gesprek zegt hij dat de klant met een AI-assistent praat, zoals de Europese AI-verordening voorschrijft." },
      { title: "Wat kost een AI-assistent voor een loodgietersbedrijf?", body: "Een vast bedrag per maand: €149 voor Essential, €299 voor Pro en €649 voor Elite. Er zijn geen kosten per gesprek. Bij Pro zitten de WhatsApp-berichtkosten al in de prijs." },
      { title: "Hoe begin je?", body: "Doe de gratis scan en zie hoeveel oproepen je nu misloopt. Daarna zet je je diensten en tarieven in het systeem. Je hebt geen aparte planningssoftware nodig: klussen, planning, offertes en facturen zitten in LoodgietersAssistent zelf." },
    ],
    features: [
      { icon: "emergency", title: "Spoed herkend", body: "Lekkage, gaslucht, geen verwarming: jij hoort het direct." },
      { icon: "checklist", title: "Klus direct vastgelegd", body: "Adres, probleem en foto's in je klus-CRM." },
      { icon: "calendar_view_week", title: "Planbord per monteur", body: "Spoed bovenaan, wie is waar." },
    ],
    tips: { title: "Zo haal je het meeste uit een AI-assistent", items: ["Zet je diensten en voorrijkosten compleet in het systeem, zodat de AI de juiste klus aanmaakt.","Leg vast wat voor jou spoed is en wie er dienst heeft.","Vraag klanten om een foto via WhatsApp; dan weet je vooraf welk materiaal je meeneemt.","Lees de eerste weken mee met de gesprekken en scherp je instructies aan."] },
    links: [
      { href: "/blog/gemiste-telefoontjes-loodgieter", label: "Gemiste telefoontjes als loodgieter: wat het kost en wat je ertegen doet" },
    ],
    faq: [
      { q: "Merken klanten dat ze met een AI praten?", a: "Ja. De assistent meldt aan het begin van het gesprek dat hij een AI is. Wie liever een mens spreekt, wordt doorgezet." },
      { q: "Wat doet de AI bij gaslucht?", a: "Hij geeft eerst veiligheidstips (ramen open, geen vuur of lichtschakelaars, het pand verlaten, het gasstoringsnummer bellen) en schakelt jou direct in." },
      { q: "Kunnen klanten foto's sturen?", a: "Ja, via WhatsApp. De AI gebruikt de foto om in te schatten wat er nodig is en voegt hem bij de klus." },
      { q: "Wordt het telefoongesprek opgenomen?", a: "De audio wordt niet opgeslagen. Het gesprek wordt uitgeschreven om de aanvraag te verwerken, en dat zegt de assistent aan het begin van het gesprek." },
      { q: "Heb ik planningssoftware nodig?", a: "Nee. Klussen, planning, offertes en facturen zitten in LoodgietersAssistent zelf." },
      { q: "Zijn er kosten per gesprek?", a: "Nee. Je betaalt een vast maandbedrag. Zie de prijzenpagina." },
    ],
  },
  {
    slug: "software-voor-loodgieters",
    category: "Planning",
    metaTitle: "Software voor loodgieters",
    metaDescription:
      "Software voor loodgieters: AI-receptie voor telefoon en WhatsApp, klus-CRM, planbord, werkbon, offerte, factuur en onderhoud in één systeem. Vanaf €149 per maand.",
    badge: "Alles in één systeem",
    headline: "Software voor loodgieters: van gemiste oproep tot betaalde factuur",
    intro:
      "Een loodgieter heeft meer nodig dan een agenda. LoodgietersAssistent is klus-CRM en AI-receptie in één: oproepen opnemen, klus vastleggen, plannen, werkbon, offerte, factuur en onderhoud. Een vast bedrag per maand vanaf €149, opzegbaar per maand.",
    sections: [
      { title: "Wat moet software voor een loodgieter kunnen?", body: "Je werkt op het adres van de klant, dus je hebt een klusadres nodig, geen stoel in een salon. Je krijgt spoed binnen die geen uitstel duldt, foto's van een lekkage of ketel, installaties die jaarlijks onderhoud vragen en offertes die de klant wil kunnen accepteren. Een gewone agenda dekt dat niet. Daarom is LoodgietersAssistent gebouwd rond de klus, niet rond de afspraak." },
      { title: "Oproepen opnemen, ook als je onder de gootsteen ligt", body: "De AI-receptie neemt telefoon en WhatsApp op, 24 uur per dag. Hij vraagt naar naam, adres, probleem en dringendheid, herkent spoed en legt alles vast als klus. Bij gevaar of twijfel verbindt hij door naar een mens. Je mist geen spoedoproep meer en hoeft niet met natte handen op te nemen." },
      { title: "Een klus-CRM met adressen en geschiedenis", body: "Per klant zie je alle adressen, de toegangsinfo, een contactpersoon ter plaatse en de volledige klushistorie met foto's, offertes en facturen. Een verhuurder met tien panden of een klant met een tweede woning staat gewoon op één plek." },
      { title: "Plannen en uitvoeren", body: "Het planbord toont per monteur wie waar is, met spoed bovenaan en overlappende klussen gemarkeerd. De werkbon staat op je telefoon met een checklist per soort klus, foto's voor en na, een werkverslag en een opleverhandtekening met garantie. De klant krijgt desgewenst een opleverpagina met het resultaat." },
      { title: "Offerte, factuur en betaling", body: "Maak een offerte, kies desgewenst een kant-en-klaar pakket zoals een ketelvervanging, en laat de klant online accepteren. Met één klik wordt de offerte een factuur met IBAN. Het btw-tarief kies je per regel, en betalingsherinneringen gaan automatisch: één, acht en vijftien dagen na de vervaldatum." },
      { title: "Installaties en onderhoud", body: "Het installatiepaspoort legt per adres merk, type, serienummer, garantie en het volgende onderhoud van elke ketel, boiler of warmtepomp vast, en is te printen voor de klant. Met onderhoudscontracten ontstaat elke beurt vanzelf als klus en krijgt de klant automatisch bericht. Bij cv-onderhoud leg je rookgasmetingen vast." },
      { title: "Veilig en transparant", body: "De AI zegt aan het begin van een gesprek dat hij een AI is. De audio van telefoongesprekken wordt niet opgeslagen, alleen de uitgeschreven tekst. Bij gaslucht of een gesprongen leiding geeft hij veiligheidstips en schakelt hij jou in. Een verwerkersovereenkomst en de lijst met subverwerkers staan op de site." },
      { title: "Wat het niet is", body: "LoodgietersAssistent is geen boekhoudpakket: de koppelingen met Moneybird, e-Boekhouden en Exact Online staan op de planning en zijn nog niet beschikbaar. Er is geen voorraadbeheer en geen urenregistratie per monteur. Wat je nodig hebt om offertes, werkbonnen, planning en facturen op één plek te krijgen, zit er wel in." },
      { title: "Wat kost het?", body: "Een vast bedrag per maand: €149 voor Essential, €299 voor Pro en €649 voor Elite. Geen kosten per gesprek, geen looptijd, opzegbaar per maand. Bij Pro zitten de WhatsApp-berichtkosten in de prijs." },
      { title: "Hoe begin je?", body: "Doe de gratis scan en zie wat gemiste oproepen je kosten. Plan daarna een kennismaking. Je start met een voorbeeldcatalogus van diensten en tarieven die je zelf aanpast, en je bent binnen 48 uur werkend." },
    ],
    table: {
      title: "Wat zit in welk pakket?",
      headers: ["Onderdeel", "Essential", "Pro", "Elite"],
      rows: [
        ["AI-receptie voor telefoon en WhatsApp", "Ja", "Ja", "Ja"],
        ["Klus-CRM, planbord en werkbon met foto's", "Ja", "Ja", "Ja"],
        ["Afspraakherinneringen en review-verzoeken", "Ja", "Ja", "Ja"],
        ["Offertes en facturen met betalingsherinneringen", "Nee", "Ja", "Ja"],
        ["Installatiepaspoort per adres", "Nee", "Ja", "Ja"],
        ["Onderhoudscontracten", "Nee", "Ja", "Ja"],
        ["Aanbetaling bij inplannen en doorzetten naar de monteur van dienst", "Nee", "Ja", "Ja"],
        ["Meerdere vestigingen en maandelijks rapport", "Nee", "Nee", "Ja"],
      ],
    },
    features: [
      { icon: "smart_toy", title: "AI-receptie 24/7", body: "Telefoon en WhatsApp, spoed herkend." },
      { icon: "group", title: "Klus-CRM", body: "Klanten, adressen, installaties en historie." },
      { icon: "calendar_view_week", title: "Planbord en werkbon", body: "Per monteur, met checklist en foto's." },
      { icon: "request_quote", title: "Offerte en factuur", body: "Online accepteren, één klik naar factuur." },
      { icon: "build_circle", title: "Installatiepaspoort", body: "Merk, serienummer, garantie en onderhoud." },
      { icon: "event_repeat", title: "Onderhoudscontracten", body: "Elke beurt ontstaat vanzelf." },
    ],
    tips: {
      title: "Waar je op let bij software voor je loodgietersbedrijf",
      items: [
        "Kijk of de software om het klusadres draait en niet alleen om een agenda.",
        "Vraag wat er gebeurt met spoed: wie hoort het, hoe snel en wat zegt de klant te horen.",
        "Controleer of offerte, werkbon en factuur dezelfde klus volgen, zodat je niets overtypt.",
        "Vraag wat het niet kan en wat gepland staat, en reken niet op beloftes.",
        "Kijk naar de totale maandkosten, inclusief berichten en gesprekken.",
      ],
    },
    tool: { href: "/tools/uurtarief-calculator", label: "Bereken je uurtarief", blurb: "Gratis tool: reken uit wat je uurtarief minimaal moet zijn" },
    links: [
      { href: "/oplossingen/loodgieter-software-kiezen", label: "Loodgietersoftware kiezen: de checklist" },
      { href: "/blog/uurtarief-loodgieter-bepalen", label: "Uurtarief loodgieter bepalen: reken vanuit je kosten" },
      { href: "/blog/gemiste-telefoontjes-loodgieter", label: "Gemiste telefoontjes als loodgieter" },
    ],
    faq: [
      { q: "Heb ik aparte planningssoftware nodig?", a: "Nee. Klussen, planning, offertes en facturen zitten in LoodgietersAssistent zelf. Je hoeft niets te koppelen om te starten." },
      { q: "Werkt het op mijn telefoon?", a: "Ja. Je gebruikt LoodgietersAssistent in de browser van je telefoon: de werkbon, de foto's en de checklist staan er gewoon in." },
      { q: "Is er een koppeling met mijn boekhouding?", a: "Nog niet. Koppelingen met Moneybird, e-Boekhouden en Exact Online staan op de planning. Facturen bevatten wel alle wettelijk verplichte gegevens." },
      { q: "Voor hoeveel monteurs is het geschikt?", a: "Voor zelfstandigen met Essential, voor bedrijven met meerdere monteurs met Pro en voor grotere bedrijven met meerdere vestigingen met Elite." },
      { q: "Zit er een looptijd of overage op de AI?", a: "Nee. Je betaalt een vast bedrag per maand, opzegbaar per maand, zonder kosten per gesprek of per minuut." },
      { q: "Is dit AVG-proof en voldoet de AI aan de AI-verordening?", a: "De AI meldt aan het begin dat hij een AI is, de audio van gesprekken wordt niet opgeslagen en een verwerkersovereenkomst is beschikbaar. Jij blijft verantwoordelijk voor hoe je klantgegevens gebruikt." },
    ],
  },
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
      { title: "Wat telt als spoed?", body: "Water dat blijft lopen of door het plafond komt, gaslucht, geen warm water of verwarming bij kou en elk veiligheidsrisico. Dat zijn de uitgangspunten van de AI. Jij bepaalt in je instellingen wat voor jouw bedrijf spoed is." },
      { title: "Eerst veiligheid", body: "De AI geeft veiligheidstips, bijvoorbeeld de hoofdkraan dicht, en bij gaslucht ramen open en 112 of het gasstoringsnummer bellen." },
      { title: "Alles vastgelegd", body: "Klusadres, probleem en spoed worden vastgelegd; foto's van de klant komen bij de klus." },
      { title: "Jij hoort het direct", body: "Spoed krijgt een markering en jij ontvangt meteen een mail en WhatsApp. Op het planbord staat spoed bovenaan." },
      { title: "Wat de AI niet doet", body: "Hij stelt niemand gerust bij een mogelijk gevaarlijke situatie en geeft geen diagnose of prijs voor een lastig geval. Bij twijfel of gevaar verbindt hij door naar een mens." },
      { title: "Voorrijkosten en spoedtarief", body: "Zet je voorrijkosten en spoedtarief als dienst in je catalogus en voeg ze met één klik toe aan een offerte. Zo staat het tarief vooraf vast en kun je het bij de eerste aanname noemen." },
    ],
    features: [
      { icon: "emergency", title: "Spoed-triage", body: "Lekkage, gaslucht, geen verwarming." },
      { icon: "notifications_active", title: "Directe melding", body: "Per mail en WhatsApp." },
      { icon: "calendar_view_week", title: "Planbord", body: "Spoed bovenaan, overlappende klussen gemarkeerd." },
    ],
    links: [
      { href: "/blog/cv-ketel-storingen-najaar-voorbereiden", label: "Najaarsdrukte als loodgieter: zo bereid je je voor op cv-storingen" },
      { href: "/blog/uurtarief-loodgieter-bepalen", label: "Uurtarief, voorrijkosten en spoedtarief vooraf afspreken" },
    ],
    faq: [
      { q: "Wat doet de AI bij gevaar?", a: "Bij twijfel of gevaar verbindt hij door en geeft hij eerst veiligheidstips." },
      { q: "Hoe snel hoor ik van een spoedgeval?", a: "Direct: zodra de aanvraag is vastgelegd, krijg je een mail en een WhatsApp-bericht." },
      { q: "Kan de AI een gesprek doorverbinden?", a: "Ja. Bij gevaar of op verzoek van de beller verbindt hij door naar de monteur van dienst (Pro)." },
      { q: "Werkt dit zonder planningssoftware?", a: "Ja. Klussen, planning, offertes en facturen zitten in LoodgietersAssistent zelf." },
    ],
  },
  {
    slug: "offertesoftware",
    category: "Offertes",
    tips: { title: "Wat een goede offerte bevat", items: ["Een duidelijke omschrijving van het werk en wat er niet bij hoort.","Prijzen per regel, met het btw-tarief dat voor die klus geldt.","Toestel, materiaal en arbeid op aparte regels, zodat meerwerk te onderbouwen is.","Een geldigheidsduur en de geplande uitvoeringsperiode.","Een korte uitleg hoe de klant kan accepteren en wat er daarna gebeurt."] },
    metaTitle: "Offertesoftware voor loodgieters",
    metaDescription:
      "Maak een loodgietersofferte met kant-en-klare pakketten, laat de klant online accepteren en zet hem met één klik om in een factuur met IBAN en alle verplichte gegevens.",
    badge: "Offertes en facturen",
    headline: "Van offerte tot betaalde factuur",
    intro:
      "Offerte online laten accepteren, met één klik omzetten naar een factuur, en herinneringen laten sturen als er niet betaald wordt. Offertes en facturen zijn onderdeel van Pro (€299 per maand).",
    sections: [
      { title: "Kant-en-klare offertepakketten", body: "Kies een pakket zoals CV-ketel vervangen, Boiler of geiser plaatsen, Hybride warmtepomp plaatsen, Badkamer of Jaarlijks cv-onderhoud, en alle regels staan er in één keer. Toestel en materiaal staan op nul: jij vult je eigen inkoop en marge in. Wij verzinnen geen toestelprijzen." },
      { title: "Online accepteren", body: "De klant bekijkt de offerte via een link en accepteert online met zijn naam; jij hoeft niet meer te bellen of te wachten op een handtekening. Je ziet direct de status." },
      { title: "Factuur met alle verplichte gegevens", body: "Facturen bevatten KvK, btw-nummer, factuurnummer en btw per tarief. Het btw-tarief (21%, 9% of 0%) kies je per regel. Loodgieterswerk in een woning is doorgaans 21%; het verlaagde tarief geldt alleen voor specifieke werken zoals isoleren. Controleer twijfelgevallen bij de Belastingdienst." },
      { title: "Betalingsherinneringen", body: "Is de vervaldatum verstreken, dan gaat er automatisch een vriendelijke herinnering uit: één, acht en vijftien dagen erna, per WhatsApp of e-mail. Een aanmaning voor incassokosten (de veertiendagenbrief) stuur je zelf." },
      { title: "Eenheden die bij je werk passen", body: "Reken per uur, stuk, meter, punt, post, dag of m². Zo kun je leidingwerk per meter of aansluitpunt offreren en een ketelvervanging als post." },
      { title: "Van klus naar offerte naar factuur", body: "De offerte hangt aan de klus, met adres en foto's. Na akkoord maak je met één klik de factuur, zonder iets over te typen." },
    ],
    features: [
      { icon: "request_quote", title: "Offertes", body: "Pakketten en online accepteren." },
      { icon: "receipt_long", title: "Facturen", body: "Eén klik vanaf de offerte." },
      { icon: "checklist", title: "Werkbon", body: "Checklist, foto's voor en na, opleverhandtekening." },
    ],
    tool: { href: "/tools/uurtarief-calculator", label: "Bereken je uurtarief", blurb: "Gratis tool: reken uit wat je uurtarief minimaal moet zijn" },
    links: [
      { href: "/blog/btw-loodgieter-21-9-en-0-procent", label: "Btw voor loodgieters: bijna altijd 21%, behalve in deze gevallen" },
      { href: "/blog/betalingsherinneringen-loodgieter", label: "Betalingsherinneringen voor loodgieters: sneller betaald, zonder ruzie" },
      { href: "/blog/uurtarief-loodgieter-bepalen", label: "Uurtarief loodgieter bepalen" },
    ],
    faq: [
      { q: "Kan ik eigen tarieven instellen?", a: "Ja. Je begint met een voorbeeldcatalogus en past prijzen, duur en teksten aan. De voorbeeldprijzen zijn een startpunt." },
      { q: "Welk btw-tarief gebruik ik?", a: "Je kiest het tarief per regel. Loodgieterswerk in een woning is doorgaans 21%. Het verlaagde tarief van 9% geldt alleen voor isoleren, schilderen, stukadoren en behangen van woningen ouder dan twee jaar. Controleer dit bij de Belastingdienst of je boekhouder." },
      { q: "Kan ik materiaal en arbeid apart zetten?", a: "Ja. Elke regel heeft een soort (arbeid, materiaal, voorrijkosten of overig), eenheid en btw-tarief." },
      { q: "Stuurt het systeem incassokosten of rente mee?", a: "Nee. Het stuurt vriendelijke herinneringen. Wil je incassokosten rekenen, dan stuur je zelf een aanmaning met veertien dagen betaaltermijn." },
      { q: "Zit offertesoftware in elk pakket?", a: "Offertes en facturen horen bij Pro en Elite. Essential bevat de AI-receptie, het klus-CRM, het planbord en de werkbon." },
    ],
  },
  {
    slug: "onderhoudscontracten",
    category: "Onderhoud",
    metaTitle: "Onderhoudscontracten cv-ketels",
    metaDescription:
      "Elke onderhoudsbeurt ontstaat vanzelf als klus en de klant krijgt automatisch bericht. Met installatiepaspoort en meetwaarden. Terugkerende omzet zonder handwerk.",
    badge: "Terugkerende omzet",
    headline: "Onderhoudscontracten die zichzelf plannen",
    intro:
      "Een installatiepaspoort per ketel of boiler en contracten die vanzelf klussen aanmaken: zo groeit je terugkerende omzet zonder handwerk. Onderdeel van Pro.",
    sections: [
      { title: "Installatiepaspoort", body: "Merk, type, serienummer, installatiedatum, garantie en het volgende onderhoud van elke ketel, boiler of warmtepomp, per adres. Je print het paspoort of slaat het op als pdf, met de klushistorie en meetwaarden erbij." },
      { title: "Elke beurt vanzelf", body: "Volgens je contract ontstaat elke beurt als klus en de klant krijgt automatisch bericht. Je bepaalt het interval per contract." },
      { title: "Meetwaarden bij cv-onderhoud", body: "Bij onderhoud leg je CO, CO₂, rookgastemperatuur, waterdruk en de uitkomst van de controle vast. Ze staan op de werkbon en bij de klus, zodat je bij een klacht kunt laten zien wat je toen mat." },
      { title: "Overzicht van wat aan de beurt is", body: "Je ziet welke toestellen binnenkort onderhoud nodig hebben en welke beurten al zijn aangemaakt. Zo hoef je geen lijstjes bij te houden." },
      { title: "Let op de regels", body: "Werk aan gasverbrandingsinstallaties mag alleen met een CO-vrij certificaat. De Rijksoverheid adviseert bewoners hun installatie minstens één keer per twee jaar te laten controleren. Het systeem herinnert je aan het onderhoud; het certificaat regel je zelf." },
    ],
    table: {
      title: "Standaardintervallen per toestel",
      headers: ["Toestel", "Standaard interval", "Aan te passen"],
      rows: [
        ["Cv-ketel", "12 maanden", "Ja"],
        ["Warmtepomp", "12 maanden", "Ja"],
        ["Boiler of warmwatertoestel", "24 maanden", "Ja"],
        ["Geiser", "12 maanden", "Ja"],
        ["Pomp of drukverhoging", "12 maanden", "Ja"],
        ["Waterontharder", "12 maanden", "Ja"],
      ],
    },
    features: [
      { icon: "build_circle", title: "Installatiepaspoort", body: "Merk, type, serienummer, garantie." },
      { icon: "event_repeat", title: "Contracten", body: "Beurten ontstaan automatisch." },
      { icon: "print", title: "Printbaar", body: "Paspoort voor de klant, als pdf." },
    ],
    links: [
      { href: "/blog/cv-ketel-storingen-najaar-voorbereiden", label: "Najaarsdrukte als loodgieter: zo bereid je je voor op cv-storingen" },
    ],
    faq: [
      { q: "Krijgt de klant bericht?", a: "Ja, automatisch wanneer een beurt aan de orde is." },
      { q: "Kan ik het interval aanpassen?", a: "Ja. De intervallen hierboven zijn startwaarden: je stelt per toestel de datum van het volgende onderhoud in en per contract het interval." },
      { q: "Wat als ik geen CO-vrij certificaat heb?", a: "Dan mag je niet aan gasverbrandingsinstallaties werken. Het systeem controleert dat niet voor je: zorg dat je certificaat geldig is." },
      { q: "Zit dit in elk pakket?", a: "Installatiepaspoort en onderhoudscontracten horen bij Pro en Elite." },
    ],
  },
  {
    slug: "werkbon-en-planbord",
    category: "Planning",
    tips: {
      title: "Zo leg je een klus goed vast",
      items: [
        "Noteer symptoom, oorzaak en wat je hebt gedaan, niet alleen de uren.",
        "Maak foto's van de situatie voor en na, en van het typeplaatje.",
        "Gebruik een checklist per soort klus, zodat niets wordt vergeten.",
        "Laat de klant tekenen bij oplevering van grotere klussen.",
      ],
    },
    metaTitle: "Werkbon op je telefoon en planbord",
    metaDescription:
      "Een werkbon op je telefoon met checklist per soort klus, foto's en handtekening, en een planbord met spoed bovenaan. Van werkbon naar factuur zonder overtypen.",
    badge: "Werkbon en planning",
    headline: "Van spoedoproep tot betaalde klus, zonder papier",
    intro:
      "Zet een klus op het planbord, werk hem af op je telefoon met checklist en foto's, en maak er met één klik een factuur van.",
    sections: [
      { title: "Planbord per monteur", body: "Je ziet wie waar werkt. Spoed staat bovenaan en overlappende klussen worden gemarkeerd. Klussen zonder datum staan apart klaar om in te plannen." },
      { title: "Werkbon op je telefoon", body: "Checklist per soort klus, foto's voor en na, werkverslag en opleverhandtekening met garantie. Je kunt de werkbon ook printen of als pdf bewaren." },
      { title: "Vakvelden in plaats van vrije tekst", body: "Bij een cv-storing vul je foutcode, merk en bouwjaar in, bij een lekkage de plek van het lek, bij onderhoud de meetwaarden. Zo ligt vast wat je zag, en vindt de volgende monteur het terug." },
      { title: "Opleverpagina voor de klant", body: "Na afronding stuur je de klant een link naar een pagina met het resultaat en de voor- en nafoto's, zonder prijzen of interne notities." },
      { title: "Van werkbon naar factuur", body: "Met één klik wordt de klus een factuur, met het IBAN erop en automatische betalingsherinneringen." },
    ],
    table: {
      title: "Een checklist en vakvelden per soort klus",
      headers: ["Soort klus", "Voorbeeld uit de checklist", "Vakvelden"],
      rows: [
        ["Lekkage", "Lekbron gelokaliseerd, druk- en dichtheidscontrole", "Waar is het lek, hoofdkraan bereikbaar"],
        ["Cv-storing", "Foutcode genoteerd, ketel getest onder belasting", "Foutcode, toestel, merk, bouwjaar"],
        ["Cv-onderhoud", "Rookgasanalyse gedaan, CO en CO₂ vastgelegd", "CO, CO₂, rookgastemperatuur, waterdruk, uitkomst"],
        ["Riool", "Camera-inspectie gedaan en beelden bewaard", "Waar is de verstopping"],
        ["Warmtepomp", "Koudemiddelcircuit door gecertificeerd monteur", "Type, isolatie, afgifte, groepenkast"],
        ["Badkamer", "Druk- en dichtheidsproef gedaan, oplevering met klant", "Oppervlak badkamer"],
      ],
    },
    features: [
      { icon: "calendar_view_week", title: "Planbord per monteur", body: "Spoed bovenaan." },
      { icon: "checklist", title: "Werkbon", body: "Checklist, foto's en handtekening." },
      { icon: "request_quote", title: "Factuur met één klik", body: "Zonder overtypen." },
    ],
    faq: [
      { q: "Kan ik per soort klus een eigen checklist gebruiken?", a: "Ja, er is een checklist per soort klus, van lekkage en ontstopping tot cv-onderhoud, riool, boiler en warmtepomp." },
      { q: "Worden foto's bij de klus bewaard?", a: "Ja, foto's voor en na worden bij de klus vastgelegd en staan ook in het fotodossier van de klant." },
      { q: "Kan de klant tekenen op mijn telefoon?", a: "Je legt bij oplevering de naam van de ondertekenaar vast en kunt een garantieperiode instellen. Daarna kan de klant het resultaat bekijken op de opleverpagina." },
      { q: "Is er een aparte app?", a: "Nee, je gebruikt LoodgietersAssistent in de browser van je telefoon." },
    ],
  },
  {
    slug: "warmtepomp-installateur-software",
    category: "Vakkennis",
    metaTitle: "Software voor warmtepomp-klussen",
    metaDescription:
      "Een warmtepomp-klus vraagt om opname, offerte en dossier. Zo leg je type, isolatie, groepenkast en meldcode vast en bewaar je het toestel in het installatiepaspoort.",
    badge: "Warmtepomp en hybride",
    headline: "Software voor warmtepomp-klussen: opname, offerte en dossier op één plek",
    intro:
      "Een warmtepomp plaatsen is langer, duurder en rommeliger dan een ketelstoring. LoodgietersAssistent geeft warmtepomp-klussen een eigen checklist, eigen velden en een offertepakket, zodat je opname, offerte en toestel terugvindt.",
    sections: [
      { title: "Een eigen soort klus voor warmtepompen", body: "Warmtepomp en hybride hebben een eigen categorie met een checklist, van opname en elektrische aansluiting tot inregelen en oplevering. De AI-receptie herkent een warmtepompvraag aan woorden als warmtepomp, hybride en aardgasvrij en legt adres en wens vast, zodat jij gericht kunt opnemen." },
      { title: "Opnamevelden voor wat telt", body: "Type oplossing (hybride, lucht-water, bodem-water of airco), woonoppervlak, isolatie, afgifte (vloerverwarming of radiatoren) en de ruimte in de groepenkast. Daarbij leg je vast of het werk aan het koudemiddelcircuit door jou of door een gecertificeerde partner gebeurt." },
      { title: "Offertepakket Hybride warmtepomp plaatsen", body: "Een kant-en-klaar pakket met opname, toestel, materiaal, arbeid en elektrawerk als aparte regels. Toestel en materiaal staan op nul, zodat je je eigen inkoop en marge invult. Zet de meldcode van het toestel in de omschrijving: de RVO vraagt die op de factuur voor de ISDE-subsidie." },
      { title: "Het toestel in het installatiepaspoort", body: "Merk, type, serienummer, installatiedatum en garantie van de warmtepomp komen in het installatiepaspoort, met een onderhoudsinterval van 12 maanden. Je print het voor de klant of slaat het op als pdf." },
      { title: "Foto's voor en na", body: "Opstelplek, typeplaatje, meterkast en leidingroute leg je vast bij de klus. De klant heeft voor de subsidie een foto van de installatie nodig, en jij hebt je bewijs." },
      { title: "Wat het systeem niet voor je regelt", body: "Het F-gassencertificaat, de ISDE-voorwaarden en welke werkzaamheden je mag uitvoeren blijven jouw verantwoordelijkheid. LoodgietersAssistent helpt je het vast te leggen, niet het te beoordelen. Subsidiebedragen noemt het systeem nooit." },
    ],
    features: [
      { icon: "heat_pump", title: "Eigen klussoort", body: "Checklist en vakvelden voor warmtepompen." },
      { icon: "request_quote", title: "Offertepakket", body: "Opname, toestel, arbeid en elektrawerk." },
      { icon: "build_circle", title: "Toestel in het paspoort", body: "Merk, serienummer, garantie, onderhoud." },
    ],
    tips: {
      title: "Wat je bij een warmtepomp-klus altijd vastlegt",
      items: [
        "Type, woonoppervlak, isolatie en afgifte vóór je offreert.",
        "Wie het koudemiddelwerk en het elektrawerk uitvoert.",
        "Merk, type, serienummer en meldcode van het toestel.",
        "Foto's van de opstelplek, het typeplaatje en de meterkast.",
        "Het onderhoudsinterval en een aanbod voor een onderhoudscontract.",
      ],
    },
    links: [
      { href: "/blog/warmtepomp-installeren-als-loodgieter", label: "Warmtepomp installeren als loodgieter: certificaten, ISDE en wat je vastlegt" },
    ],
    faq: [
      { q: "Regelt het systeem de ISDE-subsidie?", a: "Nee. De klant vraagt de subsidie zelf aan bij RVO. Jij zorgt voor een factuur met onder meer meldcode, installatiedatum, merk en typenummer en je bedrijfsgegevens." },
      { q: "Controleert het systeem mijn F-gassencertificaat?", a: "Nee. Je leg vast wie het koudemiddelwerk doet, maar het certificaat controleer en beheer je zelf." },
      { q: "Kan de AI een prijs voor een warmtepomp noemen?", a: "Nee. Hij legt adres en wens vast en verwijst naar een opname ter plaatse. Prijzen noemt hij alleen uit je eigen tarieven." },
      { q: "In welk pakket zit het offertepakket?", a: "Offertes zijn onderdeel van Pro. De klussoort met checklist en velden zit ook in Essential." },
    ],
  },
  {
    slug: "installatiepaspoort-software",
    category: "Onderhoud",
    metaTitle: "Digitaal installatiepaspoort",
    metaDescription:
      "Leg per adres vast wat er hangt: merk, serienummer, garantie en volgend onderhoud. Print het installatiepaspoort voor de klant en zie wat binnenkort aan de beurt is.",
    badge: "Installatiepaspoort",
    headline: "Digitaal installatiepaspoort: weet bij elke storing wat er hangt",
    intro:
      "Een klant belt met een foutcode en jij weet niet wat er hangt. Met een installatiepaspoort per adres leg je ketel, boiler of warmtepomp vast, met garantie en het volgende onderhoud.",
    sections: [
      { title: "Wat staat erin?", body: "Soort toestel, merk, type, serienummer, installatiedatum, garantie, laatste onderhoud en het volgende onderhoudsmoment, per adres en per toestel. Ook de bijzonderheden: waar de hoofdkraan zit en wat bij eerdere storingen is gedaan." },
      { title: "Waarom het je tijd bespaart", body: "Bij een storing weet je meteen wat er hangt en of er garantie op zit, dus kom je met de juiste onderdelen. Bij een offerte kun je onderbouwd vervanging adviseren, en bij een klacht kun je terugkijken wat is gedaan." },
      { title: "Printbaar voor de klant", body: "Per toestel maak je met één klik een printbaar document of pdf: eigenaar, adres, gegevens van het toestel en de onderhouds- en klushistorie, inclusief meetwaarden. Handig bij een verhuizing, een verhuurder of een garantievraag." },
      { title: "Onderhoud dat terugkomt", body: "Per type toestel staat een standaardinterval klaar; de datum van het volgende onderhoud stel je zelf in. Je ziet welke toestellen binnenkort of al te laat onderhoud nodig hebben, en met een onderhoudscontract ontstaat de klus vanzelf." },
      { title: "Zo begin je", body: "Je hoeft niet alle klanten in één keer in te voeren. Vul het paspoort aan bij elke storing, onderhoudsbeurt of installatie, en maak een foto van het typeplaatje. Na een jaar heb je van de meeste vaste klanten een compleet dossier." },
    ],
    features: [
      { icon: "build_circle", title: "Per adres en toestel", body: "Ketel, boiler, warmtepomp en meer." },
      { icon: "print", title: "Printbaar", body: "Document of pdf voor de klant." },
      { icon: "event_repeat", title: "Onderhoud in beeld", body: "Wat binnenkort aan de beurt is." },
    ],
    links: [
      { href: "/oplossingen/onderhoudscontracten", label: "Onderhoudscontracten die zichzelf plannen" },
    ],
    faq: [
      { q: "Is het installatiepaspoort een wettelijk document?", a: "Nee. Het is een overzicht dat je zelf bijhoudt op basis van wat je weet. Het vervangt geen wettelijk of fabrikantdocument." },
      { q: "Kan ik het paspoort aan de klant geven?", a: "Ja, je print het of slaat het op als pdf." },
      { q: "Welke toestellen kan ik vastleggen?", a: "Cv-ketel, warmtepomp, boiler, geiser, vloerverwarming, radiatoren, waterleiding en kranen, pompen, waterontharder, ventilatie, sanitair, riolering en overig." },
      { q: "Zit het in elk pakket?", a: "Het installatiepaspoort hoort bij Pro en Elite." },
    ],
  },
  {
    slug: "loodgieter-software-kiezen",
    category: "Vakkennis",
    metaTitle: "Software kiezen: de checklist",
    metaDescription:
      "Welke software past bij een loodgietersbedrijf? Een checklist met de vragen die je stelt over spoed, klusadressen, werkbon, offerte, onderhoud, kosten en privacy.",
    badge: "Kiezen",
    headline: "Loodgietersoftware kiezen: de checklist die je zelf kunt afvinken",
    intro:
      "Elke leverancier belooft alles in één. Met deze vragen zie je snel of software past bij hoe een loodgietersbedrijf werkt. Gebruik ze bij elke leverancier, ook bij ons.",
    sections: [
      { title: "1. Draait het om de klus of om de afspraak?", body: "Een loodgieter werkt op een adres, niet in een salon. Vraag of je een klusadres, toegangsinfo, een contactpersoon ter plaatse en foto's kunt vastleggen, en of een klant meerdere adressen kan hebben." },
      { title: "2. Wat gebeurt er met spoed?", body: "Vraag wie spoed opneemt als jij dat niet kunt, hoe snel jij het hoort en wat de klant te horen krijgt bij gaslucht of een gesprongen leiding. Een systeem dat een klant gerust stelt bij gevaar is onveilig." },
      { title: "3. Volgen offerte, werkbon en factuur dezelfde klus?", body: "Als je gegevens moet overtypen van offerte naar werkbon naar factuur, maak je fouten en verlies je tijd. Vraag ook of je toestel, materiaal en arbeid op aparte regels kunt zetten en het btw-tarief per regel kunt kiezen." },
      { title: "4. Kun je installaties en onderhoud bijhouden?", body: "Merk, serienummer, garantie en het volgende onderhoud per toestel, en contracten die vanzelf klussen aanmaken. Dat is je terugkerende omzet." },
      { title: "5. Kun je vastleggen wat je mat?", body: "Bij cv-onderhoud wil je CO, CO₂ en rookgastemperatuur bij de klus bewaren, zodat je bij een klacht kunt laten zien wat je toen deed." },
      { title: "6. Wat kost het echt?", body: "Kijk naar het totaal per maand: abonnement, kosten per gesprek of bericht en eventuele opstartkosten. Vraag of je per maand kunt opzeggen." },
      { title: "7. Wat gebeurt er met de privacy van je klanten?", body: "Vraag naar een verwerkersovereenkomst, een lijst met subverwerkers en wat er met opgenomen gesprekken gebeurt. Een AI die met klanten praat, moet zeggen dat hij een AI is." },
      { title: "8. Wat kan het niet?", body: "Goede leveranciers zijn eerlijk over wat ze niet doen. Bij LoodgietersAssistent: geen boekhoudpakket (koppelingen met Moneybird, e-Boekhouden en Exact Online staan op de planning), geen voorraadbeheer en geen urenregistratie per monteur. Zeker weten wat je mist, is beter dan het achteraf ontdekken." },
    ],
    table: {
      title: "De checklist in één oogopslag",
      headers: ["Vraag", "Wat je zoekt", "LoodgietersAssistent"],
      rows: [
        ["Klusadres en meerdere adressen", "Adres, toegangsinfo, contactpersoon, foto's", "Ja"],
        ["Spoed opnemen als jij niet kunt", "AI of mens die opneemt en jou direct meldt", "Ja, AI-receptie 24/7"],
        ["Offerte, werkbon en factuur aan elkaar", "Eén klus, niets overtypen", "Ja"],
        ["Installaties en onderhoudscontracten", "Toestel per adres, beurten vanzelf", "Ja (Pro)"],
        ["Meetwaarden bij cv-onderhoud", "CO, CO₂, temperatuur en uitkomst", "Ja"],
        ["Boekhoudkoppeling", "Moneybird, e-Boekhouden, Exact Online", "Gepland, nog niet beschikbaar"],
        ["Voorraad en urenregistratie", "Magazijn en uren per monteur", "Nee"],
        ["Kosten", "Vast bedrag, opzegbaar per maand", "Vanaf €149 per maand, geen kosten per gesprek"],
      ],
    },
    features: [
      { icon: "checklist", title: "Acht vragen", body: "Zo vergelijk je leveranciers eerlijk." },
      { icon: "fact_check", title: "Eerlijk over beperkingen", body: "Wat wel en wat niet." },
      { icon: "paid", title: "Vaste kosten", body: "Geen kosten per gesprek." },
    ],
    links: [
      { href: "/oplossingen/software-voor-loodgieters", label: "Software voor loodgieters: wat zit erin?" },
      { href: "/prijzen", label: "Prijzen van LoodgietersAssistent" },
    ],
    faq: [
      { q: "Wat is het belangrijkste bij het kiezen van software voor een loodgietersbedrijf?", a: "Dat het om de klus draait: klusadres, spoed, werkbon, offerte en onderhoud in één dossier, en dat je weet wat de software niet kan." },
      { q: "Kan ik eerst kijken zonder te betalen?", a: "Doe de gratis scan en plan een kennismaking. Je bent binnen 48 uur werkend, en per maand opzegbaar." },
      { q: "Moet ik mijn boekhouding aanpassen?", a: "Nee. Er is nog geen koppeling met boekhoudpakketten; facturen bevatten alle wettelijk verplichte gegevens en je kunt ze gewoon doorgeven aan je boekhouder." },
      { q: "Is een AI-receptie geschikt voor spoed?", a: "Ja, mits hij veiligheidstips geeft, spoed direct meldt en bij gevaar doorverbindt in plaats van gerust te stellen. Vraag dat bij elke leverancier." },
    ],
  },
];
