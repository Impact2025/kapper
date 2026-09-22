import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments, conversations, customers, orders } from "@/lib/db/schema";
import { trackEvent } from "@/lib/analytics/track";

const ANONYMIZED_NAME = "Verwijderd op verzoek (AVG)";

export interface PurgeSummary {
  conversationsDeleted: number;
  appointmentsAnonymized: number;
  ordersAnonymized: number;
}

/**
 * Fase 6 — Artikel 17 AVG recht op vergetelheid. Wipes/anonymizes every
 * trace of a customer, salon-scoped:
 *
 * - `customers` row itself: hard-deleted. FK cascades handle
 *   `treatment_cards`, `health_records`, `photos` and `loyalty_mutations`
 *   automatically (all `ON DELETE CASCADE` on customer_id).
 * - `conversations` (matched by salonId+phone — there's no customer_id FK,
 *   conversations predate the customers table): hard-deleted, which cascades
 *   `messages`. `agent_runs` rows survive with conversation_id set to null
 *   (`ON DELETE SET NULL`) — that audit trail is the Artikel 50 record of
 *   what the AI did, not personal data about the customer, so it's kept.
 * - `appointments`/`orders`: NOT deleted. Dutch fiscal record-keeping
 *   obligations (Belastingdienst, 7 jaar) can require the underlying
 *   transaction/booking history to survive an erasure request (AVG Artikel
 *   17 lid 3 sub b) — only the personally identifying fields on those rows
 *   are anonymized, financial/scheduling data stays intact for the salon's
 *   own bookkeeping.
 *
 * Never partially applies: if any step fails, the caller sees an error and
 * nothing is guaranteed to have been rolled back (this driver doesn't
 * support transactions the way node-postgres does) — callers should treat a
 * thrown error as "re-run the purge", since every step here is idempotent.
 */
export async function purgeCustomerData(salonId: string, customerId: string): Promise<PurgeSummary | { error: string }> {
  const [customer] = await db
    .select({ id: customers.id, phone: customers.phone })
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.salonId, salonId)))
    .limit(1);
  if (!customer) return { error: "Onbekende klant." };

  const [appointmentsResult, ordersResult] = await Promise.all([
    db
      .update(appointments)
      .set({ customerName: ANONYMIZED_NAME, customerPhone: "" })
      .where(and(eq(appointments.salonId, salonId), eq(appointments.customerId, customerId)))
      .returning({ id: appointments.id }),
    db
      .update(orders)
      .set({ customerName: ANONYMIZED_NAME, customerPhone: null, customerEmail: null })
      .where(and(eq(orders.salonId, salonId), eq(orders.customerId, customerId)))
      .returning({ id: orders.id }),
  ]);

  const deletedConversations = await db
    .delete(conversations)
    .where(and(eq(conversations.salonId, salonId), eq(conversations.phoneNumber, customer.phone)))
    .returning({ id: conversations.id });

  // Hard-delete last: cascades treatment_cards/health_records/photos/loyalty_mutations.
  await db.delete(customers).where(eq(customers.id, customerId));

  await trackEvent({
    type: "gdpr_purge",
    salonId,
    props: {
      // The customer no longer exists after this — logging the id here is
      // just the audit proof a purge happened for that identifier, not
      // personal data (there's nothing left to link it back to a name).
      customerId,
      conversationsDeleted: deletedConversations.length,
      appointmentsAnonymized: appointmentsResult.length,
      ordersAnonymized: ordersResult.length,
    },
  });

  return {
    conversationsDeleted: deletedConversations.length,
    appointmentsAnonymized: appointmentsResult.length,
    ordersAnonymized: ordersResult.length,
  };
}
