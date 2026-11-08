"""VALIER — bouwt de pagina's uit src/*.html met één gedeelde kop en voet.

Gebruik:  python3 tools/build.py
Bewerk de inhoud in src/<pagina>.html en de kop/voet hieronder; draai dan dit script.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'src'

PAGES = [
    # file, menu key, title, description
    ('index.html', 'home', 'VALIER Trapleuningen | Stalen wandleuningen op maat',
     'Stalen wandleuningen op maat, gemaakt in Ulft. Rechthoekig of rond, in vijf kleuren. Bekijk projecten en vraag direct een offerte aan.'),
    ('producten.html', 'producten', 'Producten | VALIER Trapleuningen',
     'Profielen, kleuren, bevestiging en montage van de VALIER-wandleuning, met alle specificaties op een rij.'),
    ('projecten.html', 'projecten', 'Projecten | VALIER Trapleuningen',
     'Geplaatste VALIER-leuningen bij klanten: rechte trappen, kwarttrappen, trappen met glas en meer.'),
    ('werkwijze.html', 'werkwijze', 'Werkwijze | VALIER Trapleuningen',
     'Van aanvraag tot montage: zo werkt VALIER. Inclusief uitleg over meten, levering en montage.'),
    ('contact.html', 'contact', 'Contact | VALIER Trapleuningen',
     'Neem contact op met VALIER Trapleuningen in Ulft.'),
    ('offerte.html', 'offerte', 'Offerte aanvragen | VALIER Trapleuningen',
     'Stel je wandleuningen samen en vraag een vrijblijvende offerte aan. Direct een prijsindicatie.'),
]

MENU = [('index.html', 'home', 'Home'), ('producten.html', 'producten', 'Producten'), ('projecten.html', 'projecten', 'Projecten'),
        ('werkwijze.html', 'werkwijze', 'Werkwijze'), ('contact.html', 'contact', 'Contact')]

LOGO = '<svg viewBox="0 0 28 28" aria-hidden="true"><path fill="#1d1d1b" d="M5 5h4v14.5l5 3 5-3V5h4v16.8L14 27.4l-9-5.6z"/></svg>'


def head(title, desc):
    return f'''<!doctype html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <meta name="theme-color" content="#ffffff">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:image" content="assets/lux/lijn-glas.jpg">
  <link rel="icon" href="assets/brand/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/site.css">
</head>
<body>'''


def header(key):
    links = '\n'.join(f'      <a href="{f}"{" aria-current=\"page\"" if k == key else ""}>{t}</a>' for f, k, t in MENU)
    return f'''
<div class="topbar"><div class="container"><span>Stalen wandleuningen op maat, gemaakt in Ulft</span><span class="hide-m"><a href="mailto:info@valier.nl">info@valier.nl</a></span></div></div>
<header class="header">
  <div class="container">
    <a class="logo" href="index.html" aria-label="VALIER Trapleuningen, naar de homepage">{LOGO}<span><b>VALIER</b><small>Trapleuningen</small></span></a>
    <nav class="menu" id="menu" aria-label="Hoofdmenu">
{links}
    </nav>
    <div class="header__cta">
      <a class="btn btn--primary btn--sm" href="offerte.html">Offerte aanvragen</a>
      <button class="burger" type="button" aria-label="Menu openen" aria-controls="menu" aria-expanded="false"><span></span></button>
    </div>
  </div>
</header>
<main>'''


FOOTER = f'''
</main>
<footer class="footer">
  <div class="container">
    <div class="footer__grid">
      <div>
        <a class="logo" href="index.html">{LOGO.replace('#1d1d1b', '#ffffff')}<span><b>VALIER</b></span></a>
        <p>Stalen wandleuningen op maat. Gemaakt in onze werkplaats in Ulft en door ons gemonteerd.</p>
      </div>
      <div><h4>Producten</h4><a href="producten.html#profielen">Profielen</a><a href="producten.html#kleuren">Kleuren</a><a href="producten.html#montage">Bevestiging en montage</a><a href="offerte.html">Offerte aanvragen</a></div>
      <div><h4>Informatie</h4><a href="projecten.html">Projecten</a><a href="werkwijze.html">Werkwijze</a><a href="werkwijze.html#meten">Zo meet je</a><a href="werkwijze.html#vragen">Veelgestelde vragen</a></div>
      <div><h4>Contact</h4><a href="mailto:info@valier.nl">info@valier.nl</a><a href="contact.html">Ulft, Gelderland</a><a href="contact.html">Contactformulier</a></div>
    </div>
    <div class="footer__base"><span>© 2026 VALIER Trapleuningen</span><span>Prijzen inclusief btw. Een aanvraag is vrijblijvend.</span></div>
  </div>
</footer>
<dialog class="lightbox" id="lightbox" aria-label="Foto vergroot"><img alt=""><button class="lb-close" type="button" aria-label="Sluiten">×</button><button class="lb-prev" type="button" aria-label="Vorige foto">‹</button><button class="lb-next" type="button" aria-label="Volgende foto">›</button><p class="lb-cap"></p></dialog>
<script src="js/site.js" defer></script>'''


def build():
    for file, key, title, desc in PAGES:
        body = (SRC / file).read_text(encoding='utf-8')
        extra = ''
        if body.startswith('<!--scripts:'):
            line, body = body.split('\n', 1)
            extra = '\n' + line[len('<!--scripts:'):-3].strip()
        html = head(title, desc) + header(key) + '\n' + body.rstrip() + '\n' + FOOTER + extra + '\n</body>\n</html>\n'
        (ROOT / file).write_text(html, encoding='utf-8')
        print('built', file)


if __name__ == '__main__':
    build()
