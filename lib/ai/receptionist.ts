import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { getAnthropic } from "@/lib/ai/anthropic";
import { findAvailableSlots, type AvailableSlot } from "@/lib/salon/availability";
import {
  findAppointmentsByPhone,
  bookFromSlot,
  rescheduleToSlot,
  cancelById,
  pushBookingToAgenda,
} from "@/lib/salon/appointments";
import { env, publicEnv } from "@/lib/env";
import { captureError } from "@/lib/observability";
import { getVerticalConfig } from "@/lib/salon/vertical";
import { buildJobSystemPrompt, buildJobTools } from "@/lib/ai/job-receptionist";
import { decodeSlot } from "@/lib/salon/availability";
import { syncJobFromAppointment } from "@/lib/jobs/lifecycle";

export interface SalonLocation {
  id: string;
  name: string;
  city: string | null;
  workingHours: Record<string, [number, number] | null>;
}

export interface SalonTreatment {
  id: string;
  name: string;
  category: string | null;
  durationMinutes: number;
  /** Intelligent Double-Booking (Pro): when all three are set, the stylist
   * is free during processingMinutes (e.g. hair color inwerktijd) for a
   * parallel booking — see RECEPTIONISTS rule below and buildSystemPrompt. */
  applicationMinutes?: number | null;
  processingMinutes?: number | null;
  finishingMinutes?: number | null;
  priceCents: number;
  description: string | null;
  prepInfo: string | null;
  aftercareInfo: string | null;
}

export interface SalonStaffMember {
  id: string;
  name: string;
  role: string | null;
  locationIds: string[];
  treatmentIds: string[];
}

export interface SalonKnowledgeEntry {
  title: string;
  content: string;
  category: string | null;
}

export interface SalonContext {
  id: string;
  name: string;
  city: string | null;
  phone: string | null;
  plan: string;
  /** Fase 7 core/vertical-scheiding — keys into lib/salon/vertical.ts. */
  vertical: string;
  agendaProvider: string | null;
  aiSettings: {
    agendaApiKey?: string | null;
    watiApiKey?: string | null;
    phoneNumber?: string | null;
    whatsappEnabled?: boolean;
    phoneEnabled?: boolean;
  };
  noShowSettings: {
    enabled?: boolean;
    freeCancelHours?: number;
    chargePercent?: number;
    depositRequired?: boolean;
    depositCents?: number;
  };
  locations: SalonLocation[];
  treatments: SalonTreatment[];
  staff: SalonStaffMember[];
  knowledgeEntries: SalonKnowledgeEntry[];
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  /** Fase 4 multimodale input: a photo the customer sent alongside this
   * message (kapselinspiratie, huidige haarkleur, uitgroei). Only ever set
   * on a user message. */
  imageUrl?: string | null;
}

export interface WatiConfirmationPayload {
  text: string;
  buttonId: string;
  buttonTitle: string;
}

export interface ReceptionistResponse {
  reply: string;
  bookedAppointment?: {
    appointmentId: string;
    customerName: string;
    customerPhone: string;
    serviceType: string;
    date: string;
    time: string;
    cancellationDeadline: string;
    externalId?: string;
    /** Present only for AI-WhatsApp bookings: the Middelburg-norm
     * confirmation message with an explicit accept button — the webhook
     * sends this via WATI's interactive-message endpoint instead of
     * pushing the booking straight to the agenda adapter. Absent for phone
     * bookings, which are confirmed immediately (no button to tap mid-call). */
    confirmationPayload?: WatiConfirmationPayload;
    /** Fase 2 vooruitbetalingen: set instead of confirmationPayload when the
     * treatment requires a deposit — the webhook sends this checkout link
     * rather than the Middelburg confirmation button message. */
    depositPayment?: { checkoutUrl: string; amountCents: number };
  };
  /** Set when the model called escalate_to_staff — the caller (webhook) can
   * tag the conversation for a human to pick up. */
  escalated?: { reason: string };
  /** Up to 4 concrete slots from the most recent check_availability call(s)
   * this turn, so a text/chat UI can render them as clickable options
   * instead of making the customer retype a time. Absent once a booking was
   * made this turn (nothing left to pick). */
  suggestedSlots?: { slotId: string; label: string }[];
}

const FALLBACK_NL =
  "Op dit moment kan ik je niet verder helpen. Bel ons gerust op, dan helpen we je direct verder.";

