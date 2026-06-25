import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSalonOwner } from "@/lib/auth/dal";
import { getConversationDetail } from "@/lib/salon/gesprekken";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Gesprek" };

const CHANNEL_LABEL: Record<string, string> = { whatsapp: "WhatsApp", phone: "Telefoon" };

function fmt(date: Date) {
  return date.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(date: Date) {
  return date.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSalonOwner();
  const detail = await getConversationDetail(user.salonId, id);
  if (!detail) notFound();

  const { conversation: conv, messages, appointment } = detail;

  return (
    <div className="max-w-2xl">
      {/* Back */}
      <Link
        href="/dashboard/gesprekken"
        className="mb-md inline-flex items-center gap-xs text-label-md text-on-surface-variant hover:text-primary"
      >
        <Icon name="arrow_back" className="text-[18px]" />
        Terug naar gesprekken
      </Link>

      {/* Header */}
      <div className="mb-lg rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-md">
        <div className="mb-sm flex flex-wrap items-center gap-sm">
          <h1 className="font-headline-md text-headline-md text-on-surface">
            {conv.customerName || conv.phoneNumber || "Onbekend"}
          </h1>
          <Badge tone={conv.status === "closed" ? "success" : "neutral"}>
            {conv.status === "closed" ? "Gesloten" : conv.status === "active" ? "Actief" : conv.status}
          </Badge>
          {conv.bookedAppointment && <Badge tone="success">Afspraak geboekt</Badge>}
        </div>
        <div className="flex flex-wrap gap-md text-label-sm text-on-surface-variant">
          <span className="flex items-center gap-xs">
            <Icon name={conv.channel === "whatsapp" ? "chat" : "phone"} className="text-[16px]" />
            {CHANNEL_LABEL[conv.channel]}
          </span>
          {conv.phoneNumber && (
            <span className="flex items-center gap-xs">
              <Icon name="call" className="text-[16px]" />
              {conv.phoneNumber}
            </span>
          )}
          <span className="flex items-center gap-xs">
            <Icon name="schedule" className="text-[16px]" />
            {fmtDate(conv.startedAt)}
          </span>
        </div>

        {appointment && (
          <div className="mt-sm flex items-center gap-sm rounded-lg bg-primary-fixed/30 px-sm py-xs">
            <Icon name="event_available" className="text-[18px] text-primary" />
            <span className="text-label-md text-on-surface">
              <strong>{appointment.serviceType}</strong> ·{" "}
              {fmtDate(appointment.appointmentTime)} ·{" "}
              <Badge tone={appointment.status === "confirmed" ? "success" : "neutral"}>
                {appointment.status}
              </Badge>
            </span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex flex-col gap-sm">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-md py-sm ${
                msg.role === "assistant"
                  ? "bg-surface-container text-on-surface"
                  : "bg-primary text-on-primary"
              }`}
            >
              <p className="text-body-md leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              <p className={`mt-xs text-label-sm ${msg.role === "assistant" ? "text-on-surface-variant" : "text-on-primary/70"}`}>
                {msg.role === "assistant" ? "AI-assistent" : "Klant"} · {fmt(msg.createdAt)}
              </p>
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-center text-body-md text-on-surface-variant">Geen berichten beschikbaar.</p>
        )}
      </div>
    </div>
  );
}
