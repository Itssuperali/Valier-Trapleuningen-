/* =========================================================
   VALIER — productviewer: de wandleuning in 3D
   Koker 50×30 of 50×20 (rechtop: 50 mm hoog) of rond Ø50; haakse wandhouders; 1–4 rechte leuningen.
   De pagina stuurt configuratie en camerastandpunt via events:
     document.dispatchEvent(new CustomEvent('valier:config', { detail: { profiel: '50x30'|'50x20'|'rond', kleur, delen } }))
     document.dispatchEvent(new CustomEvent('valier:shot',   { detail: 'profiel' }))
   ========================================================= */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const viewer = document.querySelector('.viewer');
const canvas = viewer.querySelector('.viewer__canvas');
const params = new URLSearchParams(location.search);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let dirty = 30; // frames still to render; the loop sleeps when nothing changes
const light = matchMedia('(pointer: coarse), (max-width: 760px)').matches; // phones/tablets: no post-processing

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const range = (p, a, b) => clamp((p - a) / (b - a));
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

/* ---------- Renderer ---------- */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  viewer.classList.add('no-webgl', 'is-ready');
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, light ? 1.5 : 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#100e0c');
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 60);

/* ---------- Textures ---------- */
function noiseTexture(size = 256, lo = 200, hi = 255) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = lo + Math.random() * (hi - lo);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(20, 20);
  return t;
}
function woodTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#c9ad8a'; g.fillRect(0, 0, 1024, 256);
  for (let i = 0; i < 300; i++) {
    const y = Math.random() * 256, amp = 1 + Math.random() * 4, f = (1 + Math.floor(Math.random() * 3)) * Math.PI * 2 / 1024, ph = Math.random() * 6.28;
    g.strokeStyle = Math.random() < 0.6 ? '#9c7d5a' : '#e0c9a8';
    g.globalAlpha = 0.05 + Math.random() * 0.16;
    g.lineWidth = 0.5 + Math.random() * 2;
    g.beginPath();
    for (let x = 0; x <= 1024; x += 8) { const yy = y + Math.sin(x * f + ph) * amp; x ? g.lineTo(x, yy) : g.moveTo(x, yy); }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}
function glowTexture() { // warm LED wash on the riser, bright under the nosing
  const c = document.createElement('canvas');
  c.width = 4; c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 128);
  grd.addColorStop(0, 'rgba(255,214,160,1)');
  grd.addColorStop(0.25, 'rgba(255,196,130,.45)');
  grd.addColorStop(1, 'rgba(255,190,120,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 4, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------- Materials ---------- */
const powder = noiseTexture(256, 205, 255);
const railMat = new THREE.MeshPhysicalMaterial({
  color: 0x141414, metalness: 0.3, roughness: 0.5, roughnessMap: powder,
  clearcoat: 0.3, clearcoatRoughness: 0.45, envMapIntensity: 0.8
});
const screwMat = new THREE.MeshStandardMaterial({ color: 0x0e0e0e, metalness: 0.6, roughness: 0.35 });
const wallMat = new THREE.MeshStandardMaterial({ color: 0xddd5c9, roughness: 0.95, roughnessMap: noiseTexture(256, 220, 255), envMapIntensity: 0.35 });
const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf2efe9, roughness: 0.6, envMapIntensity: 0.4 });
const oakMat = new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.55, envMapIntensity: 0.5 });
const nosingMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5, metalness: 0.2 });
const floorMat = new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.6, envMapIntensity: 0.4 });
floorMat.map.repeat.set(4, 16);
const riserMat = new THREE.MeshStandardMaterial({ color: 0xf2efe9, roughness: 0.7, emissive: 0xffffff, emissiveMap: glowTexture(), emissiveIntensity: 0.9, envMapIntensity: 0.3 });
const ledMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.25, 0.85) });


