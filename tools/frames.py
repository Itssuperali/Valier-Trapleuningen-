"""VALIER — zet de Kling-clips om in beelden voor het scrollblok op de homepage.

Gebruik:
  python3 tools/frames.py clip1.mp4 clip2.mp4 clip3.mp4 clip4.mp4 [clip5.mp4]

Elke clip is één fase-overgang (zie SCROLLBUILD.md). Het script:
- haalt per clip een vast aantal beelden eruit (standaard 30),
- snijdt ze bij tot 720 × 1280 (9:16) en slaat ze op als lichte webp,
- schrijft assets/build/manifest.json met per fase het startbeeld.
Daarna: python3 tools/build.py
"""
import json, shutil, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'build'
PER_CLIP = 30
W, H = 720, 1280

# fase 1 is het beginbeeld van clip 1; fase n+1 begint aan het eind van clip n
PHASES = [
    ('Het ontwerp', 'We beginnen met jouw maten en een tekening van de trap.'),
    ('De kale trap', 'Elke trap is anders. Daarom controleren wij alle maten.'),
    ('Uitzetten', 'De lijn loopt precies mee met de trap. Per wand één rechte leuning.'),
    ('De houders', 'Haakse houders met een vierkante wandplaat, stevig verankerd.'),
    ('De leuning', 'Op maat gemaakt in Ulft, met een tweelaagse poedercoating.'),
    ('Jouw kleur', 'Mat zwart, goud, wit, zandbeige of een RAL-kleur naar keuze.'),
]


def duration(clip):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(clip)],
                         capture_output=True, text=True, check=True).stdout
    return float(out.strip())


def main(clips):
    if not clips:
        sys.exit(__doc__)
    for old in OUT.glob('f-*.webp'):
        old.unlink()
    OUT.mkdir(parents=True, exist_ok=True)
    n, phases = 0, []
    with tempfile.TemporaryDirectory() as tmp:
        for ci, clip in enumerate(clips):
            fps = PER_CLIP / duration(clip)
            subprocess.run(['ffmpeg', '-v', 'error', '-i', str(clip), '-vf',
                            f'fps={fps:.4f},scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}',
                            '-frames:v', str(PER_CLIP), f'{tmp}/c{ci}-%03d.png'], check=True)
            frames = sorted(Path(tmp).glob(f'c{ci}-*.png'))
            if ci == 0:
                phases.append(0)
            for f in frames:
                n += 1
                subprocess.run(['ffmpeg', '-v', 'error', '-i', str(f), '-c:v', 'libwebp', '-quality', '72',
                                str(OUT / f'f-{n:03d}.webp')], check=True)
            phases.append(n - 1)  # eind van deze clip = begin van de volgende fase
    titles = PHASES[:len(phases)]
    manifest = {'count': n, 'width': W, 'height': H, 'pattern': 'assets/build/f-{n}.webp', 'pad': 3, 'placeholder': False,
                'phases': [{'start': s, 'title': t, 'text': x} for s, (t, x) in zip(phases, titles)]}
    (OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'{n} beelden, {len(titles)} fases → assets/build/')


if __name__ == '__main__':
    if not shutil.which('ffmpeg'):
        sys.exit('ffmpeg is nodig')
    main(sys.argv[1:])
