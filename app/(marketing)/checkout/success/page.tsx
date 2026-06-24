import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = {
  title: "Welkom aan boord",
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage() {
  return (
    <section className="bg-surface py-xl">
      <div className="mx-auto max-w-[36rem] px-margin-mobile text-center md:px-xl">
        <div className="mx-auto mb-md flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed">
          <Icon name="celebration" className="text-[32px] text-on-primary-fixed" />
        </div>
        <h1 className="font-display-lg text-display-lg text-on-surface">Welkom aan boord!</h1>
        <p className="mt-sm text-body-lg text-on-surface-variant">
          Je abonnement is geactiveerd. Ons team neemt binnen één werkdag contact op om je
          AI-assistent in te richten — inclusief agenda-koppeling en WhatsApp-platform.
        </p>
        <Link
          href="/"
          className="mt-lg inline-flex items-center gap-base rounded-full bg-primary px-xl py-sm text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 soft-shadow"
        >
          Terug naar home
        </Link>
      </div>
    </section>
  );
}
