import { describe, it, expect } from "vitest";
import { computeHealth, pctChange, type HealthInput } from "@/lib/admin/health";
import { mrrMovements } from "@/lib/admin/mrr";
import { detectAnomalies, type UsageWindow } from "@/lib/admin/anomalies";

const healthy: HealthInput = {
  status: "active",
  tenureDays: 200,
  daysSinceLogin: 2,
  conversationsRecent: 80,
  conversationsPrior: 75,
  bookingsRecent: 30,
  escalationsRecent: 2,
  openTickets: 0,
  breachedTickets: 0,
  marginTone: "healthy",
};

describe("computeHealth", () => {
  it("scores an active, engaged customer 100 with a growth next step", () => {
    const r = computeHealth(healthy);
    expect(r.score).toBe(100);
    expect(r.band).toBe("gezond");
    expect(r.reasons).toEqual([]);
    expect(r.nextAction).toMatch(/review|referral/);
  });

  it("puts a silent, unpaid, unengaged customer at risk and leads with the payment", () => {
    const r = computeHealth({ ...healthy, status: "past_due", conversationsRecent: 0, daysSinceLogin: 45 });
    expect(r.score).toBe(100 - 30 - 30 - 15);
    expect(r.band).toBe("risico");
    expect(r.reasons[0]!.impact).toBe(-30);
    expect(r.nextAction).toMatch(/Betaling/);
  });

  it("is lenient on inactivity during onboarding", () => {
    const r = computeHealth({ ...healthy, tenureDays: 5, conversationsRecent: 0, conversationsPrior: 0, daysSinceLogin: null, bookingsRecent: 0 });
    expect(r.score).toBe(85);
    expect(r.nextAction).toMatch(/Onboarding/);
  });

  it("detects a usage drop only with a meaningful baseline", () => {
    expect(computeHealth({ ...healthy, conversationsRecent: 30, conversationsPrior: 80 }).reasons[0]!.label).toMatch(/Gesprekken -62%/);
    expect(computeHealth({ ...healthy, conversationsRecent: 1, conversationsPrior: 3, bookingsRecent: 1 }).score).toBe(100);
  });

  it("flags escalations, conversations without bookings, tickets and margin", () => {
    const r = computeHealth({ ...healthy, bookingsRecent: 0, escalationsRecent: 30, openTickets: 3, breachedTickets: 1, marginTone: "loss" });
    expect(r.score).toBe(100 - 10 - 10 - 10 - 10 - 10);
    expect(r.band).toBe("aandacht");
    expect(r.nextAction).toMatch(/verlopen tickets/);
  });

  it("returns 0 for a canceled customer", () => {
    expect(computeHealth({ ...healthy, status: "canceled" })).toMatchObject({ score: 0, band: "opgezegd" });
  });

  it("computes percentage change with a null baseline", () => {
    expect(pctChange(150, 100)).toBe(50);
    expect(pctChange(5, 0)).toBeNull();
  });
});

describe("mrrMovements", () => {
  it("decomposes new, expansion, contraction and churn", () => {
    const m = mrrMovements(
      [
        { salonId: "a", mrrCents: 10_000 },
        { salonId: "b", mrrCents: 20_000 },
        { salonId: "c", mrrCents: 15_000 },
        { salonId: "d", mrrCents: 0 },
      ],
      [
        { salonId: "a", mrrCents: 15_000 }, // expansion 5k
        { salonId: "b", mrrCents: 12_000 }, // contraction 8k
        // c churned 15k
        { salonId: "d", mrrCents: 9_900 }, // new (was 0, e.g. trial)
        { salonId: "e", mrrCents: 4_900 }, // new
      ],
    );
    expect(m).toMatchObject({
      startCents: 45_000,
      endCents: 41_800,
      newCents: 14_800,
      expansionCents: 5_000,
      contractionCents: 8_000,
      churnCents: 15_000,
      newCustomers: 2,
      churnedCustomers: 1,
    });
    // (45000 + 5000 − 8000 − 15000) / 45000
    expect(m.nrrPct).toBe(60);
    expect(m.startCents + m.newCents + m.expansionCents - m.contractionCents - m.churnCents).toBe(m.endCents);
  });

  it("has no NRR without starting revenue", () => {
    expect(mrrMovements([], [{ salonId: "a", mrrCents: 100 }]).nrrPct).toBeNull();
  });
});

describe("detectAnomalies", () => {
  const normal: UsageWindow = {
    salonId: "s",
    name: "Salon",
    recentTokens: 60_000,
    baselineDailyTokens: 50_000,
    recentConversations: 20,
    baselineDailyConversations: 18,
  };

  it("stays quiet for normal usage", () => {
    expect(detectAnomalies([normal])).toEqual([]);
  });

  it("flags a spike against the salon's own baseline, not below the noise floor", () => {
    const [a] = detectAnomalies([{ ...normal, recentTokens: 200_000 }]);
    expect(a).toMatchObject({ kind: "token_spike" });
    expect(a!.message).toMatch(/4× het normale niveau/);
    expect(detectAnomalies([{ ...normal, recentTokens: 40_000, baselineDailyTokens: 5_000 }])).toEqual([]);
  });

  it("flags heavy tokens per conversation as a possible loop", () => {
    const r = detectAnomalies([{ ...normal, recentTokens: 90_000, recentConversations: 2 }]);
    expect(r.map((a) => a.kind)).toContain("possible_loop");
  });

  it("flags a normally busy salon that went silent, first", () => {
    const r = detectAnomalies([
      { ...normal, salonId: "a", recentTokens: 200_000 },
      { ...normal, salonId: "b", recentTokens: 0, recentConversations: 0 },
    ]);
    expect(r[0]).toMatchObject({ salonId: "b", kind: "silent" });
    expect(detectAnomalies([{ ...normal, recentTokens: 0, recentConversations: 0, baselineDailyConversations: 1 }])).toEqual([]);
  });
});
