import "server-only";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { inventoryMovements, orderItems, orders, products, treatments } from "@/lib/db/schema";
import { upsertCustomerByPhone } from "@/lib/customers/queries";
import { amsterdamDateKey } from "@/lib/salon/timezone";
import { awardLoyaltyPoints } from "@/lib/loyalty/queries";

export interface SellableTreatment {
  id: string;
  name: string;
  priceCents: number;
  vatRatePercent: number;
}

export interface SellableProduct {
  id: string;
  name: string;
  priceCents: number;
  vatRatePercent: number;
  stockQuantity: number;
}

/** What the kassa screen offers to ring up — active treatments/products only. */
export async function listSellableItems(
  salonId: string,
): Promise<{ treatments: SellableTreatment[]; products: SellableProduct[] }> {
  const [treatmentRows, productRows] = await Promise.all([
    db
      .select({ id: treatments.id, name: treatments.name, priceCents: treatments.priceCents, vatRatePercent: treatments.vatRatePercent })
      .from(treatments)
      .where(and(eq(treatments.salonId, salonId), eq(treatments.active, true))),
    db
      .select({
        id: products.id,
        name: products.name,
        priceCents: products.priceCents,
        vatRatePercent: products.vatRatePercent,
        stockQuantity: products.stockQuantity,
      })
      .from(products)
      .where(and(eq(products.salonId, salonId), eq(products.active, true))),
  ]);
  return { treatments: treatmentRows, products: productRows };
}

export interface PosSaleItemInput {
  kind: "treatment" | "product";
  id: string;
  quantity: number;
}

export interface PosSaleInput {
  salonId: string;
  customerName: string;
  customerPhone?: string;
  items: PosSaleItemInput[];
  paymentMethod: "cash" | "pin" | "card";
  tipCents?: number;
  /** Fase 5: loyaliteitspunten zijn een Elite-only feature — the caller
   * (which already resolved the salon's plan for the Pro-gate) passes this
   * through rather than createPosSale fetching the plan itself again. */
  elitePlan?: boolean;
}

/**
 * A kassaverkoop is an `orders` row with channel: "pos" — reuses the same
 * orders/orderItems tables as the webshop rather than a parallel POS-only
 * schema, since it's the same "what did this salon sell, for how much, at
 * what btw-tarief" shape either way.
 */
export async function createPosSale(
  input: PosSaleInput,
): Promise<{ ok: true; orderId: string; totalCents: number } | { error: string }> {
  if (!input.items.length) return { error: "Geen artikelen geselecteerd." };

  const treatmentIds = input.items.filter((i) => i.kind === "treatment").map((i) => i.id);
  const productIds = input.items.filter((i) => i.kind === "product").map((i) => i.id);

  const [treatmentRows, productRows] = await Promise.all([
    treatmentIds.length
      ? db.select().from(treatments).where(and(eq(treatments.salonId, input.salonId), inArray(treatments.id, treatmentIds)))
      : Promise.resolve([]),
    productIds.length
      ? db.select().from(products).where(and(eq(products.salonId, input.salonId), inArray(products.id, productIds)))
      : Promise.resolve([]),
  ]);
  const treatmentById = new Map(treatmentRows.map((t) => [t.id, t]));
  const productById = new Map(productRows.map((p) => [p.id, p]));

  for (const item of input.items) {
    if (item.kind === "product") {
      const product = productById.get(item.id);
      if (!product) return { error: "Onbekend product." };
      if (product.stockQuantity < item.quantity) return { error: `Niet genoeg voorraad voor ${product.name}.` };
    } else if (!treatmentById.get(item.id)) {
      return { error: "Onbekende behandeling." };
    }
  }

  const tipCents = input.tipCents ?? 0;
  const lineTotal = input.items.reduce((sum, item) => {
    const priceCents =
      item.kind === "treatment" ? treatmentById.get(item.id)!.priceCents : productById.get(item.id)!.priceCents;
    return sum + priceCents * item.quantity;
  }, 0);

  const customer = input.customerPhone
    ? await upsertCustomerByPhone({
        salonId: input.salonId,
        phone: input.customerPhone,
        name: input.customerName,
        source: "manual",
      })
    : null;

  const [order] = await db
    .insert(orders)
    .values({
      salonId: input.salonId,
      customerId: customer?.id ?? null,
      customerName: input.customerName || "Klant aan de balie",
      customerPhone: input.customerPhone || null,
      status: "paid",
      channel: "pos",
      paymentMethod: input.paymentMethod,
      tipCents,
      totalCents: lineTotal + tipCents,
    })
    .returning({ id: orders.id });

  for (const item of input.items) {
    if (item.kind === "treatment") {
      const treatment = treatmentById.get(item.id)!;
      await db.insert(orderItems).values({
        orderId: order!.id,
        treatmentId: treatment.id,
        productName: treatment.name,
        unitPriceCents: treatment.priceCents,
        quantity: item.quantity,
        vatRatePercent: treatment.vatRatePercent,
      });
    } else {
      const product = productById.get(item.id)!;
      await db.insert(orderItems).values({
        orderId: order!.id,
        productId: product.id,
        productName: product.name,
        unitPriceCents: product.priceCents,
        quantity: item.quantity,
        vatRatePercent: product.vatRatePercent,
      });
      await db
        .update(products)
        .set({ stockQuantity: sql`greatest(0, ${products.stockQuantity} - ${item.quantity})` })
        .where(eq(products.id, product.id));
      await db.insert(inventoryMovements).values({
        salonId: input.salonId,
        productId: product.id,
        type: "sale",
        quantityDelta: -item.quantity,
        reason: `Kassaverkoop ${order!.id}`,
      });
    }
  }

  if (input.elitePlan && customer) {
    await awardLoyaltyPoints({
      salonId: input.salonId,
      customerId: customer.id,
      amountCents: lineTotal + tipCents,
      reason: "Kassaverkoop",
      orderId: order!.id,
    });
  }

  return { ok: true, orderId: order!.id, totalCents: lineTotal + tipCents };
}