/* ---------- Geometry helpers ---------- */
function roundedRect(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function roundedBox(w, h, d, r, mat) {
  const b = 0.0012;
  const g = new THREE.ExtrudeGeometry(roundedRect(w - 2 * b, h - 2 * b, r), { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 6 });
  g.translate(0, 0, -(d - 2 * b) / 2);
  const m = new THREE.Mesh(g, mat);
  m.castShadow = m.receiveShadow = true;
  return m;
}
const box = (w, h, d, mat) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.castShadow = m.receiveShadow = true;
  return m;
};

/** A straight rail (rectangular tube pw × ph) from a to b; pw runs out from the wall, ph is the height.
 *  Valier mounts its tubes upright: 50 mm high, 30 or 20 mm deep. */
const PROFILE = 0.04; // bracket reference: the saddle sits 20 mm below the rail centre line
function railSegment(a, b, wallNormal, pw = 0.05, ph = 0.03) {
  const len = a.distanceTo(b);
  const bev = 0.0016;
  const g = new THREE.ExtrudeGeometry(roundedRect(pw - 2 * bev, ph - 2 * bev, 0.0035), {
    depth: len - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 8
  });
  g.translate(0, 0, bev);
  const z = b.clone().sub(a).normalize();
  const x = wallNormal.clone().normalize();
  const y = new THREE.Vector3().crossVectors(z, x);
  const m = new THREE.Mesh(g, railMat);
  m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  m.position.copy(a);
  m.castShadow = m.receiveShadow = true;
  // flat end caps, a hair proud of the tube, like the real product
  for (const cz of [-0.0012, len + 0.0012]) {
    const cap = roundedBox(pw + 0.0008, ph + 0.0008, 0.0024, 0.0035, railMat);
    cap.position.z = cz;
    m.add(cap);
  }
  return m;
}

/** Wall bracket like the real product (checked against close-up photos):
 *  square wall plate, a square bar straight out of the wall from its upper part,
 *  then a square bar straight up into the rail, which rests on a small saddle. */
const OFF = 0.068; // rail centre distance from wall
function bracket(ang) {
  const g = new THREE.Group();
  const drop = 0.098, t = 0.015;          // plate centre below rail centre, bar section
  const armY = -drop + 0.014;             // the arm leaves the plate above its centre
  const plate = roundedBox(0.058, 0.066, 0.006, 0.004, railMat);
  plate.position.set(0, -drop, 0.003);
  const screws = [[0, -0.02]].map(([sx, sy]) => {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.0048, 0.0052, 0.0022, 24), screwMat);
    s.rotation.x = Math.PI / 2;
    s.position.set(sx, -drop + sy, 0.0068);
    s.userData.home = s.position.clone();
    s.castShadow = true;
    return s;
  });
  const arm = roundedBox(t, t, OFF - 0.006 + t / 2, 0.0015, railMat);    // straight out of the wall
  arm.position.set(0, armY, 0.006 + (OFF - 0.006 + t / 2) / 2);
  const yTop = -PROFILE / 2 / Math.cos(ang) - 0.003;
  const up = box(t, yTop - armY + t / 2, t, railMat);                    // straight up into the rail
  up.position.set(0, (armY - t / 2 + yTop) / 2, OFF);
  const saddle = roundedBox(0.028, 0.02, 0.005, 0.002, railMat);
  saddle.rotation.order = 'ZXY';
  saddle.rotation.x = -Math.PI / 2;
  saddle.rotation.z = ang;
  saddle.position.set(0, yTop + 0.0015, OFF);
  g.add(plate, arm, up, saddle, ...screws);
  g.userData = { plate, screws };
  return g;
}

/* =========================================================
   Scene: two walls meeting in a corner (kwartslag), rails in segments
   ========================================================= */
const Xc = 3.25;          // corner: wall A (z = 0) meets wall B (x = Xc)
const W = 0.85;           // stair width
const rise = 0.19, run = 0.252, slope = rise / run, ang = Math.atan(slope);
const x0 = 0.186;         // first nosing

// Walls & floor
const wallA = new THREE.Mesh(new THREE.PlaneGeometry(20, 9), wallMat);
wallA.position.set(Xc - 10, 4.5, 0); wallA.receiveShadow = true; scene.add(wallA);
const wallB = new THREE.Mesh(new THREE.PlaneGeometry(14, 9), wallMat);
wallB.rotation.y = -Math.PI / 2; wallB.position.set(Xc, 4.5, 7); wallB.receiveShadow = true; scene.add(wallB);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), floorMat);
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

