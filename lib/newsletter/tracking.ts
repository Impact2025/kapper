import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed click/open tracking tokens. The click redirect only follows a URL
 * whose HMAC matches, so /api/newsletter/c can't be abused as an open
 * redirect for phishing. Pure given the secret.
 */

function mac(secret: string, parts: string[]): string {
  return createHmac("sha256", secret).update(parts.join("\n")).digest("base64url").slice(0, 22);
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function clickUrl(base: string, secret: string, sendId: string, url: string): string {
  const q = new URLSearchParams({ s: sendId, u: url, k: mac(secret, ["click", sendId, url]) });
  return `${base.replace(/\/$/, "")}/api/newsletter/c?${q}`;
}

export function verifyClick(secret: string, sendId: string, url: string, sig: string): boolean {
  if (!sendId || !url || !sig || !/^https?:\/\//.test(url)) return false;
  return safeEqual(mac(secret, ["click", sendId, url]), sig);
}

export function openPixelUrl(base: string, secret: string, sendId: string): string {
  const q = new URLSearchParams({ s: sendId, k: mac(secret, ["open", sendId]) });
  return `${base.replace(/\/$/, "")}/api/newsletter/o?${q}`;
}

export function verifyOpen(secret: string, sendId: string, sig: string): boolean {
  if (!sendId || !sig) return false;
  return safeEqual(mac(secret, ["open", sendId]), sig);
}
