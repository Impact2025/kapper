import "server-only";
import { db } from "@/lib/db";
import { agentRuns } from "@/lib/db/schema";
import {
  getReceptionistReply,
  type SalonContext,
  type ConversationMessage,
  type ReceptionistResponse,
} from "@/lib/ai/receptionist";
import { captureError } from "@/lib/observability";

/**
 * Artikel 9 AVG signal words — a WhatsApp message mentioning these must not
 * get a medical assessment from the AI (kapperassistent-totaaloplossing
 * Fase 1 builds the full dossier this backs). Reuses the same health-term
 * stems the PII-masking gateway already tokenizes (lib/ai/masking.ts), plus
 * a few dossier-specific additions.
 */
const ARTICLE9_SIGNAL_STEMS = [
  "allergie",
  "allergisch",
  "ammoniak",
  "psoriasis",
  "eczeem",
  "alopecia",
  "zwanger",
  "hoofdhuidaandoening",
  "huidaandoening",
  "chemotherapie",
  "diagnose",
];
// "patch test"/"patch-test" as two tokens needs its own alternative — the
// \p{L}* stem-wrapping trick above only works for single words.
export const ARTICLE9_RE = new RegExp(
  `\\p{L}*(?:${ARTICLE9_SIGNAL_STEMS.join("|")})\\p{L}*|patch[\\s-]?test`,
  "iu",
);

export const ARTICLE9_GUARD_REPLY =
  "Dit gaat over gezondheids- of huidinformatie — dat beoordeel ik als AI-assistent niet via WhatsApp. Een medewerker neemt dit persoonlijk met je door, telefonisch of bij een intake in de salon.";

function lastUserMessage(history: ConversationMessage[]): string {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i]!.role === "user") return history[i]!.content;
  }
  return "";
}

export type ManagerChannel = "whatsapp" | "phone";

export interface ManagerRunInput {
  salonId: string;
  salon: SalonContext;
  history: ConversationMessage[];
  customerPhone: string;
  conversationId?: string | null;
  isNewConversation?: boolean;
  channel: ManagerChannel;
}

async function logAgentRun(input: {
  salonId: string;
  conversationId?: string | null;
  channel: ManagerChannel;
  agent: string;
  guardTriggered: boolean;
  escalated: boolean;
}): Promise<void> {
  try {
    await db.insert(agentRuns).values({
      salonId: input.salonId,
      conversationId: input.conversationId ?? null,
      channel: input.channel,
      agent: input.agent,
      guardTriggered: input.guardTriggered,
      escalated: input.escalated,
    });
  } catch (err) {
    // Observability/audit-trail only — never block a reply on a logging failure.
    captureError("ai-manager/log-run", err);
  }
}

/**
 * Single entrypoint for every AI channel that runs our own tool loop
 * (WhatsApp via WATI, the public demo chat). Voice goes through Vapi's own
 * hosted model and calls executeReceptionistTool directly per tool-call
 * event (lib/ai/vapi-assistant.ts) — there is no per-turn dispatch decision
 * to make there yet, so it isn't routed through here.
 *
 * Applies the Artikel 9 compliance guard before dispatching to an agent, and
 * logs every turn to agent_runs (doubles as the Artikel 50 audit trail and
 * the Fase 6 right-to-erasure basis). Today the only conversational agent is
 * the receptionist — this function is the seam a second agent (pos,
 * retention, ...) plugs into later without the webhooks changing.
 */
export async function runAiManager(input: ManagerRunInput): Promise<ReceptionistResponse> {
  if (input.channel === "whatsapp") {
    const latest = lastUserMessage(input.history);
    if (ARTICLE9_RE.test(latest)) {
      await logAgentRun({
        salonId: input.salonId,
        conversationId: input.conversationId,
        channel: input.channel,
        agent: "compliance_guard",
        guardTriggered: true,
        escalated: true,
      });
      return {
        reply: ARTICLE9_GUARD_REPLY,
        escalated: { reason: "Artikel 9 AVG: gezondheids-/huidinformatie via WhatsApp" },
      };
    }
  }

  const response = await getReceptionistReply(
    input.salon,
    input.history,
    input.customerPhone,
    input.conversationId,
    input.isNewConversation,
  );

  await logAgentRun({
    salonId: input.salonId,
    conversationId: input.conversationId,
    channel: input.channel,
    agent: "receptionist",
    guardTriggered: false,
    escalated: Boolean(response.escalated),
  });

  return response;
}
