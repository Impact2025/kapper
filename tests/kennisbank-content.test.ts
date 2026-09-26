import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Lint voor de kant-en-klare kennisbank- en blogartikelen in content/*.
 * Deze markdown-bestanden zijn de brontekst voor de kennisbank en blog van
 * een vertical (los van de database-gedreven CMS in lib/kennisbank) en
 * worden door Vincent geschreven/onderhouden. Deze test bewaakt structuur
 * (frontmatter, minimale lengte, unieke slugs) en een paar compliance-regels
 * die specifiek zijn voor de kozijn-vertical: nooit een vaste prijs per
 * kozijn beloven, en nooit een feature claimen die nog niet gebouwd is
 * (zie de kwartaal-check in lib/verticals/kozijn.ts).
 */

const CONTENT_DIRS = [
  { dir: "content/kennisbank-kozijn", minFiles: 5 },
  { dir: "content/blog-kozijn", minFiles: 9 },
];

// Features die voor de kozijn-vertical gepland maar nog niet gebouwd zijn —
// zie lib/verticals/kozijn.ts. Content mag ze niet als bestaand aanprijzen.
const UNBUILT_FEATURE_PATTERNS = [/positielijst/i, /offertevariant/i, /termijnfactur/i];

// De kozijn-AI mag nooit een vaste prijs noemen (prijs hangt af van maat,
// profiel, glas en afwerking — zie agent.prompt.photoRule in kozijn.ts).
// Diezelfde discipline geldt voor geschreven content.
const FIXED_PRICE_PATTERNS = [/vanaf\s*€\s*\d/i, /€\s*\d+(?:[.,]\d+)?\s*per\s+kozijn/i];

const REQUIRED_FRONTMATTER_KEYS = ["title", "slug", "category", "focus_keyphrase", "meta_description", "author", "date"];

interface ParsedArticle {
  data: Record<string, string>;
  body: string;
}

function parseFrontmatter(raw: string): ParsedArticle {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error("Geen geldige frontmatter (verwacht --- ... --- blok bovenaan)");
  const [, frontmatter, body] = match;
  const data: Record<string, string> = {};
  for (const line of frontmatter.split("\n")) {
    const m = line.match(/^(\w+):\s*"?(.*?)"?\s*$/);
    if (m) data[m[1]] = m[2];
  }
  return { data, body };
}

function readArticles(dir: string) {
  const absDir = path.join(process.cwd(), dir);
  const files = fs.readdirSync(absDir).filter((f) => f.endsWith(".md"));
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(absDir, file), "utf8");
    return { file, raw, ...parseFrontmatter(raw) };
  });
}

describe.each(CONTENT_DIRS)("content/$dir", ({ dir, minFiles }) => {
  const articles = readArticles(dir);

  it(`bevat minimaal ${minFiles} artikelen`, () => {
    expect(articles.length).toBeGreaterThanOrEqual(minFiles);
  });

  it("heeft geen dubbele slugs", () => {
    const slugs = articles.map((a) => a.data.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it.each(articles.map((a) => [a.file, a] as const))("%s heeft geldige frontmatter", (_file, article) => {
    for (const key of REQUIRED_FRONTMATTER_KEYS) {
      expect(article.data[key], `ontbrekend frontmatter-veld "${key}"`).toBeTruthy();
    }
    expect(article.data.author).toBe("Vincent van Munster");
    expect(article.data.slug).toBe(article.file.replace(/\.md$/, ""));
    expect(article.data.slug).toContain("-");
  });

  it.each(articles.map((a) => [a.file, a] as const))("%s heeft een bruikbare meta-omschrijving", (_file, article) => {
    const len = article.data.meta_description.length;
    expect(len).toBeGreaterThanOrEqual(50);
    expect(len).toBeLessThanOrEqual(160);
  });

  it.each(articles.map((a) => [a.file, a] as const))("%s is inhoudelijk substantieel", (_file, article) => {
    const wordCount = article.body.trim().split(/\s+/).filter(Boolean).length;
    expect(wordCount).toBeGreaterThanOrEqual(450);

    const headingCount = (article.body.match(/^##\s+/gm) ?? []).length;
    expect(headingCount).toBeGreaterThanOrEqual(2);
  });

  it.each(articles.map((a) => [a.file, a] as const))("%s bevat het focus-keyphrase in de tekst", (_file, article) => {
    const bodyLower = article.body.toLowerCase();
    const keywords = article.data.focus_keyphrase
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);
    for (const word of keywords) {
      expect(bodyLower.includes(word), `"${word}" niet gevonden in de tekst`).toBe(true);
    }
  });

  it.each(articles.map((a) => [a.file, a] as const))("%s belooft geen vaste prijs per kozijn", (_file, article) => {
    for (const pattern of FIXED_PRICE_PATTERNS) {
      expect(pattern.test(article.raw), `verboden patroon ${pattern} gevonden`).toBe(false);
    }
  });

  it.each(articles.map((a) => [a.file, a] as const))("%s claimt geen nog niet gebouwde features", (_file, article) => {
    for (const pattern of UNBUILT_FEATURE_PATTERNS) {
      expect(pattern.test(article.raw), `verboden patroon ${pattern} gevonden`).toBe(false);
    }
  });
});
