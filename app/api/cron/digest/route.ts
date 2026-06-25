import { NextResponse } from "next/server";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { salons, users, events } from "@/lib/db/schema";
import { weeklyDigestEmail } from "@/lib/mail/templates";
import { sendEmail } from "@/lib/mail/resend";
import { env } from "@/lib/env";
import { publicEnv } from "@/lib/env";
import { captureError } from "@/lib/observability";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(req: Request): boolean {
  if (!env.CRON_SECRET) return false;
  return req.headers.get("authorization") === `Bearer ${env.CRON_SECRET}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!env.DATABASE_URL) {
    return NextResponse.json({ error: "No database" }, { status: 500 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Get all active salons with at least one event in the past 7 days
  const activeSalons = await db
    .select({ id: salons.id, name: salons.name })
    .from(salons)
    .where(eq(salons.status, "active"))
    .limit(200);

  let sent = 0;

  for (const salon of activeSalons) {
    try {
      // Get metrics for this salon
      const eventRows = await db
        .select({ type: events.type, count: sql<number>`count(*)::int` })
        .from(events)
        .where(and(eq(events.salonId, salon.id), gte(events.createdAt, sevenDaysAgo)))
        .groupBy(events.type);

      const getCount = (type: string) =>
        Number(eventRows.find((r) => r.type === type)?.count ?? 0);

      const callsHandled = getCount("call_handled");
      const bookingsMade = getCount("booking_made");
      const noShowsPrevented = getCount("no_show_prevented");

      // Skip salons with zero activity
      if (callsHandled + bookingsMade + noShowsPrevented === 0) continue;

      const ownerRows = await db
        .select({ email: users.email })
        .from(users)
        .where(and(eq(users.salonId, salon.id), eq(users.role, "owner")))
        .limit(1);

      if (!ownerRows[0]) continue;

      const period = new Date().toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      await sendEmail({
        to: ownerRows[0].email,
        subject: `Weekoverzicht ${salon.name} — KapperAssistent`,
        html: weeklyDigestEmail({
          salonName: salon.name,
          period,
          callsHandled,
          bookingsMade,
          noShowsPrevented,
          protectedRevenueEur: Math.round((noShowsPrevented * 6500) / 100),
          dashboardUrl: `${publicEnv.NEXT_PUBLIC_SITE_URL}/dashboard`,
        }),
      });
      sent++;
    } catch (err) {
      captureError(`digest/salon-${salon.id}`, err);
    }
  }

  return NextResponse.json({ ok: true, sent });
}

export async function POST(req: Request) {
  return GET(req);
}
