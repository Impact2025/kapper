import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { clientIp, rateLimit } from "@/lib/support/rate-limit";
import { submitCsat } from "@/lib/support/tickets";

export const runtime = "nodejs";

const schema = z.object({
  token: z.string().min(16).max(80),
  score: z.number().int().min(1).max(5),
  comment: z.string().max(1000).nullish(),
});

/** Tevredenheidsscore (1-5) na oplossen, via de private ticketlink. */
export async function POST(req: Request) {
  if (!env.DATABASE_URL) return NextResponse.json({ ok: false }, { status: 503 });
  if (!rateLimit(`csat:${clientIp(req)}`, 10, 600_000).ok) return NextResponse.json({ ok: false }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 422 });
  const ok = await submitCsat(parsed.data.token, parsed.data.score, parsed.data.comment ?? null);
  return NextResponse.json({ ok }, { status: ok ? 200 : 409 });
}
