import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { helpFeedback, helpSearchMisses } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { getPublishedArticle } from "@/lib/help/store";
import { clientIp, rateLimit } from "@/lib/support/rate-limit";

export const runtime = "nodejs";

const schema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("article"),
    slug: z.string().min(1).max(120),
    helpful: z.boolean(),
    comment: z.string().max(500).nullish(),
  }),
  // Search without any result → content backlog.
  z.object({ type: z.literal("search_miss"), query: z.string().trim().min(3).max(200) }),
]);

export async function POST(req: Request) {
  if (!env.DATABASE_URL) return NextResponse.json({ ok: false }, { status: 503 });
  if (!rateLimit(`helpfb:${clientIp(req)}`, 30, 600_000).ok) return NextResponse.json({ ok: false }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 422 });
  const d = parsed.data;

  if (d.type === "article") {
    if (!(await getPublishedArticle(d.slug))) return NextResponse.json({ ok: false }, { status: 404 });
    await db.insert(helpFeedback).values({ articleSlug: d.slug, helpful: d.helpful, comment: d.comment?.trim() || null });
  } else {
    await db.insert(helpSearchMisses).values({ query: d.query, source: "zoeken" });
  }
  return NextResponse.json({ ok: true });
}
