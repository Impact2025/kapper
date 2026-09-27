/**
 * Pure schema.org builders shared by every marketing surface. Article schema
 * is built at render time from the row (never read back from the stored
 * `json_ld` column), so improvements here reach every existing article.
 */

import { VINCENT, WAI } from "./wai";

export const FOUNDER = VINCENT;

const parentOrganization = { "@type": "Organization", name: WAI.name, url: WAI.url, sameAs: [WAI.linkedin] } as const;

export interface BrandRef {
  name: string;
  siteUrl: string;
  /** Absolute logo URL; omitted for text-only brands. */
  logo?: string;
  description?: string;
}

export interface Crumb {
  name: string;
  /** Path ("/blog") or absolute URL. */
  path: string;
}

const abs = (siteUrl: string, path: string) => (/^https?:\/\//.test(path) ? path : `${siteUrl}${path === "/" ? "" : path}`);

export function organizationLd(brand: BrandRef) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${brand.siteUrl}/#organization`,
    name: brand.name,
    url: brand.siteUrl,
    ...(brand.logo ? { logo: { "@type": "ImageObject", url: brand.logo } } : {}),
    ...(brand.description ? { description: brand.description } : {}),
    areaServed: "NL",
    parentOrganization,
    founder: { "@type": "Person", name: FOUNDER.name, url: FOUNDER.url, sameAs: FOUNDER.sameAs },
  };
}

export function websiteLd(brand: BrandRef) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${brand.siteUrl}/#website`,
    name: brand.name,
    url: brand.siteUrl,
    inLanguage: "nl-NL",
    publisher: { "@id": `${brand.siteUrl}/#organization` },
  };
}

export function breadcrumbLd(siteUrl: string, crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: abs(siteUrl, c.path),
    })),
  };
}

export interface ArticleInput {
  type: "Article" | "BlogPosting";
  brand: BrandRef;
  section: "blog" | "kennisbank";
  slug: string;
  title: string;
  description?: string | null;
  keywords?: string[];
  publishedAt: Date | null;
  modifiedAt?: Date | null;
  /** Cover image, absolute or site-relative; falls back to the generated OG card. */
  image?: string | null;
  wordCount?: number;
}

export function articleLd(a: ArticleInput) {
  const url = `${a.brand.siteUrl}/${a.section}/${a.slug}`;
  const image = a.image ? abs(a.brand.siteUrl, a.image) : `${url}/opengraph-image`;
  const published = a.publishedAt?.toISOString();
  return {
    "@context": "https://schema.org",
    "@type": a.type,
    "@id": `${url}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    headline: a.title.slice(0, 110),
    ...(a.description ? { description: a.description } : {}),
    ...(a.keywords?.length ? { keywords: a.keywords.join(", ") } : {}),
    inLanguage: "nl-NL",
    image: [image],
    ...(published ? { datePublished: published } : {}),
    ...(published || a.modifiedAt ? { dateModified: (a.modifiedAt ?? a.publishedAt)!.toISOString() } : {}),
    ...(a.wordCount ? { wordCount: a.wordCount } : {}),
    author: {
      "@type": "Person",
      name: FOUNDER.name,
      jobTitle: FOUNDER.jobTitle,
      url: FOUNDER.url,
      sameAs: FOUNDER.sameAs,
      worksFor: { "@type": "Organization", name: WAI.name, url: WAI.url },
    },
    publisher: {
      "@type": "Organization",
      name: a.brand.name,
      url: a.brand.siteUrl,
      ...(a.brand.logo ? { logo: { "@type": "ImageObject", url: a.brand.logo } } : {}),
    },
  };
}

export interface ListItemInput {
  name: string;
  path: string;
}

/** CollectionPage + ItemList for an index or category hub. */
export function collectionLd(siteUrl: string, opts: { name: string; description: string; path: string; items: ListItemInput[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: opts.name,
    description: opts.description,
    url: abs(siteUrl, opts.path),
    inLanguage: "nl-NL",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: opts.items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: abs(siteUrl, it.path),
        name: it.name,
      })),
    },
  };
}

export function faqLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** Safe inline serialisation: `<` is escaped so stored text can't close the script tag. */
export function ldJson(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
