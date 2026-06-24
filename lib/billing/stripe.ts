import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";
import type { PlanId } from "@/lib/plans";

let client: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!env.STRIPE_SECRET_KEY) return null;
  if (!client) client = new Stripe(env.STRIPE_SECRET_KEY);
  return client;
}

/**
 * Build inline recurring price data for a plan so we don't depend on
 * pre-created Stripe Price IDs. Amount in euro cents.
 */
export function planPriceData(
  plan: { id: PlanId; name: string; price: number },
): Stripe.Checkout.SessionCreateParams.LineItem.PriceData {
  return {
    currency: "eur",
    unit_amount: plan.price * 100,
    recurring: { interval: "month" },
    product_data: {
      name: `KapperAssistent — ${plan.name}`,
    },
  };
}
