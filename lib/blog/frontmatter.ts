/**
 * Minimal parser for the article files in content/ (YAML-ish frontmatter with
 * scalar strings and one inline string array). Dependency-free and pure.
 */
export interface ParsedArticle {
  title: string;
  slug: string;
  category: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  /** YYYY-MM-DD, from the `date` field. */
  date: string;
  body: string;
}

function unquote(v: string): string {
  const t = v.trim();
  return t.startsWith('"') && t.endsWith('"') ? t.slice(1, -1).replace(/\\"/g, '"') : t;
}

export function parseArticle(raw: string): ParsedArticle {
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw.replace(/\r\n/g, "\n"));
  if (!m) throw new Error("article has no frontmatter");
  const fields: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) fields[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  const keywords = /^\[(.*)\]$/.exec(fields.keywords ?? "")?.[1]
    .split(/",\s*"/)
    .map((k) => k.replace(/^\s*"|"\s*$/g, ""))
    .filter(Boolean) ?? [];
  return {
    title: unquote(fields.title ?? ""),
    slug: unquote(fields.slug ?? ""),
    category: unquote(fields.category ?? ""),
    metaTitle: unquote(fields.meta_title ?? ""),
    metaDescription: unquote(fields.meta_description ?? ""),
    keywords,
    date: unquote(fields.date ?? ""),
    body: m[2].trim(),
  };
}
