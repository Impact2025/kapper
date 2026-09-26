import type { VerticalPack } from "@/lib/verticals";
import { LINE_UNITS } from "@/lib/jobs/model";

const DEFAULT_ASSET_TERMS = { singular: "installatie", plural: "installaties", passport: "installatiepaspoort" };

/** Units an offerte-/factuurregel may use for this pack; omitted = the
 * platform default (LINE_UNITS in lib/jobs/model.ts). */
export function lineUnitsFor(pack: VerticalPack): readonly string[] {
  return pack.lineUnits ?? LINE_UNITS;
}

/** Vocabulary for the installatiepaspoort; omitted = the default wording. */
export function assetTerms(pack: VerticalPack): { singular: string; plural: string; passport: string } {
  return pack.terms.asset ?? DEFAULT_ASSET_TERMS;
}

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
