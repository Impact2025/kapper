import { describe, expect, it } from "vitest";
import { HOVENIER_GUIDE, LOODGIETER_GUIDE, guideFor, guideTipsFor } from "@/lib/help/guide";
import { HOVENIER_VERTICAL } from "@/lib/verticals/hovenier";
import { LOODGIETER_VERTICAL } from "@/lib/verticals/loodgieter";

describe("hovenier-handleiding", () => {
  it("heeft uitleg voor elk menu-item behalve de handleiding zelf", () => {
    for (const e of HOVENIER_VERTICAL.nav) {
      if (e.key === "guide") continue;
      const g = guideFor("hovenier", e.key);
      expect(g, e.key).toBeDefined();
      expect(g!.steps.length, e.key).toBeGreaterThan(0);
      expect(g!.short.length, e.key).toBeLessThan(120);
    }
  });
  it("geeft andere verticals geen hovenieruitleg", () => {
    expect(guideFor("kapper", "jobs")).toBeUndefined();
    expect(Object.keys(HOVENIER_GUIDE).length).toBeGreaterThan(10);
  });
});

describe("loodgieter-handleiding", () => {
  it("heeft uitleg voor elk menu-item behalve de handleiding zelf", () => {
    for (const e of LOODGIETER_VERTICAL.nav) {
      if (e.key === "guide") continue;
      const g = guideFor("loodgieter", e.key);
      expect(g, e.key).toBeDefined();
      expect(g!.steps.length, e.key).toBeGreaterThan(0);
      expect(g!.short.length, e.key).toBeLessThan(120);
    }
  });
  it("gebruikt geen hovenier-woorden", () => {
    expect(JSON.stringify(LOODGIETER_GUIDE)).not.toMatch(/hovenier|tuin|boom|storm|gazon|ploeg/i);
    expect(JSON.stringify(guideTipsFor("loodgieter"))).not.toMatch(/hovenier|storm|ploeg/i);
  });
  it("noemt het installatiepaspoort alleen als dat bestaat", () => {
    expect(guideFor("loodgieter", "customers")?.what).toMatch(/installatiepaspoort/i);
  });
});