const MAX_TOOL_ROUNDS = 4;
const KNOWLEDGE_CHAR_BUDGET = 6000;
/** Sliding window: keep at most the last 10 interactions (10 user + 10
 * assistant messages) so token cost and stale-context hallucinations stay bounded. */
const MAX_HISTORY_MESSAGES = 20;

function formatDutchDate(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

/** Algemene voorwaarden-link — the platform's own terms page doubles as the
 * fallback cancellation-policy link when a salon has no own site on file. */
const DEFAULT_TERMS_URL = `${publicEnv.NEXT_PUBLIC_SITE_URL}/voorwaarden`;

/** Build the Middelburg-norm confirmation message: an explicit accept button
 * the customer must tap before the booking becomes enforceable. Includes a
 * link to the cancellation terms — required for the message to actually be
 * enforceable, not just the button. */
export function buildWatiConfirmationPayload(
  appointmentId: string,
  date: string,
  time: string,
  termsUrl: string = DEFAULT_TERMS_URL,
): WatiConfirmationPayload {
  return {
    text: `Je afspraak staat gereserveerd voor ${formatDutchDate(date)} om ${time}. Kosteloos annuleren kan tot 24 uur vooraf.\nLees de voorwaarden: ${termsUrl}\nKlik op de knop om te bevestigen en akkoord te gaan.`,
    buttonId: `confirm_booking_${appointmentId}`,
    buttonTitle: "Akkoord & Bevestigen",
  };
}

/** Shared tool catalogue — also the source Vapi's tool schema is derived
 * from (see lib/ai/vapi-assistant.ts) so both channels stay in sync. */
export const RECEPTIONIST_TOOLS: Anthropic.Tool[] = [
  {
    name: "check_availability",
    description:
      "Zoek beschikbare tijdslots voor een behandeling op een vestiging, over de komende dagen. Retourneert tot 8 slots met een slot_id die je later gebruikt om te boeken of te verzetten. Verzin nooit zelf tijden.",
    input_schema: {
      type: "object",
      properties: {
        location_id: { type: "string", description: "id uit de lijst LOCATIES" },
        treatment_id: { type: "string", description: "id uit de lijst BEHANDELINGEN" },
        staff_name: { type: "string", description: "optioneel: voorkeur voor een specifieke behandelaar" },
        days: { type: "integer", description: "hoeveel dagen vooruit zoeken, standaard 10" },
      },
      required: ["location_id", "treatment_id"],
    },
  },
  {
    name: "find_appointments",
    description:
      "Zoek bestaande afspraken van een klant op telefoonnummer. Gebruik dit voordat je een afspraak wijzigt of annuleert — noem nooit afspraken die niet bij dit telefoonnummer horen.",
    input_schema: {
      type: "object",
      properties: { phone: { type: "string" } },
      required: ["phone"],
    },
  },
  {
    name: "book_appointment",
    description:
      "Boek een nieuwe afspraak op een exact slot_id dat eerder is teruggegeven door check_availability. Bevestig naam en telefoonnummer bij de klant vóór je dit aanroept.",
    input_schema: {
      type: "object",
      properties: {
        slot_id: { type: "string" },
        customer_name: { type: "string" },
        customer_phone: { type: "string" },
      },
      required: ["slot_id", "customer_name", "customer_phone"],
    },
  },
  {
    name: "reschedule_appointment",
    description:
      "Verzet een bestaande afspraak (appointment_id uit find_appointments) naar een nieuw tijdslot (new_slot_id uit check_availability).",
    input_schema: {
      type: "object",
      properties: {
        appointment_id: { type: "string" },
        new_slot_id: { type: "string" },
      },
      required: ["appointment_id", "new_slot_id"],
    },
  },
  {
    name: "cancel_appointment",
    description: "Annuleer een bestaande afspraak (appointment_id uit find_appointments).",
    input_schema: {
      type: "object",
      properties: {
        appointment_id: { type: "string" },
        reason: { type: "string" },
      },
      required: ["appointment_id"],
    },
  },
  {
    name: "escalate_to_staff",
    description:
      "Verbind door naar een medewerker: gebruik dit bij klachten, medische complexiteit, VIP-klanten of als de klant er expliciet om vraagt.",
    input_schema: {
      type: "object",
      properties: { reason: { type: "string" } },
      required: ["reason"],
    },
  },
];

/** The tool catalogue for this salon's vertical. Kapper uses the shared
 * catalogue unchanged; a job vertical (loodgieter, schilder, ...) gets
 * register_job and a book_appointment that also captures the klusadres. */
export function getReceptionistTools(salon: Pick<SalonContext, "vertical">): Anthropic.Tool[] {
  const pack = getVerticalConfig(salon.vertical);
  // The pack lists exactly the tools its vertical uses (pack.agent.tools) —
  // adding or removing a tool for one trade never touches another's.
  const allowed = new Set<string>(pack.agent.tools);
  const base = RECEPTIONIST_TOOLS.filter((t) => allowed.has(t.name));
  const tools = pack.archetype === "job" ? buildJobTools(pack, base) : base;
  return tools.filter((t) => allowed.has(t.name));
}

const DUTCH_ONES = [
  "nul", "een", "twee", "drie", "vier", "vijf", "zes", "zeven", "acht", "negen", "tien",
  "elf", "twaalf", "dertien", "veertien", "vijftien", "zestien", "zeventien", "achttien", "negentien",
];
const DUTCH_TENS = ["", "", "twintig", "dertig", "veertig", "vijftig", "zestig", "zeventig", "tachtig", "negentig"];

/** Spells out a number in Dutch words (0-999) so voice-channel text never
 * hands the model a raw digit to mispronounce or read as an abbreviation
 * ("120min") — see VOICE_SPEECH_FORMATTING_NOTE in lib/ai/vapi-assistant.ts,
 * which this function backs up at the data level instead of relying on the
 * model reliably reformatting on its own. */
function numberToDutchWords(n: number): string {
  if (n < 0) return `min ${numberToDutchWords(-n)}`;
  if (n < 20) return DUTCH_ONES[n]!;
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const units = n % 10;
    return units === 0 ? DUTCH_TENS[tens]! : `${DUTCH_ONES[units]}en${DUTCH_TENS[tens]}`;
  }
  if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    const hundredsWord = hundreds === 1 ? "honderd" : `${DUTCH_ONES[hundreds]}honderd`;
    return rest === 0 ? hundredsWord : `${hundredsWord}${numberToDutchWords(rest)}`;
  }
  return String(n);
}

