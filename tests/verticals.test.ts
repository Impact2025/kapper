import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  KAPPER_VERTICAL,
  LOODGIETER_VERTICAL,
  SCHILDER_VERTICAL,
  listVerticals,
  listLiveVerticals,
  getVerticalConfig,
  verticalForHost,
  isVerticalId,
  resolveNav,
  NAV_CATALOG,
} from "@/lib/verticals";
import { plansFor } from "@/lib/verticals/plans";
import { PLANS } from "@/lib/plans";

const JOB_PACKS = listVerticals().filter((v) => v.archetype === "job");

/** Kapper-only vocabulary that must never leak into a job-archetype pack. */
const KAPPER_WORDS = /kapper|kapsalon|salon|stylist|hoofdhuid|patch-?test|balayage|knippen/i;

describe("vertical registry", () => {
  it("has kapper, loodgieter and schilder", () => {
    expect(listVerticals().map((v) => v.id).sort()).toEqual(["kapper", "loodgieter", "schilder"]);
  });

  it("falls back to kapper for unknown ids", () => {
    expect(getVerticalConfig("garage")).toBe(KAPPER_VERTICAL);
    expect(getVerticalConfig(null)).toBe(KAPPER_VERTICAL);
    expect(isVerticalId("loodgieter")).toBe(true);
    expect(isVerticalId("garage")).toBe(false);
    expect(isVerticalId(undefined)).toBe(false);
  });

  it("only kapper is an appointment archetype; the rest are job", () => {
    expect(KAPPER_VERTICAL.archetype).toBe("appointment");
    expect(LOODGIETER_VERTICAL.archetype).toBe("job");
    expect(SCHILDER_VERTICAL.archetype).toBe("job");
  });

  it("only live verticals are public", () => {
    expect(listLiveVerticals().map((v) => v.id).sort()).toEqual(["kapper", "loodgieter"]);
  });
});

