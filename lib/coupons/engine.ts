export type CouponType = "percent" | "fixed" | "trial";

export interface CouponLike {
  type: CouponType;
  value: number; // percent (0-100), euro cents, or trial days
  active: boolean;
  expiresAt: Date | null;
  maxRedemptions: number | null;
  redeemed: number;
}

export type CouponValidation =
  | { valid: true }
  | { valid: false; reason: string };

/** Pure validation of a coupon's redeemability at a point in time. */
export function validateCoupon(
  coupon: CouponLike | null | undefined,
  now: Date = new Date(),
): CouponValidation {
  if (!coupon) return { valid: false, reason: "Couponcode niet gevonden." };
  if (!coupon.active) return { valid: false, reason: "Deze coupon is niet meer actief." };
  if (coupon.expiresAt && coupon.expiresAt.getTime() < now.getTime()) {
    return { valid: false, reason: "Deze coupon is verlopen." };
  }
  if (coupon.maxRedemptions != null && coupon.redeemed >= coupon.maxRedemptions) {
    return { valid: false, reason: "Deze coupon is volledig ingewisseld." };
  }
  return { valid: true };
}

export interface DiscountResult {
  /** Final price in euro cents after discount (never below 0). */
  finalCents: number;
  /** Discount applied in euro cents. */
  discountCents: number;
  /** Free trial days granted (for `trial` coupons). */
  trialDays: number;
}

/** Pure discount computation. `priceCents` is the plan's monthly price in cents. */
export function applyDiscount(
  coupon: CouponLike,
  priceCents: number,
): DiscountResult {
  let discountCents = 0;
  let trialDays = 0;

  switch (coupon.type) {
    case "percent": {
      const pct = Math.max(0, Math.min(100, coupon.value));
      discountCents = Math.round((priceCents * pct) / 100);
      break;
    }
    case "fixed": {
      discountCents = Math.min(priceCents, Math.max(0, coupon.value));
      break;
    }
    case "trial": {
      trialDays = Math.max(0, coupon.value);
      break;
    }
  }

  return {
    finalCents: Math.max(0, priceCents - discountCents),
    discountCents,
    trialDays,
  };
}
