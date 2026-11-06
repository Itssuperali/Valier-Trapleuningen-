// Demo 06 — Configurator: vier karakters. Het nieuwe materiaal "stroomt" de trap op tijdens het scrollen.
import { createStage, createScroll, createRig, createChapters, setEnvIntensity, THREE, v3, range, smooth } from './lib/core.js';
import { createMaterials, straightStair, plane } from './lib/stair.js';

const { renderer, scene, camera, onFrame } = createStage({ background: '#0f0e0d', fog: [10, 22], exposure: 1.05 });
renderer.localClippingEnabled = true;
const M = createMaterials();

const presets = [
  { infill: 'rods', treadMat: M.oak, metal: M.steel, railMat: M.steel },
  { infill: 'bars', treadMat: M.oakLight, metal: M.rvs, railMat: M.rvs, stringerMat: M.white },
  { infill: 'glass', treadMat: M.oak, metal: M.steel, railMat: M.oakRail, clampMat: M.rvs, railRadius: 0.024 },
  { infill: 'glass', treadMat: M.oakSmoked, metal: M.steel, railMat: M.brass, clampMat: M.brass }
];

// Each character is a complete stair; clipping planes reveal one or the other along x (a "wipe").
const planes = presets.map(() => [new THREE.Plane(v3(1, 0, 0), 0), new THREE.Plane(v3(-1, 0, 0), 0)]);
const stairs = presets.map((o, k) => {
  const st = straightStair(M, { ...o, steps: 13 });
  st.group.traverse(obj => {
    if (!obj.isMesh) return;
    obj.material = obj.material.clone();
    obj.material.clippingPlanes = planes[k];
    obj.material.clipShadows = true;
  });
  scene.add(st.group);
  return st;
});
const st = stairs[0];

// Studio
const floor = plane(60, 60, new THREE.MeshStandardMaterial({ color: 0x1a1917, roughness: 0.6, metalness: 0.1 }));
floor.rotation.x = -Math.PI / 2;
scene.add(floor);
const wall = plane(60, 20, M.plasterDark); wall.position.set(st.L / 2, 10, -st.W / 2 - 0.001); scene.add(wall);

scene.add(new THREE.HemisphereLight(0xfff3e6, 0x0d0c0b, 0.35));
const key = new THREE.SpotLight(0xfff0dc, 260, 30, 0.55, 0.6, 1.5);
key.position.set(-2.5, 7.5, 6);
key.target.position.set(st.L / 2, st.H / 2, 0);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.bias = -0.0003;
scene.add(key, key.target);
const rim = new THREE.SpotLight(0xffc690, 120, 20, 0.6, 0.8, 1.5);
rim.position.set(st.L + 3, 4, -0.2);
rim.target.position.set(st.L / 2, st.H / 2, 0.4);
scene.add(rim, rim.target);
setEnvIntensity(scene, 0.6);

// Wipe positions per transition
const transitions = [[0.18, 0.27], [0.43, 0.52], [0.68, 0.77]];
const X0 = -1.2, X1 = st.L + 1.4;
function wipe(p) {
  const w = transitions.map(([a, b]) => {
    const e = smooth(range(p, a, b));
    return e <= 0 ? -50 : e >= 1 ? 50 : X0 + (X1 - X0) * e;
  });
  planes.forEach(([lo, hi], k) => {
    lo.constant = -(k < w.length ? w[k] : -50);   // keep x >= w_k
    hi.constant = k > 0 ? w[k - 1] : 50;           // keep x <= w_(k-1)
  });
}

const c = v3(st.L / 2, st.H / 2, 0);
const orbit = (deg, r, y, fov = 32) => {
  const a = THREE.MathUtils.degToRad(deg);
  return { pos: c.clone().add(v3(Math.sin(a) * r, y, Math.cos(a) * r)), look: c.clone().add(v3(0, -0.15, 0)), fov };
};
const keys = [
  { t: 0, ...orbit(-38, 7.2, 0.9) },
  { t: 0.25, ...orbit(-18, 6.4, 0.3) },
  { t: 0.5, ...orbit(8, 6.6, 1.4) },
  { t: 0.75, ...orbit(30, 6.2, 0.5) },
  { t: 1, ...orbit(44, 6.8, 1.0) }
];
const rig = createRig(keys, { sway: 0.05 });
const scroll = createScroll();
const chapters = createChapters();

// Swatches jump to a character
const centers = [0.08, 0.34, 0.59, 0.83];
const buttons = [...document.querySelectorAll('.swatches button')];
buttons.forEach(b => b.addEventListener('click', () => scroll.scrollTo(centers[+b.dataset.preset])));

onFrame((dt, t) => {
  const p = scroll.update(dt);
  wipe(p);
  rig.apply(camera, p, dt, t);
  chapters(p);
  const active = p < 0.225 ? 0 : p < 0.475 ? 1 : p < 0.725 ? 2 : 3;
  buttons.forEach((b, i) => b.classList.toggle('is-active', i === active));
});
