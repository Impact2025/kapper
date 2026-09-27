import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { listCustomers, type CustomerRow } from "@/lib/admin/customers";
import { formatEurPrecise } from "@/lib/admin/margin";
import type { HealthBand } from "@/lib/admin/health";
import { getVerticalConfig } from "@/lib/verticals";
import { PageHeader, StatCard, Card, EmptyState } from "@/components/admin/ui";
import { BAND_LABELS, HealthBadge, PLAN_LABELS, StatusBadge, relativeDays } from "@/components/admin/cockpit/labels";
import { cn } from "@/lib/utils";

const BANDS: HealthBand[] = ["risico", "aandacht", "gezond", "opgezegd"];

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ band?: string; vak?: string; q?: string }>;
}) {
  await requireRole("admin");
  const params = await searchParams;
  const all = await listCustomers();

  const band = BANDS.includes(params.band as HealthBand) ? (params.band as HealthBand) : undefined;
  const vak = params.vak || undefined;
  const q = params.q?.trim().toLowerCase() || "";
  const rows = all.filter(
    (c) =>
      (!band || c.health.band === band) &&
      (!vak || c.vertical === vak) &&
      (!q || c.name.toLowerCase().includes(q) || (c.city ?? "").toLowerCase().includes(q)),
  );

  const count = (b: HealthBand) => all.filter((c) => c.health.band === b).length;
  const verticals = [...new Set(all.map((c) => c.vertical))].sort();
  const href = (next: { band?: string; vak?: string }) => {
    const sp = new URLSearchParams();
    const b = "band" in next ? next.band : band;
    const v = "vak" in next ? next.vak : vak;
    if (b) sp.set("band", b);
    if (v) sp.set("vak", v);
    if (q) sp.set("q", q);
    const s = sp.toString();
    return s ? `/admin/klanten?${s}` : "/admin/klanten";
  };

  return (
    <div>
      <PageHeader title="Klanten" subtitle="Alle klanten met gezondheidsscore — wie heeft nu aandacht nodig?" />

      <div className="grid grid-cols-2 gap-md xl:grid-cols-4">
        <StatCard label="Risico" value={String(count("risico"))} icon="warning" hint="score onder 50" />
        <StatCard label="Aandacht" value={String(count("aandacht"))} icon="error" hint="score 50–74" />
        <StatCard label="Gezond" value={String(count("gezond"))} icon="check_circle" hint="score 75+" />
        <StatCard label="Opgezegd" value={String(count("opgezegd"))} icon="cancel" />
      </div>

      <div className="mt-lg flex flex-wrap items-center gap-xs">
        <Chip href={href({ band: undefined })} active={!band} label={`Alle (${all.length})`} />
        {BANDS.map((b) => (
          <Chip key={b} href={href({ band: b })} active={band === b} label={BAND_LABELS[b]} />
        ))}
        {verticals.length > 1 && <span className="mx-xs h-5 w-px bg-outline-variant" aria-hidden />}
        {verticals.length > 1 &&
          verticals.map((v) => (
            <Chip key={v} href={href({ vak: vak === v ? undefined : v })} active={vak === v} label={getVerticalConfig(v).label} />
          ))}
        <form className="ml-auto" action="/admin/klanten">
          {band && <input type="hidden" name="band" value={band} />}
          {vak && <input type="hidden" name="vak" value={vak} />}
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Zoek op naam of plaats…"
            className="rounded-full border border-outline-variant bg-surface-container-lowest px-md py-xs text-label-md outline-none focus:border-primary"
          />
        </form>
      </div>

      <Card className="mt-md overflow-x-auto">
        {rows.length === 0 ? (
          <EmptyState icon="groups" title="Geen klanten gevonden" description="Pas de filters aan of wacht op de eerste aanmelding." />
        ) : (
          <table className="w-full min-w-[860px] text-left text-label-md">
            <thead className="text-label-sm uppercase tracking-wide text-on-surface-variant">
              <tr className="border-b border-outline-variant/40">
                <th className="py-xs pr-sm">Klant</th>
                <th className="py-xs pr-sm">Gezondheid</th>
                <th className="py-xs pr-sm">Status</th>
                <th className="py-xs pr-sm text-right">MRR</th>
                <th className="py-xs pr-sm text-right">Gesprekken 14d</th>
                <th className="py-xs pr-sm text-right">AI-kosten 30d</th>
                <th className="py-xs pr-sm">Laatst ingelogd</th>
                <th className="py-xs">Volgende stap</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <CustomerTableRow key={c.id} c={c} />
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function CustomerTableRow({ c }: { c: CustomerRow }) {
  return (
    <tr className="border-b border-outline-variant/20 align-top last:border-0 hover:bg-surface-container-low">
      <td className="py-xs pr-sm">
        <Link href={`/admin/klanten/${c.id}`} className="font-label-md text-on-surface hover:text-primary hover:underline">
          {c.name}
        </Link>
        <div className="text-label-sm text-on-surface-variant">
          {getVerticalConfig(c.vertical).label} · {PLAN_LABELS[c.plan]}
          {c.city ? ` · ${c.city}` : ""}
        </div>
      </td>
      <td className="py-xs pr-sm">
        <HealthBadge health={c.health} />
      </td>
      <td className="py-xs pr-sm">
        <StatusBadge status={c.status} />
      </td>
      <td className="py-xs pr-sm text-right tabular-nums">{formatEurPrecise(c.mrrCents / 100)}</td>
      <td className="py-xs pr-sm text-right tabular-nums">{c.conversations14d.toLocaleString("nl-NL")}</td>
      <td className="py-xs pr-sm text-right tabular-nums">{formatEurPrecise(c.aiCostMicroEur30d / 1_000_000)}</td>
      <td className="py-xs pr-sm text-on-surface-variant">{relativeDays(c.lastLoginAt)}</td>
      <td className="max-w-[18rem] py-xs text-on-surface-variant">{c.health.nextAction}</td>
    </tr>
  );
}

function Chip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-md py-xs text-label-md font-label-md transition-colors",
        active ? "border-primary bg-primary text-on-primary" : "border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary",
      )}
    >
      {label}
    </Link>
  );
}