// Flight 1 along wall A
const nosingAt = i => x0 + i * run;
for (let i = 0; i < 9; i++) {
  const top = (i + 1) * rise, xn = nosingAt(i);
  const t = box(run + 0.03, 0.03, W, oakMat); t.position.set(xn - 0.03 + (run + 0.03) / 2, top - 0.015, W / 2); scene.add(t);
  const n = box(0.012, 0.03, W, nosingMat); n.position.set(xn - 0.03, top - 0.015, W / 2); scene.add(n);
  const rh = rise - 0.03;
  const r = box(0.015, rh, W, riserMat); r.position.set(xn - 0.012, top - 0.03 - rh / 2, W / 2); r.castShadow = false; scene.add(r);
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.004, W - 0.06), ledMat); led.position.set(xn - 0.022, top - 0.034, W / 2); scene.add(led);
}
// Winders in the corner, fanning around the inner pivot
const pivot = { x: Xc - W, z: W };
const winders = 5;
const edgePoint = th => { // ray from pivot to the corner square's outer edge
  const dx = Math.cos(th), dz = Math.sin(th);
  const t1 = -pivot.z / dz; // hit z = 0
  const xHit = pivot.x + t1 * dx;
  if (dz < 0 && xHit <= Xc) return [xHit, 0];
  const t2 = (Xc - pivot.x) / dx; // hit x = Xc
  return [Xc, pivot.z + t2 * dz];
};
for (let k = 0; k < winders; k++) {
  const a0 = -Math.PI / 2 + (k / winders) * (Math.PI / 2), a1 = -Math.PI / 2 + ((k + 1) / winders) * (Math.PI / 2);
  const p0 = edgePoint(a0), p1 = edgePoint(a1);
  const s = new THREE.Shape();
  s.moveTo(pivot.x, pivot.z); s.lineTo(p0[0], p0[1]);
  if (p0[1] === 0 && p1[0] === Xc && p1[1] > 0) s.lineTo(Xc, 0);
  s.lineTo(p1[0], p1[1]); s.lineTo(pivot.x, pivot.z);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: false });
  g.rotateX(Math.PI / 2);
  const m = new THREE.Mesh(g, oakMat);
  m.position.y = (10 + k) * rise;
  m.castShadow = m.receiveShadow = true;
  scene.add(m);
  // riser along the leading edge, with its LED line
  const len = Math.hypot(p0[0] - pivot.x, p0[1] - pivot.z), rh = rise - 0.03;
  const r = new THREE.Mesh(new THREE.PlaneGeometry(len, rh), riserMat);
  r.rotation.y = -Math.atan2(p0[1] - pivot.z, p0[0] - pivot.x);
  r.position.set((pivot.x + p0[0]) / 2, (10 + k) * rise - 0.03 - rh / 2, (pivot.z + p0[1]) / 2);
  r.material.side = THREE.DoubleSide;
  scene.add(r);
}
// Flight 2 along wall B (rising towards +z)
const top2 = j => (10 + winders + j) * rise;
for (let j = 0; j < 8; j++) {
  const zn = W + j * run;
  const t = box(W, 0.03, run + 0.03, oakMat); t.position.set(Xc - W / 2, top2(j) - 0.015, zn - 0.03 + (run + 0.03) / 2); scene.add(t);
  const n = box(W, 0.03, 0.012, nosingMat); n.position.set(Xc - W / 2, top2(j) - 0.015, zn - 0.03); scene.add(n);
  const rh = rise - 0.03;
  const r = box(W, rh, 0.015, riserMat); r.position.set(Xc - W / 2, top2(j) - 0.03 - rh / 2, zn - 0.012); r.castShadow = false; scene.add(r);
  const led = new THREE.Mesh(new THREE.BoxGeometry(W - 0.06, 0.004, 0.004), ledMat); led.position.set(Xc - W / 2, top2(j) - 0.034, zn - 0.022); scene.add(led);
}
// Closed white sides under both flights (a 'dichte trap', as in the real projects)
{
  const sideMat = whiteMat.clone(); sideMat.side = THREE.DoubleSide;
  const s1 = new THREE.Shape();
  s1.moveTo(x0 - 0.03, 0);
  for (let i = 0; i < 9; i++) {
    s1.lineTo(nosingAt(i) - 0.03, (i + 1) * rise);
    s1.lineTo(Math.min(nosingAt(i) + run - 0.03, Xc - W), (i + 1) * rise);
  }
  s1.lineTo(Xc - W, 0); s1.lineTo(x0 - 0.03, 0);
  const p1 = new THREE.Mesh(new THREE.ShapeGeometry(s1), sideMat);
  p1.position.z = W + 0.001; p1.receiveShadow = true; scene.add(p1);
  const s2 = new THREE.Shape();
  s2.moveTo(W - 0.03, 0);
  for (let j = 0; j < 8; j++) {
    s2.lineTo(W + j * run - 0.03, top2(j));
    s2.lineTo(W + (j + 1) * run - 0.03, top2(j));
  }
  s2.lineTo(W + 8 * run - 0.03, 0); s2.lineTo(W - 0.03, 0);
  const p2 = new THREE.Mesh(new THREE.ShapeGeometry(s2), sideMat);
  p2.rotation.y = -Math.PI / 2; p2.position.x = Xc - W - 0.001; p2.receiveShadow = true; scene.add(p2);
}
// White string board on wall A, following the stair (as in the real projects)
{
  const len = (nosingAt(8) + 0.5) / Math.cos(ang);
  const sb = box(len, 0.16, 0.016, whiteMat);
  sb.rotation.z = ang;
  const cx = (nosingAt(8) + 0.5) / 2 - 0.25;
  sb.position.set(cx, rise + slope * (cx - x0) + 0.05, 0.008);
  scene.add(sb);
}

