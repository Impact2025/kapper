"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  addJobPhotoAction,
  addNoteAction,
  changeStatusAction,
  createDocumentAction,
  scheduleJobAction,
  signOffAction,
  toggleChecklistAction,
  unscheduleJobAction,
  updateJobDetailsAction,
} from "@/lib/jobs/actions";
import { ActionForm, InlineActionButton } from "@/components/salon/jobs/action-form";
import { Field, btnDanger, btnOutline, btnPrimary, inputCls } from "@/components/salon/jobs/ui";
import { Icon } from "@/components/ui/icon";
import { JOB_PRIORITIES, JOB_PRIORITY_LABEL, JOB_STATUS_LABEL, nextStatuses, type ChecklistItem, type JobStatus } from "@/lib/jobs/model";

/* ------------------------------ status ------------------------------ */
const PRIMARY_LABEL: Partial<Record<JobStatus, string>> = {
  scheduled: "Inplannen",
  en_route: "Onderweg melden",
  in_progress: "Start werk",
  completed: "Klus afronden",
  on_hold: "In de wacht zetten",
  cancelled: "Annuleren",
  new: "Terug naar nieuw",
};

export function StatusActions({ jobId, status, hasSchedule }: { jobId: string; status: string; hasSchedule: boolean }) {
  const options = nextStatuses(status as JobStatus).filter((s) => s !== "invoiced" && s !== "paid");
  if (options.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-sm">
      {options.map((to) => {
        // "scheduled" needs a date — that goes through the planning form.
        if (to === "scheduled" && !hasSchedule) return null;
        const cancel = to === "cancelled";
        return (
          <ActionForm
            key={to}
            action={changeStatusAction}
            submitLabel={PRIMARY_LABEL[to] ?? JOB_STATUS_LABEL[to]}
            buttonClassName={cancel ? btnDanger : to === "completed" || to === "in_progress" ? btnPrimary : btnOutline}
            confirm={cancel ? "Deze klus annuleren?" : undefined}
          >
            <input type="hidden" name="jobId" value={jobId} />
            <input type="hidden" name="to" value={to} />
          </ActionForm>
        );
      })}
    </div>
  );
}

