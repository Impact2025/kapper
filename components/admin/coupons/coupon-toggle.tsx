"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleCoupon } from "@/lib/coupons/actions";

export function CouponToggle({ id, active }: { id: string; active: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await toggleCoupon(id, !active);
          router.refresh();
        })
      }
      className={
        active
          ? "rounded-full bg-primary-fixed-dim px-sm py-[2px] text-label-sm font-label-sm text-on-primary-fixed transition-opacity hover:opacity-80 disabled:opacity-50"
          : "rounded-full bg-surface-container-high px-sm py-[2px] text-label-sm font-label-sm text-on-surface-variant transition-opacity hover:opacity-80 disabled:opacity-50"
      }
    >
      {active ? "Actief" : "Inactief"}
    </button>
  );
}
