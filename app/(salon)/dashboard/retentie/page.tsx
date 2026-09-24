import type { Metadata } from "next";
import Link from "next/link";
import { requireSalonOwner } from "@/lib/auth/dal";
import { getSalonWithSubscription } from "@/lib/salon/queries";
import { getSalonPlan, salonHasPlan } from "@/lib/salon/plan";
import { listTopLoyaltyCustomers } from "@/lib/loyalty/queries";
import { PageHeader, Card, Badge, EmptyState } from "@/components/salon/dash-ui";
import { getVerticalConfig } from "@/lib/verticals";
import { Icon } from "@/components/ui/icon";
import { MarketingSettingsForm } from "@/components/salon/marketing-settings-form";

export const metadata: Metadata = { title: "Retentie & marketing" };


export default async function RetentiePage() {
  const user = await requireSalonOwner();
  const [salon, plan] = await Promise.all([
    getSalonWithSubscription(user.salonId),
    getSalonPlan(user.salonId),
  ]);

  const marketing = (salon?.settings?.marketing as Record<string, unknown>) ?? {};
  const settings = {
    reviewRequestsEnabled: Boolean(marketing.reviewRequestsEnabled ?? false),
    googleReviewLink: String(marketing.googleReviewLink ?? ""),
    retentionEnabled: Boolean(marketing.retentionEnabled ?? false),
  };

  const pack = getVerticalConfig(salon?.vertical);
  const isElite = salonHasPlan(plan, "elite");
  // Loyalty points ride on the kassa — only verticals with that feature have them.
  const hasLoyalty = pack.features.loyalty;
  const topCustomers = isElite && hasLoyalty ? await listTopLoyaltyCustomers(user.salonId) : [];

  return (
    <div>
      <PageHeader
        title={hasLoyalty ? "Retentie & marketing" : "Reviews & terugkeer"}
        subtitle={
          hasLoyalty
            ? "Reviews, reactivatie en loyaliteit — automatisch, zonder er zelf aan te hoeven denken"
            : "Reviews na afgeronde klussen en herinneringen voor terugkerend werk — automatisch"
        }
      />

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
        <MarketingSettingsForm settings={settings} />

        {!hasLoyalty && (
          <Card>
            <h2 className="dash-h2 mb-sm text-headline-md text-on-surface">Terugkerende omzet</h2>
            <p className="mb-md text-body-md text-on-surface-variant">
              Het meeste herhaalwerk ontstaat door onderhoud: met een contract krijgt de klant zijn herinnering en jij je klus vanzelf.
            </p>
            <Link href="/dashboard/onderhoud" className="text-label-md text-primary hover:underline">
              Naar onderhoud &amp; contracten →
            </Link>
          </Card>
        )}
        {hasLoyalty && (
        <Card>
          <div className="mb-sm flex items-center gap-xs">
            <h2 className="dash-h2 text-headline-md text-on-surface">Loyaliteitspunten</h2>
            <Badge tone={isElite ? "success" : "neutral"}>Elite</Badge>
          </div>

          {!isElite ? (
            <EmptyState
              icon="loyalty"
              title="Onderdeel van het Elite-abonnement"
              description="1 punt per €10 besteed aan de kassa, automatisch bijgehouden per klant."
              action={
                <Link href="/dashboard/abonnement" className="text-label-sm text-primary hover:underline">
                  Upgraden →
                </Link>
              }
            />
          ) : topCustomers.length === 0 ? (
            <p className="text-body-md text-on-surface-variant">
              Nog geen punten toegekend — die lopen automatisch op via kassaverkopen.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-outline-variant/30">
              {topCustomers.map((c) => (
                <Link
                  key={c.id}
                  href={`/dashboard/klanten/${c.id}`}
                  className="flex items-center justify-between py-sm transition-colors hover:bg-primary/5 -mx-sm px-sm rounded-lg"
                >
                  <div>
                    <div className="text-body-md text-on-surface">{c.name}</div>
                    <div className="text-label-sm text-on-surface-variant">{c.phone}</div>
                  </div>
                  <div className="flex items-center gap-xs">
                    <Icon name="loyalty" className="text-[18px] text-secondary" />
                    <span className="stat-figure text-body-lg text-on-surface">{c.loyaltyPoints}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
        )}
      </div>
    </div>
  );
}
