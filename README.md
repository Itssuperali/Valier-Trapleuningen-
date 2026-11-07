# Valier: website

Eén productpagina voor **de Valier-wandleuning**, gebouwd om zo snel mogelijk te bestellen. Statische HTML/CSS/JS, zonder build-stap.

## Opbouw van de pagina
1. **Product (eerste scherm):** links de leuning in 3D, rechts naam, uitleg, **€ 85 per meter** (+ € 35 montage per leuning, € 1 per km vanaf Ulft), bestelknop en vier echte foto's.
2. **Samenstellen (scrollen):** 1 profiel (koker 50×30, koker 50×20, rond Ø50), 2 kleur (mat zwart, goud, wit), 3 soort trap, 4 aantal leuningen (elke leuning is recht), 5 totale lengte, 6 postcode (reiskosten), 7 betalen (direct, of achteraf +10%), 8 gegevens. Elke keuze is direct zichtbaar in het 3D-model; de camera gaat per stap naar het passende standpunt.
3. **Overzicht:** prijsopbouw (leuning, montage, reiskosten, eventuele toeslag) en de knop om te bestellen.
4. **Informatie:** specificaties, werkwijze en veelgestelde vragen, ingeklapt.
5. **Projecten:** 45 eigen foto's met filters en vergroting.

De bestelbalk onderin toont altijd de keuze en de actuele prijs.

## Prijzen en bestellingen
Bovenaan `main.js`:
- `PRIJZEN`: € 85 per meter, € 35 montage per leuning, € 1 per km, 10% toeslag bij achteraf betalen. `retour: true` rekent de kilometers heen en terug.
- Afstand: hemelsbreed tussen de postcodes (uit `data/pc4.json`) × 1,25 als schatting van de afstand over de weg.
- Bestellingen gaan via FormSubmit naar **info@valier.nl**. De eerste bestelling levert een activatiemail op dat adres op; klik daarin op "Activate".
- "Direct betalen" stuurt nog geen klant naar iDEAL: Valier stuurt na de bestelling een betaalverzoek. Echte online betaling (bijv. Mollie) vraagt een account en een kleine serverfunctie.

## Bestanden
- `index.html`, `styles.css`, `main.js`
- `js/viewer.js`: de 3D-leuning (Three.js)
- `data/pc4.json`: Nederlandse 4-cijferige postcodes met coördinaten (bron en MIT-licentie: `data/LICENSE-4pp.txt`)
- `assets/photos/`: projectfoto's (1200px en 600px, zonder locatiegegevens)
- `vendor/`: Three.js r160 met addons, Lenis (alleen voor `demos/`)
- `STRATEGIE.md`: onderzoek en ontwerpkeuzes
- `demos/`: eerdere 3D-concepten (archief, niet gelinkt)

Testen: `?shot=profiel` (of `overzicht`, `kleur`, `hoek`, `lengte`, `houder`) zet de 3D-viewer op een standpunt; `?profiel=rond&kleur=goud&trap=recht&delen=1&postcode=6811` opent met een configuratie.

## Lokaal bekijken
```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Live zetten
Sleep de map naar app.netlify.com/drop, of koppel de repo aan Netlify of Vercel. Er is geen build nodig.
