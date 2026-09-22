import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

import { getVerticalConfig, KAPPER_VERTICAL, LOODGIETER_VERTICAL } from "@/lib/salon/vertical";
import { buildSystemPrompt } from "@/lib/ai/receptionist";

describe("getVerticalConfig", () => {
  it("resolves the loodgieter vertical by id", () => {
    expect(getVerticalConfig("loodgieter")).toEqual(LOODGIETER_VERTICAL);
  });

  it("resolves the kapper vertical by id", () => {
    expect(getVerticalConfig("kapper")).toEqual(KAPPER_VERTICAL);
  });

  it("falls back to kapper for an unknown vertical id", () => {
    expect(getVerticalConfig("garage")).toEqual(KAPPER_VERTICAL);
  });

  it("falls back to kapper for null/undefined", () => {
    expect(getVerticalConfig(null)).toEqual(KAPPER_VERTICAL);
    expect(getVerticalConfig(undefined)).toEqual(KAPPER_VERTICAL);
  });

  it("loodgieter has no health-data guard, unlike kapper", () => {
    expect(KAPPER_VERTICAL.hasHealthDataGuard).toBe(true);
    expect(LOODGIETER_VERTICAL.hasHealthDataGuard).toBe(false);
  });
});

describe("buildSystemPrompt — vertical-aware phrasing", () => {
  const baseSalon = {
    id: "salon-1",
    name: "Test Bedrijf",
    city: "Utrecht",
    phone: null,
    plan: "pro",
    agendaProvider: null,
    aiSettings: {},
    noShowSettings: {},
    locations: [],
    treatments: [],
    staff: [],
    knowledgeEntries: [],
  };

  it("uses kapper vocabulary for the kapper vertical", () => {
    const prompt = buildSystemPrompt({ ...baseSalon, vertical: "kapper" } as never);
    expect(prompt).toMatch(/kapselinspiratie/);
    expect(prompt).not.toMatch(/gaslek/);
  });

  it("uses loodgieter vocabulary for the loodgieter vertical, with no kapper-specific medical language", () => {
    const prompt = buildSystemPrompt({ ...baseSalon, vertical: "loodgieter" } as never);
    expect(prompt).toMatch(/loodgieter/);
    expect(prompt).toMatch(/gaslek/);
    expect(prompt).not.toMatch(/kapselinspiratie|huidige haarkleur|hoofdhuidconditie/);
  });
});

describe("runAiManager — Artikel 9 guard is vertical-gated", () => {
  const getReceptionistReplyMock = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    getReceptionistReplyMock.mockReset().mockResolvedValue({ reply: "Prima, ik plan dat in." });
  });

  it("does not fire the health-data guard for a loodgieter salon, even on trigger words", async () => {
    vi.doMock("server-only", () => ({}));
    vi.doMock("@/lib/ai/receptionist", () => ({
      getReceptionistReply: (...args: unknown[]) => getReceptionistReplyMock(...args),
    }));
    vi.doMock("@/lib/db", () => ({ db: { insert: () => ({ values: () => Promise.resolve() }) } }));
    vi.doMock("@/lib/observability", () => ({ captureError: vi.fn() }));

    const { runAiManager } = await import("@/lib/ai/manager");
    const salon = { id: "salon-1", name: "Loodgietersbedrijf Test", vertical: "loodgieter" };

    const result = await runAiManager({
      salonId: "salon-1",
      salon: salon as never,
      // "allergie" is an Artikel 9 trigger word for kapper — irrelevant vocabulary noise for a plumber.
      history: [{ role: "user", content: "Mijn partner heeft een allergie, kan dat de lekkage veroorzaken?" }],
      customerPhone: "+31611112222",
      conversationId: "conv-1",
      channel: "whatsapp",
    });

    expect(getReceptionistReplyMock).toHaveBeenCalledTimes(1);
    expect(result.reply).toBe("Prima, ik plan dat in.");
  });
});
