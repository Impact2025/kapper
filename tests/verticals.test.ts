import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  KAPPER_VERTICAL,
  LOODGIETER_VERTICAL,
  SCHILDER_VERTICAL,
  HOVENIER_VERTICAL,
  hostMismatch,
  listVerticals,
  listLiveVerticals,
  getVerticalConfig,
  verticalForHost,
  isVerticalId,
  resolveNav,
  NAV_CATALOG,
} from "@/lib/verticals";
import { plansFor } from "@/lib/verticals/plans";
import { resolveOnboarding } from "@/lib/verticals/onboarding";
import { PLANS } from "@/lib/plans";

const JOB_PACKS = listVerticals().filter((v) => v.archetype === "job");

/** Kapper-only vocabulary that must never leak into a job-archetype pack. */
const KAPPER_WORDS = /kapper|kapsalon|salon|stylist|hoofdhuid|patch-?test|balayage|knippen/i;

describe("vertical registry", () => {
  it("has kapper, loodgieter, schilder and hovenier", () => {
    expect(listVerticals().map((v) => v.id).sort()).toEqual(["hovenier", "kapper", "loodgieter", "schilder"]);
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

describe("hostMismatch", () => {
  it("passes a salon on its own domain", () => {
    expect(hostMismatch("loodgietersassistent.nl", "loodgieter")).toBeNull();
    expect(hostMismatch("www.kappersassistent.nl", "kapper")).toBeNull();
  });

  it("sends a salon on another trade's domain to its own vertical", () => {
    expect(hostMismatch("kappersassistent.nl", "loodgieter")?.id).toBe("loodgieter");
    expect(hostMismatch("loodgietersassistent.nl", "kapper")?.id).toBe("kapper");
  });

  it("never blocks unclaimed hosts (localhost, previews) or a missing vertical", () => {
    expect(hostMismatch("localhost:2190", "loodgieter")).toBeNull();
    expect(hostMismatch("x-git-y.vercel.app", "loodgieter")).toBeNull();
    expect(hostMismatch(null, "loodgieter")).toBeNull();
    expect(hostMismatch("kappersassistent.nl", null)).toBeNull();
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

describe("onboarding", () => {
  const none = { business: false, services: false, team: false, whatsapp: false, phone: false, firstJob: false };

  it("falls back to the default set and derives labels from the pack terms", () => {
    const steps = resolveOnboarding(LOODGIETER_VERTICAL, { ...none, services: true });
    expect(steps.map((s) => s.key)).toEqual(["business", "services", "team", "whatsapp", "phone"]);
    expect(steps.find((s) => s.key === "team")?.label).toMatch(new RegExp(`^${LOODGIETER_VERTICAL.terms.practitionerPlural}`, "i"));
    expect(steps.find((s) => s.key === "services")?.done).toBe(true);
    expect(steps.find((s) => s.key === "business")?.done).toBe(false);
  });

  it("lets a pack pick, order and relabel its own steps", () => {
    const pack = {
      ...SCHILDER_VERTICAL,
      onboarding: [{ key: "firstJob" as const, label: "Eerste project" }, { key: "business" as const }],
    };
    const steps = resolveOnboarding(pack, { ...none, firstJob: true });
    expect(steps.map((s) => s.label)).toEqual(["Eerste project", "Bedrijfsgegevens voor facturen"]);
    expect(steps[0]?.done).toBe(true);
  });

  it("every pack onboarding entry resolves to an in-app destination", () => {
    for (const v of listVerticals()) {
      for (const s of resolveOnboarding(v, none)) expect(s.href.startsWith("/dashboard")).toBe(true);
    }
  });
});

describe("pack conformance (every vertical, current and future)", () => {
  const HEX = /^#[0-9a-f]{6}$/i;

  for (const pack of listVerticals()) {
    describe(pack.id, () => {
      it("has a well-formed identity and unique, lowercase hosts", () => {
        expect(pack.id).toMatch(/^[a-z]+$/);
        expect(pack.brand.hosts.length).toBeGreaterThan(0);
        for (const h of pack.brand.hosts) expect(h).toBe(h.toLowerCase());
        expect(pack.brand.siteUrl.startsWith("https://")).toBe(true);
        expect(pack.brand.supportEmail.endsWith(`@${pack.brand.domain}`)).toBe(true);
      });

      it("always shows the overview first and has no duplicate nav keys", () => {
        const keys = pack.nav.map((n) => n.key);
        expect(keys[0]).toBe("overview");
        expect(new Set(keys).size).toBe(keys.length);
      });

      it("only enables surfaces its nav actually exposes", () => {
        const keys = pack.nav.map((n) => n.key);
        if (pack.features.jobs) expect(keys).toContain("jobs");
        if (pack.features.quotes) expect(keys).toContain("billing");
        if (pack.features.contracts) expect(keys).toContain("maintenance");
      });

      if (pack.theme) {
        it("has a complete hex theme", () => {
          for (const v of Object.values(pack.theme!)) expect(v).toMatch(HEX);
        });
      }

      if (pack.archetype === "job") {
        it("has unique job categories, each with a checklist and an 'overig' fallback", () => {
          const keys = pack.jobCategories.map((c) => c.key);
          expect(new Set(keys).size).toBe(keys.length);
          expect(keys).toContain("overig");
          for (const c of pack.jobCategories) {
            expect(c.checklist.length).toBeGreaterThan(0);
            expect(c.estimatedMinutes).toBeGreaterThan(0);
          }
        });

        it("has unique asset kinds and a starter catalog on a known category", () => {
          const kinds = pack.assetKinds.map((a) => a.key);
          expect(new Set(kinds).size).toBe(kinds.length);
          const cats = new Set(pack.jobCategories.map((c) => c.key));
          for (const t of pack.serviceTemplates) expect(cats.has(t.category)).toBe(true);
        });

        it("keeps VAT rates a deliberate choice (21% unless documented otherwise)", () => {
          expect([9, 21]).toContain(pack.vatRates.treatment);
          expect([9, 21]).toContain(pack.vatRates.product);
        });
      }

      if (pack.live) {
        it("is complete enough to be public: landing copy, faq and content", () => {
          if (pack.archetype === "job") {
            expect(pack.marketing.landing).not.toBeNull();
            expect(pack.marketing.landing!.faq.length).toBeGreaterThan(2);
          }
          expect(pack.content.blogSuggestions.length).toBeGreaterThan(0);
        });
      }
    });
  }
});

describe("hovenier", () => {
  it("is a job vertical with its own green theme, and does not claim its host until live", () => {
    expect(HOVENIER_VERTICAL.archetype).toBe("job");
    expect(HOVENIER_VERTICAL.theme?.primary).not.toBe(undefined);
    expect(HOVENIER_VERTICAL.live).toBe(false);
    expect(verticalForHost("hovenierassistent.nl").id).toBe("kapper");
  });

  it("treats stormschade as spoed and has no gas/water-leak categories", () => {
    const urgent = HOVENIER_VERTICAL.jobCategories.filter((c) => c.urgent).map((c) => c.key);
    expect(urgent).toEqual(["storm"]);
    expect(HOVENIER_VERTICAL.jobCategories.map((c) => c.key)).not.toContain("lekkage");
  });

  it("has its own pricing copy without another trade's vocabulary", () => {
    const copy = JSON.stringify(plansFor(HOVENIER_VERTICAL).map((p) => [p.name, p.tagline, p.features]));
    expect(copy).not.toMatch(/monteur|installatiepaspoort|serienummer|cv-|ketel/i);
    expect(copy).toMatch(/hovenier/i);
  });

  it("only offers klusvelden for existing categories", () => {
    const cats = new Set(HOVENIER_VERTICAL.jobCategories.map((c) => c.key));
    for (const f of HOVENIER_VERTICAL.jobFields) for (const c of f.categories ?? []) expect(cats.has(c)).toBe(true);
  });
});
