import { notFound } from "next/navigation";
import { DEFAULT_VERTICAL_ID, getVerticalConfig, isVerticalId, listLiveVerticals } from "@/lib/verticals";

// Rendered per request and cached at the CDN (Cache-Control) instead of
// prerendered via generateStaticParams: Vercel's build adapter can't map
// prerendered route handlers under /sites/[vertical] ("failed to find source
// route … for prerender"), which blocked every production deploy since the
// multi-site split. Unknown and not-yet-live verticals still 404 below.
export const dynamic = "force-dynamic";

/** robots.txt of one vertical's own site — points at that site's sitemap. */
export async function GET(_req: Request, { params }: { params: Promise<{ vertical: string }> }) {
  const { vertical } = await params;
  if (!isVerticalId(vertical) || vertical === DEFAULT_VERTICAL_ID || !listLiveVerticals().some((v) => v.id === vertical)) notFound();
  const base = getVerticalConfig(vertical).brand.siteUrl;
  const body = ["User-agent: *", "Allow: /", "Disallow: /admin", "Disallow: /dashboard", "Disallow: /api", "Disallow: /offerte", "Disallow: /factuur", "", `Sitemap: ${base}/sitemap.xml`, ""].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400" } });
}
