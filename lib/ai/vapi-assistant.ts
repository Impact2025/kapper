import "server-only";
import { RECEPTIONIST_TOOLS, buildSystemPrompt, type SalonContext } from "@/lib/ai/receptionist";
import { env } from "@/lib/env";

const VAPI_BASE = "https://api.vapi.ai";

/**
 * Claude model id Vapi's native Anthropic provider accepts for the voice
 * assistant. Kept independent from env.ANTHROPIC_MODEL_FAST (which is our
 * own WhatsApp-path model id passed straight to the Anthropic SDK) so the
 * two can be tuned separately, even though they happen to match today.
 */
const VAPI_ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

/** Artikel 50 EU AI Act: reinforces the deterministic firstMessage
 * disclosure for the rest of the call — the voice model must keep
 * confirming it's an AI on any repeated or doubtful question, not just say
 * it once at pickup. Appended only to the voice system prompt, since the
 * WhatsApp channel already gets its own deterministic (code-level, not
 * model-decided) disclosure — see getReceptionistReply's isNewConversation. */
const VOICE_AI_TRANSPARENCY_NOTE =
  "\n\nBELANGRIJK (Artikel 50 EU AI Act): dit is een telefoongesprek met een AI-stem. Als de beller op enig moment vraagt of hij met een mens spreekt, of daar twijfel over uit, bevestig dan altijd expliciet en eerlijk dat je een virtuele AI-assistent bent — herhaal dit net zo vaak als nodig, ongeacht hoe vaak het gevraagd wordt.";

/** The system prompt's BEHANDELINGEN/LOCATIES/BEHANDELAARS blocks are raw
 * JSON (fine for the WhatsApp text channel) with compact keys like
 * `duration_min: 120` — spoken verbatim that reads as "honderdtwintig min"
 * or worse through TTS. Voice-only instruction to always reformat numbers,
 * durations and prices into full spoken Dutch words before saying them. */
const VOICE_SPEECH_FORMATTING_NOTE =
  "\n\nSPREEKSTIJL: je leest bovenstaande JSON-data nooit letterlijk voor. Schrijf getallen, tijdsduur en bedragen altijd voluit in natuurlijke gesproken taal — bijvoorbeeld \"120\" wordt \"honderdtwintig minuten\" (nooit \"honderdtwintig min\" of \"één twee nul\"), \"45\" wordt \"vijfenveertig minuten\", \"65 euro\" wordt \"vijfenzestig euro\". Spreek tijdstippen ook voluit uit (\"tien uur dertig\", niet \"10:30\").";

const TRANSFER_ANNOUNCEMENT =
  "Ik verbind u nu direct door met een van onze medewerkers. Een ogenblik geduld.";

interface VapiFunctionTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: unknown;
  };
}

/**
 * Vapi's native call-transfer tool: performs the handoff at the telephony
 * (PSTN/carrier) level instead of the AI staying bridged on the line — this
 * frees the AI's channel immediately so the salon isn't billed for two
 * simultaneous call legs. Shape follows Vapi's own transferCall tool schema
 * exactly (flat `name`, no `function` wrapper, no extra fields on the
 * destination beyond type/number/message).
 */
interface VapiTransferCallTool {
  type: "transferCall";
  destinations: {
    type: "number";
    number: string;
    message: string;
  }[];
}

type VapiTool = VapiFunctionTool | VapiTransferCallTool;

/** Anthropic's `Tool` shape (name/description/input_schema) maps 1:1 onto
 * Vapi's OpenAI-style function-tool shape — both are JSON Schema underneath.
 * The one exception is escalate_to_staff: when the salon has a phone number
 * on file, it becomes a native transferCall tool instead of a function
 * routed through our own webhook, so escalation is a real telephony handoff
 * rather than the AI relaying a message. Without a phone number on file it
 * falls back to the ordinary function tool (graceful degradation). */
function toVapiTools(salon: SalonContext): VapiTool[] {
  return RECEPTIONIST_TOOLS.map((t): VapiTool => {
    if (t.name === "escalate_to_staff" && salon.phone) {
      return {
        type: "transferCall",
        destinations: [
          {
            type: "number",
            number: salon.phone,
            message: TRANSFER_ANNOUNCEMENT,
          },
        ],
      };
    }
    return {
      type: "function",
      function: {
        name: t.name,
        description: t.description ?? "",
        parameters: t.input_schema,
      },
    };
  });
}

