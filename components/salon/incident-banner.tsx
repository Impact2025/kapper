import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { listActiveIncidents } from "@/lib/status/store";
import { INCIDENT_STATUS_LABEL, STATUS_COMPONENTS, type IncidentStatus } from "@/lib/status/model";
import { cn } from "@/lib/utils";

/** Toont lopende storingen/onderhoud bovenaan het dashboard, zodat salons niet eerst een ticket maken. */
export async function IncidentBanner() {
  const active = await listActiveIncidents();
  if (!active.length) return null;
  return (
    <div className="mb-md space-y-xs" role="status">
      {active.map((i) => {
        const major = i.severity === "major";
        const comps = i.components.map((c) => STATUS_COMPONENTS.find((x) => x.id === c)?.label ?? c).join(", ");
        return (
          <div
            key={i.id}
            className={cn(
              "flex items-start gap-sm rounded-xl p-sm text-label-md",
              major ? "bg-error-container text-on-error-container" : "bg-secondary-fixed text-on-secondary-fixed",
            )}
          >
            <Icon name={major ? "error" : i.severity === "maintenance" ? "build" : "warning"} filled className="mt-[2px] text-[20px]" />
            <div className="min-w-0 flex-1">
              <strong>{i.title}</strong> — {INCIDENT_STATUS_LABEL[i.status as IncidentStatus]}
              {comps && <span className="opacity-80"> · {comps}</span>}
              <div className="opacity-90">{i.updates[i.updates.length - 1]?.message}</div>
            </div>
            <Link href="/status" target="_blank" className="shrink-0 underline">
              Status
            </Link>
          </div>
        );
      })}
    </div>
  );
}
