import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { ButtonLink } from "@/components/ui/button";
import { HELP_ARTICLES, HELP_CATEGORIES, articlesByCategory, getHelpCategory } from "@/lib/help/articles";
import { searchHelp } from "@/lib/help/search";
import { HelpSearchForm } from "@/components/help/help-search-form";
import { SearchMissBeacon } from "@/components/help/search-miss-beacon";
import { OpenChatButton } from "@/components/help/open-chat-button";

export const metadata: Metadata = {
  title: "Hulpcentrum",
  description:
    "Antwoorden op je vragen over KapperAssistent: prijzen, koppelingen, de AI-receptie, privacy en meer. Niet gevonden? Vraag het de AI-assistent of maak een ticket.",
  alternates: { canonical: "/help" },
};

const POPULAR = [
  "welke-plannen-zijn-er",
  "hoe-start-ik",
  "welke-agenda-systemen-worden-ondersteund",
  "hoe-zeg-ik-op",
  "hoe-lang-bewaren-jullie-gegevens",
  "is-het-een-echt-mens",
];

export default async function HelpPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q?.trim().slice(0, 120) ?? "";
  const hits = query ? searchHelp(query, { limit: 12 }) : [];

  return (
    <>
      <section className="bg-surface py-xl">
        <div className="mx-auto max-w-3xl px-margin-mobile text-center md:px-xl">
          <span className="mb-md inline-block rounded-full bg-primary-fixed px-sm py-xs font-label-sm text-label-sm uppercase tracking-wider text-on-primary-fixed-variant">
            Hulpcentrum
          </span>
          <h1 className="mkt-h1 mb-md text-display-lg text-on-surface">Hoe kunnen we je helpen?</h1>
          <p className="mb-lg text-body-lg text-on-surface-variant">
            Zoek een antwoord, vraag het onze AI-assistent of neem contact op met het team.
          </p>
          <HelpSearchForm defaultValue={query} />
        </div>
      </section>

      {query ? (
        <section className="bg-surface pb-xl">
          <div className="mx-auto max-w-3xl px-margin-mobile md:px-xl">
            <h2 className="mb-md text-label-md font-label-md uppercase tracking-wide text-on-surface-variant">
              {hits.length ? `${hits.length} resultaten voor “${query}”` : `Geen resultaten voor “${query}”`}
            </h2>
            {hits.length === 0 ? (
              <>
                <SearchMissBeacon query={query} />
                <div className="rounded-xl border border-outline-variant/50 bg-white p-lg text-center">
                  <Icon name="search_off" className="mb-sm text-[40px] text-outline" />
                  <p className="mb-md text-body-md text-on-surface">
                    Niets gevonden. Probeer een ander woord, of laat onze assistent meedenken.
                  </p>
                  <div className="flex flex-wrap justify-center gap-sm">
                    <OpenChatButton />
                    <ButtonLink href="/contact" variant="outline">
                      Maak een ticket
                    </ButtonLink>
                  </div>
                </div>
              </>
            ) : (
              <ul className="flex flex-col gap-sm">
                {hits.map(({ article }) => (
                  <li key={article.slug}>
                    <Link
                      href={`/help/${article.slug}`}
                      className="block rounded-xl border border-outline-variant/50 bg-white p-md transition-colors hover:bg-primary/5"
                    >
                      <div className="text-label-sm text-on-surface-variant">{getHelpCategory(article.category)?.title}</div>
                      <div className="font-label-md text-body-md text-on-surface">{article.title}</div>
                      <p className="mt-xs line-clamp-2 text-label-md text-on-surface-variant">{article.summary}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : (
        <>
          <section className="bg-surface pb-xl">
            <div className="mx-auto max-w-container-max px-margin-mobile md:px-xl">
              <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-4">
                {HELP_CATEGORIES.map((c) => (
                  <Link
                    key={c.id}
                    href={`/help/categorie/${c.id}`}
                    className="group rounded-xl border border-outline-variant/50 bg-white p-md transition-shadow hover:soft-shadow"
                  >
                    <div className="mb-sm flex h-11 w-11 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
                      <Icon name={c.icon} className="text-[24px]" />
                    </div>
                    <div className="font-label-md text-body-md text-on-surface group-hover:text-primary">{c.title}</div>
                    <p className="mt-xs text-label-md text-on-surface-variant">{c.description}</p>
                    <div className="mt-sm text-label-sm text-primary">{articlesByCategory(c.id).length} artikelen →</div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-surface-container-low py-xl">
            <div className="mx-auto max-w-3xl px-margin-mobile md:px-xl">
              <h2 className="mkt-h3 mb-md text-headline-md text-on-surface">Populaire vragen</h2>
              <ul className="divide-y divide-outline-variant/40 rounded-xl border border-outline-variant/50 bg-white">
                {POPULAR.map((slug) => {
                  const a = HELP_ARTICLES.find((x) => x.slug === slug);
                  if (!a) return null;
                  return (
                    <li key={slug}>
                      <Link href={`/help/${slug}`} className="flex items-center justify-between gap-md px-md py-sm hover:bg-primary/5">
                        <span className="text-body-md text-on-surface">{a.title}</span>
                        <Icon name="chevron_right" className="text-outline" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-md text-center text-label-md text-on-surface-variant">
                Alle vragen en antwoorden staan ook op de <Link href="/faq" className="text-primary underline">FAQ-pagina</Link>.
              </p>
            </div>
          </section>
        </>
      )}

      <section className="bg-surface py-xl">
        <div className="mx-auto max-w-3xl px-margin-mobile md:px-xl">
          <div className="rounded-xl bg-primary-fixed/40 p-lg text-center">
            <h2 className="mkt-h3 text-headline-md text-on-surface">Er niet uitgekomen?</h2>
            <p className="mt-xs mb-md text-body-md text-on-surface-variant">
              Onze AI-assistent helpt direct. Komt ze er niet uit, dan maakt ze met één klik een ticket voor je aan.
            </p>
            <div className="flex flex-wrap justify-center gap-sm">
              <OpenChatButton />
              <ButtonLink href="/contact" variant="outline">
                Maak een ticket
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
