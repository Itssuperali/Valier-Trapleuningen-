// Demo 10 — Showroom 360°: zelf rondkijken, hotspots met details, afwerking wisselen.
import { createStage, setEnvIntensity, toScreen, THREE, v3, lerp } from './lib/core.js';
import { createMaterials, straightStair, wallRail, plane } from './lib/stair.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const { renderer, scene, camera, onFrame } = createStage({ background: '#11100f', fog: [12, 26], exposure: 1.05 });
const M = createMaterials();
const finish = M.steel.clone();
finish.roughnessMap = M.rvs.roughnessMap;
const st = straightStair(M, { treadMat: M.oak, metal: M.steel, railMat: finish, clampMat: finish, infill: 'glass', stringers: 'open' });
scene.add(st.group);
const wr = wallRail(M, st, { mat: finish, bracketMat: finish });
scene.add(wr.group);
const { L, H, W, run, rise } = st;

const floor = plane(60, 60, new THREE.MeshStandardMaterial({ color: 0x1c1b19, roughness: 0.7 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
const wall = plane(60, 20, new THREE.MeshStandardMaterial({ color: 0x2c2a27, roughness: 0.92 })); wall.position.set(L / 2, 10, -W / 2 - 0.001); scene.add(wall);

scene.add(new THREE.HemisphereLight(0xfff3e6, 0x0d0c0b, 0.45));
const key = new THREE.SpotLight(0xfff0dc, 280, 30, 0.6, 0.6, 1.5);
key.position.set(-2, 8, 6.5);
key.target.position.set(L / 2, H / 2, 0);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.bias = -0.0003;
scene.add(key, key.target);
const rim = new THREE.SpotLight(0xffc690, 120, 20, 0.6, 0.8, 1.5);
rim.position.set(L + 3, 4, 1);
rim.target.position.set(L / 2, H / 2, 0.4);
scene.add(rim, rim.target);
setEnvIntensity(scene, 0.75);

// Controls
let focus = null;
const center = v3(L / 2, H / 2, 0);
camera.position.set(center.x - 4.2, center.y + 1.3, center.z + 5.6);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(center);
Object.assign(controls, {
  enableDamping: true, dampingFactor: 0.06, minDistance: 0.9, maxDistance: 10,
  maxPolarAngle: Math.PI * 0.49, enablePan: false, autoRotate: true, autoRotateSpeed: 0.35, rotateSpeed: 0.6
});
const stopAuto = () => { controls.autoRotate = false; focus = null; };
renderer.domElement.addEventListener('pointerdown', stopAuto);
renderer.domElement.addEventListener('wheel', stopAuto, { passive: true });

// Hotspots
const spots = [
  { k: 'Handlijst', t: 'Ø 42,4 mm', b: 'De maat die een hand vanzelf omsluit. Naadloos gelast en gebogen, in uw afwerking naar keuze.', pt: st.railPoint(0.5) },
  { k: 'Glasklem', t: 'Onzichtbaar sterk', b: 'Elke klem draagt 1,0 kN/m. Gelaagd veiligheidsglas van 17,5 mm, getest volgens NEN-EN 1991.', pt: st.parts.clamps[2].position.clone() },
  { k: 'Leuninghouder', t: 'Elke 80 cm', b: 'Massieve houders, chemisch verankerd in de wand. Geen zichtbare schroeven.', pt: wr.brackets[2].userData.top.clone().add(v3(0, -0.07, -0.04)) },
  { k: 'Trede', t: 'Massief eiken, 45 mm', b: 'Geselecteerd Europees eiken, geolied met een slijtvaste hardwax. Met de hand afgewerkt.', pt: v3(7 * run + run / 2, 8 * rise + 0.002, 0.1) },
  { k: 'Zigzagboom', t: '12 mm staalplaat', b: 'Gelaserd op 0,1 mm nauwkeurig en gepoedercoat in elke RAL-kleur.', pt: v3(run * 4.6, rise * 4.2, W / 2 + 0.015) },
  { k: 'Glas', t: 'Helder of extra-helder', b: 'Kies voor extra-helder glas zonder groene rand, of gesatineerd voor privacy.', pt: v3(st.xTop * 0.66, st.railY(st.xTop * 0.66) - 0.45, W / 2 + 0.05) }
];
const host = document.querySelector('.hotspots');
const card = document.querySelector('.card');
spots.forEach((s, i) => {
  const el = document.createElement('button');
  el.className = 'hotspot';
  el.setAttribute('aria-label', s.k);
  el.innerHTML = '<span></span>';
  el.addEventListener('click', () => open(i));
  host.appendChild(el);
  s.el = el;
});
function open(i) {
  const s = spots[i];
  spots.forEach((x, j) => x.el.classList.toggle('is-active', i === j));
  card.querySelector('.k').textContent = s.k;
  card.querySelector('h3').textContent = s.t;
  card.querySelector('.card__body').textContent = s.b;
  card.classList.add('is-open');
  document.querySelector('.chapter').style.opacity = 0;
  stopAuto();
  const dir = camera.position.clone().sub(s.pt).normalize();
  dir.y = Math.max(dir.y, 0.2);
  focus = { target: s.pt.clone(), pos: s.pt.clone().add(dir.normalize().multiplyScalar(1.3)) };
}
card.querySelector('button').addEventListener('click', () => {
  card.classList.remove('is-open');
  spots.forEach(x => x.el.classList.remove('is-active'));
  focus = { target: center.clone(), pos: center.clone().add(v3(-4.2, 1.3, 5.6)) };
});

// Finish switcher
const finishes = {
  steel: { color: new THREE.Color(0x1b1b1c), metalness: 0.62, roughness: 0.36 },
  rvs: { color: new THREE.Color(0xd9dbdd), metalness: 1, roughness: 0.34 },
  brass: { color: new THREE.Color(0xcaa26a), metalness: 1, roughness: 0.28 }
};
let goal = finishes.steel;
document.querySelectorAll('[data-finish]').forEach(b => b.addEventListener('click', () => {
  goal = finishes[b.dataset.finish];
  document.querySelectorAll('[data-finish]').forEach(x => x.classList.toggle('is-active', x === b));
}));

onFrame(dt => {
  const k = 1 - Math.exp(-dt * 5);
  finish.color.lerp(goal.color, k);
  finish.metalness = lerp(finish.metalness, goal.metalness, k);
  finish.roughness = lerp(finish.roughness, goal.roughness, k);
  if (focus) {
    const f = 1 - Math.exp(-dt * 3);
    controls.target.lerp(focus.target, f);
    camera.position.lerp(focus.pos, f);
    if (camera.position.distanceTo(focus.pos) < 0.01) focus = null;
  }
  controls.update();
  for (const s of spots) {
    const p = toScreen(s.pt, camera);
    s.el.style.opacity = p.visible ? 1 : 0;
    s.el.style.pointerEvents = p.visible ? 'auto' : 'none';
    s.el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
  }
});