/* ------------------------------ checklist ------------------------------ */
export function ChecklistPanel({ jobId, items }: { jobId: string; items: ChecklistItem[] }) {
  if (items.length === 0) return <p className="text-body-md text-on-surface-variant">Geen checklist voor deze categorie.</p>;
  return (
    <ul className="flex flex-col gap-xs">
      {items.map((item) => (
        <li key={item.id}>
          <ActionForm action={toggleChecklistAction} hideSubmit className="gap-0">
            <input type="hidden" name="jobId" value={jobId} />
            <input type="hidden" name="itemId" value={item.id} />
            <button
              type="submit"
              className="flex w-full items-center gap-sm rounded-lg px-sm py-xs text-left transition-colors hover:bg-primary/5"
            >
              <Icon
                name={item.done ? "check_circle" : "radio_button_unchecked"}
                filled={item.done}
                className={`text-[22px] ${item.done ? "text-primary" : "text-outline"}`}
              />
              <span className={`text-body-md ${item.done ? "text-on-surface-variant line-through" : "text-on-surface"}`}>{item.label}</span>
            </button>
          </ActionForm>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------ planning ------------------------------ */
export function SchedulePanel({
  jobId,
  scheduledStartInput,
  staffId,
  minutes,
  staff,
  isScheduled,
}: {
  jobId: string;
  scheduledStartInput: string;
  staffId: string | null;
  minutes: number;
  staff: { id: string; name: string }[];
  isScheduled: boolean;
}) {
  return (
    <div className="flex flex-col gap-sm">
      <ActionForm action={scheduleJobAction} submitLabel={isScheduled ? "Verplaatsen" : "Inplannen"} submitIcon="event_available">
        <input type="hidden" name="jobId" value={jobId} />
        <Field label="Datum en tijd">
          <input type="datetime-local" name="scheduledStart" defaultValue={scheduledStartInput} required className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-sm">
          <Field label="Monteur">
            <select name="staffId" defaultValue={staffId ?? ""} className={inputCls}>
              <option value="">— Niemand —</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Duur (min)">
            <input type="number" name="estimatedMinutes" min={15} step={15} defaultValue={minutes} className={inputCls} />
          </Field>
        </div>
      </ActionForm>
      {isScheduled && (
        <InlineActionButton action={unscheduleJobAction} fields={{ jobId }} label="Uit de planning halen" icon="event_busy" confirm="Deze klus uit de planning halen?" />
      )}
    </div>
  );
}

/* ------------------------------ details ------------------------------ */
export function DetailsForm({
  job,
  categories,
  staff,
  fields = [],
  details = {},
}: {
  job: { id: string; title: string; description: string | null; category: string; priority: string; assignedStaffId: string | null; workSummary: string | null; internalNotes: string | null };
  categories: { key: string; label: string }[];
  staff: { id: string; name: string }[];
  /** Vak-specific fields for this klus' category (VerticalPack.jobFields). */
  fields?: { key: string; label: string; type: "text" | "number" | "select"; unit?: string; options?: string[]; placeholder?: string; hint?: string }[];
  details?: Record<string, string>;
}) {
  return (
    <ActionForm action={updateJobDetailsAction} submitLabel="Opslaan" submitIcon="save" successText="Opgeslagen.">
      <input type="hidden" name="jobId" value={job.id} />
      <div className="grid grid-cols-1 gap-sm sm:grid-cols-3">
        <Field label="Titel" className="sm:col-span-3">
          <input name="title" defaultValue={job.title} required className={inputCls} />
        </Field>
        <Field label="Categorie">
          <select name="category" defaultValue={job.category} className={inputCls}>
            {categories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Prioriteit">
          <select name="priority" defaultValue={job.priority} className={inputCls}>
            {JOB_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {JOB_PRIORITY_LABEL[p]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Monteur">
          <select name="staffId" defaultValue={job.assignedStaffId ?? ""} className={inputCls}>
            <option value="">— Niemand —</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        {fields.map((f) => (
          <Field key={f.key} label={f.unit ? `${f.label} (${f.unit})` : f.label} hint={f.hint} className={f.hint ? "sm:col-span-3" : undefined}>
            {f.type === "select" ? (
              <select name={`f_${f.key}`} defaultValue={details[f.key] ?? ""} className={inputCls}>
                <option value="">—</option>
                {f.options?.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <input name={`f_${f.key}`} type={f.type === "number" ? "text" : "text"} inputMode={f.type === "number" ? "decimal" : undefined} defaultValue={details[f.key] ?? ""} placeholder={f.placeholder} className={inputCls} />
            )}
          </Field>
        ))}
        <Field label="Omschrijving van de klant" className="sm:col-span-3">
          <textarea name="description" defaultValue={job.description ?? ""} rows={3} className={inputCls} />
        </Field>
        <Field label="Werkverslag (wat is er gedaan?)" className="sm:col-span-3">
          <textarea name="workSummary" defaultValue={job.workSummary ?? ""} rows={3} className={inputCls} />
        </Field>
        <Field label="Interne notities (niet zichtbaar voor klant)" className="sm:col-span-3">
          <textarea name="internalNotes" defaultValue={job.internalNotes ?? ""} rows={2} className={inputCls} />
        </Field>
      </div>
    </ActionForm>
  );
}

export function NoteForm({ jobId }: { jobId: string }) {
  return (
    <ActionForm action={addNoteAction} submitLabel="Notitie plaatsen" resetOnSuccess buttonClassName={btnOutline}>
      <input type="hidden" name="jobId" value={jobId} />
      <textarea name="note" rows={2} required placeholder="bv. Klant is er pas na 17:00, sleutel bij de buren." className={inputCls} />
    </ActionForm>
  );
}

/* ------------------------------ photos ------------------------------ */
export function PhotoUploader({ jobId }: { jobId: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/salon/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload mislukt.");
      setBlobUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload mislukt.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <ActionForm action={addJobPhotoAction} submitLabel="Foto toevoegen" submitIcon="add_a_photo" hideSubmit={!blobUrl} resetOnSuccess>
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="blobUrl" value={blobUrl ?? ""} />
      {blobUrl ? (
        <div className="flex flex-wrap items-end gap-sm">
          <Image src={blobUrl} alt="Voorbeeld" width={80} height={80} className="h-20 w-20 rounded-lg object-cover" />
          <Field label="Soort">
            <select name="kind" defaultValue="during" className={inputCls}>
              <option value="before">Voor</option>
              <option value="during">Tijdens</option>
              <option value="after">Na</option>
              <option value="issue">Probleem</option>
            </select>
          </Field>
          <Field label="Bijschrift">
            <input name="caption" className={inputCls} placeholder="optioneel" />
          </Field>
          <button
            type="button"
            className="text-label-sm text-on-surface-variant hover:text-error"
            onClick={() => {
              setBlobUrl(null);
              if (fileRef.current) fileRef.current.value = "";
            }}
          >
            Andere foto
          </button>
        </div>
      ) : (
        <label className={`${btnOutline} cursor-pointer`}>
          <Icon name="add_a_photo" className="text-[18px]" />
          {uploading ? "Uploaden…" : "Foto kiezen of maken"}
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} disabled={uploading} />
        </label>
      )}
      {error && <p className="text-label-sm text-error">{error}</p>}
    </ActionForm>
  );
}

/* ------------------------------ oplevering ------------------------------ */
export function SignOffForm({ jobId }: { jobId: string }) {
  return (
    <ActionForm action={signOffAction} submitLabel="Opleveren met akkoord" submitIcon="draw" successText="Opgeleverd.">
      <input type="hidden" name="jobId" value={jobId} />
      <div className="grid grid-cols-2 gap-sm">
        <Field label="Naam ondertekenaar">
          <input name="signedByName" required className={inputCls} placeholder="Klant of bewoner" />
        </Field>
        <Field label="Garantie (maanden)">
          <input name="warrantyMonths" type="number" min={0} max={120} defaultValue={12} className={inputCls} />
        </Field>
      </div>
    </ActionForm>
  );
}

/* ------------------------------ documenten ------------------------------ */
export function CreateDocumentButtons({ jobId, canQuotes }: { jobId: string; canQuotes: boolean }) {
  if (!canQuotes) {
    return (
      <p className="text-label-md text-on-surface-variant">
        Offertes en facturen zijn onderdeel van Pro. <a className="text-primary hover:underline" href="/dashboard/abonnement">Upgrade</a>
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-sm">
      {(["quote", "invoice"] as const).map((kind) => (
        <ActionForm key={kind} action={createDocumentAction} submitLabel={kind === "quote" ? "Offerte maken" : "Factuur maken"} submitIcon="receipt_long" buttonClassName={btnOutline}>
          <input type="hidden" name="jobId" value={jobId} />
          <input type="hidden" name="kind" value={kind} />
        </ActionForm>
      ))}
    </div>
  );
}
