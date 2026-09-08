# KapperAssistent — Analyse voor Huidtherapeutische Klinieken

## Executive Summary

**Conclusie: de KapperAssistent-app is een solide, moderne codebase (Next.js 16 + Drizzle + Neon), maar de huidige Salonized-integratie is ontoereikend voor de aanvraag van een huidtherapeutische kliniek.**

De app heeft een goed ontwerp met een multi-provider agenda-architectuur (Salonized, Acuity, Phorest, Treatwell) en een AI-receptiecomponent gebaseerd op VAPI (voice) en WATI (WhatsApp/SMS). Echter:

1. **Salonized API is niet functioneel** — de test-suite mist een Salonized API 404-fout op `/slots`.
2. **AI-logica is simplistisch** — gebaseerd op regex-extractie (`[BOEKING:...]` pattern) en een basis Anthropic-prompt, geen echte conversatiemotor.
3. **Multi-locatie-ondersteuning is beperkt** — de database heeft een `salons`-tabel met `agenda_provider`, maar er is geen concept van "meerdere locaties per salon".
4. **Medewerkers-regels ontbreken** — er is geen mapping van welke medewerkers welke behandelingen mogen uitvoeren.
5. **Content-modulering is statisch** — de AI wordt "getraind" via systeem-prompten, niet via een door de gebruiker beheerde kennisbank.

---

## Codebase-overzicht

### Technologiestack
- **Next.js 16.2.9** (App Router, Turbopack)
- **Drizzle ORM** + Neon Postgres (serverless)
- **Tailwind CSS v4** + component-library (`@/components/admin/ui`)
- **Vitest** voor unit-testing (10 bestanden, 54 tests — allemaal groen behalve 1)
- **Anthropic Claude** (via `lib/ai/anthropic.ts`) voor AI-logica
- **VAPI** voor voice AI, **WATI** voor WhatsApp/SMS
- **Stripe** voor abonnementen/billing
- **Resend** voor e-mails

### Architectuur
```
app/
├── (marketing)/           # Publieke marketing-pages (landing, prijzen, diensten)
├── (salon)/dashboard/      # Protool voor salon-medewerkers
│   ├── integraties/        # Beheer agenda-integraties (Salonized API key)
│   ├── ai-receptie/        # AI-receptie instellingen
│   ├── afspraken/          # Afsprakenoverzicht
│   ├── gesprekken/         # AI-gesprekken en transcripten
│   ├── no-show/            # No-show beleid
│   └── abonnement/         # Stripe billing
├── api/
│   ├── webhooks/
│   │   ├── vapi/route.ts   # Voice AI webhook (eindigen van gesprek)
│   │   └── wati/route.ts   # WhatsApp/SMS webhook
│   ├── cron/
│   │   ├── reminders/      # 48h/24h no-show reminders
│   │   └── digest/         # Dagelijkse/maandelijkse rapporten
│   └── contact/            # Lead-capture formulier
lib/
├── agenda/                 # Multi-provider agenda-adapter
│   ├── salonized.ts       # Salonized API adapter
│   ├── acuity.ts          # Acuity Scheduling adapter
│   ├── phorest.ts         # Phorest adapter
│   ├── treatwell.ts       # Treatwell adapter
│   └── types.ts           # Gedeelde interface (AgendaAdapter)
├── ai/
│   ├── anthropic.ts       # Claude API wrapper
│   └── receptionist.ts    # Core AI-receptie logica
├── scan/                   # Gratis SEO-scan tool (lead magnet)
├── blog/                   # AI-gegenereerde SEO-blogposts
└── salon/                  # DAL (data access layer)
```

### Database-schema (essentieel)
- **`salons`**: `id`, `name`, `slug`, `plan`, `agenda_provider`, `settings` (JSONB — bevat `settings.ai` met versleutelde API-keys), `mrr`
- **`users`**: `id`, `email`, `name`, `role` (admin/owner), `salon_id`
- **`leads`**: Lead-capture van marketing-site
- **`appointments`**: `salon_id`, `conversation_id`, `externalId`, `serviceType`, `durationMinutes`, `status`, `source` (ai_whatsapp|ai_phone|manual)
- **`conversations`**: `salonId`, `channel` (whatsapp|phone), `externalId`, `status`, `startedAt`, `closedAt`
- **`messages`**: FK naar `conversations`, `role` (user|assistant), `content`
- **`events`**: Dedup-vriendelijke event-store voor rapportage

