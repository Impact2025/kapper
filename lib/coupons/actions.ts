"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/dal";
import { lookupCoupon } from "@/lib/coupons/service";

export interface CouponActionState {
  ok?: boolean;
  error?: string;
}

const createSchema = z.object({
  code: z
    .string()
    .min(3, "Code is te kort.")
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "Alleen letters, cijfers, - en _."),
  type: z.enum(["percent", "fixed", "trial"]),
  value: z.coerce.number().int().min(1),
  maxRedemptions: z.coerce.number().int().min(1).optional().or(z.literal("")),
  expiresAt: z.string().optional().or(z.literal("")),
});

export async function createCoupon(
  _prev: CouponActionState | undefined,
  formData: FormData,
): Promise<CouponActionState> {
  await getCurrentUser();
  const parsed = createSchema.safeParse({
    code: formData.get("code"),
    type: formData.get("type"),
    value: formData.get("value"),
    maxRedemptions: formData.get("maxRedemptions"),
    expiresAt: formData.get("expiresAt"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ongeldige invoer." };
  }
  const d = parsed.data;

  if (d.type === "percent" && d.value > 100) {
    return { error: "Percentage kan niet hoger zijn dan 100." };
  }

  const code = d.code.trim().toUpperCase();
  if (await lookupCoupon(code)) {
    return { error: "Deze couponcode bestaat al." };
  }

  await db.insert(coupons).values({
    code,
    type: d.type,
    value: d.value,
    maxRedemptions: d.maxRedemptions ? Number(d.maxRedemptions) : null,
    expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
  });

  revalidatePath("/admin/coupons");
  return { ok: true };
}

export async function toggleCoupon(id: string, active: boolean): Promise<void> {
  await getCurrentUser();
  await db.update(coupons).set({ active }).where(eq(coupons.id, id));
  revalidatePath("/admin/coupons");
}
