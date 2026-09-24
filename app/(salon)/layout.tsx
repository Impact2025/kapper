import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { getSalonWithSubscription } from "@/lib/salon/queries";
import { SalonSidebar } from "@/components/salon/sidebar";
import { SupportChatWidget } from "@/components/support/chat-widget";
import { IncidentBanner } from "@/components/salon/incident-banner";
import { PageHelp } from "@/components/salon/page-help";
import { getVerticalConfig, hostMismatch, resolveNav } from "@/lib/verticals";
import { themeStyle } from "@/lib/verticals/theme";
import { siteUrlFor } from "@/lib/verticals/site-url";

export async function generateMetadata(): Promise<Metadata> {
  const user = await getCurrentUser();
  const salon = user.salonId ? await getSalonWithSubscription(user.salonId) : null;
  const pack = getVerticalConfig(salon?.vertical);
  return {
    title: { default: pack.brand.dashboardTitle, template: `%s — ${pack.brand.name}` },
    robots: { index: false, follow: false },
  };
}

export default async function SalonLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user.role !== "owner") redirect("/admin");

  const salon = user.salonId ? await getSalonWithSubscription(user.salonId) : null;
  const pack = getVerticalConfig(salon?.vertical);

  // One environment per doelgroep: send a salon that landed on another
  // trade's domain to its own (the session cookie is per host, so they log in
  // there).
  const wrongHost = hostMismatch((await headers()).get("host"), salon?.vertical);
  if (wrongHost) redirect(`${siteUrlFor(wrongHost.id)}/login`);

  return (
    <div style={themeStyle(pack.theme)} className="flex min-h-screen flex-col bg-surface-container-lowest md:flex-row">
      <SalonSidebar
        user={{ name: user.name, email: user.email }}
        salon={{ name: salon?.name ?? `Mijn ${pack.terms.establishment}`, plan: salon?.plan ?? "essential" }}
        nav={resolveNav(pack.nav)}
      />
      <main className="flex-1 px-margin-mobile py-md md:px-lg md:py-lg">
        <IncidentBanner />
        <PageHelp />
        {children}
      </main>
      <SupportChatWidget />
    </div>
  );
}
