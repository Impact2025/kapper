"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSalonOwner } from "@/lib/auth/dal";
import { purgeCustomerData } from "@/lib/compliance/purge";
import type { ActionState } from "@/lib/salon/actions";

const purgeSchema = z.object({
  customerId: z.string().uuid(),
  confirmed: z.literal("true"),
});

export async function purgeCustomerAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireSalonOwner();

  const parsed = purgeSchema.safeParse({
    customerId: formData.get("customerId") ?? "",
    confirmed: formData.get("confirmed") ?? "",
  });
  if (!parsed.success) return { error: "Bevestig expliciet dat je alle gegevens van deze klant wilt verwijderen." };

  const result = await purgeCustomerData(user.salonId, parsed.data.customerId);
  if ("error" in result) return { error: result.error };

  redirect("/dashboard/klanten");
}
