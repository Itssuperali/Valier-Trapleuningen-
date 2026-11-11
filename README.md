# VALIER Trapleuningen: website

Statische website (HTML, CSS, JavaScript) met een vaste huisstijl en een compacte offertepagina.

## Pagina's
| Pagina | Inhoud |
|---|---|
| `index.html` | Home: introductie, kernpunten, drie profielen, recente projecten, werkwijze |
| `producten.html` | Profielen, kleuren, bevestiging en montage, specificaties |
| `projecten.html` | Alle projectfoto's met filters (recht, om de hoek, glas, kleur, rond) en vergroting |
| `werkwijze.html` | Stappen, zo meet je, levering, veelgestelde vragen |
| `contact.html` | Gegevens en contactformulier |
| `offerte.html` | Offerte aanvragen op één pagina, met overzicht en prijsindicatie die meelopen |

## Pagina's aanpassen
Bewerk de bestanden in `src/` en draai daarna:

```
python3 tools/build.py
```

Dit zet de gedeelde kop (menu) en voet om elke pagina en schrijft de html-bestanden in de hoofdmap. Titels, omschrijvingen en het menu staan bovenaan `tools/build.py`. Bewerk de html-bestanden in de hoofdmap dus niet rechtstreeks.

## Code
- `css/site.css`: de complete huisstijl (kleuren, lettertype, onderdelen).
- `js/site.js`: mobiel menu, fotofilter en vergroting (lightbox).
- `js/offerte.js`: offerteformulier, overzicht, prijsindicatie en verzenden.
- `js/contact.js`: contactformulier.
- `js/scrollbuild.js` en `assets/build/`: het scrollblok "Van tekening tot leuning" op de homepage. Echte beelden maken: zie `SCROLLBUILD.md`, omzetten met `tools/frames.py`.
- `js/catalog.js`: **alles wat je aanbiedt en rekent**: profielen, kleuren, leverwijzen, prijsregels, e-mailadres.
- `js/pricing.js` en `js/state.js`: de prijsberekening op de achtergrond. De klant ziet alleen een totaal (of "Op aanvraag"). De opbouw staat alleen in de mail aan VALIER. Met `PRICING.showToCustomer = false` verberg je de prijs helemaal.
- `data/pc4.json`: postcodes met coördinaten voor de reiskosten (bron en MIT-licentie in `data/LICENSE-4pp.txt`).
- `demos/`: archief van de eerdere 3D-scrollexperimenten (gebruikt `vendor/`).

## Aanvragen
Offerte- en contactaanvragen gaan via FormSubmit naar **info@valier.nl**. Foto's komen als bijlage mee (samen max. 10 MB). De offertemail bevat:
- een leesbare tabel;
- de prijsopbouw (intern);
- de volledige configuratie als JSON.

De eerste aanvraag levert een activatiemail op info@valier.nl op. Klik daarin op "Activate".

## Testen
Lokaal: `python3 -m http.server 8080` en open http://localhost:8080.
Zet `window.VALIER_DEMO = true` om formulieren te testen zonder iets te versturen.
