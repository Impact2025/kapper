import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { readingTimeMinutes, renderMarkdown, stripHtml } from "@/lib/blog/markdown";
import { getPublishedPost, listPublishedPosts } from "@/lib/blog/queries";
import { getKnowledgePost, listCategories } from "@/lib/kennisbank/queries";
import { env } from "@/lib/env";
import type { VerticalPack } from "@/lib/verticals";
import { siteUrlFor } from "@/lib/verticals/site-url";

/**
 * Marketing blog + kennisbank, one implementation for every vertical's site.
 * The kapper routes ((marketing)/blog, …) and the per-trade routes
 * (sites/[vertical]/blog, …) both render these; the vertical only changes
 * which articles are queried and the surrounding copy.
 */

const HEADER_GRADIENTS = [
  "from-primary to-primary-container",
  "from-secondary to-secondary-container",
  "from-primary to-secondary",
];

const dateFmt = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", year: "numeric" });

/* ============================ metadata ============================ */
export function blogIndexMeta(pack: VerticalPack): Metadata {
  return {
    title: pack.content.blogMetaTitle,
    description: pack.content.blogMetaDescription,
    alternates: { canonical: "/blog" },
  };
}

export function kennisbankIndexMeta(pack: VerticalPack): Metadata {
  return {
    title: pack.content.kennisbankTitle,
    description: pack.content.kennisbankDescription,
    alternates: { canonical: "/kennisbank" },
  };
}

function articleMeta(
  pack: VerticalPack,
  section: "blog" | "kennisbank",
  post: { slug: string; title: string; metaTitle: string | null; metaDescription: string | null; excerpt: string | null; keywords: string[]; publishedAt: Date | null },
): Metadata {
  const canonical = `/${section}/${post.slug}`;
  const description = post.metaDescription ?? post.excerpt ?? undefined;
  return {
    title: post.metaTitle ?? post.title,
    description,
    keywords: post.keywords,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: post.metaTitle ?? post.title,
      description,
      url: `${siteUrlFor(pack.id)}${canonical}`,
      publishedTime: post.publishedAt?.toISOString(),
    },
    twitter: { card: "summary_large_image", title: post.metaTitle ?? post.title, description },
  };
}

export async function blogPostMeta(pack: VerticalPack, slug: string): Promise<Metadata> {
  const post = await getPublishedPost(slug, pack.id);
  return post ? articleMeta(pack, "blog", post) : { title: "Artikel niet gevonden" };
}

export async function kennisbankPostMeta(pack: VerticalPack, slug: string): Promise<Metadata> {
  const post = await getKnowledgePost(slug, pack.id);
  return post ? articleMeta(pack, "kennisbank", post) : { title: "Artikel niet gevonden" };
}

/* ============================ shared bits ============================ */
type CardPost = {
  slug: string;
  title: string;
  excerpt: string | null;
  bodyMdx: string;
  bodyIsHtml: boolean;
  publishedAt: Date | null;
  keywords: string[];
  coverImage: string | null;
  coverImageAlt: string | null;
  category?: string | null;
};

