import { env } from "@/lib/env";

/**
 * IndexNow — covers Bing/Yandex/Seznam/Naver (Google ignores it). Free, no
 * Google credentials needed: just a keyfile served at
 * `<host>/<INDEXNOW_KEY>.txt` (see app/[slug]/route.ts), same shape as
 * AgentOS's `publish/indexing.py::submit_indexnow`.
 *
 * Fails soft — never throws — so a rejected or unreachable submit can never
 * block publishing an article.
 */
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

export async function submitIndexNow(urls: string[]): Promise<boolean> {
  const key = env.INDEXNOW_KEY;
  const absolute = urls.filter((u) => u.startsWith("http"));
  if (!key || !absolute.length) return false;

  const host = new URL(absolute[0]).host;
  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ host, key, keyLocation: `https://${host}/${key}.txt`, urlList: absolute.slice(0, 100) }),
    });
    // 200 = processed, 202 = accepted; anything else is a rejection.
    if (res.status !== 200 && res.status !== 202) {
      console.error("[indexnow] rejected", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[indexnow] error", err);
    return false;
  }
}
