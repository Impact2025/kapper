import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { listLeads } from "@/lib/crm/queries";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";
import { formatEur } from "@/lib/utils";
import {
  LEAD_STAGES,
  LEAD_STAGE_LABELS,
  LEAD_STAGE_TONES,
  type LeadStage,
} from "@/lib/crm/constants";
import { cn } from "@/lib/utils";

function isStage(v: string | undefined): v is LeadStage {
  return !!v && (LEAD_STAGES as readonly string[]).includes(v);
}

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; q?: string }>;
}) {
  await getCurrentUser();
  const params = await searchParams;
  const stage = isStage(params.stage) ? params.stage : undefined;
  const search = params.q?.trim() || undefined;

  const leads = await listLeads({ stage, search });

  const dateFmt = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short" });

  return (
    <div>
      <PageHeader
        title="CRM & Leads"
        subtitle="Volg salons van scan tot klant."
      />

      <div className="mb-md flex flex-wrap items-center gap-sm">
        <FilterChip href="/admin/crm" label="Alle" active={!stage} q={search} />
        {LEAD_STAGES.map((s) => (
          <FilterChip
            key={s}
            href={`/admin/crm?stage=${s}`}
            label={LEAD_STAGE_LABELS[s]}
            active={stage === s}
            q={search}
          />
        ))}
        <form method="get" className="ml-auto flex items-center gap-xs">
          {stage && <input type="hidden" name="stage" value={stage} />}
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Zoek salon, e-mail, plaats…"
            className="rounded-full border border-outline-variant bg-surface-container-lowest px-md py-xs text-label-md outline-none focus:border-primary"
          />
        </form>
      </div>

      {leads.length === 0 ? (
        <EmptyState
          icon="inbox"
          title="Geen leads gevonden"
          description="Zodra een salon de gratis scan invult, verschijnt de lead hier automatisch."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant/40 text-label-sm uppercase tracking-wide text-on-surface-variant">
                <th className="px-md py-sm font-label-sm">Salon</th>
                <th className="px-md py-sm font-label-sm">Plaats</th>
                <th className="px-md py-sm font-label-sm">Fase</th>
                <th className="px-md py-sm text-right font-label-sm">Gemist/mnd</th>
                <th className="px-md py-sm text-right font-label-sm">Binnen</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-outline-variant/20 transition-colors hover:bg-primary/5"
                >
                  <td className="px-md py-sm">
                    <Link href={`/admin/crm/${lead.id}`} className="block">
                      <div className="text-body-md font-label-md text-on-surface">
                        {lead.salonName}
                      </div>
                      <div className="text-label-sm text-on-surface-variant">
                        {lead.email ?? "—"}
                      </div>
                    </Link>
                  </td>
                  <td className="px-md py-sm text-body-md text-on-surface-variant">
                    {lead.city ?? "—"}
                  </td>
                  <td className="px-md py-sm">
                    <Badge tone={LEAD_STAGE_TONES[lead.stage]}>
                      {LEAD_STAGE_LABELS[lead.stage]}
                    </Badge>
                  </td>
                  <td className="px-md py-sm text-right text-body-md font-label-md text-on-surface">
                    {lead.missedRevenueEstimate
                      ? formatEur(lead.missedRevenueEstimate)
                      : "—"}
                  </td>
                  <td className="px-md py-sm text-right text-label-sm text-on-surface-variant">
                    {dateFmt.format(lead.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function FilterChip({
  href,
  label,
  active,
  q,
}: {
  href: string;
  label: string;
  active: boolean;
  q?: string;
}) {
  const url = q ? `${href}${href.includes("?") ? "&" : "?"}q=${encodeURIComponent(q)}` : href;
  return (
    <Link
      href={url}
      className={cn(
        "rounded-full px-md py-xs text-label-md font-label-md transition-colors",
        active
          ? "bg-primary text-on-primary"
          : "bg-surface-container text-on-surface-variant hover:bg-primary/10",
      )}
    >
      {label}
    </Link>
  );
}
