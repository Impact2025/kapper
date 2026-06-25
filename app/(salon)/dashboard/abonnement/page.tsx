import type { Metadata } from "next";
import Link from "next/link";
import { requireSalonOwner } from "@/lib/auth/dal";
import { getSalonWithSubscription } from "@/lib/salon/queries";
import { getSalonMetrics } from "@/lib/salon/metrics";
import { PageHeader, Card, Badge } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";
import { PLANS } from "@/lib/plans";
import { formatEur } from "@/lib/utils";
import { UpgradeModal } from "@/components/salon/upgrade-modal";

export const metadata: Metadata = { title: "Abonnement" };

type BadgeTone = "neutral" | "primary" | "success" | "warning" | "error";

const STATUS_LABELS: Record<string, string> = {
  trial: "Proefperiode",
  active: "Actief",
  past_due: "Betaling achterstallig",
  canceled: "Opgezegd",
};

const STATUS_TONES: Record<string, BadgeTone> = {
  trial: "primary",
  active: "success",
  past_due: "warning",
  canceled: "error",
};

export default async function AbonnementPage() {
  const user = await requireSalonOwner();
  const [salon, metrics] = await Promise.all([
    getSalonWithSubscription(user.salonId),
    getSalonMetrics(user.salonId),
  ]);

  const salonStatus = salon?.status ?? "trial";
  const salonPlan = salon?.plan ?? "essential";

  const plan = PLANS.find((p) => p.id === salonPlan) ?? PLANS[0];
  const statusLabel = STATUS_LABELS[salonStatus] ?? "Onbekend";
  const statusTone = STATUS_TONES[salonStatus] ?? "neutral";

  const trialDaysLeft = (() => {
    if (salonStatus !== "trial" || !salon?.createdAt) return null;
    const end = new Date(salon.createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);
    return Math.max(0, Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  })();

  const planOrder: Record<string, number> = { essential: 0, pro: 1, elite: 2 };
  const upgradePlans = PLANS.filter(
    (p) => (planOrder[p.id] ?? 0) > (planOrder[salonPlan] ?? 0),
  );

  return (
    <div>
      <PageHeader
        title="Abonnement"
        subtitle="Huidig plan, facturering en upgrade-opties"
        action={<Badge tone={statusTone}>{statusLabel}</Badge>}
      />

      {/* Trial banner */}
      {salonStatus === "trial" && trialDaysLeft !== null && (
        <div className="mb-lg rounded-xl border border-secondary/30 bg-secondary-fixed/40 p-md">
          <div className="flex flex-wrap items-center gap-sm">
            <Icon name="timer" className="text-[22px] text-secondary" />
            <div className="flex-1">
              <p className="text-body-md font-medium text-on-surface">
                {trialDaysLeft > 0
                  ? `Nog ${trialDaysLeft} dag${trialDaysLeft !== 1 ? "en" : ""} gratis proberen`
                  : "Proefperiode verlopen"}
              </p>
              <p className="text-label-sm text-on-surface-variant">
                Kies een plan om je AI-assistent actief te houden na de proefperiode.
              </p>
            </div>
            <UpgradeModal
              upgradePlans={PLANS}
              triggerLabel="Plan kiezen →"
              triggerClass="inline-flex items-center gap-base rounded-full bg-secondary px-md py-sm text-label-md font-label-md text-on-secondary transition-all hover:opacity-90"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
        {/* Current plan */}
        <Card>
          <h2 className="mb-md font-headline-md text-headline-md text-on-surface">Huidig plan</h2>
          <div className="mb-md flex items-start justify-between">
            <div>
              <div className="font-headline-md text-headline-md text-on-surface">{plan.name}</div>
              <div className="mt-xs text-label-sm text-on-surface-variant">{plan.tagline}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-headline-md text-headline-md text-on-surface">
                {formatEur(plan.price)}
              </div>
              <div className="text-label-sm text-on-surface-variant">/maand</div>
            </div>
          </div>

          <div className="mb-md flex flex-col gap-xs">
            {plan.features.map((feature) => (
              <div key={feature} className="flex items-center gap-sm text-label-md">
                <Icon name="check" filled className="shrink-0 text-[18px] text-primary" />
                <span className="text-on-surface">{feature}</span>
              </div>
            ))}
          </div>

          {salon?.currentPeriodEnd && (
            <div className="border-t border-outline-variant/40 pt-sm">
              <span className="text-label-sm text-on-surface-variant">
                Volgende facturering:{" "}
                {salon.currentPeriodEnd.toLocaleDateString("nl-NL", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </Card>

        {/* Upgrade options */}
        <div className="flex flex-col gap-sm">
          {upgradePlans.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-sm rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-md text-center soft-shadow">
              <Icon name="verified" filled className="text-[32px] text-primary" />
              <p className="text-body-md font-medium text-on-surface">Je hebt het hoogste plan</p>
              <p className="text-label-sm text-on-surface-variant">
                Alle functies zijn voor jou beschikbaar.
              </p>
            </div>
          )}
          {upgradePlans.length > 0 && (
            <>
              {/* Usage nudge */}
              {metrics.callsHandled > 0 && (
                <div className="flex items-start gap-sm rounded-lg border border-outline-variant/40 bg-surface-container px-md py-sm text-label-sm text-on-surface-variant">
                  <Icon name="insights" className="mt-0.5 text-[16px] shrink-0 text-primary" />
                  <span>
                    Deze maand {metrics.callsHandled} gesprek{metrics.callsHandled !== 1 ? "ken" : ""} afgehandeld.
                    Upgrade voor onbeperkte capaciteit en meer functies.
                  </span>
                </div>
              )}

              {upgradePlans.map((up) => (
                <div
                  key={up.id}
                  className={`rounded-xl border p-md ${
                    up.popular
                      ? "border-primary/40 bg-primary-fixed/20"
                      : "border-outline-variant/40 bg-surface-container-lowest"
                  }`}
                >
                  <div className="mb-sm flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-xs">
                        <span className="font-headline-md text-headline-md text-on-surface">
                          {up.name}
                        </span>
                        {up.popular && <Badge tone="primary">Populair</Badge>}
                      </div>
                      <div className="mt-xs text-label-sm text-on-surface-variant">{up.tagline}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-headline-md text-headline-md text-on-surface">
                        {formatEur(up.price)}
                      </div>
                      <div className="text-label-sm text-on-surface-variant">/maand</div>
                    </div>
                  </div>
                  <UpgradeModal
                    upgradePlans={[up]}
                    triggerLabel={`Upgrade naar ${up.audience}`}
                  />
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Support */}
      <Card className="mt-md">
        <div className="flex items-start gap-sm">
          <Icon name="support_agent" className="mt-0.5 text-[22px] text-primary" />
          <div>
            <h3 className="mb-xs text-body-md font-medium text-on-surface">Hulp nodig?</h3>
            <p className="text-label-sm text-on-surface-variant">
              Vragen over je abonnement, facturen of een upgrade?{" "}
              <Link href="/contact" className="text-primary hover:underline">
                Neem contact op
              </Link>{" "}
              of mail naar{" "}
              <a href="mailto:support@kappersassistent.nl" className="text-primary hover:underline">
                support@kappersassistent.nl
              </a>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
