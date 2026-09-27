import { getGoogleAccessToken } from "@/lib/google/service-account";

/**
 * Google Search Console — sitemap-submit. This is the sanctioned "tell
 * Google we published something" route for ordinary articles (unlike the
 * Indexing API, see lib/google/indexing.ts), same as AgentOS's
 * `seo/gsc.py::submit_sitemap`.
 *
 * `siteUrl` must be the exact property identifier as verified in Search
 * Console: a URL-prefix property (e.g. "https://www.hovenierassistent.nl/",
 * trailing slash required) or a domain property ("sc-domain:hovenierassistent.nl").
 * Fails soft — never throws — so a Google outage or missing credentials can
 * never block publishing an article.
 */
export async function submitSitemap(siteUrl: string, sitemapUrl: string): Promise<boolean> {
  try {
    const token = await getGoogleAccessToken("https://www.googleapis.com/auth/webmasters");
    if (!token) return false;
    const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
    const res = await fetch(url, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) console.error("[gsc] sitemap submit failed", siteUrl, res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error("[gsc] sitemap submit error", err);
    return false;
  }
}
