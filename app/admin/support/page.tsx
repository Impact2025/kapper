import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { listAdminTickets, ticketCounts } from "@/lib/support/tickets";
import {
  STATUS_LABEL,
  TICKET_CATEGORIES,
  TICKET_STATUSES,
  categoryLabel,
  formatTicketNumber,
  slaState,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/support/ticket-model";
import { PageHeader, Card, EmptyState } from "@/components/admin/ui";
import { PriorityBadge, SlaBadge, StatusBadge } from "@/components/support/ticket-badges";
import { cn } from "@/lib/utils";

const dateFmt = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });

type Params = { status?: string; cat?: string; to?: string; q?: string };

function href(p: Params): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v) sp.set(k, v);
  const qs = sp.toString();
  return `/admin/support${qs ? `?${qs}` : ""}`;
}

export default async function AdminSupportPage({ searchParams }: { searchParams: Promise<Params> }) {
  const admin = await requireRole("admin");
  const params = await searchParams;
  const status = params.status === "alle" ? undefined : (TICKET_STATUSES as readonly string[]).includes(params.status ?? "") ? (params.status as TicketStatus) : "actief";
  const category = TICKET_CATEGORIES.some((c) => c.id === params.cat) ? params.cat : undefined;
  const assignedTo = params.to === "mij" ? admin.id : params.to === "niemand" ? "none" : undefined;
  const q = params.q?.trim().slice(0, 100) || undefined;

  const [tickets, counts] = await Promise.all([listAdminTickets({ status, category, assignedTo, q }), ticketCounts()]);
  const activeCount = (counts.open ?? 0) + (counts.in_behandeling ?? 0) + (counts.wacht_op_klant ?? 0);
  const now = new Date();
  const breached = tickets.filter((t) => slaState(t.slaDueAt, t.status as TicketStatus, t.firstResponseAt, now) === "breached").length;

  const current: Params = { status: params.status, cat: category, to: params.to, q };

  return (
    <div>
      <PageHeader
        title="Support"
        subtitle="Helpdesk voor prospects en salons. Gesorteerd op SLA-deadline."
        action={
          <div className="flex gap-xs">
            <Link href="/admin/support/status" className="rounded-full border border-primary px-md py-sm text-label-md font-label-md text-primary hover:bg-primary/5">
              Storingen
            </Link>
            <Link href="/admin/support/artikelen" className="rounded-full border border-primary px-md py-sm text-label-md font-label-md text-primary hover:bg-primary/5">
              Artikelen
            </Link>
            <Link href="/admin/support/inzichten" className="rounded-full border border-primary px-md py-sm text-label-md font-label-md text-primary hover:bg-primary/5">
              Inzichten
            </Link>
          </div>
        }
      />

      <div className="mb-md grid grid-cols-2 gap-sm md:grid-cols-4">
        <Card><div className="text-label-sm uppercase text-on-surface-variant">Actief</div><div className="stat-figure text-headline-md">{activeCount}</div></Card>
        <Card><div className="text-label-sm uppercase text-on-surface-variant">Open</div><div className="stat-figure text-headline-md">{counts.open ?? 0}</div></Card>
        <Card><div className="text-label-sm uppercase text-on-surface-variant">Wacht op klant</div><div className="stat-figure text-headline-md">{counts.wacht_op_klant ?? 0}</div></Card>
        <Card><div className={cn("text-label-sm uppercase", breached ? "text-error" : "text-on-surface-variant")}>SLA verlopen</div><div className="stat-figure text-headline-md">{breached}</div></Card>
      </div>

      <div className="mb-md flex flex-wrap items-center gap-xs">
        {[{ id: "actief", label: "Actief" }, ...TICKET_STATUSES.map((s) => ({ id: s, label: STATUS_LABEL[s] })), { id: "alle", label: "Alle" }].map((c) => (
          <Link
            key={c.id}
            href={href({ ...current, status: c.id === "actief" ? undefined : c.id })}
            className={cn(
              "rounded-full border px-md py-xs text-label-md",
              (params.status ?? "actief") === c.id || (!params.status && c.id === "actief")
                ? "border-primary bg-primary text-on-primary"
                : "border-outline-variant text-on-surface hover:bg-primary/5",
            )}
          >
            {c.label}
          </Link>
        ))}
        <span className="mx-xs text-outline">|</span>
        <Link href={href({ ...current, to: params.to === "mij" ? undefined : "mij" })} className={cn("rounded-full border px-md py-xs text-label-md", params.to === "mij" ? "border-primary bg-primary text-on-primary" : "border-outline-variant hover:bg-primary/5")}>
          Aan mij
        </Link>
        <Link href={href({ ...current, to: params.to === "niemand" ? undefined : "niemand" })} className={cn("rounded-full border px-md py-xs text-label-md", params.to === "niemand" ? "border-primary bg-primary text-on-primary" : "border-outline-variant hover:bg-primary/5")}>
          Niet toegewezen
        </Link>
        <form method="get" action="/admin/support" className="ml-auto flex items-center gap-xs">
          {params.status && <input type="hidden" name="status" value={params.status} />}
          {params.to && <input type="hidden" name="to" value={params.to} />}
          <select name="cat" defaultValue={category ?? ""} className="rounded-full border border-outline-variant bg-surface-container-lowest px-sm py-xs text-label-md">
            <option value="">Alle categorieën</option>
            {TICKET_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <input type="search" name="q" defaultValue={q} placeholder="Zoek onderwerp, naam, e-mail…" className="rounded-full border border-outline-variant bg-surface-container-lowest px-md py-xs text-label-md outline-none focus:border-primary" />
        </form>
      </div>

      {tickets.length === 0 ? (
        <EmptyState icon="inbox" title="Geen tickets" description="Geen tickets voor deze selectie. Rustig moment." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant/40 text-label-sm uppercase tracking-wide text-on-surface-variant">
                <th className="px-md py-sm font-label-sm">Ticket</th>
                <th className="px-md py-sm font-label-sm">Aanvrager</th>
                <th className="px-md py-sm font-label-sm">Status</th>
                <th className="px-md py-sm font-label-sm">Prioriteit</th>
                <th className="px-md py-sm font-label-sm">SLA</th>
                <th className="px-md py-sm font-label-sm">Toegewezen</th>
                <th className="px-md py-sm font-label-sm">Bijgewerkt</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-b border-outline-variant/20 hover:bg-primary/5">
                  <td className="px-md py-sm">
                    <Link href={`/admin/support/${t.id}`} className="font-label-md text-body-md text-on-surface hover:text-primary">
                      {t.subject}
                    </Link>
                    <div className="text-label-sm text-on-surface-variant">{formatTicketNumber(t.ticketNumber)} · {categoryLabel(t.category)}</div>
                  </td>
                  <td className="px-md py-sm text-label-md">
                    <div>{t.requesterName}</div>
                    <div className="text-label-sm text-on-surface-variant">{t.salonName ? `${t.salonName} · ${t.slaTier}` : "Prospect"}</div>
                  </td>
                  <td className="px-md py-sm"><StatusBadge status={t.status as TicketStatus} /></td>
                  <td className="px-md py-sm"><PriorityBadge priority={t.priority as TicketPriority} /></td>
                  <td className="px-md py-sm"><SlaBadge state={slaState(t.slaDueAt, t.status as TicketStatus, t.firstResponseAt, now)} /></td>
                  <td className="px-md py-sm text-label-md">{t.assigneeName ?? <span className="text-on-surface-variant">—</span>}</td>
                  <td className="px-md py-sm text-label-sm text-on-surface-variant">{dateFmt.format(t.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
