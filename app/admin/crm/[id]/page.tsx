import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { getLead } from "@/lib/crm/queries";
import { Card, Badge } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";
import { formatEur } from "@/lib/utils";
import {
  LEAD_STAGE_LABELS,
  LEAD_STAGE_TONES,
  ACTIVITY_LABELS,
  ACTIVITY_ICONS,
  type ActivityType,
} from "@/lib/crm/constants";
import { StageSelect, NoteForm, EmailForm } from "@/components/admin/crm/lead-actions";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await getCurrentUser();
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) notFound();

  const scan = lead.scanResult as
    | { summary?: string; revenue?: { totalMonthly?: number; totalYearly?: number }; performanceScore?: number | null; seoScore?: number | null }
    | null;
  const dt = new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div>
      <Link
        href="/admin/crm"
        className="mb-md inline-flex items-center gap-xs text-label-md text-on-surface-variant hover:text-primary"
      >
        <Icon name="arrow_back" className="text-[18px]" /> Terug naar leads
      </Link>

      <div className="mb-lg flex flex-wrap items-start justify-between gap-md">
        <div>
          <div className="flex items-center gap-sm">
            <h1 className="font-headline-lg text-headline-lg text-on-surface">
              {lead.salonName}
            </h1>
            <Badge tone={LEAD_STAGE_TONES[lead.stage]}>
              {LEAD_STAGE_LABELS[lead.stage]}
            </Badge>
          </div>
          <div className="mt-xs flex flex-wrap gap-md text-label-md text-on-surface-variant">
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="hover:text-primary">
                {lead.email}
              </a>
            )}
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="hover:text-primary">
                {lead.phone}
              </a>
            )}
            {lead.city && <span>{lead.city}</span>}
            {lead.url && (
              <a
                href={lead.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary"
              >
                Website ↗
              </a>
            )}
          </div>
        </div>
        <StageSelect leadId={lead.id} stage={lead.stage} />
      </div>

      <div className="grid grid-cols-1 gap-md lg:grid-cols-3">
        {/* Left column: scan + actions */}
        <div className="flex flex-col gap-md lg:col-span-1">
          {scan && (
            <Card>
              <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">
                Scan-resultaat
              </h2>
              {lead.missedRevenueEstimate != null && (
                <div className="mb-sm rounded-lg bg-primary-fixed/40 p-sm">
                  <div className="text-label-sm uppercase tracking-wide text-on-surface-variant">
                    Geschat gemist/maand
                  </div>
                  <div className="font-headline-md text-headline-md text-primary">
                    {formatEur(lead.missedRevenueEstimate)}
                  </div>
                </div>
              )}
              {scan.summary && (
                <p className="text-body-md text-on-surface-variant">{scan.summary}</p>
              )}
              {(scan.performanceScore != null || scan.seoScore != null) && (
                <div className="mt-sm flex gap-md text-label-sm text-on-surface-variant">
                  <span>Performance: {scan.performanceScore ?? "—"}/100</span>
                  <span>SEO: {scan.seoScore ?? "—"}/100</span>
                </div>
              )}
            </Card>
          )}

          <Card>
            <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">
              Acties
            </h2>
            <EmailForm leadId={lead.id} defaultTo={lead.email ?? ""} />
          </Card>

          {lead.emails.length > 0 && (
            <Card>
              <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">
                Verzonden e-mails
              </h2>
              <ul className="flex flex-col gap-xs">
                {lead.emails.map((m) => (
                  <li key={m.id} className="text-label-md text-on-surface-variant">
                    <span className="text-on-surface">{m.subject ?? "(geen onderwerp)"}</span>
                    {" · "}
                    {dt.format(m.createdAt)}
                    {m.status && m.status !== "sent" ? ` · ${m.status}` : ""}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* Right column: timeline */}
        <div className="lg:col-span-2">
          <Card>
            <h2 className="mb-md font-headline-md text-headline-md text-on-surface">
              Tijdlijn
            </h2>
            <div className="mb-md">
              <NoteForm leadId={lead.id} />
            </div>

            {lead.activities.length === 0 ? (
              <p className="text-body-md text-on-surface-variant">Nog geen activiteit.</p>
            ) : (
              <ol className="flex flex-col gap-md">
                {lead.activities.map((a) => {
                  const type = a.type as ActivityType;
                  return (
                    <li key={a.id} className="flex gap-sm">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
                        <Icon name={ACTIVITY_ICONS[type] ?? "circle"} className="text-[18px]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-xs">
                          <span className="text-label-md font-label-md text-on-surface">
                            {ACTIVITY_LABELS[type] ?? a.type}
                          </span>
                          <span className="text-label-sm text-on-surface-variant">
                            {dt.format(a.createdAt)}
                            {a.userName ? ` · ${a.userName}` : ""}
                          </span>
                        </div>
                        {a.body && (
                          <p className="whitespace-pre-wrap text-body-md text-on-surface-variant">
                            {a.body}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
