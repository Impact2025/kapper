import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { CheckoutForm } from "@/components/marketing/checkout-form";
import { getVerticalConfig } from "@/lib/verticals";
import { plansFor } from "@/lib/verticals/plans";
import { type PlanId } from "@/lib/plans";
import { formatEur } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Afrekenen",
  robots: { index: false, follow: false },
};

export default async function VerticalCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ vertical: string }>;
  searchParams: Promise<{ plan?: string }>;
}) {
  const { vertical } = await params;
  const { plan: planParam } = await searchParams;
  const pack = getVerticalConfig(vertical);
  const plans = plansFor(pack);
  const plan = plans.find((p) => p.id === (planParam as PlanId)) ?? plans[1];
  if (!plan) notFound();

  return (
    <section className="bg-surface-container-low py-xl">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-lg px-margin-mobile md:grid-cols-2 md:px-xl">
        <div className="rounded-xl bg-white p-lg soft-shadow">
          <h1 className="mkt-h2 text-headline-lg text-on-surface">{plan.name}</h1>
          <div className="my-sm">
            <span className="stat-figure mkt-h1 text-[36px] text-primary">{formatEur(plan.price)}</span>
            <span className="text-label-md text-on-surface-variant"> per maand</span>
          </div>
          <p className="text-body-md text-on-surface-variant">{plan.tagline}</p>
          <ul className="mt-md flex flex-col gap-sm">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-sm text-label-md text-on-surface">
                <Icon name="check" className="mt-px text-[20px] text-primary" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl bg-white p-lg soft-shadow">
          <h2 className="mb-md mkt-h3 text-headline-md text-on-surface">Start je abonnement</h2>
          <CheckoutForm
            plan={plan.id}
            vertical={pack.id}
            businessLabel="Bedrijfsnaam"
            businessPlaceholder="Loodgietersbedrijf Jansen"
            emailPlaceholder="jij@bedrijf.nl"
          />
        </div>
      </div>
    </section>
  );
}
