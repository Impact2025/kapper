import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { getManagedArticles } from "@/lib/help/store";
import { HELP_CATEGORIES } from "@/lib/help/articles";
import { PageHeader, Card, Badge, AdminLink } from "@/components/admin/ui";

export default async function AdminArticlesPage({ searchParams }: { searchParams: Promise<{ opgeslagen?: string }> }) {
  await requireRole("admin");
  const { opgeslagen } = await searchParams;
  const articles = await getManagedArticles({ fresh: true });
  const catTitle = (id: string) => HELP_CATEGORIES.find((c) => c.id === id)?.title ?? id;

  return (
    <div>
      <Link href="/admin/support" className="mb-md inline-block text-label-md text-on-surface-variant hover:text-primary">
        ← Tickets
      </Link>
      <PageHeader
        title="Hulpcentrum-artikelen"
        subtitle="Pas antwoorden aan of voeg nieuwe toe. Wijzigingen zijn direct zichtbaar in hulpcentrum, FAQ en de AI-chat."
        action={<AdminLink href="/admin/support/artikelen/nieuw">Nieuw artikel</AdminLink>}
      />
      {opgeslagen && <div className="mb-md rounded-lg bg-primary-fixed p-sm text-label-md text-on-primary-fixed">Artikel opgeslagen en gepubliceerd.</div>}

      <Card className="overflow-x-auto p-0">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant/40 text-label-sm uppercase tracking-wide text-on-surface-variant">
              <th className="px-md py-sm font-label-sm">Artikel</th>
              <th className="px-md py-sm font-label-sm">Categorie</th>
              <th className="px-md py-sm font-label-sm">Status</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a.slug} className="border-b border-outline-variant/20 hover:bg-primary/5">
                <td className="px-md py-sm">
                  <Link href={`/admin/support/artikelen/${a.slug}`} className="text-body-md font-label-md text-on-surface hover:text-primary">
                    {a.title}
                  </Link>
                  <div className="text-label-sm text-on-surface-variant">/help/{a.slug}</div>
                </td>
                <td className="px-md py-sm text-label-md">{catTitle(a.category)}</td>
                <td className="px-md py-sm">
                  <div className="flex gap-xs">
                    <Badge tone={a.source === "standaard" ? "neutral" : a.source === "nieuw" ? "success" : "primary"}>{a.source}</Badge>
                    {a.hidden && <Badge tone="warning">verborgen</Badge>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
