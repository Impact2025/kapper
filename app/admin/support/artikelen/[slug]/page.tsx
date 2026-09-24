import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/dal";
import { getManagedArticles } from "@/lib/help/store";
import { resetArticleAction } from "@/lib/help/actions";
import { PageHeader } from "@/components/admin/ui";
import { ArticleEditor } from "@/components/support/article-editor";

export default async function EditArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  await requireRole("admin");
  const { slug } = await params;
  const article = (await getManagedArticles({ fresh: true })).find((a) => a.slug === slug);
  if (!article) notFound();

  return (
    <div>
      <Link href="/admin/support/artikelen" className="mb-md inline-block text-label-md text-on-surface-variant hover:text-primary">
        ← Artikelen
      </Link>
      <PageHeader
        title={article.title}
        subtitle={`/help/${article.slug} · ${article.source}${article.hidden ? " · verborgen" : ""}`}
        action={
          <div className="flex items-center gap-xs">
            <Link href={`/help/${article.slug}`} target="_blank" className="rounded-full border border-outline-variant px-md py-sm text-label-md hover:bg-primary/5">
              Bekijk publiek
            </Link>
            {article.source !== "standaard" && (
              <form action={resetArticleAction.bind(null, article.slug)}>
                <button className="rounded-full border border-error px-md py-sm text-label-md text-error hover:bg-error-container">
                  {article.source === "nieuw" ? "Verwijder artikel" : "Terug naar standaard"}
                </button>
              </form>
            )}
          </div>
        }
      />
      <ArticleEditor
        slugLocked
        initial={{
          slug: article.slug,
          title: article.title,
          category: article.category,
          summary: article.summary,
          body: article.body,
          keywords: article.keywords.join(", "),
          related: (article.related ?? []).join(", "),
          audience: article.audience,
          hidden: article.hidden,
        }}
      />
    </div>
  );
}
