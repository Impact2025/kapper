import type { JobField, VerticalPack } from "@/lib/verticals";
import type { LineKind } from "@/lib/jobs/model";

/**
 * Vak-specific offerte-/factuurregelvelden (VerticalPack.quoteLineFields):
 * B×H, profiel en glas op een kozijnregel — de positielijst. Same shape and
 * sanitising as lib/jobs/fields.ts, but filtered by regel-soort (LineKind)
 * instead of klus-categorie, and stored in job_document_lines.details.
 */
export function lineFieldsForKind(pack: Pick<VerticalPack, "quoteLineFields">, kind: LineKind): JobField[] {
  return (pack.quoteLineFields ?? []).filter((f) => !f.categories || f.categories.includes(kind));
}

/** Form-field name for a regelveld, namespaced per regel-index so every line
 * keeps its own inputs on the page. */
export const lineFieldInputName = (lineIndex: number, key: string) => `line${lineIndex}_${key}`;

/**
 * Turns submitted values into the stored regel-details object: only keys the
 * pack defines for this regel-soort, trimmed, numbers validated, selects
 * restricted to their options; empty values are dropped.
 */
export function sanitizeLineDetails(
  pack: Pick<VerticalPack, "quoteLineFields">,
  kind: LineKind,
  read: (key: string) => string | null | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of lineFieldsForKind(pack, kind)) {
    const raw = (read(f.key) ?? "").trim();
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

/** Label/value pairs for display (editor, printed sheet), in pack order. */
export function lineDetailRows(
  pack: Pick<VerticalPack, "quoteLineFields">,
  kind: LineKind,
  details: Record<string, string> | null | undefined,
): { label: string; value: string }[] {
  return lineFieldsForKind(pack, kind)
    .filter((f) => details?.[f.key])
    .map((f) => ({ label: f.label, value: `${details![f.key]}${f.unit ? ` ${f.unit}` : ""}` }));
}

/** Compact "B×H 1200 × 2150 mm · Kunststof · HR++"-style summary for under a
 * regel's omschrijving; empty string when the pack has no regelvelden here. */
export function lineDetailSummary(
  pack: Pick<VerticalPack, "quoteLineFields">,
  kind: LineKind,
  details: Record<string, string> | null | undefined,
): string {
  return lineDetailRows(pack, kind, details)
    .map((r) => r.value)
    .join(" · ");
}
