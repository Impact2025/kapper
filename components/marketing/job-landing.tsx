import Image from "next/image";
import { Icon } from "@/components/ui/icon";
import { ButtonLink } from "@/components/ui/button";
import { CinematicHero } from "@/components/marketing/cinematic-hero";
import { HeroPhone } from "@/components/marketing/hero-phone";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { plansFor } from "@/lib/verticals/plans";
import type { VerticalPack } from "@/lib/verticals";

/**
 * Data-driven homepage for a job vertical (loodgieter, schilder, ...): every
 * word comes from `pack.marketing.landing`, every plan from plansFor(pack), so
 * a new trade's site is copy in a pack — not a new page.
 */
export function JobLanding({ pack }: { pack: VerticalPack }) {
  const landing = pack.marketing.landing;
  if (!landing) return null;
  const plans = plansFor(pack);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: pack.brand.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: String(plans[0]?.price ?? ""), priceCurrency: "EUR" },
      description: pack.brand.description,
      url: pack.brand.siteUrl,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: landing.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <>
      {jsonLd.map((ld, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      ))}

      {landing.heroVideo ? (
        <>
          <CinematicHero
            eyebrow={landing.heroVideo.eyebrow}
            headline={landing.headline}
            sub={landing.sub}
            video={landing.heroVideo}
            accent={landing.heroVideo.accent}
            aside={landing.heroVideo.phone ? <HeroPhone data={landing.heroVideo.phone} /> : undefined}
            primary={{ href: "/scan", label: "bereken je gemiste omzet" }}
            secondary={{ href: "/contact", label: "vraag een demo aan" }}
          />
          {/* Stats onder de hero, als rustige waardebalk. */}
          <section className="bg-surface py-lg">
            <div className="mx-auto grid max-w-container-max grid-cols-1 gap-md px-margin-mobile md:grid-cols-3 md:px-xl">
              {landing.stats.map((s) => (
                <div key={s.value} className="flex items-center gap-sm">
                  <Icon name={s.icon} className="text-[28px] text-primary" />
                  <div>
                    <div className="font-label-md text-label-md text-on-surface">{s.value}</div>
                    <div className="text-label-sm text-on-surface-variant">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
      <section className="relative overflow-hidden pt-xl pb-lg md:pb-xl">
        <div className="mx-auto grid max-w-container-max grid-cols-1 items-center gap-lg px-margin-mobile md:px-xl lg:grid-cols-2">
          <div className="z-10">
            <span className="mb-md inline-block rounded-full border border-primary/30 bg-primary-fixed px-sm py-xs font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-primary-fixed">
              {landing.badge}
            </span>
            <h1 className="mkt-h1 mb-md text-display-lg leading-[1.1] text-on-surface md:text-[56px]">{landing.headline}</h1>
            <p className="mb-xl max-w-[30rem] font-body-lg text-body-lg text-on-surface-variant">{landing.sub}</p>
            <div className="flex flex-col gap-md sm:flex-row">
              <ButtonLink href="/contact" size="lg" className="rounded-lg">
                Vraag een demo aan
              </ButtonLink>
              <ButtonLink href="#prijzen" variant="outline" size="lg" className="rounded-lg">
                Bekijk prijzen
              </ButtonLink>
            </div>
            <p className="mt-sm font-label-sm text-label-sm text-on-surface-variant">Geen creditcard nodig · Binnen 48 uur werkend · Maandelijks opzegbaar</p>
            <div className="mt-lg grid max-w-[36rem] grid-cols-3 gap-sm">
              {landing.stats.map((s) => (
                <div key={s.value} className="flex flex-col items-start gap-xs rounded-xl border border-outline-variant/40 bg-white/70 p-sm">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed">
                    <Icon name={s.icon} className="text-[18px] text-primary" />
                  </div>
                  <div className="font-label-md text-label-md text-on-surface">{s.value}</div>
                  <div className="text-label-sm text-on-surface-variant">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {landing.heroImage ? (
            <div className="relative z-10 mx-auto w-full max-w-[36rem] pb-lg sm:pt-lg">
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl soft-shadow">
                <Image src={landing.heroImage.src} alt={landing.heroImage.alt} fill priority sizes="(max-width: 1024px) 100vw, 36rem" className="object-cover" />
              </div>
              {/* The chat as a phone: a working app in the real world, not a floating white card. */}
              <div className="relative -mt-16 ml-auto mr-md w-[14.5rem] rounded-[2rem] border-[6px] border-stone-900 bg-surface-container-lowest p-sm shadow-2xl sm:absolute sm:right-0 sm:top-0 sm:mt-0 sm:mr-0 lg:-right-6">
                <div className="mx-auto mb-sm h-1.5 w-16 rounded-full bg-stone-900/80" aria-hidden="true" />
                <div className="mb-md flex items-center gap-sm">
                  <Icon name="chat" className="text-[22px] text-primary" />
                  <span className="font-label-md text-label-md text-on-surface">{landing.chat.title}</span>
                </div>
                <div className="flex flex-col gap-xs text-label-md">
                  {landing.chat.messages.map((m, i) => (
                    <div
                      key={i}
                      className={
                        m.from === "customer"
                          ? "max-w-[90%] self-start rounded-xl bg-surface-container px-sm py-xs text-on-surface"
                          : "max-w-[90%] self-end rounded-xl bg-primary px-sm py-xs text-on-primary"
                      }
                    >
                      {m.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative z-10 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-lg soft-shadow">
            <div className="mb-md flex items-center gap-sm">
              <Icon name="chat" className="text-[22px] text-primary" />
              <span className="font-label-md text-label-md text-on-surface">{landing.chat.title}</span>
            </div>
            <div className="flex flex-col gap-sm text-body-md">
              {landing.chat.messages.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.from === "customer"
                      ? "max-w-[85%] self-start rounded-xl bg-surface-container px-md py-sm text-on-surface"
                      : "max-w-[85%] self-end rounded-xl bg-primary px-md py-sm text-on-primary"
                  }
                >
                  {m.text}
                </div>
              ))}
            </div>
            </div>
          )}
        </div>
      </section>
      )}

      {/* Functies */}
      <section id="functies" className="bg-surface-container-lowest py-xl">
        <div className="mx-auto max-w-container-max px-margin-mobile md:px-xl">
          <h2 className="mkt-h2 mb-xs text-center text-headline-lg text-on-surface">Alles wat je bedrijf nodig heeft</h2>
          <p className="mx-auto mb-xl max-w-2xl text-center font-body-md text-on-surface-variant">
            Van de eerste oproep tot de betaalde factuur — één systeem, gebouwd voor het vak.
          </p>
          <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-4">
            {landing.features.map((f) => (
              <div key={f.title} className="rounded-xl bg-white p-md soft-shadow">
                <div className="mb-sm flex h-10 w-10 items-center justify-center rounded-lg bg-primary-fixed">
                  <Icon name={f.icon} className="text-primary" />
                </div>
                <h3 className="mb-xs font-label-md font-medium text-on-surface">{f.title}</h3>
                <p className="text-label-md text-on-surface-variant">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hoe het werkt */}
      <section id="hoe-het-werkt" className="py-xl">
        <div className="mx-auto max-w-container-max px-margin-mobile md:px-xl">
          <h2 className="mkt-h2 mb-xl text-center text-headline-lg text-on-surface">Binnen 48 uur werkend, zonder gedoe</h2>
          <div className="grid grid-cols-1 gap-lg md:grid-cols-3">
            {landing.steps.map((s, i) => (
              <div key={s.title} className="flex flex-col gap-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-label-md text-label-md text-on-primary">{i + 1}</div>
                <h3 className="font-headline-md text-headline-md text-on-surface">{s.title}</h3>
                <p className="text-body-md text-on-surface-variant">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prijzen */}
      <section id="prijzen" className="bg-surface-container-lowest py-xl">
        <div className="mx-auto max-w-container-max px-margin-mobile md:px-xl">
          <h2 className="mkt-h2 mb-xs text-center text-headline-lg text-on-surface">Prijzen</h2>
          <p className="mb-xl text-center text-body-md text-on-surface-variant">Vaste maandprijs, geen kosten per gesprek. Opzegbaar per maand.</p>
          <PricingCards plans={plans} setupNote={<>Eenmalige setup vanaf €250: wij richten je diensten, tarieven, WhatsApp en telefoon voor je in.</>} />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-xl">
        <div className="mx-auto max-w-4xl px-margin-mobile md:px-xl">
          <h2 className="mkt-h2 mb-xl text-center text-headline-lg text-on-surface">Veelgestelde vragen</h2>
          <div className="grid grid-cols-1 gap-md md:grid-cols-2">
            {landing.faq.map((item) => (
              <div key={item.q} className="rounded-xl border border-outline-variant/40 bg-white p-md soft-shadow">
                <h3 className="mb-sm flex items-start gap-sm font-label-md font-medium text-on-surface">
                  <Icon name="help" className="mt-0.5 shrink-0 text-[20px] text-primary" />
                  {item.q}
                </h3>
                <p className="pl-[28px] font-body-md text-label-md text-on-surface-variant">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-surface-container-low py-xl">
        <div className="mx-auto max-w-container-max px-margin-mobile md:px-xl">
          <div className="relative overflow-hidden rounded-[2rem] bg-primary p-lg text-center text-on-primary md:p-xl">
            <h2 className="mkt-h1 mb-sm text-display-lg">{landing.ctaTitle}</h2>
            <p className="mx-auto mb-xl max-w-[34rem] font-body-lg text-body-lg opacity-90">{landing.ctaBody}</p>
            <ButtonLink href="/contact" size="lg" variant="white" className="rounded-lg">
              {pack.marketing.cta.label}
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
