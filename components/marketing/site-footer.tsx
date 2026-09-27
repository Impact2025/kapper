import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/ui/icon";
import { WAI } from "@/lib/seo/wai";

const cols = [
  {
    title: "Product",
    links: [
      { href: "/#hoe-het-werkt", label: "Hoe het werkt" },
      { href: "/prijzen", label: "Prijzen" },
      { href: "/scan", label: "Gratis AI-scan" },
      { href: "/integraties/phorest", label: "Koppeling Phorest" },
      { href: "/integraties/acuity", label: "Koppeling Acuity" },
      { href: "/kennisbank", label: "Kennisbank" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Bedrijf",
    links: [
      { href: "/over-ons", label: "Over Ons" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Hulp",
    links: [
      { href: "/help", label: "Hulpcentrum" },
      { href: "/faq", label: "Veelgestelde vragen" },
      { href: "/status", label: "Systeemstatus" },
      { href: "/contact", label: "Ticket aanmaken" },
    ],
  },
  {
    title: "Juridisch",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/voorwaarden", label: "Voorwaarden" },
    ],
  },
];

/** Product/Bedrijf columns of a job-vertical site (no scan, no over-ons). */
const jobProductCols = [
  {
    title: "Product",
    links: [
      { href: "/#hoe-het-werkt", label: "Hoe het werkt" },
      { href: "/prijzen", label: "Prijzen" },
      { href: "/blog", label: "Blog" },
      { href: "/kennisbank", label: "Kennisbank" },
    ],
  },
  {
    title: "Bedrijf",
    links: [{ href: "/contact", label: "Contact" }],
  },
];

/**
 * Site footer. With no props it is the KapperAssistent footer; another
 * vertical's layout passes its brand, blurb and `variant="job"`.
 */
export function SiteFooter({
  brandName = "KapperAssistent.nl",
  logoIcon = null,
  blurb = "De AI-gedreven operationele cockpit voor de moderne kapsalon. Meer boekingen, minder no-shows, meer rust.",
  variant = "kapper",
  solutionLinks = [],
  sisters = [],
}: {
  brandName?: string;
  logoIcon?: string | null;
  blurb?: string;
  variant?: "kapper" | "job";
  /** Oplossingspagina's of this site, listed under Product. */
  solutionLinks?: { href: string; label: string }[];
  /** Other live Assistent sites, shown as one small line at the very bottom. */
  sisters?: { name: string; url: string }[];
} = {}) {
  const base = variant === "job" ? [...jobProductCols, ...cols.slice(2)] : cols;
  const columns = base.map((c, i) => (i === 0 ? { ...c, links: [...c.links, ...solutionLinks] } : c));
  return (
    <footer className="bg-surface-container-highest w-full">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl py-lg">
        <div className="flex flex-col md:flex-row justify-between gap-lg border-b border-outline-variant pb-lg mb-lg">
          <div className="max-w-[24rem]">
            <div className="flex items-center gap-sm mb-sm">
              {logoIcon ? (
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-on-primary">
                  <Icon name={logoIcon} className="text-[22px]" />
                </span>
              ) : (
                <Image
                  src="/logo.png"
                  alt="KapperAssistent logo"
                  width={691}
                  height={361}
                  className="h-9 w-auto object-contain"
                />
              )}
              <span className="mkt-h3 text-headline-md font-bold text-on-surface">
                {brandName}
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">{blurb}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-md">
            {columns.map((col) => (
              <div key={col.title}>
                <h4 className="font-label-md text-label-md text-on-surface mb-sm">
                  {col.title}
                </h4>
                <ul className="space-y-xs">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="font-label-sm text-label-sm text-on-surface-variant hover:text-secondary transition-colors"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <p className="font-label-sm text-label-sm text-on-surface-variant text-center">
          © {new Date().getFullYear()} {brandName} — Alle rechten voorbehouden.
        </p>
        <p className="mt-xs font-label-sm text-label-sm text-on-surface-variant/80 text-center">
          Een initiatief van Vincent van Munster ·{" "}
          <a href={WAI.url} className="underline hover:text-secondary">WeAreImpact</a>
          {sisters.length > 0 && (
            <>
              {" "}· Ook:{" "}
              {sisters.map((s, i) => (
                <span key={s.url}>
                  {i > 0 && ", "}
                  <a href={s.url} className="underline hover:text-secondary">{s.name}</a>
                </span>
              ))}
            </>
          )}
        </p>
      </div>
    </footer>
  );
}
