import type { Metadata } from "next";
import Link from "next/link";
import { requireSalonOwner } from "@/lib/auth/dal";
import { getSalonPlan, salonHasPlan } from "@/lib/salon/plan";
import { listSellableItems } from "@/lib/pos/queries";
import { PageHeader, Card, EmptyState } from "@/components/salon/dash-ui";
import { KassaCart } from "@/components/salon/kassa-cart";

export const metadata: Metadata = { title: "Kassa" };

export default async function KassaPage() {
  const user = await requireSalonOwner();
  const plan = await getSalonPlan(user.salonId);

  if (!salonHasPlan(plan, "pro")) {
    return (
      <div>
        <PageHeader title="Kassa" subtitle="Reken direct af aan de stoel" />
        <EmptyState
          icon="point_of_sale"
          title="Onderdeel van het Pro-abonnement"
          description="Upgrade om te kunnen afrekenen met btw-uitsplitsing, fooi en dagafsluiting."
          action={
            <Link href="/dashboard/abonnement" className="text-label-sm text-primary hover:underline">
              Upgraden →
            </Link>
          }
        />
      </div>
    );
  }

  const { treatments, products } = await listSellableItems(user.salonId);

  return (
    <div>
      <PageHeader
        title="Kassa"
        subtitle="Reken af aan de stoel — btw wordt automatisch uitgesplitst (9% behandelingen, 21% producten)"
        action={
          <Link href="/dashboard/kassa/dagafsluiting" className="text-label-sm text-primary hover:underline">
            Dagafsluiting →
          </Link>
        }
      />
      <Card>
        {treatments.length === 0 && products.length === 0 ? (
          <EmptyState
            icon="point_of_sale"
            title="Nog geen behandelingen of producten"
            description="Voeg eerst behandelingen toe via Praktijk of producten via Webwinkel."
          />
        ) : (
          <KassaCart
            treatments={treatments.map((t) => ({ id: t.id, name: t.name, priceCents: t.priceCents }))}
            products={products.map((p) => ({ id: p.id, name: p.name, priceCents: p.priceCents }))}
          />
        )}
      </Card>
    </div>
  );
}
