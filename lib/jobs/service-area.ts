/**
 * Werkgebied van een vakman — stored in salons.settings.serviceArea as a list
 * of postcode-prefixes ("52" = alles 52xx, "5038" = één postcodegebied). Pure
 * helpers so the matching is unit tested. Geen gebied ingesteld = alles binnen.
 */
export interface ServiceArea {
  prefixes: string[];
}

const PREFIX_RE = /^\d{2,4}$/;

export function parseServiceArea(settings: Record<string, unknown> | null | undefined): ServiceArea {
  const raw = (settings?.serviceArea ?? {}) as { prefixes?: unknown };
  const list = Array.isArray(raw.prefixes) ? raw.prefixes : [];
  return { prefixes: list.filter((p): p is string => typeof p === "string" && PREFIX_RE.test(p)) };
}

/** "52, 5038 5211" → ["52", "5038", "5211"]. Ongeldige stukken worden apart teruggegeven. */
export function parsePrefixInput(input: string): { prefixes: string[]; invalid: string[] } {
  const parts = input
    .split(/[\s,;]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const prefixes: string[] = [];
  const invalid: string[] = [];
  for (const p of parts) {
    if (PREFIX_RE.test(p)) {
      if (!prefixes.includes(p)) prefixes.push(p);
    } else {
      invalid.push(p);
    }
  }
  return { prefixes, invalid };
}

/**
 * true/false wanneer er een gebied is ingesteld en de postcode leesbaar is;
 * null wanneer we het niet kunnen beoordelen (geen gebied of geen postcode) —
 * de aanroeper behandelt null als "binnen".
 */
export function isInServiceArea(area: ServiceArea, postalCode: string | null | undefined): boolean | null {
  if (area.prefixes.length === 0 || !postalCode) return null;
  const digits = postalCode.replace(/\s+/g, "").slice(0, 4);
  if (!/^\d{4}$/.test(digits)) return null;
  return area.prefixes.some((p) => digits.startsWith(p));
}
