import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const insertValuesCalls: unknown[] = [];
const updateSetCalls: unknown[] = [];
let selectResult: unknown[] = [];

vi.mock("@/lib/db", () => ({
  db: {
    insert: () => ({
      values: (v: unknown) => {
        insertValuesCalls.push(v);
        return Promise.resolve();
      },
    }),
    update: () => ({
      set: (v: unknown) => {
        updateSetCalls.push(v);
        return { where: () => Promise.resolve() };
      },
    }),
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => Promise.resolve(selectResult),
          }),
        }),
      }),
    }),
  },
}));

import { awardLoyaltyPoints, listTopLoyaltyCustomers } from "@/lib/loyalty/queries";

describe("awardLoyaltyPoints", () => {
  beforeEach(() => {
    insertValuesCalls.length = 0;
    updateSetCalls.length = 0;
  });

  it("awards 1 point per €10 (floored)", async () => {
    await awardLoyaltyPoints({ salonId: "s1", customerId: "c1", amountCents: 3550, reason: "Kassaverkoop" });
    expect(insertValuesCalls).toHaveLength(1);
    expect((insertValuesCalls[0] as { delta: number }).delta).toBe(3); // €35.50 -> 3 points
    expect(updateSetCalls).toHaveLength(1);
  });

  it("is a no-op for a sale under €10", async () => {
    await awardLoyaltyPoints({ salonId: "s1", customerId: "c1", amountCents: 950, reason: "Kassaverkoop" });
    expect(insertValuesCalls).toHaveLength(0);
    expect(updateSetCalls).toHaveLength(0);
  });
});

describe("listTopLoyaltyCustomers", () => {
  it("returns whatever the query resolves", async () => {
    selectResult = [{ id: "c1", name: "Anna", phone: "+31611112222", loyaltyPoints: 12 }];
    const result = await listTopLoyaltyCustomers("s1");
    expect(result).toEqual(selectResult);
  });
});
