import "server-only";
import { getStripe } from "@/lib/billing/stripe";

/**
 * Server-side half of a Stripe Terminal in-person payment: creates the
 * PaymentIntent a connected card reader then collects and confirms. Pairing
 * a physical reader and driving the collect/confirm flow needs the
 * Stripe Terminal client SDK running against a specific reader — that's a
 * follow-up once a salon actually orders a reader; this function is what
 * that flow calls into, so the kassa screen can fall back to "cash"/"pin
 * (handled on the salon's own separate pinapparaat)" today without it.
 */
export async function createTerminalPaymentIntent(input: {
  amountCents: number;
  orderId: string;
  salonId: string;
}): Promise<{ clientSecret: string; paymentIntentId: string } | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const intent = await stripe.paymentIntents.create({
    amount: input.amountCents,
    currency: "eur",
    payment_method_types: ["card_present"],
    capture_method: "automatic",
    metadata: { kind: "pos_terminal_sale", orderId: input.orderId, salonId: input.salonId },
  });
  if (!intent.client_secret) return null;

  return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
}
