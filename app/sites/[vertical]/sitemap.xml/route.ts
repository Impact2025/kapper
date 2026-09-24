import { notFound } from "next/navigation";
import { listPublishedSlugs } from "@/lib/blog/queries";
import { listPublishedKnowledgeSlugs } from "@/lib/kennisbank/queries";
import { DEFAULT_VERTICAL_ID, isVerticalId, getVerticalConfig, listLiveVerticals } from "@/lib/verticals";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return listLiveVerticals()
    .filter((v) => v.id !== DEFAULT_VERTICAL_ID)
    .map((v) => ({ vertical: v.id }));
}

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
  if (!isVerticalId(vertical) || vertical === DEFAULT_VERTICAL_ID) notFound();
  const base = getVerticalConfig(vertical).brand.siteUrl;
  const now = new Date().toISOString();

  const entries: { loc: string; lastmod: string; changefreq: string; priority: number }[] = STATIC_ROUTES.map((r) => ({
    loc: `${base}${r}`,
    lastmod: now,
    changefreq: r === "/blog" || r === "/kennisbank" ? "daily" : "weekly",
    priority: r === "" ? 1 : r === "/blog" || r === "/kennisbank" ? 0.8 : 0.7,
  }));

  try {
    for (const p of await listPublishedSlugs(vertical)) {
      entries.push({ loc: `${base}/blog/${p.slug}`, lastmod: (p.publishedAt ?? new Date()).toISOString(), changefreq: "monthly", priority: 0.6 });
    }
    for (const p of await listPublishedKnowledgeSlugs(vertical)) {
      entries.push({ loc: `${base}/kennisbank/${p.slug}`, lastmod: (p.publishedAt ?? new Date()).toISOString(), changefreq: "monthly", priority: 0.6 });
    }
  } catch {
    // DB unavailable at build/preview — ship static routes only.
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries
      .map((e) => `  <url><loc>${esc(e.loc)}</loc><lastmod>${e.lastmod}</lastmod><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`)
      .join("\n") +
    `\n</urlset>\n`;

  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
