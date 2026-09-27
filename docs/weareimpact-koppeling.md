# Koppeling Assistent-sites ↔ WeAreImpact

Alle Assistent-sites (KapperAssistent, LoodgietersAssistent, SchildersAssistent, HovenierAssistent)
zijn van Vincent van Munster en onderdeel van WeAreImpact. Zo staat dat in de code en zo hoort het
aan de WeAreImpact-kant te staan.

## Wat er in deze repo staat

- **Entiteit (`lib/seo/wai.ts`, `lib/seo/jsonld.ts`):** elke site heeft `Organization` met
  `parentOrganization` = WeAreImpact en `founder` = Vincent (url `https://weareimpact.nl`,
  LinkedIn in `sameAs`). Elk artikel heeft als auteur dezelfde Person, met `worksFor` WeAreImpact.
  De URL's en namen komen overeen met de graph in `weareimpact/src/lib/seo-kit/entity-graph.ts`.
- **Zichtbare links:** auteursblok onder elk artikel ("Oprichter van WeAreImpact en van
  <site>") en één kleine regel onderaan elke footer: "Een initiatief van Vincent van Munster ·
  WeAreImpact · Ook: <andere live Assistent-sites>". Geen menu-item, geen banner, dus een kapper ziet de
  hovenier alleen als kleine regel onderaan. Een site verschijnt daar pas als `live: true`.
- **Artikelen:** elk artikel eindigt met een korte oproep die naar weareimpact.nl linkt, en het
  auteursblok linkt er ook heen.
- **`/llms.txt`:** vermeldt de maker en WeAreImpact.

## Wat er aan de WeAreImpact-kant nog moet (repo `weareimpact`, niet aangepast)

1. **`portfolioSameAs` uitbreiden** in `src/lib/seo-kit/entity-graph.ts`:
   `https://www.kappersassistent.nl`, `https://www.loodgietersassistent.nl`,
   `https://www.schildersassistent.nl`, `https://www.hovenierassistent.nl` (die laatste twee pas als
   de sites live zijn). Zo sluit de graph in beide richtingen.
2. **Eén pagina "Assistent-projecten"** (bijvoorbeeld onder `content/partner-sites/`) met per site een
   korte beschrijving en een gewone link. Dat is de sterkste backlink: een pagina op je eigen hoofdmerk
   die ze allemaal noemt.
3. **Artikelen delen zonder duplicate content:** plaats op WeAreImpact geen kopie van een artikel, maar
   een teaser met een link naar het origineel. Wil je het toch volledig overnemen, zet dan op de kopie een
   `rel="canonical"` naar het artikel op de Assistent-site (of andersom), anders concurreren de twee
   met elkaar.
4. **Zelf naar Person kijken:** de Person op weareimpact.nl noemt `sameAs` met de LinkedIn-URL met
   `%C3%BC`; de seo-kit gebruikt `/in/vincentvanmunster`. Kies één vorm en gebruik hem overal
   (hier is `/in/vincentvanmunster` gekozen).

## Waarom niet meer links?

Elke link die de lezer niet verwacht, kost vertrouwen. Een kapper hoeft niet te weten dat er
een hovenier-site is; de kleine regel onderaan en het auteursblok geven zoekmachines het volledige netwerk
zonder dat de bezoeker het als reclame ervaart.
