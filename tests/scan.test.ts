import { describe, it, expect } from "vitest";
import { computeRevenue } from "@/lib/scan/run-scan";

describe("computeRevenue", () => {
  it("uses 6-chair baseline by default", () => {
    const r = computeRevenue();
    expect(r.missedCallsPerMonth).toBe(40);
    expect(r.avgTicket).toBe(65);
    expect(r.recoveredLeads).toBe(Math.round(40 * 0.6));
    expect(r.extraBookings).toBe(Math.round(Math.round(40 * 0.6) * 0.3));
    expect(r.noShowSavings).toBe(500);
    expect(r.totalYearly).toBe(r.totalMonthly * 12);
  });

  it("scales linearly with chair count", () => {
    const single = computeRevenue(1);
    const sixChair = computeRevenue(6);
    expect(single.missedCallsPerMonth).toBe(Math.round((1 / 6) * 40));
    expect(sixChair.missedCallsPerMonth).toBe(40);
  });

  it("totalMonthly equals bookings revenue plus no-show savings", () => {
    const r = computeRevenue(6);
    expect(r.totalMonthly).toBe(r.extraBookings * r.avgTicket + r.noShowSavings);
  });

  it("totalYearly is twelve times totalMonthly", () => {
    const r = computeRevenue(3);
    expect(r.totalYearly).toBe(r.totalMonthly * 12);
  });

  it("noShowSavings scales with chairs", () => {
    expect(computeRevenue(6).noShowSavings).toBe(500);
    expect(computeRevenue(12).noShowSavings).toBe(1000);
  });
});
