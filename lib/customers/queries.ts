import "server-only";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";

export interface Customer {
  id: string;
  salonId: string;
  name: string;
  phone: string;
  email: string | null;
  birthDate: Date | null;
  source: "ai_whatsapp" | "ai_phone" | "manual";
  marketingOptIn: boolean;
  noShowCount: number;
  blockedFromOnlineBooking: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

export async function listCustomers(salonId: string, limit = 100): Promise<Customer[]> {
  return db
    .select()
    .from(customers)
    .where(eq(customers.salonId, salonId))
    .orderBy(desc(customers.createdAt))
    .limit(limit);
}

/** Klanten-dashboard: naam/telefoon-zoekbalk. Lege query valt terug op listCustomers. */
export async function searchCustomers(salonId: string, query: string, limit = 50): Promise<Customer[]> {
  const q = query.trim();
  if (!q) return listCustomers(salonId, limit);

  const like = `%${q}%`;
  return db
    .select()
    .from(customers)
    .where(and(eq(customers.salonId, salonId), or(ilike(customers.name, like), ilike(customers.phone, like))))
    .orderBy(desc(customers.createdAt))
    .limit(limit);
}

export async function getCustomer(salonId: string, customerId: string): Promise<Customer | null> {
  const rows = await db
    .select()
    .from(customers)
    .where(and(eq(customers.salonId, salonId), eq(customers.id, customerId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function findCustomerByPhone(salonId: string, phone: string): Promise<Customer | null> {
  const rows = await db
    .select()
    .from(customers)
    .where(and(eq(customers.salonId, salonId), eq(customers.phone, normalizePhone(phone))))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Find-or-create by (salonId, phone) — the AI channels (WhatsApp/phone) call
 * this on every booking so every appointment ends up linked to a customer
 * record without the caller having to check existence first.
 */
export async function upsertCustomerByPhone(input: {
  salonId: string;
  phone: string;
  name: string;
  email?: string | null;
  source: "ai_whatsapp" | "ai_phone" | "manual";
}): Promise<Customer> {
  const phone = normalizePhone(input.phone);
  const existing = await findCustomerByPhone(input.salonId, phone);
  if (existing) {
    // Keep the name in sync with the latest booking (customers rarely
    // change their phone number, but a name typo/correction is common).
    if (input.name && input.name !== existing.name) {
      const [updated] = await db
        .update(customers)
        .set({ name: input.name })
        .where(eq(customers.id, existing.id))
        .returning();
      return updated ?? existing;
    }
    return existing;
  }

  const [created] = await db
    .insert(customers)
    .values({
      salonId: input.salonId,
      phone,
      name: input.name || "Onbekend",
      email: input.email ?? null,
      source: input.source,
    })
    .returning();
  return created!;
}