function spokenMinutes(n: number): string {
  return `${numberToDutchWords(n)} minuten`;
}
function spokenEuros(n: number): string {
  return `${numberToDutchWords(Math.round(n))} euro`;
}

/** Plain-language treatment list for the voice channel — durations and
 * prices are pre-spelled-out in Dutch words so pronunciation never depends
 * on the model reformatting raw JSON numbers correctly mid-call. */
function buildVoiceTreatmentsText(treatments: SalonTreatment[]): string {
  return treatments
    .map((t) => {
      const heeftInwerktijd = Boolean(t.applicationMinutes && t.processingMinutes && t.finishingMinutes);
      let line = `- ${t.name} (id: ${t.id}) — ${spokenEuros(t.priceCents / 100)}, ${spokenMinutes(t.durationMinutes)}.`;
      if (heeftInwerktijd) {
        line += ` Waarvan ${spokenMinutes(t.applicationMinutes!)} aanbrengen, ${spokenMinutes(t.processingMinutes!)} inwerktijd (behandelaar vrij voor iets anders), ${spokenMinutes(t.finishingMinutes!)} afwerken — stylist_vrij_tijdens_inwerktijd.`;
      }
      if (t.description) line += ` ${t.description}`;
      return line;
    })
    .join("\n");
}

/** Exported so the voice channel (lib/ai/vapi-assistant.ts) can give Vapi's
 * own model the exact same practice knowledge and behavior rules. Pass
 * `voice: true` there — it swaps the treatments block from raw JSON (fine
 * for the WhatsApp text channel) to a plain-language list with pre-spelled
 * durations/prices, since a caller hears mispronounced numbers a text
 * reader never would. */
