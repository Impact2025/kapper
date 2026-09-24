import { NextResponse } from "next/server";
import { searchHelp, CONFIDENT_SCORE } from "@/lib/help/search";
import { clientIp, rateLimit } from "@/lib/support/rate-limit";

export const runtime = "nodejs";

/** "Bedoel je dit?" — top helpartikelen bij het typen van een ticketonderwerp (deflectie). */
export async function GET(req: Request) {
  if (!rateLimit(`suggest:${clientIp(req)}`, 60, 60_000).ok) {
    return NextResponse.json({ results: [] }, { status: 429 });
  }
  const q = new URL(req.url).searchParams.get("q")?.slice(0, 200) ?? "";
  const results = searchHelp(q, { limit: 3 })
    .filter((h) => h.score >= CONFIDENT_SCORE)
    .map((h) => ({ slug: h.article.slug, title: h.article.title, summary: h.article.summary }));
  return NextResponse.json({ results });
}
