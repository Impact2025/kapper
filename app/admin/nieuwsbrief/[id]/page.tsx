import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/dal";
import { campaignStats, getCampaign } from "@/lib/newsletter/campaigns";
import { parseBlocks } from "@/lib/newsletter/blocks";
import { parseSegment } from "@/lib/newsletter/segment";
import { editorBrands } from "@/lib/newsletter/brands";
import { deleteCampaignAction, duplicateCampaignAction } from "@/lib/newsletter/actions";
import { Card, StatCard, Badge } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";
import { CampaignEditor } from "@/components/admin/newsletter/campaign-editor";
import { campaignStatus, pct } from "@/components/admin/newsletter/labels";

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole("admin");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  const status = campaignStatus(campaign.status);
  const delivered = campaign.status === "sending" || campaign.status === "sent";
  const stats = delivered ? await campaignStats(id) : null;
  const linkBtn =
    "inline-flex items-center gap-[4px] rounded-full border border-outline-variant px-sm py-[4px] text-label-md font-label-md text-on-surface-variant transition-colors hover:border-primary hover:text-primary";

  return (
    <div>
      <div className="mb-sm flex flex-wrap items-center gap-xs">
        <Link href="/admin/nieuwsbrief" className="inline-flex items-center gap-xs text-label-md text-on-surface-variant hover:text-primary">
          <Icon name="arrow_back" className="text-[18px]" /> Alle campagnes
        </Link>
        <span className="flex-1" />
        <Badge tone={status.tone}>{status.label}</Badge>
        <form action={duplicateCampaignAction.bind(null, id)}>
          <button className={linkBtn}>
            <Icon name="content_copy" className="text-[16px]" /> Dupliceren
          </button>
        </form>
        {campaign.status === "draft" && (
          <form action={deleteCampaignAction.bind(null, id)}>
            <button className={linkBtn}>
              <Icon name="delete" className="text-[16px]" /> Verwijderen
            </button>
          </form>
        )}
      </div>

      {stats && (
        <div className="mb-lg flex flex-col gap-md">
          <div className="grid grid-cols-2 gap-md xl:grid-cols-5">
            <StatCard label="Verzonden" value={`${stats.sent}/${stats.recipients}`} icon="send" hint={stats.failed ? `${stats.failed} mislukt` : undefined} />
            <StatCard label="Geopend" value={pct(stats.opened, stats.sent)} icon="drafts" hint={`${stats.opened} ontvangers`} />
            <StatCard label="Geklikt" value={pct(stats.clicked, stats.sent)} icon="ads_click" hint={`${pct(stats.clicked, stats.opened)} van de openers`} />
            <StatCard label="Afgemeld" value={String(stats.unsubscribed)} icon="unsubscribe" hint={pct(stats.unsubscribed, stats.sent)} />
            <StatCard label="Bounce / spam" value={String(stats.bounced)} icon="report" />
          </div>
          <p className="text-label-md text-on-surface-variant">
            Opens zijn een ondergrens-schatting: Apple Mail laadt afbeeldingen vooraf en veel zakelijke clients blokkeren ze. Kliks zijn betrouwbaar.
          </p>
          <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
            {stats.byVariant.length > 1 && (
              <Card>
                <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">A/B-test onderwerp</h2>
                <table className="w-full text-label-md">
                  <thead className="text-label-sm uppercase tracking-wide text-on-surface-variant">
                    <tr>
                      <th className="py-xs text-left">Variant</th>
                      <th className="py-xs text-right">Verzonden</th>
                      <th className="py-xs text-right">Geopend</th>
                      <th className="py-xs text-right">Geklikt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.byVariant.map((v) => (
                      <tr key={v.variant} className="border-t border-outline-variant/20">
                        <td className="py-xs">
                          <span className="font-label-md">{v.variant}</span>{" "}
                          <span className="text-on-surface-variant">{v.variant === "B" ? campaign.subjectB : campaign.subject}</span>
                        </td>
                        <td className="py-xs text-right tabular-nums">{v.sent}</td>
                        <td className="py-xs text-right tabular-nums">{pct(v.opened, v.sent)}</td>
                        <td className="py-xs text-right tabular-nums">{pct(v.clicked, v.sent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
            <Card>
              <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">Meest geklikte links</h2>
              {stats.topLinks.length === 0 ? (
                <p className="text-body-md text-on-surface-variant">Nog geen kliks.</p>
              ) : (
                <ul className="flex flex-col gap-xs text-label-md">
                  {stats.topLinks.map((l) => (
                    <li key={l.url} className="flex items-center justify-between gap-sm">
                      <a href={l.url} target="_blank" rel="noopener noreferrer" className="truncate text-on-surface hover:text-primary hover:underline">
                        {l.url.replace(/^https?:\/\//, "")}
                      </a>
                      <span className="tabular-nums text-on-surface-variant">{l.clicks}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}

      <CampaignEditor
        campaignId={id}
        status={campaign.status}
        scheduledAt={campaign.scheduledAt?.toISOString() ?? null}
        brands={editorBrands()}
        previewRecipient={{ name: admin.name, email: admin.email }}
        initial={{
          name: campaign.name,
          subject: campaign.subject,
          subjectB: campaign.subjectB,
          previewText: campaign.previewText,
          vertical: campaign.vertical,
          blocks: parseBlocks(campaign.blocks),
          segment: parseSegment(campaign.segment),
        }}
      />
    </div>
  );
}