/* =========================================================
   Rails: pieces along the two walls, each in square and round profile
   ========================================================= */
const railYA = x => rise + slope * (x - x0) + 0.9;
const railYB = z => top2(0) + slope * (z - W) + 0.9;
const ptA = x => v3(x, railYA(x), OFF);
const ptB = (z, y) => v3(Xc - OFF, y, z);
const yCorner = railYA(Xc - 0.11) + 0.05;

const PIECES = {
  A:  { a: ptA(-0.05), b: ptA(Xc - 0.11), wall: 'A' },
  A1: { a: ptA(-0.05), b: ptA(0.78), wall: 'A' },
  A2: { a: ptA(0.92), b: ptA(Xc - 0.11), wall: 'A' },
  B:  { a: ptB(0.11, yCorner), b: ptB(2.6, railYB(2.6)), wall: 'B' },
  C:  { a: ptB(0.11, yCorner), b: ptB(0.8, railYB(0.8) - 0.02), wall: 'B' },
  B2: { a: ptB(0.92, railYB(0.92)), b: ptB(2.6, railYB(2.6)), wall: 'B' }
};
// how many pieces → which pieces are shown (matches how Valier splits a kwartslag on site)
const LAYOUTS = { 1: ['A'], 2: ['A', 'B'], 3: ['A', 'C', 'B2'], 4: ['A1', 'A2', 'C', 'B2'] };

const RADIUS = 0.025; // rond Ø 50 mm
function roundSegment(a, b) {
  const len = a.distanceTo(b);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(RADIUS, RADIUS, len, 48, 1), railMat);
  m.quaternion.setFromUnitVectors(v3(0, 1, 0), b.clone().sub(a).normalize());
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.castShadow = m.receiveShadow = true;
  return m;
}

