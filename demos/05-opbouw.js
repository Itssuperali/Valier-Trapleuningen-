// Demo 05 — Opbouw: de trap bouwt zichzelf op terwijl u scrolt.
import { createStage, createScroll, createRig, createChapters, setEnvIntensity, THREE, v3, range, smooth, clamp } from './lib/core.js';
import { createMaterials, straightStair, addEdges } from './lib/stair.js';

const BG = '#e9e5de';
const { scene, camera, onFrame } = createStage({ background: BG, exposure: 1.0 });
const M = createMaterials();
const st = straightStair(M, { treadMat: M.oak, metal: M.steel, infill: 'rods', stringers: 'both' });
scene.add(st.group);

// Ghost outline of the finished stair
const ghost = straightStair(M, { treadMat: M.hidden, metal: M.hidden, infill: 'rods', stringers: 'both' });
ghost.group.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
const edges = addEdges(ghost.group, { color: 0x2a2620, opacity: 0.16, threshold: 30 });
scene.add(ghost.group);

// Studio floor that only shows shadows
const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.16 }));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

scene.add(new THREE.HemisphereLight(0xffffff, 0xd9d2c6, 1.3));
const sun = new THREE.DirectionalLight(0xfff6ea, 2.2);
sun.position.set(-3, 9, 6);
sun.target.position.set(st.L / 2, 0, 0);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 25 });
sun.shadow.radius = 6;
sun.shadow.bias = -0.0004;
scene.add(sun, sun.target);
setEnvIntensity(scene, 0.85);

// Assembly timeline (progress ranges)
const P = st.parts;
const rods = P.infill.children;
function assemble(p) {
  const s = smooth(range(p, 0.12, 0.27));
  P.stringers.forEach((m, i) => {
    const e = smooth(range(p, 0.12 + i * 0.03, 0.25 + i * 0.03));
    m.scale.x = Math.max(e, 1e-4);
    m.visible = e > 0.001;
  });
  P.treads.forEach((m, i) => {
    const a = 0.3 + (i / st.N) * 0.11;
    const e = smooth(range(p, a, a + 0.05));
    m.position.copy(m.userData.home);
    m.position.y += (1 - e) * 1.6;
    m.rotation.x = (1 - e) * 0.5;
    m.visible = e > 0.001;
  });
  P.posts.forEach((m, i) => {
    const e = smooth(range(p, 0.48 + i * 0.03, 0.56 + i * 0.03));
    m.scale.y = Math.max(e, 1e-4);
    m.visible = e > 0.001;
  });
  rods.forEach((m, i) => {
    const a = 0.62 + (i / rods.length) * 0.09;
    const e = smooth(range(p, a, a + 0.03));
    m.scale.y = Math.max(e, 1e-4);
    m.visible = e > 0.001;
  });
  const r = smooth(range(p, 0.76, 0.87));
  P.rail.position.x = -(1 - r) * 7;
  P.rail.visible = r > 0.001;
  edges.mat.opacity = 0.16 * (1 - smooth(range(p, 0.86, 0.95)));
  return s;
}

const c = v3(st.L / 2, st.H / 2, 0);
const at = (x, y, z) => c.clone().add(v3(x * 1.3, y * 1.2, z * 1.3));
const keys = [
  { t: 0.0, pos: at(-4.6, 2.6, 7.0), look: c, fov: 32 },
  { t: 0.2, pos: at(-2.6, 0.6, 5.0), look: c.clone().add(v3(-0.4, -0.6, 0)), fov: 34 },
  { t: 0.38, pos: at(-1.2, 3.6, 4.6), look: c.clone().add(v3(0, -0.2, 0)), fov: 34 },
  { t: 0.53, pos: at(3.6, 1.4, 4.8), look: c, fov: 34 },
  { t: 0.67, pos: at(2.6, 1.0, 3.4), look: c.clone().add(v3(0.2, 0.3, 0.3)), fov: 34 },
  { t: 0.81, pos: at(-3.4, 1.6, 3.8), look: c.clone().add(v3(0, 0.5, 0.3)), fov: 34 },
  { t: 0.93, pos: at(-5.0, 2.2, 6.4), look: c, fov: 32 },
  { t: 1.0, pos: at(-5.4, 2.4, 7.0), look: c, fov: 32 }
];
const rig = createRig(keys, { sway: 0.04 });
const scroll = createScroll();
const chapters = createChapters();

onFrame((dt, t) => {
  const p = scroll.update(dt);
  assemble(p);
  rig.apply(camera, clamp(p), dt, t);
  chapters(p);
});
