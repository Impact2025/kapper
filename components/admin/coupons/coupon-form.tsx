"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createCoupon } from "@/lib/coupons/actions";

const inputCls =
  "rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-sm text-body-md outline-none focus:border-primary";

export function CouponForm() {
  const [state, action, pending] = useActionState(createCoupon, undefined);
  const [type, setType] = useState<"percent" | "fixed" | "trial">("percent");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  const valueLabel =
    type === "percent" ? "Percentage (%)" : type === "fixed" ? "Bedrag (centen)" : "Trial-dagen";

  return (
    <form action={action} ref={formRef} className="grid grid-cols-1 gap-sm sm:grid-cols-2">
      <label className="flex flex-col gap-xs">
        <span className="text-label-md font-label-md text-on-surface-variant">Code</span>
        <input name="code" required placeholder="WELKOM2026" className={`${inputCls} uppercase`} />
      </label>

      <label className="flex flex-col gap-xs">
        <span className="text-label-md font-label-md text-on-surface-variant">Type</span>
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          className={inputCls}
        >
          <option value="percent">Percentage korting</option>
          <option value="fixed">Vast bedrag korting</option>
          <option value="trial">Gratis trial-dagen</option>
        </select>
      </label>

      <label className="flex flex-col gap-xs">
        <span className="text-label-md font-label-md text-on-surface-variant">{valueLabel}</span>
        <input name="value" type="number" min={1} required className={inputCls} />
      </label>

      <label className="flex flex-col gap-xs">
        <span className="text-label-md font-label-md text-on-surface-variant">
          Max. inwisselingen (optioneel)
        </span>
        <input name="maxRedemptions" type="number" min={1} className={inputCls} />
      </label>

      <label className="flex flex-col gap-xs sm:col-span-2">
        <span className="text-label-md font-label-md text-on-surface-variant">
          Verloopdatum (optioneel)
        </span>
        <input name="expiresAt" type="date" className={inputCls} />
      </label>

      {state?.error && (
        <div className="rounded-lg bg-error-container px-sm py-xs text-label-md text-on-error-container sm:col-span-2">
          {state.error}
        </div>
      )}
      {state?.ok && (
        <div className="rounded-lg bg-primary-fixed px-sm py-xs text-label-md text-on-primary-fixed sm:col-span-2">
          Coupon aangemaakt ✓
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-primary px-xl py-sm text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 soft-shadow sm:col-span-2"
      >
        {pending ? "Aanmaken…" : "Coupon aanmaken"}
      </button>
    </form>
  );
}
