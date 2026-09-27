import { notFound } from "next/navigation";
import { listPublishedSlugs } from "@/lib/blog/queries";
import { listPublishedKnowledgeSlugs } from "@/lib/kennisbank/queries";
import { solutionsFor } from "@/lib/marketing/solutions";
import { DEFAULT_VERTICAL_ID, isVerticalId, getVerticalConfig, listLiveVerticals } from "@/lib/verticals";

// Rendered per request and cached at the CDN (Cache-Control) instead of
// prerendered via generateStaticParams: Vercel's build adapter can't map
// prerendered route handlers under /sites/[vertical] ("failed to find source
// route … for prerender"), which blocked every production deploy since the
// multi-site split. Unknown and not-yet-live verticals still 404 below.
export const dynamic = "force-dynamic";

const STATIC_ROUTES = ["", "/prijzen", "/contact", "/blog", "/kennisbank", "/help", "/faq", "/status", "/privacy", "/voorwaarden"];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Sitemap of one vertical's own site (served at <host>/sitemap.xml via the
 * proxy rewrite). It only lists that vertical's URLs and articles, on that
 * vertical's canonical origin — so a trade site never advertises another
 * trade's pages.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ vertical: string }> }) {
  const { vertical } = await params;
  if (!isVerticalId(vertical) || vertical === DEFAULT_VERTICAL_ID || !listLiveVerticals().some((v) => v.id === vertical)) notFound();
  const base = getVerticalConfig(vertical).brand.siteUrl;
  type Entry = { loc: string; lastmod?: Date | null };
  const entries: Entry[] = [...STATIC_ROUTES, ...solutionsFor(vertical).map((s) => `/oplossingen/${s.slug}`)].map((r) => ({ loc: `${base}${r}` }));
  const newest = (ds: (Date | null)[]) => ds.reduce<Date | null>((acc, d) => (d && (!acc || d > acc) ? d : acc), null);

  try {
    const [posts, kposts] = await Promise.all([listPublishedSlugs(vertical), listPublishedKnowledgeSlugs(vertical)]);
    // Index pages carry the newest article date; everything else only what is true.
    for (const e of entries) {
      if (e.loc === `${base}/blog`) e.lastmod = newest(posts.map((p) => p.updatedAt));
      if (e.loc === `${base}/kennisbank`) e.lastmod = newest(kposts.map((p) => p.updatedAt));
    }
    for (const cat of new Set(kposts.map((p) => p.category).filter((c): c is string => !!c))) {
      entries.push({ loc: `${base}/kennisbank/categorie/${cat}`, lastmod: newest(kposts.filter((p) => p.category === cat).map((p) => p.updatedAt)) });
    }
    for (const p of posts) entries.push({ loc: `${base}/blog/${p.slug}`, lastmod: p.updatedAt });
    for (const p of kposts) entries.push({ loc: `${base}/kennisbank/${p.slug}`, lastmod: p.updatedAt });
  } catch {
    // DB unavailable at build/preview — ship static routes only.
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries
      .map((e) => `  <url><loc>${esc(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod.toISOString()}</lastmod>` : ""}</url>`)
      .join("\n") +
    `\n</urlset>\n`;

  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400" } });
}
