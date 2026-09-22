import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const selectQueue: unknown[][] = [];
const updateReturningQueue: unknown[][] = [];
const deleteReturningQueue: unknown[][] = [];
let deleteCallCount = 0;

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(selectQueue.shift() ?? []),
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve(updateReturningQueue.shift() ?? []),
        }),
      }),
    }),
    delete: () => ({
      where: () => {
        deleteCallCount++;
        const result = deleteReturningQueue.shift() ?? [];
        const p: Promise<unknown[]> & { returning?: () => Promise<unknown[]> } = Promise.resolve(result);
        p.returning = () => Promise.resolve(result);
        return p;
      },
    }),
  },
}));

const trackEventSpy = vi.fn();
vi.mock("@/lib/analytics/track", () => ({ trackEvent: (input: unknown) => trackEventSpy(input) }));

import { purgeCustomerData } from "@/lib/compliance/purge";

describe("purgeCustomerData", () => {
  beforeEach(() => {
    selectQueue.length = 0;
    updateReturningQueue.length = 0;
    deleteReturningQueue.length = 0;
    deleteCallCount = 0;
    trackEventSpy.mockClear();
  });

  it("returns an error for an unknown customer", async () => {
    selectQueue.push([]); // customer lookup -> none
    const result = await purgeCustomerData("salon-1", "cust-404");
    expect(result).toEqual({ error: "Onbekende klant." });
  });

  it("anonymizes appointments/orders, deletes conversations and the customer, and logs the purge", async () => {
    selectQueue.push([{ id: "cust-1", phone: "+31611112222" }]); // customer lookup
    updateReturningQueue.push([{ id: "apt-1" }, { id: "apt-2" }]); // appointments anonymized
    updateReturningQueue.push([{ id: "order-1" }]); // orders anonymized
    deleteReturningQueue.push([{ id: "conv-1" }]); // conversations deleted

    const result = await purgeCustomerData("salon-1", "cust-1");

    expect(result).toEqual({
      conversationsDeleted: 1,
      appointmentsAnonymized: 2,
      ordersAnonymized: 1,
    });
    // Two deletes: conversations (with .returning()) and the customer row itself.
    expect(deleteCallCount).toBe(2);
    expect(trackEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "gdpr_purge",
        salonId: "salon-1",
        props: expect.objectContaining({
          customerId: "cust-1",
          conversationsDeleted: 1,
          appointmentsAnonymized: 2,
          ordersAnonymized: 1,
        }),
      }),
    );
  });

  it("handles a customer with no appointments, orders, or conversations", async () => {
    selectQueue.push([{ id: "cust-2", phone: "+31699998888" }]);
    updateReturningQueue.push([]); // no appointments
    updateReturningQueue.push([]); // no orders
    deleteReturningQueue.push([]); // no conversations

    const result = await purgeCustomerData("salon-1", "cust-2");
    expect(result).toEqual({ conversationsDeleted: 0, appointmentsAnonymized: 0, ordersAnonymized: 0 });
  });
});
