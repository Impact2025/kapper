import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { getOverviewMetrics } from "@/lib/admin/metrics";
import { getCockpitOverview } from "@/lib/admin/overview";
import { listCustomers } from "@/lib/admin/customers";
import { formatEurPrecise } from "@/lib/admin/margin";
import { PageHeader, StatCard, Card, Badge } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";
import { HealthBadge } from "@/components/admin/cockpit/labels";
import { formatEur } from "@/lib/utils";
import { LEAD_STAGE_LABELS } from "@/lib/crm/constants";

const FEED_LABELS: Record<string, { label: string; icon: string }> = {
  booking_made: { label: "boekte een afspraak via de AI", icon: "event_available" },
  call_handled: { label: "telefoongesprek afgehandeld", icon: "call" },
  escalated: { label: "gesprek doorgezet naar medewerker", icon: "support_agent" },
  no_show_prevented: { label: "no-show voorkomen", icon: "event_busy" },
  webshop_order_paid: { label: "webshop-bestelling betaald", icon: "shopping_bag" },
  login: { label: "logde in", icon: "login" },
};

export default async function AdminOverviewPage() {
  const [user, metrics, o, customers] = await Promise.all([
    getCurrentUser(),
    getOverviewMetrics(),
    getCockpitOverview(),
    listCustomers(),
  ]);

  const mrrEur = o.mrrCents / 100;
  const aiEur = o.aiCostMicroEur30d / 1_000_000;
  const aiMarginPct = mrrEur > 0 ? Math.round((1 - aiEur / mrrEur) * 1000) / 10 : null;
  const attention = customers.filter((c) => c.health.band === "risico" || c.health.band === "aandacht").slice(0, 6);
  const m = o.movements;
  const netNew = m ? (m.endCents - m.startCents) / 100 : null;
  const time = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });

  return (
    <div>
      <PageHeader
        title={`Welkom terug, ${user.name?.split(" ")[0] ?? "team"}`}
        subtitle="Omzet, klantgezondheid, verbruik en support in één oogopslag."
      />

      <div className="grid grid-cols-1 gap-md sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="MRR"
          value={formatEur(mrrEur)}
          icon="trending_up"
          hint={netNew == null ? `${formatEur(mrrEur * 12)} ARR` : `${netNew >= 0 ? "+" : ""}${formatEur(netNew)} in 30 dagen`}
        />
        <StatCard
          label="Actieve klanten"
          value={String(o.activeCustomers)}
          icon="storefront"
          hint={`${o.trials} in proefperiode${o.pastDue ? ` · ${o.pastDue} achterstallig` : ""}`}
        />
        <StatCard
          label="AI-marge 30d"
          value={aiMarginPct == null ? "—" : `${aiMarginPct.toLocaleString("nl-NL")}%`}
          icon="token"
          hint={`${formatEurPrecise(aiEur)} AI-kosten`}
        />
        <StatCard
          label="Open tickets"
          value={String(o.openTickets)}
          icon="support_agent"
          hint={o.breachedTickets ? `${o.breachedTickets} over de SLA` : "alles binnen SLA"}
        />
      </div>

      <div className="mt-lg grid grid-cols-1 gap-md lg:grid-cols-2">
        <Card>
          <div className="mb-md flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md text-on-surface">MRR-beweging</h2>
            {m && (
              <span className="text-label-sm text-on-surface-variant">
                {m.fromDay} → {m.toDay}
              </span>
            )}
          </div>
          {!m ? (
            <p className="text-body-md text-on-surface-variant">
              Beschikbaar zodra er MRR-historie is: de nachtelijke verwerking legt vanaf nu elke dag een momentopname vast.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-sm sm:grid-cols-3">
              <Movement label="Nieuw" cents={m.newCents} sign="+" note={`${m.newCustomers} klant(en)`} />
              <Movement label="Uitbreiding" cents={m.expansionCents} sign="+" />
              <Movement label="Krimp" cents={m.contractionCents} sign="−" />
              <Movement label="Opgezegd" cents={m.churnCents} sign="−" note={`${m.churnedCustomers} klant(en)`} />
              <div className="rounded-lg bg-surface-container-low p-sm">
                <div className="text-label-sm uppercase tracking-wide text-on-surface-variant">Netto-behoud</div>
                <div className="stat-figure text-headline-md text-on-surface">{m.nrrPct == null ? "—" : `${m.nrrPct.toLocaleString("nl-NL")}%`}</div>
              </div>
              <div className="rounded-lg bg-surface-container-low p-sm">
                <div className="text-label-sm uppercase tracking-wide text-on-surface-variant">Proef → betaald</div>
                <div className="stat-figure text-headline-md text-on-surface">{o.trialConversionPct == null ? "—" : `${o.trialConversionPct}%`}</div>
                <div className="text-label-sm text-on-surface-variant">laatste 90 dagen</div>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-md flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md text-on-surface">Aandacht nodig</h2>
            <Link href="/admin/klanten?band=risico" className="text-label-md font-label-md text-primary hover:underline">
              Alle klanten →
            </Link>
          </div>
          {attention.length === 0 ? (
            <p className="text-body-md text-on-surface-variant">Alle klanten zijn gezond.</p>
          ) : (
            <ul className="flex flex-col gap-sm">
              {attention.map((c) => (
                <li key={c.id}>
                  <Link href={`/admin/klanten/${c.id}`} className="block rounded-lg px-xs py-[2px] hover:bg-surface-container-low">
                    <div className="flex items-center justify-between gap-sm">
                      <span className="font-label-md text-on-surface">{c.name}</span>
                      <HealthBadge health={c.health} />
                    </div>
                    <p className="text-label-md text-on-surface-variant">{c.health.nextAction}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-lg grid grid-cols-1 gap-md lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-md font-headline-md text-headline-md text-on-surface">Live activiteit</h2>
          {o.feed.length === 0 ? (
            <p className="text-body-md text-on-surface-variant">Nog geen activiteit van klanten.</p>
          ) : (
            <ul className="flex flex-col gap-xs">
              {o.feed.map((e, i) => {
                const meta = FEED_LABELS[e.type] ?? { label: e.type, icon: "bolt" };
                return (
                  <li key={i} className="flex items-start gap-xs text-label-md">
                    <Icon name={meta.icon} className="mt-[2px] text-[16px] text-on-surface-variant" />
                    <span className="flex-1 text-on-surface">
                      {e.salonId ? (
                        <Link href={`/admin/klanten/${e.salonId}`} className="font-label-md hover:text-primary hover:underline">
                          {e.salonName ?? "Onbekende klant"}
                        </Link>
                      ) : (
                        "Onbekend"
                      )}{" "}
                      {meta.label}
                    </span>
                    <span className="whitespace-nowrap text-on-surface-variant">{time.format(e.createdAt)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="flex flex-col gap-md">
          <Card>
            <div className="mb-md flex items-center justify-between">
              <h2 className="font-headline-md text-headline-md text-on-surface">Pipeline</h2>
              <Link href="/admin/crm" className="text-label-md font-label-md text-primary hover:underline">
                Naar CRM →
              </Link>
            </div>
            <div className="flex flex-col gap-sm">
              {Object.entries(LEAD_STAGE_LABELS).map(([stage, label]) => (
                <div key={stage} className="flex items-center justify-between">
                  <span className="text-body-md text-on-surface-variant">{label}</span>
                  <Badge tone={stage === "customer" ? "success" : "neutral"}>{metrics.leadsByStage[stage] ?? 0}</Badge>
                </div>
              ))}
            </div>
            <p className="mt-sm text-label-sm text-on-surface-variant">
              {metrics.newLeads} nieuwe leads · {formatEur(metrics.pipelineRevenue)} geschat gemist/maand
            </p>
          </Card>

          <Card>
            <h2 className="mb-md font-headline-md text-headline-md text-on-surface">Snel aan de slag</h2>
            <div className="flex flex-col gap-sm">
              <QuickLink href="/admin/klanten" icon="groups" label="Klanten & gezondheid" />
              <QuickLink href="/admin/ai-verbruik" icon="token" label="AI-verbruik & marge" />
              <QuickLink href="/admin/blog/new" icon="auto_awesome" label="AI-blogpost genereren" />
              <QuickLink href="/admin/support" icon="support_agent" label="Tickets beantwoorden" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Movement({ label, cents, sign, note }: { label: string; cents: number; sign: "+" | "−"; note?: string }) {
  return (
    <div className="rounded-lg bg-surface-container-low p-sm">
      <div className="text-label-sm uppercase tracking-wide text-on-surface-variant">{label}</div>
      <div className="stat-figure text-headline-md text-on-surface">
        {cents ? sign : ""}
        {formatEur(cents / 100)}
      </div>
      {note && <div className="text-label-sm text-on-surface-variant">{note}</div>}
    </div>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-sm rounded-lg border border-outline-variant/40 px-sm py-sm text-body-md text-on-surface transition-colors hover:bg-primary/5 hover:text-primary"
    >
      <Icon name={icon} className="text-[20px]" />
      {label}
    </Link>
  );
}
