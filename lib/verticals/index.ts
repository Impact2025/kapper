import { KAPPER_VERTICAL } from "./kapper";
import { LOODGIETER_VERTICAL } from "./loodgieter";
import { SCHILDER_VERTICAL } from "./schilder";
import type { VerticalPack } from "./types";

export * from "./types";
export { KAPPER_VERTICAL, LOODGIETER_VERTICAL, SCHILDER_VERTICAL };
export { NAV_CATALOG, resolveNav, type ResolvedNavItem } from "./nav";

export const DEFAULT_VERTICAL_ID = KAPPER_VERTICAL.id;

const VERTICAL_REGISTRY: Record<string, VerticalPack> = {
  [KAPPER_VERTICAL.id]: KAPPER_VERTICAL,
  [LOODGIETER_VERTICAL.id]: LOODGIETER_VERTICAL,
  [SCHILDER_VERTICAL.id]: SCHILDER_VERTICAL,
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
  const h = (host ?? "").split(":")[0]!.trim().toLowerCase();
  if (h) {
    for (const v of Object.values(VERTICAL_REGISTRY)) {
      if (v.live && v.brand.hosts.includes(h)) return v;
    }
  }
  return KAPPER_VERTICAL;
}

/** True if a job-archetype vertical (klus-CRM surface). */
export function isJobVertical(v: VerticalPack): boolean {
  return v.archetype === "job";
}
