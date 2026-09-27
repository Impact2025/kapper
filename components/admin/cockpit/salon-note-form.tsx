"use client";

import { useActionState, useEffect, useRef } from "react";
import { addSalonNote } from "@/lib/admin/actions";

export function SalonNoteForm({ salonId }: { salonId: string }) {
  const [state, action, pending] = useActionState(addSalonNote, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form action={action} ref={formRef} className="flex flex-col gap-sm">
      <input type="hidden" name="salonId" value={salonId} />
      <textarea
        name="body"
        rows={3}
        required
        placeholder="Interne notitie (alleen zichtbaar in het beheer)…"
        className="rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-sm text-body-md outline-none focus:border-primary"
      />
      {state?.error && <p className="text-label-sm text-error">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-primary px-md py-xs text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
      >
        {pending ? "Opslaan…" : "Notitie opslaan"}
      </button>
    </form>
  );
}
