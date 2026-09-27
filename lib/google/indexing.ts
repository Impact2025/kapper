import { env } from "@/lib/env";
import { getGoogleAccessToken } from "@/lib/google/service-account";

/**
 * Google Indexing API (urlNotifications.publish) — officially scoped by
 * Google to JobPosting/Livestream content, not ordinary blog articles. Off
 * by default; use at your own risk. Same caution as AgentOS
 * (backend/domains/publish/indexing.py) — sitemap-submit (lib/google/search-console.ts)
 * plus IndexNow (lib/google/indexnow.ts) are the sanctioned routes and stay
 * on regardless of this flag.
 *
 * Set GOOGLE_INDEXING_ENABLED=true to opt in. Also requires the service
 * account (GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL/PRIVATE_KEY) to be an Owner
 * of the property in Search Console.
 */
const PUBLISH_URL = "https://indexing.googleapis.com/v3/urlNotifications:publish";

export async function notifyIndexing(url: string, type: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED"): Promise<boolean> {
  if (!env.GOOGLE_INDEXING_ENABLED) return false;
  try {
    const token = await getGoogleAccessToken("https://www.googleapis.com/auth/indexing");
    if (!token) return false;
    const res = await fetch(PUBLISH_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, type }),
    });
    // Typically fails with 403 (service account isn't an Owner) or the API
    // not being enabled — expected until GOOGLE_INDEXING_ENABLED is deliberately turned on.
    if (!res.ok) console.error("[google-indexing] publish failed", res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error("[google-indexing] error", err);
    return false;
  }
}
