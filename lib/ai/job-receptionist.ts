import type Anthropic from "@anthropic-ai/sdk";
import type { SalonContext } from "@/lib/ai/receptionist";
import type { JobAgentPrompt, VerticalPack } from "@/lib/verticals";

/**
 * Job-archetype (loodgieter, schilder, ...) receptionist: same tool loop and
 * channels as the kapper one, but the goal is a complete klus-aanvraag (naam,
 * telefoon, klusadres, probleem, spoed) instead of a slot in a stoelenagenda.
 * Kept in its own module so the kapper prompt/tools stay byte-for-byte what
 * the existing tests and production rely on.
 */

/** Neutral wording for a vak that declares no rules of its own — deliberately
 * free of any single trade's hazards (no gas, no water). */
const GENERIC_AGENT_PROMPT: JobAgentPrompt = {
  spoedRule:
    "een acuut probleem, een veiligheidsrisico of schade die snel erger wordt behandel je als spoed. Geef, waar dat veilig kan, eerst korte veiligheidstips; bij acuut gevaar voor personen: 112.",
  hazardExamples: "een veiligheidsrisico of ernstige schade",
  quoteExamples: "een groter werk of een renovatie",
  photoRule:
    "gebruik die om in te schatten welke {treatment} en hoeveel tijd nodig is, en noem dat kort in je antwoord. Bij een mogelijk gevaarlijke situatie altijd escalate_to_staff gebruiken in plaats van zelf gerust te stellen. De foto wordt automatisch bij de klus gevoegd.",
  scene: "onderweg of aan het werk",
  urgencyHint: "spoed = acuut (veiligheidsrisico of schade die snel erger wordt); anders normaal",
  photoSubjects: "het probleem of de situatie",
};

/** The pack's own rules over the generic ones. Exported for tests. */
export function agentPromptFor(pack: VerticalPack): JobAgentPrompt {
  return { ...GENERIC_AGENT_PROMPT, ...pack.agent.prompt };
}

const ADDRESS_PROPS = {
  street: { type: "string", description: "straatnaam van het klusadres" },
  house_number: { type: "string", description: "huisnummer incl. toevoeging" },
  postal_code: { type: "string", description: "postcode, bijv. 1234 AB" },
  city: { type: "string", description: "plaats van het klusadres" },
} as const;

/** Tool catalogue for a job vertical: the base tools, with book_appointment
 * extended by the klusadres, plus register_job for everything that is not a
 * directly bookable slot (spoed, terugbelverzoek, offerte-aanvraag). */
export function buildJobTools(pack: VerticalPack, base: Anthropic.Tool[]): Anthropic.Tool[] {
  const categoryKeys = pack.jobCategories.map((c) => c.key);
  const agentPrompt = agentPromptFor(pack);

  const registerJob: Anthropic.Tool = {
    name: "register_job",
    description:
      "Leg een klus-aanvraag vast in het klantsysteem. Gebruik dit voor spoed, voor een klant die geen vast tijdstip kiest (de vakman neemt contact op / plant in) en voor een verzoek om een offerte. Vraag eerst naam, klusadres en wat er aan de hand is. Retourneert het klusnummer.",
    input_schema: {
      type: "object",
      properties: {
        customer_name: { type: "string" },
        customer_phone: { type: "string", description: "telefoonnummer; bij een gesprek/WhatsApp al bekend" },
        ...ADDRESS_PROPS,
        description: { type: "string", description: "wat er aan de hand is, in de woorden van de klant, met relevante details" },
        category: { type: "string", enum: categoryKeys, description: "beste passende klus-categorie" },
        urgency: {
          type: "string",
          enum: ["spoed", "normaal"],
          description: agentPrompt.urgencyHint,
        },
        preferred_time: { type: "string", description: "optioneel: wanneer het de klant uitkomt (vrije tekst)" },
      },
      required: ["customer_name", "street", "house_number", "postal_code", "city", "description", "category", "urgency"],
    },
  };

  const tools = base.map((t): Anthropic.Tool => {
    if (t.name !== "book_appointment") return t;
    const schema = t.input_schema as { properties: Record<string, unknown>; required?: string[] };
    return {
      ...t,
      description:
        "Boek een bezoek op een exact slot_id dat eerder is teruggegeven door check_availability, en leg de klus vast. Bevestig naam, telefoonnummer en klusadres bij de klant vóór je dit aanroept.",
      input_schema: {
        ...t.input_schema,
        properties: {
          ...schema.properties,
          ...ADDRESS_PROPS,
          description: { type: "string", description: "wat er aan de hand is / wat er moet gebeuren" },
          category: { type: "string", enum: categoryKeys, description: "beste passende klus-categorie" },
        },
        required: [...(schema.required ?? []), "street", "house_number", "postal_code", "city", "description"],
      },
    };
  });

  // register_job goes right before escalate_to_staff so the escalation tool
  // (which Vapi turns into a native transfer) stays last.
  const idx = tools.findIndex((t) => t.name === "escalate_to_staff");
  if (idx === -1) return [...tools, registerJob];
  return [...tools.slice(0, idx), registerJob, ...tools.slice(idx)];
}

