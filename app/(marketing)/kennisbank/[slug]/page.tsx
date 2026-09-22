import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getKnowledgePost, listPublishedKnowledgeSlugs } from "@/lib/kennisbank/queries";
import { renderMarkdown, readingTimeMinutes, stripHtml } from "@/lib/blog/markdown";
import { publicEnv } from "@/lib/env";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await listPublishedKnowledgeSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getKnowledgePost(slug);
  if (!post) return { title: "Artikel niet gevonden" };

  const canonical = `/kennisbank/${post.slug}`;
  return {
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt ?? undefined,
    keywords: post.keywords,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: post.metaTitle ?? post.title,
      description: post.metaDescription ?? post.excerpt ?? undefined,
      url: `${publicEnv.NEXT_PUBLIC_SITE_URL}${canonical}`,
      publishedTime: post.publishedAt?.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle ?? post.title,
      description: post.metaDescription ?? post.excerpt ?? undefined,
    },
  };
}

export default async function KennisbankPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getKnowledgePost(slug);
  if (!post) notFound();

  const html = post.bodyIsHtml ? post.bodyMdx : renderMarkdown(post.bodyMdx);
  const minutes = readingTimeMinutes(post.bodyIsHtml ? stripHtml(post.bodyMdx) : post.bodyMdx);
  const dateFmt = new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const jsonLd = post.jsonLd ?? {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription ?? post.excerpt ?? "",
    datePublished: post.publishedAt?.toISOString(),
    inLanguage: "nl-NL",
    author: { "@type": "Person", name: "Vincent van Munster" },
    url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/kennisbank/${post.slug}`,
  };

  return (
    <article className="bg-surface py-xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-3xl px-margin-mobile md:px-xl">
        <Link
          href="/kennisbank"
          className="mb-md inline-flex items-center gap-xs text-label-md text-on-surface-variant hover:text-primary"
        >
          {" "}
          ← Terug naar kennisbank
        </Link>

        <header className="mb-lg">
          {post.category && (
            <span className="inline-block rounded-full bg-secondary-container px-sm py-[2px] font-label-sm text-label-sm text-on-secondary-container mb-sm">
              {post.category}
            </span>
          )}
          <h1 className="font-display-lg text-display-lg text-on-surface">{post.title}</h1>
          <p className="mt-sm text-label-md text-on-surface-variant">
            {post.publishedAt ? dateFmt.format(post.publishedAt) : ""} · {minutes} min lezen
          </p>
        </header>

        <div
          className="prose-blog flex flex-col gap-md text-body-lg text-on-surface"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <div className="mt-xl rounded-xl bg-primary-fixed/40 p-lg text-center">
          <h2 className="font-headline-md text-headline-md text-on-surface">
            Klaar om geen boeking meer te missen?
          </h2>
          <p className="mt-xs text-body-md text-on-surface-variant">
            Ontdek wat KapperAssistent voor jouw salon kan beteugen.
          </p>
          <Link
            href="/scan"
            className="mt-md inline-flex items-center gap-base rounded-full bg-primary px-xl py-sm text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 soft-shadow"
          >
            Start je gratis AI-scan
          </Link>
        </div>
      </div>
    </article>
  );
}
