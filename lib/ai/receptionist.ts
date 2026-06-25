import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { getAnthropic } from "@/lib/ai/anthropic";
import { getAgendaAdapter } from "@/lib/agenda";
import { decrypt } from "@/lib/crypto";
import { env } from "@/lib/env";

export interface SalonContext {
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
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ReceptionistResponse {
  reply: string;
  /** Filled when the AI detected and confirmed an appointment booking. */
  bookedAppointment?: {
    customerName: string;
    customerPhone: string;
    serviceType: string;
    date: string;
    time: string;
  };
}

const FALLBACK_NL =
  "Op dit moment kan ik je niet verder helpen. Bel ons gerust op, dan helpen we je direct verder.";

function buildSystemPrompt(salon: SalonContext, slotsText: string): string {
  return `Je bent de AI-receptioniste van ${salon.name}${salon.city ? ` in ${salon.city}` : ""}. Je communiceert uitsluitend in vlot, vriendelijk Nederlands.

SALONINFORMATIE:
- Naam: ${salon.name}
- Telefoon: ${salon.phone ?? "niet beschikbaar"}
${salon.city ? `- Stad: ${salon.city}` : ""}

BESCHIKBARE TIJDSLOTS (komende 7 dagen):
${slotsText || "Geen slots gevonden — vraag de klant om later te bellen of stuur ze door naar de telefoon."}

GEDRAGSREGELS:
1. Bied ALLEEN tijdslots aan die in de bovenstaande lijst staan — verzin er nooit zelf.
2. Bevestig altijd de volledige naam en het telefoonnummer van de klant vóórdat je boekt.
3. Als de boeking bevestigd is, geef dit formaat terug aan het EINDE van je bericht (verborgen voor klant):
   [BOEKING: naam=<naam>, telefoon=<tel>, dienst=<dienst>, datum=<YYYY-MM-DD>, tijd=<HH:MM>]
4. EU AI Act (aug 2026): Identificeer jezelf als AI-receptioniste als de klant er direct naar vraagt. Bied altijd de optie aan om door te verbinden met een medewerker.
5. Escaleer naar een medewerker bij: klachten, complexe kleurcorrecties, VIP-klanten of situaties buiten de boeking.
6. Annuleringsbeleid: ${salon.noShowSettings.enabled ? `Klanten kunnen gratis annuleren tot ${salon.noShowSettings.freeCancelHours ?? 24} uur voor de afspraak.` : "Neem contact op met de salon voor het annuleringsbeleid."}
7. Houd antwoorden kort en to-the-point — max 3-4 zinnen per bericht.`;
}

function extractBooking(
  reply: string,
  fallbackPhone: string,
): ReceptionistResponse["bookedAppointment"] | undefined {
  const match = reply.match(
    /\[BOEKING:\s*naam=([^,]+),\s*telefoon=([^,]+),\s*dienst=([^,]+),\s*datum=(\d{4}-\d{2}-\d{2}),\s*tijd=(\d{2}:\d{2})\]/i,
  );
  if (!match) return undefined;
  return {
    customerName: match[1]!.trim(),
    customerPhone: match[2]!.trim() || fallbackPhone,
    serviceType: match[3]!.trim(),
    date: match[4]!,
    time: match[5]!,
  };
}

function stripBookingTag(reply: string): string {
  return reply.replace(/\[BOEKING:[^\]]*\]/gi, "").trim();
}

export async function getReceptionistReply(
  salon: SalonContext,
  history: ConversationMessage[],
  customerPhone: string,
): Promise<ReceptionistResponse> {
  const anthropic = getAnthropic();
  if (!anthropic) {
    return { reply: FALLBACK_NL };
  }

  // Fetch live slots if agenda is connected
  let slotsText = "";
  try {
    const aiSettings = salon.aiSettings;
    const rawKey = aiSettings.agendaApiKey ?? null;
    const apiKey = rawKey ? (decrypt(rawKey) ?? rawKey) : null;
    const adapter = getAgendaAdapter(salon.agendaProvider, apiKey);
    if (adapter) {
      const slots = await adapter.getAvailableSlots(7);
      slotsText = slots
        .slice(0, 30) // limit context size
        .map((s) => `- ${s.date} ${s.time}: ${s.serviceType} (${s.durationMinutes}min, €${s.priceEuros})`)
        .join("\n");
    }
  } catch {
    // Non-fatal: proceed without slots
  }

  const systemPrompt = buildSystemPrompt(salon, slotsText);
  const messages: Anthropic.MessageParam[] = history.slice(-10).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  try {
    const response = await anthropic.messages.create({
      model: env.ANTHROPIC_MODEL_FAST,
      max_tokens: 512,
      system: systemPrompt,
      messages,
    });

    const rawReply = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    const bookedAppointment = extractBooking(rawReply, customerPhone);
    const reply = stripBookingTag(rawReply);

    return { reply, bookedAppointment };
  } catch (err) {
    console.error("[receptionist] Claude error:", err);
    return { reply: FALLBACK_NL };
  }
}
