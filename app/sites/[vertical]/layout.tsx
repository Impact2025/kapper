import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SupportChatWidget } from "@/components/support/chat-widget";
import { themeStyle } from "@/lib/verticals/theme";
import { DEFAULT_VERTICAL_ID, getVerticalConfig, isVerticalId, listLiveVerticals, listVerticals } from "@/lib/verticals";

/**
 * Public marketing site of every non-default vertical. proxy.ts rewrites the
 * vertical's own hostname (loodgietersassistent.nl, ...) to /sites/<id>/…, so
 * one deployment serves each trade under its own brand — statically
 * generated per vertical, with its own header, footer, metadata, sitemap and
 * articles. Unknown or not-yet-live verticals are a 404 (dynamicParams off).
 */
export const dynamicParams = false;

export function generateStaticParams() {
  // Production serves live verticals only; dev also previews packs that are
  // not live yet (e.g. a new doelgroep) at /sites/<id>.
  const packs = process.env.NODE_ENV === "production" ? listLiveVerticals() : listVerticals();
  return packs
    .filter((v) => v.id !== DEFAULT_VERTICAL_ID)
    .map((v) => ({ vertical: v.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ vertical: string }> }): Promise<Metadata> {
  const { vertical } = await params;
  const { brand } = getVerticalConfig(vertical);
  const title = `${brand.name}.nl — ${brand.tagline}`;
  return {
    metadataBase: new URL(brand.siteUrl),
    // `absolute`, not `default`: a bare default would still be wrapped by the
    // root layout's "— KapperAssistent.nl" template.
    title: { absolute: title, template: `%s — ${brand.name}.nl` },
    description: brand.description,
    openGraph: { type: "website", locale: "nl_NL", url: brand.siteUrl, siteName: `${brand.name}.nl`, title, description: brand.description },
    twitter: { card: "summary_large_image", title: `${brand.name}.nl`, description: brand.description },
    robots: { index: true, follow: true },
  };
}

export default async function VerticalSiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ vertical: string }>;
}) {
  const { vertical } = await params;
  if (!isVerticalId(vertical) || vertical === DEFAULT_VERTICAL_ID) notFound();
  const pack = getVerticalConfig(vertical);

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: `${pack.brand.name}.nl`,
    url: pack.brand.siteUrl,
    description: pack.brand.description,
    areaServed: "NL",
  };

  return (
    <div style={themeStyle(pack.theme)} className="flex min-h-screen flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      <SiteHeader
        brandName={pack.brand.name}
        logoIcon={pack.marketing.logoIcon}
        navLinks={pack.marketing.navLinks}
        cta={pack.marketing.cta}
      />
      <main className="flex-grow">{children}</main>
      <SiteFooter brandName={`${pack.brand.name}.nl`} logoIcon={pack.marketing.logoIcon} blurb={pack.marketing.footerBlurb} variant="job" />
      <SupportChatWidget />
    </div>
  );
}
