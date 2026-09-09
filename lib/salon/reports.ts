import "server-only";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments, orders, events } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { amsterdamDateKey } from "@/lib/salon/timezone";

export interface DailyPoint {
  date: string;
  count: number;
}

export interface ChannelBreakdown {
  label: string;
  count: number;
}

export interface SalonReportData {
  bookingsTotal: number;
  bookingsByChannel: ChannelBreakdown[];
  cancellations: number;
  noShows: number;
  ordersCount: number;
  salesRevenueCents: number;
  pageViews: number;
  bookingsTrend: DailyPoint[];
  isDemo: boolean;
}

const CHANNEL_LABELS: Record<string, string> = {
  ai_whatsapp: "WhatsApp",
  ai_phone: "Telefoon",
  manual: "Handmatig",
};

function demoData(): SalonReportData {
  const today = new Date();
  const trend: DailyPoint[] = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today.getTime() - (13 - i) * 24 * 60 * 60 * 1000);
    return { date: amsterdamDateKey(d), count: 1 + Math.round(Math.random() * 4) };
  });
  return {
    bookingsTotal: 31,
    bookingsByChannel: [
      { label: "WhatsApp", count: 18 },
      { label: "Telefoon", count: 11 },
      { label: "Handmatig", count: 2 },
    ],
    cancellations: 4,
    noShows: 2,
    ordersCount: 9,
    salesRevenueCents: 34500,
    pageViews: 126,
    bookingsTrend: trend,
    isDemo: true,
  };
}

/** Pro-only management dashboard: bookings, cancellations, webwinkel sales and
 * public page traffic over the trailing `days`. Falls back to demo figures —
 * same convention as {@link getSalonMetrics} — when there's no data yet, so a
 * fresh Pro salon sees what the dashboard will look like instead of zeroes. */
export async function getSalonReportData(salonId: string, days = 30): Promise<SalonReportData> {
  if (!env.DATABASE_URL) return demoData();

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [appointmentRows, orderRows, pageViewRows] = await Promise.all([
    db
      .select({
        status: appointments.status,
        source: appointments.source,
        createdAt: appointments.createdAt,
      })
      .from(appointments)
      .where(and(eq(appointments.salonId, salonId), gte(appointments.createdAt, since))),
    db
      .select({ status: orders.status, totalCents: orders.totalCents })
      .from(orders)
      .where(and(eq(orders.salonId, salonId), gte(orders.createdAt, since))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(events)
      .where(and(eq(events.salonId, salonId), eq(events.type, "page_view"), gte(events.createdAt, since))),
  ]);

  const bookingsTotal = appointmentRows.length;
  const cancellations = appointmentRows.filter((a) => a.status === "cancelled").length;
  const noShows = appointmentRows.filter((a) => a.status === "no_show").length;

  const channelCounts = new Map<string, number>();
  for (const a of appointmentRows) {
    channelCounts.set(a.source, (channelCounts.get(a.source) ?? 0) + 1);
  }
  const bookingsByChannel = Array.from(channelCounts.entries())
    .map(([source, count]) => ({ label: CHANNEL_LABELS[source] ?? source, count }))
    .sort((a, b) => b.count - a.count);

  const paidOrders = orderRows.filter((o) => o.status === "paid" || o.status === "fulfilled");
  const ordersCount = paidOrders.length;
  const salesRevenueCents = paidOrders.reduce((sum, o) => sum + o.totalCents, 0);

  const pageViews = Number(pageViewRows[0]?.count ?? 0);

  const trendByDay = new Map<string, number>();
  for (const a of appointmentRows) {
    const key = amsterdamDateKey(a.createdAt);
    trendByDay.set(key, (trendByDay.get(key) ?? 0) + 1);
  }
  const bookingsTrend: DailyPoint[] = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000);
    const key = amsterdamDateKey(d);
    return { date: key, count: trendByDay.get(key) ?? 0 };
  });

  const allZero = bookingsTotal + ordersCount + pageViews === 0;
  if (allZero) return demoData();

  return {
    bookingsTotal,
    bookingsByChannel,
    cancellations,
    noShows,
    ordersCount,
    salesRevenueCents,
    pageViews,
    bookingsTrend,
    isDemo: false,
  };
}
