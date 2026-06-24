import { NextResponse } from "next/server";
import { z } from "zod";
import { trackEvent } from "@/lib/analytics/track";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const schema = z.object({
  type: z.string().min(1).max(80),
  props: z.record(z.string(), z.unknown()).optional(),
  salonId: z.string().uuid().optional(),
  dedupeKey: z.string().max(200).optional(),
});

/**
 * Ingestion endpoint for external automation (e.g. n8n). Protected by
 * CRON_SECRET (Bearer). `dedupeKey` makes delivery idempotent.
 */
export async function POST(req: Request) {
  if (!env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ongeldige payload" }, { status: 422 });
  }

  await trackEvent(parsed.data);
  return NextResponse.json({ ok: true });
}
