/**
 * Handleiding per dashboardonderdeel, in de taal van de vakman. Voedt drie
 * plekken: de tooltip in de zijbalk (`short`), de uitleg-tooltips bij
 * kengetallen (GUIDE_TIPS) en de volledige pagina /dashboard/handleiding.
 * Beschrijf hier alleen wat het product echt doet (zie lib/verticals/hovenier.ts
 * en de dashboardpagina's); verzin nooit functies bij.
 */
import type { NavKey } from "@/lib/verticals/types";

export interface GuideEntry {
  /** Eén zin voor de tooltip in de zijbalk. */
  short: string;
  /** Wat het onderdeel doet, in gewone taal. */
  what: string;
  /** Concrete stappen: zo gebruik je het. */
  steps: string[];
  /** Eén praktijktip uit het vak, voor het vak. */
  tip?: string;
}

export const HOVENIER_GUIDE: Partial<Record<NavKey, GuideEntry>> = {
  overview: {
    short: "Jouw dag in één oogopslag: spoed, vandaag en wat nog gepland moet worden.",
    what: "Het startscherm laat zien wat vandaag aandacht nodig heeft: stormschade en spoed bovenaan, de klussen van vandaag en de aanvragen die nog een datum missen.",
    steps: [
      "Begin je dag hier en werk van boven naar beneden.",
      "Klik op een klus om direct naar de details, het adres en de foto's te gaan.",
      "Zie je 'Te plannen'? Zet die klussen op het planbord en de klant krijgt vanzelf bericht.",
    ],
    tip: "Open dit scherm op je telefoon in de auto (als bijrijder) of bij de koffie: 30 seconden en je weet waar je heen moet.",
  },
  jobs: {
    short: "Elke aanvraag als klus: van eerste telefoontje of app-bericht tot betaalde factuur.",
    what: "Een klus is één stuk werk op één tuinadres. De AI-receptie zet aanvragen van telefoon en WhatsApp automatisch als klus klaar, inclusief adres, omschrijving en foto's. Jij pakt hem op, plant hem in, werkt hem af met de checklist en factureert.",
    steps: [
      "Klik op 'Nieuwe klus' voor een klus die je zelf aanmaakt, of open een klus die de AI al heeft vastgelegd.",
      "Kies de soort werk (onderhoud, aanleg, bestrating, snoeien, bomen, gazon of stormschade). De checklist en de geschatte tijd vullen zich vanzelf.",
      "Vul de tuinvelden in: oppervlak, bereikbaarheid, groenafvoer, kabels en leidingen, boomhoogte en buitenkraan/stroom. Dat scheelt een extra bezoek.",
      "Maak een offerte, plan de klus in, vink tijdens het werk de checklist af en maak voor- en nafoto's.",
      "Rond af met een factuur. De klus loopt zo van aanvraag tot betaling in één dossier.",
    ],
    tip: "Spoedklussen (stormschade) staan automatisch bovenaan onder 'Spoed — nu oppakken'. Pak die eerst op.",
  },
  planner: {
    short: "Weekplanning per hovenier of ploeg. Sleep niets kwijt: wie werkt waar en wanneer.",
    what: "Het planbord toont de week met alle ingeplande klussen per medewerker. Klussen zonder datum staan apart klaar, zodat je ze makkelijk kunt inplannen.",
    steps: [
      "Kies de week met de pijlen bovenin.",
      "Open een klus uit 'Te plannen' en geef een datum, starttijd en hovenier of ploeg.",
      "Controleer dat er geen dubbele boekingen staan: het planbord laat per persoon zien wat er al ligt.",
      "Verschuif een klus bij slecht weer door de datum in de klus te wijzigen.",
    ],
    tip: "Plan buitenwerk met de weersverwachting in de hand en houd een paar 'weeruren' vrij per week voor uitloop.",
  },
  customers: {
    short: "Al je klanten met hun tuinen, adressen, klushistorie en foto's op één plek.",
    what: "Per klant zie je alle adressen, alle klussen die je ooit deed, offertes en facturen. Per adres bouw je een tuinpaspoort op: gazon, haag, bomen, vijver en beregening, met wanneer het volgende onderhoud aan de beurt is.",
    steps: [
      "Zoek een klant op naam of telefoonnummer.",
      "Open het dossier en voeg zo nodig extra adressen toe (tweede woning, verhuurpand).",
      "Leg per adres vast wat er in de tuin staat, zodat je bij de volgende klus niet opnieuw hoeft te vragen.",
      "Bekijk het fotodossier: voor- en nafoto's per klus, handig bij discussie of als portfolio.",
    ],
    tip: "Foto's van de tuin vóór je begint zijn je beste verzekering tegen 'dat was eerst niet zo'.",
  },
  billing: {
    short: "Offertes die klanten online accepteren en facturen met betaallink en herinneringen.",
    what: "Vanuit een klus maak je een offerte met regels (uren, m², m³, stuks). De klant krijgt een link, bekijkt en accepteert online. Daarna maak je met één klik de factuur, met IBAN en betaallink. Betalingsherinneringen gaan automatisch.",
    steps: [
      "Open een klus en kies 'Offerte maken'. Voeg regels toe met eenheid en btw-tarief.",
      "Verstuur de offerte. De klant accepteert online; je ziet direct de status.",
      "Is het werk klaar? Maak de factuur vanuit dezelfde klus, dan hoef je niets over te typen.",
      "Volg in de lijst wat openstaat en wat betaald is.",
    ],
    tip: "Bij tuinaanleg en bestrating: vraag een aanbetaling bij het inplannen. Dat scheelt afzeggers op het laatste moment.",
  },
  maintenance: {
    short: "Terugkerend werk: contracten die zelf een klus en klantbericht aanmaken, binnen het seizoen.",
    what: "Een onderhoudscontract koppelt een tuin aan een vaste ronde (bijvoorbeeld elke 4 weken maaien) binnen jouw seizoen, van maart tot en met oktober. Als een beurt aan de beurt is, ontstaat er automatisch een klus én gaat er een herinnering naar de klant.",
    steps: [
      "Maak een contract voor een klant en adres en kies de frequentie in weken.",
      "Stel het seizoen in; buiten het seizoen maakt het systeem geen klussen aan.",
      "Kijk hier welke beurten binnenkort aan de beurt zijn en welke al zijn aangemaakt.",
      "Pas een contract aan of zet het op pauze als de klant verhuist of opzegt.",
    ],
    tip: "Contracten zijn je voorspelbare omzet. Bied elke klant na een aanleg direct een seizoenscontract aan.",
  },
  ai: {
    short: "Jouw AI-receptionist: neemt telefoon en WhatsApp op, ook als jij in de tuin staat.",
    what: "De AI-receptie beantwoordt klanten 24/7 in gewoon Nederlands, vraagt naar adres, soort werk en foto's, legt de klus vast en verbindt door bij stormschade of als het niet lukt. Klanten horen of lezen altijd dat ze met een AI-assistent praten.",
    steps: [
      "Controleer per kanaal (telefoon, WhatsApp) of het actief staat.",
      "Test het zelf: stuur een WhatsApp-bericht met een klusvraag en kijk wat er in Klussen verschijnt.",
      "Zet je diensten en tarieven goed onder 'Diensten & team', dan geeft de AI juiste informatie.",
      "De AI noemt geen vaste prijzen; ze legt de aanvraag vast en jij maakt de offerte.",
    ],
    tip: "Zet je telefoon bij 'geen gehoor' door naar de AI. Je mist geen klus meer terwijl je de bosmaaier vasthebt.",
  },
  conversations: {
    short: "Alle gesprekken die de AI heeft gevoerd, zodat je altijd kunt teruglezen wat is afgesproken.",
    what: "Hier staan de WhatsApp- en telefoongesprekken die de AI heeft afgehandeld. Je kunt terugkijken wat de klant vroeg en wat de AI heeft vastgelegd.",
    steps: [
      "Open een gesprek om het hele verloop te lezen.",
      "Zie je dat iets niet klopt? Pas de klus aan of neem contact op met de klant.",
      "Gebruik het voor training: zie welke vragen klanten het vaakst stellen.",
    ],
  },
  escalations: {
    short: "Stormschade en gesprekken die de AI aan jou overdraagt. Direct overnemen, zonder herhaling.",
    what: "Als de situatie te belangrijk of te gevaarlijk is voor de AI (omgevallen boom, tak op een kabel, boom op de weg), draagt de AI het gesprek over. Op Pro kan een gesprek direct worden doorgezet naar de hovenier van dienst.",
    steps: [
      "Open een escalatie: je ziet wat de klant vertelde en wat al is vastgelegd.",
      "Bel of app de klant terug. Je hoeft niets opnieuw uit te vragen.",
      "Zet daarna de klus op het planbord of markeer de escalatie als afgehandeld.",
    ],
    tip: "Bij stormschade eerst veiligheid: de AI adviseert de klant afstand te houden van kabels en gevallen bomen.",
  },
  practice: {
    short: "Je diensten, tarieven en team: de basis waar AI, offertes en planbord op draaien.",
    what: "Hier leg je vast wat je aanbiedt (met duur, prijs en btw-tarief) en wie er bij je werkt. Offertes, planbord en de AI gebruiken deze gegevens.",
    steps: [
      "Start met de voorbeeldcatalogus en pas de tarieven aan naar jouw prijzen.",
      "Voeg je hoveniers en ploegen toe, zodat je klussen aan mensen kunt toewijzen.",
      "Controleer de bedrijfsgegevens; die komen op offertes en facturen.",
    ],
  },
  reports: {
    short: "Cijfers over je bedrijf van de afgelopen 30 dagen.",
    what: "Een overzicht van klussen, annuleringen en omzet in de afgelopen 30 dagen, zodat je ziet waar je bedrijf staat.",
    steps: [
      "Bekijk de kengetallen bovenaan.",
      "Vergelijk met vorige periodes om seizoenspieken te herkennen.",
    ],
  },
  retention: {
    short: "Vraag reviews en haal klanten terug die een tijd niets hebben laten doen.",
    what: "Na een afgeronde klus kan de klant een reviewverzoek krijgen via WhatsApp. Klanten die lang niets meer hebben laten doen, krijgen een vriendelijk bericht om weer af te spreken.",
    steps: [
      "Controleer of reviewverzoeken en terughaalberichten aan staan.",
      "Voeg je Google-reviewlink toe, zodat klanten met één tik kunnen reageren.",
      "Bekijk welke klanten binnenkort een bericht krijgen.",
    ],
    tip: "Reviews vragen direct na oplevering, met een mooie nafoto, geeft de meeste reacties.",
  },
  noshow: {
    short: "Regels voor afzeggingen en voorrijkosten, zodat afzeggen op het laatste moment geld kost.",
    what: "Hier stel je in hoe je omgaat met afzeggingen en voorrijkosten. De AI en de herinneringen volgen dit beleid.",
    steps: [
      "Kies de termijn waarbinnen kosteloos afzeggen kan.",
      "Stel voorrijkosten of een aanbetaling in voor grotere klussen.",
      "Controleer de tekst die klanten te zien krijgen.",
    ],
  },
  integrations: {
    short: "Koppel telefoon en WhatsApp aan je AI-receptie.",
    what: "Hier verbind je de kanalen waar klanten je bereiken. Zodra een kanaal is gekoppeld, kan de AI berichten en gesprekken afhandelen.",
    steps: [
      "Kies het kanaal dat je wilt koppelen (telefoon of WhatsApp).",
      "Volg de stappen op het scherm; de status springt op 'actief' als het lukt.",
      "Lukt het niet? Open het hulpartikel 'Mijn koppeling werkt niet' of vraag de AI-supportchat.",
    ],
  },
  subscription: {
    short: "Je plan, facturatie en upgrade-opties.",
    what: "Bekijk welk plan je hebt (Essential, Pro of Elite), wanneer je wordt gefactureerd en wat je erbij krijgt als je upgradet.",
    steps: [
      "Vergelijk de plannen om te zien welke functies erbij horen.",
      "Upgrade of downgrade wanneer je bedrijf groeit of krimpt.",
      "Download je facturen bij het onderdeel facturatie.",
    ],
  },
  support: {
    short: "Vraag hulp: zoek een artikel, chat met de AI of maak een ticket aan.",
    what: "Loop je ergens tegenaan? Zoek in de hulpartikelen, vraag de support-AI of stuur een ticket naar ons team.",
    steps: [
      "Klik rechtsonder op de chat voor een snel antwoord.",
      "Komt het niet goed? Maak een ticket aan met een korte omschrijving en eventueel een screenshot.",
    ],
  },
};

