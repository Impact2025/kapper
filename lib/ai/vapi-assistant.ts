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

interface VapiFunctionTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: unknown;
  };
}

/** Anthropic's `Tool` shape (name/description/input_schema) maps 1:1 onto
 * Vapi's OpenAI-style function-tool shape — both are JSON Schema underneath. */
function toVapiTools(): VapiFunctionTool[] {
  return RECEPTIONIST_TOOLS.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description ?? "",
      parameters: t.input_schema,
    },
  }));
}

export interface VapiAssistantPayload {
  name: string;
  firstMessage: string;
  model: {
    provider: "anthropic";
    model: string;
    messages: { role: "system"; content: string }[];
    tools: VapiFunctionTool[];
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
 */
export function buildVapiAssistantPayload(salon: SalonContext, toolsWebhookUrl: string): VapiAssistantPayload {
  return {
    name: `${salon.name} — AI-receptioniste`,
    firstMessage: `Hoi, u spreekt met de AI-receptioniste van ${salon.name}. Waarmee kan ik u helpen?`,
    model: {
      provider: "anthropic",
      model: VAPI_ANTHROPIC_MODEL,
      messages: [{ role: "system", content: buildSystemPrompt(salon) }],
      tools: toVapiTools(),
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

/**
 * Creates the assistant on first sync, updates it in place afterwards (the
 * assistant id is stored in salons.settings.ai.vapiAssistantId so repeated
 * syncs don't pile up duplicate assistants in the salon's Vapi account).
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
    return { ok: true, assistantId: data.id };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
