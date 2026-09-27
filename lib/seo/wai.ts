/**
 * The maker and the parent brand behind every Assistent site. Kept in line with
 * the entity graph of weareimpact.nl (Person + moeder-organisatie, same URLs and
 * sameAs), so search engines see one connected network: WeAreImpact →
 * Vincent van Munster → KapperAssistent, LoodgietersAssistent, ...
 */
export const WAI = {
  name: "WeAreImpact",
  /** Canonical origin of weareimpact.nl (no www — that is its metadataBase). */
  url: "https://weareimpact.nl",
  linkedin: "https://www.linkedin.com/company/weareimpact/",
} as const;

export const VINCENT = {
  name: "Vincent van Munster",
  jobTitle: "Oprichter WeAreImpact",
  url: WAI.url,
  sameAs: ["https://www.linkedin.com/in/vincentvanmunster"],
} as const;
