# SEO-analyse en plan: alle assistenten (stand 2026-09-26)

Bron: code en `content/` in de repo. **Niet geverifieerd**: wat er live in de database staat (gepubliceerde artikelen),
en Search Console-data. Stap 0 hieronder haalt dat op voordat we prioriteren.

## 1. Stand per assistent

| Assistent | Live domein | Eigen landing (FAQ) | Oplossingspagina's | Kennisbank (bronbestanden) | Blog (bronbestanden) | Integraties |
|---|---|---|---|---|---|---|
| Kapper | kappersassistent.nl (live) | ja (hoofdsite) | 2 (no-shows, gemiste telefoontjes) | 5 | via DB, 1 pakket | 2 (Phorest, Acuity) |
| Loodgieter | loodgietersassistent.nl (live) | ja, 8 FAQ | 4 | 7 | 0 | 0 |
| Schilder | niet live (`live: false`) | ja, 7 FAQ | 3 | 3 | 0 | 0 |
| Hovenier | niet live (`live: false`) | ja, 6 FAQ | 3 | 8 | 9 | 0 |
| Kozijn | niet live (`live: false`) | ja, 7 FAQ | 3 | **0** | **0** | 0 |

Wat er technisch al goed staat: eigen sitemap, robots, llms.txt en OG-images per vertical, JSON-LD op landing, FAQ en
integraties, eerlijke `lastmod`, host-guard tegen dubbele content tussen domeinen, en een contentplan
(`docs/seo-contentplan.md`) met pijler/cluster-structuur.

## 2. Bevindingen (gap-analyse)

1. **Niet-live verticals bestaan voor Google niet.** Schilder, hovenier en kozijn hebben geen bereikbaar domein, dus nul
   vertoningen ongeacht hoeveel content er ligt. Domeinen live zetten is de grootste SEO-hefboom.
2. **Content ligt als bestand, niet per se als pagina.** `content/` bevat 23 kennisbank- en 9 blogbestanden, maar
   artikelen tellen pas na publicatie via `/api/publish`. Controleer per vertical wat echt in de DB staat.
3. **Kozijn heeft nul content.** Schilder heeft 3 kennisartikelen tegen 8 bij hovenier.
4. **Dunne clusters.** Een pijler met 1 tot 3 artikelen bouwt geen autoriteit. Doel: 8 tot 12 artikelen per
   pijler-cluster, met een duidelijke interne linkstructuur.
5. **Alleen kapper heeft integratiepagina's.** Bij klusbedrijven zoeken mensen op software-namen en koppelingen
   (bijv. boekhouding, WhatsApp) en dat wordt nu niet afgevangen.
6. **Geen bottom-of-funnel vergelijkingspagina's** ("beste kapperssoftware", "alternatief voor ...").
7. **Geen gratis tools of downloads** die links en zoekverkeer trekken (uurtarief-calculator, offertesjabloon).
8. **Sitemap per vertical mist** `/diensten`-achtige en integratie-URL's die de hoofdsite wel heeft; controleren of dat
   bewust is.
9. **Geen zichtbaar meetsysteem** in de repo: Search Console per domein, rank-tracking en conversiedoelen.
10. **Autoriteit:** merknaam en entiteit (WeAreImpact / Vincent van Munster) zijn nog niet consequent gekoppeld
    aan de vier vakdomeinen (zie contentregels in het geheugen).

## 3. Plan

### Stap 0: meten (week 1)
- Per domein Search Console-property, sitemap indienen, en export vertoningen/klikken/posities.
- Tel per vertical de gepubliceerde artikelen uit de DB en zet de echte cijfers in de tabel hierboven.
- Zoekwoordonderzoek per vak: volume en intentie voor de zoekwoorden uit `docs/seo-contentplan.md`.

### Stap 1: bereikbaar maken (week 1 tot 3)
- Domeinen live: schildersassistent.nl, hovenierassistent.nl, kozijnassistent.nl (Vercel + Resend), pack op `live: true`.
- Per domein: canonical, redirect www/apex, sitemap, robots, llms.txt controleren met de bestaande launch-checks.

