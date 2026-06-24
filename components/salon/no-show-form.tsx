"use client";

import { useActionState } from "react";
import { updateNoShowPolicy } from "@/lib/salon/actions";
import { Icon } from "@/components/ui/icon";

interface Policy {
  enabled: boolean;
  freeCancelHours: number;
  chargePercent: number;
  depositRequired: boolean;
  depositCents: number;
  reminderHours: number[];
}

const inputCls =
  "w-full rounded-lg border border-outline-variant bg-surface px-sm py-sm text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary";

const cardCls =
  "rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-md soft-shadow";

export function NoShowForm({ policy }: { policy: Policy }) {
  const [state, action, pending] = useActionState(updateNoShowPolicy, undefined);

  return (
    <form action={action} className="flex flex-col gap-md">
      {/* Enable toggle */}
      <div className={cardCls}>
        <div className="flex items-center justify-between gap-md">
          <div>
            <h3 className="text-body-md font-medium text-on-surface">No-show beleid activeren</h3>
            <p className="mt-xs text-label-sm text-on-surface-variant">
              Schakel in om kosten te kunnen innen bij no-shows en te laat annuleren
            </p>
          </div>
          {/* CSS-only toggle — thumb and track are siblings of the peer input */}
          <label className="relative inline-flex shrink-0 cursor-pointer items-center">
            <input
              type="checkbox"
              name="enabled"
              value="true"
              defaultChecked={policy.enabled}
              className="peer sr-only"
            />
            <span className="block h-6 w-11 rounded-full bg-surface-container-highest transition-colors duration-200 peer-checked:bg-primary" />
            <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-5" />
          </label>
        </div>
      </div>

      {/* Cancellation window */}
      <div className={cardCls}>
        <h3 className="text-body-md font-medium text-on-surface mb-sm">
          Kosteloos annuleren tot
        </h3>
        <div className="flex items-center gap-sm">
          <input
            type="number"
            name="freeCancelHours"
            defaultValue={policy.freeCancelHours}
            min="0"
            max="168"
            className="w-24 rounded-lg border border-outline-variant bg-surface px-sm py-xs text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="text-body-md text-on-surface-variant">uur voor de afspraak</span>
        </div>
        <p className="mt-xs text-label-sm text-on-surface-variant">
          Aanbevolen: 24 uur (juridisch het meest gehanteerd)
        </p>
      </div>

      {/* Charge percentage */}
      <div className={cardCls}>
        <h3 className="text-body-md font-medium text-on-surface mb-sm">
          Kosten bij no-show of te late annulering
        </h3>
        <div className="flex items-center gap-sm">
          <input
            type="number"
            name="chargePercent"
            defaultValue={policy.chargePercent}
            min="0"
            max="100"
            className="w-24 rounded-lg border border-outline-variant bg-surface px-sm py-xs text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="text-body-md text-on-surface-variant">% van de behandelprijs</span>
        </div>
        <p className="mt-xs text-label-sm text-on-surface-variant">
          100% is gangbaar; 50% bij eerste overtreding is ook mogelijk
        </p>
      </div>

      {/* Deposit */}
      <div className={cardCls}>
        <div className="mb-sm flex items-start gap-sm">
          <input
            type="checkbox"
            name="depositRequired"
            value="true"
            id="depositRequired"
            defaultChecked={policy.depositRequired}
            className="mt-1 h-4 w-4 rounded border-outline-variant accent-primary"
          />
          <label htmlFor="depositRequired" className="cursor-pointer">
            <span className="text-body-md font-medium text-on-surface">
              Aanbetaling vereisen
            </span>
            <p className="text-label-sm text-on-surface-variant mt-xs">
              Aanbevolen voor nieuwe klanten en behandelingen boven €60
            </p>
          </label>
        </div>
        <div className="ml-6 flex items-center gap-sm">
          <span className="text-body-md text-on-surface-variant">€</span>
          <input
            type="number"
            name="depositEuros"
            defaultValue={Math.round(policy.depositCents / 100)}
            min="0"
            max="500"
            placeholder="25"
            className="w-24 rounded-lg border border-outline-variant bg-surface px-sm py-xs text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="text-body-md text-on-surface-variant">per afspraak</span>
        </div>
        <p className="ml-6 mt-xs text-label-sm text-on-surface-variant">
          Verwerkt via Stripe Card-on-File (PCI-compliant, nooit handmatig opgeslagen)
        </p>
      </div>

      {/* Reminders */}
      <div className={cardCls}>
        <h3 className="text-body-md font-medium text-on-surface mb-sm">
          Automatische herinneringen
        </h3>
        <div className="flex flex-col gap-sm">
          {[
            { hours: 48, label: "48 uur van tevoren" },
            { hours: 24, label: "24 uur van tevoren" },
          ].map(({ hours, label }) => (
            <label key={hours} className="flex cursor-pointer items-center gap-sm">
              <input
                type="checkbox"
                name="reminderHours"
                value={String(hours)}
                defaultChecked={policy.reminderHours.includes(hours)}
                className="h-4 w-4 rounded border-outline-variant accent-primary"
              />
              <span className="text-body-md text-on-surface">{label}</span>
            </label>
          ))}
        </div>
        <p className="mt-sm text-label-sm text-on-surface-variant">
          Verstuurd via SMS en/of WhatsApp — gemiddeld 70% minder no-shows
        </p>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-md">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-base rounded-full bg-primary px-md py-sm text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 soft-shadow disabled:opacity-50"
        >
          {pending ? (
            <>
              <Icon name="refresh" className="text-[18px] animate-spin" />
              Opslaan…
            </>
          ) : (
            <>
              <Icon name="save" className="text-[18px]" />
              Beleid opslaan
            </>
          )}
        </button>

        {state?.success && (
          <div className="flex items-center gap-xs text-label-md text-primary">
            <Icon name="check_circle" filled className="text-[18px]" />
            Opgeslagen
          </div>
        )}

        {state?.error && (
          <div className="flex items-center gap-xs text-label-md text-error">
            <Icon name="error" filled className="text-[18px]" />
            {state.error}
          </div>
        )}
      </div>
    </form>
  );
}
