import { db } from "@/lib/db";
import { salons, products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const [salon] = await db.select({ id: salons.id }).from(salons).where(eq(salons.slug, "huidzorg-clinics-demo")).limit(1);
  const rows = await db.select({ name: products.name, stock: products.stockQuantity, threshold: products.lowStockThreshold, price: products.priceCents }).from(products).where(eq(products.salonId, salon!.id));
  console.table(rows);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
