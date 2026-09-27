# SEO-contentplan: kennisbank-clusters

Elke oplossingspagina (`/oplossingen/<slug>`) is de **pijler** van een cluster. De pagina linkt
automatisch naar de nieuwste kennisbank-artikelen van zijn `category` (zie `lib/marketing/solutions.ts`),
en elk artikel linkt terug via categoriehub en "Lees ook". Publiceer dus altijd met de exacte
`category`-sleutel uit de tabel; een artikel met een andere sleutel valt buiten het cluster.

Regels voor elk artikel: minimaal 600 woorden, 2+ tussenkoppen, hoofdzoekwoord als eerste keyword,
metatitel 30-60 en omschrijving 70-160 tekens (de admin-SEO-score bewaakt dit). Noem in de tekst geen
bedragen of percentages zonder bron, en geen koppelingen of functies die het product niet levert.

## Kapper (kappersassistent.nl)

| Pijler | `category` | Artikelen (hoofdzoekwoord) |
|---|---|---|
| `/oplossingen/no-shows-voorkomen` | `No-shows` | Annuleringsbeleid voor je kapsalon (annuleringsbeleid kapper) · Aanbetaling vragen zonder klanten te verliezen (aanbetaling kapsalon) · Wachtlijst: lege stoelen snel opvullen (wachtlijst kapper) · Afspraakherinnering per sms of WhatsApp (afspraakherinnering kapper) · Wat mag je rekenen bij een no-show (no-show kosten kapper) |
| `/oplossingen/gemiste-telefoontjes` | `Receptie` | Virtuele receptionist voor een kapsalon (virtuele receptionist kapper) · Wat kost een gemiste oproep echt (gemiste oproepen salon) · WhatsApp voor afspraken: regels en tips (whatsapp afspraken kapper) · AI-telefonist en de AVG (ai telefonist privacy) |
| Koppelingen (`/integraties/*`) | `Salonsoftware` | Phorest voor kappers: wat kun je ermee (phorest kapper) · Acuity Scheduling voor salons (acuity salon) · Kapperssoftware vergelijken (kapperssoftware) |

Bestaande artikelen in `content/` (ai-telefonist-kapper, virtuele-receptionist-kapsalon,
automatische-sms-herinnering-afspraak-kapper, whatsapp-koppelen-aan-salon-software,
online-agenda-met-inwerktijd-plannen): zet de eerste vier op `Receptie` resp. `No-shows` en de
inwerktijd-agenda op `Inwerktijd`, zodat de hubs meteen gevuld zijn.

## Loodgieter

| Pijler | `category` | Artikelen |
|---|---|---|
| `/oplossingen/spoedoproepen` | `Spoed` | Wat is een spoedgeval voor een loodgieter · Veiligheidstips bij lekkage en gaslucht (voor klanten) · Spoedtarief instellen en communiceren · Bereikbaarheid buiten kantooruren |
| `/oplossingen/offertesoftware` | `Offertes` | Wat hoort in een loodgietersofferte · Btw-tarieven op de factuur (21%, 9%, 0%) · Betalingsherinneringen die werken · Offerte online laten accepteren |
| `/oplossingen/onderhoudscontracten` | `Onderhoud` | Onderhoudscontract voor cv-ketels opzetten · Installatiepaspoort: wat leg je vast · Terugkerende omzet opbouwen |

## Schilder

| Pijler | `category` | Artikelen |
|---|---|---|
| `/oplossingen/offertesoftware` | `Offertes` | Schildersofferte opstellen (oppervlak, lagen, ondergrond) · Meerwerk vastleggen · Btw bij schilderwerk |
| `/oplossingen/onderhoudscycli` | `Onderhoud` | Buitenschilderwerk: wanneer weer schilderen · Onderhoudscyclus verkopen aan klanten |
| (geen pijler) | `Planning` | Meerdaagse projecten plannen · Foto's voor en na als bewijs |

## Hovenier

| Pijler | `category` | Artikelen |
|---|---|---|
| `/oplossingen/storm-en-spoedmeldingen` | `Spoed` | Stormschade in de tuin: eerst veiligheid · Omgevallen boom: wie doet wat · Werkwijze bij meldingen na storm |
| `/oplossingen/onderhoudscontracten` | `Onderhoud` | Tuinonderhoudscontract opzetten · Seizoensplanning voor hoveniers · Tuinpaspoort: wat leg je vast |
| `/oplossingen/offertesoftware` | `Offertes` | Tuinofferte opstellen · Regie of vaste prijs |

## Volgorde

1. Vul eerst de kapper-clusters `No-shows` en `Receptie` (hoogste intentie, bestaande artikelen).
2. Daarna per vertical `Offertes` en `Onderhoud`, en `Spoed` voor loodgieter en hovenier.
3. Meet na 8 weken in Search Console per hub en pijler: vertoningen, klikken, gemiddelde positie.
   Verdiep pijlers die vertoningen maar weinig klikken krijgen; schrap artikelen zonder vertoningen.
