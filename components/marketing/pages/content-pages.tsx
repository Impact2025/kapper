import type { Metadata } from "next";
import { NewsletterSignup } from "@/components/marketing/newsletter-signup";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { readingTimeMinutes, renderMarkdown, stripHtml } from "@/lib/blog/markdown";
import { getPublishedPost, listPublishedPosts } from "@/lib/blog/queries";
import { getKnowledgePost, listCategories, listPublishedKnowledgePosts } from "@/lib/kennisbank/queries";
import { articleLd, breadcrumbLd, collectionLd, ldJson, type BrandRef, type Crumb } from "@/lib/seo/jsonld";
import { WAI } from "@/lib/seo/wai";
import { rankRelated, withHeadingIds, type TocEntry } from "@/lib/seo/article";
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

export function kennisbankCategoryMeta(pack: VerticalPack, category: string): Metadata {
  const label = pack.content.kennisbankCategories[category] ?? category;
  return {
    title: `${label} — kennisbank`,
    description: `Alle kennisbank-artikelen over ${label.toLowerCase()}: ${pack.content.kennisbankDescription}`.slice(0, 160),
    alternates: { canonical: `/kennisbank/categorie/${category}` },
  };
}

/** Brand block used in schema.org markup — kapper carries its logo, trades are text-only. */
export function brandRef(pack: VerticalPack): BrandRef {
  const siteUrl = siteUrlFor(pack.id);
  return {
    name: `${pack.brand.name}.nl`,
    siteUrl,
    description: pack.brand.description,
    ...(pack.id === "kapper" ? { logo: `${siteUrl}/logo.png` } : {}),
  };
}

function LdScripts({ data }: { data: object[] }) {
  return (
    <>
      {data.map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(d) }} />
      ))}
    </>
  );
}

