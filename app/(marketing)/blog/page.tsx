import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { env } from "@/lib/env";
import { readingTimeMinutes } from "@/lib/blog/markdown";

export const metadata: Metadata = {
  title: "Blog — Groeitips voor je kapsalon",
  description:
    "Praktische tips over salonmarketing, lokale SEO, no-show preventie en AI voor kappers.",
  alternates: { canonical: "/blog" },
};

export const revalidate = 3600;

type Post = {
  slug: string;
  title: string;
  excerpt: string | null;
  bodyMdx: string;
  publishedAt: Date | null;
  keywords: string[];
  coverImage: string | null;
  coverImageAlt: string | null;
};

const HEADER_GRADIENTS = [
  "from-primary to-primary-container",
  "from-secondary to-secondary-container",
  "from-primary to-secondary",
];

export default async function BlogIndexPage() {
  let posts: Post[] = [];

  if (env.DATABASE_URL) {
    try {
      const { db } = await import("@/lib/db");
      const { blogPosts } = await import("@/lib/db/schema");
      const { eq, desc } = await import("drizzle-orm");
      posts = await db
        .select({
          slug: blogPosts.slug,
          title: blogPosts.title,
          excerpt: blogPosts.excerpt,
          bodyMdx: blogPosts.bodyMdx,
          publishedAt: blogPosts.publishedAt,
          keywords: blogPosts.keywords,
          coverImage: blogPosts.coverImage,
          coverImageAlt: blogPosts.coverImageAlt,
        })
        .from(blogPosts)
        .where(eq(blogPosts.status, "published"))
        .orderBy(desc(blogPosts.publishedAt));
    } catch (e) {
      console.error("[blog] list failed:", e);
    }
  }

  const dateFmt = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", year: "numeric" });

  return (
    <section className="py-xl bg-surface">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl">
        <div className="text-center mb-xl max-w-2xl mx-auto">
          <span className="inline-block px-sm py-xs bg-primary-fixed text-on-primary-fixed-variant rounded-full font-label-sm text-label-sm mb-md uppercase tracking-wider">
            Blog
          </span>
          <h1 className="font-display-lg text-display-lg text-on-surface mb-md">
            Groeitips voor je kapsalon
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Praktische inzichten over lokale SEO, no-show preventie en slim
            klantcontact.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-xl">
            <Icon name="edit_note" className="text-primary-container text-[64px]" />
            <p className="font-body-md text-on-surface-variant mt-sm">
              Binnenkort verschijnen hier onze eerste artikelen.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            {posts.map((p, i) => {
              const minutes = readingTimeMinutes(p.bodyMdx);
              const tag = p.keywords[0];
              return (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
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
                      <div
                        className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${HEADER_GRADIENTS[i % HEADER_GRADIENTS.length]} p-md`}
                      >
                        <span className="font-headline-md text-headline-md font-semibold text-white text-center line-clamp-3">
                          {p.title}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-lg">
                    <div className="mb-sm flex items-center gap-sm">
                      {tag && (
                        <span className="rounded-full bg-primary-fixed px-sm py-[2px] font-label-sm text-label-sm text-on-primary-fixed-variant">
                          {tag}
                        </span>
                      )}
                      <span className="flex items-center gap-[2px] font-label-sm text-label-sm text-on-surface-variant">
                        <Icon name="schedule" className="text-[14px]" />
                        {minutes} min
                      </span>
                    </div>

                    <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">
                      {p.title}
                    </h2>
                    <p className="font-body-md text-on-surface-variant line-clamp-3 mb-md">
                      {p.excerpt}
                    </p>

                    <div className="mt-auto flex items-center justify-between border-t border-outline-variant/40 pt-sm">
                      <span className="flex items-center gap-[4px] font-label-sm text-label-sm text-on-surface-variant">
                        <Icon name="calendar_today" className="text-[14px]" />
                        {p.publishedAt ? dateFmt.format(p.publishedAt) : ""}
                      </span>
                      <Icon
                        name="arrow_forward"
                        className="text-[18px] text-primary transition-transform group-hover:translate-x-1"
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
