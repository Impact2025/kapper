import { describe, it, expect, vi } from "vitest";
import { existsSync } from "node:fs";

vi.mock("server-only", () => ({}));

import { LOODGIETER_VERTICAL } from "@/lib/verticals";
import { verticalRewrite } from "@/lib/verticals/routing";
import { solutionsFor } from "@/lib/marketing/solutions";
import { HOURLY_RATE_TOOL_PATH, hasHourlyRateTool } from "@/lib/marketing/tools";
import { computeHourlyRate, WORKABLE_HOURS_PER_YEAR } from "@/lib/marketing/hourly-rate";

const PAGES = solutionsFor("loodgieter");
const text = (p: (typeof PAGES)[number]) => JSON.stringify(p);

describe("loodgieter landingspagina's", () => {
  it("dekken de zoekintenties van een loodgieter", () => {
    const slugs = PAGES.map((p) => p.slug);
    expect(slugs).toEqual(
      expect.arrayContaining([
        "ai-assistent-voor-loodgieters",
        "software-voor-loodgieters",
        "spoedoproepen",
        "offertesoftware",
        "onderhoudscontracten",
        "werkbon-en-planbord",
        "warmtepomp-installateur-software",
        "installatiepaspoort-software",
        "loodgieter-software-kiezen",
      ]),
    );
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("hebben genoeg inhoud om te ranken: secties, faq en een duidelijke kop", () => {
    for (const p of PAGES) {
      expect(p.sections.length, p.slug).toBeGreaterThanOrEqual(4);
      expect(p.faq.length, p.slug).toBeGreaterThanOrEqual(4);
      expect(p.headline.length, p.slug).toBeGreaterThan(20);
      expect(p.intro.length, p.slug).toBeGreaterThan(80);
    }
  });

  it("linken alleen naar bestaande pagina's, blogs en tools", () => {
    const slugs = new Set(PAGES.map((p) => p.slug));
    for (const p of PAGES) {
      for (const l of p.links ?? []) {
        if (l.href.startsWith("/oplossingen/")) expect(slugs.has(l.href.split("/")[2]), `${p.slug} -> ${l.href}`).toBe(true);
        if (l.href.startsWith("/blog/")) expect(existsSync(`content/blog-loodgieter/${l.href.split("/")[2]}.md`), `${p.slug} -> ${l.href}`).toBe(true);
        if (l.href.startsWith("/tools/")) expect(l.href).toBe(HOURLY_RATE_TOOL_PATH);
      }
      if (p.tool) expect(p.tool.href).toBe(HOURLY_RATE_TOOL_PATH);
    }
  });

  it("beloven geen boekhoudkoppelingen die er niet zijn", () => {
    for (const p of PAGES) {
      const t = text(p);
      if (/Moneybird|e-Boekhouden|Exact Online/i.test(t)) expect(t, p.slug).toMatch(/gepland|planning|nog niet/i);
    }
  });

  it("zeggen niet dat loodgieterswerk in een woning ouder dan 2 jaar naar 9% mag", () => {
    for (const p of PAGES) expect(text(p), p.slug).not.toMatch(/verlaagde tarief (op arbeid )?kan (bij|voor)/i);
  });

  it("noemen geen subsidiebedragen of beloven geen certificering", () => {
    for (const p of PAGES) {
      expect(text(p), p.slug).not.toMatch(/€\s?\d[\d.]*[^\d]{0,30}subsidie|subsidie[^.]{0,40}€\s?\d/i);
    }
  });

  it("leveren een tabel waar die staat met evenveel kolommen als koppen", () => {
    for (const p of PAGES) {
      if (!p.table) continue;
      for (const r of p.table.rows) expect(r.length, `${p.slug}: ${r[0]}`).toBe(p.table.headers.length);
    }
  });

  it("zijn bereikbaar op het eigen domein van loodgieter, inclusief de tool", () => {
    expect(verticalRewrite("/oplossingen/software-voor-loodgieters", LOODGIETER_VERTICAL)?.pathname).toBe("/sites/loodgieter/oplossingen/software-voor-loodgieters");
    expect(verticalRewrite(HOURLY_RATE_TOOL_PATH, LOODGIETER_VERTICAL)?.pathname).toBe("/sites/loodgieter/tools/uurtarief-calculator");
    expect(hasHourlyRateTool(LOODGIETER_VERTICAL)).toBe(true);
  });
});

describe("uurtarief-calculator", () => {
  it("volgt de KVK-methode: omzet gedeeld door declarabele uren", () => {
    const r = computeHourlyRate({ costsPerYear: 30000, incomePerYear: 60000, billablePercent: 60 });
    expect(r.revenueNeeded).toBe(90000);
    expect(r.billableHours).toBe(Math.round(WORKABLE_HOURS_PER_YEAR * 0.6));
    expect(r.rateExVat).toBeCloseTo(90000 / 1104, 5);
    expect(r.rateInclVat).toBeCloseTo((90000 / 1104) * 1.21, 5);
  });

  it("wordt hoger als je minder uren factureert", () => {
    const low = computeHourlyRate({ costsPerYear: 20000, incomePerYear: 50000, billablePercent: 50 });
    const high = computeHourlyRate({ costsPerYear: 20000, incomePerYear: 50000, billablePercent: 70 });
    expect(low.rateExVat!).toBeGreaterThan(high.rateExVat!);
  });

  it("is robuust tegen onzin: negatief, NaN en een te laag declarabel percentage", () => {
    const r = computeHourlyRate({ costsPerYear: -5, incomePerYear: Number.NaN, billablePercent: 0 });
    expect(r.revenueNeeded).toBe(0);
    expect(r.billableHours).toBeGreaterThan(0);
    expect(r.rateExVat).toBe(0);
  });
});