interface VapiTranscriberConfig {
  provider: "deepgram";
  model: string;
  language: string;
  /** ms of trailing silence before end-of-turn — Deepgram Flux handles
   * acoustic end-of-turn detection natively, so this is just an optional
   * upper bound, ~3x shorter than a fixed-timer default (~300ms). No
   * software smartEndpointing layer belongs in startSpeakingPlan alongside
   * it — Vapi docs call out that the two must not run at the same time. */
  endpointing?: number;
}

interface VapiVoiceConfig {
  provider: "cartesia";
  /** Vapi validates this against a strict enum: 'sonic-3.5' | 'sonic-3' | 'sonic-2'. */
  model: "sonic-3.5" | "sonic-3" | "sonic-2";
  voiceId: string;
  language: string;
}

export interface VapiAssistantPayload {
  name: string;
  firstMessage: string;
  transcriber: VapiTranscriberConfig;
  voice: VapiVoiceConfig;
  /** How long the assistant waits after the caller stops talking before
   * responding. No smartEndpointingEnabled/smartEndpointingPlan here —
   * Deepgram Flux's native acoustic end-of-turn detection on the
   * transcriber already handles that; layering a second one on top is
   * exactly what Vapi's docs warn against. */
  startSpeakingPlan: {
    waitSeconds: number;
  };
  /** Full-duplex barge-in: numWords 0 means the assistant's audio output
   * stops the instant the caller starts speaking, no minimum word count. */
  stopSpeakingPlan: {
    numWords: number;
    voiceSeconds: number;
    backoffSeconds: number;
  };
  /** Hangs up after this much total silence. Vapi enforces a minimum of 5
   * seconds — kept at that floor so a dead-air call doesn't linger longer
   * than necessary. */
  silenceTimeoutSeconds: number;
  model: {
    provider: "anthropic";
    model: string;
    messages: { role: "system"; content: string }[];
    tools: VapiTool[];
    /** Capped well below Vapi's default so generation finishes faster —
     * spoken replies stay short anyway (system prompt rule 1), and this
     * is still well above what a few-sentence Dutch reply needs. */
    maxTokens: number;
  };
  server?: {
    url: string;
    headers?: Record<string, string>;
  };
}

/**
 * Builds the assistant config Vapi needs to run the SAME receptionist
 * (tools, practice knowledge, behavior rules) live over the phone that
 * WhatsApp already gets via getReceptionistReply — Vapi's own Claude model
 * drives the call for latency, but reads our system prompt and calls our
 * tools, so the two channels stay behaviorally in sync.
 *
 * Voice-pipeline choices here target sub-300ms perceived latency and 2026
 * telephony/compliance norms: Deepgram Flux (acoustic end-of-turn
 * detection, ~3x shorter pauses than a fixed timer) for STT, Cartesia
 * Sonic 3.5 (SSM architecture, <40ms time-to-first-audio) for TTS, and
 * full-duplex barge-in so the caller can interrupt at any time.
 */
export function buildVapiAssistantPayload(salon: SalonContext, toolsWebhookUrl: string): VapiAssistantPayload {
  return {
    name: `${salon.name} — AI-receptioniste`,
    // Artikel 50 EU AI Act: onmiskenbare AI-identificatie, hardcoded — dit
    // mag nooit afhangen van of het model dit zelf besluit te zeggen.
    firstMessage: `Goedendag, u spreekt met de digitale AI-assistent van ${salon.name}. Waarmee kan ik u helpen?`,
    transcriber: {
      provider: "deepgram",
      // "flux-general-multi": Deepgram Flux, multilingual, with built-in
      // acoustic end-of-turn detection. Falls back to nova-2 wherever the
      // Vapi/Deepgram account isn't provisioned for Flux yet.
      model: "flux-general-multi",
      language: "nl",
      endpointing: 100,
    },
    voice: {
      provider: "cartesia",
      model: "sonic-3.5",
      voiceId: env.CARTESIA_VOICE_ID_NL,
      language: "nl",
    },
    startSpeakingPlan: {
      waitSeconds: 0.1,
    },
    stopSpeakingPlan: {
      numWords: 0,
      voiceSeconds: 0.1,
      backoffSeconds: 0,
    },
    silenceTimeoutSeconds: 5,
    model: {
      provider: "anthropic",
      model: VAPI_ANTHROPIC_MODEL,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(salon) + VOICE_AI_TRANSPARENCY_NOTE + VOICE_SPEECH_FORMATTING_NOTE,
        },
      ],
      tools: toVapiTools(salon),
      maxTokens: 200,
    },
    server: {
      url: toolsWebhookUrl,
      ...(env.VAPI_API_KEY ? { headers: { Authorization: `Bearer ${env.VAPI_API_KEY}` } } : {}),
    },
  };
}

