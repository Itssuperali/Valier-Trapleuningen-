// Demo 07 — Dag & Nacht: scroll door één dag. Van ochtendzon tot LED in de handlijst.
import { createStage, createScroll, createRig, createChapters, setEnvIntensity, THREE, v3, lerp, clamp } from './lib/core.js';
import { createMaterials, straightStair, plane, box } from './lib/stair.js';

const { scene, camera, renderer, onFrame, setBackground } = createStage({ background: '#d6c4ab', exposure: 1.0 });
const M = createMaterials();
const st = straightStair(M, { treadMat: M.oak, metal: M.steel, infill: 'rods', stringers: 'open' });
scene.add(st.group);

const floor = plane(40, 40, M.floorOak); floor.rotation.x = -Math.PI / 2; scene.add(floor);
const wallMat = M.plaster.clone();
const wall = plane(40, 14, wallMat); wall.position.set(st.L / 2, 7, -st.W / 2 - 0.001); scene.add(wall);
const slab = box(6, 0.26, 4, M.plaster); slab.position.set(st.L + 3, st.H - 0.13, 1.5); scene.add(slab);

// LED strip under the handrail
const ledMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
const strip = new THREE.Mesh(new THREE.TubeGeometry(st.railCurve, 500, 0.0055, 8, false), ledMat);
strip.position.y = -0.024;
scene.add(strip);
// Recessed step lights in the wall
const stepMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
for (let i = 0; i < st.N; i += 2) {
  const s = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.035), stepMat);
  s.position.set(i * st.run + st.run / 2, (i + 1) * st.rise + 0.2, -st.W / 2 + 0.002);
  scene.add(s);
}
const ledLights = [0.15, 0.4, 0.65, 0.9].map(u => {
  const l = new THREE.PointLight(0xffc98a, 0, 2.6, 2);
  l.position.copy(st.railCurve.getPointAt(u)).add(v3(0, -0.12, 0));
  scene.add(l);
  return l;
});

const hemi = new THREE.HemisphereLight(0xfff0dd, 0x6b5a48, 0.6);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffc283, 3);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 0.5, far: 30 });
sun.shadow.bias = -0.0004;
sun.shadow.radius = 3;
const target = v3(st.L / 2, st.H / 2, 0);
sun.target.position.copy(target);
scene.add(sun, sun.target);

// Window frame (invisible) that casts window-shaped light onto wall and stair
const frame = new THREE.Shape();
frame.moveTo(-4, -4); frame.lineTo(4, -4); frame.lineTo(4, 4); frame.lineTo(-4, 4); frame.lineTo(-4, -4);
for (const [x, y] of [[-1.15, 0.05], [0.05, 0.05], [-1.15, -1.25], [0.05, -1.25]]) {
  const h = new THREE.Path();
  h.moveTo(x, y); h.lineTo(x + 1.1, y); h.lineTo(x + 1.1, y + 1.2); h.lineTo(x, y + 1.2); h.lineTo(x, y);
  frame.holes.push(h);
}
const gobo = new THREE.Mesh(new THREE.ShapeGeometry(frame), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, side: THREE.DoubleSide }));
gobo.castShadow = true;
scene.add(gobo);

// Time of day keyframes
const day = [
  { p: 0.0, bg: '#d4c2a8', sun: '#ffbf80', si: 3.4, az: -1.05, el: 0.3, hemi: 0.5, led: 0, hour: 7.0 },
  { p: 0.3, bg: '#e7e2d9', sun: '#fff6ea', si: 3.6, az: -0.4, el: 0.95, hemi: 0.85, led: 0, hour: 13.0 },
  { p: 0.56, bg: '#7a5d49', sun: '#ff8a4a', si: 2.6, az: 0.95, el: 0.2, hemi: 0.32, led: 0.15, hour: 19.5 },
  { p: 0.78, bg: '#121217', sun: '#7d8fc4', si: 0.18, az: 1.1, el: 0.7, hemi: 0.05, led: 1, hour: 23.0 },
  { p: 1.0, bg: '#0e0e12', sun: '#7d8fc4', si: 0.12, az: 1.1, el: 0.7, hemi: 0.04, led: 1, hour: 23.6 }
];
const cA = new THREE.Color(), cB = new THREE.Color(), tmp = new THREE.Color();
function sample(p) {
  let i = 0;
  while (i < day.length - 2 && p > day[i + 1].p) i++;
  const a = day[i], b = day[i + 1], f = clamp((p - a.p) / (b.p - a.p));
  const s = {};
  for (const k of ['si', 'az', 'el', 'hemi', 'led', 'hour']) s[k] = lerp(a[k], b[k], f);
  s.bg = cA.set(a.bg).clone().lerp(cB.set(b.bg), f);
  s.sun = cA.set(a.sun).clone().lerp(cB.set(b.sun), f);
  return s;
}

const keys = [
  { t: 0, pos: v3(-1.6, 2.1, 6.6), look: v3(st.L * 0.5, st.H * 0.48, 0), fov: 36 },
  { t: 0.5, pos: v3(0.3, 1.8, 5.4), look: v3(st.L * 0.52, st.H * 0.5, 0), fov: 36 },
  { t: 1, pos: v3(1.6, 1.5, 4.3), look: v3(st.L * 0.56, st.H * 0.55, 0), fov: 36 }
];
const rig = createRig(keys, { sway: 0.05 });
const scroll = createScroll();
const chapters = createChapters();

const hud = document.querySelector('.hud');
hud.innerHTML = '<div>Tijd<b data-time>07:00</b></div><div>Licht<b data-mood>Ochtend</b></div>';
const hTime = hud.querySelector('[data-time]'), hMood = hud.querySelector('[data-mood]');
setEnvIntensity(scene, 0.7);
const dir = new THREE.Vector3();

onFrame((dt, t) => {
  const p = scroll.update(dt);
  const s = sample(p);
  setBackground(s.bg);
  hemi.intensity = s.hemi;
  sun.color.copy(s.sun);
  sun.intensity = s.si;
  dir.set(Math.sin(s.az) * Math.cos(s.el), Math.sin(s.el), Math.cos(s.az) * Math.cos(s.el));
  sun.position.copy(target).addScaledVector(dir, 12);
  gobo.position.copy(target).addScaledVector(dir, 4.5);
  gobo.lookAt(sun.position);
  ledMat.color.setRGB(1, 0.8, 0.55).multiplyScalar(s.led * 1.6);
  stepMat.color.setRGB(1, 0.82, 0.6).multiplyScalar(s.led * 1.4);
  ledLights.forEach(l => (l.intensity = s.led * 2.2));
  renderer.toneMappingExposure = lerp(1.0, 1.25, s.led);
  setEnvIntensity(scene, lerp(0.08, 0.75, s.hemi));
  // readable UI on light/dark backgrounds
  const lum = s.bg.r * 0.299 + s.bg.g * 0.587 + s.bg.b * 0.114;
  document.body.dataset.theme = lum > 0.45 ? 'light' : 'dark';
  const h = Math.floor(s.hour), m = Math.floor((s.hour - h) * 60);
  hTime.textContent = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  hMood.textContent = s.hour < 11 ? 'Ochtend' : s.hour < 17 ? 'Middag' : s.hour < 21 ? 'Avond' : 'Nacht';
  rig.apply(camera, p, dt, t);
  chapters(p);
});