describe("host resolution", () => {
  it("maps the plumber domains to loodgieter, ignoring port and case", () => {
    expect(verticalForHost("loodgietersassistent.nl").id).toBe("loodgieter");
    expect(verticalForHost("WWW.LoodgietersAssistent.nl").id).toBe("loodgieter");
    expect(verticalForHost("www.loodgietersassistent.nl:443").id).toBe("loodgieter");
  });

  it("defaults unknown hosts, previews and localhost to kapper", () => {
    expect(verticalForHost("localhost:3000").id).toBe("kapper");
    expect(verticalForHost("kappersassistent-git-x.vercel.app").id).toBe("kapper");
    expect(verticalForHost(null).id).toBe("kapper");
    expect(verticalForHost("").id).toBe("kapper");
  });

  it("does not let a not-yet-live vertical claim its host", () => {
    expect(verticalForHost("schildersassistent.nl").id).toBe("kapper");
  });

  it("no two verticals share a host", () => {
    const all = listVerticals().flatMap((v) => v.brand.hosts);
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("nav", () => {
  it("every nav key exists in the catalog", () => {
    for (const v of listVerticals()) {
      for (const e of v.nav) expect(NAV_CATALOG[e.key]).toBeDefined();
    }
  });

  it("job verticals get the klus surfaces, kapper does not", () => {
    const keys = (v: typeof KAPPER_VERTICAL) => resolveNav(v.nav).map((n) => n.key);
    expect(keys(LOODGIETER_VERTICAL)).toEqual(expect.arrayContaining(["jobs", "planner", "billing", "maintenance"]));
    expect(keys(KAPPER_VERTICAL)).not.toContain("jobs");
    expect(keys(KAPPER_VERTICAL)).toContain("kassa");
    expect(keys(LOODGIETER_VERTICAL)).not.toContain("kassa");
    expect(keys(LOODGIETER_VERTICAL)).not.toContain("webshop");
  });

  it("applies per-vertical relabels", () => {
    const schilder = resolveNav(SCHILDER_VERTICAL.nav);
    expect(schilder.find((n) => n.key === "jobs")?.label).toBe("Projecten");
    expect(resolveNav(LOODGIETER_VERTICAL.nav).find((n) => n.key === "jobs")?.label).toBe("Klussen");
  });
});

describe("job packs stay free of kapper vocabulary", () => {
  for (const pack of JOB_PACKS) {
    it(`${pack.id}: static strings`, () => {
      const { messages, ...rest } = pack;
      void messages;
      expect(JSON.stringify(rest)).not.toMatch(KAPPER_WORDS);
    });

    it(`${pack.id}: WhatsApp templates`, () => {
      const m = pack.messages;
      const out = [
        m.reminder({ salonName: "Acme", serviceType: "CV-onderhoud", date: "maandag", time: "09:00" }),
        m.review({ salonName: "Acme", reviewLink: "https://x.nl" }),
        m.retention({ salonName: "Acme", firstName: "Jan" }),
        m.maintenanceDue({ salonName: "Acme", firstName: "Jan", assetLabel: "cv-ketel", dueDate: "1 nov" }),
      ].join("\n");
      expect(out).not.toMatch(KAPPER_WORDS);
    });

    it(`${pack.id}: has categories with unique keys, a checklist and an 'overig' fallback`, () => {
      const keys = pack.jobCategories.map((c) => c.key);
      expect(new Set(keys).size).toBe(keys.length);
      expect(keys).toContain("overig");
      for (const c of pack.jobCategories) expect(c.checklist.length).toBeGreaterThan(0);
      const assetKeys = pack.assetKinds.map((a) => a.key);
      expect(new Set(assetKeys).size).toBe(assetKeys.length);
    });

    it(`${pack.id}: never defaults btw to the kapper 9% blanket rate`, () => {
      expect(pack.vatRates.treatment).toBe(21);
    });

    it(`${pack.id}: no health-data guard`, () => {
      expect(pack.hasHealthDataGuard).toBe(false);
      expect(pack.features.healthRecords).toBe(false);
    });
  }

  it("plumber lekkage/gaslucht are spoed by default", () => {
    const urgent = LOODGIETER_VERTICAL.jobCategories.filter((c) => c.urgent).map((c) => c.key);
    expect(urgent).toEqual(expect.arrayContaining(["lekkage", "gaslucht"]));
  });
});

describe("kapper pack keeps its existing behavior", () => {
  it("keeps the exact WhatsApp texts the crons used before the refactor", () => {
    const m = KAPPER_VERTICAL.messages;
    expect(m.retention({ salonName: "Elixir", firstName: "Sanne" })).toBe(
      "Hoi Sanne! We hebben je een tijdje niet gezien bij Elixir. Zin om weer een afspraak te maken? Stuur gerust een berichtje 😊",
    );
    expect(m.review({ salonName: "Elixir", reviewLink: "https://r.nl" })).toBe(
      "Hoi! Bedankt voor je bezoek aan Elixir. Was je tevreden? Een review helpt ons enorm: https://r.nl",
    );
    expect(m.reminder({ salonName: "Elixir", serviceType: "Knippen", date: "ma", time: "10:00" })).toContain(
      "je hebt een afspraak voor Knippen op ma om 10:00",
    );
  });

  it("still uses 9% on treatments and the health guard", () => {
    expect(KAPPER_VERTICAL.vatRates.treatment).toBe(9);
    expect(KAPPER_VERTICAL.hasHealthDataGuard).toBe(true);
    expect(KAPPER_VERTICAL.features.jobs).toBe(false);
  });
});

describe("plansFor", () => {
  it("keeps prices and ids identical to the core plans for every vertical", () => {
    for (const v of listVerticals()) {
      const plans = plansFor(v);
      expect(plans.map((p) => [p.id, p.price])).toEqual(PLANS.map((p) => [p.id, p.price]));
    }
  });

  it("job plans never promise kapper features", () => {
    const text = JSON.stringify(plansFor(LOODGIETER_VERTICAL));
    expect(text).not.toMatch(KAPPER_WORDS);
    expect(text).not.toMatch(/kleurbehandeling|behandelkaart/i);
  });

  it("kapper plans are the unmodified core plans", () => {
    expect(plansFor(KAPPER_VERTICAL)).toBe(PLANS);
  });
});
