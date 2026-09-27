import { requireRole } from "@/lib/auth/dal";
import { getUsageOverview } from "@/lib/admin/usage";
import { formatCompact, formatEurPrecise, monthlyMargin, type MarginTone } from "@/lib/admin/margin";
import { microToEur } from "@/lib/ai/pricing";
import { getVerticalConfig } from "@/lib/verticals";
import { PageHeader, StatCard, Card, Badge, EmptyState } from "@/components/admin/ui";
import { DailyBars, dayLabel } from "@/components/admin/cockpit/daily-bars";

const DAYS = 30;

const FEATURE_LABELS: Record<string, string> = {
  receptionist: "Receptioniste (WhatsApp/chat)",
  voice: "Telefoon (Vapi)",
  inventory: "Voorraad-assistent",
  support_chat: "Support-chat",
  support_draft: "Ticket-concepten",
  blog: "Blog genereren",
  report: "Rapporten",
  scan: "Website-scan",
  overig: "Overig",
};

const MARGIN_BADGE: Record<MarginTone, { tone: "success" | "warning" | "error" | "neutral"; label: string }> = {
  healthy: { tone: "success", label: "Gezond" },
  watch: { tone: "warning", label: "Let op" },
  loss: { tone: "error", label: "Verlies" },
  unknown: { tone: "neutral", label: "Geen omzet" },
};

