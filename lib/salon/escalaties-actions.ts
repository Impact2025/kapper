"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSalonOwner } from "@/lib/auth/dal";
import { markConversationHandled } from "@/lib/salon/gesprekken";
import type { ActionState } from "@/lib/salon/actions";

const schema = z.object({ conversationId: z.string().uuid() });

export async function markConversationHandledAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireSalonOwner();
  const parsed = schema.safeParse({ conversationId: formData.get("conversationId") ?? "" });
  if (!parsed.success) return { error: "Ongeldig gesprek." };

  const ok = await markConversationHandled(user.salonId, parsed.data.conversationId);
  if (!ok) return { error: "Gesprek was al opgepakt of niet gevonden." };

  revalidatePath("/dashboard/escalaties");
  revalidatePath("/dashboard/gesprekken");
  return { success: true };
}
