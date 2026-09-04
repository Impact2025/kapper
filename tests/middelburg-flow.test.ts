import { createHmac } from "node:crypto";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// ---- lib/salon/appointments.ts — confirmAppointment DB transition ----

const selectQueue: unknown[][] = [];
const updateQueue: unknown[][] = [];

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
          returning: () => Promise.resolve(updateQueue.shift() ?? []),
        }),
      }),
    }),
    insert: () => ({
      values: () => ({
        returning: () => Promise.resolve([]),
      }),
    }),
  },
}));

import { confirmAppointment } from "@/lib/salon/appointments";
import { verifyWatiSignature } from "@/app/api/webhooks/wati/route";

describe("confirmAppointment — Middelburg-norm booking confirmation", () => {
  beforeEach(() => {
    selectQueue.length = 0;
    updateQueue.length = 0;
  });

  it("transitions a pending_confirmation appointment to confirmed with policy acceptance recorded", async () => {
    selectQueue.push([{ id: "apt-1", status: "pending_confirmation", salonId: "salon-1" }]);
    updateQueue.push([
      {
        id: "apt-1",
        status: "confirmed",
        policyAcceptedAt: new Date("2026-09-04T10:00:00.000Z"),
        confirmationChannel: "whatsapp_button",
        salonId: "salon-1",
      },
    ]);

    const result = await confirmAppointment("apt-1", "whatsapp_button");

    expect(result).toMatchObject({
      id: "apt-1",
      status: "confirmed",
      confirmationChannel: "whatsapp_button",
    });
    expect(result?.policyAcceptedAt).toBeInstanceOf(Date);
  });

  it("does nothing and returns null when the appointment is not pending_confirmation (already handled)", async () => {
    // The lookup filters on status = pending_confirmation — an already
    // confirmed/cancelled appointment simply won't match, keeping a
    // duplicate button tap or replayed webhook a no-op.
    selectQueue.push([]);

    const result = await confirmAppointment("apt-1", "whatsapp_button");

    expect(result).toBeNull();
  });
});

// ---- app/api/webhooks/wati/route.ts — HMAC signature verification ----

describe("verifyWatiSignature — WATI webhook HMAC-SHA256 verification", () => {
  const secret = "test-wati-secret";
  const body = JSON.stringify({ event: "message", waId: "31611112222", text: "hoi" });

  it("accepts a signature computed with the correct secret", () => {
    const signature = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyWatiSignature(body, signature, secret)).toBe(true);
  });

  it("rejects a signature computed with the wrong secret", () => {
    const badSignature = createHmac("sha256", "wrong-secret").update(body).digest("hex");
    expect(verifyWatiSignature(body, badSignature, secret)).toBe(false);
  });

  it("rejects a tampered body even with an otherwise-valid-looking signature", () => {
    const signature = createHmac("sha256", secret).update(body).digest("hex");
    const tamperedBody = JSON.stringify({ event: "message", waId: "31611112222", text: "gehackt" });
    expect(verifyWatiSignature(tamperedBody, signature, secret)).toBe(false);
  });

  it("rejects a missing signature", () => {
    expect(verifyWatiSignature(body, null, secret)).toBe(false);
  });
});
