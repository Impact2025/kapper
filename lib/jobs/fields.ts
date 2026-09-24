import type { JobField, VerticalPack } from "@/lib/verticals";

/**
 * Vak-specific klus fields (VerticalPack.jobFields). Pure, so the
 * sanitising that guards jobs.details is unit tested.
 */
export function fieldsForCategory(pack: Pick<VerticalPack, "jobFields">, category: string): JobField[] {
  return pack.jobFields.filter((f) => !f.categories || f.categories.includes(category));
}

/** Form-field name for a klus field. */
export const fieldInputName = (key: string) => `f_${key}`;

/**
 * Turns submitted values into the stored details object: only keys the pack
 * defines for this category, trimmed, numbers validated, selects restricted to
 * their options; empty values are dropped.
 */
export function sanitizeDetails(
  pack: Pick<VerticalPack, "jobFields">,
  category: string,
  read: (inputName: string) => string | null | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of fieldsForCategory(pack, category)) {
    const raw = (read(fieldInputName(f.key)) ?? "").trim();
    if (!raw) continue;
    if (f.type === "number") {
      const n = Number(raw.replace(",", "."));
      if (!Number.isFinite(n) || n < 0 || n > 1_000_000) continue;
      out[f.key] = String(n);
    } else if (f.type === "select") {
      if (f.options?.includes(raw)) out[f.key] = raw;
    } else {
      out[f.key] = raw.slice(0, 200);
    }
  }
  return out;
}

/** Label/value pairs for display (detail page, werkbon), in pack order. */
export function detailRows(
  pack: Pick<VerticalPack, "jobFields">,
  category: string,
  details: Record<string, string> | null | undefined,
): { label: string; value: string }[] {
  return fieldsForCategory(pack, category)
    .filter((f) => details?.[f.key])
    .map((f) => ({ label: f.label, value: `${details![f.key]}${f.unit ? ` ${f.unit}` : ""}` }));
}

/** True when the klus is marked as a woning older than 2 years — the
 * precondition for the verlaagd btw-tarief on arbeid. */
export function eligibleForReducedVatHint(details: Record<string, string> | null | undefined): boolean {
  return details?.woningOuderDan2Jaar === "Ja";
}
