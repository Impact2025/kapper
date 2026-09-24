/**
 * Hulpcentrum-content. Bewust in code (versiebeheerd, reviewbaar, werkt zonder
 * database) — dezelfde bron voedt de zoekfunctie, de FAQ-JSON-LD én de
 * support-chat (RAG). Alleen feiten die ook in plans.ts, de prijzen-FAQ,
 * /diensten en de privacyverklaring staan; verzin hier nooit functies bij.
 */

import { PLANS } from "@/lib/plans";

const PRICE = Object.fromEntries(PLANS.map((p) => [p.id, p.price])) as Record<string, number>;
const eur = (n: number) => `€${n}`;

export type HelpAudience = "prospect" | "salon" | "both";

export interface HelpCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
}

export interface HelpArticle {
  slug: string;
  title: string;
  category: string;
  /** Eén-zin antwoord: dit is ook het FAQ-antwoord in de JSON-LD. */
  summary: string;
  /** Markdown (zie lib/blog/markdown.ts voor de ondersteunde subset). */
  body: string;
  keywords: string[];
  audience: HelpAudience;
  /** Slugs van gerelateerde artikelen. */
  related?: string[];
}

export const HELP_CATEGORIES: HelpCategory[] = [
  { id: "aan-de-slag", title: "Aan de slag", icon: "rocket_launch", description: "Wat KapperAssistent is en hoe je start." },
  { id: "prijzen-abonnement", title: "Prijzen & abonnement", icon: "credit_card", description: "Plannen, proefperiode, opzeggen en facturen." },
  { id: "koppelingen", title: "Agenda & WhatsApp", icon: "cable", description: "Koppelingen met je agenda en WhatsApp Business." },
  { id: "ai-receptie", title: "AI-receptie", icon: "smart_toy", description: "Hoe de AI boekt, doorverbindt en bereikbaar is." },
  { id: "klanten-dossier", title: "Klanten & dossier", icon: "folder_shared", description: "Klantdossier, foto's, reviews en terugkerende klanten." },
  { id: "no-shows-kassa", title: "No-shows & kassa", icon: "event_busy", description: "Herinneringen, aanbetalingen en afrekenen." },
  { id: "privacy-veiligheid", title: "Privacy & veiligheid", icon: "shield", description: "AVG, AI Act, bewaartermijnen en jouw rechten." },
  { id: "account-support", title: "Account & hulp", icon: "support_agent", description: "Inloggen, wachtwoord, support en tickets." },
];

