import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/dal";
import { getCustomerDetail } from "@/lib/admin/customers";
import { formatEurPrecise } from "@/lib/admin/margin";
import { getVerticalConfig } from "@/lib/verticals";
import { formatTicketNumber } from "@/lib/support/ticket-model";
import { PageHeader, StatCard, Card, Badge } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";
import { DailyBars, dayLabel } from "@/components/admin/cockpit/daily-bars";
import { SalonNoteForm } from "@/components/admin/cockpit/salon-note-form";
import { HealthBadge, PLAN_LABELS, StatusBadge, relativeDays } from "@/components/admin/cockpit/labels";

const EVENT_LABELS: Record<string, { label: string; icon: string }> = {
  login: { label: "Ingelogd", icon: "login" },
  call_handled: { label: "Telefoongesprek afgehandeld", icon: "call" },
  booking_made: { label: "Afspraak geboekt", icon: "event_available" },
  whatsapp_message: { label: "WhatsApp-bericht", icon: "chat" },
  no_show_prevented: { label: "No-show voorkomen", icon: "event_busy" },
  escalated: { label: "Doorgezet naar medewerker", icon: "support_agent" },
  webshop_order_paid: { label: "Webshop-bestelling betaald", icon: "shopping_bag" },
};

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("admin");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const detail = await getCustomerDetail(id);
  if (!detail) notFound();

  const { customer: c, totals30d: t } = detail;
  const pack = getVerticalConfig(c.vertical);
  const dt = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Amsterdam" });
  const dtt = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });
  const bookingRate = t.conversations ? Math.round((t.bookings / t.conversations) * 100) : null;

  return (
    <div>
      <Link href="/admin/klanten" className="mb-sm inline-flex items-center gap-xs text-label-md text-on-surface-variant hover:text-primary">
        <Icon name="arrow_back" className="text-[18px]" /> Alle klanten
      </Link>
      <PageHeader
        title={c.name}
        subtitle={`${pack.label} · ${PLAN_LABELS[c.plan]}${c.city ? ` · ${c.city}` : ""} · klant sinds ${dt.format(c.createdAt)}`}
        action={
          <div className="flex items-center gap-xs">
            <StatusBadge status={c.status} />
            <HealthBadge health={c.health} />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-md sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="MRR" value={formatEurPrecise(c.mrrCents / 100)} icon="payments" hint={detail.subscription ? `Stripe: ${detail.subscription.status}` : "geen Stripe-abonnement"} />
        <StatCard label="Gesprekken 30d" value={t.conversations.toLocaleString("nl-NL")} icon="forum" hint={`${t.callsHandled} telefoon · ${Math.round(t.voiceSeconds / 60)} belmin.`} />
        <StatCard label="Boekingen 30d" value={t.bookings.toLocaleString("nl-NL")} icon="event_available" hint={bookingRate == null ? undefined : `${bookingRate}% van de gesprekken`} />
        <StatCard
          label="AI-kosten 30d"
          value={formatEurPrecise(c.aiCostMicroEur30d / 1_000_000)}
          icon="token"
          hint={c.margin.marginPct == null ? "geen omzet" : `marge ${c.margin.marginPct.toLocaleString("nl-NL")}%`}
        />
      </div>

      <div className="mt-lg grid grid-cols-1 gap-md lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-md font-headline-md text-headline-md text-on-surface">Gesprekken per dag</h2>
          <DailyBars
            ariaLabel="Gesprekken per dag, laatste 30 dagen"
            emptyText="Nog geen dagcijfers — die komen binnen na de nachtelijke verwerking."
            maxLabel={(max) => `max ${max}/dag`}
            points={detail.daily.map((p) => ({
              day: p.day,
              value: p.conversations,
              label: `${dayLabel(p.day)}: ${p.conversations} gesprekken · ${p.bookings} boekingen`,
            }))}
          />
        </Card>

        <Card>
          <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">Gezondheid</h2>
          <div className="mb-sm rounded-lg bg-surface-container-low p-sm">
            <div className="text-label-sm uppercase tracking-wide text-on-surface-variant">Volgende stap</div>
            <p className="text-body-md text-on-surface">{c.health.nextAction}</p>
          </div>
          {c.health.reasons.length === 0 ? (
            <p className="text-body-md text-on-surface-variant">Geen aandachtspunten.</p>
          ) : (
            <ul className="flex flex-col gap-xs">
              {c.health.reasons.map((r) => (
                <li key={r.label} className="flex items-start justify-between gap-sm text-label-md">
                  <span className="text-on-surface">{r.label}</span>
                  <span className="tabular-nums text-on-surface-variant">{r.impact}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-lg grid grid-cols-1 gap-md lg:grid-cols-3">
        <Card>
          <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">Gebruikers</h2>
          {detail.users.length === 0 ? (
            <p className="text-body-md text-on-surface-variant">Geen gekoppelde gebruikers.</p>
          ) : (
            <ul className="flex flex-col gap-sm">
              {detail.users.map((u) => (
                <li key={u.id} className="text-label-md">
                  <div className="text-on-surface">{u.name ?? u.email}</div>
                  <div className="text-on-surface-variant">
                    {u.email} · ingelogd {relativeDays(u.lastLoginAt)}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {detail.subscription?.currentPeriodEnd && (
            <p className="mt-md text-label-md text-on-surface-variant">
              Huidige periode loopt tot {dt.format(detail.subscription.currentPeriodEnd)}.
            </p>
          )}
        </Card>

        <Card>
          <div className="mb-sm flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md text-on-surface">Tickets</h2>
            <Badge tone={c.openTickets ? "warning" : "neutral"}>{c.openTickets} open</Badge>
          </div>
          {detail.tickets.length === 0 ? (
            <p className="text-body-md text-on-surface-variant">Nog geen tickets.</p>
          ) : (
            <ul className="flex flex-col gap-xs">
              {detail.tickets.map((tk) => (
                <li key={tk.id}>
                  <Link href={`/admin/support/${tk.id}`} className="block rounded-lg px-xs py-[2px] text-label-md hover:bg-surface-container-low">
                    <span className="text-on-surface">
                      {formatTicketNumber(tk.ticketNumber)} · {tk.subject}
                    </span>
                    <span className="block text-on-surface-variant">
                      {tk.status.replaceAll("_", " ")} · {dt.format(tk.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">Tijdlijn</h2>
          {detail.timeline.length === 0 ? (
            <p className="text-body-md text-on-surface-variant">Nog geen activiteit.</p>
          ) : (
            <ul className="flex max-h-80 flex-col gap-xs overflow-y-auto">
              {detail.timeline.map((e, i) => {
                const meta = EVENT_LABELS[e.type] ?? { label: e.type.replaceAll("_", " "), icon: "bolt" };
                return (
                  <li key={i} className="flex items-start gap-xs text-label-md">
                    <Icon name={meta.icon} className="mt-[2px] text-[16px] text-on-surface-variant" />
                    <span className="flex-1 text-on-surface">{meta.label}</span>
                    <span className="whitespace-nowrap text-on-surface-variant">{dtt.format(e.createdAt)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-lg">
        <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">Notities</h2>
        <SalonNoteForm salonId={c.id} />
        {detail.notes.length > 0 && (
          <ul className="mt-md flex flex-col gap-sm">
            {detail.notes.map((note) => (
              <li key={note.id} className="rounded-lg bg-surface-container-low p-sm">
                <p className="whitespace-pre-wrap text-body-md text-on-surface">{note.body}</p>
                <p className="mt-xs text-label-sm text-on-surface-variant">
                  {note.authorName ?? "Onbekend"} · {dtt.format(note.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
