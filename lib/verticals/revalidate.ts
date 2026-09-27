import { revalidatePath } from "next/cache";
import { DEFAULT_VERTICAL_ID } from "@/lib/verticals";
import { siteUrlFor } from "@/lib/verticals/site-url";
import { notifyIndexing } from "@/lib/google/indexing";

/**
 * Cache invalidation for a marketing article. The kapper site serves from the
 * root routes; every other vertical is rewritten (proxy.ts) to /sites/<id>/…,
 * so its pages live under that prefix. Sitemap included — a new article
 * should be discoverable at once.
 *
 * Also asks Google to recrawl the article (see lib/google/indexing.ts) —
 * fire-and-forget, never awaited, so a slow or unconfigured Google API can
 * never delay the publish response.
 */
export function revalidateContent(vertical: string, kind: "blog" | "kennisbank", slug?: string) {
  const base = vertical === DEFAULT_VERTICAL_ID ? "" : `/sites/${vertical}`;
  revalidatePath(`${base}/${kind}`);
  if (slug) revalidatePath(`${base}/${kind}/${slug}`);
  revalidatePath(vertical === DEFAULT_VERTICAL_ID ? "/sitemap.xml" : `/sites/${vertical}/sitemap.xml`);

  if (slug) void notifyIndexing(`${siteUrlFor(vertical)}/${kind}/${slug}`);
}
