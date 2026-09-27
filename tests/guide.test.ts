import { describe, expect, it } from "vitest";
import { HOVENIER_GUIDE, guideFor } from "@/lib/help/guide";
import { HOVENIER_VERTICAL } from "@/lib/verticals/hovenier";

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
