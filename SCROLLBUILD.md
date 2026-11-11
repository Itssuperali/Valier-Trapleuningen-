# Scrollblok "Van tekening tot leuning": stappenplan en prompts

Op de homepage staat een blok dat een beeldreeks afspeelt terwijl je scrolt. Een kale trap wordt daarin stap voor stap een trap met een VALIER-leuning. Nu staan er tijdelijke beelden in. Met dit stappenplan maak je de echte.

**Wat je nodig hebt**
- **Nano Banana Pro** (in Gemini) voor de foto's per fase.
- **Kling** voor de filmpjes tussen de fases. Je hebt de functie met een **start- en eindbeeld** nodig.

Schrijf de prompts in het Engels. Daarmee werken beide programma's het best.

**Gouden regel:** de camera mag nergens bewegen. Elk beeld moet precies over het vorige passen. Geef Nano Banana daarom altijd **alleen het vorige beeld** mee, nooit een tweede voorbeeld. Met een tweede beeld springt de camera.

---

## Stap 1: het eindbeeld (fase 5)

Begin bij een **echte foto** van een geplaatste leuning. Dan klopt het eindresultaat en ziet het er niet nep uit.
- Advies: de originele foto achter `assets/lux/twee-delen.jpg`. Daarop staan twee leuningen om de hoek, een rustige witte wand en duidelijk zichtbare wandplaten.
- Gebruik de **originele foto van je telefoon**, niet de verkleinde versie van de site.

**Prompt 1: naar staand 9:16-formaat** (kies in Nano Banana de beeldverhouding 9:16)
```
Extend this photograph to a vertical 9:16 frame. Keep everything that is already in the photo exactly as it is: the same camera position, lens, perspective, light, colours and every line of the stairs, walls and handrails. Only add more of the same wall above and more of the same stairs below, matching perfectly. Photorealistic, no new objects, no text.
```
Bewaar het resultaat als **fase-5.png**.

## Stap 2: terugwerken (fase 4, 3, 2)

Steeds hetzelfde principe: het vorige resultaat is Image 1, en je haalt er één ding uit.

**Prompt 2: alleen de houders, nog geen leuning** (Image 1 = fase-5.png → bewaar als **fase-4.png**)
```
Image 1 is a photograph. CAMERA LOCK: keep exactly the same camera position, framing, lens, light and every line of the stairs and walls from Image 1. Do not move, crop or zoom anything.
Change only this: remove the black steel handrail tubes completely. Keep the black square wall plates with their short black right-angled brackets exactly where they are, now holding nothing. Where the tubes were, show clean smooth white wall with the same soft shading.
Photorealistic, same photo quality, no people, no hands, no tools, no text.
```

**Prompt 3: uitgezet, nog geen houders** (Image 1 = fase-4.png → bewaar als **fase-3.png**)
```
Image 1 is a photograph. CAMERA LOCK: keep exactly the same camera position, framing, lens, light and every line of the stairs and walls from Image 1. Do not move, crop or zoom anything.
Change only this: remove the black wall plates and brackets completely, the wall behind them is clean. Exactly where the centre of each plate was, draw a small pencil cross on the wall. Connect the crosses of each wall with one thin, straight pencil line that runs parallel to the slope of the stairs, the way a carpenter marks out a handrail.
Subtle, realistic grey graphite on white plaster. No people, no hands, no tools, no text.
```

**Prompt 4: de kale trap** (Image 1 = fase-3.png → bewaar als **fase-2.png**)
```
Image 1 is a photograph. CAMERA LOCK: keep exactly the same camera position, framing, lens, light and every line of the stairs and walls from Image 1. Do not move, crop or zoom anything.
Change only this: remove all pencil lines and crosses. The walls are clean, smooth and empty.
Photorealistic, same photo quality, no people, no text.
```

## Stap 3: de tekening (fase 1)

