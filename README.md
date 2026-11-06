# Valier: website

Een site rond één product: **de Valier-wandleuning**. Statische HTML/CSS/JS, zonder build-stap.

## Opbouw
- `index.html`: de homepage
  1. **Productfilm (3D):** de leuning in de hoofdrol. Scroll stuurt de camera langs het vierkante profiel, de wandhouder, de delen om de hoek en de afwerkingen. Scherptediepte houdt de leuning scherp.
  2. **Projecten:** echte foto's (zonder metadata/locatie), met een vergrotingsweergave
  3. Waarom Valier, werkwijze, specificaties, veelgestelde vragen
  4. **Aanvraag:** prijs op maat in drie stappen
- `js/film.js`: de 3D-scène (Three.js) met het leuningmodel, de houders, de trap en de camera-choreografie
- `main.js`: smooth scroll, navigatie, onthullingen, lightbox en formulier
- `styles.css`: vormgeving
- `assets/photos/`: geoptimaliseerde projectfoto's (1200px en 600px)
- `vendor/`: Three.js r160 (met postprocessing), GSAP, ScrollTrigger en Lenis, lokaal meegeleverd
- `STRATEGIE.md`: onderzoek, klantpsychologie en ontwerpkeuzes
- `demos/`: eerdere 3D-concepten (archief, niet meer gelinkt)

Tip: `?p=0.5` achter de URL springt de film direct naar 50%.

## Lokaal bekijken
```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Live zetten
Sleep de map naar app.netlify.com/drop, of koppel de repo aan Netlify of Vercel. Er is geen build nodig.

## Nog te doen
- Formulier koppelen: in `main.js`, zoek op `TODO`
- Echte contactgegevens in de footer
- Specificaties controleren (profielmaat, kleuren)
