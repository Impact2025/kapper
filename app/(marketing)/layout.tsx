import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SupportChatWidget } from "@/components/support/chat-widget";
import { KAPPER_VERTICAL } from "@/lib/verticals";
import { siteUrlFor } from "@/lib/verticals/site-url";
import { sisterSites } from "@/lib/seo/network";
import { solutionsFor } from "@/lib/marketing/solutions";
import { ldJson, organizationLd, websiteLd } from "@/lib/seo/jsonld";

/** Organization + WebSite structured data of the kapper site. It lives here (not
 * in the root layout) so another vertical's site never inherits the kapper brand. */
function siteJsonLd() {
  const siteUrl = siteUrlFor(KAPPER_VERTICAL.id);
  const brand = {
    name: "KapperAssistent.nl",
    siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: KAPPER_VERTICAL.brand.description,
  };
  return [organizationLd(brand), websiteLd(brand)];
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-dvh">
      {siteJsonLd().map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(d) }} />
      ))}
      <SiteHeader />
      <main className="flex-grow">{children}</main>
      <SiteFooter sisters={sisterSites(KAPPER_VERTICAL.id)} solutionLinks={solutionsFor(KAPPER_VERTICAL.id).map((s) => ({ href: `/oplossingen/${s.slug}`, label: s.badge }))} />
      <SupportChatWidget />
    </div>
  );
}