### Stap 2: landingspagina waar klanten ons vinden
Twee lagen, want klanten zoeken op hun vak, niet op ons merk:
- **Per vak een conversiegerichte landing** (bestaat; verscherpen): H1 op het hoofdzoekwoord ("AI-receptionist voor
  loodgieters"), bewijs (echte pilot-cijfers pas als ze bestaan), demo of proefperiode als vaste CTA, FAQ met
  vraag-antwoordschema, prijsblok. Geen claims zonder functie in de code (kwartaalcheck).
- **Een portfoliopagina op weareimpact.nl**: "AI-assistenten voor vakmensen" met de vijf assistenten, uitleg wat ze delen
  (gemiste oproepen, offertes, planning) en links naar elk domein. Dat geeft autoriteit, entiteitskoppeling
  en een vindplek voor wie nog niet weet welk vak-domein bij hem past.

### Stap 3: content op schaal (maand 1 tot 3)
Per vertical dezelfde bouwstenen, in deze volgorde:
1. **Geldpagina's** (hoge intentie): software/offerte/planning voor het vak, vergelijkingspagina's, prijs, integraties.
2. **Pijler-clusters**: 8 tot 12 artikelen per pijler (zie `seo-contentplan.md`), elk met hoofdzoekwoord,
   FAQ-blok, en links naar pijler en tool.
3. **Seizoens- en actualiteitsblogs** (storm, btw-wijzigingen, subsidie, wetgeving): kort, vaak, gelinkt naar de pijler.
4. **Gratis tools**: uurtarief-calculator, no-showkosten-calculator (kapper), offertesjabloon per vak, onderhoudscontract-sjabloon.
   Deze trekken links en zijn de beste ingang voor het hele trechtermodel.
5. **Kozijn en schilder eerst op peil**: minimaal 8 kennisartikelen elk voor de lancering.

Minimum per artikel (bestaande regels): 600+ woorden, 2+ tussenkoppen, metatitel 30 tot 60 tekens, omschrijving
70 tot 160, geen bedragen zonder bron, geen functies die het product niet levert.

### Stap 4: technisch en autoriteit (doorlopend)
- Schema: Organization, SoftwareApplication (per vak), FAQPage, Article, BreadcrumbList; valideren in Rich Results.
- Interne links: elke pijler linkt naar zijn cluster en terug; elk artikel linkt naar minimaal 2 verwante artikelen.
- Core Web Vitals per landing meten (LCP onder 2,5 s), afbeeldingen met alt-tekst, mobiele ervaring eerst.
- Off-page: brancheorganisaties, vakmedia, partnerlinks, en de WeAreImpact-portfoliopagina als hub.
- llms.txt en duidelijke feitenblokken per vak, zodat AI-zoekers ons correct citeren.

### Stap 5: ritme en KPI's
- Wekelijks: 2 tot 3 nieuwe artikelen verspreid over de verticals, wekelijks GSC-check.
- Na 8 weken: pijlers met veel vertoningen maar weinig klikken herschrijven (titel en meta), artikelen zonder
  vertoningen samenvoegen of schrappen.
- KPI's per vertical: vertoningen, klikken, gemiddelde positie op de 10 kernwoorden, demo-aanvragen uit organisch, aantal
  gepubliceerde artikelen, aantal verwijzende domeinen.

## 4. Eerste 10 concrete taken

1. Search Console per domein aanmaken en sitemaps indienen.
2. DB-telling gepubliceerde artikelen per vertical.
3. Domein schilder, hovenier, kozijn live zetten.
4. Kozijn: 8 kennisartikelen schrijven.
5. Schilder: van 3 naar 8 kennisartikelen.
6. Loodgieter: blog starten (0 nu), spoed- en btw-artikelen eerst.
7. Kapper: integratiepagina's uitbreiden (WhatsApp, boekhouding) en vergelijkingspagina "kapperssoftware".
8. Portfoliopagina op weareimpact.nl bouwen.
9. Eerste gratis tool bouwen: no-showkosten-calculator (kapper) en uurtarief-calculator (hovenier).
10. Schema en Core Web Vitals audit op alle landings.