**Prompt 5: technische tekening** (Image 1 = fase-5.png, dus het eindbeeld → bewaar als **fase-1.png**)
```
Image 1 is a photograph. CAMERA LOCK: keep exactly the same camera position, framing, perspective and every line of the stairs, walls and handrails from Image 1.
Turn it into a clean architectural line drawing on white drawing paper: thin black ink lines for the stairs and walls, no shading, no colour. Draw the handrails, wall plates and brackets in thin bronze-brown lines (#8a6c45) so they stand out as the design. Every line stays in exactly the same place as in the photo.
No text, no dimensions, no people.
```

## Stap 4 (optioneel): een andere kleur (fase 6)

**Prompt 6: goud** (Image 1 = fase-5.png → bewaar als **fase-6.png**)
```
Image 1 is a photograph. CAMERA LOCK: keep exactly the same camera position, framing, lens, light and every line from Image 1.
Change only this: the handrails, wall plates and brackets get a matt satin gold powder coat, a warm muted brass tone, not shiny, not chrome. Everything else stays identical.
Photorealistic, no text.
```

## Controle per beeld

Zet het nieuwe beeld en het vorige beeld in twee tabbladen en klik heen en weer.
- De traptreden, de hoeken van de wand en de plinten moeten **niet verspringen**.
- Verspringt er iets? Genereer het beeld opnieuw. Ga niet verder met een beeld dat niet klopt, want elke fout zie je straks direct in het filmpje.

---

## Stap 5: de filmpjes in Kling

Gebruik deze instellingen voor elke clip:
- Image to Video, met een **start- en eindbeeld**;
- 5 seconden;
- beeldverhouding 9:16;
- de hoogste kwaliteit die je abonnement heeft.

| Clip | Startbeeld | Eindbeeld | Prompt |
|---|---|---|---|
| clip1 | fase-1 | fase-2 | `Locked-off tripod shot, the camera does not move at all. The ink line drawing slowly turns into the real photograph of the empty staircase, calm and smooth.` |
| clip2 | fase-2 | fase-3 | `Locked-off tripod shot, the camera does not move at all. A thin pencil line draws itself on the white wall along the slope of the stairs, from bottom to top, then small pencil crosses appear on it.` |
| clip3 | fase-3 | fase-4 | `Locked-off tripod shot, the camera does not move at all. Black square wall plates with brackets appear on the pencil crosses one by one, from bottom to top, like a time-lapse. The pencil marks disappear behind them.` |
| clip4 | fase-4 | fase-5 | `Locked-off tripod shot, the camera does not move at all. The black steel handrails settle gently onto the brackets, precise and calm, like a time-lapse of an installation.` |
| clip5 (optioneel) | fase-5 | fase-6 | `Locked-off tripod shot, the camera does not move at all. The handrails, plates and brackets slowly change colour from matt black to satin gold. Nothing else changes.` |

**Negatieve prompt** (voor elke clip):
```
camera movement, zoom, pan, tilt, shaking, people, hands, tools, text, warping walls, morphing stairs, bending handrails, flicker
```

**Controle per clip:**
- Het laatste beeld van de clip moet gelijk zijn aan het volgende fasebeeld.
- De trap mag tijdens de clip niet "smelten" of vervormen.
- Zie je dat wel? Genereer de clip opnieuw.

---

## Stap 6: aanleveren

Stuur de clips als **clip1.mp4 tot en met clip4.mp4** (of clip5.mp4). Daarna gaat het zo:
```
python3 tools/frames.py clip1.mp4 clip2.mp4 clip3.mp4 clip4.mp4 clip5.mp4
python3 tools/build.py
```
1. `tools/frames.py` haalt de beelden uit de clips, maakt ze licht genoeg voor een telefoon (ongeveer 2 MB in totaal) en zet de fasenamen goed.
2. `tools/build.py` bouwt de pagina's opnieuw.
3. Het label "Tijdelijke beelden" verdwijnt dan vanzelf.
