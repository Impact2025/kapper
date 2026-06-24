"use client";

import { useActionState } from "react";
import { generateReportNow } from "@/lib/reports/actions";

export function GenerateReport() {
  const [state, action, pending] = useActionState(generateReportNow, undefined);

  return (
    <div className="flex flex-col items-end gap-xs">
      <form action={action} className="flex items-center gap-sm">
        <select
          name="period"
          defaultValue="daily"
          className="rounded-full border border-outline-variant bg-surface-container-lowest px-md py-xs text-label-md outline-none focus:border-primary"
        >
          <option value="daily">Dagrapport</option>
          <option value="monthly">Maandrapport</option>
        </select>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-base rounded-full bg-primary px-md py-xs text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 soft-shadow"
        >
          <span className="material-symbols-outlined text-[18px]">add_chart</span>
          {pending ? "Genereren…" : "Genereer nu"}
        </button>
      </form>
      {state?.error && <span className="text-label-sm text-error">{state.error}</span>}
      {state?.ok && <span className="text-label-sm text-primary">Rapport gegenereerd ✓</span>}
    </div>
  );
}