for (const [name, p] of Object.entries(PIECES)) {
  const normal = p.wall === 'A' ? v3(0, 0, 1) : v3(-1, 0, 0);
  const horiz = p.wall === 'A' ? Math.abs(p.b.x - p.a.x) : Math.abs(p.b.z - p.a.z);
  const pAng = Math.atan2(p.b.y - p.a.y, horiz);
  // each profile rests on the bracket saddle: shift it so its underside meets the saddle
  const lift = hh => v3(0, (hh - PROFILE / 2) / Math.cos(pAng), 0);
  p.meshes = {
    // upright, as on site: 50 mm high, 30 or 20 mm out from the wall
    '50x30': railSegment(p.a.clone().add(lift(0.025)), p.b.clone().add(lift(0.025)), normal, 0.03, 0.05),
    '50x20': railSegment(p.a.clone().add(lift(0.025)), p.b.clone().add(lift(0.025)), normal, 0.02, 0.05),
    rond: roundSegment(p.a.clone().add(lift(RADIUS)), p.b.clone().add(lift(RADIUS)))
  };
  p.brackets = [];
  const len = p.a.distanceTo(p.b);
  const us = len > 2.2 ? [0.1, 0.5, 0.9] : len > 0.9 ? [0.18, 0.82] : [0.5];
  for (const u of us) {
    const q = p.a.clone().lerp(p.b, u), b = bracket(pAng);
    if (p.wall === 'A') b.position.set(q.x, q.y, 0);
    else { b.rotation.y = -Math.PI / 2; b.position.set(Xc, q.y, q.z); }
    p.brackets.push(b);
    scene.add(b);
  }
  scene.add(...Object.values(p.meshes));
  p.name = name;
}

const config = { profiel: '50x30', kleur: 'zwart', delen: 3 };
function applyLayout() {
  const shown = LAYOUTS[Math.max(1, Math.min(4, config.delen | 0))];
  for (const p of Object.values(PIECES)) {
    const on = shown.includes(p.name);
    for (const [k, m] of Object.entries(p.meshes)) m.visible = on && config.profiel === k;
    p.brackets.forEach(b => (b.visible = on));
  }
  dirty = 30;
}

/* ---------- Light: warm, raking along the wall ---------- */
scene.add(new THREE.HemisphereLight(0xfff1df, 0x2a2018, 0.2));
const key = new THREE.SpotLight(0xffdcb2, 80, 16, 0.55, 0.85, 1.3);
key.position.set(-0.5, 5.2, 1.4);
key.target.position.set(2.1, 2.6, 0);
key.castShadow = true;
key.shadow.mapSize.set(light ? 1024 : 2048, light ? 1024 : 2048);
key.shadow.bias = -0.0002;
key.shadow.normalBias = 0.01;
scene.add(key, key.target);
const fill = new THREE.PointLight(0xffc690, 1.6, 6, 2);
fill.position.set(Xc - 0.6, 3.8, 1.6);
scene.add(fill);

/* =========================================================
   Camera: fixed shots, calm straight-line moves between them.
   All shots sit inside the room (x < wall B, z > wall A) and above the
   stair, so a straight move can never pass through a wall or the steps.
   ========================================================= */
const A0 = ptA(-0.05), AEND = ptA(Xc - 0.11);
const dirA = AEND.clone().sub(A0).normalize();
const RA = u => A0.clone().lerp(AEND, u);
function heroBracket() {
  let best = null, d = Infinity;
  for (const p of Object.values(PIECES)) for (const b of p.brackets) {
    if (!b.visible || p.wall !== 'A') continue;
    const dd = Math.abs(b.position.x - 1.75);
    if (dd < d) { d = dd; best = b; }
  }
  return (best || PIECES.A.brackets[1]).position.clone();
}
const SHOTS = {
  overzicht: () => ({ pos: RA(0.44).add(v3(-0.5, -0.3, 1.02)), look: RA(0.53).add(v3(-0.04, -0.03, 0)), fov: 32, ap: 0.6 }),
  profiel: () => ({ pos: A0.clone().addScaledVector(dirA, -0.34).add(v3(0.02, 0.035, 0.075)), look: A0.clone().addScaledVector(dirA, 0.05), fov: 26, ap: 1 }),
  kleur: () => ({ pos: RA(0.46).add(v3(-0.3, -0.17, 0.66)), look: RA(0.5).add(v3(-0.02, 0.0, 0)), fov: 30, ap: 0.7 }),
  hoek: () => ({ pos: v3(Xc - 2.0, 4.05, 2.55), look: v3(Xc - 0.55, 3.45, 0.5), fov: 42, ap: 0.35 }),
  lengte: () => ({ pos: v3(-1.05, 1.5, 2.45), look: v3(1.75, 2.45, 0.1), fov: 42, ap: 0.25 }),
  houder: () => { const b = heroBracket(); return { pos: b.clone().add(v3(-0.18, -0.2, 0.32)), look: b.clone().add(v3(0, -0.06, 0.035)), fov: 28, ap: 1 }; }
};

