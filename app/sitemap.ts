import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";
import { listPublishedSlugs } from "@/lib/blog/queries";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.NEXT_PUBLIC_SITE_URL;
  const routes = ["", "/diensten", "/prijzen", "/over-ons", "/contact", "/scan", "/blog"];
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = routes.map((r) => ({
    url: `${base}${r}`,
    lastModified: now,
    changeFrequency: r === "/blog" ? "daily" : "weekly",
    priority: r === "" ? 1 : 0.7,
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

  return [...staticEntries, ...postEntries];
}
