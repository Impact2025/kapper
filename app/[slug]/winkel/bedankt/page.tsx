import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = {
  title: "Bedankt voor je bestelling",
  robots: { index: false, follow: false },
};

export default async function WinkelBedanktPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <section className="bg-surface py-xl">
      <div className="mx-auto max-w-[36rem] px-margin-mobile text-center md:px-xl">
        <div className="mx-auto mb-md flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed">
          <Icon name="celebration" className="text-[32px] text-on-primary-fixed" />
        </div>
        <h1 className="font-display-lg text-display-lg text-on-surface">Bedankt voor je bestelling!</h1>
        <p className="mt-sm text-body-lg text-on-surface-variant">
          Je betaling is ontvangen. Je krijgt een bevestiging per e-mail zodra de salon je bestelling heeft verwerkt.
        </p>
        <Link
          href={`/${slug}/winkel`}
          className="mt-lg inline-flex items-center gap-base rounded-full bg-primary px-xl py-sm text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 soft-shadow"
        >
          Terug naar de webwinkel
        </Link>
      </div>
    </section>
  );
}
