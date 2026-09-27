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

/** The words for an asset per adres in this vak: installatie / tuinonderdeel. */
export function assetTerms(pack: VerticalPack): { singular: string; plural: string; passport: string } {
  return pack.terms.asset ?? { singular: "installatie", plural: "installaties", passport: "installatiepaspoort" };
}

import { LINE_UNITS } from "@/lib/jobs/model";

/** Units offered in the offerte editor for this vak. */
export function lineUnitsFor(pack: VerticalPack): string[] {
  return pack.lineUnits?.length ? pack.lineUnits : [...LINE_UNITS];
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
