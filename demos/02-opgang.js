// Demo 02 — De Opgang: van beneden naar boven, het daglicht tegemoet.
import { createStage, createScroll, createRig, createChapters, setEnvIntensity, THREE, v3 } from './lib/core.js';
import { createMaterials, straightStair, plane, box } from './lib/stair.js';

const { scene, camera, onFrame } = createStage({ background: '#e4ded4', fog: [10, 26], exposure: 0.92 });
const M = createMaterials();
const st = straightStair(M, { treadMat: M.oakLight, metal: M.white, railMat: M.rvs, infill: 'bars', stringers: 'open', panels: 3 });
// RVS bars, white posts & stringer
st.parts.infill.children.forEach(m => (m.material = M.rvs));
scene.add(st.group);

const floor = plane(30, 30, M.floorOak); floor.rotation.x = -Math.PI / 2; scene.add(floor);
const wallMat = new THREE.MeshStandardMaterial({ color: 0xd8d1c6, roughness: 0.95 });
const wall = plane(30, 14, wallMat); wall.position.set(st.L / 2, 7, -st.W / 2 - 0.001); scene.add(wall);
const slab = box(6, 0.26, 4, wallMat); slab.position.set(st.L + 3, st.H - 0.13, 1.5); scene.add(slab);
const upper = box(6, 0.02, 4, M.floorOak); upper.position.set(st.L + 3, st.H + 0.01, 1.5); scene.add(upper);
const endWall = plane(8, 10, wallMat); endWall.rotation.y = -Math.PI / 2; endWall.position.set(st.L + 4.5, st.H + 2, 1.5); scene.add(endWall);
// window: bright opening in the end wall at the top
const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.2), new THREE.MeshBasicMaterial({ color: 0xfffbf2 }));
win.rotation.y = -Math.PI / 2; win.position.set(st.L + 4.49, st.H + 1.35, 1.2); scene.add(win);

scene.add(new THREE.HemisphereLight(0xfffaf0, 0x9c8f7c, 0.7));
const sun = new THREE.DirectionalLight(0xfff0dc, 2.6);
sun.position.set(st.L + 6, st.H + 5, 4);
sun.target.position.set(st.L * 0.4, st.H * 0.4, 0);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 25 });
sun.shadow.bias = -0.0004;
sun.shadow.radius = 4;
scene.add(sun, sun.target);
setEnvIntensity(scene, 0.9);

const R = u => st.railPoint(u);
const keys = [
  { t: 0.0, pos: v3(-1.9, 0.4, 1.5), look: R(0.42), fov: 38 },
  { t: 0.22, pos: R(0.14).add(v3(-0.25, 0.08, 0.38)), look: R(0.45), fov: 32 },
  { t: 0.45, pos: R(0.4).add(v3(-0.55, 0.32, 0.95)), look: R(0.72).add(v3(0, -0.25, 0)), fov: 34 },
  { t: 0.68, pos: R(0.74).add(v3(-0.35, 0.3, 0.7)), look: R(0.97), fov: 34 },
  { t: 0.86, pos: v3(st.L + 1.6, st.H + 1.62, 1.8), look: v3(st.L * 0.35, st.H * 0.35, 0.2), fov: 38 },
  { t: 1.0, pos: v3(st.L + 2.4, st.H + 1.7, 2.6), look: v3(st.L * 0.3, st.H * 0.3, 0), fov: 40 }
];
const rig = createRig(keys, { sway: 0.05 });
const scroll = createScroll();
const chapters = createChapters();

onFrame((dt, t) => {
  const p = scroll.update(dt);
  rig.apply(camera, p, dt, t);
  chapters(p);
});
