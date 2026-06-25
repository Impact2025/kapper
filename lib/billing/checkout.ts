"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type Stripe from "stripe";
import { PLANS, type PlanId } from "@/lib/plans";
import { getStripe, planPriceData } from "@/lib/billing/stripe";
import { previewCoupon } from "@/lib/coupons/service";
import { publicEnv } from "@/lib/env";

export interface CheckoutState {
  error?: string;
}

const schema = z.object({
  plan: z.enum(["essential", "pro", "elite"]),
  salonName: z.string().min(2, "Vul je salonnaam in.").max(120),
  email: z.string().email("Vul een geldig e-mailadres in."),
  coupon: z.string().max(40).optional().or(z.literal("")),
});

export async function createCheckout(
  _prev: CheckoutState | undefined,
  formData: FormData,
): Promise<CheckoutState> {
  const parsed = schema.safeParse({
    plan: formData.get("plan"),
    salonName: formData.get("salonName"),
    email: formData.get("email"),
    coupon: formData.get("coupon"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Controleer de velden." };
  }
  const { plan: planId, salonName, email, coupon } = parsed.data;
  const plan = PLANS.find((p) => p.id === (planId as PlanId));
  if (!plan) return { error: "Onbekend abonnement." };

  const stripe = getStripe();
  if (!stripe) {
    return {
      error:
        "Online betalen is nog niet geactiveerd. Neem contact op of plan een pilot via de gratis scan.",
    };
  }

  const priceCents = plan.price * 100;
  const subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData = {
    metadata: { plan: plan.id, salonName },
  };
  const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];
  let couponId: string | undefined;

  if (coupon && coupon.trim()) {
    const preview = await previewCoupon(coupon, priceCents);
    if (!preview.ok) return { error: preview.error };
    couponId = preview.couponId;

    if (preview.discount!.trialDays > 0) {
      subscriptionData.trial_period_days = preview.discount!.trialDays;
    } else if (preview.discount!.discountCents > 0) {
      // Create an ad-hoc Stripe coupon mirroring our computed discount. A
      // discount that covers the full price applies once; otherwise recurring.
      const coversFullPrice = preview.discount!.discountCents >= priceCents;
      const stripeCoupon = await stripe.coupons.create({
        amount_off: Math.min(preview.discount!.discountCents, priceCents),
        currency: "eur",
        duration: coversFullPrice ? "once" : "forever",
        name: preview.code,
      });
      discounts.push({ coupon: stripeCoupon.id });
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price_data: planPriceData(plan), quantity: 1 }],
    customer_email: email,
    subscription_data: subscriptionData,
    ...(discounts.length ? { discounts } : {}),
    success_url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/prijzen`,
    metadata: { plan: plan.id, salonName, email, couponId: couponId ?? "" },
  });

  if (!session.url) return { error: "Kon geen betaalsessie starten. Probeer opnieuw." };
  redirect(session.url);
}
