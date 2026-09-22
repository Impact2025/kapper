import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const selectQueue: unknown[][] = [];
const updateReturningQueue: unknown[][] = [];
const insertReturningQueue: unknown[][] = [];

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
    insert: () => ({
      values: () => ({
        returning: () => Promise.resolve(insertReturningQueue.shift() ?? []),
      }),
    }),
  },
}));

import { upsertCustomerByPhone } from "@/lib/customers/queries";

describe("upsertCustomerByPhone", () => {
  beforeEach(() => {
    selectQueue.length = 0;
    updateReturningQueue.length = 0;
    insertReturningQueue.length = 0;
  });

  it("creates a new customer when no match exists for (salonId, phone)", async () => {
    selectQueue.push([]); // findCustomerByPhone -> none
    insertReturningQueue.push([
      { id: "cust-1", salonId: "salon-1", phone: "+31611112222", name: "Anna Jansen", source: "ai_whatsapp" },
    ]);

    const customer = await upsertCustomerByPhone({
      salonId: "salon-1",
      phone: "+31 6 1111 2222",
      name: "Anna Jansen",
      source: "ai_whatsapp",
    });

    expect(customer.id).toBe("cust-1");
    expect(insertReturningQueue).toHaveLength(0); // consumed
  });

  it("returns the existing customer unchanged when the name matches", async () => {
    selectQueue.push([{ id: "cust-1", salonId: "salon-1", phone: "+31611112222", name: "Anna Jansen" }]);

    const customer = await upsertCustomerByPhone({
      salonId: "salon-1",
      phone: "+31611112222",
      name: "Anna Jansen",
      source: "ai_whatsapp",
    });

    expect(customer.id).toBe("cust-1");
    expect(updateReturningQueue).toHaveLength(0); // no update needed
  });

  it("updates the stored name when a returning customer's name has changed", async () => {
    selectQueue.push([{ id: "cust-1", salonId: "salon-1", phone: "+31611112222", name: "Anna Jansen" }]);
    updateReturningQueue.push([{ id: "cust-1", salonId: "salon-1", phone: "+31611112222", name: "Anna de Vries" }]);

    const customer = await upsertCustomerByPhone({
      salonId: "salon-1",
      phone: "+31611112222",
      name: "Anna de Vries",
      source: "ai_whatsapp",
    });

    expect(customer.name).toBe("Anna de Vries");
  });
});
