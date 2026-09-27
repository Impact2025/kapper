import { describe, it, expect } from "vitest";
import { articleLd, breadcrumbLd, collectionLd, faqLd, ldJson } from "@/lib/seo/jsonld";
import { rankRelated, slugifyHeading, withHeadingIds } from "@/lib/seo/article";
import { INTEGRATION_PAGES } from "@/lib/marketing/integrations";
import { verticalRewrite } from "@/lib/verticals/routing";
import { LOODGIETER_VERTICAL } from "@/lib/verticals";

const brand = { name: "KapperAssistent.nl", siteUrl: "https://www.kappersassistent.nl", logo: "https://www.kappersassistent.nl/logo.png" };

describe("articleLd", () => {
  const base = {
    type: "Article" as const,
    brand,
    section: "kennisbank" as const,
    slug: "no-shows-voorkomen",
    title: "No-shows voorkomen",
    publishedAt: new Date("2026-03-01T10:00:00Z"),
  };

  it("carries the fields Google needs for an article", () => {
    const ld = articleLd({ ...base, description: "d", keywords: ["a", "b"], wordCount: 900 });
    expect(ld.url).toBe("https://www.kappersassistent.nl/kennisbank/no-shows-voorkomen");
    expect(ld.mainEntityOfPage["@id"]).toBe(ld.url);
    expect(ld.image).toEqual(["https://www.kappersassistent.nl/kennisbank/no-shows-voorkomen/opengraph-image"]);
    expect(ld.datePublished).toBe("2026-03-01T10:00:00.000Z");
    expect(ld.dateModified).toBe(ld.datePublished);
    expect(ld.publisher.name).toBe("KapperAssistent.nl");
    expect(ld.author.name).toBe("Vincent van Munster");
    expect(ld.author.url).toBe("https://weareimpact.nl");
    expect(ld.author.sameAs).toContain("https://www.linkedin.com/in/vincentvanmunster");
    expect(ld.author.worksFor.name).toBe("WeAreImpact");
    expect(ld.keywords).toBe("a, b");
  });

  it("prefers a cover image and an explicit modified date", () => {
    const ld = articleLd({ ...base, image: "/cover.jpg", modifiedAt: new Date("2026-04-01T00:00:00Z") });
    expect(ld.image).toEqual(["https://www.kappersassistent.nl/cover.jpg"]);
    expect(ld.dateModified).toBe("2026-04-01T00:00:00.000Z");
  });

  it("caps the headline at 110 characters", () => {
    expect(articleLd({ ...base, title: "x".repeat(200) }).headline).toHaveLength(110);
  });
});

describe("breadcrumbLd / collectionLd / faqLd", () => {
  it("numbers breadcrumb positions and absolutises paths", () => {
    const ld = breadcrumbLd(brand.siteUrl, [
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
    ]);
    expect(ld.itemListElement.map((i) => [i.position, i.item])).toEqual([
      [1, "https://www.kappersassistent.nl"],
      [2, "https://www.kappersassistent.nl/blog"],
    ]);
  });

  it("lists items of a collection", () => {
    const ld = collectionLd(brand.siteUrl, { name: "n", description: "d", path: "/blog", items: [{ name: "A", path: "/blog/a" }] });
    expect(ld.mainEntity.itemListElement[0].url).toBe("https://www.kappersassistent.nl/blog/a");
  });

  it("maps FAQ entries", () => {
    expect(faqLd([{ q: "Q?", a: "A." }]).mainEntity[0].acceptedAnswer.text).toBe("A.");
  });

  it("escapes < so text cannot close the script tag", () => {
    expect(ldJson({ a: "</script><b>" })).not.toContain("</script>");
  });
});

describe("withHeadingIds", () => {
  it("adds unique ids and returns a table of contents", () => {
    const { html, toc } = withHeadingIds("<h2>Wat is dit?</h2><p>x</p><h3>Wat is dit?</h3><h2 id=\"eigen\">Eigen</h2>");
    expect(toc.map((t) => t.id)).toEqual(["wat-is-dit", "wat-is-dit-2", "eigen"]);
    expect(html).toContain('<h2 id="wat-is-dit">');
    expect(html).toContain('<h2 id="eigen">');
  });

  it("slugifies accents and punctuation", () => {
    expect(slugifyHeading("Één tip: 100% gratis!")).toBe("een-tip-100-gratis");
  });
});

describe("rankRelated", () => {
  const d = (n: number) => new Date(2026, 0, n);
  const all = [
    { slug: "self", category: "a", keywords: ["x"], publishedAt: d(1) },
    { slug: "cat", category: "a", keywords: [], publishedAt: d(2) },
    { slug: "kw", category: "b", keywords: ["X"], publishedAt: d(3) },
    { slug: "none", category: "b", keywords: [], publishedAt: d(9) },
  ];

  it("ranks category above keywords, excludes itself, ties go newest first", () => {
    const out = rankRelated(all[0], all, 3).map((p) => p.slug);
    expect(out).toEqual(["cat", "kw", "none"]);
  });
});

describe("integration pages", () => {
  it("only exist for adapters that really book (no Salonized/Treatwell)", () => {
    expect(INTEGRATION_PAGES.map((p) => p.slug).sort()).toEqual(["acuity", "phorest"]);
  });

  it("have title and description within search-result limits", () => {
    for (const p of INTEGRATION_PAGES) {
      // the template appends " — KapperAssistent.nl" (20 chars); the whole title stays <= 60
      expect(p.metaTitle.length + 20).toBeLessThanOrEqual(60);
      expect(p.metaDescription.length).toBeLessThanOrEqual(170);
    }
  });
});

describe("vertical routing for SEO files", () => {
  it("serves each trade its own llms.txt and 404s the kapper-only integration pages", () => {
    expect(verticalRewrite("/llms.txt", LOODGIETER_VERTICAL)).toEqual({ pathname: "/sites/loodgieter/llms.txt" });
    expect(verticalRewrite("/integraties/phorest", LOODGIETER_VERTICAL)?.pathname).toContain("__not-found");
  });
});

import { solutionsFor } from "@/lib/marketing/solutions";
import { listVerticals } from "@/lib/verticals";

describe("solution pages", () => {
  it("every vertical has at least one, with unique slugs and title/description within limits", () => {
    for (const v of listVerticals()) {
      const pages = solutionsFor(v.id);
      expect(pages.length, v.id).toBeGreaterThan(0);
      expect(new Set(pages.map((p) => p.slug)).size).toBe(pages.length);
      for (const p of pages) {
        // the template appends " — <Brand>.nl"; the whole title stays <= 60
        expect(p.metaTitle.length + v.brand.name.length + 6, `${v.id}/${p.slug}`).toBeLessThanOrEqual(60);
        expect(p.metaDescription.length, `${v.id}/${p.slug}`).toBeLessThanOrEqual(170);
        expect(p.faq.length).toBeGreaterThan(0);
      }
    }
  });

  it("are routed on every trade's own domain", () => {
    expect(verticalRewrite("/oplossingen/offertesoftware", LOODGIETER_VERTICAL)).toEqual({ pathname: "/sites/loodgieter/oplossingen/offertesoftware" });
  });
});
