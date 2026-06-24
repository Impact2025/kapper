import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Blog — Groeitips voor je kapsalon",
  description:
    "Praktische tips over salonmarketing, lokale SEO, no-show preventie en AI voor kappers.",
  alternates: { canonical: "/blog" },
};

export const revalidate = 3600;

export default async function BlogIndexPage() {
  let posts: { slug: string; title: string; excerpt: string | null; publishedAt: Date | null }[] =
    [];

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
          publishedAt: blogPosts.publishedAt,
        })
        .from(blogPosts)
        .where(eq(blogPosts.status, "published"))
        .orderBy(desc(blogPosts.publishedAt));
    } catch (e) {
      console.error("[blog] list failed:", e);
    }
  }

  return (
    <section className="py-xl bg-surface">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl">
        <div className="text-center mb-xl max-w-2xl mx-auto">
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
            {posts.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="bg-white rounded-xl soft-shadow p-lg hover-lift block"
              >
                <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">
                  {p.title}
                </h2>
                <p className="font-body-md text-on-surface-variant line-clamp-3">
                  {p.excerpt}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
