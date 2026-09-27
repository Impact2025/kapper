import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { ButtonLink } from "@/components/ui/button";
import { listPublishedKnowledgePosts } from "@/lib/kennisbank/queries";
import { getSolution, solutionsFor } from "@/lib/marketing/solutions";
import { breadcrumbLd, faqLd, ldJson } from "@/lib/seo/jsonld";
import type { VerticalPack } from "@/lib/verticals";
import { siteUrlFor } from "@/lib/verticals/site-url";

export function solutionMeta(pack: VerticalPack, slug: string): Metadata {
  const page = getSolution(pack.id, slug);
  if (!page) return {};
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: `/oplossingen/${slug}` },
  };
}

export function solutionSlugs(pack: VerticalPack): string[] {
  return solutionsFor(pack.id).map((s) => s.slug);
}

export async function SolutionPageView({ pack, slug }: { pack: VerticalPack; slug: string }) {
  const page = getSolution(pack.id, slug);
  if (!page) notFound();
  // Topic cluster: the newest kennisbank articles of the page's category, if any.
  const articles = page.category
    ? (await listPublishedKnowledgePosts(pack.id, page.category).catch(() => [])).slice(0, 3)
    : [];
  const base = siteUrlFor(pack.id);
  const others = solutionsFor(pack.id).filter((s) => s.slug !== slug);
  const cta = pack.marketing.cta;

  const ld = [
    breadcrumbLd(base, [
      { name: "Home", path: "/" },
      { name: page.badge, path: `/oplossingen/${slug}` },
    ]),
    faqLd(page.faq),
  ];

  return (
    <>
      {ld.map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(d) }} />
      ))}

      <section className="bg-surface py-xl">
        <div className="mx-auto max-w-3xl px-margin-mobile text-center md:px-xl">
          <span className="mb-md inline-block rounded-full bg-primary-fixed px-sm py-xs font-label-sm text-label-sm uppercase tracking-wider text-on-primary-fixed-variant">
            {page.badge}
          </span>
          <h1 className="mkt-h1 mb-md text-display-lg text-on-surface">{page.headline}</h1>
          <p className="mb-lg font-body-lg text-body-lg text-on-surface-variant">{page.intro}</p>
          <div className="flex flex-col justify-center gap-md sm:flex-row">
            <ButtonLink href={cta.href}>{cta.label}</ButtonLink>
            <ButtonLink href="/prijzen" variant="outline">Bekijk de prijzen</ButtonLink>
          </div>
        </div>
      </section>

      <section className="bg-surface-container-low py-xl">
        <div className="mx-auto grid max-w-container-max gap-lg px-margin-mobile md:grid-cols-3 md:px-xl">
          {page.features.map((f) => (
            <div key={f.title} className="rounded-xl bg-white p-lg soft-shadow">
              <Icon name={f.icon} className="mb-sm text-[32px] text-primary" />
              <h2 className="mkt-h3 mb-xs text-headline-md text-on-surface">{f.title}</h2>
              <p className="text-body-md text-on-surface-variant">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface py-xl">
        <div className="mx-auto max-w-3xl px-margin-mobile md:px-xl">
          {page.sections.map((s) => (
            <div key={s.title} className="mb-lg">
              <h2 className="mkt-h2 mb-sm text-headline-lg text-on-surface">{s.title}</h2>
              <p className="text-body-lg text-on-surface-variant">{s.body}</p>
            </div>
          ))}

          {page.tips && (
            <div className="mb-lg rounded-xl bg-surface-container-low p-lg">
              <h2 className="mkt-h3 mb-sm text-headline-md text-on-surface">{page.tips.title}</h2>
              <ul className="flex list-disc flex-col gap-xs pl-lg text-body-md text-on-surface">
                {page.tips.items.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          <h2 className="mkt-h2 mb-md mt-xl text-headline-lg text-on-surface">Veelgestelde vragen</h2>
          <dl className="flex flex-col gap-md">
            {page.faq.map((f) => (
              <div key={f.q}>
                <dt className="font-label-md text-label-md text-on-surface">{f.q}</dt>
                <dd className="mt-xs text-body-md text-on-surface-variant">{f.a}</dd>
              </div>
            ))}
          </dl>

          {articles.length > 0 && (
            <nav aria-label="Verdieping" className="mt-xl border-t border-outline-variant pt-lg">
              <p className="mb-sm font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Lees verder in de kennisbank</p>
              <ul className="flex flex-col gap-xs">
                {articles.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/kennisbank/${a.slug}`} className="text-primary underline">
                      {a.title}
                    </Link>
                  </li>
                ))}
                {page.category && (
                  <li>
                    <Link href={`/kennisbank/categorie/${page.category}`} className="text-on-surface-variant hover:text-primary">
                      Alle artikelen in deze categorie →
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          )}

          {others.length > 0 && (
            <nav aria-label="Meer oplossingen" className="mt-xl border-t border-outline-variant pt-lg">
              <p className="mb-sm font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Ook interessant</p>
              <ul className="flex flex-col gap-xs">
                {others.map((o) => (
                  <li key={o.slug}>
                    <Link href={`/oplossingen/${o.slug}`} className="text-primary underline">
                      {o.headline}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </section>
    </>
  );
}
