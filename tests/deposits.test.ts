import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const updateWhereMock = vi.fn((_w: unknown) => Promise.resolve());
vi.mock("@/lib/db", () => ({
  db: {
    update: () => ({ set: () => ({ where: (w: unknown) => updateWhereMock(w) }) }),
  },
}));

const createSessionMock = vi.fn();
const getStripeMock = vi.fn(
  (): { checkout: { sessions: { create: typeof createSessionMock } } } | null => ({
    checkout: { sessions: { create: createSessionMock } },
  }),
);
vi.mock("@/lib/billing/stripe", () => ({
  getStripe: () => getStripeMock(),
}));

import { computeDepositRequirement, createDepositCheckoutSession } from "@/lib/payments-policy/queries";

describe("computeDepositRequirement", () => {
  it("requires no deposit when the salon hasn't enabled deposits", () => {
    const result = computeDepositRequirement({ depositRequired: false, depositCents: 5000 }, 10000);
    expect(result).toEqual({ required: false, amountCents: 0 });
  });

  it("requires no deposit under the €60 threshold even when enabled", () => {
    const result = computeDepositRequirement({ depositRequired: true, depositCents: 5000 }, 4000);
    expect(result.required).toBe(false);
  });

  it("requires the configured deposit above the €60 threshold", () => {
    const result = computeDepositRequirement({ depositRequired: true, depositCents: 5000 }, 12000);
    expect(result).toEqual({ required: true, amountCents: 5000 });
  });

  it("requires no deposit when no amount is configured", () => {
    const result = computeDepositRequirement({ depositRequired: true, depositCents: 0 }, 12000);
    expect(result.required).toBe(false);
  });
});

describe("createDepositCheckoutSession", () => {
  beforeEach(() => {
    createSessionMock.mockReset();
    getStripeMock.mockReset().mockReturnValue({ checkout: { sessions: { create: createSessionMock } } });
    updateWhereMock.mockReset().mockResolvedValue(undefined);
  });

  it("returns null when Stripe isn't configured", async () => {
    getStripeMock.mockReturnValue(null);

    const result = await createDepositCheckoutSession({
      appointmentId: "apt-1",
      salonId: "salon-1",
      salonName: "Kapsalon Test",
      treatmentName: "Balayage",
      amountCents: 5000,
    });

    expect(result).toBeNull();
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  it("creates a Stripe Checkout session and stores the session id on the appointment", async () => {
    createSessionMock.mockResolvedValue({ url: "https://checkout.stripe.com/x", id: "cs_1" });

    const result = await createDepositCheckoutSession({
      appointmentId: "apt-1",
      salonId: "salon-1",
      salonName: "Kapsalon Test",
      treatmentName: "Balayage",
      amountCents: 5000,
    });

    expect(result).toEqual({ url: "https://checkout.stripe.com/x", sessionId: "cs_1" });
    expect(createSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "payment",
        metadata: expect.objectContaining({ kind: "appointment_deposit", appointmentId: "apt-1" }),
      }),
    );
    expect(updateWhereMock).toHaveBeenCalledTimes(1);
  });
});
