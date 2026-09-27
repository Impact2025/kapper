import { listLiveVerticals } from "@/lib/verticals";

export interface SisterSite {
  name: string;
  url: string;
}

/**
 * The other live Assistent sites, for a discreet "ook van WeAreImpact" line in
 * the footer. Only live verticals: a site that is not online yet is never linked,
 * and one that goes live appears everywhere automatically.
 */
export function sisterSites(currentId: string): SisterSite[] {
  return listLiveVerticals()
    .filter((v) => v.id !== currentId)
    .map((v) => ({ name: v.brand.name, url: v.brand.siteUrl }));
}
