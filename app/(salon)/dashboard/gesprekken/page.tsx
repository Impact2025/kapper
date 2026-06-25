import type { Metadata } from "next";
import Link from "next/link";
import { requireSalonOwner } from "@/lib/auth/dal";
import { getConversations } from "@/lib/salon/gesprekken";
import { PageHeader, Badge } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Gesprekken" };

function fmt(date: Date) {
  return date.toLocaleDateString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

const CHANNEL_LABEL: Record<string, string> = { whatsapp: "WhatsApp", phone: "Telefoon" };
const CHANNEL_ICON: Record<string, string> = { whatsapp: "chat", phone: "phone" };
const STATUS_TONE: Record<string, "success" | "warning" | "neutral"> = {
  closed: "success",
  transferred: "warning",
  escalated: "warning",
  active: "neutral",
};

export default async function GesprekkenPage() {
  const user = await requireSalonOwner();
  const convs = await getConversations(user.salonId, 100);

  return (
    <div>
      <PageHeader
        title="Gesprekken"
        subtitle="Alle WhatsApp- en telefoon­gesprekken afgehandeld door de AI-assistent"
      />

      {convs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-outline-variant/40 bg-surface-container-lowest py-2xl text-center">
          <Icon name="forum" className="mb-md text-[48px] text-outline-variant" />
          <p className="font-headline-md text-headline-md text-on-surface mb-xs">
            Nog geen gesprekken
          </p>
          <p className="text-body-md text-on-surface-variant max-w-xs">
            Zodra klanten contact opnemen via WhatsApp of telefoon verschijnen de gesprekken hier.
          </p>
          <Link
            href="/dashboard/integraties"
            className="mt-lg inline-flex items-center gap-sm rounded-full bg-primary px-md py-sm text-label-md font-label-md text-on-primary hover:opacity-90"
          >
            <Icon name="cable" className="text-[18px]" />
            Integraties instellen
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-xs">
          {convs.map((conv) => (
            <Link
              key={conv.id}
              href={`/dashboard/gesprekken/${conv.id}`}
              className="flex items-center gap-md rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-md py-sm transition-colors hover:bg-primary/5"
            >
              {/* Channel icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed">
                <Icon name={CHANNEL_ICON[conv.channel] ?? "forum"} className="text-[20px]" />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-sm">
                  <span className="truncate font-label-md text-label-md text-on-surface">
                    {conv.customerName || conv.phoneNumber || "Onbekend"}
                  </span>
                  {conv.bookedAppointment && (
                    <Badge tone="success">Geboekt</Badge>
                  )}
                </div>
                <div className="text-label-sm text-on-surface-variant">
                  {CHANNEL_LABEL[conv.channel]} · {conv.messageCount} berichten · {fmt(conv.startedAt)}
                </div>
              </div>

              {/* Status */}
              <div className="flex shrink-0 items-center gap-xs">
                <Badge tone={STATUS_TONE[conv.status] ?? "neutral"}>
                  {conv.status === "closed" ? "Gesloten" : conv.status === "active" ? "Actief" : conv.status === "transferred" ? "Doorverbonden" : "Geëscaleerd"}
                </Badge>
                <Icon name="chevron_right" className="text-[20px] text-outline-variant" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