export interface VapiSyncResult {
  ok: boolean;
  assistantId?: string;
  error?: string;
}

/** Strips everything but digits and a leading "+" so phone numbers entered
 * with spaces/parens/dashes still match Vapi's stored E.164 format. */
function normalizePhone(s: string): string {
  return s.replace(/[^\d+]/g, "");
}

/**
 * Assigns the assistant to the salon's phone number in Vapi so incoming
 * calls actually reach it — creating/updating the assistant alone does NOT
 * attach it to any number. Looks the number up by matching salon.phone
 * against Vapi's phone-number list (only the number is stored locally, not
 * Vapi's internal phone-number id).
 */
async function linkPhoneNumberToAssistant(
  vapiApiKey: string,
  phoneNumber: string,
  assistantId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const listRes = await fetch(`${VAPI_BASE}/phone-number`, {
      headers: { Authorization: `Bearer ${vapiApiKey}` },
    });
    if (!listRes.ok) {
      const text = await listRes.text();
      return { ok: false, error: `Vapi phone-number opzoeken ${listRes.status}: ${text.slice(0, 300)}` };
    }
    const numbers = (await listRes.json()) as { id: string; number?: string }[];
    const target = normalizePhone(phoneNumber);
    const match = numbers.find((n) => n.number && normalizePhone(n.number) === target);
    if (!match) {
      return {
        ok: false,
        error: `Geen Vapi-telefoonnummer gevonden dat overeenkomt met ${phoneNumber} — controleer dat het nummer bij Integraties exact overeenkomt met het nummer in je Vapi-dashboard.`,
      };
    }

    const patchRes = await fetch(`${VAPI_BASE}/phone-number/${match.id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${vapiApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ assistantId }),
    });
    if (!patchRes.ok) {
      const text = await patchRes.text();
      return { ok: false, error: `Vapi telefoonnummer koppelen ${patchRes.status}: ${text.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * Creates the assistant on first sync, updates it in place afterwards (the
 * assistant id is stored in salons.settings.ai.vapiAssistantId so repeated
 * syncs don't pile up duplicate assistants in the salon's Vapi account),
 * then assigns it to the salon's phone number so calls actually reach it.
 * Uses the salon's OWN Vapi API key — this calls out to their account, so
 * only ever run it from an explicit "Synchroniseren" action, never silently.
 */
export async function syncVapiAssistant(
  salon: SalonContext,
  vapiApiKey: string,
  toolsWebhookUrl: string,
  existingAssistantId?: string | null,
): Promise<VapiSyncResult> {
  const payload = buildVapiAssistantPayload(salon, toolsWebhookUrl);
  const url = existingAssistantId ? `${VAPI_BASE}/assistant/${existingAssistantId}` : `${VAPI_BASE}/assistant`;
  const method = existingAssistantId ? "PATCH" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${vapiApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Vapi API ${res.status}: ${text.slice(0, 300)}` };
    }
    const data = (await res.json()) as { id?: string };
    if (!data.id) return { ok: false, error: "Vapi gaf geen assistant-id terug." };

    // salon.phone is the salon's general contact number (transferCall
    // destination for escalations) — the Vapi-purchased number that
    // actually receives calls is aiSettings.phoneNumber, set on the
    // Integraties page.
    if (salon.aiSettings.phoneNumber) {
      const linkResult = await linkPhoneNumberToAssistant(vapiApiKey, salon.aiSettings.phoneNumber, data.id);
      if (!linkResult.ok) return { ok: false, assistantId: data.id, error: linkResult.error };
    }

    return { ok: true, assistantId: data.id };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
