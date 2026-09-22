"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSalonOwner } from "@/lib/auth/dal";
import { recordNoShow } from "@/lib/payments-policy/queries";
import { getSalonWithSubscription } from "@/lib/salon/queries";
import type { ActionState } from "@/lib/salon/actions";

const schema = z.object({ appointmentId: z.string().uuid() });

export async function markNoShowAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await requireSalonOwner();
  const parsed = schema.safeParse({ appointmentId: formData.get("appointmentId") ?? "" });
  if (!parsed.success) return { error: "Ongeldige afspraak." };

  const salonRow = await getSalonWithSubscription(user.salonId);
  const result = await recordNoShow(user.salonId, parsed.data.appointmentId, salonRow?.name ?? "de salon");
  if ("error" in result) return { error: result.error };

  revalidatePath("/dashboard/afspraken");
  return { success: true };
}
