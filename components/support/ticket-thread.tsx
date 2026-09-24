import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { TicketMessageRow } from "@/lib/support/tickets";

const dateFmt = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Amsterdam",
});

/**
 * Conversation timeline. `viewer` decides the framing: a customer sees their own
 * messages on the right and "KapperAssistent Support" on the left; an agent sees
 * the reverse and additionally the yellow internal notes.
 */
export function TicketThread({ messages, viewer }: { messages: TicketMessageRow[]; viewer: "klant" | "agent" }) {
  return (
    <ol className="flex flex-col gap-md">
      {messages.map((m) => {
        if (m.authorType === "systeem") {
          return (
            <li key={m.id} className="text-center text-label-sm text-on-surface-variant">
              {m.body} · {dateFmt.format(m.createdAt)}
            </li>
          );
        }
        const mine = viewer === "agent" ? m.authorType === "agent" || m.authorType === "notitie" : m.authorType === "klant";
        const note = m.authorType === "notitie";
        return (
          <li key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[88%] rounded-2xl px-md py-sm",
                note
                  ? "border border-dashed border-secondary bg-secondary-fixed/50"
                  : mine
                    ? "bg-primary text-on-primary"
                    : "border border-outline-variant/50 bg-white text-on-surface",
              )}
            >
              <div className={cn("mb-xs flex items-center gap-xs text-label-sm", mine && !note ? "text-on-primary/80" : "text-on-surface-variant")}>
                {note && <Icon name="lock" className="text-[14px]" />}
                <span className="font-label-md">
                  {note ? `Interne notitie · ${m.authorName ?? "Support"}` : m.authorType === "agent" ? `${m.authorName ?? "Support"} (KapperAssistent)` : (m.authorName ?? "Klant")}
                </span>
                <span>· {dateFmt.format(m.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap break-words text-body-md">{m.body}</p>
              {m.attachments.length > 0 && (
                <ul className="mt-sm flex flex-wrap gap-xs">
                  {m.attachments.map((a) => (
                    <li key={a.url}>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "inline-flex items-center gap-xs rounded-full px-sm py-[2px] text-label-sm underline",
                          mine && !note ? "bg-white/15" : "bg-surface-container-high",
                        )}
                      >
                        <Icon name={a.type === "application/pdf" ? "picture_as_pdf" : "image"} className="text-[14px]" />
                        {a.name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
