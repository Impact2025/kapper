import type { Metadata } from "next";
import Link from "next/link";
import { requireSalonOwner } from "@/lib/auth/dal";
import { getSalonWithSubscription } from "@/lib/salon/queries";
import { salonHasPlan } from "@/lib/salon/plan";
import { listProducts, listOrders } from "@/lib/webwinkel/queries";
import { getReorderSuggestions } from "@/lib/ai/inventory-agent";
import { PageHeader, EmptyState, AdminLink } from "@/components/admin/ui";
import { WebwinkelTabs } from "@/components/salon/webwinkel/webwinkel-tabs";

export const metadata: Metadata = { title: "Webwinkel" };

export default async function WebwinkelPage() {
  const user = await requireSalonOwner();
  const salon = await getSalonWithSubscription(user.salonId);
  const isPro = salonHasPlan(salon?.plan ?? "essential", "pro");

  return (
    <div>
      <PageHeader
        title="Webwinkel"
        subtitle="Producten, voorraadbeheer en een AI-agent die je helpt op tijd bij te bestellen."
      />

      {!isPro ? (
        <EmptyState
          icon="storefront"
          title="Webwinkel is een Pro-functie"
          description="Upgrade naar het Pro-abonnement om producten te verkopen met voorraadbeheer en herbestel-advies van de AI-agent."
          action={<AdminLink href="/dashboard/abonnement">Bekijk abonnementen</AdminLink>}
        />
      ) : (
        <WebwinkelContent salonId={user.salonId} salonSlug={salon!.slug} />
      )}
    </div>
  );
}

async function WebwinkelContent({ salonId, salonSlug }: { salonId: string; salonSlug: string }) {
  const [products, orders, reorderSuggestions] = await Promise.all([
    listProducts(salonId),
    listOrders(salonId),
    getReorderSuggestions(salonId),
  ]);

  return (
    <div>
      <p className="mb-md text-label-sm text-on-surface-variant">
        Publieke winkelpagina:{" "}
        <Link href={`/${salonSlug}/winkel`} className="text-primary underline">
          kappersassistent.nl/{salonSlug}/winkel
        </Link>
      </p>
      <WebwinkelTabs products={products} orders={orders} reorderSuggestions={reorderSuggestions} />
    </div>
  );
}
