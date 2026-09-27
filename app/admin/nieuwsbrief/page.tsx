import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { listCampaigns } from "@/lib/newsletter/campaigns";
import { subscriberCounts } from "@/lib/newsletter/subscribers";
import { createCampaignAction } from "@/lib/newsletter/actions";
import { PageHeader, StatCard, Card, Badge, EmptyState } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";
import { campaignStatus, pct } from "@/components/admin/newsletter/labels";


export default async function NewsletterPage() {
  await requireRole("admin");
  const [campaigns, counts] = await Promise.all([listCampaigns(), subscriberCounts()]);
  const dt = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Amsterdam" });

  return (
    <div>
      <PageHeader
        title="Nieuwsbrief"
        subtitle="Campagnes maken, testen, inplannen en meten."
        action={
          <form action={createCampaignAction}>
            <button className="inline-flex items-center gap-base rounded-full bg-primary px-md py-sm text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 soft-shadow">
              <Icon name="add" className="text-[18px]" /> Nieuwe nieuwsbrief
            </button>
          </form>
        }
      />

      <div className="grid grid-cols-1 gap-md sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Aangemeld" value={String(counts.subscribed)} icon="mark_email_read" hint={`${counts.pending} wachten op bevestiging`} />
        <StatCard label="Afgemeld" value={String(counts.unsubscribed)} icon="unsubscribe" />
        <StatCard label="Bounce / spam" value={String(counts.bounced)} icon="report" />
        <Link href="/admin/nieuwsbrief/abonnees" className="block">
          <StatCard label="Abonnees beheren" value="→" icon="contacts" hint={`${counts.total} adressen totaal`} />
        </Link>
      </div>

      <Card className="mt-lg overflow-x-auto">
        {campaigns.length === 0 ? (
          <EmptyState icon="campaign" title="Nog geen campagnes" description="Maak je eerste nieuwsbrief — of zet een blogartikel met één klik om in een mail." />
        ) : (
          <table className="w-full min-w-[720px] text-left text-label-md">
            <thead className="text-label-sm uppercase tracking-wide text-on-surface-variant">
              <tr className="border-b border-outline-variant/40">
                <th className="py-xs pr-sm">Campagne</th>
                <th className="py-xs pr-sm">Status</th>
                <th className="py-xs pr-sm text-right">Ontvangers</th>
                <th className="py-xs pr-sm text-right">Geopend</th>
                <th className="py-xs pr-sm text-right">Geklikt</th>
                <th className="py-xs">Datum</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => {
                const s = campaignStatus(c.status);
                return (
                  <tr key={c.id} className="border-b border-outline-variant/20 last:border-0 hover:bg-surface-container-low">
                    <td className="py-xs pr-sm">
                      <Link href={`/admin/nieuwsbrief/${c.id}`} className="font-label-md text-on-surface hover:text-primary hover:underline">
                        {c.name}
                      </Link>
                      <div className="text-on-surface-variant">{c.subject || "(nog geen onderwerp)"}</div>
                    </td>
                    <td className="py-xs pr-sm">
                      <Badge tone={s.tone}>{s.label}</Badge>
                    </td>
                    <td className="py-xs pr-sm text-right tabular-nums">{c.recipients || "—"}</td>
                    <td className="py-xs pr-sm text-right tabular-nums">{pct(c.opened, c.recipients)}</td>
                    <td className="py-xs pr-sm text-right tabular-nums">{pct(c.clicked, c.recipients)}</td>
                    <td className="py-xs text-on-surface-variant">
                      {c.sentAt ? dt.format(c.sentAt) : c.scheduledAt ? `gepland ${dt.format(c.scheduledAt)}` : dt.format(c.updatedAt)}
                    </td>
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
