"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { salons } from "@/lib/db/schema";
import { requireSalonOwner } from "@/lib/auth/dal";
import { loadSalonContext } from "@/lib/salon/receptionist-context";
import { syncVapiAssistant } from "@/lib/ai/vapi-assistant";
import { decrypt } from "@/lib/crypto";
import { publicEnv } from "@/lib/env";
import type { ActionState } from "@/lib/salon/actions";

/**
 * Pushes this salon's locations/treatments/team/kennisbank and tool set to
 * Vapi as an assistant, so phone calls get the same live availability/
 * booking/lookup/escalate behavior WhatsApp already has, driven by Vapi's
 * own low-latency Claude-backed voice model. Calls out to the salon's own
 * Vapi account — only ever runs from this explicit action, never silently
 * on every settings save.
 */
export async function syncVapiAssistantAction(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prev: ActionState | undefined,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<ActionState> {
  const user = await requireSalonOwner();

  const [row] = await db.select().from(salons).where(eq(salons.id, user.salonId)).limit(1);
  if (!row) return { error: "Salon niet gevonden." };

  const ai = (row.settings as Record<string, unknown>).ai as Record<string, unknown> | undefined;
  const rawKey = ai?.vapiApiKey as string | null | undefined;
  if (!rawKey) return { error: "Vul eerst je Vapi API-sleutel in bij Integraties." };
  const vapiApiKey = decrypt(rawKey) ?? rawKey;

  const salonContext = await loadSalonContext(row);
  const toolsWebhookUrl = `${publicEnv.NEXT_PUBLIC_SITE_URL}/api/webhooks/vapi`;
  const existingAssistantId = (ai?.vapiAssistantId as string | undefined) || null;

  const result = await syncVapiAssistant(salonContext, vapiApiKey, toolsWebhookUrl, existingAssistantId);
  if (!result.ok) {
    return { error: `Synchroniseren met Vapi mislukt: ${result.error}` };
  }

  await db
    .update(salons)
    .set({
      settings: sql`${salons.settings} || jsonb_build_object('ai', ${salons.settings}->'ai' || jsonb_build_object('vapiAssistantId', ${result.assistantId}::text))`,
    })
    .where(eq(salons.id, user.salonId));

  revalidatePath("/dashboard/integraties");
  return { success: true };
}
