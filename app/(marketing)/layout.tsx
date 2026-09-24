import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SupportChatWidget } from "@/components/support/chat-widget";
import { KAPPER_VERTICAL } from "@/lib/verticals";
import { siteUrlFor } from "@/lib/verticals/site-url";

/** Organization structured data of the kapper site. It lives here (not in the
 * root layout) so another vertical's site never inherits the kapper brand. */
function organizationJsonLd() {
  const siteUrl = siteUrlFor(KAPPER_VERTICAL.id);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "KapperAssistent.nl",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description:
      "De AI-gedreven operationele cockpit voor de moderne kapsalon. AI-receptie via telefoon en WhatsApp, gekoppeld aan je agenda.",
    areaServed: "NL",
  };
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }} />
      <SiteHeader />
      <main className="flex-grow">{children}</main>
      <SiteFooter />
      <SupportChatWidget />
    </div>
  );
}
