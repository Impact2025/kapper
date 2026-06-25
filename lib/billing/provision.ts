import "server-only";
import { randomBytes, createHash } from "node:crypto";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { salons, subscriptions, events, users, verificationTokens } from "@/lib/db/schema";
import { redeemCoupon } from "@/lib/coupons/service";
import { PLANS, type PlanId } from "@/lib/plans";
import { slugify } from "@/lib/utils";
import { sendEmail } from "@/lib/mail/resend";
import { welcomeEmail } from "@/lib/mail/templates";
import { publicEnv } from "@/lib/env";

function planById(id: string | undefined): (typeof PLANS)[number] | undefined {
  return PLANS.find((p) => p.id === id);
}

/** Ensure a unique salon slug. */
async function uniqueSlug(base: string): Promise<string> {
  let slug = slugify(base) || "salon";
  let i = 2;
  // Small bounded loop; collisions are rare.
  while (true) {
    const [existing] = await db
      .select({ id: salons.id })
      .from(salons)
      .where(eq(salons.slug, slug))
      .limit(1);
    if (!existing) return slug;
    slug = `${slugify(base)}-${i++}`;
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const planId = session.metadata?.plan as PlanId | undefined;
  const salonName = session.metadata?.salonName ?? "Nieuwe salon";
  const couponId = session.metadata?.couponId || undefined;
  const email = (session.metadata?.email ?? session.customer_email ?? "").toLowerCase().trim();
  const plan = planById(planId);
  if (!plan) return;

  const slug = await uniqueSlug(salonName);
  const [salon] = await db
    .insert(salons)
    .values({
      name: salonName,
      slug,
      plan: plan.id,
      status: "active",
      mrr: plan.price * 100,
    })
    .returning({ id: salons.id });

  await db.insert(subscriptions).values({
    salonId: salon.id,
    stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
    stripeSubId: typeof session.subscription === "string" ? session.subscription : null,
    plan: plan.id,
    status: "active",
  });

  if (couponId) {
    try {
      await redeemCoupon(couponId, salon.id);
    } catch {
      /* non-fatal */
    }
  }

  await db.insert(events).values({
    type: "subscription_started",
    salonId: salon.id,
    props: { plan: plan.id, amount: plan.price },
    dedupeKey: `checkout:${session.id}`,
  });

  // Auto-create owner account so user can login immediately (no 24h wait)
  if (email) {
    try {
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!existing[0]) {
        await db.insert(users).values({
          email,
          name: salonName,
          role: "owner",
          salonId: salon.id,
        });
      } else {
        // Link existing account to the new salon
        await db
          .update(users)
          .set({ salonId: salon.id, role: "owner" })
          .where(eq(users.id, existing[0].id));
      }

      // Issue a one-time set-password token (24h) via verificationTokens table
      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Remove any previous tokens for this email
      await db
        .delete(verificationTokens)
        .where(eq(verificationTokens.identifier, `reset:${email}`));

      await db.insert(verificationTokens).values({
        identifier: `reset:${email}`,
        token: tokenHash,
        expires,
      });

      const setPasswordUrl = `${publicEnv.NEXT_PUBLIC_SITE_URL}/reset-password/${rawToken}`;
      await sendEmail({
        to: email,
        subject: `Welkom bij KapperAssistent — stel je wachtwoord in`,
        html: welcomeEmail({ salonName, setPasswordUrl }),
      });
    } catch (err) {
      console.error("[provision] auto-account creation failed:", err);
    }
  }
}

async function handleSubscriptionChange(sub: Stripe.Subscription, canceled: boolean) {
  const status = canceled ? "canceled" : sub.status;
  const [row] = await db
    .update(subscriptions)
    .set({
      status,
      currentPeriodEnd: sub.items?.data?.[0]?.current_period_end
        ? new Date(sub.items.data[0].current_period_end * 1000)
        : null,
    })
    .where(eq(subscriptions.stripeSubId, sub.id))
    .returning({ salonId: subscriptions.salonId });

  if (row?.salonId) {
    const salonStatus = canceled
      ? "canceled"
      : sub.status === "past_due"
        ? "past_due"
        : sub.status === "active" || sub.status === "trialing"
          ? "active"
          : "past_due";
    await db
      .update(salons)
      .set({ status: salonStatus, ...(canceled ? { mrr: 0 } : {}) })
      .where(eq(salons.id, row.salonId));
  }
}

/** Process a verified Stripe event. Returns true if handled. */
export async function handleStripeEvent(event: Stripe.Event): Promise<boolean> {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      return true;
    case "customer.subscription.updated":
      await handleSubscriptionChange(event.data.object as Stripe.Subscription, false);
      return true;
    case "customer.subscription.deleted":
      await handleSubscriptionChange(event.data.object as Stripe.Subscription, true);
      return true;
    default:
      return false;
  }
}
