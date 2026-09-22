import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { env } from "@/lib/env";
import { readingTimeMinutes, stripHtml } from "@/lib/blog/markdown";
import { listCategories } from "@/lib/kennisbank/queries";

export const metadata: Metadata = {
  title: "Kennisbank — Praktijktips voor kapsalons",
  description: "Gratis kennisbank-artikelen over haarsoorten, kleuringstechnieken, aftercare en salonmanagement voor professionele kappers.",
  alternates: { canonical: "/kennisbank" },
};

export const revalidate = 3600;

type KnowledgePost = {
  slug: string;
  title: string;
  excerpt: string | null;
  bodyMdx: string;
  bodyIsHtml: boolean;
  publishedAt: Date | null;
  keywords: string[];
  coverImage: string | null;
  coverImageAlt: string | null;
  category: string | null;
};

const HEADER_GRADIENTS = [
  "from-primary to-primary-container",
  "from-secondary to-secondary-container",
  "from-primary to-secondary",
];

const CATEGORY_LABELS: Record<string, string> = {
  Techniek: "Kleur- & lichtingstechnieken",
  Hoofdhuid: "Hoofdhuid & haarstructuur",
  Producten: "Producten & aftercare",
  Aftercare: "Aftercare & onderhoud",
  Inwerktijd: "Inwerktijd & planning",
  Balayage: "Balayage & highlights",
  Kleurcorrectie: "Kleurcorrectie",
  "Salonsoftware": "Salonsoftware & tools",
};

export default async function KennisbankIndexPage() {
  let posts: KnowledgePost[] = [];
  let categories: string[] = [];

  if (env.DATABASE_URL) {
    try {
      const { db } = await import("@/lib/db");
      const { knowledgePosts } = await import("@/lib/db/schema");
      const { eq, desc, ne } = await import("drizzle-orm");
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
        .where(eq(knowledgePosts.status, "published"))
        .orderBy(desc(knowledgePosts.publishedAt));
      categories = await listCategories();
    } catch (e) {
      console.error("[kennisbank] list failed:", e);
    }
  }

  const dateFmt = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", year: "numeric" });

  return (
    <section className="py-xl bg-surface">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl">
        <div className="text-center mb-xl max-w-2xl mx-auto">
          <span className="inline-block px-sm py-xs bg-primary-fixed text-on-primary-fixed-variant rounded-full font-label-sm text-label-sm mb-md uppercase tracking-wider">
            Kennisbank
          </span>
          <h1 className="font-display-lg text-display-lg text-on-surface mb-md">
            Kennisbank voor kapsalons
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Praktijktips, technieken en handleidingen voor professionele kappers.
            Van balayage tot aftercare, van salonsoftware tot hoofdhuidgezondheid.
          </p>

          {categories.length > 0 && (
            <div className="mt-lg flex flex-wrap justify-center gap-sm">
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="inline-block rounded-full bg-surface-container-low px-sm py-[2px] font-label-sm text-label-sm text-on-surface-variant"
                >
                  {CATEGORY_LABELS[cat] || cat}
                </span>
              ))}
            </div>
          )}
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-xl">
            <Icon name="import_contacts" className="text-primary-container text-[64px]" />
            <p className="font-body-md text-on-surface-variant mt-sm">
              Binnenkort verschijnen hier onze kennisbank-artikelen.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            {posts.map((p, i) => {
              const minutes = readingTimeMinutes(p.bodyIsHtml ? stripHtml(p.bodyMdx) : p.bodyMdx);
              const tag = p.keywords[0];
              return (
                <Link
                  key={p.slug}
                  href={`/kennisbank/${p.slug}`}
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
                      {p.category && (
                        <span className="rounded-full bg-secondary-container px-sm py-[2px] font-label-sm text-label-sm text-on-secondary-container">
                          {CATEGORY_LABELS[p.category] || p.category}
                        </span>
                      )}
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