export function buildSystemPrompt(salon: SalonContext, opts?: { voice?: boolean }): string {
  const vertical = getVerticalConfig(salon.vertical);
  const locationsJson = JSON.stringify(
    salon.locations.map((l) => ({ id: l.id, name: l.name, city: l.city })),
  );
  const treatmentsJson = JSON.stringify(
    salon.treatments.map((t) => {
      // Intelligent Double-Booking (Pro): only a treatment with all three
      // phases set (e.g. hair color) leaves the stylist free during
      // processing — a plain treatment has no inwerktijd_min at all.
      const heeftInwerktijd = Boolean(t.applicationMinutes && t.processingMinutes && t.finishingMinutes);
      return {
        id: t.id,
        name: t.name,
        category: t.category,
        duration_min: t.durationMinutes,
        ...(heeftInwerktijd
          ? {
              aanbreng_min: t.applicationMinutes,
              inwerktijd_min: t.processingMinutes,
              afwerk_min: t.finishingMinutes,
              stylist_vrij_tijdens_inwerktijd: true,
            }
          : {}),
        price_eur: Math.round(t.priceCents / 100),
        description: t.description,
        prep: t.prepInfo,
        aftercare: t.aftercareInfo,
      };
    }),
  );
  const treatmentsBlock = opts?.voice
    ? `BEHANDELINGEN (enige kennisbron voor prijs/duur/voorbereiding/nazorg — prijzen en tijden staan al voluit in woorden, lees ze exact zo over):\n${buildVoiceTreatmentsText(salon.treatments)}`
    : `BEHANDELINGEN (JSON — enige kennisbron voor prijs/duur/voorbereiding/nazorg): ${treatmentsJson}`;
  const staffJson = JSON.stringify(
    salon.staff.map((s) => ({
      naam: s.name,
      rol: s.role,
      vestigingen: s.locationIds,
      mag_behandelen: s.treatmentIds,
    })),
  );

  let knowledgeText = "";
  if (salon.knowledgeEntries.length) {
    let budget = KNOWLEDGE_CHAR_BUDGET;
    const parts: string[] = [];
    for (const entry of salon.knowledgeEntries) {
      const block = `### ${entry.title}${entry.category ? ` (${entry.category})` : ""}\n${entry.content}`;
      if (block.length > budget) break;
      parts.push(block);
      budget -= block.length;
    }
    knowledgeText = `\n\nKENNISBANK (protocollen/FAQ van de salon zelf):\n${parts.join("\n\n")}`;
  }

  if (vertical.archetype === "job") {
    return buildJobSystemPrompt(salon, vertical, {
      voice: opts?.voice,
      knowledgeText,
      servicesBlock: treatmentsBlock.replace(/^BEHANDELINGEN/, "DIENSTEN EN TARIEVEN"),
      staffJson,
      locationsJson,
    });
  }

  const complexityGuardTerm = vertical.hasHealthDataGuard
    ? "medische complexiteit, klachten"
    : "technische complexiteit of een veiligheidsrisico (bijv. gaslek, ernstige waterschade)";
  const diagnosisRule = vertical.hasHealthDataGuard
    ? "Voor concrete medische diagnoses verwijs je door naar een intake in plaats van zelf te diagnosticeren."
    : `Voor een concrete technische diagnose of prijsinschatting op basis van een lastig geval verwijs je door naar een inspectie ter plaatse door de ${vertical.terms.practitioner} in plaats van zelf een oordeel te vellen.`;
  const photoRule = vertical.hasHealthDataGuard
    ? `14. Foto's: als een klant een foto stuurt (kapselinspiratie, huidige haarkleur, uitgroei), gebruik die om in te schatten welke ${vertical.terms.treatment} en hoeveel tijd nodig is, en noem dat kort in je antwoord (bijv. "op basis van je foto lijkt dit op een balayage met flink wat uitgroei"). Stel nooit een medische diagnose op basis van een foto — bij twijfel over een huid- of hoofdhuidconditie: escalate_to_staff.`
    : `14. Foto's: als een klant een foto stuurt (bijv. een lekkage, leiding of cv-ketel), gebruik die om in te schatten welke ${vertical.terms.treatment} en hoeveel tijd nodig is, en noem dat kort in je antwoord. Bij een mogelijk gevaarlijke situatie (gaslek, ernstige waterschade) altijd escalate_to_staff gebruiken in plaats van zelf gerust te stellen.`;

  return `Je bent de AI-receptioniste van ${salon.name}${salon.city ? ` in ${salon.city}` : ""}. Je communiceert uitsluitend in vlot, vriendelijk, professioneel Nederlands.

LOCATIES (JSON): ${locationsJson}

${treatmentsBlock}

BEHANDELAARS EN BEVOEGDHEDEN (JSON): ${staffJson}
${knowledgeText}

GEDRAGSREGELS:
1. Communiceer kort — maximaal ongeveer 4 zinnen per bericht, tenzij je een lijst toont (gebruik dan bullets). Schrijf platte tekst zonder markdown-opmaak: geen ** of * rond woorden, geen #-koppen. Namen en behandelingen benoem je gewoon, zonder ze vet te maken.
2. Vraag naar de vestiging als die niet duidelijk is uit het gesprek, vóórdat je check_availability aanroept — sla dit over als er maar één locatie is. Uitzondering: als je een klant moet doorverwijzen naar een andere, wél bevoegde behandelaar (bijv. de gevraagde behandelaar voert deze behandeling niet uit) en er zijn hooguit twee bevoegde alternatieven, vraag dan niet eerst welke vestiging — roep check_availability meteen aan voor elk alternatief en presenteer de klant in één bericht de concrete tijdsopties per vestiging/behandelaar, zodat hij in één keer kan kiezen.
3. Koppel een behandeling uitsluitend aan behandelaars die volgens BEHANDELAARS bevoegd zijn — verzin dit nooit.
4. Gebruik voor beschikbaarheid, bestaande afspraken, boeken, verzetten en annuleren ALTIJD de bijbehorende tool. Verzin nooit zelf tijden, slot_id's of appointment_id's — kopieer ze letterlijk uit een eerder tool-resultaat.
5. ${opts?.voice ? "Het nummer waarmee de beller belt is al bekend en betrouwbaar (nummerherkenning), dus je hoeft er niet naar te vragen. Bevestig vóór het boeken, verzetten of annuleren wel altijd de volledige naam van de klant." : "Bevestig altijd de volledige naam én het telefoonnummer van de klant vóórdat je boekt, verzet of annuleert."}
6. ${opts?.voice ? "Als de beller een eigen afspraak wil opzoeken, wijzigen of annuleren: gebruik find_appointments direct met het nummer waarmee hij belt — vraag daar niet apart naar, tenzij hij zelf zegt dat hij namens iemand anders belt of een ander nummer wil opzoeken." : "Als een klant een eigen afspraak wil opzoeken, wijzigen of annuleren: vraag om het telefoonnummer en gebruik find_appointments."} Noem nooit afspraken die bij een ander telefoonnummer horen.
7. Denk actief mee: als iemand twijfelt tussen behandelingen of een klacht beschrijft, stel op basis van de BEHANDELINGEN- en KENNISBANK-info een passende behandeling of intake voor, met een korte uitleg waarom.
8. EU AI Act (vanaf augustus 2026): bevestig eerlijk dat je een AI bent als de klant dat vraagt. Bied bij ${complexityGuardTerm}, twijfel of een expliciet verzoek altijd aan om door te verbinden — gebruik dan escalate_to_staff.
9. ${diagnosisRule}
10. Annuleringsbeleid: ${salon.noShowSettings.enabled ? `Klanten kunnen gratis annuleren tot ${salon.noShowSettings.freeCancelHours ?? 24} uur voor de afspraak.` : `Neem contact op met het ${vertical.terms.establishment} voor het annuleringsbeleid.`}
11. Sluit een geslaagde boeking, wijziging of annulering af met een korte, warme bevestiging.
12. Intelligent Double-Booking: als een ${vertical.terms.treatment} \`stylist_vrij_tijdens_inwerktijd\` heeft (een deel met onbemand inwerk-/uithardtijd), is de ${vertical.terms.practitioner} tijdens \`inwerktijd_min\` vrij voor iets korts bij dezelfde klant of zelfs een andere klant. check_availability houdt hier al rekening mee door slots in dat venster aan te bieden — vertel de beller dit gerust actief.
13. Aanbetaling: als book_appointment een pending_deposit-resultaat teruggeeft, is de afspraak nog niet definitief — leg uit dat er een aanbetaling nodig is en dat de betaallink (die je in dit bericht meestuurt) dat afrondt. Vertel dit nooit als een keuze — het is verplicht voor deze ${vertical.terms.treatment}.
${photoRule}`;
}

