/** Macro's voor het helpdesk-team. {{naam}} wordt bij invoegen vervangen. */
export interface CannedReply {
  id: string;
  label: string;
  body: string;
}

export const CANNED_REPLIES: CannedReply[] = [
  {
    id: "ontvangen",
    label: "Ontvangen — we zoeken het uit",
    body: "Hoi {{naam}},\n\nBedankt voor je bericht. We zoeken dit voor je uit en komen zo snel mogelijk bij je terug.\n\nMet vriendelijke groet,",
  },
  {
    id: "meer-info",
    label: "Meer informatie nodig",
    body: "Hoi {{naam}},\n\nOm je goed te kunnen helpen hebben we nog wat extra informatie nodig:\n\n- Wat wilde je bereiken en wat gebeurde er in plaats daarvan?\n- Sinds wanneer speelt dit?\n- Een screenshot van eventuele foutmeldingen\n\nDeel nooit je wachtwoord of API-sleutels.\n\nMet vriendelijke groet,",
  },
  {
    id: "koppeling-check",
    label: "Agenda-koppeling controleren",
    body: "Hoi {{naam}},\n\nDank voor je melding. Kun je onder Integraties controleren of je API-sleutel nog geldig is? Is de sleutel in je agenda-software vernieuwd of ingetrokken, voer dan de nieuwe sleutel in. Blijft het probleem bestaan, laat het ons dan weten met de naam van je agenda-software, dan kijken we mee.\n\nMet vriendelijke groet,",
  },
  {
    id: "privacy-ontvangen",
    label: "Privacyverzoek ontvangen",
    body: "Hoi {{naam}},\n\nWe hebben je privacyverzoek ontvangen en behandelen het binnen 5 werkdagen. Om misbruik te voorkomen kunnen we je vragen je identiteit te bevestigen.\n\nMet vriendelijke groet,",
  },
  {
    id: "opgelost",
    label: "Opgelost — afsluiten",
    body: "Hoi {{naam}},\n\nFijn dat we dit hebben kunnen oplossen. Als er nog iets is, reageer dan gerust op dit ticket — dan pakken we het weer op.\n\nMet vriendelijke groet,",
  },
];

export function fillCanned(body: string, name: string): string {
  return body.replace(/\{\{naam\}\}/g, name.split(" ")[0] ?? name);
}
