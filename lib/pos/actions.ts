"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSalonOwner } from "@/lib/auth/dal";
import { getSalonPlan, salonHasPlan } from "@/lib/salon/plan";
import { createPosSale } from "@/lib/pos/queries";
import type { ActionState } from "@/lib/salon/actions";

const PATH = "/dashboard/kassa";
const PRO_REQUIRED = "De kassa is onderdeel van het Pro-abonnement. Upgrade via Abonnement.";

const itemSchema = z.object({
  kind: z.enum(["treatment", "product"]),
  id: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

const saleSchema = z.object({
  customerName: z.string().max(200),
  customerPhone: z.string().max(30).optional().or(z.literal("")),
  items: z.array(itemSchema).min(1),
  paymentMethod: z.enum(["cash", "pin", "card"]),
  tipEuros: z.number().min(0).max(1000).optional(),
});

export async function createPosSaleAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireSalonOwner();
  const plan = await getSalonPlan(user.salonId);
  if (!salonHasPlan(plan, "pro")) return { error: PRO_REQUIRED };

  let items: unknown;
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Ongeldige kassaregel." };
  }

  const parsed = saleSchema.safeParse({
    customerName: formData.get("customerName") ?? "",
    customerPhone: formData.get("customerPhone") ?? "",
    items,
    paymentMethod: formData.get("paymentMethod") ?? "",
    tipEuros: formData.get("tipEuros") ? Number(formData.get("tipEuros")) : undefined,
  });
  if (!parsed.success) return { error: "Controleer de kassaregels en betaalmethode." };

  const result = await createPosSale({
    salonId: user.salonId,
    customerName: parsed.data.customerName,
    customerPhone: parsed.data.customerPhone || undefined,
    items: parsed.data.items,
    paymentMethod: parsed.data.paymentMethod,
    tipCents: Math.round((parsed.data.tipEuros ?? 0) * 100),
  });
  if ("error" in result) return { error: result.error };

  revalidatePath(PATH);
  return { success: true };
}