/** Compact JSON of the klus-categorieën so the model classifies with the
 * owner's own vocabulary and knows which are spoed by default. */
function categoriesJson(pack: VerticalPack): string {
  return JSON.stringify(
    pack.jobCategories.map((c) => ({
      key: c.key,
      naam: c.label,
      spoed_standaard: c.urgent,
      herken_aan: c.keywords,
    })),
  );
}

export function buildJobSystemPrompt(
  salon: SalonContext,
  pack: VerticalPack,
  opts: { voice?: boolean; knowledgeText: string; servicesBlock: string; staffJson: string; locationsJson: string },
): string {
  const t = pack.terms;
  const ap = agentPromptFor(pack);
  const cancelPolicy = salon.noShowSettings.enabled
    ? `Klanten kunnen gratis annuleren of verzetten tot ${salon.noShowSettings.freeCancelHours ?? 24} uur voor de afspraak.`
    : `Neem contact op met het ${t.establishment} voor het annuleringsbeleid.`;

  return `Je bent de AI-receptionist van ${salon.name}${salon.city ? ` in ${salon.city}` : ""}, een ${t.practitioner}sbedrijf. Je communiceert uitsluitend in vlot, vriendelijk, nuchter en professioneel Nederlands.

VESTIGINGEN (JSON): ${opts.locationsJson}

KLUS-CATEGORIEËN (JSON): ${categoriesJson(pack)}

${opts.servicesBlock}

${t.practitionerPlural.toUpperCase()} (JSON): ${opts.staffJson}
${opts.knowledgeText}

JE DOEL: elke aanvraag compleet en direct in het klantsysteem krijgen — naam, telefoonnummer, klusadres (straat, huisnummer, postcode, plaats), wat er aan de hand is en hoe dringend het is. Een ${t.practitioner} die ${ap.scene} is, moet dit later kunnen lezen zonder terug te bellen.

GEDRAGSREGELS:
1. Communiceer kort — maximaal ongeveer 4 zinnen per bericht. Schrijf platte tekst zonder markdown-opmaak: geen ** of * rond woorden, geen #-koppen. Stel steeds één vraag tegelijk.
2. Verzamel: naam, klusadres (straat + huisnummer, postcode, plaats) en een duidelijke omschrijving. ${opts.voice ? "Het nummer waarmee de beller belt is al bekend (nummerherkenning); vraag er niet naar. Herhaal postcode en huisnummer letter voor letter terug om verhoren te voorkomen." : "Bevestig ook het telefoonnummer als dat niet uit het gesprek blijkt."}
3. SPOED: ${ap.spoedRule} Leg daarna direct de klus vast met register_job (urgency "spoed") en gebruik escalate_to_staff zodat de ${t.practitioner} meteen wordt gewaarschuwd.
4. Kan de klant een vast moment kiezen én zijn er slots? Gebruik dan check_availability en book_appointment (met klusadres en omschrijving). Anders: register_job en zeg eerlijk dat de ${t.practitioner} contact opneemt om in te plannen — verzin nooit een tijd.
5. Gebruik voor beschikbaarheid, bestaande afspraken, boeken, verzetten en annuleren ALTIJD de bijbehorende tool. Verzin nooit zelf tijden, slot_id's of appointment_id's — kopieer ze letterlijk uit een eerder tool-resultaat.
6. Prijzen: noem uitsluitend tarieven die in DIENSTEN staan. Een prijsindicatie voor een lastig of onduidelijk geval geef je niet — leg uit dat de ${t.practitioner} ter plaatse kijkt of een offerte maakt.
7. Een aanvraag om een offerte (bijv. ${ap.quoteExamples}) leg je vast met register_job; de ${t.practitioner} komt eerst langs of belt terug.
8. Als een klant een eigen afspraak wil opzoeken, wijzigen of annuleren: ${opts.voice ? "gebruik find_appointments direct met het nummer waarmee hij belt" : "vraag om het telefoonnummer en gebruik find_appointments"}. Noem nooit afspraken die bij een ander telefoonnummer horen.
9. EU AI Act (vanaf augustus 2026): bevestig eerlijk dat je een AI bent als de klant dat vraagt. Bied bij technische complexiteit, een veiligheidsrisico (bijv. ${ap.hazardExamples}), klachten of een expliciet verzoek altijd aan om door te verbinden — gebruik dan escalate_to_staff.
10. Voor een concrete technische diagnose of prijsinschatting op basis van een lastig geval verwijs je door naar een inspectie ter plaatse door de ${t.practitioner} in plaats van zelf een oordeel te vellen.
11. Annuleringsbeleid: ${cancelPolicy}
12. Sluit af met een korte, warme bevestiging: wat is vastgelegd (noem het klusnummer uit het tool-resultaat) en wat de klant hierna kan verwachten.
13. Aanbetaling: als book_appointment een pending_deposit-resultaat teruggeeft, is de afspraak nog niet definitief — leg uit dat een aanbetaling nodig is en dat de betaallink dat afrondt. Vertel dit nooit als een keuze.
14. Foto's: als een klant een foto stuurt (bijv. ${ap.photoSubjects}), ${ap.photoRule.replace("{treatment}", t.treatment)}`;
}
