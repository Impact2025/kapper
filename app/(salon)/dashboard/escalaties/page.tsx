import type { Metadata } from "next";
import Link from "next/link";
import { requireSalonOwner } from "@/lib/auth/dal";
import { listEscalatedConversations } from "@/lib/salon/gesprekken";
import { PageHeader, Badge } from "@/components/salon/dash-ui";
import { Icon } from "@/components/ui/icon";
import { MarkHandledButton } from "@/components/salon/mark-handled-button";

export const metadata: Metadata = { title: "Escalaties" };

const CHANNEL_LABEL: Record<string, string> = { whatsapp: "WhatsApp", phone: "Telefoon" };
const CHANNEL_ICON: Record<string, string> = { whatsapp: "chat", phone: "phone" };

function fmt(date: Date) {
  return date.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });
}

export default async function EscalatiesPage() {
  const user = await requireSalonOwner();
  const escalations = await listEscalatedConversations(user.salonId);

  return (
    <div>
      <PageHeader
        title="Escalaties"
        subtitle="Gesprekken die de AI heeft doorgegeven — direct overnemen zonder herhaling"
        action={escalations.length > 0 ? <Badge tone="warning">{escalations.length} wacht{escalations.length === 1 ? "" : "en"}</Badge> : undefined}
      />

      {escalations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-outline-variant/40 bg-surface-container-lowest py-2xl text-center">
          <Icon name="task_alt" className="mb-md text-[48px] text-outline-variant" />
          <p className="dash-h2 text-headline-md text-on-surface mb-xs">Niets om over te nemen</p>
          <p className="text-body-md text-on-surface-variant max-w-[20rem]">
            Zodra de AI een gesprek doorgeeft (klacht, medische vraag, expliciet verzoek) verschijnt het hier.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-xs">
          {escalations.map((esc) => (
            <Link
              key={esc.id}
              href={`/dashboard/gesprekken/${esc.id}`}
              className="flex items-center gap-md rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-md py-sm transition-colors hover:bg-primary/5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error/10 text-error">
                <Icon name={CHANNEL_ICON[esc.channel] ?? "forum"} className="text-[20px]" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-sm">
                  <span className="truncate font-label-md text-label-md text-on-surface">
                    {esc.customerName || esc.phoneNumber || "Onbekend"}
                  </span>
                  <Badge tone="warning">{CHANNEL_LABEL[esc.channel]} · {fmt(esc.updatedAt)}</Badge>
                </div>
                {esc.escalationReason && (
                  <p className="truncate text-label-sm font-medium text-on-surface">Reden: {esc.escalationReason}</p>
                )}
                {esc.lastMessage && (
                  <p className="truncate text-label-sm text-on-surface-variant">&quot;{esc.lastMessage}&quot;</p>
                )}
              </div>

              <MarkHandledButton conversationId={esc.id} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
