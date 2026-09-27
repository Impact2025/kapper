/**
 * Article-body helpers: stable heading ids + table of contents, and related
 * article ranking. Pure so they can be unit tested.
 */

export interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

const stripTags = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").trim();

export function slugifyHeading(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "sectie"
  );
}

/**
 * Adds an `id` to every h2/h3 that has none and returns the table of contents.
 * Works on already-rendered HTML (markdown bodies are rendered first).
 */
export function withHeadingIds(html: string): { html: string; toc: TocEntry[] } {
  const toc: TocEntry[] = [];
  const used = new Set<string>();
  const out = html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (_m, lvl: string, attrs: string, inner: string) => {
    const text = stripTags(inner);
    const existing = /\sid=["']([^"']+)["']/i.exec(attrs)?.[1];
    let id = existing ?? slugifyHeading(text);
    if (!existing) {
      let n = 2;
      const base = id;
      while (used.has(id)) id = `${base}-${n++}`;
    }
    used.add(id);
    toc.push({ id, text, level: Number(lvl) as 2 | 3 });
    return existing ? `<h${lvl}${attrs}>${inner}</h${lvl}>` : `<h${lvl}${attrs} id="${id}">${inner}</h${lvl}>`;
  });
  return { html: out, toc };
}

export interface RelatedCandidate {
  slug: string;
  category?: string | null;
  keywords: string[];
  publishedAt: Date | null;
}

/** Ranks other articles by shared category (strong) and shared keywords, newest first on ties. */
export function rankRelated<T extends RelatedCandidate>(current: RelatedCandidate, all: T[], limit = 3): T[] {
  const kw = new Set(current.keywords.map((k) => k.toLowerCase()));
  return all
    .filter((p) => p.slug !== current.slug)
    .map((p) => {
      const shared = p.keywords.filter((k) => kw.has(k.toLowerCase())).length;
      const sameCategory = current.category && p.category === current.category ? 3 : 0;
      return { p, score: sameCategory + shared };
    })
    .sort((a, b) => b.score - a.score || (b.p.publishedAt?.getTime() ?? 0) - (a.p.publishedAt?.getTime() ?? 0))
    .slice(0, limit)
    .map((x) => x.p);
}
