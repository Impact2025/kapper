"use client";

import { useActionState } from "react";
import { createIncidentAction, type IncidentFormState } from "@/lib/status/actions";
import { SEVERITIES, SEVERITY_LABEL, STATUS_COMPONENTS } from "@/lib/status/model";

const FIELD =
  "w-full rounded-lg border border-outline-variant bg-white px-md py-sm text-body-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export function IncidentForm() {
  const [state, action, pending] = useActionState<IncidentFormState, FormData>(createIncidentAction, {});
  return (
    <form action={action} className="max-w-2xl space-y-md rounded-xl border border-outline-variant/50 bg-white p-lg">
      {state.error && (
        <div role="alert" className="rounded-lg bg-error-container p-sm text-label-md text-on-error-container">
          {state.error}
        </div>
      )}
      <label className="block">
        <span className="mb-xs block text-label-md font-label-md">Titel *</span>
        <input name="title" required minLength={5} maxLength={160} className={FIELD} placeholder="Bijv. Agenda-sync met Salonized vertraagd" />
      </label>
      <label className="block">
        <span className="mb-xs block text-label-md font-label-md">Ernst *</span>
        <select name="severity" defaultValue="minor" className={FIELD}>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {SEVERITY_LABEL[s]}
            </option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend className="mb-xs text-label-md font-label-md">Getroffen onderdelen *</legend>
        <div className="grid grid-cols-1 gap-xs sm:grid-cols-2">
          {STATUS_COMPONENTS.map((c) => (
            <label key={c.id} className="inline-flex items-center gap-xs text-body-md">
              <input type="checkbox" name="components" value={c.id} /> {c.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block">
        <span className="mb-xs block text-label-md font-label-md">Eerste bericht voor klanten *</span>
        <textarea name="message" required minLength={5} maxLength={2000} rows={4} className={`${FIELD} resize-y`} placeholder="Wat is er aan de hand, wat merken klanten, wanneer volgt een update?" />
      </label>
      <button type="submit" disabled={pending} className="rounded-full bg-primary px-xl py-sm text-label-md font-label-md text-on-primary disabled:opacity-60">
        {pending ? "Publiceren…" : "Publiceer melding"}
      </button>
    </form>
  );
}