function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Kruimelpad" className="mb-md text-label-md text-on-surface-variant">
      <ol className="flex flex-wrap items-center gap-xs">
        {crumbs.map((c, i) => (
          <li key={c.path} className="flex items-center gap-xs">
            {i > 0 && <span aria-hidden="true">/</span>}
            {i === crumbs.length - 1 ? (
              <span aria-current="page" className="text-on-surface">{c.name}</span>
            ) : (
              <Link href={c.path} className="hover:text-primary">{c.name}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function articleMeta(
  pack: VerticalPack,
  section: "blog" | "kennisbank",
  post: { slug: string; title: string; metaTitle: string | null; metaDescription: string | null; excerpt: string | null; keywords: string[]; publishedAt: Date | null; updatedAt?: Date },
): Metadata {
  const canonical = `/${section}/${post.slug}`;
  const description = post.metaDescription ?? post.excerpt ?? undefined;
  return {
    // An explicit meta title is the complete <title> (the SEO check scores it as 30-60 chars in
    // full), so it skips the site suffix; without one the site template applies.
    title: post.metaTitle ? { absolute: post.metaTitle } : post.title,
    description,
    keywords: post.keywords,
    alternates: { canonical },
    openGraph: {
      type: "article",
      locale: "nl_NL",
      siteName: `${pack.brand.name}.nl`,
      title: post.metaTitle ?? post.title,
      description,
      url: `${siteUrlFor(pack.id)}${canonical}`,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt?.toISOString(),
      authors: ["Vincent van Munster"],
      tags: post.keywords,
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
  const siteUrl = siteUrlFor(pack.id);

  return (
    <section className="py-xl bg-surface">
      <LdScripts
        data={[
          breadcrumbLd(siteUrl, [{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }]),
          collectionLd(siteUrl, {
            name: pack.content.blogHeading,
            description: pack.content.blogMetaDescription,
            path: "/blog",
            items: posts.map((p) => ({ name: p.title, path: `/blog/${p.slug}` })),
          }),
        ]}
      />
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
        <NewsletterSignup vertical={pack.id} />
      </div>
    </section>
  );
}

function TableOfContents({ toc }: { toc: TocEntry[] }) {
  if (toc.length < 3) return null;
  return (
    <nav aria-label="Inhoud" className="mb-lg rounded-xl border border-outline-variant bg-surface-container-low p-md">
      <p className="mb-sm font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">In dit artikel</p>
      <ol className="flex flex-col gap-xs text-body-md">
        {toc.map((t) => (
          <li key={t.id} className={t.level === 3 ? "pl-md" : undefined}>
            <a href={`#${t.id}`} className="text-primary hover:underline">
              {t.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function AuthorBox({ pack }: { pack: VerticalPack }) {
  const isKapper = pack.id === "kapper";
  return (
    <aside className="mt-xl flex items-center gap-md rounded-xl border border-outline-variant p-md" aria-label="Over de auteur">
      {isKapper ? (
        <Image src="/vincent.jpg" alt="Vincent van Munster" width={56} height={56} className="h-14 w-14 rounded-full object-cover" />
      ) : (
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-fixed font-label-md text-label-md text-on-primary-fixed-variant" aria-hidden="true">
          VM
        </span>
      )}
      <div>
        <p className="font-label-md text-label-md text-on-surface">Vincent van Munster</p>
        <p className="text-body-md text-on-surface-variant">
          Oprichter van <a href={WAI.url} className="text-primary underline">WeAreImpact</a> en van {pack.brand.name}.nl.
          {isKapper && (
            <>
              {" "}
              <Link href="/over-ons" className="text-primary underline">Lees meer over Vincent</Link>
            </>
          )}
        </p>
      </div>
    </aside>
  );
}

function ArticleFrame({
  pack,
  section,
  crumbs,
  jsonLd,
  post,
  related,
  showCover,
}: {
  pack: VerticalPack;
  section: "blog" | "kennisbank";
  crumbs: Crumb[];
  jsonLd: object[];
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
  related: CardPost[];
  showCover: boolean;
}) {
  const { html, toc } = withHeadingIds(post.bodyIsHtml ? post.bodyMdx : renderMarkdown(post.bodyMdx));
  const minutes = readingTimeMinutes(post.bodyIsHtml ? stripHtml(post.bodyMdx) : post.bodyMdx);
  const cta = pack.content.postCta;

  return (
    <article className="bg-surface py-xl">
      <LdScripts data={jsonLd} />
      <div className="mx-auto max-w-3xl px-margin-mobile md:px-xl">
        <Breadcrumbs crumbs={crumbs} />

        <header className="mb-lg">
          {post.category && (
            <Link
              href={`/kennisbank/categorie/${post.category}`}
              className="mb-sm inline-block rounded-full bg-secondary-container px-sm py-[2px] font-label-sm text-label-sm text-on-secondary-container"
            >
              {pack.content.kennisbankCategories[post.category] || post.category}
            </Link>
          )}
          <h1 className="mkt-h1 text-display-lg text-on-surface">{post.title}</h1>
          <p className="mt-sm text-label-md text-on-surface-variant">
            Door Vincent van Munster ·{" "}
            {post.publishedAt ? <time dateTime={post.publishedAt.toISOString()}>{dateFmt.format(post.publishedAt)}</time> : ""} · {minutes} min lezen
          </p>
        </header>

        {showCover && post.coverImage && (
          <div className="relative mb-lg h-64 w-full overflow-hidden rounded-xl md:h-96">
            <Image src={post.coverImage} alt={post.coverImageAlt ?? post.title} fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 768px" />
          </div>
        )}

        <TableOfContents toc={toc} />

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

        <AuthorBox pack={pack} />

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

      {related.length > 0 && (
        <div className="mx-auto mt-xl max-w-container-max px-margin-mobile md:px-xl">
          <h2 className="mkt-h3 mb-md text-headline-md text-on-surface">Lees ook</h2>
          <PostGrid posts={related} section={section} categoryLabels={pack.content.kennisbankCategories} />
        </div>
      )}
    </article>
  );
}

function plainWords(post: { bodyMdx: string; bodyIsHtml: boolean }): number {
  const plain = post.bodyIsHtml ? stripHtml(post.bodyMdx) : post.bodyMdx;
  return plain.split(/\s+/).filter(Boolean).length;
}

export async function BlogPostView({ pack, slug }: { pack: VerticalPack; slug: string }) {
  const post = await getPublishedPost(slug, pack.id);
  if (!post) notFound();

  const brand = brandRef(pack);
  const all = await listPublishedPosts(pack.id).catch(() => []);
  const related = rankRelated({ slug, keywords: post.keywords, publishedAt: post.publishedAt }, all);
  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/blog/${slug}` },
  ];

  const jsonLd = [
    articleLd({
      type: "BlogPosting",
      brand,
      section: "blog",
      slug,
      title: post.title,
      description: post.metaDescription ?? post.excerpt,
      keywords: post.keywords,
      publishedAt: post.publishedAt,
      modifiedAt: post.updatedAt,
      image: post.coverImage,
      wordCount: plainWords(post),
    }),
    breadcrumbLd(brand.siteUrl, crumbs),
  ];

  return <ArticleFrame pack={pack} section="blog" crumbs={crumbs} jsonLd={jsonLd} post={post} related={related} showCover />;
}

/* ============================ kennisbank ============================ */
function CategoryChips({ pack, categories, active }: { pack: VerticalPack; categories: string[]; active?: string }) {
  if (categories.length === 0) return null;
  const base = "rounded-full px-sm py-[2px] font-label-sm text-label-sm";
  const on = "bg-primary text-on-primary";
  const off = "bg-surface-container-low text-on-surface-variant hover:text-primary";
  return (
    <nav aria-label="Categorieën" className="mt-lg flex flex-wrap justify-center gap-sm">
      <Link href="/kennisbank" className={`${base} ${active ? off : on}`}>
        Alles
      </Link>
      {categories.map((cat) => (
        <Link key={cat} href={`/kennisbank/categorie/${cat}`} aria-current={active === cat ? "page" : undefined} className={`${base} ${active === cat ? on : off}`}>
          {pack.content.kennisbankCategories[cat] || cat}
        </Link>
      ))}
    </nav>
  );
}

export async function KennisbankIndexView({ pack, category }: { pack: VerticalPack; category?: string }) {
  let posts: CardPost[] = [];
  let categories: string[] = [];

  if (env.DATABASE_URL) {
    try {
      posts = await listPublishedKnowledgePosts(pack.id, category);
      categories = await listCategories(pack.id);
    } catch (e) {
      console.error("[kennisbank] list failed:", e);
    }
  }
  // A category without published articles is not a page.
  if (category && posts.length === 0) notFound();

  const siteUrl = siteUrlFor(pack.id);
  const label = category ? pack.content.kennisbankCategories[category] || category : null;
  const path = category ? `/kennisbank/categorie/${category}` : "/kennisbank";
  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "Kennisbank", path: "/kennisbank" },
    ...(label ? [{ name: label, path }] : []),
  ];

  return (
    <section className="py-xl bg-surface">
      <LdScripts
        data={[
          breadcrumbLd(siteUrl, crumbs),
          collectionLd(siteUrl, {
            name: label ? `${label} — kennisbank` : pack.content.kennisbankHeading,
            description: pack.content.kennisbankDescription,
            path,
            items: posts.map((p) => ({ name: p.title, path: `/kennisbank/${p.slug}` })),
          }),
        ]}
      />
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl">
        <IndexHeader
          badge="Kennisbank"
          title={label ?? pack.content.kennisbankHeading}
          subtitle={label ? `Alle artikelen over ${label.toLowerCase()}.` : pack.content.kennisbankIntro}
        >
          <CategoryChips pack={pack} categories={categories} active={category} />
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

  const brand = brandRef(pack);
  const all = await listPublishedKnowledgePosts(pack.id).catch(() => []);
  const related = rankRelated({ slug, category: post.category, keywords: post.keywords, publishedAt: post.publishedAt }, all);
  const categoryLabel = post.category ? pack.content.kennisbankCategories[post.category] || post.category : null;
  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "Kennisbank", path: "/kennisbank" },
    ...(post.category && categoryLabel ? [{ name: categoryLabel, path: `/kennisbank/categorie/${post.category}` }] : []),
    { name: post.title, path: `/kennisbank/${slug}` },
  ];

  const jsonLd = [
    articleLd({
      type: "Article",
      brand,
      section: "kennisbank",
      slug,
      title: post.title,
      description: post.metaDescription ?? post.excerpt,
      keywords: post.keywords,
      publishedAt: post.publishedAt,
      modifiedAt: post.updatedAt,
      image: post.coverImage,
      wordCount: plainWords(post),
    }),
    breadcrumbLd(brand.siteUrl, crumbs),
  ];

  return <ArticleFrame pack={pack} section="kennisbank" crumbs={crumbs} jsonLd={jsonLd} post={post} related={related} showCover={false} />;
}
