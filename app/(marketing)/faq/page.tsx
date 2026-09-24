import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { HELP_CATEGORIES, articlesByCategory } from "@/lib/help/articles";
import { renderMarkdown } from "@/lib/blog/markdown";
import { HelpSearchForm } from "@/components/help/help-search-form";
import { OpenChatButton } from "@/components/help/open-chat-button";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Veelgestelde vragen (FAQ)",
  description:
    "Alle veelgestelde vragen over KapperAssistent op één plek: prijzen, koppelingen, AI-receptie, privacy en support.",
  alternates: { canonical: "/faq" },
};

export const revalidate = 3600;

export default function FaqPage() {
  const groups = HELP_CATEGORIES.map((c) => ({ category: c, articles: articlesByCategory(c.id) })).filter((g) => g.articles.length);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: groups.flatMap((g) =>
      g.articles.map((a) => ({
        "@type": "Question",
        name: a.title,
        acceptedAnswer: { "@type": "Answer", text: a.summary },
      })),
    ),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="bg-surface py-xl">
        <div className="mx-auto max-w-3xl px-margin-mobile text-center md:px-xl">
          <h1 className="mkt-h1 mb-md text-display-lg text-on-surface">Veelgestelde vragen</h1>
          <p className="mb-lg text-body-lg text-on-surface-variant">Alle antwoorden op één plek. Zoek gericht in het hulpcentrum.</p>
          <HelpSearchForm />
        </div>
      </section>

      <section className="bg-surface pb-xl">
        <div className="mx-auto max-w-3xl px-margin-mobile md:px-xl">
          <nav aria-label="Onderwerpen" className="mb-lg flex flex-wrap gap-xs">
            {groups.map((g) => (
              <a
                key={g.category.id}
                href={`#${g.category.id}`}
                className="rounded-full border border-outline-variant px-md py-xs text-label-md text-on-surface hover:bg-primary/5"
              >
                {g.category.title}
              </a>
            ))}
          </nav>

          {groups.map((g) => (
            <div key={g.category.id} id={g.category.id} className="mb-xl scroll-mt-24">
              <h2 className="mkt-h3 mb-sm flex items-center gap-sm text-headline-md text-on-surface">
                <Icon name={g.category.icon} className="text-primary" /> {g.category.title}
              </h2>
              <div className="divide-y divide-outline-variant/40 rounded-xl border border-outline-variant/50 bg-white">
                {g.articles.map((a) => (
                  <details key={a.slug} className="group px-md py-sm">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-md text-body-md font-label-md text-on-surface">
                      {a.title}
                      <Icon name="expand_more" className="shrink-0 text-outline transition-transform group-open:rotate-180" />
                    </summary>
                    <div
                      className="prose-blog mt-sm flex flex-col gap-sm text-body-md text-on-surface-variant"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(a.body) }}
                    />
                    <Link href={`/help/${a.slug}`} className="mt-sm inline-block text-label-md text-primary hover:underline">
                      Open artikel →
                    </Link>
                  </details>
                ))}
              </div>
            </div>
          ))}

          <div className="rounded-xl bg-primary-fixed/40 p-lg text-center">
            <h2 className="mkt-h3 text-headline-md text-on-surface">Staat je vraag er niet bij?</h2>
            <div className="mt-md flex flex-wrap justify-center gap-sm">
              <OpenChatButton />
              <ButtonLink href="/contact" variant="outline">Maak een ticket</ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
