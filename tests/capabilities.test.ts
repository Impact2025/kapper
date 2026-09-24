import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { listVerticals, KAPPER_VERTICAL, LOODGIETER_VERTICAL, SCHILDER_VERTICAL } from "@/lib/verticals";
import { INTEGRATIONS, integrationsFor, liveAgendaProvidersFor, plannedIntegrationsFor } from "@/lib/capabilities/integrations";
import { getReceptionistTools, RECEPTIONIST_TOOLS } from "@/lib/ai/receptionist";
import { fieldsForCategory, sanitizeDetails, detailRows, eligibleForReducedVatHint } from "@/lib/jobs/fields";
import { buildJobReport } from "@/lib/jobs/report-model";

describe("integration registry", () => {
  it("every id a pack references exists", () => {
    for (const v of listVerticals()) for (const id of v.integrations) expect(INTEGRATIONS[id], `${v.id}:${id}`).toBeDefined();
  });

  it("kapper keeps its agenda providers; job verticals have none (they plan in-app)", () => {
    expect(liveAgendaProvidersFor(KAPPER_VERTICAL).map((d) => d.id)).toEqual(["salonized", "phorest", "treatwell", "acuity"]);
    expect(liveAgendaProvidersFor(LOODGIETER_VERTICAL)).toEqual([]);
  });

  it("planned integrations are surfaced as such and never claimed live", () => {
    expect(plannedIntegrationsFor(LOODGIETER_VERTICAL).map((d) => d.id)).toEqual(expect.arrayContaining(["moneybird", "exact_online"]));
    expect(plannedIntegrationsFor(KAPPER_VERTICAL)).toEqual([]);
    expect(integrationsFor(LOODGIETER_VERTICAL).find((d) => d.id === "moneybird")?.status).toBe("planned");
  });
});

describe("agent tools per vertical", () => {
  const names = (v: string) => getReceptionistTools({ vertical: v }).map((t) => t.name);

  it("kapper gets exactly the original catalogue, unchanged", () => {
    expect(getReceptionistTools({ vertical: "kapper" })).toEqual(RECEPTIONIST_TOOLS);
    expect(names("kapper")).not.toContain("register_job");
  });

  it("job verticals get register_job and keep escalate_to_staff last", () => {
    for (const v of ["loodgieter", "schilder"]) {
      const n = names(v);
      expect(n).toContain("register_job");
      expect(n[n.length - 1]).toBe("escalate_to_staff");
    }
  });

  it("every tool a pack lists is really offered", () => {
    for (const v of listVerticals()) expect(names(v.id).sort()).toEqual([...v.agent.tools].sort());
  });
});

describe("vak-specific klus fields", () => {
  it("plumber and painter each have their own fields", () => {
    expect(LOODGIETER_VERTICAL.jobFields.map((f) => f.key)).toContain("woningOuderDan2Jaar");
    expect(SCHILDER_VERTICAL.jobFields.map((f) => f.key)).toEqual(expect.arrayContaining(["oppervlak", "kleur"]));
    expect(KAPPER_VERTICAL.jobFields).toEqual([]);
  });

  it("scopes fields to their categories", () => {
    expect(fieldsForCategory(LOODGIETER_VERTICAL, "cv_storing").map((f) => f.key)).toContain("foutcode");
    expect(fieldsForCategory(LOODGIETER_VERTICAL, "lekkage").map((f) => f.key)).not.toContain("foutcode");
    expect(fieldsForCategory(LOODGIETER_VERTICAL, "lekkage").map((f) => f.key)).toContain("hoofdkraanBereikbaar");
  });

  it("sanitizes: unknown keys dropped, numbers validated, selects restricted", () => {
    const input: Record<string, string> = {
      f_oppervlak: "45,5",
      f_kleur: "  RAL 9010 ",
      f_aantalLagen: "abc",
      f_ondergrond: "Hout",
      f_steigerNodig: "Kraan",
      f_hacker: "x",
    };
    const out = sanitizeDetails(SCHILDER_VERTICAL, "buiten", (n) => input[n]);
    expect(out).toEqual({ oppervlak: "45.5", kleur: "RAL 9010", ondergrond: "Hout" });
  });

  it("shows details with units and detects the reduced-vat precondition", () => {
    expect(detailRows(SCHILDER_VERTICAL, "binnen", { oppervlak: "45" })).toEqual([{ label: "Oppervlak", value: "45 m²" }]);
    expect(eligibleForReducedVatHint({ woningOuderDan2Jaar: "Ja" })).toBe(true);
    expect(eligibleForReducedVatHint({ woningOuderDan2Jaar: "Nee" })).toBe(false);
    expect(eligibleForReducedVatHint(null)).toBe(false);
  });
});

