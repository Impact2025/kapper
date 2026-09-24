import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";
import { listPublishedSlugs } from "@/lib/blog/queries";
import { listPublishedKnowledgeSlugs } from "@/lib/kennisbank/queries";
import { HELP_ARTICLES, HELP_CATEGORIES } from "@/lib/help/articles";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.NEXT_PUBLIC_SITE_URL;
  const routes = ["", "/diensten", "/prijzen", "/over-ons", "/contact", "/scan", "/blog", "/kennisbank", "/help", "/faq", "/privacy", "/voorwaarden"];
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = routes.map((r) => ({
    url: `${base}${r}`,
    lastModified: now,
    changeFrequency: r === "/blog" || r === "/kennisbank" ? "daily" : "weekly",
    priority: r === "" ? 1 : r === "/blog" || r === "/kennisbank" ? 0.8 : 0.7,
  }));

  let postEntries: MetadataRoute.Sitemap = [];
  try {
    const posts = await listPublishedSlugs();
    postEntries = posts.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.publishedAt ?? now,
      changeFrequency: "monthly",
      priority: 0.6,
    }));
  } catch {
    // DB unavailable at build/preview — ship static routes only.
  }

  let knowledgeEntries: MetadataRoute.Sitemap = [];
  try {
    const kposts = await listPublishedKnowledgeSlugs();
    knowledgeEntries = kposts.map((p) => ({
      url: `${base}/kennisbank/${p.slug}`,
      lastModified: p.publishedAt ?? now,
      changeFrequency: "monthly",
      priority: 0.6,
    }));
  } catch {
    // DB unavailable at build/preview — ship static routes only.
  }

  const helpEntries: MetadataRoute.Sitemap = [
    ...HELP_CATEGORIES.map((c) => ({
      url: `${base}/help/categorie/${c.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...HELP_ARTICLES.map((a) => ({
      url: `${base}/help/${a.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];

  return [...staticEntries, ...postEntries, ...knowledgeEntries, ...helpEntries];
}