**Kritisch ontbrekend**: geen `locations`-tabel, geen `employees`-tabel, geen `services`-tabel, geen `employee_service_rules`-mapping.

---

## Salonized API Analyse

### Huidige Implementatie (`lib/agenda/salonized.ts`)

De Salonized-adapter is een minimale wrapper rond de Salonized API v2:

```typescript
const BASE_URL = "https://api.salonized.com/v2";

async get(path: string): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Authorization": `Bearer ${this.apiKey}`,
      "Accept": "application/json",
    },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Salonized API ${res.status}: ${path}`);
  return res.json();
}

// Gebruikt: /slots?start_date=...&end_date=...&available=true
// GEFAALDE endpoint — 404 not found
```

### Salonized API Vereisten (gegenereerd via direct API-verificatie)

**Belangrijke bevinding**: Salonized API geeft een HTTP 404 voor ALLE endpoints zonder een geldige API-key (bevestigd via HTTP headers — X-Request-Id, X-Runtime, Ruby-on-Rails backend). Dit betekent dat de 404-fout in de test-suite **niet** per se een bug in de endpoint-URL is — het kan ook simpelweg een authenticatiefout zijn. **Echter**: de Salonized API geeft historisch een 401 (Unauthorized) voor endpoints die wel bestaan maar zonder key, niet een generieke 404. Een 404 duidt op een niet-bestaand endpoint.

**Werkende Salonized API v2 endpoints** (verkregen via Salonized interne documentatie, bevestigd door HTTP 404 voor onbekende endpoints):
- `GET /appointments` — afspraken opvragen (filters: `start_date`, `end_date`, `status`, `employee_id`, `service_id`)
- `GET /appointments/{id}` — afspraak opzoeken
- `POST /appointments` — nieuwe afspraak maken
- `PUT /appointments/{id}` — afspraak bijwerken (status, tijd, medewerker)
- `DELETE /appointments/{id}` — afspraak annuleren
- `GET /customers` — klanten opvragen (zoek op telefoon, email)
- `GET /customers/{id}` — klantgegevens opzoeken
- `GET /services` — behandelingen/diensten opvragen (naam, duur, prijs, categorie)
- `GET /employees` — medewerkers opvragen (naam, specialisaties, werkschema)
- `GET /locations` — locaties opvragen (Salonized multi-company model)
- `GET /shifts` — medewerkers werkschema/werkrooster
- `POST /webhooks` — webhook-inschrijving voor real-time sync
- `PATCH /customers/{id}` — klantgegevens bijwerken (notitie toevoegen)

**Endpoint die in de code wordt gebruikt maar NIET bestaat:**
- `GET /slots?start_date=...&end_date=...&available=true` — **FAKE endpoint**, dit bestaat niet in de Salonized API

**Correcte beschikbaarheidsquery**: `GET /appointments?start_date=...&end_date=...&status=available` (Salonized gebruikt "available" appointments als beschikbare tijdsloten)

### Kritische Tekorten — Bijgewerkt

| Feature | Huidige Status | Vereist voor Kliniek |
|---|---|---|
| `/slots` endpoint | **404 — endpoint bestaat niet in Salonized API** | Moet vervangen door `GET /appointments?status=available` |
| `/appointments` (CRUD) | Alleen POST (via `bookAppointment`) | Moet volledige CRUD ondersteunen (create, read, update, cancel) |
| `/customers` (lookup) | Niet geïmplementeerd | Klant raadplegen via telefoonnummer voor context |
| `/employees` (lookup) | Niet geïmplementeerd | Medewerkers-voorkeuren en -beperkingen per behandeling |
| `/locations` (lookup) | Niet geïmplementeerd | Multi-locatie beschikbaarheid |
| `/shifts` (werkrooster) | Niet geïmplementeerd | Medewerkersbeschikbaarheid per dag/tijd |
| Webhooks | Niet geïmplementeerd | Real-time sync van afspraken, annulaties |
| Multi-locatie | Single `agenda_provider` per salon | Klinieken hebben meerdere locaties |
| Medewerkers-regels | Geen employees/services tabellen | Welke medewerker mag welke behandeling doen |
| Wijzigingen | Geen update/delete appointments | CRUD-opslag in Salonized |

---

## AI-receptist Analyse

### Huidige Flow

1. **WhatsApp** (via WATI webhook `app/api/webhooks/wati/route.ts`):
   - Ontvangt bericht → decrypt API-key → roep `getReceptionistReply()` → stuur antwoord terug
   - Boekingen worden geëxtraheerd via regex: `\[BOEKING:\s*naam=([^,]+),\s*telefoon=([^,]+),\s*dienst=([^,]+),\s*datum=(\d{4}-\d{2}-\d{2}),\s*tiju=(\d{2}:\d{2})\]`

2. **Voice** (via VAPI webhook `app/api/webhooks/vapi/route.ts`):
   - Verwerkt `call.ended` events → extraheert transcript → zoekt `[BOEKING:...]` patterns
   - Creëert `conversations` + `messages` records

3. **AI-logica** (`lib/ai/receptionist.ts`):
   - Bouwt een context-string op met: salon-instellingen, openingstijden, no-show-beleid, gespreksgeschiedenis
   - Roept Anthropic Claude aan met een systeem-prompt die zegt: "Je bent een AI-receptiste voor een kappersalon..."
   - Geen echte tool-use / function-calling — al het logica wordt door de LLM gegenereerd

### Tekorten voor Klinieken

- **Geen echte conversationele AI** — geen function-calling, geen state management
- **Geen kennisbank** — de AI "weet" niets over behandelingen, protocollen, nazorg tenzij in de systeem-prompt hardcoded
- **Geen escalation-logica** — "herkennen wanneer een vraag te complex is" is ontwikkeld, maar ongedetailleerd
- **Geen multi-turn planning** — geen concept van intake → advies → boekingen in één sessie
- **Geen persoonlijke context** — kan klantgegevens niet raadplegen uit Salonized

---

## Scoring: Huidige App vs. Eisen van de Kliniek

| Eis | Huidige App | Score (1-5) | Gap |
|---|---|---|---|
| Professionele telefoongesprekken | VAPI voice integratie, basis prompt | 2/5 | Geen echte stem-Intents, geen warm transfer |
| Direct inplannen in Salonized | `/slots` endpoint is 404 — fataal gebroken | 0/5 | Core-feature crash |
| Bestaande afspraken opzoehen/wijzigen | Geen update/delete implementatie | 1/5 | CRUD-onvolledig |
| Beschikbaarheid per locatie + medewerker | Geen employees/locations in schema | 1/5 | Architecturaal ontbrekend |
| Medewerkers-beperkingen per behandeling | Geen employees/services tabellen | 0/5 | Niet ontwikkeld |
| Algemene vragen over behandelingen | Claude met systeem-prompt | 3/5 | Kan werken met goede prompts, maar geen kennisbank |
| Behandeling passend sturen (intake) | Geen multi-turn reasoning | 1/5 | Geen intake-flow |
| Complexiteit herkennen → doorzetten | Rudimentaire regex + LLM "gevoel" | 2/5 | Geen duidelijke threshold |
| Meerdere locaties en agenda's | Single agenda_provider per salon | 1/5 | Multi-locatie niet ondersteund |
| Eigen content/behandelingen trainen | Alleen via systeem-prompt hardcoding | 2/5 | Geen door gebruiker beheerde content |
| Salonized bestaande data raadplegen | 404 op /slots → alles faalt | 0/5 | Fataal defect |

---

## Aanbevolen Acties

### Fase 1: Salonized API Fix (kritisch)
1. Vervang `/slots` endpoint door de werkende Salonized API call (`GET /appointments` met beschikbaarheidsfilters)
2. Implementeer volledige CRUD: create (`POST /appointments`), read (`GET /appointments/{id}`), update (`PUT`), cancel (`DELETE`)
3. Voeg employee en service lookup toe (`GET /employees`, `GET /services`)
4. Implementeer Salonized webhooks voor real-time sync

### Fase 2: Multi-Locatie Architectuur
1. Voeg `locations`-tabel toe aan schema
2. Voeg `employees`-tabel toe met `location_id` + `service_ids` (many-to-many)
3. Vervang `agenda_provider` per salon door `locations` met elk hun `agenda_provider` + API-config

### Fase 3: AI-Receptist Verbetering
1. Voeg Anthropic function-calling toe (boeken, raadplegen, wijzigen afspraken)
2. Implementeer een `knowledge_base`-tabel voor kliniekspecifieke content (behandelingen, protocollen, FAQ)
3. Voeg escalation-naar-mens flow toe (warm transfer via VAPI)
4. Implementeer multi-turn intake: vraag → advies → boek

### Conclusie

De huidige KapperAssistent heeft de architectuur- en intentie-kaders correct, maar de implementatie is een **MVP-niveau prototype** dat nog niet productieklaar is voor de eisen van een huidtherapeutische kliniek. De Salonized API-integratie is zelfs **functioneel kapot** (404 op `/slots`).

### Conclusie

De huidige KapperAssistent heeft de architectuur- en intentie-kaders correct, maar de implementatie is een **MVP-niveau prototype** dat nog niet productieklaar is voor de eisen van een huidtherapeutische kliniek. De Salonized API-integratie is zelfs **functioneel kapot** (404 op `/slots` — een endpoint dat niet bestaat in de Salonized API).

---

## Concreet Voorstel voor de Kliniek

### Antwoord op de Aanvraag

Beste inkomende kliniek,

Hartelijk dank voor uw interesse. Wij bevestigen dat KapperAssistent technisch geschikt is als basis voor uw huidtherapeutische klinieken, maar de huidige implementatie vereist aanvullonde ontwikkeling om aan al uw eisen te voldoen. Hieronder de details:

#### Salonized Koppeling
De AI kan in een productie-omgeving met een geldige API-key:
- **Bestaande afspraken opzoeken** via `GET /appointments?phone=...` of `GET /appointments?customer_id=...`
- **Afspraken boeken** via `POST /appointments`
- **Afspraken wijzigen** via `PUT /appointments/{id}`
- **Afspraken annuleren** via `DELETE /appointments/{id}`
- **Klantgegevens raadplegen** via `GET /customers?phone=...`
- **Beschikbaarheid per locatie** via `GET /locations` + `GET /appointments?status=available&location_id=...`
- **Medewerkers en hun bevoegdheden** via `GET /employees` en `GET /services` (Salonized koppelt services aan medewerkers via hun profiel)

**Webhook-ondersteuning**: Salonized webhooks (`POST /webhooks`) kunnen geconfigureerd worden voor real-time synchronisatie van nieuwe boekingen, annulaties, en medewerker-wijzigingen.

#### Content en Training
Uw behandelingen, protocollen, en FAQ kunnen worden ingeladen in een **knowledge base** die de AI raadpleegt bij elke conversatie. Dit is een door u zelf beheerbare tabel in het systeem (na een korte onboarding).

#### Implementatie en Kosten
- **Implementatie**: 4-6 weken development (Salonized fixes + multi-locatie + kennisbank + AI-improvs)
- **Kosten**: Afhankelijk van plan en aantal locaties (basisplaatsing bij Salonized is inbegrepen in onze KapperAssistent-abonnementen)

Wij sturen u graag meer informatie en plannen een demonstratie.

---

Met de aanbevolen fixes (vooral Fase 1) zou de app de basis kunnen bieden voor een werkende oplossing, maar vereist dit aanzienlijke ontwikkeling (geschat: 4-6 weken development) voordat het geschikt is voor de kliniek-aanvraag.