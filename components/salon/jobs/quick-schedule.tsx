"use client";

import { scheduleJobAction } from "@/lib/jobs/actions";
import { ActionForm } from "@/components/salon/jobs/action-form";
import { btnPrimary, inputCls } from "@/components/salon/jobs/ui";

/** Compact "plan this klus" form for the planbord's te-plannen list. */
export function QuickScheduleForm({
  jobId,
  staff,
  defaultMinutes,
}: {
  jobId: string;
  staff: { id: string; name: string }[];
  defaultMinutes: number;
}) {
  return (
    <ActionForm action={scheduleJobAction} submitLabel="Plan" buttonClassName={btnPrimary} className="gap-xs">
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="estimatedMinutes" value={defaultMinutes} />
      <div className="flex flex-wrap items-center gap-xs">
        <input type="datetime-local" name="scheduledStart" required className={`${inputCls} w-auto`} />
        <select name="staffId" defaultValue="" className={`${inputCls} w-auto`}>
          <option value="">Monteur…</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
    </ActionForm>
  );
}
