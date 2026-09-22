import { NextResponse } from "next/server";
import { and, eq, ne, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments, customers, salons } from "@/lib/db/schema";
import { sendWatiMessage } from "@/lib/salon/wati-client";
import { resolveWatiCredentials } from "@/lib/ai/wati-turn";
import { trackEvent } from "@/lib/analytics/track";
import { env } from "@/lib/env";
import { decrypt } from "@/lib/crypto";
import { shouldSendRetentionMessage } from "@/lib/retention/logic";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(req: Request): boolean {
  if (!env.CRON_SECRET) return false;
  return req.headers.get("authorization") === `Bearer ${env.CRON_SECRET}`;
}

/**
 * Fase 5 Client ReConnect: per opted-in customer, computes their average gap
 * between past appointments and, once they've gone quiet noticeably longer
 * than their own usual rhythm, sends one reactivation WhatsApp message via
 * the salon's retention-marketing settings toggle.
 */
export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let sent = 0;
  let skipped = 0;

  const activeSalons = await db.select().from(salons).where(eq(salons.status, "active")).limit(200);

  for (const salon of activeSalons) {
    const marketing = (salon.settings as Record<string, unknown>)?.marketing as
      | Record<string, unknown>
      | undefined;
    if (!marketing?.retentionEnabled) continue;

    const credentials = resolveWatiCredentials(salon, env.WATI_API_KEY, env.WATI_BASE_URL, decrypt);
    if (!credentials) continue;

    const eligibleCustomers = await db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        lastRetentionSentAt: customers.lastRetentionSentAt,
      })
      .from(customers)
      .where(and(eq(customers.salonId, salon.id), eq(customers.marketingOptIn, true), eq(customers.blockedFromOnlineBooking, false)))
      .limit(200);

    for (const customer of eligibleCustomers) {
      const history = await db
        .select({ appointmentTime: appointments.appointmentTime })
        .from(appointments)
        .where(and(eq(appointments.customerId, customer.id), ne(appointments.status, "cancelled"), isNotNull(appointments.appointmentTime)))
        .orderBy(appointments.appointmentTime);

      const past = history.filter((h) => h.appointmentTime < now).map((h) => h.appointmentTime);
      const hasUpcoming = history.some((h) => h.appointmentTime >= now);

      const shouldSend = shouldSendRetentionMessage({
        pastAppointmentTimes: past,
        hasUpcoming,
        lastRetentionSentAt: customer.lastRetentionSentAt,
        now,
      });
      if (!shouldSend) {
        skipped++;
        continue;
      }

      if (!customer.phone) {
        skipped++;
        continue;
      }

      await sendWatiMessage(
        credentials.watiBaseUrl,
        credentials.watiApiKey,
        customer.phone,
        `Hoi ${customer.name.split(" ")[0] || ""}! We hebben je een tijdje niet gezien bij ${salon.name}. Zin om weer een afspraak te maken? Stuur gerust een berichtje 😊`,
      );

      await db.update(customers).set({ lastRetentionSentAt: now }).where(eq(customers.id, customer.id));
      await trackEvent({
        type: "retention_sent",
        salonId: salon.id,
        props: { customerId: customer.id },
        dedupeKey: `retention:${customer.id}:${now.toISOString().slice(0, 10)}`,
      });
      sent++;
    }
  }

  return NextResponse.json({ ok: true, sent, skipped });
}

export async function POST(req: Request) {
  return GET(req);
}
