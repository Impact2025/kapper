/** Artikel 50 EU AI Act: onmiskenbare AI-identificatie bij het allereerste
 * bericht van een nieuwe conversatie. Deterministisch toegevoegd in code
 * (niet aan het model overgelaten) zodat dit gegarandeerd is — ook voor
 * antwoorden die het model overslaan, zoals de Artikel 9-guard. */
function aiDisclosure(salonName: string): string {
  return `Je spreekt met de virtuele AI-assistent van ${salonName}.`;
}

export function withDisclosure(reply: string, isNewConversation: boolean, salonName: string): string {
  if (!isNewConversation) return reply;
  return `${aiDisclosure(salonName)} ${reply}`;
}