/** Defense-in-depth: the system prompt tells the model to write plain text,
 * but strip stray markdown emphasis anyway — WhatsApp and the demo widget
 * both render markdown asterisks and hash-headers literally, which reads as
 * broken formatting rather than emphasis. */
function stripMarkdownEmphasis(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(?<!\w)\*([^*\n]+)\*(?!\w)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "");
}

function textOf(response: Anthropic.Message): string {
  const raw = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  return stripMarkdownEmphasis(raw);
}

interface RunToolState {
  bookedAppointment?: ReceptionistResponse["bookedAppointment"];
  escalated?: ReceptionistResponse["escalated"];
  /** Job verticals: the most recent photo the customer sent — attached to the
   * klus when register_job / book_appointment creates it. */
  lastImageUrl?: string | null;
  /** Slots offered across every check_availability call this turn, most
   * recent first — capped and labeled into suggestedSlots once the turn
   * ends (see getReceptionistReply). */
  offeredSlots?: AvailableSlot[];
}

function slotLabel(slot: AvailableSlot): string {
  const dateLabel = formatDutchDate(slot.date);
  return `${dateLabel} om ${slot.time} bij ${slot.staffName} (${slot.locationName})`;
}

/** Klusadres from tool args; null unless all four parts are present. */
function readJobAddress(
  args: Record<string, unknown>,
): { street: string; houseNumber: string; postalCode: string; city: string } | null {
  const street = String(args.street ?? "").trim();
  const houseNumber = String(args.house_number ?? "").trim();
  const postalCode = String(args.postal_code ?? "").trim();
  const city = String(args.city ?? "").trim();
  return street && houseNumber && postalCode && city ? { street, houseNumber, postalCode, city } : null;
}

