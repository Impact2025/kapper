import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const selectResults: unknown[][] = [];
const insertValuesCalls: Record<string, unknown>[] = [];
const updateCalls: unknown[] = [];

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => Promise.resolve(selectResults.shift() ?? []),
      }),
    }),
    insert: () => ({
      values: (v: Record<string, unknown>) => {
        insertValuesCalls.push(v);
        return { returning: () => Promise.resolve([{ id: "order-1" }]) };
      },
    }),
    update: () => ({ set: (v: unknown) => ({ where: () => (updateCalls.push(v), Promise.resolve()) }) }),
  },
}));

vi.mock("@/lib/customers/queries", () => ({
  upsertCustomerByPhone: vi.fn(() => Promise.resolve({ id: "cust-1" })),
}));

import { createPosSale } from "@/lib/pos/queries";

const TREATMENT = { id: "treat-1", salonId: "salon-1", name: "Knippen", priceCents: 4000, vatRatePercent: 9 };
const PRODUCT = { id: "prod-1", salonId: "salon-1", name: "Shampoo", priceCents: 1500, vatRatePercent: 21, stockQuantity: 10 };

describe("createPosSale — Fase 3 kassa", () => {
  beforeEach(() => {
    selectResults.length = 0;
    insertValuesCalls.length = 0;
    updateCalls.length = 0;
  });

  it("splits the order total across treatment (9%) and product (21%) vat rates via snapshotted vatRatePercent", async () => {
    selectResults.push([TREATMENT]); // treatments lookup
    selectResults.push([PRODUCT]); // products lookup

    const result = await createPosSale({
      salonId: "salon-1",
      customerName: "Anna Jansen",
      items: [
        { kind: "treatment", id: "treat-1", quantity: 1 },
        { kind: "product", id: "prod-1", quantity: 2 },
      ],
      paymentMethod: "pin",
    });

    expect(result).toMatchObject({ ok: true, totalCents: 4000 + 1500 * 2 });

    const orderItemInserts = insertValuesCalls.filter((v) => "unitPriceCents" in v);
    expect(orderItemInserts).toContainEqual(
      expect.objectContaining({ treatmentId: "treat-1", vatRatePercent: 9, unitPriceCents: 4000, quantity: 1 }),
    );
    expect(orderItemInserts).toContainEqual(
      expect.objectContaining({ productId: "prod-1", vatRatePercent: 21, unitPriceCents: 1500, quantity: 2 }),
    );
  });

  it("adds the tip on top of the line total without affecting vat", async () => {
    selectResults.push([TREATMENT]);

    const result = await createPosSale({
      salonId: "salon-1",
      customerName: "Anna Jansen",
      items: [{ kind: "treatment", id: "treat-1", quantity: 1 }],
      paymentMethod: "cash",
      tipCents: 500,
    });

    expect(result).toMatchObject({ ok: true, totalCents: 4500 });
  });

  it("rejects a product sale that exceeds stock", async () => {
    // Only a product is in the cart, so the treatments lookup is skipped
    // entirely (see createPosSale) — only the products query hits the db mock.
    selectResults.push([{ ...PRODUCT, stockQuantity: 1 }]);

    const result = await createPosSale({
      salonId: "salon-1",
      customerName: "Anna Jansen",
      items: [{ kind: "product", id: "prod-1", quantity: 5 }],
      paymentMethod: "pin",
    });

    expect(result).toEqual({ error: "Niet genoeg voorraad voor Shampoo." });
  });
});
