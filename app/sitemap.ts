import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";
import { listPublishedSlugs } from "@/lib/blog/queries";
import { listPublishedKnowledgeSlugs } from "@/lib/kennisbank/queries";
import { HELP_ARTICLES, HELP_CATEGORIES } from "@/lib/help/articles";
import { getHelpCorpus } from "@/lib/help/store";
import { INTEGRATION_PAGES } from "@/lib/marketing/integrations";
import { solutionsFor } from "@/lib/marketing/solutions";

export const revalidate = 3600;

const newest = (dates: (Date | null)[]): Date | undefined =>
  dates.reduce<Date | undefined>((acc, d) => (d && (!acc || d > acc) ? d : acc), undefined);

/**
 * Only `lastModified` values that are true are emitted: an article's `updated_at`,
 * or the newest article for an index/hub. Pages without a real
 * modification date carry none — a `now` on every URL teaches Google to ignore
 * the field. (`changeFrequency`/`priority` are ignored by Google, so omitted.)
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.NEXT_PUBLIC_SITE_URL;
  const staticRoutes = ["", "/diensten", "/prijzen", "/over-ons", "/contact", "/scan", "/help", "/faq", "/status", "/privacy", "/voorwaarden"];

  let posts: Awaited<ReturnType<typeof listPublishedSlugs>> = [];
  let kposts: Awaited<ReturnType<typeof listPublishedKnowledgeSlugs>> = [];
  try {
    [posts, kposts] = await Promise.all([listPublishedSlugs(), listPublishedKnowledgeSlugs()]);
  } catch {
    // DB unavailable at build/preview — ship static routes only.
  }

  const entries: MetadataRoute.Sitemap = [
    ...staticRoutes.map((r) => ({ url: `${base}${r}` })),
    ...solutionsFor("kapper").map((s) => ({ url: `${base}/oplossingen/${s.slug}` })),
    ...INTEGRATION_PAGES.map((p) => ({ url: `${base}/integraties/${p.slug}` })),
    { url: `${base}/blog`, lastModified: newest(posts.map((p) => p.updatedAt)) },
    { url: `${base}/kennisbank`, lastModified: newest(kposts.map((p) => p.updatedAt)) },
  ];

  const categories = [...new Set(kposts.map((p) => p.category).filter((c): c is string => !!c))];
  for (const cat of categories) {
    entries.push({
      url: `${base}/kennisbank/categorie/${cat}`,
      lastModified: newest(kposts.filter((p) => p.category === cat).map((p) => p.updatedAt)),
    });
  }
  for (const p of posts) entries.push({ url: `${base}/blog/${p.slug}`, lastModified: p.updatedAt });
  for (const p of kposts) entries.push({ url: `${base}/kennisbank/${p.slug}`, lastModified: p.updatedAt });

  let helpArticles = HELP_ARTICLES;
  try {
    helpArticles = await getHelpCorpus();
  } catch {
    // DB unavailable at build/preview — code-defined articles only.
  }
  for (const c of HELP_CATEGORIES) entries.push({ url: `${base}/help/categorie/${c.id}` });
  for (const a of helpArticles) entries.push({ url: `${base}/help/${a.slug}` });

  return entries;
}
