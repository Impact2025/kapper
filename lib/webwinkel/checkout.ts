"use server";

import { redirect } from "next/navigation";
import { eq, and, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { salons, products } from "@/lib/db/schema";
import { getStripe } from "@/lib/billing/stripe";
import { publicEnv } from "@/lib/env";

export interface WebwinkelCheckoutState {
  error?: string;
}

const cartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

const schema = z.object({
  slug: z.string().min(1),
  customerName: z.string().min(1, "Vul je naam in.").max(200),
  customerEmail: z.string().email("Vul een geldig e-mailadres in."),
  customerPhone: z.string().max(30).optional().or(z.literal("")),
  cart: z.array(cartItemSchema).min(1, "Je winkelmandje is leeg."),
});

export async function createProductCheckout(
  input: z.infer<typeof schema>,
): Promise<WebwinkelCheckoutState | never> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Controleer de velden." };
  }
  const { slug, customerName, customerEmail, customerPhone, cart } = parsed.data;

  const [salon] = await db.select({ id: salons.id, name: salons.name }).from(salons).where(eq(salons.slug, slug)).limit(1);
  if (!salon) return { error: "Onbekende salon." };

  const productIds = cart.map((c) => c.productId);
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      priceCents: products.priceCents,
      stockQuantity: products.stockQuantity,
      active: products.active,
    })
    .from(products)
    .where(and(eq(products.salonId, salon.id), inArray(products.id, productIds)));

  const byId = new Map(rows.map((r) => [r.id, r]));
  for (const item of cart) {
    const product = byId.get(item.productId);
    if (!product || !product.active) return { error: "Een product in je mandje is niet meer beschikbaar." };
    if (product.stockQuantity < item.quantity) {
      return { error: `Niet genoeg voorraad voor ${product.name}.` };
    }
  }

  const stripe = getStripe();
  if (!stripe) {
    return { error: "Online betalen is nog niet geactiveerd voor deze salon." };
  }

  const lineItems = cart.map((item) => {
    const product = byId.get(item.productId)!;
    return {
      price_data: {
        currency: "eur",
        unit_amount: product.priceCents,
        product_data: { name: product.name },
      },
      quantity: item.quantity,
    };
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    customer_email: customerEmail,
    success_url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/${slug}/winkel/bedankt?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/${slug}/winkel`,
    metadata: {
      kind: "webshop_order",
      salonId: salon.id,
      customerName,
      customerEmail,
      customerPhone: customerPhone || "",
      cart: JSON.stringify(cart),
    },
  });

  if (!session.url) return { error: "Kon geen betaalsessie starten. Probeer opnieuw." };
  redirect(session.url);
}
