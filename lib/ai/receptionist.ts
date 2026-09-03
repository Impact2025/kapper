import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { getAnthropic } from "@/lib/ai/anthropic";
import { getAgendaAdapter } from "@/lib/agenda";
import { findAvailableSlots } from "@/lib/salon/availability";
import {
  findAppointmentsByPhone,
  bookFromSlot,
  rescheduleToSlot,
  cancelById,
  setExternalId,
} from "@/lib/salon/appointments";
import { decrypt } from "@/lib/crypto";
import { env } from "@/lib/env";

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
  };
  locations: SalonLocation[];
  treatments: SalonTreatment[];
  staff: SalonStaffMember[];
  knowledgeEntries: SalonKnowledgeEntry[];
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ReceptionistResponse {
  reply: string;
  bookedAppointment?: {
    customerName: string;
    customerPhone: string;
    serviceType: string;
    date: string;
    time: string;
    externalId?: string;
  };
  /** Set when the model called escalate_to_staff — the caller (webhook) can
   * tag the conversation for a human to pick up. */
  escalated?: { reason: string };
}

const FALLBACK_NL =
  "Op dit moment kan ik je niet verder helpen. Bel ons gerust op, dan helpen we je direct verder.";

const MAX_TOOL_ROUNDS = 4;
const KNOWLEDGE_CHAR_BUDGET = 6000;

