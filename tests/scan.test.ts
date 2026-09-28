import { describe, it, expect } from "vitest";
import { computeRevenue, scanChecks } from "@/lib/scan/run-scan";
import { scanProfileFor } from "@/lib/scan/profiles";
import { verticalRewrite } from "@/lib/verticals/routing";
import { HOVENIER_VERTICAL, LOODGIETER_VERTICAL } from "@/lib/verticals";

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

describe("scan per vertical", () => {
  it("keeps the kapper baseline when no vertical is given", () => {
    expect(computeRevenue(6, "kapper")).toEqual(computeRevenue(6));
    expect(computeRevenue().savingsLabel).toBe("No-show besparing");
  });

  it("uses the trade profile for loodgieter and hovenier", () => {
    for (const vertical of ["loodgieter", "hovenier"]) {
      const p = scanProfileFor(vertical)!;
      const r = computeRevenue(undefined, vertical);
      expect(r.avgTicket).toBe(p.avgTicket);
      expect(r.missedCallsPerMonth).toBe(Math.round(p.sizeDefault * p.missedCallsPerUnit));
      expect(r.totalMonthly).toBe(r.extraBookings * r.avgTicket + r.noShowSavings);
      expect(r.bookingsLabel).toBe("Extra klussen");
    }
  });

  it("has no scan for verticals without a profile", () => {
    expect(scanProfileFor("schilder")).toBeNull();
    expect(scanProfileFor("kozijn")).toBeNull();
  });

  it("builds trade-specific checks", () => {
    const checks = scanChecks(scanProfileFor("loodgieter")!, 90, 50);
    expect(checks[0]!.ok).toBe(true);
    expect(checks[1]!.hint).toContain("loodgieter [stad]");
    expect(checks.map((c) => c.label)).not.toContain("No-show preventie");
  });

  it("routes /scan on a trade domain to that vertical's site", () => {
    expect(verticalRewrite("/scan", LOODGIETER_VERTICAL)).toEqual({ pathname: "/sites/loodgieter/scan" });
    expect(verticalRewrite("/scan", HOVENIER_VERTICAL)).toEqual({ pathname: "/sites/hovenier/scan" });
  });
});
