import { revalidatePath } from "next/cache";
import { DEFAULT_VERTICAL_ID } from "@/lib/verticals";

/**
 * Cache invalidation for a marketing article. The kapper site serves from the
 * root routes; every other vertical is rewritten (proxy.ts) to /sites/<id>/…,
 * so its pages live under that prefix. Sitemap included — a new article
 * should be discoverable at once.
 */
export function revalidateContent(vertical: string, kind: "blog" | "kennisbank", slug?: string) {
  const base = vertical === DEFAULT_VERTICAL_ID ? "" : `/sites/${vertical}`;
  revalidatePath(`${base}/${kind}`);
  if (slug) revalidatePath(`${base}/${kind}/${slug}`);
  revalidatePath(vertical === DEFAULT_VERTICAL_ID ? "/sitemap.xml" : `/sites/${vertical}/sitemap.xml`);
}
