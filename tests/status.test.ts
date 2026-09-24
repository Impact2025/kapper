import { describe, it, expect } from "vitest";
import { HELP_ARTICLES } from "@/lib/help/articles";
import { PAGE_HELP, helpFor } from "@/lib/help/page-help";
import {
  componentStates,
  incidentsForPrompt,
  overallState,
  STATUS_COMPONENTS,
} from "@/lib/status/model";

const inc = (over: Partial<{ severity: string; status: string; components: string[]; title: string }> = {}) => ({
  title: "Sync vertraagd",
  severity: "minor",
  status: "investigating",
  components: ["agenda"],
  ...over,
});

describe("componentStates / overallState", () => {
  it("is alles operationeel zonder meldingen", () => {
    const s = componentStates([]);
    expect(Object.values(s).every((x) => x === "operational")).toBe(true);
    expect(overallState(s)).toBe("operational");
  });

  it("laat de ergste actieve melding per onderdeel winnen", () => {
    const s = componentStates([inc(), inc({ severity: "major" }), inc({ severity: "maintenance", components: ["mail"] })]);
    expect(s.agenda).toBe("outage");
    expect(s.mail).toBe("maintenance");
    expect(s.app).toBe("operational");
    expect(overallState(s)).toBe("outage");
  });

  it("negeert opgeloste meldingen en onbekende onderdelen", () => {
    const s = componentStates([inc({ status: "resolved", severity: "major" }), inc({ components: ["bestaat-niet"] })]);
    expect(overallState(s)).toBe("operational");
  });

  it("laat een automatische probe (database onbereikbaar) het dashboard als storing tonen", () => {
    const s = componentStates([], { app: "outage" });
    expect(s.app).toBe("outage");
    expect(overallState(s)).toBe("outage");
  });
});

describe("incidentsForPrompt", () => {
  it("meldt dat alles normaal is of som actieve storingen op", () => {
    expect(incidentsForPrompt([])).toMatch(/Geen bekende/);
    const text = incidentsForPrompt([inc({ severity: "major", components: ["whatsapp"], title: "WhatsApp onbereikbaar" }), inc({ status: "resolved" })]);
    expect(text).toContain("WhatsApp onbereikbaar");
    expect(text).toContain("AI-receptie via WhatsApp");
    expect(text).not.toContain("Sync vertraagd");
  });

  it("kent alle statuscomponenten met een label", () => {
    expect(STATUS_COMPONENTS.length).toBeGreaterThan(5);
  });
});

describe("contextuele paginahulp", () => {
  it("verwijst alleen naar bestaande artikelen", () => {
    const slugs = new Set(HELP_ARTICLES.map((a) => a.slug));
    for (const p of PAGE_HELP) for (const l of p.links) expect(slugs.has(l.slug), `${p.prefix} → ${l.slug}`).toBe(true);
  });

  it("kiest de juiste hulp per pagina en geen op supportpagina's", () => {
    expect(helpFor("/dashboard/integraties")[0]?.slug).toBe("hoe-koppel-ik-mijn-agenda");
    expect(helpFor("/dashboard/klanten/123").length).toBeGreaterThan(0);
    expect(helpFor("/dashboard/support")).toEqual([]);
    expect(helpFor("/dashboard")).toEqual([]);
  });
});