describe("job report aggregation", () => {
  const d = (s: string) => new Date(s);
  const now = d("2026-10-20T12:00:00Z");
  const since = d("2026-10-01T00:00:00Z");
  const jobs = [
    { id: "a", category: "lekkage", source: "ai_phone", priority: "urgent", status: "completed", staffId: "s1", createdAt: d("2026-10-02T08:00:00Z"), completedAt: d("2026-10-02T12:00:00Z") },
    { id: "b", category: "cv_onderhoud", source: "manual", priority: "normal", status: "new", staffId: "s1", createdAt: d("2026-10-05T08:00:00Z"), completedAt: null },
    { id: "c", category: "lekkage", source: "ai_whatsapp", priority: "normal", status: "completed", staffId: null, createdAt: d("2026-10-06T08:00:00Z"), completedAt: d("2026-10-07T08:00:00Z") },
    { id: "old", category: "overig", source: "manual", priority: "normal", status: "completed", staffId: "s2", createdAt: d("2026-08-01T08:00:00Z"), completedAt: d("2026-08-02T08:00:00Z") },
  ];
  const docs = [
    { kind: "quote", status: "accepted", totalCents: 12100, vatCents: 2100, jobId: "a", issuedAt: d("2026-10-02T09:00:00Z"), paidAt: null },
    { kind: "quote", status: "sent", totalCents: 5000, vatCents: 868, jobId: "b", issuedAt: d("2026-10-05T09:00:00Z"), paidAt: null },
    { kind: "invoice", status: "paid", totalCents: 12100, vatCents: 2100, jobId: "a", issuedAt: d("2026-10-03T09:00:00Z"), paidAt: d("2026-10-04T09:00:00Z") },
    { kind: "invoice", status: "draft", totalCents: 999, vatCents: 0, jobId: "b", issuedAt: null, paidAt: null },
  ];
  const r = buildJobReport({ jobs, docs, since, dateKey: (x) => x.toISOString().slice(0, 10), days: 20, now });

  it("counts only the period", () => {
    expect(r.created).toBe(3);
    expect(r.completed).toBe(2);
    expect(r.urgent).toBe(1);
  });

  it("measures AI share and lead time", () => {
    expect(r.viaAi).toBe(2);
    expect(r.aiSharePercent).toBe(67);
    expect(r.avgLeadTimeHours).toBe(14); // (4h + 24h) / 2
  });

  it("quote acceptance ignores drafts and money is excl. btw", () => {
    expect(r.quotesSent).toBe(2);
    expect(r.quotesAccepted).toBe(1);
    expect(r.quoteAcceptancePercent).toBe(50);
    expect(r.invoicedCents).toBe(10000);
    expect(r.paidCents).toBe(10000);
  });

  it("attributes invoiced revenue to the monteur of the klus", () => {
    const s1 = r.perStaff.find((s) => s.staffId === "s1")!;
    expect(s1.jobs).toBe(2);
    expect(s1.invoicedCents).toBe(10000);
    expect(r.perStaff[0]!.staffId).toBe("s1");
  });

  it("returns a full trend window and sorted categories", () => {
    expect(r.trend).toHaveLength(20);
    expect(r.perCategory[0]).toEqual({ category: "lekkage", count: 2 });
  });
});
