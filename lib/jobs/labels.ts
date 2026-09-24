import type { VerticalPack } from "@/lib/verticals";

/** key → human label for a pack's klus categories (falls back to the key). */
export function categoryLabeler(pack: VerticalPack): (key: string) => string {
  const map = new Map(pack.jobCategories.map((c) => [c.key, c.label]));
  return (key) => map.get(key) ?? key;
}

/** key → human label for a pack's installatie-types. */
export function assetKindLabeler(pack: VerticalPack): (key: string) => string {
  const map = new Map(pack.assetKinds.map((a) => [a.key, a.label]));
  return (key) => map.get(key) ?? key;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
