import { leadByOptOutToken } from "@/lib/crm/outreach";
import { optOutAction } from "@/lib/crm/public-actions";
import { getVerticalConfig } from "@/lib/verticals";
import { Icon } from "@/components/ui/icon";

export const dynamic = "force-dynamic";

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "dit adres";
  return `${user.slice(0, 2)}${"•".repeat(Math.max(1, user.length - 2))}@${domain}`;
}

/** Opt-out for CRM outreach mails (lib/crm/outreach.ts), in the lead's own vertical brand. */
export default async function OptOutPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ klaar?: string }>;
}) {
  const { token } = await params;
  const { klaar } = await searchParams;
  const lead = await leadByOptOutToken(token);

  if (!lead) {
    return (
      <>
        <Icon name="link_off" className="text-[40px] text-outline" />
        <h1 className="mt-sm font-headline-md text-headline-md text-on-surface">Link werkt niet</h1>
        <p className="mt-xs text-body-md text-on-surface-variant">
          We konden deze afmeldlink niet herkennen. Beantwoord de mail met &quot;afmelden&quot;, dan halen we je handmatig van de lijst.
        </p>
      </>
    );
  }

  const brand = getVerticalConfig(lead.vertical).brand.name;
  const who = lead.email ? maskEmail(lead.email) : "Dit adres";

  if (klaar || lead.optedOutAt) {
    return (
      <>
        <Icon name="check_circle" className="text-[40px] text-primary" />
        <h1 className="mt-sm font-headline-md text-headline-md text-on-surface">Je bent afgemeld</h1>
        <p className="mt-xs text-body-md text-on-surface-variant">
          {who} ontvangt geen berichten meer van {brand}.
        </p>
      </>
    );
  }

  return (
    <>
      <Icon name="unsubscribe" className="text-[40px] text-on-surface-variant" />
      <h1 className="mt-sm font-headline-md text-headline-md text-on-surface">Geen berichten meer van {brand}?</h1>
      <p className="mt-xs text-body-md text-on-surface-variant">Voor {who}.</p>
      <form action={optOutAction} className="mt-md">
        <input type="hidden" name="token" value={token} />
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
