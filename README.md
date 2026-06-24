# KapperAssistent.nl

De AI-gedreven operationele cockpit voor de moderne kapsalon: een marketingsite met
gratis AI- & SEO-scan (leadmagnet), een CRM, een AI-blogengine, Stripe-facturatie en
geautomatiseerde rapportage.

Gebouwd met **Next.js 16 (App Router, Turbopack)**, **Drizzle ORM + Neon Postgres**,
**Tailwind v4**, **Anthropic Claude**, **Resend** en **Stripe**.

> ⚠️ Deze Next.js-versie wijkt af van de standaard. Lees de relevante gids in
> `node_modules/next/dist/docs/` voordat je framework-API's gebruikt. Let op: de
> `middleware`-conventie heet hier **`proxy.ts`** (Node-runtime).

## Functionaliteit (milestones)

- **M1 — Marketing & scan**: landing, prijzen, blog, contact + gratis AI/SEO-scan die
  leads aanmaakt, een rapport e-mailt (Resend) en de admin notificeert.
- **M2 — Auth & dashboard**: self-hosted sessies (jose + scrypt), `proxy.ts`-gate,
  Data Access Layer, `/admin`-cockpit met sidebar.
- **M3 — CRM**: leadoverzicht met filters, leaddetail met tijdlijn, fasebeheer,
  notities en e-mails (gelogd in `email_messages`).
- **M4 — Blog/SEO**: AI-gegenereerde concepten (Claude), live SEO-score, publicatie,
  publieke artikelpagina's met JSON-LD + sitemap.
- **M5 — Billing**: Stripe Checkout (subscriptions, inline price_data), webhook met
  signatureverificatie die salons + abonnementen provisioneert, couponengine.
- **M6 — Analytics & rapporten**: event-tracking (+ n8n-ingestie), dag-/maandrapporten
  met AI-samenvatting, cron-route beschermd met `CRON_SECRET`.

## Aan de slag

```bash
pnpm install
cp .env.example .env.local   # vul minimaal DATABASE_URL en AUTH_SECRET in
pnpm db:migrate              # of: pnpm db:push
pnpm db:seed                 # maakt een admin-gebruiker (zie SEED_ADMIN_* env)
pnpm dev                     # http://localhost:3000  (admin: /login -> /admin)
```

`AUTH_SECRET` genereer je met `openssl rand -base64 32`. De seed maakt standaard een
admin op basis van `SEED_ADMIN_EMAIL` (default uit `.env.example`).

## Scripts

| Script | Doel |
| --- | --- |
| `pnpm dev` / `pnpm build` / `pnpm start` | Next dev / productie-build / start |
| `pnpm test` | Vitest unit-tests (couponengine, auth, SEO, markdown, utils) |
| `pnpm lint` | ESLint |
| `pnpm db:generate` / `db:migrate` / `db:push` / `db:studio` | Drizzle-migraties |
| `pnpm db:seed` | Admin-gebruiker aanmaken/bijwerken |

## Omgeving

Zie `.env.example`. Optionele integraties degraderen netjes wanneer keys ontbreken
(geen DB -> lege lijsten; geen Anthropic -> fallback-tekst; geen Resend -> e-mail
overgeslagen; geen Stripe -> checkout meldt dat online betalen nog niet actief is).

## Cron

`vercel.json` plant `/api/cron/report` (dagelijks 07:00, maandelijks de 1e). De route
verifieert `Authorization: Bearer $CRON_SECRET`. Handmatig genereren kan via
`/admin/reports`.
