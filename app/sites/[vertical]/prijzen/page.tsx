import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { Icon } from "@/components/ui/icon";
import { ButtonLink } from "@/components/ui/button";
import { getVerticalConfig } from "@/lib/verticals";
import { plansFor } from "@/lib/verticals/plans";
import { SETUP_FEE_FROM } from "@/lib/plans";
import { formatEur } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ vertical: string }> }): Promise<Metadata> {
  const { vertical } = await params;
  const { brand } = getVerticalConfig(vertical);
  return {
    title: "Prijzen",
    description: `Transparante, vaste maandtarieven voor ${brand.name}.nl. Essential, Pro en Elite — geen kosten per gesprek of per minuut.`,
    alternates: { canonical: "/prijzen" },
  };
}

export default async function VerticalPricingPage({ params }: { params: Promise<{ vertical: string }> }) {
  const { vertical } = await params;
  const pack = getVerticalConfig(vertical);
  if (!pack.marketing.landing) notFound();
  const plans = plansFor(pack);
  const faq = pack.marketing.landing.faq;

  return (
    <>
      <section className="bg-surface py-xl">
        <div className="mx-auto max-w-container-max px-margin-mobile md:px-xl">
          <div className="mx-auto mb-xl max-w-2xl text-center">
            <span className="mb-md inline-block rounded-full bg-primary-fixed px-sm py-xs font-label-sm text-label-sm uppercase tracking-wider text-on-primary-fixed-variant">
              Transparante tarieven
            </span>
            <h1 className="mkt-h1 mb-md text-display-lg text-on-surface">Voorspelbare prijzen. Geen verrassingen.</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Je betaalt een vaste prijs per maand — geen kosten per gesprek of per belminuut — en de AI-receptionist en het klus-CRM zitten erin.
            </p>
          </div>
          <PricingCards
            plans={plans}
            setupNote={
              <>
                Eenmalige setup vanaf <strong>{formatEur(SETUP_FEE_FROM)}</strong>: wij richten je diensten, tarieven, WhatsApp en telefoon voor je in.
              </>
            }
          />
        </div>
      </section>

      <section className="bg-surface-container-low py-xl">
        <div className="mx-auto grid max-w-container-max grid-cols-1 gap-md px-margin-mobile md:grid-cols-3 md:px-xl">
          {[
            { icon: "timer", title: "14 dagen gratis", body: "Probeer alles zonder creditcard of verplichting." },
            { icon: "lock_open", title: "Geen lock-in", body: "Maandelijks opzegbaar. Je klant- en klusgegevens kun je altijd exporteren." },
            { icon: "support_agent", title: "Persoonlijke onboarding", body: "Ons team helpt je met je diensten, tarieven en koppelingen." },
          ].map((item) => (
            <div key={item.title} className="flex gap-sm rounded-xl bg-white p-md soft-shadow">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-fixed">
                <Icon name={item.icon} className="text-primary" />
              </div>
              <div>
                <h3 className="mb-xs font-label-md font-medium text-on-surface">{item.title}</h3>
                <p className="font-body-md text-label-md text-on-surface-variant">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface py-xl">
        <div className="mx-auto max-w-4xl px-margin-mobile md:px-xl">
          <h2 className="mkt-h2 mb-xl text-center text-headline-lg text-on-surface">Veelgestelde vragen</h2>
          <div className="grid grid-cols-1 gap-md md:grid-cols-2">
            {faq.map((item) => (
              <div key={item.q} className="rounded-xl border border-outline-variant/40 bg-white p-md soft-shadow">
                <h3 className="mb-sm flex items-start gap-sm font-label-md font-medium text-on-surface">
                  <Icon name="help" className="mt-0.5 shrink-0 text-[20px] text-primary" />
                  {item.q}
                </h3>
                <p className="pl-[28px] font-body-md text-label-md text-on-surface-variant">{item.a}</p>
              </div>
            ))}
          </div>
          <div className="mt-xl text-center">
            <ButtonLink href="/contact" size="lg" className="rounded-lg">
              {pack.marketing.cta.label}
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
