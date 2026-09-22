import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

const rows: unknown[] = [];
vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        innerJoin: () => ({
          where: () => Promise.resolve(rows),
        }),
      }),
    }),
  },
}));

import { getKasopmaak } from "@/lib/pos/queries";

describe("getKasopmaak — dagafsluiting", () => {
  it("groups totals by payment method and splits vat by rate, adding tip once per order", async () => {
    rows.length = 0;
    rows.push(
      // Order 1: one treatment (9%) + one product (21%), paid by pin, €5 tip
      {
        orderId: "order-1",
        paymentMethod: "pin",
        tipCents: 500,
        createdAt: new Date("2026-09-22T09:00:00Z"),
        unitPriceCents: 4000,
        quantity: 1,
        vatRatePercent: 9,
      },
      {
        orderId: "order-1",
        paymentMethod: "pin",
        tipCents: 500,
        createdAt: new Date("2026-09-22T09:00:00Z"),
        unitPriceCents: 1500,
        quantity: 1,
        vatRatePercent: 21,
      },
      // Order 2: cash, no tip
      {
        orderId: "order-2",
        paymentMethod: "cash",
        tipCents: 0,
        createdAt: new Date("2026-09-22T10:00:00Z"),
        unitPriceCents: 3000,
        quantity: 1,
        vatRatePercent: 9,
      },
    );

    const summary = await getKasopmaak("salon-1", "2026-09-22");

    expect(summary.orderCount).toBe(2);
    expect(summary.tipTotalCents).toBe(500);
    expect(summary.byPaymentMethod.pin).toBe(500 + 4000 + 1500);
    expect(summary.byPaymentMethod.cash).toBe(3000);
    expect(summary.vatBreakdown[9]?.subtotalCents).toBeGreaterThan(0);
    expect(summary.vatBreakdown[21]?.subtotalCents).toBeGreaterThan(0);
    // 9% vat on 7000 cents (4000 + 3000) combined excl-vat + vat should reconstruct close to the gross
    const nine = summary.vatBreakdown[9]!;
    expect(nine.subtotalCents + nine.vatCents).toBe(4000 + 3000);
    const twentyOne = summary.vatBreakdown[21]!;
    expect(twentyOne.subtotalCents + twentyOne.vatCents).toBe(1500);
    expect(summary.totalCents).toBe(4000 + 1500 + 3000 + 500);
  });

  it("uses Amsterdam wall-clock date, not UTC — 23:50 UTC in September is already the next Amsterdam day (CEST, UTC+2)", async () => {
    rows.length = 0;
    rows.push({
      orderId: "order-3",
      paymentMethod: "pin",
      tipCents: 0,
      createdAt: new Date("2026-09-21T23:50:00Z"), // 01:50 Amsterdam time on 2026-09-22
      unitPriceCents: 2000,
      quantity: 1,
      vatRatePercent: 9,
    });

    const summaryFor22nd = await getKasopmaak("salon-1", "2026-09-22");
    expect(summaryFor22nd.orderCount).toBe(1);

    const summaryFor21st = await getKasopmaak("salon-1", "2026-09-21");
    expect(summaryFor21st.orderCount).toBe(0);
  });
});
