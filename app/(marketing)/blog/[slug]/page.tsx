import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedPost, listPublishedSlugs } from "@/lib/blog/queries";
import { renderMarkdown, readingTimeMinutes } from "@/lib/blog/markdown";
import { publicEnv } from "@/lib/env";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await listPublishedSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return { title: "Artikel niet gevonden" };

  const canonical = `/blog/${post.slug}`;
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
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();

  const html = renderMarkdown(post.bodyMdx);
  const minutes = readingTimeMinutes(post.bodyMdx);
  const dateFmt = new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const jsonLd = post.jsonLd ?? {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription ?? post.excerpt ?? "",
    datePublished: post.publishedAt?.toISOString(),
    inLanguage: "nl-NL",
    url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}`,
  };

  return (
    <article className="bg-surface py-xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-3xl px-margin-mobile md:px-xl">
        <Link
          href="/blog"
          className="mb-md inline-flex items-center gap-xs text-label-md text-on-surface-variant hover:text-primary"
        >
          ← Terug naar blog
        </Link>

        <header className="mb-lg">
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
            Ontdek wat KapperAssistent voor jouw salon kan betekenen.
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
