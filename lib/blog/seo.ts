import { stripMarkdown } from "@/lib/blog/markdown";

export interface SeoInput {
  title: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  bodyMdx: string;
  keywords?: string[];
  slug: string;
}

export interface SeoCheck {
  label: string;
  ok: boolean;
  weight: number;
}

/**
 * Compute a 0-100 SEO score from on-page signals. Deterministic and pure so it
 * can be unit-tested and recomputed on every save.
 */
export function computeSeo(input: SeoInput): { score: number; checks: SeoCheck[] } {
  const plain = stripMarkdown(input.bodyMdx);
  const wordCount = plain.split(/\s+/).filter(Boolean).length;
  const metaTitle = input.metaTitle ?? input.title;
  const metaDesc = input.metaDescription ?? "";
  const headingCount = (input.bodyMdx.match(/^#{2,3}\s+/gm) ?? []).length;
  const firstKeyword = input.keywords?.[0]?.toLowerCase();
  const bodyLower = plain.toLowerCase();

  const checks: SeoCheck[] = [
    { label: "Meta-titel 30–60 tekens", ok: metaTitle.length >= 30 && metaTitle.length <= 60, weight: 15 },
    { label: "Meta-omschrijving 70–160 tekens", ok: metaDesc.length >= 70 && metaDesc.length <= 160, weight: 15 },
    { label: "Minimaal 600 woorden", ok: wordCount >= 600, weight: 20 },
    { label: "Minimaal 2 tussenkoppen", ok: headingCount >= 2, weight: 15 },
    { label: "Minimaal 3 keywords", ok: (input.keywords?.length ?? 0) >= 3, weight: 10 },
    {
      label: "Hoofdkeyword in tekst",
      ok: !!firstKeyword && bodyLower.includes(firstKeyword),
      weight: 15,
    },
    { label: "Slug bevat koppelteken", ok: input.slug.includes("-"), weight: 10 },
  ];

  const score = checks.reduce((sum, c) => sum + (c.ok ? c.weight : 0), 0);
  return { score, checks };
}
