import { KAPPER_VERTICAL } from "./kapper";
import { HOVENIER_VERTICAL } from "./hovenier";
import { LOODGIETER_VERTICAL } from "./loodgieter";
import { SCHILDER_VERTICAL } from "./schilder";
import type { VerticalPack } from "./types";

export * from "./types";
export { HOVENIER_VERTICAL, KAPPER_VERTICAL, LOODGIETER_VERTICAL, SCHILDER_VERTICAL };
export { NAV_CATALOG, resolveNav, type ResolvedNavItem } from "./nav";

export const DEFAULT_VERTICAL_ID = KAPPER_VERTICAL.id;

const VERTICAL_REGISTRY: Record<string, VerticalPack> = {
  [KAPPER_VERTICAL.id]: KAPPER_VERTICAL,
  [LOODGIETER_VERTICAL.id]: LOODGIETER_VERTICAL,
  [SCHILDER_VERTICAL.id]: SCHILDER_VERTICAL,
  [HOVENIER_VERTICAL.id]: HOVENIER_VERTICAL,
};

export function listVerticals(): VerticalPack[] {
  return Object.values(VERTICAL_REGISTRY);
}

/** Verticals with a public site + signup. */
export function listLiveVerticals(): VerticalPack[] {
  return listVerticals().filter((v) => v.live);
}

export function isVerticalId(id: string | null | undefined): id is string {
  return !!id && id in VERTICAL_REGISTRY;
}

/** Falls back to the kapper vertical for an unknown/missing id — every
 * salon row defaults `vertical` to "kapper" at the schema level too, so this
 * is a belt-and-suspenders default, not the primary source of truth. */
export function getVerticalConfig(vertical: string | null | undefined): VerticalPack {
  return VERTICAL_REGISTRY[vertical ?? ""] ?? KAPPER_VERTICAL;
}

/** Alias with a friendlier name for new code. */
export const getVertical = getVerticalConfig;

/**
 * Which vertical serves this hostname (`Host` header, port optional). Only
 * *live* packs claim hosts. Unknown hosts (localhost, *.vercel.app previews)
 * resolve to the default vertical.
 */
export function verticalForHost(host: string | null | undefined): VerticalPack {
  return claimedVerticalForHost(host) ?? KAPPER_VERTICAL;
}

/** The live vertical that explicitly claims this host, or null for unknown
 * hosts (localhost, previews) — unlike verticalForHost there is no default. */
export function claimedVerticalForHost(host: string | null | undefined): VerticalPack | null {
  const h = (host ?? "").split(":")[0]!.trim().toLowerCase();
  if (!h) return null;
  for (const v of Object.values(VERTICAL_REGISTRY)) {
    if (v.live && v.brand.hosts.includes(h)) return v;
  }
  return null;
}

/**
 * Which vertical's branding the login screens show. A live vertical's own
 * domain always wins; on an unclaimed host (localhost, previews — and the
 * not-yet-live packs such as hovenier/schilder) an explicit `?vertical=` picks
 * the pack, so every assistent can be logged into and tested before its domain
 * is wired up. Cosmetic only: the dashboard themes on the salon's own vertical.
 */
export function verticalForLogin(host: string | null | undefined, requested: string | null | undefined): VerticalPack {
  const claimed = claimedVerticalForHost(host);
  if (claimed) return claimed;
  return isVerticalId(requested) ? VERTICAL_REGISTRY[requested]! : KAPPER_VERTICAL;
}

/** True when the host doesn't belong to a live vertical, so a vertical picker
 * (dev/preview) makes sense. Never on a production trade domain. */
export function isUnclaimedHost(host: string | null | undefined): boolean {
  return claimedVerticalForHost(host) === null;
}

/**
 * Keeps every customer inside their own environment: a salon of vertical X
 * that reaches the app on the domain of vertical Y (a plumber on
 * kappersassistent.nl) must not see a dashboard there. Returns the vertical
 * whose domain the user belongs on, or null when the host is fine (matching
 * host, or an unclaimed host such as localhost / a preview deploy).
 */
export function hostMismatch(host: string | null | undefined, salonVertical: string | null | undefined): VerticalPack | null {
  const claimed = claimedVerticalForHost(host);
  const own = getVerticalConfig(salonVertical);
  return claimed && claimed.id !== own.id ? own : null;
}

/** True if a job-archetype vertical (klus-CRM surface). */
export function isJobVertical(v: VerticalPack): boolean {
  return v.archetype === "job";
}
