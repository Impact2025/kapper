import { Icon } from "@/components/ui/icon";
import { ButtonLink } from "@/components/ui/button";
import { PLANS, SETUP_FEE_FROM } from "@/lib/plans";
import { formatEur } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function PricingCards() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg items-start">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              "bg-white p-lg rounded-xl flex flex-col hover-lift relative",
              plan.popular
                ? "shadow-xl border-2 border-primary md:scale-105 z-10"
                : "soft-shadow border border-outline-variant",
            )}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-md py-xs rounded-full font-label-sm uppercase tracking-wider">
                Populair
              </div>
            )}
            <h3 className="font-headline-md text-headline-md text-on-surface mb-xs">
              {plan.name}
            </h3>
            <div className="mb-md">
              <span className="font-display-lg text-[36px] text-primary">
                {formatEur(plan.price)}
              </span>
              <span className="font-label-md text-on-surface-variant"> p/m</span>
            </div>
            <p className="font-body-md text-on-surface-variant mb-lg">
              {plan.tagline}
            </p>
            <ul className="space-y-sm mb-xl flex-grow">
              {plan.features.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-sm font-label-md text-on-surface"
                >
                  <Icon name="check" className="text-primary text-[20px] mt-px" />
                  {f}
                </li>
              ))}
            </ul>
            <ButtonLink
              href={`/checkout?plan=${plan.id}`}
              variant={plan.popular ? "primary" : "outline"}
              className="w-full rounded-lg"
            >
              Kies {plan.name.split(" ")[0]}
            </ButtonLink>
          </div>
        ))}
      </div>
      <p className="text-center font-label-sm text-label-sm text-on-surface-variant mt-lg">
        Eenmalige setup-fee vanaf {formatEur(SETUP_FEE_FROM)} voor configuratie van
        prijslijst, API-koppeling en WhatsApp-platform.
      </p>
    </>
  );
}