export const HELP_ARTICLES: HelpArticle[] = [
  /* ============================ Aan de slag ============================ */
  {
    slug: "wat-is-kapperassistent",
    title: "Wat is KapperAssistent?",
    category: "aan-de-slag",
    summary:
      "KapperAssistent is de AI-receptioniste voor je salon: ze beantwoordt WhatsApp en telefoon, boekt afspraken in je agenda en stuurt herinneringen — ook buiten openingstijden.",
    body: `KapperAssistent is een AI-receptioniste voor kapsalons. Ze werkt naast je eigen agenda-software en neemt het herhalende werk over:

- Berichten op **WhatsApp** beantwoorden en direct afspraken boeken, 24/7
- Ook de **telefoon** opnemen, dag en nacht
- **Herinneringen** sturen om no-shows te verminderen
- Klanten die lang wegblijven **vanzelf een berichtje** sturen

Jij blijft de baas: bij lastige vragen zet de AI het gesprek door naar jou of een collega.

Bekijk de [prijzen](/prijzen) of doe de [gratis AI-scan](/scan) om te zien wat het voor jouw salon kan opleveren.`,
    keywords: ["wat is", "uitleg", "ai receptioniste", "kapsalon", "overzicht"],
    audience: "both",
    related: ["hoe-start-ik", "welke-plannen-zijn-er", "is-het-een-echt-mens"],
  },
  {
    slug: "hoe-start-ik",
    title: "Hoe start ik met KapperAssistent?",
    category: "aan-de-slag",
    summary:
      "Start met een gratis proefperiode van 14 dagen zonder creditcard; ons team koppelt je agenda, importeert je prijslijst en activeert WhatsApp voor je.",
    body: `Starten gaat in drie stappen:

1. **Kies een plan** en start de gratis proefperiode van 14 dagen — geen creditcard nodig.
2. **Wij doen de techniek:** we koppelen je agenda, importeren je prijslijst en diensten en activeren het WhatsApp Business-account op jouw naam (eenmalige setup vanaf €250).
3. **Test en ga live:** je probeert de assistent uit en zet hem aan als je tevreden bent.

Na het inloggen leidt de setup in je dashboard je door de laatste stappen.`,
    keywords: ["starten", "beginnen", "onboarding", "setup", "proefperiode", "aanmelden"],
    audience: "both",
    related: ["wat-houdt-de-setup-fee-in", "hoe-lang-duurt-de-setup", "gratis-proefperiode"],
  },
  {
    slug: "hoe-lang-duurt-de-setup",
    title: "Hoe lang duurt het voordat mijn assistent live is?",
    category: "aan-de-slag",
    summary:
      "De techniek regelt ons team; hoe snel je live gaat hangt vooral af van je agenda-koppeling en het activeren van je WhatsApp Business-account.",
    body: `Jij hoeft niets technisch te doen. Wij koppelen de agenda, importeren je diensten en prijzen en activeren WhatsApp. De doorlooptijd hangt vooral af van:

- of je agenda-software al klaarstaat voor een koppeling (Salonized, Phorest of Treatwell)
- de goedkeuring van je WhatsApp Business-account
- hoe compleet je prijslijst en diensten zijn

We geven je bij de start een realistische planning. Loop je vast? [Maak een ticket](/contact) en we kijken mee.`,
    keywords: ["setup", "live", "doorlooptijd", "hoe lang", "activeren", "planning"],
    audience: "both",
    related: ["hoe-start-ik", "welke-agenda-systemen-worden-ondersteund"],
  },
  {
    slug: "voor-welke-salons",
    title: "Voor welke salons is KapperAssistent geschikt?",
    category: "aan-de-slag",
    summary:
      "Van solo-stylist tot keten: Essential voor solo en kleine salons, Pro voor salons met 3 tot 10 stoelen en Elite voor grote salons en ketens.",
    body: `Er is een plan voor elke salongrootte:

- **Essential** — solo-stylisten en kleine salons
- **Pro** — midden-grote salons (3–10 stoelen)
- **Elite** — grote salons en ketens met meerdere vestigingen

Onzeker welk plan past? Doe de [gratis AI-scan](/scan) of lees [welke plannen er zijn](/help/welke-plannen-zijn-er).`,
    keywords: ["geschikt", "solo", "keten", "kleine salon", "grote salon", "stoelen"],
    audience: "prospect",
    related: ["welke-plannen-zijn-er"],
  },
  {
    slug: "is-het-een-echt-mens",
    title: "Weten klanten dat ze met een AI praten?",
    category: "aan-de-slag",
    summary:
      "Ja. De assistent meldt zich transparant als AI, ook aan de telefoon, conform Artikel 50 van de EU AI Act; ze doet zich nooit voor als mens.",
    body: `Transparantie is ingebouwd. De assistent zegt aan het begin van een gesprek dat het een virtuele AI-assistent is. Vraagt een beller tijdens een telefoongesprek of hij met een mens praat, dan bevestigt ze dat eerlijk — zo vaak als nodig.

Toch voelt het als een collega en niet als een bot: de assistent onthoudt het gesprek, praat vlot Nederlands en weet je diensten, prijzen en behandelaars.`,
    keywords: ["ai", "mens", "bot", "transparantie", "ai act", "artikel 50", "herkennen"],
    audience: "both",
    related: ["wat-als-de-ai-iets-niet-weet", "waar-staat-de-ai-voor-compliance"],
  },

  /* ============================ Prijzen & abonnement ============================ */
  {
    slug: "welke-plannen-zijn-er",
    title: "Welke plannen zijn er en wat kosten ze?",
    category: "prijzen-abonnement",
    summary: `Essential kost ${eur(PRICE.essential)} per maand, Pro ${eur(PRICE.pro)} en Elite ${eur(PRICE.elite)} — vaste maandprijzen, zonder variabele kosten per gesprek of minuut.`,
    body:
      PLANS.map((p) => `**${p.name} — ${eur(p.price)}/maand** (${p.tagline.replace(/\.$/, "")})\n\n${p.features.map((f) => `- ${f}`).join("\n")}`).join("\n\n") +
      "\n\nAlle bedragen zijn vaste maandprijzen. Zie ook de [prijzenpagina](/prijzen).",
    keywords: ["prijs", "kosten", "tarief", "essential", "pro", "elite", "plan", "abonnement", "maandprijs"],
    audience: "both",
    related: ["zijn-er-variabele-kosten", "betaal-ik-naast-mijn-agendasoftware", "wat-houdt-de-setup-fee-in", "upgraden-of-downgraden"],
  },
  {
    slug: "zijn-er-variabele-kosten",
    title: "Zijn er variabele kosten per gesprek of per minuut?",
    category: "prijzen-abonnement",
    summary:
      "Nee, nooit. Je betaalt één vast bedrag per maand, ongeacht hoeveel oproepen of WhatsApp-berichten je AI-assistent afhandelt.",
    body: `Geen minuutprijzen en geen verborgen kosten: één vast bedrag per maand, ongeacht het aantal gesprekken — ook niet in een drukke maand. Veel concurrenten rekenen wél per belminuut boven een limiet; bij ons krijg je nooit een verrassingsfactuur.

Let op: in Pro en Elite zijn de WhatsApp API-kosten inbegrepen tot een redelijk gebruik (circa 500 gesprekken per maand). Boven dat aantal bespreken we samen een passende oplossing.`,
    keywords: ["variabel", "per minuut", "per gesprek", "verrassing", "verborgen kosten", "factuur"],
    audience: "both",
    related: ["zijn-whatsapp-kosten-inbegrepen", "welke-plannen-zijn-er"],
  },
  {
    slug: "betaal-ik-naast-mijn-agendasoftware",
    title: "Betaal ik dit naast mijn agendasoftware (Salonized, Phorest, Treatwell)?",
    category: "prijzen-abonnement",
    summary:
      "Ja — KapperAssistent vervangt je agendasoftware niet maar werkt ernaast en synct ermee; reken op zo'n €170–€260 per maand totaal voor een kleine salon.",
    body: `KapperAssistent is een aanvulling op je agendasoftware, geen vervanging. Je houdt je agenda (Salonized, Phorest of Treatwell) en wij koppelen daaraan.

Reken voor een kleine salon op zo'n **€170–€260 per maand** totaal (agendasoftware + Essential), oplopend tot **€580+** voor een grotere salon met Elite. Die investering verdien je terug via gemiste oproepen die voortaan wél worden aangenomen.`,
    keywords: ["agendasoftware", "naast", "totaal", "tco", "salonized kosten", "extra kosten", "vervangt"],
    audience: "both",
    related: ["welke-plannen-zijn-er", "zijn-er-variabele-kosten"],
  },
  {
    slug: "wat-houdt-de-setup-fee-in",
    title: "Wat houdt de setup-fee in?",
    category: "prijzen-abonnement",
    summary:
      "Eenmalig, vanaf €250: wij koppelen je agenda, importeren je prijslijst en diensten en activeren WhatsApp Business op jouw naam.",
    body: `De setup is eenmalig (vanaf €250) en wordt volledig door ons team gedaan:

- je agenda koppelen (Salonized, Phorest of Treatwell)
- je prijslijst en diensten importeren
- het WhatsApp Business-account activeren, op jouw naam

Jij hoeft niets technisch te doen.`,
    keywords: ["setup", "setup-fee", "eenmalig", "€250", "installatie", "kosten"],
    audience: "both",
    related: ["hoe-start-ik", "hoe-lang-duurt-de-setup"],
  },
  {
    slug: "gratis-proefperiode",
    title: "Hoe werkt de gratis proefperiode van 14 dagen?",
    category: "prijzen-abonnement",
    summary:
      "Je start 14 dagen gratis zonder creditcard; drie dagen voor het einde krijg je een herinnering, daarna start je gekozen plan automatisch.",
    body: `- **14 dagen gratis**, geen creditcard nodig om te starten
- **Herinnering** drie dagen voor het einde van de proefperiode
- Daarna gaat je abonnement **automatisch** in op het gekozen plan
- **Opzeggen** kan altijd — er is geen minimale contractduur na de proefperiode

Wil je niet doorgaan? Zeg dan op vóór het einde van de proefperiode via je dashboard of per e-mail.`,
    keywords: ["proefperiode", "trial", "gratis", "14 dagen", "creditcard", "proef"],
    audience: "both",
    related: ["hoe-zeg-ik-op", "welke-plannen-zijn-er"],
  },
  {
    slug: "hoe-zeg-ik-op",
    title: "Hoe zeg ik mijn abonnement op?",
    category: "prijzen-abonnement",
    summary:
      "Je zegt op via je dashboard of per e-mail; het abonnement stopt aan het einde van de lopende maand en er is geen minimale contractduur.",
    body: `1. Ga in je dashboard naar **Abonnement** en zeg op — of stuur een e-mail naar hallo@kappersassistent.nl.
2. Het abonnement loopt door **tot het einde van de lopende maand**.
3. Er is **geen minimale contractduur** na de proefperiode.

Na opzegging blijven je accountgegevens tot 1 jaar bewaard en worden daarna op verzoek verwijderd; factuurgegevens bewaren we 7 jaar (wettelijke plicht). Zie [hoe lang we gegevens bewaren](/help/hoe-lang-bewaren-jullie-gegevens).`,
    keywords: ["opzeggen", "stopzetten", "annuleren", "abonnement", "beëindigen", "contract"],
    audience: "salon",
    related: ["gratis-proefperiode", "hoe-lang-bewaren-jullie-gegevens"],
  },
  {
    slug: "upgraden-of-downgraden",
    title: "Kan ik upgraden of downgraden?",
    category: "prijzen-abonnement",
    summary:
      "Ja, altijd via je dashboard: een upgrade gaat direct in, een downgrade aan het einde van de lopende maand.",
    body: `Wisselen van plan kan op elk moment via **Abonnement** in je dashboard.

- **Upgrade:** het nieuwe plan gaat direct in.
- **Downgrade:** het nieuwe plan gaat in aan het einde van de lopende maand.

Sommige functies (zoals de telefoon-AI, kassa en aanbetalingen) horen bij Pro en hoger; in het dashboard zie je bij een geblokkeerde functie een upgrade-melding.`,
    keywords: ["upgrade", "downgrade", "wisselen", "ander plan", "overstappen"],
    audience: "salon",
    related: ["welke-plannen-zijn-er", "hoe-zeg-ik-op"],
  },
  {
    slug: "korting-jaarcontract",
    title: "Is er korting bij jaarlijkse betaling?",
    category: "prijzen-abonnement",
    summary:
      "Op aanvraag bieden we jaarcontracten met 15% korting; mail hallo@kappersassistent.nl voor een offerte op maat.",
    body: `Ja. Jaarcontracten zijn op aanvraag beschikbaar met **15% korting**. Mail ons op hallo@kappersassistent.nl of [maak een ticket](/contact) voor een offerte op maat.`,
    keywords: ["korting", "jaarcontract", "jaarlijks", "15%", "offerte"],
    audience: "both",
    related: ["welke-plannen-zijn-er"],
  },
  {
    slug: "zijn-whatsapp-kosten-inbegrepen",
    title: "Zijn de kosten voor WhatsApp inbegrepen?",
    category: "prijzen-abonnement",
    summary:
      "In Pro en Elite zijn de WhatsApp API-kosten inbegrepen tot circa 500 gesprekken per maand; daarboven zoeken we samen een passende oplossing.",
    body: `In **Pro** en **Elite** zitten de WhatsApp API-kosten in de prijs, tot een redelijk gebruik van circa 500 gesprekken per maand. Boven dat aantal bespreken we een passende oplossing — je krijgt dus geen onverwachte factuur.`,
    keywords: ["whatsapp", "kosten", "api", "500 gesprekken", "inbegrepen", "berichtkosten"],
    audience: "both",
    related: ["zijn-er-variabele-kosten"],
  },
  {
    slug: "factuur-en-betaling",
    title: "Waar vind ik mijn factuur en hoe betaal ik?",
    category: "prijzen-abonnement",
    summary:
      "Betalingen lopen via Stripe; je beheert je abonnement en betaalgegevens onder Abonnement in je dashboard.",
    body: `Je abonnement wordt betaald via **Stripe**. Wij slaan zelf geen betaalgegevens op. In je dashboard onder **Abonnement** zie je je plan en status en beheer je je betaalgegevens.

Klopt er iets niet op je factuur, of is een betaling mislukt? [Maak een ticket](/contact) met categorie *Facturatie* — dan kijken we direct mee.`,
    keywords: ["factuur", "betaling", "stripe", "betaalgegevens", "creditcard", "incasso", "mislukt"],
    audience: "salon",
    related: ["hoe-zeg-ik-op", "upgraden-of-downgraden"],
  },

  /* ============================ Koppelingen ============================ */
  {
    slug: "welke-agenda-systemen-worden-ondersteund",
    title: "Welke agenda-systemen worden ondersteund?",
    category: "koppelingen",
    summary:
      "We ondersteunen Salonized, Phorest en Treatwell; gebruik je iets anders, neem dan contact op voor de mogelijkheden.",
    body: `Ondersteunde agenda-software:

- **Salonized**
- **Phorest**
- **Treatwell**

Gebruik je een ander systeem? [Neem contact met ons op](/contact) — we kijken of een maatwerkoplossing mogelijk is.`,
    keywords: ["agenda", "salonized", "phorest", "treatwell", "acuity", "koppeling", "software", "ondersteund"],
    audience: "both",
    related: ["hoe-koppel-ik-mijn-agenda", "wat-als-mijn-agenda-niet-wordt-ondersteund"],
  },
  {
    slug: "wat-als-mijn-agenda-niet-wordt-ondersteund",
    title: "Wat als mijn agenda niet wordt ondersteund?",
    category: "koppelingen",
    summary:
      "Neem contact met ons op: we bekijken of we een maatwerkoplossing kunnen bieden voor jouw agenda-software.",
    body: `We ondersteunen nu Salonized, Phorest en Treatwell. Werk je met een ander systeem? [Maak een ticket](/contact) met je agenda-software erbij, dan onderzoeken we wat mogelijk is.`,
    keywords: ["andere agenda", "niet ondersteund", "maatwerk", "ander systeem"],
    audience: "both",
    related: ["welke-agenda-systemen-worden-ondersteund"],
  },
  {
    slug: "hoe-koppel-ik-mijn-agenda",
    title: "Hoe koppel ik mijn agenda?",
    category: "koppelingen",
    summary:
      "Onze setup regelt de koppeling voor je; daarna beheer je hem onder Integraties in je dashboard.",
    body: `Bij de setup koppelt ons team je agenda voor je. Daarna vind je de koppeling onder **Integraties** in je dashboard, waar je de status ziet en gegevens kunt bijwerken.

Voor een agenda-koppeling is meestal een API-sleutel uit je agenda-software nodig. Deze wordt versleuteld opgeslagen.`,
    keywords: ["koppelen", "integratie", "api sleutel", "api key", "verbinden", "agenda"],
    audience: "salon",
    related: ["agenda-koppeling-werkt-niet", "welke-agenda-systemen-worden-ondersteund"],
  },
  {
    slug: "agenda-koppeling-werkt-niet",
    title: "Mijn agenda-koppeling werkt niet — wat nu?",
    category: "koppelingen",
    summary:
      "Controleer eerst of je API-sleutel nog geldig is onder Integraties; helpt dat niet, maak dan een ticket met categorie Koppeling.",
    body: `Probeer het volgende:

1. Ga naar **Integraties** en controleer de status van je koppeling.
2. Controleer of de **API-sleutel** in je agenda-software nog geldig is en niet is ingetrokken of vernieuwd. Voer bij een nieuwe sleutel die opnieuw in.
3. Zie je nog steeds fouten of ontbreken er beschikbare tijden? [Maak een ticket](/dashboard/support) met categorie **Koppeling** en vermeld welke agenda je gebruikt en sinds wanneer het misgaat.`,
    keywords: ["koppeling werkt niet", "fout", "sync", "geen tijden", "api", "storing", "agenda"],
    audience: "salon",
    related: ["hoe-koppel-ik-mijn-agenda"],
  },
  {
    slug: "whatsapp-business-koppelen",
    title: "Hoe werkt de WhatsApp Business-koppeling?",
    category: "koppelingen",
    summary:
      "We activeren een officieel WhatsApp Business-account op jouw naam — geen privénummer — zodat klanten je assistent via WhatsApp bereiken.",
    body: `De assistent gebruikt een **officieel WhatsApp Business-account**, geen privénummer. Ons team activeert dit tijdens de setup op jouw naam.

Klanten sturen je een WhatsApp-bericht; de assistent antwoordt, boekt in je agenda en vraagt om bevestiging van de annuleringsvoorwaarden.`,
    keywords: ["whatsapp", "business", "nummer", "koppelen", "privé", "api"],
    audience: "both",
    related: ["zijn-whatsapp-kosten-inbegrepen", "wat-doet-de-ai-op-whatsapp"],
  },

  /* ============================ AI-receptie ============================ */
  {
    slug: "wat-doet-de-ai-op-whatsapp",
    title: "Wat kan de AI via WhatsApp?",
    category: "ai-receptie",
    summary:
      "De AI beantwoordt vragen over je diensten en prijzen, boekt, verzet en annuleert afspraken in je agenda en vraagt om een actieve bevestiging.",
    body: `De WhatsApp-assistent kan, 24/7:

- **Vragen beantwoorden** over diensten, prijzen, voorbereiding en nazorg
- **Afspraken boeken, verzetten en annuleren** — direct in je agenda
- **Bevestiging vragen:** de klant tikt zelf op een knop om de afspraak en de annuleringsvoorwaarden te bevestigen
- **Foto's herkennen** (Pro), bijvoorbeeld kapselinspiratie
- **Doorverwijzen naar jou** wanneer het lastig wordt`,
    keywords: ["whatsapp", "boeken", "verzetten", "annuleren", "wat kan", "functies", "ai"],
    audience: "both",
    related: ["wat-als-de-ai-iets-niet-weet", "foto-herkenning"],
  },
  {
    slug: "telefoon-ai",
    title: "Kan de AI ook mijn telefoon opnemen?",
    category: "ai-receptie",
    summary:
      "Ja, in elk plan neemt de Voice-AI de telefoon op, dag en nacht, boekt rechtstreeks in je agenda en verbindt door bij lastige vragen.",
    body: `In **elk plan** kan een AI-stem de telefoon opnemen (je schakelt dit in via **Integraties** in je dashboard):

- Antwoordt snel en natuurlijk — geen wachtrij of voicemail
- Herhaalt de gevraagde dienst en stylist
- Boekt rechtstreeks in je agenda
- Verbindt bij lastige vragen door naar jouw mobiel
- Meldt zich eerlijk als AI en bevestigt dat zo vaak als een beller ernaar vraagt

Zo mis je geen oproepen meer, ook niet buiten openingstijden of als je midden in een kleuring zit.`,
    keywords: ["telefoon", "voice", "bellen", "oproep", "opnemen", "stem", "belminuten"],
    audience: "both",
    related: ["doorverbinden-naar-collega", "is-het-een-echt-mens"],
  },
  {
    slug: "doorverbinden-naar-collega",
    title: "Hoe zet de AI een gesprek door naar mij of een collega?",
    category: "ai-receptie",
    summary:
      "Bij een klacht, medische vraag of expliciet verzoek zet de AI het gesprek door; je ziet het direct onder Escalaties in je dashboard.",
    body: `Als een klant een medewerker wil spreken, een klacht heeft, een medische vraag stelt of de AI er niet uitkomt, zet de assistent het gesprek door.

- In je dashboard verschijnt het gesprek onder **Escalaties**, met de reden erbij.
- Je kunt het direct overnemen zonder de klant alles opnieuw te laten vertellen.
- Markeer het als afgehandeld zodra je het hebt opgepakt.

Aan de telefoon kan de AI het gesprek doorverbinden naar jouw mobiel.`,
    keywords: ["escalatie", "doorzetten", "doorverbinden", "overnemen", "klacht", "medewerker", "mens"],
    audience: "salon",
    related: ["wat-als-de-ai-iets-niet-weet"],
  },
  {
    slug: "wat-als-de-ai-iets-niet-weet",
    title: "Wat gebeurt er als de AI iets niet weet?",
    category: "ai-receptie",
    summary:
      "De AI verzint niets: ze gebruikt alleen je diensten, prijzen en kennisbank, en zet bij twijfel het gesprek door naar jou.",
    body: `De assistent baseert zich uitsluitend op wat jij hebt ingesteld: je diensten, prijzen, behandelaars en eigen kennisbank. Weet ze het antwoord niet, dan doet ze niet alsof — ze verwijst door naar jou of een collega.

Tip: heb je veelgestelde vragen die specifiek zijn voor jouw salon? Voeg ze toe aan je eigen kennisbank, dan kan de assistent ze voortaan zelf beantwoorden.`,
    keywords: ["weet niet", "verzinnen", "fout antwoord", "hallucinatie", "kennisbank", "twijfel"],
    audience: "both",
    related: ["doorverbinden-naar-collega", "ai-medische-vragen"],
  },
  {
    slug: "foto-herkenning",
    title: "Kan de AI foto's van klanten herkennen?",
    category: "ai-receptie",
    summary:
      "Ja, met Pro en hoger herkent de AI foto's zoals kapselinspiratie en schat in welke behandeling en tijd nodig zijn — maar stelt nooit een medische diagnose.",
    body: `Met **Pro** en hoger kan een klant een foto sturen, bijvoorbeeld kapselinspiratie, de huidige haarkleur of uitgroei. De AI gebruikt die om in te schatten welke behandeling en hoeveel tijd nodig is.

Bij een huid- of hoofdhuidkwestie stelt de AI **nooit** een diagnose; dan verwijst ze door naar jou of een collega.`,
    keywords: ["foto", "afbeelding", "kapselinspiratie", "uitgroei", "multimodaal", "pro"],
    audience: "both",
    related: ["ai-medische-vragen"],
  },
  {
    slug: "ai-medische-vragen",
    title: "Geeft de AI medisch advies over allergieën of huidklachten?",
    category: "ai-receptie",
    summary:
      "Nee. Bij allergieën, huid- of gezondheidsvragen geeft de AI nooit een oordeel en verbindt ze altijd door naar jou of een collega.",
    body: `Vragen over allergieën, huidaandoeningen of andere gezondheidsinformatie beoordeelt de AI niet. Ze zegt dat een medewerker dit persoonlijk oppakt — telefonisch of bij een intake in de salon.

Gevoelige gegevens worden bovendien apart en extra beveiligd opgeslagen (AVG Artikel 9). Lees meer bij [privacy en veiligheid](/help/hoe-gaan-jullie-om-met-gevoelige-gegevens).`,
    keywords: ["allergie", "medisch", "huid", "gezondheid", "artikel 9", "diagnose", "advies"],
    audience: "both",
    related: ["hoe-gaan-jullie-om-met-gevoelige-gegevens", "doorverbinden-naar-collega"],
  },
  {
    slug: "intelligent-double-booking",
    title: "Wat is Intelligent Double-Booking?",
    category: "ai-receptie",
    summary:
      "Bij kleurbehandelingen met inwerktijd plant de AI in dat vrije gat een korte behandeling in, zodat je stoel bezet blijft (Pro en Elite).",
    body: `Tijdens de inwerktijd van een kleuring of balayage staat je stylist niet aan de stoel. Met **Pro** en **Elite** herkent de AI die inwerktijd en plant in dat gat een korte behandeling (bijvoorbeeld een herensnit of föhnbehandeling) in.

Het resultaat: meer bezetting zonder overspannen personeel. Voor de instelling geef je per behandeling de fases aanbrengen, inwerken en afwerken op.`,
    keywords: ["double booking", "inwerktijd", "kleuring", "balayage", "opvullen", "bezetting", "pro"],
    audience: "both",
    related: ["welke-plannen-zijn-er"],
  },
  {
    slug: "waar-staat-de-ai-voor-compliance",
    title: "Voldoet de AI aan de AVG en de EU AI Act?",
    category: "ai-receptie",
    summary:
      "Ja: de AI meldt zich als AI (Artikel 50 EU AI Act), persoonsgegevens worden gemaskeerd voordat ze een AI-model bereiken en bijzondere gegevens worden apart beschermd.",
    body: `- **AI Act, Artikel 50:** de assistent meldt zich altijd als AI.
- **PII-gateway:** namen, telefoonnummers, e-mailadressen en gezondheidstermen worden gemaskeerd voordat een bericht een AI-model bereikt.
- **AVG Artikel 9:** gezondheidsinformatie krijgt geen AI-oordeel en wordt apart en extra beveiligd opgeslagen.

Meer details staan in onze [privacyverklaring](/privacy).`,
    keywords: ["avg", "gdpr", "ai act", "compliance", "pii", "maskeren", "privacy"],
    audience: "both",
    related: ["hoe-gaan-jullie-om-met-gevoelige-gegevens", "hoe-lang-bewaren-jullie-gegevens"],
  },

  /* ============================ Klanten & dossier ============================ */
  {
    slug: "digitaal-klantdossier",
    title: "Wat is het digitale klantdossier?",
    category: "klanten-dossier",
    summary:
      "Per klant worden behandelkaarten en voor/na-foto's vastgelegd, zodat jij of een collega altijd weet wat de vorige keer is gedaan.",
    body: `Het klantdossier bewaart per klant:

- **Behandelkaarten:** techniek, kleurformule en notities
- **Voor/na-foto's**, met toestemming van de klant
- **Gevoelige informatie** (zoals allergieën) apart en extra beveiligd

Je vindt het onder **Klanten** in je dashboard. Het dossier is beschikbaar in alle plannen.`,
    keywords: ["dossier", "klantdossier", "behandelkaart", "kleurformule", "foto", "voor na"],
    audience: "salon",
    related: ["hoe-gaan-jullie-om-met-gevoelige-gegevens", "klant-verwijderen"],
  },
  {
    slug: "klant-verwijderen",
    title: "Hoe verwijder ik een klant volledig (recht op vergetelheid)?",
    category: "klanten-dossier",
    summary:
      "Via je dashboard verwijder je een klant met één bevestigde actie, inclusief dossier, foto's en gesprekken; afspraken en bonnen blijven geanonimiseerd bewaard.",
    body: `Een klant vraagt om verwijdering van alle gegevens? Dat regel je zelf:

1. Open de klant onder **Klanten**.
2. Kies **verwijderen** en bevestig.

Daarmee verdwijnen het dossier, de foto's en de gesprekken **onherroepelijk**. Afspraken en bonnen blijven **geanonimiseerd** bewaard, omdat de Belastingdienst dat voor je administratie vereist.`,
    keywords: ["verwijderen", "vergetelheid", "avg", "artikel 17", "wissen", "klant", "purge"],
    audience: "salon",
    related: ["hoe-lang-bewaren-jullie-gegevens", "digitaal-klantdossier"],
  },
  {
    slug: "reviews-en-terughalen",
    title: "Hoe werken reviewverzoeken en terughaalberichten?",
    category: "klanten-dossier",
    summary:
      "Na een geslaagde afspraak vraagt de AI om een review; blijft een klant langer weg dan normaal, dan krijgt die een vriendelijk berichtje.",
    body: `Beide functies zitten in alle plannen:

- **Reviewverzoek:** na een geslaagde afspraak vraagt de AI automatisch om een review.
- **Terughalen:** de AI leert per klant het normale ritme en stuurt een vriendelijk bericht zodra iemand opvallend langer wegblijft dan gebruikelijk.

Je beheert dit onder **Retentie & marketing** in je dashboard, waar je klantberichten ook kunt uitzetten.`,
    keywords: ["review", "beoordeling", "terughalen", "reactiveren", "retentie", "terugkomen", "marketing"],
    audience: "salon",
    related: ["spaarprogramma"],
  },
  {
    slug: "spaarprogramma",
    title: "Hoe werkt het spaarprogramma?",
    category: "klanten-dossier",
    summary:
      "Met Elite bouwen klanten automatisch punten op bij elke afspraak, zonder dat jij iets hoeft bij te houden.",
    body: `In het **Elite**-plan bouwt elke klant automatisch spaarpunten op bij elke afspraak. Je hoeft geen kaarten of lijsten bij te houden; de punten worden vanzelf verwerkt.`,
    keywords: ["spaarprogramma", "punten", "loyaliteit", "elite", "sparen"],
    audience: "both",
    related: ["welke-plannen-zijn-er", "reviews-en-terughalen"],
  },
  {
    slug: "seo-blogs-elite",
    title: "Wat zijn de automatische SEO-blogs (Elite)?",
    category: "klanten-dossier",
    summary:
      "Met Elite schrijft en publiceert ons team doorlopend lokale, vindbare content op jouw eigen website zodat je hoger in Google komt.",
    body: `In **Elite** schrijven en publiceren we doorlopend content voor jouw salon en regio op je eigen domein, geoptimaliseerd zodat Google je beter vindt. Je hoeft er zelf geen tijd in te steken.`,
    keywords: ["seo", "blog", "google", "content", "elite", "lokaal", "vindbaarheid"],
    audience: "both",
    related: ["welke-plannen-zijn-er"],
  },
  {
    slug: "meerdere-vestigingen",
    title: "Kan ik meerdere vestigingen beheren?",
    category: "klanten-dossier",
    summary:
      "Ja, met Elite beheer je al je vestigingen en agenda's vanuit één cockpit.",
    body: `Met **Elite** beheer je meerdere vestigingen en agenda's vanuit één cockpit — één AI-team voor al je locaties in plaats van losse abonnementen.`,
    keywords: ["vestigingen", "locaties", "keten", "meerdere", "filialen", "elite"],
    audience: "both",
    related: ["welke-plannen-zijn-er"],
  },

  /* ============================ No-shows & kassa ============================ */
  {
    slug: "no-show-herinneringen",
    title: "Hoe verminderen herinneringen no-shows?",
    category: "no-shows-kassa",
    summary:
      "De AI stuurt automatische herinneringen via SMS en WhatsApp, waarop klanten met één woord bevestigen, zodat je op tijd een lege plek kunt opvullen.",
    body: `Elke no-show kost al snel €40–€80. KapperAssistent stuurt daarom automatisch:

- **SMS-herinneringen** 48 uur en 2 uur vooraf
- **WhatsApp-bevestigingsverzoeken**, aanpasbaar per stylistschema

Klanten bevestigen met één woord. Reageert iemand niet, dan weet je het op tijd om de plek op te vullen. Je stelt het beleid in onder **No-show beleid**.`,
    keywords: ["no-show", "herinnering", "sms", "bevestigen", "lege stoel", "afspraakherinnering"],
    audience: "both",
    related: ["aanbetaling", "no-show-beleid-instellen"],
  },
  {
    slug: "no-show-beleid-instellen",
    title: "Hoe stel ik mijn no-show beleid in?",
    category: "no-shows-kassa",
    summary:
      "Onder No-show beleid in je dashboard bepaal je hoe je met no-shows omgaat; klanten bevestigen de annuleringsvoorwaarden actief.",
    body: `Ga in je dashboard naar **No-show beleid** om je regels vast te leggen. Bij het boeken via WhatsApp vraagt de AI de klant actief om de annuleringsvoorwaarden te bevestigen door op een knop te tikken. Dat legt de bevestiging vast en helpt je bij een no-show.

Je kunt afspraken ook handmatig als no-show markeren.`,
    keywords: ["no-show beleid", "annuleringsvoorwaarden", "regels", "instellen", "no show"],
    audience: "salon",
    related: ["no-show-herinneringen", "aanbetaling"],
  },
  {
    slug: "aanbetaling",
    title: "Hoe werkt een aanbetaling bij dure behandelingen?",
    category: "no-shows-kassa",
    summary:
      "Met Pro vraagt de AI bij dure of lange behandelingen om een aanbetaling via een betaallink, zodat no-show-schade afneemt.",
    body: `Met **Pro** en **Elite** kan de AI bij duurdere of langdurige behandelingen om een **aanbetaling** vragen. De afspraak wordt vastgehouden zodra de klant de aanbetaling heeft voldaan (via een betaallink met Stripe). Zo beperk je de schade van een no-show.`,
    keywords: ["aanbetaling", "borg", "deposit", "betaallink", "stripe", "pro"],
    audience: "both",
    related: ["no-show-herinneringen", "welke-plannen-zijn-er"],
  },
  {
    slug: "kassa-btw",
    title: "Hoe werkt de kassa en de btw-splitsing?",
    category: "no-shows-kassa",
    summary:
      "De kassa (Pro en Elite) splitst btw automatisch: 9% voor behandelingen en 21% voor producten, met dagafsluiting en export.",
    body: `De **kassa** (Pro en Elite) rekent af aan de stoel — contant, pin of kaart — met:

- **Automatische btw-splitsing:** 9% op behandelingen, 21% op producten
- **Fooi** zonder losse administratie
- **Dagafsluiting** met één druk op de knop
- **Export** voor je boekhouding

Je vindt de kassa onder **Kassa** in je dashboard.`,
    keywords: ["kassa", "btw", "9%", "21%", "dagafsluiting", "afrekenen", "pos", "boekhouding"],
    audience: "salon",
    related: ["welke-plannen-zijn-er"],
  },
  {
    slug: "webwinkel-en-voorraad",
    title: "Hoe werken de webwinkel en voorraadwaarschuwingen?",
    category: "no-shows-kassa",
    summary:
      "Met Pro en Elite signaleert de Inventory Agent tijdig lage voorraad op basis van je 30-daagse verkoop en verkoop je producten via een Stripe-checkout.",
    body: `Met **Pro** en **Elite** analyseert de Inventory Agent je verkoop van de afgelopen 30 dagen en waarschuwt zodra een product onder de drempel zakt, met een herbestelsuggestie. Producten kun je verkopen via een webwinkel met Stripe-checkout, te beheren onder **Webwinkel**.`,
    keywords: ["voorraad", "webwinkel", "producten", "inventory", "herbestellen", "shop", "webshop"],
    audience: "salon",
    related: ["kassa-btw"],
  },

  /* ============================ Privacy & veiligheid ============================ */
  {
    slug: "hoe-lang-bewaren-jullie-gegevens",
    title: "Hoe lang bewaren jullie gegevens?",
    category: "privacy-veiligheid",
    summary:
      "Gesprekslogs 30 dagen, accountgegevens tot 1 jaar na opzegging en factuurdata 7 jaar (wettelijke bewaarplicht).",
    body: `- **Gesprekslogs en chatberichten:** 30 dagen, daarna automatisch verwijderd
- **Accountgegevens salonhouder:** tot 1 jaar na opzegging, daarna op verzoek verwijderd
- **Factuur- en betalingsdata:** 7 jaar (wettelijke bewaarplicht)
- **Scan-resultaten:** als lead in ons CRM, verwijderbaar op verzoek

Volledige details staan in de [privacyverklaring](/privacy).`,
    keywords: ["bewaren", "bewaartermijn", "retentie", "gegevens", "verwijderen", "30 dagen", "7 jaar"],
    audience: "both",
    related: ["klant-verwijderen", "hoe-gaan-jullie-om-met-gevoelige-gegevens"],
  },
  {
    slug: "hoe-gaan-jullie-om-met-gevoelige-gegevens",
    title: "Hoe gaan jullie om met gevoelige klantgegevens zoals allergieën?",
    category: "privacy-veiligheid",
    summary:
      "Die worden apart en extra beveiligd opgeslagen (AVG Artikel 9); de AI geeft nooit zelf een medisch oordeel en verbindt bij twijfel door.",
    body: `Gezondheidsgegevens zijn bijzondere persoonsgegevens (AVG Artikel 9). Daarom:

- worden ze **apart en extra beveiligd** opgeslagen;
- worden ze via een PII-gateway **gemaskeerd** voordat een bericht een AI-model bereikt;
- geeft de AI **nooit een medisch oordeel** en verbindt ze bij twijfel altijd door naar jou of een collega.`,
    keywords: ["gevoelig", "allergie", "artikel 9", "bijzondere persoonsgegevens", "gezondheid", "beveiliging"],
    audience: "both",
    related: ["ai-medische-vragen", "waar-staat-de-ai-voor-compliance"],
  },
  {
    slug: "met-wie-delen-jullie-gegevens",
    title: "Met wie delen jullie mijn gegevens?",
    category: "privacy-veiligheid",
    summary:
      "Alleen met zorgvuldig geselecteerde leveranciers die strikt nodig zijn voor de dienst, zoals Stripe voor betalingen en Neon voor databasehosting op EU-servers.",
    body: `We werken uitsluitend met zorgvuldig geselecteerde leveranciers die je gegevens niet voor eigen doeleinden mogen gebruiken en contractueel verplicht zijn ze te beveiligen. Voorbeelden zijn **Stripe** (betalingen) en **Neon** (databasehosting op EU-servers). De volledige lijst staat in de [privacyverklaring](/privacy).`,
    keywords: ["delen", "leveranciers", "verwerkers", "stripe", "neon", "derden", "verwerkersovereenkomst"],
    audience: "both",
    related: ["hoe-lang-bewaren-jullie-gegevens"],
  },
  {
    slug: "mijn-privacyrechten",
    title: "Hoe oefen ik mijn privacyrechten uit (inzage, correctie, verwijdering)?",
    category: "privacy-veiligheid",
    summary:
      "Mail privacy@kappersassistent.nl of maak een ticket met categorie Privacy; we reageren binnen 5 werkdagen.",
    body: `Je hebt recht op inzage, correctie en verwijdering van je gegevens. Mail naar **privacy@kappersassistent.nl** of [maak een ticket](/contact) met categorie **Privacy**. We reageren binnen 5 werkdagen.

Ben je klant van een salon en wil je jouw gegevens laten verwijderen? Neem dan contact op met die salon; zij kunnen dit in hun dashboard met één actie regelen.`,
    keywords: ["privacy", "inzage", "correctie", "verwijdering", "rechten", "avg", "verzoek"],
    audience: "both",
    related: ["klant-verwijderen", "hoe-lang-bewaren-jullie-gegevens"],
  },

  /* ============================ Account & hulp ============================ */
  {
    slug: "wachtwoord-vergeten",
    title: "Ik ben mijn wachtwoord vergeten",
    category: "account-support",
    summary:
      "Kies op de inlogpagina 'Wachtwoord vergeten'; je ontvangt een e-mail met een link om een nieuw wachtwoord in te stellen.",
    body: `1. Ga naar de [inlogpagina](/login) en kies **Wachtwoord vergeten**.
2. Vul je e-mailadres in.
3. Open de e-mail en volg de link om een nieuw wachtwoord in te stellen.

Geen e-mail ontvangen? Controleer je spam-map. Lukt het nog steeds niet, [neem dan contact op](/contact).`,
    keywords: ["wachtwoord", "inloggen", "reset", "vergeten", "login", "toegang"],
    audience: "salon",
    related: ["kan-niet-inloggen"],
  },
  {
    slug: "kan-niet-inloggen",
    title: "Ik kan niet inloggen",
    category: "account-support",
    summary:
      "Controleer je e-mailadres en wachtwoord, reset zo nodig je wachtwoord en neem contact op als je account nog steeds niet werkt.",
    body: `Probeer dit:

1. Controleer of je het **juiste e-mailadres** gebruikt (het adres waarmee je bent aangemeld).
2. Reset je wachtwoord via [Wachtwoord vergeten](/help/wachtwoord-vergeten).
3. Werkt het nog niet? [Maak een ticket](/contact) en vermeld je e-mailadres (nooit je wachtwoord).`,
    keywords: ["inloggen", "login", "account", "toegang", "geblokkeerd", "fout"],
    audience: "salon",
    related: ["wachtwoord-vergeten"],
  },
  {
    slug: "hoe-neem-ik-contact-op",
    title: "Hoe neem ik contact op met support?",
    category: "account-support",
    summary:
      "Vraag het aan de AI-chat, of maak een ticket via /contact; je krijgt een ticketnummer en volgt de status online. Reactie binnen 1 werkdag.",
    body: `Er zijn drie manieren om hulp te krijgen:

1. **Zoek in het hulpcentrum** — het antwoord staat er vaak al.
2. **Vraag het de AI-assistent** rechtsonder op elke pagina. Komt ze er niet uit, dan maakt ze met één klik een ticket voor je aan.
3. **Maak een ticket** via [contact](/contact) (of *Support* in je dashboard). Je krijgt een ticketnummer en kunt de status en reacties volgen.

Onze streefreactietijd is 1 werkdag; salons met Pro en Elite krijgen sneller antwoord. Zie [hoe snel reageren jullie](/help/hoe-snel-reageren-jullie).`,
    keywords: ["contact", "support", "hulp", "ticket", "klantenservice", "mailen", "helpdesk"],
    audience: "both",
    related: ["hoe-snel-reageren-jullie", "ticket-status-volgen"],
  },
  {
    slug: "hoe-snel-reageren-jullie",
    title: "Hoe snel reageren jullie op mijn ticket?",
    category: "account-support",
    summary:
      "Streefreactietijd: Elite binnen 1 uur, Pro binnen 4 uur en Essential of vragen vooraf binnen 1 werkdag.",
    body: `Onze streefreactietijden voor een eerste reactie:

- **Elite:** binnen 1 uur
- **Pro:** binnen 4 uur
- **Essential** en vragen vóór aankoop: binnen 1 werkdag

Storingen die je dienstverlening raken (bijvoorbeeld een agenda die niet meer synchroniseert) krijgen voorrang. In je ticket zie je de streefdatum.`,
    keywords: ["reactietijd", "sla", "hoe snel", "wachttijd", "prioriteit", "antwoord"],
    audience: "both",
    related: ["hoe-neem-ik-contact-op", "ticket-status-volgen"],
  },
  {
    slug: "ticket-status-volgen",
    title: "Hoe volg ik de status van mijn ticket?",
    category: "account-support",
    summary:
      "Je krijgt een ticketnummer en een link per e-mail; salons zien alle tickets onder Support in het dashboard, gasten via de link in hun mail.",
    body: `Na het aanmaken ontvang je een bevestiging met je **ticketnummer** (bijvoorbeeld KA-10482) en een **link** naar je ticket.

Statussen:

- **Open** — we hebben je vraag ontvangen
- **In behandeling** — een medewerker werkt eraan
- **Wacht op jou** — we hebben meer informatie van je nodig
- **Opgelost** — we denken dat het is afgehandeld; reageer je niet, dan sluiten we het ticket automatisch
- **Gesloten** — afgerond

Reageren doe je in het ticket of door te antwoorden op de e-mail. Salons vinden alle tickets onder **Support** in het dashboard.`,
    keywords: ["ticket", "status", "volgen", "ticketnummer", "opgelost", "reageren"],
    audience: "both",
    related: ["hoe-neem-ik-contact-op", "hoe-snel-reageren-jullie"],
  },
  {
    slug: "goede-ticket-schrijven",
    title: "Wat zet ik in een ticket zodat het snel opgelost wordt?",
    category: "account-support",
    summary:
      "Beschrijf wat je verwachtte, wat er gebeurde en sinds wanneer; voeg een screenshot toe en deel nooit wachtwoorden of API-sleutels.",
    body: `Hoe completer je ticket, hoe sneller het opgelost is:

1. **Wat wilde je bereiken?**
2. **Wat gebeurde er in plaats daarvan?** (foutmelding letterlijk overnemen)
3. **Sinds wanneer** en **hoe vaak** gebeurt het?
4. Een **screenshot** als het over het dashboard gaat.

Deel **nooit** je wachtwoord of API-sleutels in een ticket.`,
    keywords: ["ticket schrijven", "tips", "screenshot", "foutmelding", "snel oplossen"],
    audience: "both",
    related: ["ticket-status-volgen"],
  },
];

export function getHelpArticle(slug: string, corpus: HelpArticle[] = HELP_ARTICLES): HelpArticle | undefined {
  return corpus.find((a) => a.slug === slug);
}

export function getHelpCategory(id: string): HelpCategory | undefined {
  return HELP_CATEGORIES.find((c) => c.id === id);
}

export function articlesByCategory(categoryId: string, corpus: HelpArticle[] = HELP_ARTICLES): HelpArticle[] {
  return corpus.filter((a) => a.category === categoryId);
}
