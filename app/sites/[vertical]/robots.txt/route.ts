import { notFound } from "next/navigation";
import { DEFAULT_VERTICAL_ID, getVerticalConfig, isVerticalId, listLiveVerticals } from "@/lib/verticals";

export const dynamicParams = false;

export function generateStaticParams() {
  return listLiveVerticals()
    .filter((v) => v.id !== DEFAULT_VERTICAL_ID)
    .map((v) => ({ vertical: v.id }));
}

/** robots.txt of one vertical's own site — points at that site's sitemap. */
export async function GET(_req: Request, { params }: { params: Promise<{ vertical: string }> }) {
  const { vertical } = await params;
  if (!isVerticalId(vertical) || vertical === DEFAULT_VERTICAL_ID) notFound();
  const base = getVerticalConfig(vertical).brand.siteUrl;
  const body = ["User-agent: *", "Allow: /", "Disallow: /admin", "Disallow: /dashboard", "Disallow: /api", "Disallow: /offerte", "Disallow: /factuur", "", `Sitemap: ${base}/sitemap.xml`, ""].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
