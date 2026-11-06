// Demo 09 — Blauwdruk: van technische tekening naar staal en eiken.
import { createStage, createScroll, createRig, createChapters, setEnvIntensity, toScreen, THREE, v3, range, smooth } from './lib/core.js';
import { createMaterials, straightStair, addEdges, plane } from './lib/stair.js';

const { scene, camera, onFrame, setBackground } = createStage({ background: '#0e2236', exposure: 1.05 });
const M = createMaterials();
const st = straightStair(M, { treadMat: M.oak, metal: M.steel, infill: 'rods', stringers: 'open' });
scene.add(st.group);
const { L, H, W, run, rise } = st;

const floor = plane(40, 40, M.concrete); floor.rotation.x = -Math.PI / 2; floor.userData.noEdges = true; scene.add(floor);
const wall = plane(40, 14, M.plasterDark); wall.position.set(L / 2, 7, -W / 2 - 0.001); wall.userData.noEdges = true; scene.add(wall);

// Blueprint layer: edges, grid and dimension lines
const edges = addEdges(st.group, { color: 0xe8f1ff, opacity: 0.9, threshold: 28 });
const grid = new THREE.GridHelper(24, 96, 0x6f93b8, 0x2f4d6b);
grid.material.transparent = true;
grid.position.set(L / 2, 0.002, 0);
scene.add(grid);
const dimMat = new THREE.LineBasicMaterial({ color: 0xe8f1ff, transparent: true });
const dimLine = pts => scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), dimMat));
const zD = W / 2 + 0.35;
dimLine([v3(0, -0.001, zD), v3(L, -0.001, zD)]);
dimLine([v3(0, -0.001, zD - 0.08), v3(0, -0.001, zD + 0.08)]);
dimLine([v3(L, -0.001, zD - 0.08), v3(L, -0.001, zD + 0.08)]);
dimLine([v3(L + 0.4, 0, W / 2), v3(L + 0.4, H, W / 2)]);
dimLine([v3(L + 0.32, 0, W / 2), v3(L + 0.48, 0, W / 2)]);
dimLine([v3(L + 0.32, H, W / 2), v3(L + 0.48, H, W / 2)]);

// Materialisation: every solid material fades in
const solids = [];
scene.traverse(o => {
  if (!o.isMesh) return;
  const m = o.material;
  if (!solids.find(s => s.m === m)) solids.push({ m, base: m.opacity, tr: m.transparent });
});
function materialize(s) {
  for (const x of solids) {
    const tr = s < 0.999 || x.tr;
    if (x.m.transparent !== tr) { x.m.transparent = tr; x.m.needsUpdate = true; }
    x.m.opacity = x.base * s;
    x.m.depthWrite = s > 0.5 || !tr;
  }
}

// HTML dimension labels anchored to 3D points
const labelData = [
  ['L = 4.050 mm', v3(L / 2, 0, zD + 0.12)],
  ['H = 2.850 mm', v3(L + 0.55, H / 2, W / 2)],
  ['Optrede 190 mm', v3(run * 2.6, rise * 3.6, W / 2 + 0.05)],
  ['Aantrede 270 mm', v3(run * 7.2, rise * 7 + 0.08, W / 2 + 0.05)],
  ['Handlijst Ø 42,4 mm', st.railPoint(0.62).add(v3(0, 0.08, 0))],
  ['∠ 35,1°', v3(run * 0.9, rise * 0.9, W / 2 + 0.05)]
];
const host = document.querySelector('.labels');
const labels = labelData.map(([txt, pt]) => {
  const el = document.createElement('div');
  el.className = 'label';
  el.textContent = txt;
  host.appendChild(el);
  return { el, pt };
});

// Lights
scene.add(new THREE.HemisphereLight(0xfff1e0, 0x0a0908, 0.3));
const sun = new THREE.DirectionalLight(0xffe2bc, 2.6);
sun.position.set(L + 2, H + 6, 4);
sun.target.position.set(L / 2, H / 2, 0);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 25 });
sun.shadow.bias = -0.0004;
scene.add(sun, sun.target);
setEnvIntensity(scene, 0.45);

const keys = [
  { t: 0.0, pos: v3(L / 2, H / 2 + 0.2, 16), look: v3(L / 2, H / 2, 0), fov: 17 },
  { t: 0.3, pos: v3(L / 2 + 7, H / 2 + 3, 11), look: v3(L / 2, H / 2, 0), fov: 20 },
  { t: 0.58, pos: v3(L + 2.6, H + 1.4, 5), look: v3(L * 0.45, H * 0.45, 0), fov: 32 },
  { t: 0.8, pos: v3(-1.4, 1.3, 4.4), look: v3(L * 0.5, H * 0.48, 0), fov: 36 },
  { t: 1.0, pos: v3(-2.2, 1.5, 5.2), look: v3(L * 0.52, H * 0.5, 0), fov: 36 }
];
const rig = createRig(keys, { sway: 0.05 });
const scroll = createScroll();
const chapters = createChapters();
const bgA = new THREE.Color('#0e2236'), bgB = new THREE.Color('#121110'), bg = new THREE.Color();

onFrame((dt, t) => {
  const p = scroll.update(dt);
  const solid = smooth(range(p, 0.36, 0.62));
  const lines = 1 - smooth(range(p, 0.5, 0.72));
  materialize(solid);
  edges.mat.opacity = 0.9 * lines;
  edges.lines.forEach(l => (l.visible = lines > 0.002));
  grid.material.opacity = 0.55 * lines;
  dimMat.opacity = lines;
  setBackground(bg.copy(bgA).lerp(bgB, smooth(range(p, 0.34, 0.6))));
  rig.apply(camera, p, dt, t);
  chapters(p);
  const lo = 1 - smooth(range(p, 0.4, 0.55));
  for (const l of labels) {
    const s = toScreen(l.pt, camera);
    l.el.style.opacity = s.visible ? lo : 0;
    l.el.style.transform = `translate3d(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px, 0)`;
  }
});
