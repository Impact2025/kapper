import { describe, it, expect } from "vitest";
import { slugify, formatEur } from "@/lib/utils";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Salon Bella Amsterdam")).toBe("salon-bella-amsterdam");
  });

  it("strips diacritics", () => {
    expect(slugify("Coiffeur Élégance")).toBe("coiffeur-elegance");
  });

  it("trims leading/trailing separators", () => {
    expect(slugify("  --Hé, Kapper!--  ")).toBe("he-kapper");
  });
});

describe("formatEur", () => {
  it("formats whole euros without decimals", () => {
    const out = formatEur(1234);
    expect(out).toContain("1.234");
    expect(out).toContain("€");
  });
});
