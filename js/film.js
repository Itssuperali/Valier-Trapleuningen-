/* =========================================================
   VALIER — productfilm: de leuning in de hoofdrol
   Vierkant profiel 40×40, vierkante wandhouders, segmenten om de hoek.
   Scroll stuurt de camera; scherptediepte houdt de leuning scherp.
   ========================================================= */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const film = document.querySelector('.film');
const canvas = film.querySelector('.film__canvas');
const params = new URLSearchParams(location.search);
const forced = params.has('p') ? Math.min(1, Math.max(0, parseFloat(params.get('p')))) : null;
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
  film.classList.add('no-webgl');
  document.documentElement.classList.add('film-ready');
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

const finishes = {
  zwart: { color: new THREE.Color(0x141414), metalness: 0.3, roughness: 0.5, clearcoat: 0.3 },
  goud: { color: new THREE.Color(0xb39563), metalness: 0.85, roughness: 0.34, clearcoat: 0.2 },
  antraciet: { color: new THREE.Color(0x3b3d3f), metalness: 0.35, roughness: 0.48, clearcoat: 0.25 },
  wit: { color: new THREE.Color(0xeeece7), metalness: 0.05, roughness: 0.45, clearcoat: 0.2 }
};

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

/** A straight rail segment (square 40×40 profile) from a to b; one face parallel to the wall. */
const PROFILE = 0.04;
function railSegment(a, b, wallNormal) {
  const len = a.distanceTo(b);
  const bev = 0.0016;
  const g = new THREE.ExtrudeGeometry(roundedRect(PROFILE - 2 * bev, PROFILE - 2 * bev, 0.0035), {
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
    const cap = roundedBox(PROFILE + 0.0008, PROFILE + 0.0008, 0.0024, 0.0035, railMat);
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

// Rails
const railYA = x => rise + slope * (x - x0) + 0.9;
const railYB = z => top2(0) + slope * (z - W) + 0.9;
const A0 = v3(-0.05, railYA(-0.05), OFF), A1 = v3(Xc - 0.11, railYA(Xc - 0.11), OFF);
const B0 = v3(Xc - OFF, railYB(0.11), 0.11), B1 = v3(Xc - OFF, railYB(2.6), 2.6);
const railA = railSegment(A0, A1, v3(0, 0, 1));
const railB = railSegment(B0, B1, v3(-1, 0, 0));
scene.add(railA, railB);
const dirA = A1.clone().sub(A0).normalize();
const RA = u => A0.clone().lerp(A1, u);

const brackets = [];
for (const u of [0.1, 0.5, 0.9]) {
  const p = RA(u), b = bracket(ang);
  b.position.set(p.x, p.y, 0);
  scene.add(b); brackets.push(b);
}
for (const u of [0.15, 0.85]) {
  const p = B0.clone().lerp(B1, u), b = bracket(ang);
  b.rotation.y = -Math.PI / 2;
  b.position.set(Xc, p.y, p.z);
  scene.add(b); brackets.push(b);
}
const hero = brackets[1];

/* ---------- Light: warm, raking along the wall ---------- */
scene.add(new THREE.HemisphereLight(0xfff1df, 0x2a2018, 0.18));
const key = new THREE.SpotLight(0xffdcb2, 75, 16, 0.5, 0.85, 1.3);
key.position.set(-0.5, 5.0, 1.25);
key.target.position.set(2.0, 2.4, 0);
key.castShadow = true;
key.shadow.mapSize.set(light ? 1024 : 2048, light ? 1024 : 2048);
key.shadow.bias = -0.0002;
key.shadow.normalBias = 0.01;
scene.add(key, key.target);
const fill = new THREE.PointLight(0xffc690, 1.4, 6, 2);
fill.position.set(Xc - 0.6, 3.6, 1.6);
scene.add(fill);

/* ---------- Camera choreography ---------- */
const BK = hero.position.clone();
const keys = [
  { t: 0.0, pos: RA(0.45).add(v3(-0.38, -0.22, 0.95)), look: RA(0.45).add(v3(-0.15, 0.12, 0)), fov: 30, ap: 0.5 },
  { t: 0.15, pos: RA(0.4).add(v3(-0.3, -0.2, 0.8)), look: RA(0.42).add(v3(-0.16, 0.15, 0)), fov: 30, ap: 0.5 },
  { t: 0.3, pos: A0.clone().addScaledVector(dirA, -0.3).add(v3(0.015, 0.03, 0.06)), look: A0.clone().addScaledVector(dirA, 0.04), fov: 26, ap: 1 },
  { t: 0.47, pos: BK.clone().add(v3(-0.17, -0.2, 0.3)), look: BK.clone().add(v3(0, -0.06, 0.035)), fov: 28, ap: 1 },
  { t: 0.63, pos: v3(Xc - 0.8, 3.5, 1.15), look: v3(Xc - 0.1, 3.22, 0.18), fov: 34, ap: 0.5 },
  { t: 0.8, pos: RA(0.64).add(v3(-0.28, 0.1, 0.58)), look: RA(0.6).add(v3(0.04, -0.03, 0)), fov: 30, ap: 0.5 },
  { t: 1.0, pos: v3(-1.7, 1.55, 4.7), look: v3(1.9, 1.95, 0.5), fov: 38, ap: 0.15 }
];
const P = new THREE.CatmullRomCurve3(keys.map(k => k.pos), false, 'centripetal');
const T = new THREE.CatmullRomCurve3(keys.map(k => k.look), false, 'centripetal');
const pos = new THREE.Vector3(), look = new THREE.Vector3();
const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
addEventListener('pointermove', e => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; });
function placeCamera(p, dt, t) {
  let i = 0;
  while (i < keys.length - 2 && p > keys[i + 1].t) i++;
  const k0 = keys[i], k1 = keys[i + 1];
  const local = clamp((p - k0.t) / (k1.t - k0.t));
  const e = lerp(local, smooth(local), 0.6);
  const u = (i + e) / (keys.length - 1);
  P.getPoint(u, pos); T.getPoint(u, look);
  // portrait hero: aim lower so the rail rises through the top half, clear of the headline
  if (camera.aspect < 1) look.y -= 0.3 * (1 - smooth(range(p, 0.12, 0.24)));
  // portrait screens: step back so the rail stays in frame
  if (camera.aspect < 1.25) pos.sub(look).multiplyScalar(Math.pow(Math.min(2.2, 1.25 / camera.aspect), 0.85)).add(look);
  const fov = lerp(k0.fov, k1.fov, smooth(local));
  if (Math.abs(camera.fov - fov) > 1e-3) { camera.fov = fov; camera.updateProjectionMatrix(); }
  camera.position.copy(pos);
  camera.lookAt(look);
  mouse.sx += (mouse.x - mouse.sx) * (1 - Math.exp(-dt * 2));
  mouse.sy += (mouse.y - mouse.sy) * (1 - Math.exp(-dt * 2));
  const d = pos.distanceTo(look), amp = 0.03 * Math.min(1, d / 1.5);
  camera.translateX(mouse.sx * amp + Math.sin(t * 0.5) * amp * 0.12);
  camera.translateY(-mouse.sy * amp + Math.sin(t * 0.7) * amp * 0.1);
  camera.lookAt(look);
  return { focus: camera.position.distanceTo(look), ap: lerp(k0.ap, k1.ap, smooth(local)) };
}

/* ---------- Post-processing: depth of field ---------- */
let composer = null, bokeh = null;
if (!light) {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bokeh = new BokehPass(scene, camera, { focus: 1, aperture: 0.003, maxblur: 0.006 });
  composer.addPass(bokeh);
  composer.addPass(new OutputPass());
}
function resize() {
  const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // portrait: shift the picture up so the rail sits above the text block
  if (camera.aspect < 1) camera.setViewOffset(w, h, 0, h * 0.2, w, h); else camera.clearViewOffset();
  camera.updateProjectionMatrix();
  if (composer) {
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(w, h);
    bokeh.uniforms.aspect.value = camera.aspect;
  }
}
addEventListener('resize', resize);
resize();

/* ---------- Overlays: chapters, labels, finishes ---------- */
const chapters = [...film.querySelectorAll('.chapter')].map(el => ({ el, from: +el.dataset.from, to: +el.dataset.to }));
const bar = film.querySelector('.film__progress i');
function updateChapters(p) {
  for (const c of chapters) {
    const fi = c.from <= 0 ? 1 : smooth(range(p, c.from, c.from + 0.04));
    const fo = c.to >= 1 ? 0 : smooth(range(p, c.to - 0.04, c.to));
    const o = fi * (1 - fo);
    c.el.style.opacity = o.toFixed(3);
    c.el.style.transform = `translate3d(0, ${((1 - fi) * 24 - fo * 24).toFixed(1)}px, 0)`;
    c.el.style.visibility = o < 0.002 ? 'hidden' : 'visible';
    c.el.style.pointerEvents = o > 0.6 ? 'auto' : 'none';
  }
  if (bar) bar.style.transform = `scaleY(${p.toFixed(4)})`;
}

const yA = new THREE.Vector3().crossVectors(dirA, v3(0, 0, 1));
const labels = [
  { el: film.querySelector('[data-label="w"]'), pt: A0.clone().addScaledVector(yA, 0.034), from: 0.22, to: 0.37 },
  { el: film.querySelector('[data-label="h"]'), pt: A0.clone().add(v3(0, 0, 0.034)), from: 0.22, to: 0.37 }
];
const _p = new THREE.Vector3();
function updateLabels(p) {
  for (const l of labels) {
    if (!l.el) continue;
    _p.copy(l.pt).project(camera);
    const o = smooth(range(p, l.from, l.from + 0.04)) * (1 - smooth(range(p, l.to - 0.04, l.to)));
    l.el.style.opacity = (_p.z < 1 ? o : 0).toFixed(3);
    l.el.style.transform = `translate3d(${((_p.x * 0.5 + 0.5) * canvas.clientWidth).toFixed(1)}px, ${((-_p.y * 0.5 + 0.5) * canvas.clientHeight).toFixed(1)}px, 0)`;
  }
}

// Finish: automatic tour while scrolling, or the visitor's own choice
let chosen = null;
const finishButtons = [...film.querySelectorAll('[data-finish]')];
finishButtons.forEach(b => b.addEventListener('click', () => { chosen = b.dataset.finish; }));
const tmpC = new THREE.Color();
function finishFor(p) {
  if (chosen) return finishes[chosen];
  if (p < 0.75 || p > 0.93) return finishes.zwart;
  if (p < 0.82) return finishes.goud;
  if (p < 0.88) return finishes.antraciet;
  return finishes.zwart;
}
function updateFinish(p, dt) {
  const f = finishFor(p);
  const k = forced !== null ? 1 : 1 - Math.exp(-dt * 4);
  railMat.color.lerp(f.color, k);
  railMat.metalness = lerp(railMat.metalness, f.metalness, k);
  railMat.roughness = lerp(railMat.roughness, f.roughness, k);
  railMat.clearcoat = lerp(railMat.clearcoat, f.clearcoat, k);
  const name = Object.keys(finishes).find(n => finishes[n] === f);
  finishButtons.forEach(b => b.classList.toggle('is-active', b.dataset.finish === name));
}

// Bracket "explodes" so the fixing is visible
function updateBracket(p) {
  const e = smooth(range(p, 0.4, 0.47)) * (1 - smooth(range(p, 0.53, 0.58)));
  hero.userData.screws.forEach((s, i) => {
    s.position.copy(s.userData.home);
    s.position.z += e * 0.055;
    s.rotation.y = e * (i ? -3 : 3);
  });
  hero.userData.plate.position.z = 0.003 + e * 0.012;
}

/* ---------- Progress & loop ---------- */
let target = forced ?? 0, value = target;
function readScroll() {
  if (forced !== null) return;
  const r = film.getBoundingClientRect();
  target = clamp(-r.top / Math.max(1, r.height - innerHeight));
}
addEventListener('scroll', readScroll, { passive: true });
readScroll(); value = target;

let visible = true;
new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { rootMargin: '100px' }).observe(film);

const clock = new THREE.Clock();
let ready = false;
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (!visible && ready) return;
  readScroll();
  value = forced !== null ? forced : value + (target - value) * (1 - Math.exp(-dt * 4));
  const p = value;
  const { focus, ap } = placeCamera(p, dt, clock.elapsedTime);
  updateFinish(p, dt);
  updateBracket(p);
  updateChapters(p);
  updateLabels(p);
  if (composer) {
    bokeh.uniforms.focus.value = focus;
    bokeh.uniforms.aperture.value = 0.0025 * ap;
    composer.render(dt);
  } else {
    renderer.render(scene, camera);
  }
  if (!ready) {
    ready = true;
    requestAnimationFrame(() => document.documentElement.classList.add('film-ready'));
  }
});
