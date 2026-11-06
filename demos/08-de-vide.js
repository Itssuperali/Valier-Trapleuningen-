// Demo 08 — De Vide: zwevende treden en glas. De camera duikt van de verdieping de vide in.
import { createStage, createScroll, createRig, createChapters, setEnvIntensity, THREE, v3 } from './lib/core.js';
import { createMaterials, straightStair, plane, box } from './lib/stair.js';

const { scene, camera, onFrame } = createStage({ background: '#dfd9cf', fog: [12, 30], exposure: 0.88 });
const M = createMaterials();
const clearGlass = M.glass.clone();
clearGlass.opacity = 0.1;
const wallMat = new THREE.MeshStandardMaterial({ color: 0xd9d2c7, roughness: 0.95 });
const st = straightStair(M, {
  treadMat: M.oak, treadThickness: 0.09, glassMat: clearGlass, stringers: 'none', infill: 'glass', panels: 3,
  railMat: M.rvs, railRadius: 0.0175, clampMat: M.rvs, metal: M.rvs
});
scene.add(st.group);
const { L, H, W } = st;

// Architecture: tall white wall, ground floor, upper floor with a glass balustrade along the void
const floor = plane(40, 40, M.concreteLight); floor.rotation.x = -Math.PI / 2; scene.add(floor);
const wall = plane(40, H * 2 + 2, wallMat); wall.position.set(L / 2, H + 1, -W / 2 - 0.001); scene.add(wall);
const slabD = 5.5;
const slab = box(6, 0.3, slabD, M.plaster); slab.position.set(L + 3, H - 0.15, -W / 2 + slabD / 2); scene.add(slab);
const upper = box(6, 0.015, slabD, M.concreteLight); upper.position.set(L + 3, H + 0.0075, -W / 2 + slabD / 2); scene.add(upper);
const sideWall = plane(slabD + 8, H * 2 + 2, wallMat); sideWall.rotation.y = -Math.PI / 2; sideWall.position.set(L + 6, H + 1, 2); scene.add(sideWall);

// Glass balustrade on the slab edge (x = L), continuing the stair's glass line
const gLen = slabD - W - 0.1;
const glass = new THREE.Mesh(new THREE.BoxGeometry(0.017, 0.95, gLen), clearGlass);
glass.position.set(L + 0.04, H + 0.475, W / 2 + 0.1 + gLen / 2);
glass.renderOrder = 2;
scene.add(glass);
const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0175, 0.0175, gLen + 0.05, 24), M.rvs);
cap.rotation.x = Math.PI / 2;
cap.position.set(L + 0.04, H + 0.95 + 0.0175, glass.position.z);
cap.castShadow = true;
scene.add(cap);

// Window light from the far end of the void
const win = new THREE.Mesh(new THREE.PlaneGeometry(6, H * 2), new THREE.MeshBasicMaterial({ color: 0xfffdf8 }));
win.rotation.y = Math.PI / 2;
win.position.set(-3.5, H, 2);
scene.add(win);

scene.add(new THREE.HemisphereLight(0xffffff, 0x8f8576, 0.55));
const sun = new THREE.DirectionalLight(0xfff0de, 3.0);
sun.position.set(-6, 9, 5);
sun.target.position.set(L / 2, H / 2, 0);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 30 });
sun.shadow.bias = -0.0004;
sun.shadow.radius = 4;
scene.add(sun, sun.target);
setEnvIntensity(scene, 0.6);
clearGlass.envMapIntensity = 1.4;

const keys = [
  { t: 0.0, pos: v3(L + 0.6, H + 1.55, 3.0), look: v3(L * 0.4, H * 0.2, 0.3), fov: 42 },
  { t: 0.18, pos: v3(L + 0.2, H + 1.3, 1.9), look: v3(L * 0.45, H * 0.35, 0), fov: 38 },
  { t: 0.42, pos: v3(L * 0.62, H * 0.95, 2.6), look: v3(L * 0.42, H * 0.5, 0), fov: 36 },
  { t: 0.62, pos: v3(L * 0.3, H * 0.38, 2.1), look: v3(L * 0.55, H * 0.55, 0), fov: 34 },
  { t: 0.82, pos: v3(-0.9, 0.45, 2.4), look: v3(L * 0.6, H * 0.95, 0), fov: 36 },
  { t: 1.0, pos: v3(-1.9, 1.25, 4.6), look: v3(L * 0.5, H * 0.6, 0), fov: 38 }
];
const rig = createRig(keys, { sway: 0.06 });
const scroll = createScroll();
const chapters = createChapters();

onFrame((dt, t) => {
  const p = scroll.update(dt);
  rig.apply(camera, p, dt, t);
  chapters(p);
});