export const LOODGIETER_GUIDE: Partial<Record<NavKey, GuideEntry>> = {
  overview: {
    short: "Jouw dag in één oogopslag: spoed, vandaag en wat nog gepland moet worden.",
    what: "Het startscherm laat zien wat vandaag aandacht nodig heeft: spoed (lekkage, gaslucht) bovenaan, de klussen van vandaag en de aanvragen die nog een datum missen.",
    steps: [
      "Begin je dag hier en werk van boven naar beneden.",
      "Klik op een klus om direct naar het adres, de omschrijving en de foto's te gaan.",
      "Zie je 'Te plannen'? Zet die klussen op het planbord, dan krijgt de klant vanzelf bericht.",
    ],
    tip: "Open dit scherm op je telefoon voor je de bus uitrijdt: 30 seconden en je weet waar je als eerste heen moet.",
  },
  jobs: {
    short: "Elke aanvraag als klus: van eerste telefoontje of app-bericht tot betaalde factuur.",
    what: "Een klus is één stuk werk op één adres. De AI-receptie zet aanvragen van telefoon en WhatsApp automatisch als klus klaar, met adres, omschrijving en foto's. Jij pakt hem op, plant hem in, werkt hem af met de checklist en factureert.",
    steps: [
      "Klik op 'Nieuwe klus' voor een klus die je zelf aanmaakt, of open een klus die de AI al heeft vastgelegd.",
      "Kies de soort werk (lekkage, cv-storing, riool, warmtepomp, badkamer en meer). De checklist en de geschatte tijd vullen zich vanzelf.",
      "Vul de vakvelden in: bij cv-storing de foutcode en het toestel, bij lekkage de plek, bij onderhoud de meetwaarden (CO, CO₂, rookgastemperatuur, waterdruk).",
      "Plan de klus in, vink tijdens het werk de checklist af en maak voor- en nafoto's.",
      "Laat de klant ondertekenen bij oplevering, met garantie, en rond af met een factuur.",
    ],
    tip: "Spoedklussen staan automatisch bovenaan. Maak voor- en nafoto's van elke lekkage: dat is je bewijs richting verzekeraar.",
  },
  planner: {
    short: "Weekplanning per monteur: wie is waar en wanneer, met spoed bovenaan.",
    what: "Het planbord toont de week met alle ingeplande klussen per monteur. Klussen zonder datum staan apart klaar, zodat je ze makkelijk kunt inplannen. Overlappende klussen worden gemarkeerd.",
    steps: [
      "Kies de week met de pijlen bovenin.",
      "Open een klus uit 'Te plannen' en geef een datum, starttijd en monteur.",
      "Controleer of er geen overlap is: het planbord markeert dubbele boekingen.",
      "Schuif een klus naar een andere dag door de datum in de klus te wijzigen.",
    ],
    tip: "Houd per dag een uur ruimte vrij voor spoed: dan hoef je niet de hele dag om te gooien bij een gesprongen leiding.",
  },
  customers: {
    short: "Al je klanten met hun adressen, installaties, klushistorie en foto's op één plek.",
    what: "Per klant zie je alle adressen, alle klussen, offertes en facturen. Per adres bouw je een installatiepaspoort op: ketel, boiler, warmtepomp en meer, met merk, serienummer, garantie en wanneer het volgende onderhoud aan de beurt is. Dat paspoort kun je printen of als pdf opslaan.",
    steps: [
      "Zoek een klant op naam of telefoonnummer.",
      "Open het dossier en voeg zo nodig extra adressen toe (tweede woning, verhuurpand).",
      "Leg per adres de installaties vast. Bij een storing weet je meteen wat er hangt en of er garantie op zit.",
      "Klik bij een installatie op 'Installatiepaspoort' om het document te printen voor de klant.",
    ],
    tip: "Maak een foto van het typeplaatje van elke ketel die je tegenkomt. Dan heb je merk, type en serienummer direct paraat.",
  },
  billing: {
    short: "Offertes die klanten online accepteren en facturen met betaallink en herinneringen.",
    what: "Vanuit een klus maak je een offerte met regels (uren, stuks, meters, punten, posten). De klant krijgt een link, bekijkt en accepteert online. Daarna maak je met één klik de factuur, met IBAN en betaallink. Betalingsherinneringen gaan automatisch.",
    steps: [
      "Open een klus en kies 'Offerte maken'. Voeg regels toe met eenheid en btw-tarief.",
      "Gebruik het btw-tarief dat voor die klus geldt: 21% is de standaard, het verlaagde tarief op arbeid kan bij een woning ouder dan 2 jaar gelden. Controleer dit bij de Belastingdienst.",
      "Verstuur de offerte. De klant accepteert online; je ziet direct de status.",
      "Is het werk klaar? Maak de factuur vanuit dezelfde klus, dan hoef je niets over te typen.",
    ],
    tip: "Zet materiaal en arbeid op aparte regels. Dat maakt een offerte duidelijk en meerwerk achteraf makkelijker te onderbouwen.",
  },
  maintenance: {
    short: "Onderhoudscontracten: elke beurt wordt vanzelf een klus en de klant krijgt bericht.",
    what: "Een onderhoudscontract koppelt een installatie, bijvoorbeeld een cv-ketel, aan een vast interval. Als een beurt aan de beurt is, ontstaat er automatisch een klus én gaat er een herinnering naar de klant. Je ziet ook welke installaties binnenkort onderhoud nodig hebben.",
    steps: [
      "Maak een contract voor een klant en adres, kies de installatie en het interval.",
      "Kijk hier welke beurten binnenkort aan de beurt zijn en welke al zijn aangemaakt.",
      "Pas een contract aan of zet het op pauze als de klant verhuist of opzegt.",
    ],
    tip: "Bied elke klant na een ketelvervanging direct een onderhoudscontract aan. Dat is je voorspelbare omzet.",
  },
  ai: {
    short: "Jouw AI-receptionist: neemt telefoon en WhatsApp op, ook als jij onder een gootsteen ligt.",
    what: "De AI-receptie beantwoordt klanten 24/7 in gewoon Nederlands, vraagt naar adres, probleem en foto's, herkent spoed, legt de klus vast en verbindt door bij gevaar. Klanten horen of lezen altijd dat ze met een AI-assistent praten.",
    steps: [
      "Controleer per kanaal (telefoon, WhatsApp) of het actief staat.",
      "Test het zelf: stuur een WhatsApp-bericht met een lekkage en kijk wat er in Klussen verschijnt.",
      "Zet je diensten en tarieven goed onder 'Diensten & team', dan geeft de AI juiste informatie.",
      "De AI noemt geen prijzen buiten je tarieven en geeft geen diagnose: ze legt de aanvraag vast en jij beoordeelt.",
    ],
    tip: "Zet je telefoon bij 'geen gehoor' door naar de AI. Dan mis je geen spoedoproep meer, ook niet 's avonds.",
  },
  conversations: {
    short: "Alle gesprekken die de AI heeft gevoerd, zodat je altijd kunt teruglezen wat is afgesproken.",
    what: "Hier staan de WhatsApp- en telefoongesprekken die de AI heeft afgehandeld. Je kunt terugkijken wat de klant vroeg en wat de AI heeft vastgelegd.",
    steps: [
      "Open een gesprek om het hele verloop te lezen.",
      "Klopt iets niet? Pas de klus aan of neem contact op met de klant.",
      "Gebruik het om te zien welke vragen klanten het vaakst stellen.",
    ],
  },
  escalations: {
    short: "Spoed en gesprekken die de AI aan jou overdraagt. Direct overnemen, zonder herhaling.",
    what: "Bij gaslucht, een gesprongen leiding of een andere onveilige situatie stelt de AI de klant niet gerust maar draagt het gesprek over. Je krijgt direct een melding. Op Pro kan een gesprek direct worden doorgezet naar de monteur van dienst.",
    steps: [
      "Open een escalatie: je ziet wat de klant vertelde en wat al is vastgelegd.",
      "Bel de klant terug. Je hoeft niets opnieuw uit te vragen.",
      "Zet daarna de klus op het planbord of markeer de escalatie als afgehandeld.",
    ],
    tip: "Bij gaslucht adviseert de AI ramen open, geen vuur of schakelaars en het pand verlaten, en de netbeheerder bellen (0800-9009). Bij acuut gevaar 112.",
  },
  practice: {
    short: "Je diensten, tarieven en team: de basis waar AI, offertes en planbord op draaien.",
    what: "Hier leg je vast wat je aanbiedt (met duur, prijs en btw-tarief) en wie er bij je werkt. Offertes, planbord en de AI gebruiken deze gegevens.",
    steps: [
      "Start met de voorbeeldcatalogus en pas de tarieven aan naar jouw prijzen. De voorbeeldprijzen zijn alleen een startpunt.",
      "Voeg je monteurs toe, zodat je klussen aan mensen kunt toewijzen.",
      "Controleer de bedrijfsgegevens; die komen op offertes en facturen.",
    ],
  },
  reports: {
    short: "Cijfers over je bedrijf van de afgelopen 30 dagen.",
    what: "Een overzicht van klussen, annuleringen en omzet in de afgelopen 30 dagen, zodat je ziet waar je bedrijf staat.",
    steps: [
      "Bekijk de kengetallen bovenaan.",
      "Vergelijk met vorige periodes om pieken (vorst, begin van het stookseizoen) te herkennen.",
    ],
  },
  retention: {
    short: "Vraag reviews en haal klanten terug die een tijd niets hebben laten doen.",
    what: "Na een afgeronde klus kan de klant een reviewverzoek krijgen via WhatsApp. Klanten die lang niets meer hebben laten doen, krijgen een vriendelijk bericht.",
    steps: [
      "Controleer of reviewverzoeken en terughaalberichten aan staan.",
      "Voeg je Google-reviewlink toe, zodat klanten met één tik kunnen reageren.",
      "Bekijk welke klanten binnenkort een bericht krijgen.",
    ],
    tip: "Vraag een review direct na een spoedklus. Een klant die net geholpen is, reageert het snelst.",
  },
  noshow: {
    short: "Regels voor afzeggingen en voorrijkosten, zodat afzeggen op het laatste moment geld kost.",
    what: "Hier stel je in hoe je omgaat met afzeggingen en voorrijkosten. De AI en de herinneringen volgen dit beleid.",
    steps: [
      "Kies de termijn waarbinnen kosteloos afzeggen kan.",
      "Stel voorrijkosten of een aanbetaling in voor grotere klussen.",
      "Controleer de tekst die klanten te zien krijgen.",
    ],
  },
  integrations: {
    short: "Koppel telefoon, WhatsApp en je boekhouding aan LoodgietersAssistent.",
    what: "Hier verbind je de kanalen waar klanten je bereiken en je boekhoudpakket. Zodra een kanaal is gekoppeld, kan de AI berichten en gesprekken afhandelen.",
    steps: [
      "Kies het kanaal dat je wilt koppelen (telefoon of WhatsApp).",
      "Volg de stappen op het scherm; de status springt op 'actief' als het lukt.",
      "Lukt het niet? Open het hulpartikel 'Mijn koppeling werkt niet' of vraag de AI-supportchat.",
    ],
  },
  subscription: {
    short: "Je plan, facturatie en upgrade-opties.",
    what: "Bekijk welk plan je hebt (Essential, Pro of Elite), wanneer je wordt gefactureerd en wat je erbij krijgt als je upgradet.",
    steps: [
      "Vergelijk de plannen om te zien welke functies erbij horen.",
      "Upgrade of downgrade wanneer je bedrijf groeit of krimpt.",
      "Download je facturen bij het onderdeel facturatie.",
    ],
  },
};

