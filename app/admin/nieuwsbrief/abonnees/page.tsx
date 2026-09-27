import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { listSubscribers, subscriberCounts } from "@/lib/newsletter/subscribers";
import { listVerticals, getVerticalConfig } from "@/lib/verticals";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";
import { AddSubscriberForm, ImportCustomersButton } from "@/components/admin/newsletter/subscriber-forms";
import { SUBSCRIBER_STATUS } from "@/components/admin/newsletter/labels";
import { cn } from "@/lib/utils";

const STATUSES = Object.keys(SUBSCRIBER_STATUS) as (keyof typeof SUBSCRIBER_STATUS)[];

export default async function SubscribersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await requireRole("admin");
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as keyof typeof SUBSCRIBER_STATUS) ? sp.status : undefined;
  const q = sp.q?.trim() || undefined;
  const [rows, counts] = await Promise.all([listSubscribers({ status, q, limit: 300 }), subscriberCounts()]);
  const dt = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Amsterdam" });
  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-md py-xs text-label-md font-label-md transition-colors",
      active ? "border-primary bg-primary text-on-primary" : "border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary",
    );

  return (
    <div>
      <Link href="/admin/nieuwsbrief" className="mb-sm inline-flex items-center gap-xs text-label-md text-on-surface-variant hover:text-primary">
        <Icon name="arrow_back" className="text-[18px]" /> Nieuwsbrief
      </Link>
      <PageHeader
        title="Abonnees"
        subtitle={`${counts.subscribed} aangemeld · ${counts.pending} wachten op bevestiging · ${counts.unsubscribed} afgemeld`}
        action={
          <a
            href="/api/admin/newsletter/export"
            className="inline-flex items-center gap-xs rounded-full border border-outline-variant px-md py-xs text-label-md font-label-md text-on-surface-variant hover:border-primary hover:text-primary"
          >
            <Icon name="download" className="text-[18px]" /> Export (CSV)
          </a>
        }
      />

      <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
        <Card>
          <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">Handmatig toevoegen</h2>
          <p className="mb-sm text-label-md text-on-surface-variant">
            Alleen met aantoonbare toestemming. Wat je bij het bewijs invult, wordt bewaard als verantwoording (AVG art. 7).
          </p>
          <AddSubscriberForm verticals={listVerticals().map((v) => ({ id: v.id, label: v.label }))} />
        </Card>
        <Card>
          <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">Bestaande klanten</h2>
          <p className="mb-sm text-label-md text-on-surface-variant">
            Klanten mogen nieuws over vergelijkbare diensten ontvangen zonder aparte aanmelding (soft opt-in, Telecommunicatiewet 11.7), zolang elke mail een
            afmeldlink heeft. Afgemelde adressen worden nooit opnieuw toegevoegd. Nieuwe aanmelders via de website krijgen altijd eerst een bevestigingsmail.
          </p>
          <ImportCustomersButton />
        </Card>
      </div>

      <div className="mt-lg flex flex-wrap items-center gap-xs">
        <Link href="/admin/nieuwsbrief/abonnees" className={chip(!status)}>
          Alle
        </Link>
        {STATUSES.map((s) => (
          <Link key={s} href={`/admin/nieuwsbrief/abonnees?status=${s}`} className={chip(status === s)}>
            {SUBSCRIBER_STATUS[s].label}
          </Link>
        ))}
        <form className="ml-auto" action="/admin/nieuwsbrief/abonnees">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Zoek op e-mail of naam…"
            className="rounded-full border border-outline-variant bg-surface-container-lowest px-md py-xs text-label-md outline-none focus:border-primary"
          />
        </form>
      </div>

      <Card className="mt-md overflow-x-auto">
        {rows.length === 0 ? (
          <EmptyState icon="contacts" title="Geen abonnees gevonden" description="Voeg er handmatig toe, importeer je klanten of plaats het aanmeldformulier op de site." />
        ) : (
          <table className="w-full min-w-[760px] text-left text-label-md">
            <thead className="text-label-sm uppercase tracking-wide text-on-surface-variant">
              <tr className="border-b border-outline-variant/40">
                <th className="py-xs pr-sm">Contact</th>
                <th className="py-xs pr-sm">Status</th>
                <th className="py-xs pr-sm">Bron</th>
                <th className="py-xs pr-sm">Vak</th>
                <th className="py-xs pr-sm">Toestemming</th>
                <th className="py-xs">Sinds</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const s = SUBSCRIBER_STATUS[r.status as keyof typeof SUBSCRIBER_STATUS] ?? SUBSCRIBER_STATUS.pending;
                return (
                  <tr key={r.id} className="border-b border-outline-variant/20 align-top last:border-0">
                    <td className="py-xs pr-sm">
                      <div className="text-on-surface">{r.email}</div>
                      {r.name && <div className="text-on-surface-variant">{r.name}</div>}
                    </td>
                    <td className="py-xs pr-sm">
                      <Badge tone={s.tone}>{s.label}</Badge>
                    </td>
                    <td className="py-xs pr-sm capitalize text-on-surface-variant">{r.source}</td>
                    <td className="py-xs pr-sm text-on-surface-variant">{r.vertical ? getVerticalConfig(r.vertical).label : "—"}</td>
                    <td className="max-w-[16rem] py-xs pr-sm text-on-surface-variant">
                      {r.consentAt ? `${dt.format(r.consentAt)} · ` : ""}
                      {r.consentSource ?? "—"}
                    </td>
                    <td className="py-xs text-on-surface-variant">{dt.format(r.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
