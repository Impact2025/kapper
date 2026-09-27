import { describe, it, expect } from "vitest";
import { isInServiceArea, parsePrefixInput, parseServiceArea } from "@/lib/jobs/service-area";
import { seasonTotals, visitsInMonth } from "@/lib/jobs/season";

describe("service area", () => {
  it("parses prefixes from free text, dedupes and reports invalid parts", () => {
    expect(parsePrefixInput("52, 5038 5211;52 abc 1")).toEqual({ prefixes: ["52", "5038", "5211"], invalid: ["abc", "1"] });
  });

  it("reads only valid prefixes from settings", () => {
    expect(parseServiceArea({ serviceArea: { prefixes: ["52", "x", 5, "50388"] } }).prefixes).toEqual(["52"]);
    expect(parseServiceArea(undefined).prefixes).toEqual([]);
  });

  it("matches by prefix and treats 'no area' or bad postcode as undecidable", () => {
    const area = { prefixes: ["52", "5038"] };
    expect(isInServiceArea(area, "5211 KL")).toBe(true);
    expect(isInServiceArea(area, "5038EA")).toBe(true);
    expect(isInServiceArea(area, "5039 AA")).toBe(false);
    expect(isInServiceArea(area, "1012 AB")).toBe(false);
    expect(isInServiceArea({ prefixes: [] }, "1012 AB")).toBeNull();
    expect(isInServiceArea(area, "onbekend")).toBeNull();
    expect(isInServiceArea(area, null)).toBeNull();
  });
});

describe("season totals", () => {
  const biweekly = { intervalMonths: 12, intervalWeeks: 2, seasonStartMonth: 3, seasonEndMonth: 10, priceCents: 10000 };

  it("counts visits only inside the season", () => {
    expect(visitsInMonth(biweekly, 2)).toBe(0);
    expect(visitsInMonth(biweekly, 3)).toBeCloseTo(52 / 12 / 2);
    expect(visitsInMonth(biweekly, 11)).toBe(0);
  });

  it("handles a season that wraps the year", () => {
    const winter = { intervalMonths: 1, seasonStartMonth: 11, seasonEndMonth: 2, priceCents: 5000 };
    expect(visitsInMonth(winter, 12)).toBe(1);
    expect(visitsInMonth(winter, 1)).toBe(1);
    expect(visitsInMonth(winter, 6)).toBe(0);
  });

  it("sums revenue per month over contracts", () => {
    const yearly = { intervalMonths: 12, priceCents: 12000 };
    const totals = seasonTotals([biweekly, yearly]);
    expect(totals).toHaveLength(12);
    expect(totals[0]!.revenueCents).toBe(1000); // januari: alleen het jaarcontract (1/12)
    expect(totals[3]!.revenueCents).toBe(Math.round((52 / 12 / 2) * 10000 + 1000));
  });
});