/** Slot staff ids are placeholders when the salon has no staff rows. */
function realStaffId(id: string): string | null {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? id : null;
}

async function runTool(
  name: string,
  args: Record<string, unknown>,
  salon: SalonContext,
  customerPhone: string,
  conversationId: string | null | undefined,
  state: RunToolState,
  channel: "whatsapp" | "phone" = "whatsapp",
): Promise<string> {
  // A tool the vertical does not offer must not run even if a stale voice
  // assistant or a hallucinating model asks for it.
  if (!getVerticalConfig(salon.vertical).agent.tools.includes(name as never)) {
    return JSON.stringify({ error: `Onbekende tool: ${name}` });
  }
  switch (name) {
    case "check_availability": {
      const result = await findAvailableSlots({
        salonId: salon.id,
        salonName: salon.name,
        salonCity: salon.city,
        locationId: String(args.location_id ?? ""),
        treatmentId: String(args.treatment_id ?? ""),
        staffName: args.staff_name ? String(args.staff_name) : undefined,
        days: args.days ? Number(args.days) : undefined,
        agendaProvider: salon.agendaProvider,
        agendaApiKey: salon.aiSettings.agendaApiKey,
      });
      if (result.slots.length) {
        state.offeredSlots = [...(state.offeredSlots ?? []), ...result.slots];
      }
      return JSON.stringify(result);
    }
    case "find_appointments": {
      // Falls back to the channel's own known number (real caller-ID on a
      // phone call) when the model doesn't supply one — the system prompt
      // tells it not to bother asking on voice calls, so this can't rely on
      // the model always filling in `phone` itself.
      const result = await findAppointmentsByPhone(salon.id, String(args.phone || customerPhone || ""));
      return JSON.stringify(result);
    }
    case "book_appointment": {
      const customerName = String(args.customer_name ?? "");
      const customerPhoneArg = String(args.customer_phone ?? customerPhone);
      // Job verticals: a booking without a klusadres is useless to the
      // monteur — bounce back to the model so it asks for it first.
      const isJobVertical = getVerticalConfig(salon.vertical).archetype === "job";
      const jobAddress = isJobVertical ? readJobAddress(args) : null;
      if (isJobVertical && !jobAddress) {
        return JSON.stringify({
          error: "Vraag eerst het volledige klusadres (straat, huisnummer, postcode, plaats) en wat er aan de hand is.",
        });
      }
      const result = await bookFromSlot({
        salonId: salon.id,
        salonName: salon.name,
        slotId: String(args.slot_id ?? ""),
        customerName,
        customerPhone: customerPhoneArg,
        conversationId,
        agendaProvider: salon.agendaProvider,
        freeCancelHours: salon.noShowSettings.freeCancelHours,
        depositRequired: salon.noShowSettings.depositRequired,
        depositCents: salon.noShowSettings.depositCents,
        channel,
      });
      if ("error" in result) return JSON.stringify(result);

      // Middelburg-norm (WhatsApp only): the appointment stays
      // pending_confirmation and is NOT pushed to the agenda adapter until
      // the customer taps the WATI confirmation button
      // (app/api/webhooks/wati/route.ts handles that). A phone booking has
      // no button to tap — bookFromSlot already confirmed it immediately,
      // so the caller hears it's booked, not "we'll call you back" — push it
      // to the connected agenda software right away instead of leaving it
      // stuck in this app's own database only. A deposit-required booking
      // (Fase 2) isn't pushed either — that happens once Stripe confirms
      // payment (lib/billing/provision.ts's handleDepositCheckout).
      if (!result.pendingConfirmation && !result.depositPayment) {
        await pushBookingToAgenda(salon.agendaProvider, salon.aiSettings.agendaApiKey, result.appointmentId, {
          customerName,
          customerPhone: customerPhoneArg,
          serviceType: result.treatment,
          date: result.date,
          time: result.time,
        });
      }

      state.bookedAppointment = {
        appointmentId: result.appointmentId,
        customerName,
        customerPhone: customerPhoneArg,
        serviceType: result.treatment,
        date: result.date,
        time: result.time,
        cancellationDeadline: result.cancellationDeadline,
        ...(result.depositPayment
          ? { depositPayment: result.depositPayment }
          : result.pendingConfirmation
            ? { confirmationPayload: buildWatiConfirmationPayload(result.appointmentId, result.date, result.time) }
            : {}),
      };
      let jobNumber: string | undefined;
      if (isJobVertical && jobAddress) {
        const decoded = decodeSlot(String(args.slot_id ?? ""));
        const { registerJobRequest } = await import("@/lib/jobs/intake");
        const job = await registerJobRequest({
          salonId: salon.id,
          customer: { name: customerName, phone: customerPhoneArg },
          address: jobAddress,
          description: String(args.description ?? "Bezoek geboekt via de AI-receptionist"),
          category: args.category ? String(args.category) : null,
          conversationId,
          source: channel === "phone" ? "ai_phone" : "ai_whatsapp",
          photoUrl: state.lastImageUrl ?? null,
          appointment: decoded
            ? { id: result.appointmentId, start: new Date(decoded.startISO), staffId: realStaffId(decoded.staffId) }
            : null,
        });
        if (!("error" in job)) jobNumber = job.number;
      }
      return JSON.stringify({
        ok: true,
        ...(jobNumber ? { klusnummer: jobNumber } : {}),
        ...(result.depositPayment
          ? { pending_deposit: true, deposit_amount_eur: result.depositPayment.amountCents / 100 }
          : result.pendingConfirmation
            ? { pending_confirmation: true }
            : { confirmed: true }),
        treatment: result.treatment,
        location: result.location,
        date: result.date,
        time: result.time,
      });
    }
    case "reschedule_appointment": {
      const result = await rescheduleToSlot(
        salon.id,
        String(args.appointment_id ?? ""),
        String(args.new_slot_id ?? ""),
      );
      if ("ok" in result && getVerticalConfig(salon.vertical).archetype === "job") {
        await syncJobFromAppointment(String(args.appointment_id ?? ""));
      }
      return JSON.stringify(result);
    }
    case "cancel_appointment": {
      const result = await cancelById(salon.id, String(args.appointment_id ?? ""));
      if ("ok" in result && getVerticalConfig(salon.vertical).archetype === "job") {
        await syncJobFromAppointment(String(args.appointment_id ?? ""));
      }
      return JSON.stringify(result);
    }
    case "register_job": {
      if (getVerticalConfig(salon.vertical).archetype !== "job") {
        return JSON.stringify({ error: `Onbekende tool: ${name}` });
      }
      const address = readJobAddress(args);
      if (!address) {
        return JSON.stringify({
          error: "Vraag eerst het volledige klusadres (straat, huisnummer, postcode, plaats).",
        });
      }
      const { registerJobRequest } = await import("@/lib/jobs/intake");
      const job = await registerJobRequest({
        salonId: salon.id,
        customer: {
          name: String(args.customer_name ?? ""),
          phone: String(args.customer_phone || customerPhone || ""),
        },
        address,
        description: String(args.description ?? ""),
        category: args.category ? String(args.category) : null,
        urgency: args.urgency === "spoed" ? "spoed" : "normaal",
        preferredTime: args.preferred_time ? String(args.preferred_time) : null,
        conversationId,
        source: channel === "phone" ? "ai_phone" : "ai_whatsapp",
        photoUrl: state.lastImageUrl ?? null,
      });
      if ("error" in job) return JSON.stringify(job);
      // A spoed klus must reach a human even if the model forgets to
      // escalate — the register itself already alerted the owner.
      if (job.urgent && !state.escalated) {
        state.escalated = { reason: `Spoedklus ${job.number} — ${job.addressLine ?? "adres onbekend"}` };
      }
      return JSON.stringify({
        ok: true,
        klusnummer: job.number,
        spoed: job.urgent,
        adres: job.addressLine,
        ...(job.addressWarning ? { let_op: job.addressWarning } : {}),
        note: job.urgent
          ? "Spoedklus vastgelegd en de vakman is direct gewaarschuwd."
          : "Klus vastgelegd; de vakman neemt contact op om in te plannen.",
      });
    }
    case "escalate_to_staff": {
      const reason = String(args.reason ?? "Vraag van de klant vereist een medewerker.");
      state.escalated = { reason };
      return JSON.stringify({ ok: true, note: "Doorverbonden — een medewerker neemt dit over." });
    }
    default:
      return JSON.stringify({ error: `Onbekende tool: ${name}` });
  }
}

