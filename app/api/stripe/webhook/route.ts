import { NextResponse } from "next/server";
import { getStripe } from "@/lib/billing/stripe";
import { handleStripeEvent } from "@/lib/billing/provision";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe niet geconfigureerd" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Ontbrekende handtekening" }, { status: 400 });
  }

  const body = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe] signature verification failed:", err);
    return NextResponse.json({ error: "Ongeldige handtekening" }, { status: 400 });
  }

  try {
    await handleStripeEvent(event);
  } catch (err) {
    console.error("[stripe] handler error:", err);
    // Return 500 so Stripe retries.
    return NextResponse.json({ error: "Verwerkingsfout" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
