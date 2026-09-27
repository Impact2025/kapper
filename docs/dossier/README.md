# Dossier-seeds
Bouwstand per assistent voor het WeAreImpact-dossier (percentage op /admin/launch).
Laden: `DOSSIER_SLUG=<slug> node ~/.claude/scripts/dossier-sync.mjs seed docs/dossier/<slug>.json` (vanuit repo-root, .env bevat CRON_API_KEY).
Slugs: kapperassistent, loodgieterassistent, schilderassistent, hovenierassistent, kozijnassistent, assistent-platform.
Bijhouden: `Milestone: <titel>` in commitbericht; wijzigt de scope, pas dan het JSON-bestand en seed opnieuw (bestaande titels worden overgeslagen).
