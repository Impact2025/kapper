import { describe, it, expect } from "vitest";
import { validateCoupon, applyDiscount, type CouponLike } from "@/lib/coupons/engine";

const base: CouponLike = {
  type: "percent",
  value: 20,
  active: true,
  expiresAt: null,
  maxRedemptions: null,
  redeemed: 0,
};

describe("validateCoupon", () => {
  it("rejects a missing coupon", () => {
    expect(validateCoupon(null).valid).toBe(false);
  });

  it("rejects an inactive coupon", () => {
    expect(validateCoupon({ ...base, active: false }).valid).toBe(false);
  });

  it("rejects an expired coupon", () => {
    const res = validateCoupon(
      { ...base, expiresAt: new Date("2020-01-01") },
      new Date("2026-01-01"),
    );
    expect(res.valid).toBe(false);
  });

  it("rejects a fully redeemed coupon", () => {
    expect(validateCoupon({ ...base, maxRedemptions: 5, redeemed: 5 }).valid).toBe(false);
  });

  it("accepts a valid coupon", () => {
    expect(validateCoupon(base).valid).toBe(true);
  });

  it("accepts a not-yet-expired coupon", () => {
    const res = validateCoupon(
      { ...base, expiresAt: new Date("2026-12-31") },
      new Date("2026-06-21"),
    );
    expect(res.valid).toBe(true);
  });
});

describe("applyDiscount", () => {
  it("computes a percentage discount", () => {
    const r = applyDiscount({ ...base, type: "percent", value: 25 }, 20000);
    expect(r.discountCents).toBe(5000);
    expect(r.finalCents).toBe(15000);
    expect(r.trialDays).toBe(0);
  });

  it("caps a percentage at 100", () => {
    const r = applyDiscount({ ...base, type: "percent", value: 250 }, 10000);
    expect(r.finalCents).toBe(0);
  });

  it("computes a fixed discount and never goes negative", () => {
    const r = applyDiscount({ ...base, type: "fixed", value: 30000 }, 20000);
    expect(r.discountCents).toBe(20000);
    expect(r.finalCents).toBe(0);
  });

  it("grants trial days without changing price", () => {
    const r = applyDiscount({ ...base, type: "trial", value: 14 }, 20000);
    expect(r.trialDays).toBe(14);
    expect(r.finalCents).toBe(20000);
    expect(r.discountCents).toBe(0);
  });
});
