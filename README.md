# Valier Trapleuningen: website

Cinematische, premium homepage. Statische HTML/CSS/JS zonder build-stap.

- `STRATEGIE.md`: onderzoek, klantpsychologie, ontwerpsysteem en **wat we van jou nodig hebben**
- `index.html`, `styles.css`, `main.js`: de site
- `demos/`: **10 interactieve 3D-concepten** (Three.js). De camera beweegt via scroll langs trap en leuning. Overzicht: `demos/index.html`
  - `demos/lib/core.js`: renderer, scroll naar camera-pad, hoofdstukken
  - `demos/lib/stair.js`: procedurele trappen, leuningen en materialen
  - Tip: voeg `?p=0.5` toe aan een demo-URL om direct naar 50% van de scroll te springen
- `vendor/`: GSAP 3.12.5, ScrollTrigger, Lenis 1.1.13 en Three.js r160, lokaal meegeleverd (snel, geen CDN-afhankelijkheid)

## Lokaal bekijken
```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Live zetten
Sleep de map naar Netlify Drop, of koppel de repo aan Vercel/Netlify. Er is geen build nodig.

## Echte beelden invoegen
- Hero-video: zie de opmerking in `index.html` bij `.hero__media`
- Projecten: vervang `<div class="ph ph--1">` door `<img src="assets/project-1.avif" alt="…" class="ph" style="object-fit:cover;width:100%;height:124%">`
- Formulier: koppel in `main.js` (zoek op `TODO`) aan Formspree of HubSpot
