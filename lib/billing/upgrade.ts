"use server";

import { requireSalonOwner } from "@/lib/auth/dal";
import { getSalonWithSubscription } from "@/lib/salon/queries";
import { createCheckout, type CheckoutState } from "./checkout";

/** Upgrade action for logged-in salon owners — pre-fills name & email from session. */
export async function createUpgrade(
  prevState: CheckoutState | undefined,
  formData: FormData,
): Promise<CheckoutState> {
  const user = await requireSalonOwner();
  const salon = await getSalonWithSubscription(user.salonId);

  const enriched = new FormData();
  enriched.set("plan", formData.get("plan") as string);
  enriched.set("salonName", salon?.name ?? "");
  enriched.set("email", user.email);
  const coupon = formData.get("coupon");
  if (coupon) enriched.set("coupon", coupon as string);

  return createCheckout(prevState, enriched);
}
