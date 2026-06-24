import "server-only";
import { eq, sql, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { coupons, couponRedemptions } from "@/lib/db/schema";
import { env } from "@/lib/env";
import {
  validateCoupon,
  applyDiscount,
  type CouponLike,
  type DiscountResult,
} from "@/lib/coupons/engine";

export interface CouponPreview {
  ok: boolean;
  error?: string;
  code?: string;
  discount?: DiscountResult;
  couponId?: string;
}

export async function lookupCoupon(code: string) {
  if (!env.DATABASE_URL) return null;
  const normalized = code.trim().toUpperCase();
  const [row] = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, normalized))
    .limit(1);
  return row ?? null;
}

/** Validate a coupon code and compute the discount on a given price (cents). */
export async function previewCoupon(
  code: string,
  priceCents: number,
): Promise<CouponPreview> {
  const row = await lookupCoupon(code);
  const coupon: CouponLike | null = row
    ? {
        type: row.type,
        value: row.value,
        active: row.active,
        expiresAt: row.expiresAt,
        maxRedemptions: row.maxRedemptions,
        redeemed: row.redeemed,
      }
    : null;

  const result = validateCoupon(coupon);
  if (!result.valid) return { ok: false, error: result.reason };

  return {
    ok: true,
    code: row!.code,
    couponId: row!.id,
    discount: applyDiscount(coupon!, priceCents),
  };
}

/** Record a redemption and increment the counter. Best-effort, idempotent-ish. */
export async function redeemCoupon(couponId: string, salonId?: string): Promise<void> {
  if (!env.DATABASE_URL) return;
  await db
    .update(coupons)
    .set({ redeemed: sql`${coupons.redeemed} + 1` })
    .where(eq(coupons.id, couponId));
  await db.insert(couponRedemptions).values({ couponId, salonId: salonId ?? null });
}

export interface CouponListItem {
  id: string;
  code: string;
  type: "percent" | "fixed" | "trial";
  value: number;
  active: boolean;
  redeemed: number;
  maxRedemptions: number | null;
  expiresAt: Date | null;
  createdAt: Date;
}

export async function listCoupons(): Promise<CouponListItem[]> {
  if (!env.DATABASE_URL) return [];
  return db.select().from(coupons).orderBy(desc(coupons.createdAt));
}
