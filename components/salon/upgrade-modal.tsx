"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/admin/ui";
import { formatEur } from "@/lib/utils";
import { createUpgrade } from "@/lib/billing/upgrade";
import type { Plan } from "@/lib/plans";

interface Props {
  upgradePlans: Plan[];
  triggerLabel?: string;
  triggerClass?: string;
}

export function UpgradeModal({
  upgradePlans,
  triggerLabel = "Upgrade",
  triggerClass,
}: Props) {
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>(upgradePlans[0]?.id ?? "");
  const [state, action, pending] = useActionState(createUpgrade, undefined);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [open]);

  // Re-open default selection when modal opens
  useEffect(() => {
    if (open && upgradePlans[0]) setSelectedPlan(upgradePlans[0].id);
  }, [open, upgradePlans]);

  if (upgradePlans.length === 0) return null;

  const chosen = upgradePlans.find((p) => p.id === selectedPlan) ?? upgradePlans[0]!;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          triggerClass ??
          "flex w-full items-center justify-center gap-base rounded-full border border-primary px-md py-sm text-label-md font-label-md text-primary transition-all hover:bg-primary hover:text-on-primary"
        }
      >
        {triggerLabel}
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        className="m-auto max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-outline-variant/40 bg-surface p-0 shadow-xl backdrop:bg-black/40"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-outline-variant/40 bg-surface px-lg py-md">
          <h2 className="font-headline-md text-headline-md text-on-surface">Plan kiezen</h2>
          <button
            onClick={() => setOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high"
            aria-label="Sluiten"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>

        <div className="p-lg">
          {/* Plan selection cards */}
          <div className="mb-lg flex flex-col gap-sm">
            {upgradePlans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                className={`w-full rounded-xl border p-md text-left transition-all ${
                  selectedPlan === plan.id
                    ? "border-primary bg-primary-fixed/20 ring-1 ring-primary"
                    : "border-outline-variant/40 bg-surface-container-lowest hover:border-primary/40"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-xs">
                      <span className="font-headline-md text-headline-md text-on-surface">{plan.name}</span>
                      {plan.popular && <Badge tone="primary">Populair</Badge>}
                    </div>
                    <p className="mt-xs text-label-sm text-on-surface-variant">{plan.tagline}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-headline-md text-headline-md text-on-surface">{formatEur(plan.price)}</div>
                    <div className="text-label-sm text-on-surface-variant">/maand</div>
                  </div>
                </div>
                <ul className="mt-sm flex flex-col gap-xs">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-xs text-label-sm text-on-surface">
                      <Icon name="check" filled className="shrink-0 text-[16px] text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          {state?.error && (
            <p className="mb-md rounded-lg bg-error-container px-md py-sm text-label-sm text-on-error-container">
              {state.error}
            </p>
          )}

          {/* Submit form */}
          <form action={action}>
            <input type="hidden" name="plan" value={chosen.id} />
            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center gap-sm rounded-full bg-primary px-lg py-sm text-label-md font-label-md text-on-primary transition-all hover:opacity-90 disabled:opacity-60"
            >
              {pending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary/30 border-t-on-primary" />
                  Bezig…
                </>
              ) : (
                <>
                  Upgraden naar {chosen.name} — {formatEur(chosen.price)}/mnd
                  <Icon name="arrow_forward" className="text-[18px]" />
                </>
              )}
            </button>
          </form>

          <p className="mt-sm text-center text-label-sm text-on-surface-variant">
            Je wordt doorgestuurd naar onze beveiligde betaalpagina (Stripe).
          </p>
        </div>
      </dialog>
    </>
  );
}
