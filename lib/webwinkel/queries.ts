import "server-only";
import { eq, and, sql, gte, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, orders, orderItems, inventoryMovements, salons } from "@/lib/db/schema";
import { salonHasPlan } from "@/lib/salon/plan";

export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  category: string | null;
  priceCents: number;
  imageUrl: string | null;
  stockQuantity: number;
  lowStockThreshold: number;
  active: boolean;
}

export async function listProducts(salonId: string): Promise<Product[]> {
  return db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      sku: products.sku,
      category: products.category,
      priceCents: products.priceCents,
      imageUrl: products.imageUrl,
      stockQuantity: products.stockQuantity,
      lowStockThreshold: products.lowStockThreshold,
      active: products.active,
    })
    .from(products)
    .where(eq(products.salonId, salonId))
    .orderBy(products.name);
}

/** Only active products with stock left — what the public storefront shows. */
export async function listAvailableProducts(salonId: string): Promise<Product[]> {
  const rows = await listProducts(salonId);
  return rows.filter((p) => p.active && p.stockQuantity > 0);
}

export interface PublicSalon {
  id: string;
  slug: string;
  name: string;
  city: string | null;
}

/** Salon for the public storefront — null if unknown or not on the Pro plan
 * (the webwinkel is Pro-gated, so a non-Pro slug should 404, not show an
 * empty shop). */
export async function getPublicSalonForWinkel(slug: string): Promise<PublicSalon | null> {
  const [salon] = await db
    .select({ id: salons.id, slug: salons.slug, name: salons.name, city: salons.city, plan: salons.plan })
    .from(salons)
    .where(eq(salons.slug, slug))
    .limit(1);
  if (!salon || !salonHasPlan(salon.plan, "pro")) return null;
  return { id: salon.id, slug: salon.slug, name: salon.name, city: salon.city };
}

export async function getLowStockProducts(salonId: string): Promise<Product[]> {
  const rows = await listProducts(salonId);
  return rows.filter((p) => p.active && p.stockQuantity <= p.lowStockThreshold);
}

export interface OrderWithItems {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  status: "pending" | "paid" | "fulfilled" | "canceled";
  totalCents: number;
  createdAt: Date;
  items: { productName: string; unitPriceCents: number; quantity: number }[];
}

export async function listOrders(salonId: string): Promise<OrderWithItems[]> {
  const orderRows = await db
    .select({
      id: orders.id,
      customerName: orders.customerName,
      customerEmail: orders.customerEmail,
      customerPhone: orders.customerPhone,
      status: orders.status,
      totalCents: orders.totalCents,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.salonId, salonId))
    .orderBy(sql`${orders.createdAt} desc`);

  if (!orderRows.length) return [];

  const itemRows = await db
    .select({
      orderId: orderItems.orderId,
      productName: orderItems.productName,
      unitPriceCents: orderItems.unitPriceCents,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderRows.map((o) => o.id)));

  return orderRows.map((o) => ({
    ...o,
    items: itemRows.filter((i) => i.orderId === o.id).map(({ productName, unitPriceCents, quantity }) => ({
      productName,
      unitPriceCents,
      quantity,
    })),
  }));
}

/** Units sold per product over the trailing `days` — the AI agent's raw
 * material for reorder suggestions (sales velocity). */
export async function getSalesVelocity(
  salonId: string,
  days: number,
): Promise<{ productId: string; productName: string; unitsSold: number }[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      productId: inventoryMovements.productId,
      quantity: sql<number>`abs(${inventoryMovements.quantityDelta})`,
    })
    .from(inventoryMovements)
    .where(
      and(
        eq(inventoryMovements.salonId, salonId),
        eq(inventoryMovements.type, "sale"),
        gte(inventoryMovements.createdAt, since),
      ),
    );

  const productRows = await listProducts(salonId);
  const byId = new Map(productRows.map((p) => [p.id, p.name]));

  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.productId, (totals.get(row.productId) ?? 0) + Number(row.quantity));
  }

  return Array.from(totals.entries()).map(([productId, unitsSold]) => ({
    productId,
    productName: byId.get(productId) ?? "Onbekend product",
    unitsSold,
  }));
}
