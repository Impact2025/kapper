import { DEFAULT_VERTICAL_ID, type VerticalPack } from "./index";

/**
 * Host-based multi-site routing — pure so it is unit tested, used by
 * proxy.ts. On a non-default vertical's own hostname (loodgietersassistent.nl)
 * the public marketing paths are rewritten to /sites/<vertical>/…; the app
 * itself (dashboard, login, admin, api, quotes/invoices) is one shared
 * deployment and passes through untouched.
 */

/** Marketing paths (and their sub-paths) that exist per vertical. */
const SITE_PREFIXES = [
  "/prijzen",
  "/blog",
  "/kennisbank",
  "/contact",
  "/help",
  "/faq",
  "/status",
  "/support",
  "/privacy",
  "/voorwaarden",
  "/checkout",
];

/** Kapper-only marketing pages: on a trade's domain they must 404 rather
 * than show the kapper site under the wrong brand. */
const KAPPER_ONLY_PREFIXES = ["/diensten", "/over-ons", "/scan"];

const matches = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

export type RewriteResult = { pathname: string } | null;

/** Returns the rewritten pathname for a request on `pack`'s host, or null to
 * pass the request through unchanged. */
export function verticalRewrite(pathname: string, pack: VerticalPack): RewriteResult {
  if (pack.id === DEFAULT_VERTICAL_ID) return null;
  const base = `/sites/${pack.id}`;

  if (pathname === "/") return { pathname: base };
  if (["/sitemap.xml", "/robots.txt", "/opengraph-image", "/twitter-image"].includes(pathname)) {
    return { pathname: `${base}${pathname}` };
  }
  if (KAPPER_ONLY_PREFIXES.some((p) => matches(pathname, p))) return { pathname: `${base}/__not-found` };
  if (SITE_PREFIXES.some((p) => matches(pathname, p))) return { pathname: `${base}${pathname}` };
  return null;
}
