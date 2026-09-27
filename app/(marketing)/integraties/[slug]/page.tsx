import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { ButtonLink } from "@/components/ui/button";
import { INTEGRATION_PAGES, getIntegrationPage } from "@/lib/marketing/integrations";
import { breadcrumbLd, faqLd, ldJson } from "@/lib/seo/jsonld";
import { publicEnv } from "@/lib/env";

export const dynamicParams = false;

export function generateStaticParams() {
  return INTEGRATION_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getIntegrationPage(slug);
  if (!page) return {};
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: `/integraties/${slug}` },
  };
}

export default async function IntegrationPageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getIntegrationPage(slug);
  if (!page) notFound();
  const base = publicEnv.NEXT_PUBLIC_SITE_URL;

  const ld = [
    breadcrumbLd(base, [
      { name: "Home", path: "/" },
      { name: `Koppeling met ${page.name}`, path: `/integraties/${slug}` },
    ]),
    faqLd(page.faq),
  ];

  return (
    <>
      {ld.map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(d) }} />
      ))}

      <section className="bg-surface py-xl">
        <div className="mx-auto max-w-container-max px-margin-mobile md:px-xl">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mb-md inline-block rounded-full bg-primary-fixed px-sm py-xs font-label-sm text-label-sm uppercase tracking-wider text-on-primary-fixed-variant">
              Koppeling met {page.name}
            </span>
            <h1 className="mkt-h1 mb-md text-display-lg text-on-surface">{page.headline}</h1>
            <p className="mb-lg font-body-lg text-body-lg text-on-surface-variant">{page.intro}</p>
            <div className="flex flex-col justify-center gap-md sm:flex-row">
              <ButtonLink href="/contact">Plan een gratis kennismaking</ButtonLink>
              <ButtonLink href="/prijzen" variant="outline">Bekijk de prijzen</ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface-container-low py-xl">
        <div className="mx-auto grid max-w-container-max gap-lg px-margin-mobile md:grid-cols-3 md:px-xl">
          {page.benefits.map((b) => (
            <div key={b.title} className="rounded-xl bg-white p-lg soft-shadow">
              <Icon name={b.icon} className="mb-sm text-[32px] text-primary" />
              <h2 className="mkt-h3 mb-xs text-headline-md text-on-surface">{b.title}</h2>
              <p className="text-body-md text-on-surface-variant">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface py-xl">
        <div className="mx-auto max-w-3xl px-margin-mobile md:px-xl">
          <h2 className="mkt-h2 mb-lg text-headline-lg text-on-surface">Zo werkt de koppeling met {page.name}</h2>
          <ol className="flex flex-col gap-md">
            {page.steps.map((s, i) => (
              <li key={s.title} className="flex gap-md">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primary font-label-md text-label-md text-on-primary">{i + 1}</span>
                <div>
                  <h3 className="font-label-md text-label-md text-on-surface">{s.title}</h3>
                  <p className="text-body-md text-on-surface-variant">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <h2 className="mkt-h2 mb-md mt-xl text-headline-lg text-on-surface">Wat heb je nodig?</h2>
          <ul className="flex list-disc flex-col gap-xs pl-lg text-body-md text-on-surface">
            {page.requirements.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>

          <h2 className="mkt-h2 mb-md mt-xl text-headline-lg text-on-surface">Veelgestelde vragen over {page.name}</h2>
          <dl className="flex flex-col gap-md">
            {page.faq.map((f) => (
              <div key={f.q}>
                <dt className="font-label-md text-label-md text-on-surface">{f.q}</dt>
                <dd className="mt-xs text-body-md text-on-surface-variant">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
