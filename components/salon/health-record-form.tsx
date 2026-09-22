"use client";

import { useActionState, useRef, useEffect } from "react";
import { addHealthRecordAction } from "@/lib/dossier/actions";
import { Icon } from "@/components/ui/icon";

const inputCls =
  "w-full rounded-lg border border-outline-variant bg-surface px-sm py-xs text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary";

export function HealthRecordForm({ customerId }: { customerId: string }) {
  const [state, action, pending] = useActionState(addHealthRecordAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-sm">
      <input type="hidden" name="customerId" value={customerId} />
      <div className="grid grid-cols-1 gap-sm sm:grid-cols-2">
        <div>
          <label className="mb-xs block text-label-sm text-on-surface-variant">Allergieën</label>
          <input type="text" name="allergies" className={inputCls} placeholder="bv. PPD-allergie" />
        </div>
        <div>
          <label className="mb-xs block text-label-sm text-on-surface-variant">Hoofdhuidconditie</label>
          <input type="text" name="scalpCondition" className={inputCls} placeholder="bv. gevoelige hoofdhuid" />
        </div>
        <div>
          <label className="mb-xs block text-label-sm text-on-surface-variant">Resultaat patch-test</label>
          <input type="text" name="patchTestResult" className={inputCls} placeholder="bv. negatief" />
        </div>
        <div>
          <label className="mb-xs block text-label-sm text-on-surface-variant">Datum patch-test</label>
          <input type="date" name="patchTestAt" className={inputCls} />
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-sm rounded-lg border border-outline-variant/40 bg-surface p-sm">
        <input
          type="checkbox"
          name="consentConfirmed"
          value="true"
          required
          className="mt-0.5 h-4 w-4 rounded border-outline-variant accent-primary"
        />
        <span className="text-label-sm text-on-surface-variant">
          De klant heeft expliciet toestemming gegeven om deze medische gegevens vast te leggen (Artikel 9 AVG).
        </span>
      </label>

      <div className="flex items-center gap-md">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-base rounded-full bg-primary px-md py-xs text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
        >
          <Icon name={pending ? "refresh" : "add"} className={`text-[18px] ${pending ? "animate-spin" : ""}`} />
          Vastleggen
        </button>
        {state?.error && <span className="text-label-sm text-error">{state.error}</span>}
      </div>
    </form>
  );
}