const GUIDE_TIPS_LOODGIETER = {
  urgentOpen: "Spoedklussen die nog niet zijn afgerond, zoals lekkage of gaslucht. Pak deze eerst op.",
  toSchedule: "Klussen die nog geen datum of monteur hebben. Plan ze in op het planbord.",
  scheduledToday: "Klussen die vandaag op het planbord staan.",
  inProgress: "Klussen waar je monteurs nu mee bezig zijn.",
} as const;

/** Uitleg bij kengetallen en velden, gekoppeld aan een korte sleutel. */
export const GUIDE_TIPS = {
  urgentOpen: "Spoedklussen die nog niet zijn afgerond, zoals stormschade. Pak deze eerst op.",
  toSchedule: "Klussen die nog geen datum of hovenier hebben. Plan ze in op het planbord.",
  scheduledToday: "Klussen die vandaag op het planbord staan.",
  inProgress: "Klussen waar je ploeg nu mee bezig is.",
} as const;

/** Kengetal-uitleg in de woorden van het vak (hovenier is de standaard). */
export function guideTipsFor(verticalId: string): Record<keyof typeof GUIDE_TIPS, string> {
  return verticalId === "loodgieter" ? GUIDE_TIPS_LOODGIETER : GUIDE_TIPS;
}

const GUIDES: Record<string, Partial<Record<NavKey, GuideEntry>>> = {
  hovenier: HOVENIER_GUIDE,
  loodgieter: LOODGIETER_GUIDE,
};

export function guideFor(verticalId: string, key: NavKey): GuideEntry | undefined {
  return GUIDES[verticalId]?.[key];
}
