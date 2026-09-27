import { NextResponse } from "next/server";
import { processNewsletterQueue } from "@/lib/newsletter/campaigns";
import { captureError } from "@/lib/observability";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(req: Request): boolean {
  if (!env.CRON_SECRET) return false;
  return req.headers.get("authorization") === `Bearer ${env.CRON_SECRET}`;
}

/** Drains the newsletter send queue and starts scheduled campaigns. */
async function run(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await processNewsletterQueue(8);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    captureError("cron/newsletter", err);
    return NextResponse.json({ error: "Verzenden mislukt" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return run(req);
}

export async function POST(req: Request) {
  return run(req);
}
