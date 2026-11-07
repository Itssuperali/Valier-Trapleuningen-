# VALIER Trapleuningen: website met 3D-configurator

Statische site (HTML, CSS, JavaScript-modules met Three.js), zonder build-stap.

## Opbouw van de pagina
1. **Ons werk:** de beste projectfoto's (nabewerkt in `assets/hero/`), alle 45 foto's via "Bekijk alle projecten".
2. **3D-configurator** (desktop: stap links, 3D rechts; mobiel: 3D boven, knoppen onderin):
   1. Hoeveel leuningen? (elke leuning is recht)
   2. Lengte per leuning (mm/cm, meetuitleg)
   3. Vorm en profiel (koker 50×30 / 50×20 plat gemonteerd, of rond Ø50; alle leuningen of per leuning)
   4. Kleur (alle leuningen of per leuning; RAL op aanvraag)
   5. Overzicht (elke keuze direct te wijzigen)
   6. Aanvraag (gegevens, leverwijze, foto's, opmerkingen) → aanvraagnummer en bevestiging
   De traptype-keuze is op verzoek verwijderd; `js/stairs.js` (trapmodellen) blijft beschikbaar voor later.
3. **Vragen** en footer.

## Code
- `js/catalog.js`: **alles wat je aanbiedt en rekent**: traptypen, profielen, kleuren, leverwijzen, prijsregels, statussen, e-mailadres. Iets toevoegen of uitzetten = alleen dit bestand.
- `js/state.js`: één centrale configuratie; keuzes worden automatisch bewaard in de browser.
- `js/pricing.js`: prijsberekening op de achtergrond. De klant ziet alleen een totaal (of "Op aanvraag"); de opbouw staat alleen in de aanvraag aan VALIER. `PRICING.showToCustomer = false` verbergt de prijs helemaal.
- `js/stairs.js`: parametrische trapmodellen (vluchten, spiltreden, bordes) en de leuningposities per type.
- `js/viewer3d.js`: 3D-weergave, standpunten, klikken op posities, leuningen met echte doorsnede, houders.
- `js/app.js`: de stappen, validatie, overzicht en aanvraag.
- `data/pc4.json`: postcodes met coördinaten voor de reiskosten (bron en MIT-licentie in `data/LICENSE-4pp.txt`).

## Aanvragen
Gaan via FormSubmit naar **info@valier.nl** als gewoon formulier (foto's als bijlage, samen max. 10 MB). De mail bevat een leesbare tabel, de prijsopbouw en de volledige configuratie als JSON (id, datum, status, klant, trap, leuningen, foto's, opmerkingen, prijs).
De eerste aanvraag levert een activatiemail op info@valier.nl op: klik op "Activate".

Dit is nog geen database of beheersysteem. De statussen staan klaar in `catalog.js` (`STATUSES`) en de JSON is zo opgezet dat een dashboard later kan aansluiten.

## Testen
- `?type=kwart&dir=rechts&rails=v1-r,d1-a&len=2400,760&step=3` opent een configuratie.
- Lokaal: `python3 -m http.server 8080` en open http://localhost:8080