export interface KasopmaakSummary {
  orderCount: number;
  byPaymentMethod: Record<string, number>;
  vatBreakdown: Record<number, { subtotalCents: number; vatCents: number }>;
  tipTotalCents: number;
  totalCents: number;
}

/** Dagafsluiting — today's POS sales only (channel: "pos"), grouped by
 * payment method and by btw-tarief for the bookkeeping export. */
export async function getKasopmaak(salonId: string, dateKey: string): Promise<KasopmaakSummary> {
  const rows = await db
    .select({
      orderId: orders.id,
      paymentMethod: orders.paymentMethod,
      tipCents: orders.tipCents,
      createdAt: orders.createdAt,
      unitPriceCents: orderItems.unitPriceCents,
      quantity: orderItems.quantity,
      vatRatePercent: orderItems.vatRatePercent,
    })
    .from(orders)
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(and(eq(orders.salonId, salonId), eq(orders.channel, "pos"), gte(orders.createdAt, new Date(`${dateKey}T00:00:00Z`))));

  const summary: KasopmaakSummary = {
    orderCount: 0,
    byPaymentMethod: {},
    vatBreakdown: {},
    tipTotalCents: 0,
    totalCents: 0,
  };
  const seenOrders = new Set<string>();

  for (const row of rows) {
    if (amsterdamDateKey(row.createdAt) !== dateKey) continue;

    if (!seenOrders.has(row.orderId)) {
      seenOrders.add(row.orderId);
      summary.orderCount += 1;
      summary.tipTotalCents += row.tipCents;
      const method = row.paymentMethod ?? "onbekend";
      summary.byPaymentMethod[method] = (summary.byPaymentMethod[method] ?? 0) + row.tipCents;
    }

    const lineTotal = row.unitPriceCents * row.quantity;
    const method = row.paymentMethod ?? "onbekend";
    summary.byPaymentMethod[method] = (summary.byPaymentMethod[method] ?? 0) + lineTotal;
    summary.totalCents += lineTotal;

    const bucket = summary.vatBreakdown[row.vatRatePercent] ?? { subtotalCents: 0, vatCents: 0 };
    const exclVat = Math.round(lineTotal / (1 + row.vatRatePercent / 100));
    bucket.subtotalCents += exclVat;
    bucket.vatCents += lineTotal - exclVat;
    summary.vatBreakdown[row.vatRatePercent] = bucket;
  }
  summary.totalCents += summary.tipTotalCents;

  return summary;
}
