import Link from "next/link";
import { confirmSubscription } from "@/lib/newsletter/subscribers";
import { Icon } from "@/components/ui/icon";

export const dynamic = "force-dynamic";

export default async function ConfirmPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const sub = await confirmSubscription(token);

  return sub ? (
    <>
      <Icon name="mark_email_read" className="text-[40px] text-primary" />
      <h1 className="mt-sm font-headline-md text-headline-md text-on-surface">Je bent aangemeld</h1>
      <p className="mt-xs text-body-md text-on-surface-variant">
        Bedankt! Je ontvangt voortaan onze nieuwsbrief op {sub.email}. Afmelden kan altijd met één klik onderaan elke mail.
      </p>
      <Link href="/" className="mt-md inline-block text-label-md font-label-md text-primary hover:underline">
        Naar de website →
      </Link>
    </>
  ) : (
    <>
      <Icon name="link_off" className="text-[40px] text-outline" />
      <h1 className="mt-sm font-headline-md text-headline-md text-on-surface">Link werkt niet (meer)</h1>
      <p className="mt-xs text-body-md text-on-surface-variant">Deze bevestigingslink is ongeldig. Meld je opnieuw aan via de website.</p>
    </>
  );
}
