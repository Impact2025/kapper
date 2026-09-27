/**
 * Pure outreach-mail helpers: placeholder substitution and recipient
 * eligibility. No DB or env — unit tested in tests/crm-outreach.test.ts.
 */

export interface OutreachVars {
  /** Bedrijfsnaam van de lead (leads.salon_name). */
  naam: string;
  plaats: string | null;
  /** Merknaam van de vertical, bv. "HovenierAssistent". */
  merk: string;
  /** Publieke site van de vertical. */
  site: string;
}

export const OUTREACH_PLACEHOLDERS = ["naam", "plaats", "merk", "site"] as const;

/**
 * Vervangt {{naam}}, {{plaats}}, {{merk}} en {{site}} (spaties binnen de
 * accolades mogen). Een lege plaats wordt "je regio" zodat zinnen als
 * "ondernemers in {{plaats}}" blijven lopen. Onbekende placeholders blijven
 * staan, zodat een typfout zichtbaar is in de preview.
 */
export function fillPlaceholders(template: string, vars: OutreachVars): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => {
    switch (key) {
      case "naam":
        return vars.naam;
      case "plaats":
        return vars.plaats?.trim() || "je regio";
      case "merk":
        return vars.merk;
      case "site":
        return vars.site;
      default:
        return match;
    }
  });
}

/** Returns the unknown placeholder names in a template (for form validation). */
export function unknownPlaceholders(template: string): string[] {
  const known = new Set<string>(OUTREACH_PLACEHOLDERS);
  const found = new Set<string>();
  for (const m of template.matchAll(/\{\{\s*(\w+)\s*\}\}/g)) {
    if (!known.has(m[1]!)) found.add(m[1]!);
  }
  return [...found];
}

export interface OutreachCandidate {
  email: string | null;
  stage: string;
  optedOutAt: Date | null;
  /** Aantal eerder verstuurde (outbound) mails naar deze lead. */
  emailsSent: number;
}

export type SkipReason = "geen_email" | "afgemeld" | "klant_of_verloren" | "al_gemaild";

export const SKIP_REASON_LABELS: Record<SkipReason, string> = {
  geen_email: "geen e-mailadres",
  afgemeld: "afgemeld",
  klant_of_verloren: "al klant of verloren",
  al_gemaild: "al eerder gemaild",
};

/**
 * Why a lead must not get this outreach mail, or null when it may. Opt-outs
 * and customers/lost leads are never mailed; "al gemaild" only blocks when
 * the admin asked to skip previously contacted leads.
 */
export function skipReason(
  c: OutreachCandidate,
  opts: { onlyNeverEmailed: boolean },
  suppressed: ReadonlySet<string> = new Set(),
): SkipReason | null {
  const email = c.email?.trim().toLowerCase();
  if (!email) return "geen_email";
  if (c.optedOutAt || suppressed.has(email)) return "afgemeld";
  if (c.stage === "customer" || c.stage === "lost") return "klant_of_verloren";
  if (opts.onlyNeverEmailed && c.emailsSent > 0) return "al_gemaild";
  return null;
}
