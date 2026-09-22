"use client";

import { useActionState, useRef, useEffect } from "react";
import { addTreatmentCardAction } from "@/lib/dossier/actions";
import { Icon } from "@/components/ui/icon";

const inputCls =
  "w-full rounded-lg border border-outline-variant bg-surface px-sm py-xs text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary";

export function TreatmentCardForm({ customerId }: { customerId: string }) {
  const [state, action, pending] = useActionState(addTreatmentCardAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-sm">
      <input type="hidden" name="customerId" value={customerId} />
      <div className="grid grid-cols-1 gap-sm sm:grid-cols-2">
        <div>
          <label className="mb-xs block text-label-sm text-on-surface-variant">Kleurformule</label>
          <input type="text" name="colorFormula" className={inputCls} placeholder="bv. 7.1 + 6% 1:1.5" />
        </div>
        <div>
          <label className="mb-xs block text-label-sm text-on-surface-variant">Techniek</label>
          <input type="text" name="technique" className={inputCls} placeholder="bv. balayage" />
        </div>
      </div>
      <div>
        <label className="mb-xs block text-label-sm text-on-surface-variant">Notities</label>
        <textarea name="notes" rows={2} className={inputCls} placeholder="Bijzonderheden voor de volgende afspraak…" />
      </div>
      <div className="flex items-center gap-md">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-base rounded-full bg-primary px-md py-xs text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
        >
          <Icon name={pending ? "refresh" : "add"} className={`text-[18px] ${pending ? "animate-spin" : ""}`} />
          Behandelkaart toevoegen
        </button>
        {state?.error && <span className="text-label-sm text-error">{state.error}</span>}
      </div>
    </form>
  );
}
