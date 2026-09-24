import { NextResponse } from "next/server";
import { and, eq, isNull, lt, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { getVerticalConfig } from "@/lib/verticals";
import { appointments, salons } from "@/lib/db/schema";
import { sendWatiMessage } from "@/lib/salon/wati-client";
import { resolveWatiCredentials } from "@/lib/ai/wati-turn";
import { trackEvent } from "@/lib/analytics/track";
import { env } from "@/lib/env";
import { decrypt } from "@/lib/crypto";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(req: Request): boolean {
  if (!env.CRON_SECRET) return false;
  return req.headers.get("authorization") === `Bearer ${env.CRON_SECRET}`;
}

/**
 * Fase 5 automatisch reviewbeheer: ~2h after a confirmed appointment's time
 * has passed (no explicit "mark completed" flow exists yet, so a past
 * confirmed appointment is treated as done), ask the customer for a review.
 * Only within a 48h window so a first cron run after enabling this doesn't
 * suddenly text every old appointment. Per-salon opt-in via
 * settings.marketing.reviewRequestsEnabled + googleReviewLink.
 */
export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - 48 * 3600_000);
  const windowEnd = new Date(now.getTime() - 2 * 3600_000);

  const candidates = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.status, "confirmed"),
        isNull(appointments.reviewRequestedAt),
        gte(appointments.appointmentTime, windowStart),
        lt(appointments.appointmentTime, windowEnd),
      ),
    )
    .limit(100);

  let sent = 0;
  let skipped = 0;

  for (const apt of candidates) {
    if (!apt.customerPhone) {
      skipped++;
      continue;
    }

    const [salon] = await db.select().from(salons).where(eq(salons.id, apt.salonId)).limit(1);
    if (!salon) {
      skipped++;
      continue;
    }

    const marketing = (salon.settings as Record<string, unknown>)?.marketing as
      | Record<string, unknown>
      | undefined;
    const reviewLink = marketing?.googleReviewLink ? String(marketing.googleReviewLink) : null;
    if (!marketing?.reviewRequestsEnabled || !reviewLink) {
      skipped++;
      continue;
    }

    const credentials = resolveWatiCredentials(salon, env.WATI_API_KEY, env.WATI_BASE_URL, decrypt);
    if (!credentials) {
      skipped++;
      continue;
    }

    await sendWatiMessage(
      credentials.watiBaseUrl,
      credentials.watiApiKey,
      apt.customerPhone,
      getVerticalConfig(salon.vertical).messages.review({ salonName: salon.name, reviewLink }),
    );

    await db.update(appointments).set({ reviewRequestedAt: now }).where(eq(appointments.id, apt.id));
    await trackEvent({
      type: "review_requested",
      salonId: apt.salonId,
      props: { appointmentId: apt.id },
      dedupeKey: `review-requested:${apt.id}`,
    });
    sent++;
  }

  return NextResponse.json({ ok: true, sent, skipped });
}

export async function POST(req: Request) {
  return GET(req);
}