function PostGrid({
  posts,
  section,
  categoryLabels,
}: {
  posts: CardPost[];
  section: "blog" | "kennisbank";
  categoryLabels?: Record<string, string>;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
      {posts.map((p, i) => {
        const minutes = readingTimeMinutes(p.bodyIsHtml ? stripHtml(p.bodyMdx) : p.bodyMdx);
        const tag = p.keywords[0];
        return (
          <Link
            key={p.slug}
            href={`/${section}/${p.slug}`}
            className="group flex flex-col overflow-hidden rounded-xl bg-white soft-shadow hover-lift"
          >
            <div className="relative h-40 w-full overflow-hidden">
              {p.coverImage ? (
                <Image
                  src={p.coverImage}
                  alt={p.coverImageAlt ?? p.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              ) : (
                <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${HEADER_GRADIENTS[i % HEADER_GRADIENTS.length]} p-md`}>
                  <span className="mkt-h3 text-headline-md font-semibold text-white text-center line-clamp-3">{p.title}</span>
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col p-lg">
              <div className="mb-sm flex items-center gap-sm">
                {p.category && (
                  <span className="rounded-full bg-secondary-container px-sm py-[2px] font-label-sm text-label-sm text-on-secondary-container">
                    {categoryLabels?.[p.category] || p.category}
                  </span>
                )}
                {tag && (
                  <span className="rounded-full bg-primary-fixed px-sm py-[2px] font-label-sm text-label-sm text-on-primary-fixed-variant">{tag}</span>
                )}
                <span className="flex items-center gap-[2px] font-label-sm text-label-sm text-on-surface-variant">
                  <Icon name="schedule" className="text-[14px]" />
                  {minutes} min
                </span>
              </div>

              <h2 className="mkt-h3 text-headline-md text-on-surface mb-sm">{p.title}</h2>
              <p className="font-body-md text-on-surface-variant line-clamp-3 mb-md">{p.excerpt}</p>

              <div className="mt-auto flex items-center justify-between border-t border-outline-variant/40 pt-sm">
                <span className="flex items-center gap-[4px] font-label-sm text-label-sm text-on-surface-variant">
                  <Icon name="calendar_today" className="text-[14px]" />
                  {p.publishedAt ? dateFmt.format(p.publishedAt) : ""}
                </span>
                <Icon name="arrow_forward" className="text-[18px] text-primary transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function IndexHeader({ badge, title, subtitle, children }: { badge: string; title: string; subtitle: string; children?: React.ReactNode }) {
  return (
    <div className="text-center mb-xl max-w-2xl mx-auto">
      <span className="inline-block px-sm py-xs bg-primary-fixed text-on-primary-fixed-variant rounded-full font-label-sm text-label-sm mb-md uppercase tracking-wider">
        {badge}
      </span>
      <h1 className="mkt-h1 text-display-lg text-on-surface mb-md">{title}</h1>
      <p className="font-body-lg text-body-lg text-on-surface-variant">{subtitle}</p>
      {children}
    </div>
  );
}

/* ============================ blog ============================ */
export async function BlogIndexView({ pack }: { pack: VerticalPack }) {
  let posts: CardPost[] = [];
  if (env.DATABASE_URL) {
    try {
      posts = await listPublishedPosts(pack.id);
    } catch (e) {
      console.error("[blog] list failed:", e);
    }
  }

  return (
    <section className="py-xl bg-surface">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl">
        <IndexHeader badge="Blog" title={pack.content.blogHeading} subtitle={pack.content.blogSubheading} />
        {posts.length === 0 ? (
          <div className="text-center py-xl">
            <Icon name="edit_note" className="text-primary-container text-[64px]" />
            <p className="font-body-md text-on-surface-variant mt-sm">Binnenkort verschijnen hier onze eerste artikelen.</p>
          </div>
        ) : (
          <PostGrid posts={posts} section="blog" />
        )}
      </div>
    </section>
  );
}

function ArticleFrame({
  pack,
  backHref,
  backLabel,
  jsonLd,
  post,
  showCover,
}: {
  pack: VerticalPack;
  backHref: string;
  backLabel: string;
  jsonLd: Record<string, unknown>;
  post: {
    title: string;
    bodyMdx: string;
    bodyIsHtml: boolean;
    publishedAt: Date | null;
    category?: string | null;
    coverImage?: string | null;
    coverImageAlt?: string | null;
    audioUrl?: string | null;
    audioTitle?: string | null;
    transcript?: string | null;
  };
  showCover: boolean;
}) {
  const html = post.bodyIsHtml ? post.bodyMdx : renderMarkdown(post.bodyMdx);
  const minutes = readingTimeMinutes(post.bodyIsHtml ? stripHtml(post.bodyMdx) : post.bodyMdx);
  const cta = pack.content.postCta;

  return (
    <article className="bg-surface py-xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-3xl px-margin-mobile md:px-xl">
        <Link href={backHref} className="mb-md inline-flex items-center gap-xs text-label-md text-on-surface-variant hover:text-primary">
          ← {backLabel}
        </Link>

        <header className="mb-lg">
          {post.category && (
            <span className="inline-block rounded-full bg-secondary-container px-sm py-[2px] font-label-sm text-label-sm text-on-secondary-container mb-sm">
              {pack.content.kennisbankCategories[post.category] || post.category}
            </span>
          )}
          <h1 className="mkt-h1 text-display-lg text-on-surface">{post.title}</h1>
          <p className="mt-sm text-label-md text-on-surface-variant">
            {post.publishedAt ? dateFmt.format(post.publishedAt) : ""} · {minutes} min lezen
          </p>
        </header>

        {showCover && post.coverImage && (
          <div className="relative mb-lg h-64 w-full overflow-hidden rounded-xl md:h-96">
            <Image src={post.coverImage} alt={post.coverImageAlt ?? post.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" />
          </div>
        )}

        {post.audioUrl && (
          <div className="mb-lg rounded-xl border border-outline-variant bg-surface-container-low p-md">
            <div className="mb-sm flex items-center gap-sm text-label-md font-label-md text-on-surface">
              <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">podcasts</span>
              {post.audioTitle || "Beluister dit artikel"}
            </div>
            <audio controls src={post.audioUrl} className="w-full" />
            {post.transcript && (
              <details className="mt-sm">
                <summary className="cursor-pointer text-label-md text-on-surface-variant hover:text-primary">Transcript bekijken</summary>
                <p className="mt-sm whitespace-pre-wrap text-body-md text-on-surface-variant">{post.transcript}</p>
              </details>
            )}
          </div>
        )}

        <div className="prose-blog flex flex-col gap-md text-body-lg text-on-surface" dangerouslySetInnerHTML={{ __html: html }} />

        <div className="mt-xl rounded-xl bg-primary-fixed/40 p-lg text-center">
          <h2 className="mkt-h3 text-headline-md text-on-surface">{cta.title}</h2>
          <p className="mt-xs text-body-md text-on-surface-variant">{cta.body}</p>
          <Link
            href={cta.href}
            className="mt-md inline-flex items-center gap-base rounded-full bg-primary px-xl py-sm text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 soft-shadow"
          >
            {cta.label}
          </Link>
        </div>
      </div>
    </article>
  );
}

export async function BlogPostView({ pack, slug }: { pack: VerticalPack; slug: string }) {
  const post = await getPublishedPost(slug, pack.id);
  if (!post) notFound();

  const jsonLd = post.jsonLd ?? {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription ?? post.excerpt ?? "",
    datePublished: post.publishedAt?.toISOString(),
    inLanguage: "nl-NL",
    url: `${siteUrlFor(pack.id)}/blog/${post.slug}`,
  };

  return <ArticleFrame pack={pack} backHref="/blog" backLabel="Terug naar blog" jsonLd={jsonLd} post={post} showCover />;
}

/* ============================ kennisbank ============================ */
export async function KennisbankIndexView({ pack }: { pack: VerticalPack }) {
  let posts: CardPost[] = [];
  let categories: string[] = [];

  if (env.DATABASE_URL) {
    try {
      const { db } = await import("@/lib/db");
      const { knowledgePosts } = await import("@/lib/db/schema");
      const { and, eq, desc } = await import("drizzle-orm");
      posts = await db
        .select({
          slug: knowledgePosts.slug,
          title: knowledgePosts.title,
          excerpt: knowledgePosts.excerpt,
          bodyMdx: knowledgePosts.bodyMdx,
          bodyIsHtml: knowledgePosts.bodyIsHtml,
          publishedAt: knowledgePosts.publishedAt,
          keywords: knowledgePosts.keywords,
          coverImage: knowledgePosts.coverImage,
          coverImageAlt: knowledgePosts.coverImageAlt,
          category: knowledgePosts.category,
        })
        .from(knowledgePosts)
        .where(and(eq(knowledgePosts.status, "published"), eq(knowledgePosts.vertical, pack.id)))
        .orderBy(desc(knowledgePosts.publishedAt));
      categories = await listCategories(pack.id);
    } catch (e) {
      console.error("[kennisbank] list failed:", e);
    }
  }

  return (
    <section className="py-xl bg-surface">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl">
        <IndexHeader badge="Kennisbank" title={pack.content.kennisbankHeading} subtitle={pack.content.kennisbankIntro}>
          {categories.length > 0 && (
            <div className="mt-lg flex flex-wrap justify-center gap-sm">
              {categories.map((cat) => (
                <span key={cat} className="inline-block rounded-full bg-surface-container-low px-sm py-[2px] font-label-sm text-label-sm text-on-surface-variant">
                  {pack.content.kennisbankCategories[cat] || cat}
                </span>
              ))}
            </div>
          )}
        </IndexHeader>

        {posts.length === 0 ? (
          <div className="text-center py-xl">
            <Icon name="import_contacts" className="text-primary-container text-[64px]" />
            <p className="font-body-md text-on-surface-variant mt-sm">Binnenkort verschijnen hier onze kennisbank-artikelen.</p>
          </div>
        ) : (
          <PostGrid posts={posts} section="kennisbank" categoryLabels={pack.content.kennisbankCategories} />
        )}
      </div>
    </section>
  );
}

export async function KennisbankPostView({ pack, slug }: { pack: VerticalPack; slug: string }) {
  const post = await getKnowledgePost(slug, pack.id);
  if (!post) notFound();

  const jsonLd = post.jsonLd ?? {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription ?? post.excerpt ?? "",
    datePublished: post.publishedAt?.toISOString(),
    inLanguage: "nl-NL",
    author: { "@type": "Person", name: "Vincent van Munster" },
    url: `${siteUrlFor(pack.id)}/kennisbank/${post.slug}`,
  };

  return <ArticleFrame pack={pack} backHref="/kennisbank" backLabel="Terug naar kennisbank" jsonLd={jsonLd} post={post} showCover={false} />;
}
