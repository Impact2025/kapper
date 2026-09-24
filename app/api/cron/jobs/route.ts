import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { generateDueContractJobs, expireOldQuotes } from "@/lib/jobs/contracts";
import { sendDueInvoiceReminders } from "@/lib/jobs/documents";
import { captureError } from "@/lib/observability";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(req: Request): boolean {
  if (!env.CRON_SECRET) return false;
  return req.headers.get("authorization") === `Bearer ${env.CRON_SECRET}`;
}

/**
 * Klus-CRM daily housekeeping (job-archetype salons only have rows to act on):
 *  1. onderhoudscontracten → create the klus + notify the klant,
 *  2. openstaande facturen → friendly reminders at +1/+8/+15 days,
 *  3. verlopen offertes → status "expired".
 * Every step is idempotent, so a retried or overlapping run is harmless.
 */
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const result: Record<string, unknown> = {};
  for (const [name, run] of [
    ["contracts", () => generateDueContractJobs(now)],
    ["invoiceReminders", () => sendDueInvoiceReminders(now)],
    ["quotesExpired", () => expireOldQuotes(now)],
  ] as const) {
    try {
      result[name] = await run();
    } catch (err) {
      captureError(`cron/jobs/${name}`, err);
      result[name] = { error: true };
    }
  }
  return NextResponse.json({ ok: true, ...result });
}
