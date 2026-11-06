// Demo 01 — De Afdaling: de camera daalt langs de leuning van boven naar beneden.
import { createStage, createScroll, createRig, createChapters, setEnvIntensity, THREE, v3 } from './lib/core.js';
import { createMaterials, straightStair, plane, box } from './lib/stair.js';

const { scene, camera, onFrame } = createStage({ background: '#0b0a09', fog: [7, 17], exposure: 1.05 });
const M = createMaterials();
const st = straightStair(M, { treadMat: M.oak, metal: M.steel, infill: 'rods', stringers: 'open' });
scene.add(st.group);

// Architecture
const floor = plane(30, 30, M.concrete); floor.rotation.x = -Math.PI / 2; scene.add(floor);
const wall = plane(30, 12, M.plasterDark); wall.position.set(st.L / 2, 6, -st.W / 2 - 0.001); scene.add(wall);
const landing = box(5, 0.22, 3.4, M.concrete); landing.position.set(st.L + 2.5, st.H - 0.11, 1.2); scene.add(landing);
const landingFloor = box(5, 0.02, 3.4, M.oak); landingFloor.position.set(st.L + 2.5, st.H + 0.01, 1.2); scene.add(landingFloor);

// Light: warm skylight raking down the stair
scene.add(new THREE.HemisphereLight(0xfff1e0, 0x0a0908, 0.25));
const sun = new THREE.DirectionalLight(0xffdcb0, 2.6);
sun.position.set(st.L + 2, st.H + 6, 3.5);
sun.target.position.set(st.L / 2, st.H / 2, 0);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 20 });
sun.shadow.bias = -0.0004;
scene.add(sun, sun.target);
const rim = new THREE.PointLight(0xffb070, 6, 6, 2);
rim.position.set(-0.6, 1.2, 1.4);
scene.add(rim);
setEnvIntensity(scene, 0.35);

// Camera choreography — keyframes derived from the rail itself
const R = u => st.railPoint(u);
const keys = [
  { t: 0.0, pos: R(0.99).add(v3(1.5, 1.25, 1.5)), look: R(0.78), fov: 38 },
  { t: 0.2, pos: R(0.88).add(v3(0.35, 0.32, 0.55)), look: R(0.62), fov: 34 },
  { t: 0.42, pos: R(0.62).add(v3(0.08, 0.13, 0.2)), look: R(0.4), fov: 30 },
  { t: 0.62, pos: R(0.38).add(v3(-0.1, 0.02, 0.95)), look: R(0.26).add(v3(0, -0.35, 0)), fov: 32 },
  { t: 0.82, pos: v3(-2.0, 0.95, 3.4), look: v3(st.L * 0.5, st.H * 0.45, 0), fov: 36 },
  { t: 1.0, pos: v3(-2.6, 1.25, 4.6), look: v3(st.L * 0.52, st.H * 0.5, 0), fov: 36 }
];
const rig = createRig(keys, { sway: 0.05 });
const scroll = createScroll();
const chapters = createChapters();

onFrame((dt, t) => {
  const p = scroll.update(dt);
  rig.apply(camera, p, dt, t);
  chapters(p);
});