export default async function AiUsagePage() {
  await requireRole("admin");
  const o = await getUsageOverview(DAYS);
  const t = o.totals;
  const totalEur = microToEur(t.costMicroEur);

  return (
    <div>
      <PageHeader
        title="AI-verbruik & marge"
        subtitle={`Tokens, belminuten en kosten per klant — laatste ${DAYS} dagen.`}
      />

      {t.unpricedCalls > 0 && (
        <Card className="mb-md border-secondary/40 bg-secondary-fixed/30">
          <p className="text-body-md text-on-surface">
            <strong>{t.unpricedCalls.toLocaleString("nl-NL")}</strong> AI-calls hebben nog geen prijs: stel{" "}
            <code className="rounded bg-surface-container-high px-1">AI_PRICING_JSON</code> in (euro per miljoen tokens per model).
            Tokens worden wel geteld; kosten tellen vanaf dan mee.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-md sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="AI-kosten" value={formatEurPrecise(totalEur)} icon="payments" hint={`${formatEurPrecise(microToEur(o.platformCostMicroEur))} eigen gebruik`} />
        <StatCard label="AI-calls" value={formatCompact(t.calls)} icon="bolt" hint={`${o.bySalon.length} actieve klanten`} />
        <StatCard
          label="Tokens"
          value={formatCompact(t.inputTokens + t.outputTokens)}
          icon="token"
          hint={`${formatCompact(t.inputTokens)} in · ${formatCompact(t.outputTokens)} uit`}
        />
        <StatCard label="Belminuten" value={formatCompact(Math.round(t.voiceSeconds / 60))} icon="call" hint="via Vapi" />
      </div>

      <Card className="mt-lg">
        <h2 className="mb-md font-headline-md text-headline-md text-on-surface">Kosten per dag</h2>
        <DailyBars
          ariaLabel="AI-kosten per dag"
          emptyText="Nog geen kosten in deze periode."
          maxLabel={(max) => `max ${formatEurPrecise(microToEur(max))}/dag`}
          points={o.daily.map((p) => ({
            day: p.day,
            value: p.costMicroEur,
            label: `${dayLabel(p.day)}: ${formatEurPrecise(microToEur(p.costMicroEur))} · ${p.calls.toLocaleString("nl-NL")} calls`,
          }))}
        />
      </Card>

      <Card className="mt-lg overflow-x-auto">
        <h2 className="mb-xs font-headline-md text-headline-md text-on-surface">Marge per klant</h2>
        <p className="mb-md text-label-md text-on-surface-variant">
          Abonnement tegenover AI- en belkosten, omgerekend naar een maand. &ldquo;Let op&rdquo; vanaf 30% van de omzet.
        </p>
        {o.bySalon.length === 0 ? (
          <EmptyState icon="query_stats" title="Nog geen verbruik gemeten" description="Zodra klanten gesprekken voeren verschijnt hier het verbruik per klant." />
        ) : (
          <table className="w-full min-w-[720px] text-left text-label-md">
            <thead className="text-label-sm uppercase tracking-wide text-on-surface-variant">
              <tr className="border-b border-outline-variant/40">
                <th className="py-xs pr-sm">Klant</th>
                <th className="py-xs pr-sm">Plan</th>
                <th className="py-xs pr-sm text-right">Calls</th>
                <th className="py-xs pr-sm text-right">Tokens</th>
                <th className="py-xs pr-sm text-right">Belmin.</th>
                <th className="py-xs pr-sm text-right">Kosten/mnd</th>
                <th className="py-xs pr-sm text-right">MRR</th>
                <th className="py-xs pr-sm text-right">Marge</th>
                <th className="py-xs"></th>
              </tr>
            </thead>
            <tbody>
              {o.bySalon.map((s) => {
                const m = monthlyMargin({ mrrCents: s.mrrCents, costMicroEur: s.costMicroEur, days: DAYS });
                const badge = MARGIN_BADGE[m.tone];
                return (
                  <tr key={s.salonId} className="border-b border-outline-variant/20 last:border-0">
                    <td className="py-xs pr-sm">
                      <div className="font-label-md text-on-surface">{s.name}</div>
                      <div className="text-label-sm text-on-surface-variant">{getVerticalConfig(s.vertical).label}</div>
                    </td>
                    <td className="py-xs pr-sm capitalize">{s.plan}</td>
                    <td className="py-xs pr-sm text-right tabular-nums">{s.calls.toLocaleString("nl-NL")}</td>
                    <td className="py-xs pr-sm text-right tabular-nums">{formatCompact(s.tokens)}</td>
                    <td className="py-xs pr-sm text-right tabular-nums">{Math.round(s.voiceSeconds / 60)}</td>
                    <td className="py-xs pr-sm text-right tabular-nums">{formatEurPrecise(m.costEurMonth)}</td>
                    <td className="py-xs pr-sm text-right tabular-nums">{formatEurPrecise(m.revenueEurMonth)}</td>
                    <td className="py-xs pr-sm text-right tabular-nums">{m.marginPct == null ? "—" : `${m.marginPct.toLocaleString("nl-NL")}%`}</td>
                    <td className="py-xs text-right">
                      <Badge tone={badge.tone}>{badge.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <Card className="mt-lg overflow-x-auto">
        <h2 className="mb-md font-headline-md text-headline-md text-on-surface">Per functie</h2>
        {o.byFeature.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">Nog geen AI-calls gemeten.</p>
        ) : (
          <table className="w-full min-w-[560px] text-left text-label-md">
            <thead className="text-label-sm uppercase tracking-wide text-on-surface-variant">
              <tr className="border-b border-outline-variant/40">
                <th className="py-xs pr-sm">Functie</th>
                <th className="py-xs pr-sm text-right">Calls</th>
                <th className="py-xs pr-sm text-right">Tokens</th>
                <th className="py-xs pr-sm text-right">Gem. latency</th>
                <th className="py-xs text-right">Kosten</th>
              </tr>
            </thead>
            <tbody>
              {o.byFeature.map((f) => (
                <tr key={f.feature} className="border-b border-outline-variant/20 last:border-0">
                  <td className="py-xs pr-sm text-on-surface">{FEATURE_LABELS[f.feature] ?? f.feature}</td>
                  <td className="py-xs pr-sm text-right tabular-nums">{f.calls.toLocaleString("nl-NL")}</td>
                  <td className="py-xs pr-sm text-right tabular-nums">{formatCompact(f.tokens)}</td>
                  <td className="py-xs pr-sm text-right tabular-nums">{f.avgLatencyMs == null ? "—" : `${(f.avgLatencyMs / 1000).toLocaleString("nl-NL", { maximumFractionDigits: 1 })} s`}</td>
                  <td className="py-xs text-right tabular-nums">{formatEurPrecise(microToEur(f.costMicroEur))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
