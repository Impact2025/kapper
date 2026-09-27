import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { computeSeo } from "@/lib/blog/seo";
import { getVerticalConfig } from "@/lib/verticals";
import { solutionsFor } from "@/lib/marketing/solutions";
import { parseArticle, type ParsedArticle } from "@/lib/blog/frontmatter";

type Folder = { dir: string; vertical: string; section: "kennisbank" | "blog" };
const FOLDERS: Folder[] = [
  { dir: "content/kennisbank-kapper", vertical: "kapper", section: "kennisbank" },
  { dir: "content/kennisbank-loodgieter", vertical: "loodgieter", section: "kennisbank" },
  { dir: "content/kennisbank-hovenier", vertical: "hovenier", section: "kennisbank" },
  { dir: "content/kennisbank-schilder", vertical: "schilder", section: "kennisbank" },
  { dir: "content/blog-hovenier", vertical: "hovenier", section: "blog" },
];

const load = (f: Folder) =>
  readdirSync(f.dir)
    .filter((n) => n.endsWith(".md"))
    .map((n) => ({ file: n, ...f, a: parseArticle(readFileSync(join(f.dir, n), "utf8")) }));
const all = FOLDERS.flatMap(load);

/** Every article of a site, by section, for link checking. */
const slugsOf = (vertical: string, section: string) => new Set(all.filter((x) => x.vertical === vertical && x.section === section).map((x) => x.a.slug));

describe("article content", () => {
  it("has unique slugs across all sites (slugs are globally unique in the database)", () => {
    const slugs = all.map((x) => x.a.slug);
    expect(slugs.filter((s, i) => slugs.indexOf(s) !== i)).toEqual([]);
  });

  for (const x of all) {
    const id = `${x.vertical}/${x.section}/${x.file}`;

    describe(id, () => {
      it("has valid frontmatter", () => {
        expect(x.a.slug).toBe(x.file.replace(/\.md$/, ""));
        expect(x.a.slug).toContain("-");
        expect(x.a.keywords.length).toBeGreaterThanOrEqual(3);
        if (x.vertical === "hovenier") expect(x.a.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        if (x.section === "kennisbank") {
          expect(Object.keys(getVerticalConfig(x.vertical).content.kennisbankCategories)).toContain(x.a.category);
        }
      });

      it("scores >= 80 on the admin SEO checks", () => {
        const { score, checks } = computeSeo({
          title: x.a.title,
          metaTitle: x.a.metaTitle,
          metaDescription: x.a.metaDescription,
          bodyMdx: x.a.body,
          keywords: x.a.keywords,
          slug: x.a.slug,
        });
        expect(score, JSON.stringify(checks.filter((c) => !c.ok))).toBeGreaterThanOrEqual(80);
      });

      it("is written as Vincent: first person, links to WeAreImpact, sentence-case headings", () => {
        expect(x.a.body, "link to weareimpact.nl").toContain("https://weareimpact.nl");
        expect(new RegExp("\\b(ik|mijn|mij)\\b", "i").test(x.a.body), "first person (ik/mijn)").toBe(true);
        const headings = [x.a.title, ...[...x.a.body.matchAll(/^#{1,3} (.+)$/gm)].map((m) => m[1])];
        const titleCased = headings.filter((h) => h.split(" ").slice(1).filter((w) => /^[A-Z][a-z]{3,}$/.test(w)).length >= 3);
        expect(titleCased, "headings must be sentence case").toEqual([]);
      });

      it("only links internally to pages that exist", () => {
        const known = {
          kennisbank: slugsOf(x.vertical, "kennisbank"),
          blog: slugsOf(x.vertical, "blog"),
          oplossingen: new Set(solutionsFor(x.vertical).map((s) => s.slug)),
        };
        const bad: string[] = [];
        for (const m of x.a.body.matchAll(/\]\((\/[^)\s#]*)\)/g)) {
          const [, section, slug] = m[1].split("/");
          if (section === "kennisbank" || section === "blog" || section === "oplossingen") {
            if (!slug || !known[section].has(slug)) bad.push(m[1]);
          }
        }
        expect(bad).toEqual([]);
      });
    });
  }
});

describe("hovenier launch content", () => {
  const hovenier = all.filter((x) => x.vertical === "hovenier");
  const FROM = "2026-02-02";
  const TO = new Date().toISOString().slice(0, 10);

  it("has at least 9 blogs and 5 new kennisbank articles", () => {
    expect(hovenier.filter((x) => x.section === "blog").length).toBeGreaterThanOrEqual(9);
    expect(hovenier.filter((x) => x.section === "kennisbank").length).toBeGreaterThanOrEqual(5);
  });

  it(`gives every article its own date between ${FROM} and today`, () => {
    const dates = hovenier.map((x: { a: ParsedArticle }) => x.a.date);
    expect(new Set(dates).size, "dates must be unique").toBe(dates.length);
    for (const d of dates) {
      expect(d >= FROM && d <= TO, d).toBe(true);
    }
  });
});