export interface ToolExecutionResult {
  resultText: string;
  bookedAppointment?: ReceptionistResponse["bookedAppointment"];
  escalated?: ReceptionistResponse["escalated"];
}

/**
 * Run a single tool by name — the same logic getReceptionistReply uses
 * internally, exposed for a channel (Vapi's own Claude-backed voice model)
 * that calls tools directly instead of going through our own tool loop.
 */
export async function executeReceptionistTool(
  name: string,
  args: Record<string, unknown>,
  salon: SalonContext,
  customerPhone: string,
  conversationId?: string | null,
): Promise<ToolExecutionResult> {
  const state: RunToolState = {};
  const resultText = await runTool(name, args, salon, customerPhone, conversationId, state, "phone");
  return { resultText, bookedAppointment: state.bookedAppointment, escalated: state.escalated };
}

/** Artikel 50 EU AI Act: onmiskenbare AI-identificatie bij het allereerste
 * bericht van een nieuwe conversatie. Deterministisch toegevoegd in code
 * (niet aan het model overgelaten) zodat dit gegarandeerd is. */
function aiDisclosure(salonName: string): string {
  return `Je spreekt met de virtuele AI-assistent van ${salonName}.`;
}

function withDisclosure(reply: string, isNewConversation: boolean, salonName: string): string {
  if (!isNewConversation) return reply;
  return `${aiDisclosure(salonName)} ${reply}`;
}