const TOOLS: Anthropic.Tool[] = [
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

function buildSystemPrompt(salon: SalonContext): string {
  const locationsJson = JSON.stringify(
    salon.locations.map((l) => ({ id: l.id, name: l.name, city: l.city })),
  );
  const treatmentsJson = JSON.stringify(
    salon.treatments.map((t) => ({
      id: t.id,
      name: t.name,
      category: t.category,
      duration_min: t.durationMinutes,
      price_eur: Math.round(t.priceCents / 100),
      description: t.description,
      prep: t.prepInfo,
      aftercare: t.aftercareInfo,
    })),
  );
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

  return `Je bent de AI-receptioniste van ${salon.name}${salon.city ? ` in ${salon.city}` : ""}. Je communiceert uitsluitend in vlot, vriendelijk, professioneel Nederlands.

LOCATIES (JSON): ${locationsJson}

BEHANDELINGEN (JSON — enige kennisbron voor prijs/duur/voorbereiding/nazorg): ${treatmentsJson}

BEHANDELAARS EN BEVOEGDHEDEN (JSON): ${staffJson}
${knowledgeText}

GEDRAGSREGELS:
1. Communiceer kort — maximaal ongeveer 4 zinnen per bericht, tenzij je een lijst toont (gebruik dan bullets).
2. Vraag naar de vestiging als die niet duidelijk is uit het gesprek, vóórdat je check_availability aanroept — sla dit over als er maar één locatie is.
3. Koppel een behandeling uitsluitend aan behandelaars die volgens BEHANDELAARS bevoegd zijn — verzin dit nooit.
4. Gebruik voor beschikbaarheid, bestaande afspraken, boeken, verzetten en annuleren ALTIJD de bijbehorende tool. Verzin nooit zelf tijden, slot_id's of appointment_id's — kopieer ze letterlijk uit een eerder tool-resultaat.
5. Bevestig altijd de volledige naam én het telefoonnummer van de klant vóórdat je boekt, verzet of annuleert.
6. Als een klant een eigen afspraak wil opzoeken, wijzigen of annuleren: vraag om het telefoonnummer en gebruik find_appointments. Noem nooit afspraken die bij een ander telefoonnummer horen.
7. Denk actief mee: als iemand twijfelt tussen behandelingen of een klacht beschrijft, stel op basis van de BEHANDELINGEN- en KENNISBANK-info een passende behandeling of intake voor, met een korte uitleg waarom.
8. EU AI Act (vanaf augustus 2026): bevestig eerlijk dat je een AI bent als de klant dat vraagt. Bied bij medische complexiteit, klachten, twijfel of een expliciet verzoek altijd aan om door te verbinden — gebruik dan escalate_to_staff.
9. Voor concrete medische diagnoses verwijs je door naar een intake in plaats van zelf te diagnosticeren.
10. Annuleringsbeleid: ${salon.noShowSettings.enabled ? `Klanten kunnen gratis annuleren tot ${salon.noShowSettings.freeCancelHours ?? 24} uur voor de afspraak.` : "Neem contact op met de salon voor het annuleringsbeleid."}
11. Sluit een geslaagde boeking, wijziging of annulering af met een korte, warme bevestiging.`;
}

function textOf(response: Anthropic.Message): string {
  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

async function runTool(
  name: string,
  args: Record<string, unknown>,
  salon: SalonContext,
  customerPhone: string,
  conversationId: string | null | undefined,
  state: { bookedAppointment?: ReceptionistResponse["bookedAppointment"]; escalated?: ReceptionistResponse["escalated"] },
): Promise<string> {
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
      });
      return JSON.stringify(result);
    }
    case "find_appointments": {
      const result = await findAppointmentsByPhone(salon.id, String(args.phone ?? ""));
      return JSON.stringify(result);
    }
    case "book_appointment": {
      const customerName = String(args.customer_name ?? "");
      const customerPhoneArg = String(args.customer_phone ?? customerPhone);
      const result = await bookFromSlot({
        salonId: salon.id,
        slotId: String(args.slot_id ?? ""),
        customerName,
        customerPhone: customerPhoneArg,
        conversationId,
        agendaProvider: salon.agendaProvider,
      });
      if ("error" in result) return JSON.stringify(result);

      // Best-effort push to the connected agenda provider — our own DB
      // stays the source of truth regardless of whether this succeeds.
      let externalId: string | undefined;
      try {
        const rawKey = salon.aiSettings.agendaApiKey ?? null;
        const apiKey = rawKey ? (decrypt(rawKey) ?? rawKey) : null;
        const adapter = getAgendaAdapter(salon.agendaProvider, apiKey);
        if (adapter) {
          const pushResult = await adapter.bookAppointment({
            customerName,
            customerPhone: customerPhoneArg,
            serviceType: result.treatment,
            date: result.date,
            time: result.time,
          });
          if (pushResult.ok && pushResult.externalId) {
            externalId = pushResult.externalId;
            await setExternalId(result.appointmentId, externalId);
          }
        }
      } catch {
        // Non-fatal: the booking already exists in our own DB.
      }

      state.bookedAppointment = {
        customerName,
        customerPhone: customerPhoneArg,
        serviceType: result.treatment,
        date: result.date,
        time: result.time,
        externalId,
      };
      return JSON.stringify({ ok: true, treatment: result.treatment, location: result.location, date: result.date, time: result.time });
    }
    case "reschedule_appointment": {
      const result = await rescheduleToSlot(
        salon.id,
        String(args.appointment_id ?? ""),
        String(args.new_slot_id ?? ""),
      );
      return JSON.stringify(result);
    }
    case "cancel_appointment": {
      const result = await cancelById(salon.id, String(args.appointment_id ?? ""));
      return JSON.stringify(result);
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

export async function getReceptionistReply(
  salon: SalonContext,
  history: ConversationMessage[],
  customerPhone: string,
  conversationId?: string | null,
): Promise<ReceptionistResponse> {
  const anthropic = getAnthropic();
  if (!anthropic) {
    return { reply: FALLBACK_NL };
  }

  const systemPrompt = buildSystemPrompt(salon);
  const messages: Anthropic.MessageParam[] = history.slice(-10).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const state: { bookedAppointment?: ReceptionistResponse["bookedAppointment"]; escalated?: ReceptionistResponse["escalated"] } = {};

  try {
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const response = await anthropic.messages.create({
        model: env.ANTHROPIC_MODEL_FAST,
        max_tokens: 768,
        system: systemPrompt,
        tools: TOOLS,
        messages,
      });

      const toolUses = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");

      if (!toolUses.length || round === MAX_TOOL_ROUNDS) {
        const reply = textOf(response) || FALLBACK_NL;
        return { reply, bookedAppointment: state.bookedAppointment, escalated: state.escalated };
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

    return { reply: FALLBACK_NL, bookedAppointment: state.bookedAppointment, escalated: state.escalated };
  } catch (err) {
    console.error("[receptionist] Claude error:", err);
    return { reply: FALLBACK_NL };
  }
}
