# LoodgietersAssistent: review door een praktiserend loodgieter

Doel: een echte vakman toetst wat de AI-receptie zegt bij gas, water en verwarming, voor het product wordt gepromoot als "wereldklasse". Dit is het enige onderdeel dat niet door ons zelf gevalideerd kan worden. Bron van alle teksten: `lib/verticals/loodgieter.ts`.

Vraag aan de reviewer: markeer per punt **klopt / aanpassen / schrappen** en noteer de reden. Het gaat om veiligheid, niet om stijl.

## 1. Wat de AI zegt bij spoed

Letterlijke regel (`agent.prompt.spoedRule`):

> een acuut probleem (water dat blijft lopen of door het plafond komt, gaslucht, geen warm water of verwarming bij kou, veiligheidsrisico) behandel je als spoed. Geef eerst korte veiligheidstips (bijv. hoofdkraan afsluiten, stroom uit bij water bij stopcontacten). Bij gaslucht: ramen open, geen vuur of lichtschakelaars aanraken, het pand verlaten en het gasstoringsnummer 0800-9009 bellen; bij acuut gevaar 112.

Vragen:
1. Is de volgorde bij gaslucht juist (ramen open, niets aanraken, pand verlaten, bellen)? Moet 112 eerder genoemd worden, of juist niet?
2. Is 0800-9009 het juiste nummer voor elke netbeheerder, ook buiten kantoortijd? Moet de AI ook "buiten bellen, niet binnen" zeggen?
3. "Stroom uit bij water bij stopcontacten": is dat veilig advies voor een leek, of kan dat juist gevaar opleveren (bijvoorbeeld door water in de meterkast)?
4. "Hoofdkraan afsluiten": moet de AI ook uitleggen waar die meestal zit, of laten wij dat beter weg?
5. Mist er een spoedsituatie? Denk aan koolmonoxide-alarm, ontplofte of lekkende boiler, rioolwater in huis, bevroren leidingen.

## 2. Wanneer de AI doorverbindt (nooit zelf geruststellen)

Voorbeelden: gaslek, ernstige waterschade (`hazardExamples`). De AI verwijst door naar een mens bij technische complexiteit, een veiligheidsrisico, klachten of een verzoek.

Vragen:
6. Zijn dit de juiste voorbeelden? Moet CO-vergiftiging of een ketel die zichtbaar lekt of rookt erbij?
7. Is het goed dat de AI nooit een diagnose of prijsindicatie voor een lastig geval geeft?

## 3. Categorieën en spoed

Spoed staat standaard aan bij **lekkage** en **gaslucht**. **CV-storing** (geen verwarming) staat uit; de AI beoordeelt bij kou zelf of het spoed is.

Vragen:
8. Moet "geen verwarming bij vorst" standaard spoed zijn, of past dat niet bij jullie praktijk?
9. Klopt de geschatte tijd per soort klus (lekkage 90 min, cv-storing 75, cv-onderhoud 60, ketel vervangen 300, warmtepomp 480, badkamer 480)?

## 4. Checklists

Controleer de checklist per categorie in `jobCategories`. Vragen:
10. Staat er een verplichte stap bij die mist (gas: dichtheidsmeting, afblaas- en veiligheidscontrole, afvoer, ventilatie)?
11. Staat er een stap die in de praktijk nooit gebeurt en dus geloofwaardigheid kost?
12. Warmtepomp: kloppen de stappen en hints rond groepenkast, koudemiddelcircuit en F-gassencertificaat?

## 5. Meetwaarden bij cv-onderhoud

Velden: CO (ppm), CO₂ (%), rookgastemperatuur (°C), waterdruk (bar), uitkomst controle.

Vragen:
13. Zijn dit de waarden die u standaard noteert? Wat ontbreekt (rendement, gasdruk, afstelling)?
14. Zijn de eenheden en voorbeeldwaarden (placeholders) realistisch?

## 6. Btw

Het product zet 21% als standaard en laat per regel kiezen. Op de klus staat "woning ouder dan 2 jaar" als hint voor het verlaagde tarief op arbeid.

Vragen (en laat ook een boekhouder of de Belastingdienst bevestigen):
15. Is dit hoe u het in de praktijk doet?
16. Is de hint (`woningOuderDan2Jaar`) voldoende of misleidend?

## 7. Voorbeeldprijzen

Alle prijzen in `serviceTemplates` zijn startpunten. Vraag:
17. Zijn ze plausibel voor een gemiddeld loodgietersbedrijf, zodat een nieuwe klant niet schrikt of ze zonder nadenken overneemt?

## 8. Wat u nog mist

18. Welke drie functies zou een loodgieter in dit product verwachten die er niet zijn?
19. Wat zou u als eerste weglaten of anders doen?

## Na de review

- Aanpassingen komen in `lib/verticals/loodgieter.ts`; veiligheidsregels staan vastgelegd door tests (`tests/verticals.test.ts`, `tests/job-agent-prompt.test.ts`).
- Daarna in het WeAreImpact-dossier de taak "Gas- en waterveiligheidsregels laten toetsen door een echte loodgieter" afvinken en de btw-taak oppakken.
