import { createSign } from "node:crypto";
import { env } from "@/lib/env";

/**
 * Google Indexing API client. Auth is a hand-rolled service-account JWT
 * exchange (RFC 7523) instead of `googleapis`/`google-auth-library` — this is
 * the only Google API call in the codebase, so a ~40-line file beats a new
 * dependency for one OAuth flow.
 *
 * Setup (done once in Google Cloud + Search Console, not in code):
 *   1. Create a GCP project, enable the "Web Search Indexing API".
 *   2. Create a service account, download its JSON key.
 *   3. In Search Console (search.google.com/search-console), add the service
 *      account's client_email as an Owner of each verified property
 *      (hovenierassistent.nl etc.) under Settings → Users and permissions.
 *   4. Set GOOGLE_INDEXING_CLIENT_EMAIL (the JSON's client_email) and
 *      GOOGLE_INDEXING_PRIVATE_KEY (the JSON's private_key, with real
 *      newlines — Vercel's env UI accepts multiline values directly).
 *
 * Both unset: `notifyIndexing` is a no-op, so publishing keeps working
 * exactly as before this file existed.
 */

const SCOPE = "https://www.googleapis.com/auth/indexing";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const PUBLISH_URL = "https://indexing.googleapis.com/v3/urlNotifications:publish";

const b64url = (input: Buffer | string) =>
  (Buffer.isBuffer(input) ? input : Buffer.from(input)).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

let cachedToken: { token: string; expiresAt: number } | null = null;

function isConfigured() {
  return Boolean(env.GOOGLE_INDEXING_CLIENT_EMAIL && env.GOOGLE_INDEXING_PRIVATE_KEY);
}

async function getAccessToken(): Promise<string | null> {
  if (!isConfigured()) return null;
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.token;

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: env.GOOGLE_INDEXING_CLIENT_EMAIL,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );
  const signingInput = `${header}.${claim}`;
  const signature = b64url(createSign("RSA-SHA256").update(signingInput).sign(env.GOOGLE_INDEXING_PRIVATE_KEY!.replace(/\\n/g, "\n")));
  const jwt = `${signingInput}.${signature}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  if (!res.ok) {
    console.error("[google-indexing] token exchange failed", res.status, await res.text());
    return null;
  }
  const { access_token, expires_in } = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: access_token, expiresAt: Date.now() + expires_in * 1000 };
  return access_token;
}

/**
 * Tells Google to (re)crawl a URL. Fire-and-forget from a publish route:
 * never throws, logs and returns false on any failure so a Google outage or
 * missing credentials can never block publishing an article.
 */
export async function notifyIndexing(url: string, type: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED"): Promise<boolean> {
  try {
    const token = await getAccessToken();
    if (!token) return false;
    const res = await fetch(PUBLISH_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, type }),
    });
    if (!res.ok) console.error("[google-indexing] publish failed", res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error("[google-indexing] error", err);
    return false;
  }
}
