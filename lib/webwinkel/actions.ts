"use server";

import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { products, inventoryMovements, salons } from "@/lib/db/schema";
import { requireSalonOwner } from "@/lib/auth/dal";
import { getSalonPlan, salonHasPlan } from "@/lib/salon/plan";
import { getInventoryAgentReply, type InventoryChatMessage } from "@/lib/ai/inventory-agent";
import type { ActionState } from "@/lib/salon/actions";

const PATH = "/dashboard/webwinkel";
const PRO_REQUIRED = "Deze functie is onderdeel van het Pro-abonnement. Upgrade via Abonnement.";

async function requireProOwner() {
  const user = await requireSalonOwner();
  const plan = await getSalonPlan(user.salonId);
  return { user, isPro: salonHasPlan(plan, "pro") };
}

/* -------------------------------- Producten -------------------------------- */

const productSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000),
  sku: z.string().max(100),
  category: z.string().max(100),
  priceEuros: z.number().min(0).max(10_000),
  imageUrl: z.string().max(2000),
  stockQuantity: z.number().int().min(0).max(1_000_000),
  lowStockThreshold: z.number().int().min(0).max(100_000),
});

export async function createProduct(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const { user, isPro } = await requireProOwner();
  if (!isPro) return { error: PRO_REQUIRED };

  const parsed = productSchema.safeParse({
    name: formData.get("name") ?? "",
    description: formData.get("description") ?? "",
    sku: formData.get("sku") ?? "",
    category: formData.get("category") ?? "",
    priceEuros: Number(formData.get("priceEuros") ?? 0),
    imageUrl: formData.get("imageUrl") ?? "",
    stockQuantity: Number(formData.get("stockQuantity") ?? 0),
    lowStockThreshold: Number(formData.get("lowStockThreshold") ?? 5),
  });
  if (!parsed.success) return { error: "Ongeldige invoer voor het product." };

  const [product] = await db
    .insert(products)
    .values({
      salonId: user.salonId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      sku: parsed.data.sku || null,
      category: parsed.data.category || null,
      priceCents: Math.round(parsed.data.priceEuros * 100),
      imageUrl: parsed.data.imageUrl || null,
      stockQuantity: parsed.data.stockQuantity,
      lowStockThreshold: parsed.data.lowStockThreshold,
    })
    .returning({ id: products.id });

  if (parsed.data.stockQuantity > 0) {
    await db.insert(inventoryMovements).values({
      salonId: user.salonId,
      productId: product.id,
      type: "restock",
      quantityDelta: parsed.data.stockQuantity,
      reason: "Startvoorraad bij aanmaken product",
    });
  }

  revalidatePath(PATH);
  return { success: true };
}

export async function updateProduct(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const { user, isPro } = await requireProOwner();
  if (!isPro) return { error: PRO_REQUIRED };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Ontbrekend product-id." };

  const parsed = productSchema.safeParse({
    name: formData.get("name") ?? "",
    description: formData.get("description") ?? "",
    sku: formData.get("sku") ?? "",
    category: formData.get("category") ?? "",
    priceEuros: Number(formData.get("priceEuros") ?? 0),
    imageUrl: formData.get("imageUrl") ?? "",
    stockQuantity: Number(formData.get("stockQuantity") ?? 0),
    lowStockThreshold: Number(formData.get("lowStockThreshold") ?? 5),
  });
  if (!parsed.success) return { error: "Ongeldige invoer voor het product." };

  await db
    .update(products)
    .set({
      name: parsed.data.name,
      description: parsed.data.description || null,
      sku: parsed.data.sku || null,
      category: parsed.data.category || null,
      priceCents: Math.round(parsed.data.priceEuros * 100),
      imageUrl: parsed.data.imageUrl || null,
      lowStockThreshold: parsed.data.lowStockThreshold,
      active: formData.get("active") === "true",
    })
    .where(and(eq(products.id, id), eq(products.salonId, user.salonId)));

  revalidatePath(PATH);
  return { success: true };
}

export async function deleteProduct(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const { user, isPro } = await requireProOwner();
  if (!isPro) return { error: PRO_REQUIRED };
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Ontbrekend id." };
  await db.delete(products).where(and(eq(products.id, id), eq(products.salonId, user.salonId)));
  revalidatePath(PATH);
  return { success: true };
}

/* -------------------------------- Voorraad -------------------------------- */

const adjustSchema = z.object({
  productId: z.string().uuid(),
  delta: z.number().int().min(-100_000).max(100_000).refine((v) => v !== 0, "Aantal mag niet 0 zijn."),
  reason: z.string().max(300),
});

export async function adjustStock(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const { user, isPro } = await requireProOwner();
  if (!isPro) return { error: PRO_REQUIRED };

  const parsed = adjustSchema.safeParse({
    productId: formData.get("productId") ?? "",
    delta: Number(formData.get("delta") ?? 0),
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) return { error: "Ongeldige voorraadaanpassing." };

  const [owned] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, parsed.data.productId), eq(products.salonId, user.salonId)))
    .limit(1);
  if (!owned) return { error: "Onbekend product." };

  await db
    .update(products)
    .set({ stockQuantity: sql`greatest(0, ${products.stockQuantity} + ${parsed.data.delta})` })
    .where(eq(products.id, parsed.data.productId));

  await db.insert(inventoryMovements).values({
    salonId: user.salonId,
    productId: parsed.data.productId,
    type: parsed.data.delta > 0 ? "restock" : "adjustment",
    quantityDelta: parsed.data.delta,
    reason: parsed.data.reason || null,
  });

  revalidatePath(PATH);
  return { success: true };
}

/* ------------------------------- AI-agent chat ------------------------------ */

export async function askInventoryAgent(
  history: InventoryChatMessage[],
): Promise<{ reply: string } | { error: string }> {
  const { user, isPro } = await requireProOwner();
  if (!isPro) return { error: PRO_REQUIRED };

  const [salon] = await db.select({ name: salons.name }).from(salons).where(eq(salons.id, user.salonId)).limit(1);
  const reply = await getInventoryAgentReply(user.salonId, salon?.name ?? "je salon", history);
  return { reply };
}
