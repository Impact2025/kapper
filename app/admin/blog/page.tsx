import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { listPosts } from "@/lib/blog/queries";
import { PageHeader, Card, Badge, EmptyState, AdminLink } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";

const STATUS_TONE = {
  draft: "neutral",
  review: "warning",
  published: "success",
} as const;

const STATUS_LABEL = {
  draft: "Concept",
  review: "Review",
  published: "Live",
} as const;

export default async function AdminBlogPage() {
  await getCurrentUser();
  const posts = await listPosts();
  const dateFmt = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div>
      <PageHeader
        title="Blog & SEO"
        subtitle="Genereer en beheer SEO-artikelen met AI."
        action={
          <AdminLink href="/admin/blog/new">
            <Icon name="auto_awesome" className="text-[18px]" />
            Nieuw artikel
          </AdminLink>
        }
      />

      {posts.length === 0 ? (
        <EmptyState
          icon="article"
          title="Nog geen artikelen"
          description="Genereer je eerste SEO-geoptimaliseerde blogpost met AI."
          action={
            <AdminLink href="/admin/blog/new">
              <Icon name="auto_awesome" className="text-[18px]" />
              Genereer met AI
            </AdminLink>
          }
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant/40 text-label-sm uppercase tracking-wide text-on-surface-variant">
                <th className="px-md py-sm font-label-sm">Titel</th>
                <th className="px-md py-sm font-label-sm">Status</th>
                <th className="px-md py-sm text-center font-label-sm">SEO</th>
                <th className="px-md py-sm text-right font-label-sm">Datum</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-outline-variant/20 transition-colors hover:bg-primary/5"
                >
                  <td className="px-md py-sm">
                    <Link href={`/admin/blog/${p.id}`} className="block">
                      <div className="text-body-md font-label-md text-on-surface">{p.title}</div>
                      <div className="text-label-sm text-on-surface-variant">/{p.slug}</div>
                    </Link>
                  </td>
                  <td className="px-md py-sm">
                    <Badge tone={STATUS_TONE[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                  </td>
                  <td className="px-md py-sm text-center">
                    <span
                      className={
                        p.seoScore >= 80
                          ? "text-primary font-label-md"
                          : p.seoScore >= 50
                            ? "text-secondary font-label-md"
                            : "text-error font-label-md"
                      }
                    >
                      {p.seoScore}
                    </span>
                  </td>
                  <td className="px-md py-sm text-right text-label-sm text-on-surface-variant">
                    {dateFmt.format(p.publishedAt ?? p.createdAt)}
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
