# Valier: website

Eén productpagina voor **de Valier-wandleuning**, gebouwd om zo snel mogelijk te bestellen. Statische HTML/CSS/JS, zonder build-stap.

## Opbouw van de pagina
1. **Product (eerste scherm):** links de leuning in 3D, rechts naam, korte uitleg, prijs, kenmerken, bestelknop en vier echte foto's.
2. **Samenstellen (scrollen):** 1 profiel (vierkant of rond), 2 kleur (mat zwart, goud, wit), 3 soort trap, 4 aantal leuningdelen, 5 lengte, 6 inmeten en foto's, 7 gegevens. Elke keuze is direct zichtbaar in het 3D-model, en de camera gaat per stap naar het passende standpunt.
3. **Overzicht en bestellen:** samenvatting met de knop "Bestelling aanvragen".
4. **Informatie:** specificaties, werkwijze en veelgestelde vragen, ingeklapt.
5. **Projecten:** 45 eigen foto's met filters en vergroting.

Tijdens het samenstellen blijft de 3D-leuning in beeld (desktop: links, mobiel: bovenin). De bestelbalk met uw keuze staat onderin altijd binnen bereik.

## Bestanden
- `index.html`, `styles.css`
- `main.js`: samenstellen, bestelbalk, versturen, galerij. **Bovenaan staan `PRIJZEN` en `AANVRAAG_URL`**:
  - vul `PRIJZEN` in om direct een prijsindicatie te tonen (zolang leeg: "Prijs op maat")
  - vul `AANVRAAG_URL` in (bijv. een Formspree-adres) zodat aanvragen in uw mailbox komen. Zolang dit leeg is, ziet de bezoeker na versturen eerlijk dat de site nog niet gekoppeld is.
- `js/viewer.js`: de 3D-leuning (Three.js): vierkant/rond, 1–4 delen, kleuren, vaste camerastandpunten
- `assets/photos/`: projectfoto's (1200px en 600px, zonder locatiegegevens)
- `vendor/`: Three.js r160 met addons, Lenis (alleen voor `demos/`)
- `STRATEGIE.md`: onderzoek en ontwerpkeuzes
- `demos/`: eerdere 3D-concepten (archief, niet gelinkt)

Testen: `?shot=profiel` (of `overzicht`, `kleur`, `hoek`, `lengte`, `houder`) zet de 3D-viewer direct op een standpunt; `?profiel=rond&kleur=goud&trap=recht&delen=1` opent met een configuratie.

## Lokaal bekijken
```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Live zetten
Sleep de map naar app.netlify.com/drop, of koppel de repo aan Netlify of Vercel. Er is geen build nodig.
