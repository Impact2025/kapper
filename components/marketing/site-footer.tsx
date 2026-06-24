import Link from "next/link";

const cols = [
  {
    title: "Product",
    links: [
      { href: "/#hoe-het-werkt", label: "Hoe het werkt" },
      { href: "/prijzen", label: "Prijzen" },
      { href: "/scan", label: "Gratis AI-scan" },
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
    title: "Juridisch",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/voorwaarden", label: "Voorwaarden" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-surface-container-highest w-full">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl py-lg">
        <div className="flex flex-col md:flex-row justify-between gap-lg border-b border-outline-variant pb-lg mb-lg">
          <div className="max-w-[24rem]">
            <div className="font-headline-md text-headline-md font-bold text-on-surface mb-sm">
              KapperAssistent.nl
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              De AI-gedreven operationele cockpit voor de moderne kapsalon. Meer
              boekingen, minder no-shows, meer rust.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-md">
            {cols.map((col) => (
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
          © {new Date().getFullYear()} KapperAssistent.nl — Alle rechten
          voorbehouden.
        </p>
      </div>
    </footer>
  );
}
