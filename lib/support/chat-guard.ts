/**
 * Deterministische vangnetten rond de support-chat. Draait vóór (en los van)
 * het model: sommige onderwerpen mogen nooit door een AI worden afgehandeld.
 */

export type EscalationReason = "privacy_verzoek" | "betalingsgeschil" | "boos" | "mens_gevraagd";

const PRIVACY_RE =
  /\b(inzage|recht op vergetelheid|gegevens (laten )?(verwijderen|wissen)|verwijder (al )?(mijn|onze) gegevens|datalek|data ?lek|avg[- ]verzoek)\b/i;
const PAYMENT_RE =
  /\b(dubbel (afgeschreven|betaald|gefactureerd)|onterecht (afgeschreven|gefactureerd)|terugbetal\w*|terugstort\w*|chargeback|creditnota|geld terug|betwist\w*)\b/i;
const ANGRY_RE =
  /\b(oplichter\w*|schandalig|belachelijk|klote|waardeloos|rotzooi|advocaat|juridische stappen|aanklagen|ombudsman|consumentenbond|onacceptabel)\b/i;
const HUMAN_RE =
  /\b(medewerker|echt persoon|iemand (spreken|bellen)|mens spreken|ticket (maken|aanmaken|openen)|maak (er )?een ticket)\b/i;

export interface GuardResult {
  escalate: boolean;
  reason?: EscalationReason;
  /** Vaste, door code bepaalde reactie — het model wordt overgeslagen. */
  reply?: string;
  /** Ticketcategorie die past bij de reden. */
  category?: "privacy" | "facturatie" | "overig";
}

export const GUARD_REPLIES: Record<EscalationReason, string> = {
  privacy_verzoek:
    "Een privacyverzoek (zoals inzage of verwijdering van gegevens) behandelt een medewerker altijd persoonlijk. Ik maak hiervoor graag een ticket voor je aan — dan reageren we binnen 5 werkdagen.",
  betalingsgeschil:
    "Vragen over een onterechte of dubbele afschrijving kan ik als AI niet beoordelen. Een medewerker kijkt hier persoonlijk naar — laat me een ticket voor je aanmaken, dan hoef je niets opnieuw uit te leggen.",
  boos:
    "Vervelend om te horen, en dat wil ik goed opgelost hebben. Ik zet dit direct door naar een medewerker via een ticket, met de hele chat erbij zodat je het niet opnieuw hoeft uit te leggen.",
  mens_gevraagd:
    "Natuurlijk — ik maak een ticket voor je aan zodat een medewerker het overneemt, met deze chat erbij.",
};

export function guardMessage(text: string): GuardResult {
  if (PRIVACY_RE.test(text)) {
    return { escalate: true, reason: "privacy_verzoek", reply: GUARD_REPLIES.privacy_verzoek, category: "privacy" };
  }
  if (PAYMENT_RE.test(text)) {
    return { escalate: true, reason: "betalingsgeschil", reply: GUARD_REPLIES.betalingsgeschil, category: "facturatie" };
  }
  if (ANGRY_RE.test(text)) {
    return { escalate: true, reason: "boos", reply: GUARD_REPLIES.boos, category: "overig" };
  }
  if (HUMAN_RE.test(text)) {
    return { escalate: true, reason: "mens_gevraagd", reply: GUARD_REPLIES.mens_gevraagd, category: "overig" };
  }
  return { escalate: false };
}

/** Two unhelpful answers in a row → offer a ticket. */
export function shouldOfferTicketAfterMisses(consecutiveMisses: number): boolean {
  return consecutiveMisses >= 2;
}

export const MAX_USER_MESSAGES_PER_CHAT = 30;
export const MAX_MESSAGE_LEN = 1000;

/** Fixed first message — the AI-disclosure is code, not model-decided (AI Act Art. 50). */
export const SUPPORT_GREETING =
  "Hoi! Ik ben de virtuele AI-assistent van KapperAssistent. Ik beantwoord vragen op basis van ons hulpcentrum en zet je door naar een medewerker als ik er niet uitkom. Waar kan ik mee helpen?";
