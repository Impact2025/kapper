import { NextResponse } from "next/server";
import { rollupSalonDay, snapshotMrr } from "@/lib/admin/daily-stats";
import { isDayKey, previousDays } from "@/lib/admin/day-window";
import { captureError } from "@/lib/observability";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BACKFILL_DAYS = 90;

function authorized(req: Request): boolean {
  if (!env.CRON_SECRET) return false;
  return req.headers.get("authorization") === `Bearer ${env.CRON_SECRET}`;
}

/**
 * Nightly per-salon rollup for the platform cockpit. Default: yesterday
 * (Amsterdam) plus an MRR snapshot. `?day=YYYY-MM-DD` redoes one day,
 * `?days=N` backfills the last N (activity only — past MRR can't be rebuilt).
 */
async function run(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dayParam = url.searchParams.get("day");
  const daysParam = Number(url.searchParams.get("days") ?? "1");

  let days: string[];
  if (dayParam) {
    if (!isDayKey(dayParam)) return NextResponse.json({ error: "Ongeldige dag" }, { status: 400 });
    days = [dayParam];
  } else {
    const n = Number.isInteger(daysParam) ? Math.min(Math.max(daysParam, 1), MAX_BACKFILL_DAYS) : 1;
    days = previousDays(new Date(), n);
  }

  try {
    const results = [];
    for (const day of days) results.push(await rollupSalonDay(day));
    // MRR history can only be captured live: snapshot "now" as the day that just ended.
    const snapshotted = dayParam ? 0 : await snapshotMrr(days.at(-1)!);
    return NextResponse.json({ ok: true, results, snapshotted });
  } catch (err) {
    captureError("cron/salon-stats", err);
    return NextResponse.json({ error: "Rollup mislukt" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return run(req);
}

export async function POST(req: Request) {
  return run(req);
}
