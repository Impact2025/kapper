import { describe, it, expect } from "vitest";
import { computeSeo } from "@/lib/blog/seo";

const longBody = `## Inleiding
${"woord ".repeat(650)}

## Tweede kop
Meer tekst over kapsalon SEO en groei.

### Subkop
Nog meer nuttige inhoud.`;

describe("computeSeo", () => {
  it("scores a well-optimized post highly", () => {
    const { score, checks } = computeSeo({
      title: "Lokale SEO voor kapsalons: het complete stappenplan",
      metaTitle: "Lokale SEO voor kapsalons: stappenplan 2026",
      metaDescription:
        "Ontdek hoe je met lokale SEO meer klanten naar je kapsalon trekt. Praktisch stappenplan met concrete tips voor saloneigenaren.",
      bodyMdx: longBody,
      keywords: ["kapsalon seo", "lokale seo", "kapper marketing"],
      slug: "lokale-seo-kapsalons",
    });
    expect(score).toBeGreaterThanOrEqual(80);
    expect(checks.every((c) => typeof c.ok === "boolean")).toBe(true);
  });

  it("penalizes a thin post", () => {
    const { score } = computeSeo({
      title: "Kort",
      metaTitle: "Kort",
      metaDescription: "",
      bodyMdx: "Te weinig tekst.",
      keywords: [],
      slug: "kort",
    });
    expect(score).toBeLessThan(50);
  });

  it("rewards the primary keyword appearing in the body", () => {
    const withKw = computeSeo({
      title: "Test",
      metaTitle: "Test titel die lang genoeg is voor de check ok",
      metaDescription: "x".repeat(80),
      bodyMdx: `## Kop\n${"kapsalon seo ".repeat(350)}\n## Twee\ntekst`,
      keywords: ["kapsalon seo", "b", "c"],
      slug: "with-keyword",
    });
    const keywordCheck = withKw.checks.find((c) => c.label.includes("Hoofdkeyword"));
    expect(keywordCheck?.ok).toBe(true);
  });
});