const cam = { pos: v3(0, 0, 0), look: v3(0, 0, 0), fov: 34, ap: 0.5 };
let tween = null, current = 'overzicht';
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function goTo(name, instant = false) {
  if (!SHOTS[name]) return;
  current = name;
  const to = SHOTS[name]();
  if (instant || reduceMotion) { Object.assign(cam, { pos: to.pos, look: to.look, fov: to.fov, ap: to.ap }); tween = null; }
  else tween = { from: { pos: cam.pos.clone(), look: cam.look.clone(), fov: cam.fov, ap: cam.ap }, to, t: 0, dur: 1.15 };
  viewer.dataset.shot = name;
  tabs.forEach(t => t.classList.toggle('is-active', t.dataset.view === name));
  dirty = 60;
}

/* ---------- Post-processing: gentle depth of field on desktop ---------- */
let composer = null, bokeh = null;
if (!light) {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bokeh = new BokehPass(scene, camera, { focus: 1, aperture: 0.002, maxblur: 0.005 });
  composer.addPass(bokeh);
  composer.addPass(new OutputPass());
}
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  if (composer) {
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(w, h);
    bokeh.uniforms.aspect.value = camera.aspect;
  }
  dirty = 4;
}
new ResizeObserver(resize).observe(canvas);

/* ---------- Finish ---------- */
const finishes = {
  zwart: { color: new THREE.Color(0x141414), metalness: 0.3, roughness: 0.5, clearcoat: 0.3 },
  goud: { color: new THREE.Color(0x8c7650), metalness: 0.7, roughness: 0.42, clearcoat: 0.12 }, // champagne-brons, gemeten op projectfoto's
  wit: { color: new THREE.Color(0xeeece7), metalness: 0.05, roughness: 0.45, clearcoat: 0.2 }
};
let goal = finishes.zwart;
function stepFinish(dt) {
  const k = 1 - Math.exp(-dt * 6);
  const before = railMat.color.getHex();
  railMat.color.lerp(goal.color, k);
  railMat.metalness = lerp(railMat.metalness, goal.metalness, k);
  railMat.roughness = lerp(railMat.roughness, goal.roughness, k);
  railMat.clearcoat = lerp(railMat.clearcoat, goal.clearcoat, k);
  return before !== railMat.color.getHex();
}

/* ---------- Dimension labels (profile shot) ---------- */
const yA = new THREE.Vector3().crossVectors(dirA, v3(0, 0, 1));
const PROF = { '50x30': { w: '30 mm', h: '50 mm', hh: 0.025, hd: 0.015 }, '50x20': { w: '20 mm', h: '50 mm', hh: 0.025, hd: 0.01 }, rond: { w: 'Ø 50 mm', h: '', hh: RADIUS, hd: RADIUS } };
const centre = () => A0.clone().add(v3(0, (PROF[config.profiel].hh - PROFILE / 2) / Math.cos(Math.atan(slope)), 0));
const labels = [
  { el: viewer.querySelector('[data-label="w"]'), pt: () => centre().addScaledVector(yA, PROF[config.profiel].hh + 0.016) },
  { el: viewer.querySelector('[data-label="h"]'), pt: () => centre().add(v3(0, 0, PROF[config.profiel].hd + 0.016)) }
];
const _p = new THREE.Vector3();
function updateLabels(show) {
  for (const l of labels) {
    if (!l.el) continue;
    _p.copy(l.pt()).project(camera);
    l.el.style.opacity = show && _p.z < 1 ? 1 : 0;
    l.el.style.transform = `translate3d(${((_p.x * 0.5 + 0.5) * canvas.clientWidth).toFixed(1)}px, ${((-_p.y * 0.5 + 0.5) * canvas.clientHeight).toFixed(1)}px, 0)`;
  }
}

