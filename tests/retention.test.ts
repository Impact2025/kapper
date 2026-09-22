import { describe, it, expect } from "vitest";
import { shouldSendRetentionMessage } from "@/lib/retention/logic";

const day = 24 * 3600_000;

describe("shouldSendRetentionMessage", () => {
  const now = new Date("2026-06-01T12:00:00.000Z");

  it("skips a customer with only one past visit (no rhythm to compare)", () => {
    expect(
      shouldSendRetentionMessage({
        pastAppointmentTimes: [new Date(now.getTime() - 40 * day)],
        hasUpcoming: false,
        lastRetentionSentAt: null,
        now,
      }),
    ).toBe(false);
  });

  it("skips a customer who already has an upcoming appointment", () => {
    expect(
      shouldSendRetentionMessage({
        pastAppointmentTimes: [new Date(now.getTime() - 80 * day), new Date(now.getTime() - 40 * day)],
        hasUpcoming: true,
        lastRetentionSentAt: null,
        now,
      }),
    ).toBe(false);
  });

  it("sends when a customer is well past their own average interval", () => {
    // usual rhythm: every ~30 days, but it's now been 60 days since the last visit
    expect(
      shouldSendRetentionMessage({
        pastAppointmentTimes: [new Date(now.getTime() - 90 * day), new Date(now.getTime() - 60 * day)],
        hasUpcoming: false,
        lastRetentionSentAt: null,
        now,
      }),
    ).toBe(true);
  });

  it("does not send when the customer is still within their normal rhythm", () => {
    // usual rhythm: every ~30 days, only 20 days since the last visit
    expect(
      shouldSendRetentionMessage({
        pastAppointmentTimes: [new Date(now.getTime() - 50 * day), new Date(now.getTime() - 20 * day)],
        hasUpcoming: false,
        lastRetentionSentAt: null,
        now,
      }),
    ).toBe(false);
  });

  it("respects the 30-day cooldown even if otherwise overdue", () => {
    expect(
      shouldSendRetentionMessage({
        pastAppointmentTimes: [new Date(now.getTime() - 90 * day), new Date(now.getTime() - 60 * day)],
        hasUpcoming: false,
        lastRetentionSentAt: new Date(now.getTime() - 5 * day),
        now,
      }),
    ).toBe(false);
  });

  it("sends again once the cooldown has passed and they're still overdue", () => {
    expect(
      shouldSendRetentionMessage({
        pastAppointmentTimes: [new Date(now.getTime() - 90 * day), new Date(now.getTime() - 60 * day)],
        hasUpcoming: false,
        lastRetentionSentAt: new Date(now.getTime() - 31 * day),
        now,
      }),
    ).toBe(true);
  });
});
