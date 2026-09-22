import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const appointmentUpdateReturningQueue: unknown[][] = [];
const customerUpdateReturningQueue: unknown[][] = [];
const blockedUpdateCalls: unknown[] = [];

vi.mock("@/lib/db", () => ({
  db: {
    update: () => ({
      set: (values: unknown) => ({
        where: () => ({
          returning: () => {
            // Distinguish appointments vs customers vs the blocked-flag update
            // by which queue still has rows — matches the call order in
            // recordNoShow (appointment first, then customer noShowCount,
            // then the optional blockedFromOnlineBooking update, which has
            // no .returning()).
            if (appointmentUpdateReturningQueue.length && !("noShowCount" in (values as object))) {
              return Promise.resolve(appointmentUpdateReturningQueue.shift());
            }
            return Promise.resolve(customerUpdateReturningQueue.shift() ?? []);
          },
        }),
      }),
    }),
  },
}));

vi.mock("@/lib/analytics/track", () => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/mail/resend", () => ({ sendEmail: vi.fn() }));
vi.mock("@/lib/mail/templates", () => ({ simpleEmail: vi.fn(() => "<html></html>") }));
vi.mock("@/lib/observability", () => ({ captureError: vi.fn() }));

import { recordNoShow } from "@/lib/payments-policy/queries";

describe("recordNoShow — three-strikes no-show policy", () => {
  beforeEach(() => {
    appointmentUpdateReturningQueue.length = 0;
    customerUpdateReturningQueue.length = 0;
    blockedUpdateCalls.length = 0;
  });

  it("gives coulance on the first no-show — not blocked", async () => {
    appointmentUpdateReturningQueue.push([
      {
        id: "apt-1",
        salonId: "salon-1",
        customerId: "cust-1",
        serviceType: "Knippen",
        appointmentTime: new Date("2026-09-20T10:00:00Z"),
      },
    ]);
    customerUpdateReturningQueue.push([
      { id: "cust-1", name: "Anna", email: null, noShowCount: 1, blockedFromOnlineBooking: false },
    ]);

    const result = await recordNoShow("salon-1", "apt-1", "Kapsalon Test");

    expect(result).toEqual({ ok: true, blocked: false });
  });

  it("blocks online booking from the second no-show onward", async () => {
    appointmentUpdateReturningQueue.push([
      {
        id: "apt-2",
        salonId: "salon-1",
        customerId: "cust-1",
        serviceType: "Knippen",
        appointmentTime: new Date("2026-09-20T10:00:00Z"),
      },
    ]);
    customerUpdateReturningQueue.push([
      { id: "cust-1", name: "Anna", email: null, noShowCount: 2, blockedFromOnlineBooking: false },
    ]);
    customerUpdateReturningQueue.push([]); // the blockedFromOnlineBooking update (no .returning() consumed meaningfully)

    const result = await recordNoShow("salon-1", "apt-2", "Kapsalon Test");

    expect(result).toEqual({ ok: true, blocked: true });
  });

  it("returns an error for an appointment belonging to a different salon", async () => {
    appointmentUpdateReturningQueue.push([
      { id: "apt-3", salonId: "salon-other", customerId: "cust-1", serviceType: "Knippen", appointmentTime: new Date() },
    ]);

    const result = await recordNoShow("salon-1", "apt-3", "Kapsalon Test");

    expect(result).toEqual({ error: "Onbekende afspraak." });
  });
});