export async function getReceptionistReply(
  salon: SalonContext,
  history: ConversationMessage[],
  customerPhone: string,
  conversationId?: string | null,
  isNewConversation = false,
): Promise<ReceptionistResponse> {
  const anthropic = getAnthropic();
  if (!anthropic) {
    return { reply: withDisclosure(FALLBACK_NL, isNewConversation, salon.name) };
  }

  const systemPrompt = buildSystemPrompt(salon);
  const messages: Anthropic.MessageParam[] = history.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
    role: m.role,
    // Multimodal (Fase 4): an image-bearing user message becomes a content
    // block array (image + text) instead of a plain string — Claude fetches
    // the photo directly from the URL, no base64 round-trip needed.
    content: m.imageUrl
      ? [
          { type: "image" as const, source: { type: "url" as const, url: m.imageUrl } },
          { type: "text" as const, text: m.content || "(foto zonder tekst)" },
        ]
      : m.content,
  }));

  const state: RunToolState = {
    lastImageUrl: [...history].reverse().find((m) => m.role === "user" && m.imageUrl)?.imageUrl ?? null,
  };
  const tools = getReceptionistTools(salon);

  try {
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const response = await anthropic.messages.create({
        model: env.OPENMODEL_MODEL,
        max_tokens: 768,
        system: systemPrompt,
        tools,
        messages,
      });

      const toolUses = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");

      if (!toolUses.length || round === MAX_TOOL_ROUNDS) {
        const reply = withDisclosure(textOf(response) || FALLBACK_NL, isNewConversation, salon.name);
        // Nothing left to pick once a booking went through this turn.
        const suggestedSlots = state.bookedAppointment
          ? undefined
          : state.offeredSlots?.slice(0, 4).map((s) => ({ slotId: s.slotId, label: slotLabel(s) }));
        return {
          reply,
          bookedAppointment: state.bookedAppointment,
          escalated: state.escalated,
          ...(suggestedSlots?.length ? { suggestedSlots } : {}),
        };
      }

      messages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const toolUse of toolUses) {
        const resultText = await runTool(
          toolUse.name,
          (toolUse.input as Record<string, unknown>) ?? {},
          salon,
          customerPhone,
          conversationId,
          state,
        );
        toolResults.push({ type: "tool_result", tool_use_id: toolUse.id, content: resultText });
      }
      messages.push({ role: "user", content: toolResults });
    }

    return {
      reply: withDisclosure(FALLBACK_NL, isNewConversation, salon.name),
      bookedAppointment: state.bookedAppointment,
      escalated: state.escalated,
    };
  } catch (err) {
    captureError("receptionist/claude", err);
    return { reply: withDisclosure(FALLBACK_NL, isNewConversation, salon.name) };
  }
}
