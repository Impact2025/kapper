"use client";

import { useActionState } from "react";
import { createCheckout } from "@/lib/billing/checkout";

const inputCls =
  "rounded-lg border border-outline-variant bg-white px-sm py-sm text-body-md outline-none focus:border-primary";

export function CheckoutForm({
  plan,
  vertical,
  businessLabel = "Salonnaam",
  businessPlaceholder = "Salon Bella",
  emailPlaceholder = "jij@salon.nl",
}: {
  plan: string;
  /** Which trade this signup is for; the server also derives it from the host. */
  vertical?: string;
  businessLabel?: string;
  businessPlaceholder?: string;
  emailPlaceholder?: string;
}) {
  const [state, action, pending] = useActionState(createCheckout, undefined);

  return (
    <form action={action} className="flex flex-col gap-md">
      <input type="hidden" name="plan" value={plan} />
      {vertical && <input type="hidden" name="vertical" value={vertical} />}

      <label className="flex flex-col gap-xs">
        <span className="text-label-md font-label-md text-on-surface-variant">{businessLabel}</span>
        <input name="salonName" required placeholder={businessPlaceholder} className={inputCls} />
      </label>

      <label className="flex flex-col gap-xs">
        <span className="text-label-md font-label-md text-on-surface-variant">E-mailadres</span>
        <input name="email" type="email" required placeholder={emailPlaceholder} className={inputCls} />
      </label>

      <label className="flex flex-col gap-xs">
        <span className="text-label-md font-label-md text-on-surface-variant">
          Couponcode (optioneel)
        </span>
        <input name="coupon" placeholder="WELKOM2026" className={`${inputCls} uppercase`} />
      </label>

      {state?.error && (
        <div role="alert" className="rounded-lg bg-error-container px-sm py-sm text-label-md text-on-error-container">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-base rounded-full bg-primary px-xl py-sm text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 soft-shadow"
      >
        {pending ? "Bezig…" : "Doorgaan naar betalen"}
      </button>
      <p className="text-center text-label-sm text-on-surface-variant">
        Je wordt veilig doorgestuurd naar Stripe. Maandelijks opzegbaar.
      </p>
    </form>
  );
}
