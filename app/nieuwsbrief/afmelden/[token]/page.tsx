import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { unsubscribeAction } from "@/lib/newsletter/public-actions";
import { Icon } from "@/components/ui/icon";

export const dynamic = "force-dynamic";

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  return `${user!.slice(0, 2)}${"•".repeat(Math.max(1, user!.length - 2))}@${domain}`;
}

export default async function UnsubscribePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ s?: string; klaar?: string }>;
}) {
  const { token } = await params;
  const { s, klaar } = await searchParams;
  const [sub] = env.DATABASE_URL
    ? await db
        .select({ email: newsletterSubscribers.email, status: newsletterSubscribers.status })
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.token, token))
        .limit(1)
    : [];

  if (!sub) {
    return (
      <>
        <Icon name="link_off" className="text-[40px] text-outline" />
        <h1 className="mt-sm font-headline-md text-headline-md text-on-surface">Link werkt niet</h1>
        <p className="mt-xs text-body-md text-on-surface-variant">
          We konden deze afmeldlink niet herkennen. Stuur een mail naar ons supportadres, dan halen we je handmatig van de lijst.
        </p>
      </>
    );
  }

  if (klaar || sub.status !== "subscribed") {
    return (
      <>
        <Icon name="check_circle" className="text-[40px] text-primary" />
        <h1 className="mt-sm font-headline-md text-headline-md text-on-surface">Je bent afgemeld</h1>
        <p className="mt-xs text-body-md text-on-surface-variant">
          {maskEmail(sub.email)} ontvangt geen nieuwsbrief meer van ons. Service-mails over je account blijven gewoon doorgaan.
        </p>
      </>
    );
  }

  return (
    <>
      <Icon name="unsubscribe" className="text-[40px] text-on-surface-variant" />
      <h1 className="mt-sm font-headline-md text-headline-md text-on-surface">Afmelden voor de nieuwsbrief?</h1>
      <p className="mt-xs text-body-md text-on-surface-variant">Voor {maskEmail(sub.email)}.</p>
      <form action={unsubscribeAction} className="mt-md">
        <input type="hidden" name="token" value={token} />
        {s && <input type="hidden" name="sendId" value={s} />}
        <button
          type="submit"
          className="rounded-full bg-primary px-lg py-sm text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95"
        >
          Ja, meld me af
        </button>
      </form>
    </>
  );
}
