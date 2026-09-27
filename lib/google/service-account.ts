import { createSign } from "node:crypto";
import { env } from "@/lib/env";

/**
 * Shared Google service-account OAuth (RFC 7523 JWT-bearer exchange), hand
 * rolled instead of pulling in `googleapis`/`google-auth-library` — GSC
 * sitemap-submit and the (opt-in) Indexing API are the only Google API calls
 * in this codebase, so ~50 lines beats a new dependency.
 *
 * One service account, requested with a different `scope` per caller
 * (lib/google/search-console.ts, lib/google/indexing.ts) — same credentials
 * as AgentOS uses for its GSC integration (backend/domains/seo/gsc.py),
 * just via GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL/PRIVATE_KEY here instead of a
 * mounted JSON key file.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";

const b64url = (input: Buffer | string) =>
  (Buffer.isBuffer(input) ? input : Buffer.from(input)).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const tokenCache = new Map<string, { token: string; expiresAt: number }>();

export function isServiceAccountConfigured() {
  return Boolean(env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL && env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY);
}

export async function getGoogleAccessToken(scope: string): Promise<string | null> {
  if (!isServiceAccountConfigured()) return null;
  const cached = tokenCache.get(scope);
  if (cached && cached.expiresAt > Date.now() + 30_000) return cached.token;

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
      scope,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );
  const signingInput = `${header}.${claim}`;
  const signature = b64url(createSign("RSA-SHA256").update(signingInput).sign(env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(/\\n/g, "\n")));
  const jwt = `${signingInput}.${signature}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  if (!res.ok) {
    console.error("[google] token exchange failed", scope, res.status, await res.text());
    return null;
  }
  const { access_token, expires_in } = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache.set(scope, { token: access_token, expiresAt: Date.now() + expires_in * 1000 });
  return access_token;
}
