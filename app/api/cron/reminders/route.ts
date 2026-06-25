import { NextResponse } from "next/server";
import { and, eq, isNull, lte, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments, salons } from "@/lib/db/schema";
import { trackEvent } from "@/lib/analytics/track";
import { env } from "@/lib/env";
import { decrypt } from "@/lib/crypto";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(req: Request): boolean {
  if (!env.CRON_SECRET) return false;
  return req.headers.get("authorization") === `Bearer ${env.CRON_SECRET}`;
}

async function sendWatiReminder(
  baseUrl: string,
  apiKey: string,
  phone: string,
  salonName: string,
  serviceType: string,
  appointmentTime: Date,
): Promise<boolean> {
  const date = appointmentTime.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const time = appointmentTime.toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const message =
    `Hoi! Een herinnering van ${salonName}: je hebt een afspraak voor ${serviceType} op ${date} om ${time}. ` +
    `Kun je niet komen? Annuleer dan tijdig via WhatsApp. Tot dan! 👋`;

  try {
    const res = await fetch(
      `${baseUrl}/api/v1/sendSessionMessage/${encodeURIComponent(phone)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messageText: message }),
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let sent = 0;
  let failed = 0;

  // Find confirmed appointments at 48h or 24h windows that haven't been reminded yet
  for (const hoursAhead of [48, 24]) {
    const windowStart = new Date(now.getTime() + (hoursAhead - 1) * 3600_000);
    const windowEnd = new Date(now.getTime() + (hoursAhead + 1) * 3600_000);

    const upcoming = await db
      .select({
        id: appointments.id,
        salonId: appointments.salonId,
        customerPhone: appointments.customerPhone,
        serviceType: appointments.serviceType,
        appointmentTime: appointments.appointmentTime,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.status, "confirmed"),
          isNull(appointments.reminderSentAt),
          gte(appointments.appointmentTime, windowStart),
          lte(appointments.appointmentTime, windowEnd),
        ),
      )
      .limit(50);

    for (const apt of upcoming) {
      const salonRows = await db
        .select()
        .from(salons)
        .where(eq(salons.id, apt.salonId))
        .limit(1);
      const salon = salonRows[0];
      if (!salon) continue;

      const ai = (salon.settings as Record<string, unknown>)?.ai as
        | Record<string, unknown>
        | undefined;
      const rawKey = ai?.watiApiKey as string | null | undefined;
      const watiApiKey = rawKey ? (decrypt(rawKey) ?? rawKey) : (env.WATI_API_KEY ?? null);
      const watiBaseUrl = env.WATI_BASE_URL ?? "";

      if (!watiApiKey || !watiBaseUrl || !apt.customerPhone) {
        failed++;
        continue;
      }

      const ok = await sendWatiReminder(
        watiBaseUrl,
        watiApiKey,
        apt.customerPhone,
        salon.name,
        apt.serviceType,
        apt.appointmentTime,
      );

      if (ok) {
        await db
          .update(appointments)
          .set({ reminderSentAt: now })
          .where(eq(appointments.id, apt.id));

        await trackEvent({
          type: "no_show_prevented",
          salonId: apt.salonId,
          props: { appointmentId: apt.id, hoursAhead },
          dedupeKey: `reminder:${apt.id}:${hoursAhead}h`,
        });
        sent++;
      } else {
        failed++;
      }
    }
  }

  return NextResponse.json({ ok: true, sent, failed });
}

export async function POST(req: Request) {
  return GET(req);
}
