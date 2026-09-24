import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { HELP_CATEGORIES, articlesByCategory, getHelpCategory } from "@/lib/help/articles";
import { getHelpCorpus } from "@/lib/help/store";

export const revalidate = 3600;

export function generateStaticParams() {
  return HELP_CATEGORIES.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const c = getHelpCategory(id);
  if (!c) return { title: "Categorie niet gevonden" };
  return {
    title: `${c.title} — Hulpcentrum`,
    description: c.description,
    alternates: { canonical: `/help/categorie/${c.id}` },
  };
}

export default async function HelpCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = getHelpCategory(id);
  if (!category) notFound();
  const articles = articlesByCategory(category.id, await getHelpCorpus());

  return (
    <section className="bg-surface py-xl">
      <div className="mx-auto max-w-3xl px-margin-mobile md:px-xl">
        <nav aria-label="Kruimelpad" className="mb-md text-label-md text-on-surface-variant">
          <Link href="/help" className="hover:text-primary">Hulpcentrum</Link>
        </nav>
        <div className="mb-lg flex items-center gap-md">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-fixed text-on-primary-fixed">
            <Icon name={category.icon} className="text-[28px]" />
          </div>
          <div>
            <h1 className="mkt-h1 text-display-lg text-on-surface">{category.title}</h1>
            <p className="text-body-md text-on-surface-variant">{category.description}</p>
          </div>
        </div>
        <ul className="divide-y divide-outline-variant/40 rounded-xl border border-outline-variant/50 bg-white">
          {articles.map((a) => (
            <li key={a.slug}>
              <Link href={`/help/${a.slug}`} className="block px-md py-sm hover:bg-primary/5">
                <div className="text-body-md font-label-md text-on-surface">{a.title}</div>
                <p className="mt-xs line-clamp-2 text-label-md text-on-surface-variant">{a.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
