/**
 * Per dashboardpagina de 1–3 helpartikelen die daar het vaakst nodig zijn.
 * Slugs verwijzen naar lib/help/articles.ts; tests/status.test.ts bewaakt dat ze bestaan.
 */
export interface HelpLink {
  slug: string;
  title: string;
}

export const PAGE_HELP: { prefix: string; links: HelpLink[] }[] = [
  { prefix: "/dashboard/integraties", links: [
    { slug: "hoe-koppel-ik-mijn-agenda", title: "Hoe koppel ik mijn agenda?" },
    { slug: "agenda-koppeling-werkt-niet", title: "Mijn agenda-koppeling werkt niet" },
    { slug: "telefoon-ai", title: "Kan de AI ook mijn telefoon opnemen?" },
  ] },
  { prefix: "/dashboard/ai-receptie", links: [
    { slug: "wat-doet-de-ai-op-whatsapp", title: "Wat kan de AI via WhatsApp?" },
    { slug: "wat-als-de-ai-iets-niet-weet", title: "Wat als de AI iets niet weet?" },
    { slug: "doorverbinden-naar-collega", title: "Doorzetten naar een collega" },
  ] },
  { prefix: "/dashboard/escalaties", links: [
    { slug: "doorverbinden-naar-collega", title: "Hoe werken escalaties?" },
    { slug: "ai-medische-vragen", title: "Waarom geeft de AI geen medisch advies?" },
  ] },
  { prefix: "/dashboard/gesprekken", links: [
    { slug: "wat-doet-de-ai-op-whatsapp", title: "Wat kan de AI via WhatsApp?" },
    { slug: "hoe-lang-bewaren-jullie-gegevens", title: "Hoe lang bewaren jullie gesprekken?" },
  ] },
  { prefix: "/dashboard/klanten", links: [
    { slug: "digitaal-klantdossier", title: "Wat is het klantdossier?" },
    { slug: "klant-verwijderen", title: "Klant volledig verwijderen" },
    { slug: "hoe-gaan-jullie-om-met-gevoelige-gegevens", title: "Gevoelige gegevens (AVG)" },
  ] },
  { prefix: "/dashboard/no-show", links: [
    { slug: "no-show-beleid-instellen", title: "No-show beleid instellen" },
    { slug: "no-show-herinneringen", title: "Hoe werken herinneringen?" },
    { slug: "aanbetaling", title: "Aanbetaling bij dure behandelingen" },
  ] },
  { prefix: "/dashboard/kassa", links: [{ slug: "kassa-btw", title: "Kassa en btw-splitsing" }] },
  { prefix: "/dashboard/webwinkel", links: [{ slug: "webwinkel-en-voorraad", title: "Webwinkel en voorraad" }] },
  { prefix: "/dashboard/retentie", links: [
    { slug: "reviews-en-terughalen", title: "Reviews en terughaalberichten" },
    { slug: "spaarprogramma", title: "Spaarprogramma (Elite)" },
  ] },
  { prefix: "/dashboard/abonnement", links: [
    { slug: "upgraden-of-downgraden", title: "Upgraden of downgraden" },
    { slug: "hoe-zeg-ik-op", title: "Abonnement opzeggen" },
    { slug: "factuur-en-betaling", title: "Factuur en betaling" },
  ] },
  { prefix: "/dashboard/praktijk", links: [{ slug: "intelligent-double-booking", title: "Intelligent Double-Booking" }] },
  { prefix: "/dashboard/afspraken", links: [{ slug: "no-show-herinneringen", title: "Herinneringen en no-shows" }] },
];

export function helpFor(pathname: string): HelpLink[] {
  // Support pages bring their own help; otherwise the longest matching prefix wins.
  if (pathname.startsWith("/dashboard/support")) return [];
  return PAGE_HELP.filter((h) => pathname.startsWith(h.prefix)).sort((a, b) => b.prefix.length - a.prefix.length)[0]?.links ?? [];
}
