import { revalidatePath } from "next/cache";
import { DEFAULT_VERTICAL_ID } from "@/lib/verticals";
import { siteUrlFor } from "@/lib/verticals/site-url";
import { submitSitemap } from "@/lib/google/search-console";
import { submitIndexNow } from "@/lib/google/indexnow";
import { notifyIndexing } from "@/lib/google/indexing";

/**
 * Cache invalidation for a marketing article. The kapper site serves from the
 * root routes; every other vertical is rewritten (proxy.ts) to /sites/<id>/…,
 * so its pages live under that prefix. Sitemap included — a new article
 * should be discoverable at once.
 *
 * Also pushes the update to search engines, same three routes as AgentOS
 * (backend/domains/publish/indexing.py):
 *   1. GSC sitemap-submit — the sanctioned main route.
 *   2. IndexNow — Bing/Yandex/Seznam/Naver, off unless INDEXNOW_KEY is set.
 *   3. Google Indexing API — opt-in only (GOOGLE_INDEXING_ENABLED), since
 *      Google scopes it to JobPosting/Livestream content, not articles.
 * All fire-and-forget, never awaited: a slow or unconfigured Google/IndexNow
 * call can never delay the publish response, and each fails soft on its own.
 */
export function revalidateContent(vertical: string, kind: "blog" | "kennisbank", slug?: string) {
  const base = vertical === DEFAULT_VERTICAL_ID ? "" : `/sites/${vertical}`;
  revalidatePath(`${base}/${kind}`);
  if (slug) revalidatePath(`${base}/${kind}/${slug}`);
  revalidatePath(vertical === DEFAULT_VERTICAL_ID ? "/sitemap.xml" : `/sites/${vertical}/sitemap.xml`);

  const site = siteUrlFor(vertical);
  void submitSitemap(`${site}/`, `${site}/sitemap.xml`);
  if (slug) {
    const articleUrl = `${site}/${kind}/${slug}`;
    void submitIndexNow([articleUrl]);
    void notifyIndexing(articleUrl);
  }
}
