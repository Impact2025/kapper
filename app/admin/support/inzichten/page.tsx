import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { getSupportInsights } from "@/lib/support/insights";
import { getHelpArticle } from "@/lib/help/articles";
import { PageHeader, Card, StatCard, EmptyState } from "@/components/admin/ui";

function fmtMinutes(m: number | null): string {
  if (m == null) return "—";
  if (m < 60) return `${m} min`;
  const h = m / 60;
  return h < 48 ? `${h.toFixed(1)} uur` : `${(h / 24).toFixed(1)} dagen`;
}

export default async function SupportInsightsPage() {
  await requireRole("admin");
  const i = await getSupportInsights(30);

  return (
    <div>
      <Link href="/admin/support" className="mb-md inline-block text-label-md text-on-surface-variant hover:text-primary">
        ← Tickets
      </Link>
      <PageHeader title="Support-inzichten" subtitle={`Laatste ${i.days} dagen. Onbeantwoorde vragen en zwakke artikelen zijn je contentbacklog.`} />

      <div className="mb-lg grid grid-cols-2 gap-sm lg:grid-cols-4">
        <StatCard label="Tickets" value={String(i.tickets.total)} icon="confirmation_number" />
        <StatCard label="Gem. eerste reactie" value={fmtMinutes(i.tickets.avgFirstResponseMinutes)} icon="schedule" hint={i.tickets.slaBreachRate != null ? `${i.tickets.slaBreachRate}% buiten SLA` : undefined} />
        <StatCard label="Tevredenheid" value={i.tickets.avgCsat != null ? `${i.tickets.avgCsat}/5` : "—"} icon="sentiment_satisfied" hint={`${i.tickets.csatCount} beoordelingen`} />
        <StatCard label="Chat-deflectie" value={i.chat.deflectionRate != null ? `${i.chat.deflectionRate}%` : "—"} icon="smart_toy" hint={`${i.chat.chats} chats · ${i.chat.ticketsFromChat} werden ticket`} />
      </div>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
        <div>
          <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">Onbeantwoorde vragen</h2>
          {i.unanswered.length === 0 ? (
            <EmptyState icon="task_alt" title="Geen missers" description="Alle zoekopdrachten en chatvragen hadden een antwoord." />
          ) : (
            <Card className="p-0">
              <ul className="divide-y divide-outline-variant/30">
                {i.unanswered.map((u) => (
                  <li key={u.query} className="flex items-center justify-between gap-md px-md py-sm">
                    <span className="truncate text-body-md text-on-surface">{u.query}</span>
                    <span className="shrink-0 rounded-full bg-secondary-fixed px-sm py-[2px] text-label-sm">{u.n}×</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div>
          <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">Artikelen die beter kunnen</h2>
          {i.weakArticles.length === 0 ? (
            <EmptyState icon="thumb_up" title="Geen negatieve feedback" description="Nog geen 👎 op artikelen in deze periode." />
          ) : (
            <Card className="p-0">
              <ul className="divide-y divide-outline-variant/30">
                {i.weakArticles.map((w) => (
                  <li key={w.slug} className="px-md py-sm">
                    <div className="flex items-center justify-between gap-md">
                      <Link href={`/help/${w.slug}`} target="_blank" className="truncate text-body-md text-primary hover:underline">
                        {getHelpArticle(w.slug)?.title ?? w.slug}
                      </Link>
                      <span className="shrink-0 text-label-sm text-on-surface-variant">👎 {w.down} · 👍 {w.up}</span>
                    </div>
                    {w.comments.slice(0, 2).map((c, idx) => (
                      <p key={idx} className="mt-xs text-label-sm text-on-surface-variant">“{c}”</p>
                    ))}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <p className="mt-sm text-label-sm text-on-surface-variant">
            Chat-antwoorden: 👍 {i.chat.thumbsUp} · 👎 {i.chat.thumbsDown}
          </p>
        </div>
      </div>
    </div>
  );
}
