import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HELP_ARTICLES, getHelpArticle, getHelpCategory } from "@/lib/help/articles";
import { renderMarkdown } from "@/lib/blog/markdown";
import { publicEnv } from "@/lib/env";
import { ArticleFeedback } from "@/components/help/article-feedback";
import { OpenChatButton } from "@/components/help/open-chat-button";
import { ButtonLink } from "@/components/ui/button";

export const revalidate = 3600;

export function generateStaticParams() {
  return HELP_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getHelpArticle(slug);
  if (!article) return { title: "Artikel niet gevonden" };
  return {
    title: article.title,
    description: article.summary.slice(0, 160),
    alternates: { canonical: `/help/${article.slug}` },
  };
}

export default async function HelpArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getHelpArticle(slug);
  if (!article) notFound();

  const category = getHelpCategory(article.category);
  const related = (article.related ?? []).map((s) => getHelpArticle(s)).filter((a) => a != null);
  const base = publicEnv.NEXT_PUBLIC_SITE_URL;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: article.title,
          acceptedAnswer: { "@type": "Answer", text: article.summary },
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Hulpcentrum", item: `${base}/help` },
        { "@type": "ListItem", position: 2, name: category?.title ?? "Artikel", item: `${base}/help/categorie/${article.category}` },
        { "@type": "ListItem", position: 3, name: article.title, item: `${base}/help/${article.slug}` },
      ],
    },
  ];

  return (
    <article className="bg-surface py-xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-3xl px-margin-mobile md:px-xl">
        <nav aria-label="Kruimelpad" className="mb-md flex flex-wrap items-center gap-xs text-label-md text-on-surface-variant">
          <Link href="/help" className="hover:text-primary">Hulpcentrum</Link>
          <span aria-hidden>/</span>
          <Link href={`/help/categorie/${article.category}`} className="hover:text-primary">{category?.title}</Link>
        </nav>

        <h1 className="mkt-h1 mb-md text-display-lg text-on-surface">{article.title}</h1>
        <p className="mb-lg rounded-xl bg-primary-fixed/40 p-md text-body-lg text-on-surface">{article.summary}</p>

        <div
          className="prose-blog flex flex-col gap-md text-body-lg text-on-surface"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(article.body) }}
        />

        <div className="mt-xl">
          <ArticleFeedback slug={article.slug} />
        </div>

        {related.length > 0 && (
          <div className="mt-xl">
            <h2 className="mb-sm text-label-md font-label-md uppercase tracking-wide text-on-surface-variant">Gerelateerde artikelen</h2>
            <ul className="flex flex-col gap-xs">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/help/${r.slug}`} className="text-body-md text-primary hover:underline">
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-xl rounded-xl border border-outline-variant/50 bg-white p-lg text-center">
          <h2 className="mkt-h3 text-headline-md text-on-surface">Nog een vraag?</h2>
          <p className="mt-xs mb-md text-body-md text-on-surface-variant">Vraag het onze AI-assistent of maak een ticket.</p>
          <div className="flex flex-wrap justify-center gap-sm">
            <OpenChatButton />
            <ButtonLink href="/contact" variant="outline">Maak een ticket</ButtonLink>
          </div>
        </div>
      </div>
    </article>
  );
}
