import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments, customers } from "@/lib/db/schema";
import { getStripe } from "@/lib/billing/stripe";
import { publicEnv } from "@/lib/env";
import { sendEmail } from "@/lib/mail/resend";
import { simpleEmail } from "@/lib/mail/templates";
import { trackEvent } from "@/lib/analytics/track";
import { captureError } from "@/lib/observability";

/** Sector-neutral no-show/deposit policy — kept out of lib/salon so a future
 * vertical (garage, schilder, ...) reuses this unchanged; only the amount
 * and copy come from the salon's own settings. */
export interface NoShowSettings {
  depositRequired?: boolean;
  depositCents?: number;
}

/** Matches the "Bij behandelingen boven €60" copy already shown on the
 * no-show settings page (app/(salon)/dashboard/no-show/page.tsx). */
const DEPOSIT_PRICE_THRESHOLD_CENTS = 6000;

export function computeDepositRequirement(
  noShowSettings: NoShowSettings,
  treatmentPriceCents: number,
): { required: boolean; amountCents: number } {
  const required = Boolean(
    noShowSettings.depositRequired &&
      noShowSettings.depositCents &&
      noShowSettings.depositCents > 0 &&
      treatmentPriceCents > DEPOSIT_PRICE_THRESHOLD_CENTS,
  );
  return { required, amountCents: required ? noShowSettings.depositCents! : 0 };
}

/**
 * Create a Stripe Checkout session (one-off payment, iDeal + card) for a
 * booking deposit. Returns null when Stripe isn't configured — the caller
 * falls back to booking without a deposit rather than blocking the booking
 * entirely on a missing integration.
 */
export async function createDepositCheckoutSession(input: {
  appointmentId: string;
  salonId: string;
  salonName: string;
  treatmentName: string;
  amountCents: number;
}): Promise<{ url: string; sessionId: string } | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card", "ideal"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: input.amountCents,
          product_data: { name: `Aanbetaling — ${input.treatmentName} bij ${input.salonName}` },
        },
        quantity: 1,
      },
    ],
    metadata: { kind: "appointment_deposit", appointmentId: input.appointmentId, salonId: input.salonId },
    success_url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/aanbetaling/gelukt?appointment=${input.appointmentId}`,
    cancel_url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/aanbetaling/geannuleerd?appointment=${input.appointmentId}`,
    // Makes the payment itself double as the Middelburg-norm explicit policy
    // acceptance — see the comment on markDepositPaid below.
    custom_text: {
      submit: {
        message: `Door te betalen ga je akkoord met het annuleringsbeleid: ${publicEnv.NEXT_PUBLIC_SITE_URL}/voorwaarden`,
      },
    },
  });
  if (!session.url) return null;

  await db
    .update(appointments)
    .set({ depositAmountCents: input.amountCents, stripeDepositSessionId: session.id })
    .where(eq(appointments.id, input.appointmentId));

  return { url: session.url, sessionId: session.id };
}

/**
 * Called from the Stripe webhook once a deposit checkout session completes.
 * A paid deposit page (linking the cancellation terms via Stripe Checkout's
 * custom_text) is itself an explicit accept-and-pay action, so this counts
 * as Middelburg-norm policy acceptance directly — no separate WhatsApp
 * button tap is required afterward, unlike a no-deposit booking.
 * Idempotent: a replayed webhook hitting an already-paid row is a no-op
 * (the `where` clause on depositPaidAt IS NULL simply matches nothing).
 */
export async function markDepositPaid(stripeSessionId: string): Promise<typeof appointments.$inferSelect | null> {
  const [row] = await db
    .update(appointments)
    .set({
      depositPaidAt: new Date(),
      status: "confirmed",
      policyAcceptedAt: new Date(),
      confirmationChannel: "stripe_deposit",
    })
    .where(
      sql`${appointments.stripeDepositSessionId} = ${stripeSessionId} AND ${appointments.depositPaidAt} IS NULL`,
    )
    .returning();
  return row ?? null;
}

/** Number of no-shows after which online AI booking is blocked — the first
 * no-show gets coulance ("menselijke maat"), the second and beyond don't. */
const THREE_STRIKES_BLOCK_AFTER = 2;

/**
 * Fase 2 no-show handhaving: marks the appointment, applies the
 * three-strikes policy to the linked customer, and emails an audit-proof
 * no-show notice when the customer has an email on file. Never throws — a
 * failed notice email must not undo the no-show being recorded.
 */
export async function recordNoShow(
  salonId: string,
  appointmentId: string,
  salonName: string,
): Promise<{ ok: true; blocked: boolean } | { error: string }> {
  const [appointment] = await db
    .update(appointments)
    .set({ status: "no_show" })
    .where(eq(appointments.id, appointmentId))
    .returning();
  if (!appointment || appointment.salonId !== salonId) return { error: "Onbekende afspraak." };
  if (!appointment.customerId) return { ok: true, blocked: false };

  const [customer] = await db
    .update(customers)
    .set({ noShowCount: sql`${customers.noShowCount} + 1` })
    .where(eq(customers.id, appointment.customerId))
    .returning();
  if (!customer) return { ok: true, blocked: false };

  const blocked = customer.noShowCount >= THREE_STRIKES_BLOCK_AFTER;
  if (blocked && !customer.blockedFromOnlineBooking) {
    await db.update(customers).set({ blockedFromOnlineBooking: true }).where(eq(customers.id, customer.id));
  }

  await trackEvent({
    type: "no_show_recorded",
    salonId,
    props: { appointmentId, customerId: customer.id, noShowCount: customer.noShowCount, blocked },
  });

  if (customer.email) {
    try {
      await sendEmail({
        to: customer.email,
        subject: `No-show — ${appointment.serviceType} bij ${salonName}`,
        html: simpleEmail({
          title: "Gemiste afspraak",
          body: `Beste ${customer.name},\n\nJe hebt de afspraak voor ${appointment.serviceType} op ${appointment.appointmentTime.toLocaleDateString("nl-NL")} niet laten weten of bent niet verschenen. Volgens ons annuleringsbeleid, waar je bij het boeken akkoord mee bent gegaan, kan dit in rekening worden gebracht.\n\nHeb je vragen? Neem contact op met ${salonName}.`,
        }),
      });
    } catch (err) {
      captureError("payments-policy/no-show-email", err);
    }
  }

  return { ok: true, blocked };
}
