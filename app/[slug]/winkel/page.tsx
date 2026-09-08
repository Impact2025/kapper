import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicSalonForWinkel, listAvailableProducts } from "@/lib/webwinkel/queries";
import { StorefrontCart } from "@/components/salon/webwinkel/storefront-cart";
import { EmptyState } from "@/components/admin/ui";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const salon = await getPublicSalonForWinkel(slug);
  return { title: salon ? `Webwinkel — ${salon.name}` : "Webwinkel" };
}

export default async function WinkelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const salon = await getPublicSalonForWinkel(slug);
  if (!salon) notFound();

  const products = await listAvailableProducts(salon.id);

  return (
    <div className="mx-auto max-w-5xl px-margin-mobile py-lg md:px-lg">
      <div className="mb-lg">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">
          Webwinkel — {salon.name}
        </h1>
        {salon.city && <p className="text-body-md text-on-surface-variant">{salon.city}</p>}
      </div>

      {products.length === 0 ? (
        <EmptyState icon="storefront" title="Nog geen producten beschikbaar" description="Kom later terug — deze webwinkel is nog leeg." />
      ) : (
        <StorefrontCart slug={salon.slug} products={products} />
      )}
    </div>
  );
}