/* ---------- Pointer: a little life, desktop only ---------- */
const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
if (matchMedia('(pointer: fine)').matches && !reduceMotion) {
  addEventListener('pointermove', e => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; dirty = Math.max(dirty, 2); });
}

/* ---------- Wiring to the page ---------- */
const tabs = [...viewer.querySelectorAll('[data-view]')];
tabs.forEach(t => t.addEventListener('click', () => goTo(t.dataset.view)));
function setConfig(c) {
  const layoutChanged = c.delen !== config.delen || c.profiel !== config.profiel;
  Object.assign(config, c);
  goal = finishes[config.kleur] || finishes.zwart;
  if (layoutChanged) applyLayout();
  const pr = PROF[config.profiel] || PROF['50x30'];
  viewer.querySelector('[data-label="w"]').textContent = pr.w;
  viewer.querySelector('[data-label="h"]').textContent = pr.h;
  viewer.querySelector('[data-label="h"]').hidden = !pr.h;
  dirty = 60;
}
document.addEventListener('valier:config', e => setConfig(e.detail));
document.addEventListener('valier:shot', e => goTo(e.detail));
if (window.valierState) setConfig(window.valierState);
applyLayout();
goal = finishes[config.kleur] || finishes.zwart;
const firstShot = params.get('shot') || window.valierShot || 'overzicht';
goTo(firstShot, true);
if (params.has('shot') || reduceMotion) { const f = goal; railMat.color.copy(f.color); railMat.metalness = f.metalness; railMat.roughness = f.roughness; railMat.clearcoat = f.clearcoat; }

/* ---------- Loop: render only when something changes ---------- */
let visible = true, ready = false;
new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) dirty = 4; }).observe(viewer);
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (!visible && ready) return;
  if (tween) {
    tween.t = Math.min(1, tween.t + dt / tween.dur);
    const e = ease(tween.t), f = tween.from, to = tween.to;
    cam.pos.lerpVectors(f.pos, to.pos, e);
    cam.look.lerpVectors(f.look, to.look, e);
    cam.fov = lerp(f.fov, to.fov, e);
    cam.ap = lerp(f.ap, to.ap, e);
    if (tween.t >= 1) tween = null;
    dirty = Math.max(dirty, 2);
  }
  if (stepFinish(dt)) dirty = Math.max(dirty, 2);
  const msx = mouse.sx, msy = mouse.sy;
  mouse.sx += (mouse.x - mouse.sx) * (1 - Math.exp(-dt * 2.5));
  mouse.sy += (mouse.y - mouse.sy) * (1 - Math.exp(-dt * 2.5));
  if (Math.abs(mouse.sx - msx) + Math.abs(mouse.sy - msy) > 1e-4) dirty = Math.max(dirty, 1);
  if (dirty <= 0 && ready) return;
  dirty--;

  if (Math.abs(camera.fov - cam.fov) > 1e-3) { camera.fov = cam.fov; camera.updateProjectionMatrix(); }
  camera.position.copy(cam.pos);
  camera.lookAt(cam.look);
  const d = cam.pos.distanceTo(cam.look), amp = 0.025 * Math.min(1, d / 1.5);
  camera.translateX(mouse.sx * amp);
  camera.translateY(-mouse.sy * amp);
  camera.lookAt(cam.look);
  updateLabels(current === 'profiel' && !tween);

  if (composer) {
    bokeh.uniforms.focus.value = camera.position.distanceTo(cam.look);
    bokeh.uniforms.aperture.value = 0.0022 * cam.ap;
    composer.render(dt);
  } else renderer.render(scene, camera);
  if (!ready) {
    ready = true;
    requestAnimationFrame(() => viewer.classList.add('is-ready'));
  }
});
