import type { HelpArticle, HelpAudience } from "@/lib/help/articles";

/** Row shape of `help_articles` (admin overrides / additions). */
export interface HelpOverrideRow {
  slug: string;
  title: string;
  category: string;
  summary: string;
  body: string;
  keywords: string[];
  audience: string;
  related: string[];
  hidden: boolean;
}

export type ArticleSource = "standaard" | "aangepast" | "nieuw";
export interface ManagedArticle extends HelpArticle {
  source: ArticleSource;
  hidden: boolean;
}

function asAudience(a: string): HelpAudience {
  return a === "prospect" || a === "salon" ? a : "both";
}

/**
 * Code articles are the defaults; a DB row with the same slug overrides (or hides)
 * one, a row with a new slug is an extra article. Pure — unit-tested.
 */
export function mergeArticles(defaults: HelpArticle[], rows: HelpOverrideRow[]): ManagedArticle[] {
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const out: ManagedArticle[] = defaults.map((d) => {
    const r = bySlug.get(d.slug);
    if (!r) return { ...d, source: "standaard", hidden: false };
    return {
      slug: d.slug,
      title: r.title,
      category: r.category,
      summary: r.summary,
      body: r.body,
      keywords: r.keywords,
      audience: asAudience(r.audience),
      related: r.related,
      source: "aangepast",
      hidden: r.hidden,
    };
  });
  const known = new Set(defaults.map((d) => d.slug));
  for (const r of rows) {
    if (known.has(r.slug)) continue;
    out.push({
      slug: r.slug,
      title: r.title,
      category: r.category,
      summary: r.summary,
      body: r.body,
      keywords: r.keywords,
      audience: asAudience(r.audience),
      related: r.related,
      source: "nieuw",
      hidden: r.hidden,
    });
  }
  return out;
}

export function publishedOnly(all: ManagedArticle[]): HelpArticle[] {
  return all.filter((a) => !a.hidden);
}

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
