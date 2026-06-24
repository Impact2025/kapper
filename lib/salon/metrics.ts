import "server-only";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { env } from "@/lib/env";

export interface SalonMetrics {
  callsHandled: number;
  bookingsMade: number;
  noShowsPrevented: number;
  whatsappMessages: number;
  protectedRevenueCents: number;
  callsHandledDelta: number;
  bookingsMadeDelta: number;
  isDemo: boolean;
}

const DEMO: SalonMetrics = {
  callsHandled: 47,
  bookingsMade: 31,
  noShowsPrevented: 8,
  whatsappMessages: 42,
  protectedRevenueCents: 52000,
  callsHandledDelta: 23,
  bookingsMadeDelta: 18,
  isDemo: true,
};

export async function getSalonMetrics(salonId: string): Promise<SalonMetrics> {
  if (!env.DATABASE_URL) return DEMO;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [current, previous] = await Promise.all([
    db
      .select({ type: events.type, count: sql<number>`count(*)::int` })
      .from(events)
      .where(and(eq(events.salonId, salonId), gte(events.createdAt, thirtyDaysAgo)))
      .groupBy(events.type),
    db
      .select({ type: events.type, count: sql<number>`count(*)::int` })
      .from(events)
      .where(
        and(
          eq(events.salonId, salonId),
          gte(events.createdAt, sixtyDaysAgo),
          lt(events.createdAt, thirtyDaysAgo),
        ),
      )
      .groupBy(events.type),
  ]);

  const getCount = (rows: { type: string; count: number }[], type: string) =>
    Number(rows.find((r) => r.type === type)?.count ?? 0);

  const callsHandled = getCount(current, "call_handled");
  const bookingsMade = getCount(current, "booking_made");
  const noShowsPrevented = getCount(current, "no_show_prevented");
  const whatsappMessages = getCount(current, "whatsapp_message");

  const prevCalls = getCount(previous, "call_handled");
  const prevBookings = getCount(previous, "booking_made");

  const delta = (curr: number, prev: number) =>
    prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);

  const allZero = callsHandled + bookingsMade + noShowsPrevented + whatsappMessages === 0;
  if (allZero) return DEMO;

  return {
    callsHandled,
    bookingsMade,
    noShowsPrevented,
    whatsappMessages,
    protectedRevenueCents: noShowsPrevented * 6500,
    callsHandledDelta: delta(callsHandled, prevCalls),
    bookingsMadeDelta: delta(bookingsMade, prevBookings),
    isDemo: false,
  };
}
