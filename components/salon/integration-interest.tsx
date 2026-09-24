"use client";

import { useActionState } from "react";
import { requestIntegrationAction } from "@/lib/salon/actions";
import { Icon } from "@/components/ui/icon";

/** "Binnenkort" koppeling: één klik zegt dat je hem wilt — bepaalt de volgorde waarin we bouwen. */
export function IntegrationInterestButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(requestIntegrationAction, undefined);
  if (state?.success) {
    return (
      <span className="inline-flex items-center gap-xs text-label-md text-primary">
        <Icon name="check_circle" filled className="text-[18px]" />
        Genoteerd — we laten het weten
      </span>
    );
  }
  return (
    <form action={action}>
      <input type="hidden" name="integration" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-outline-variant px-md py-xs text-label-md text-on-surface transition-colors hover:bg-surface-container disabled:opacity-50"
      >
        {pending ? "…" : "Ik wil deze koppeling"}
      </button>
      {state?.error && <span className="ml-sm text-label-sm text-error">{state.error}</span>}
    </form>
  );
}
