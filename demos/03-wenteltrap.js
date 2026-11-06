// Demo 03 — Wenteltrap: de camera cirkelt langs de messing spiraal naar beneden en kijkt dan omhoog.
import { createStage, createScroll, createRig, createChapters, setEnvIntensity, THREE, v3 } from './lib/core.js';
import { createMaterials, spiralStair, plane } from './lib/stair.js';

const { scene, camera, onFrame } = createStage({ background: '#090908', fog: [6, 16], exposure: 1.1 });
const M = createMaterials();
const sp = spiralStair(M, { steps: 18, treadMat: M.oakSmoked, metal: M.steel, railMat: M.brass });
scene.add(sp.group);
const H = sp.H;

// Floor and upper slab with a round opening
const floor = plane(40, 40, M.concrete); floor.rotation.x = -Math.PI / 2; scene.add(floor);
const slabShape = new THREE.Shape();
slabShape.moveTo(-6, -6); slabShape.lineTo(6, -6); slabShape.lineTo(6, 6); slabShape.lineTo(-6, 6); slabShape.lineTo(-6, -6);
const hole = new THREE.Path(); hole.absarc(0, 0, 2.45, 0, Math.PI * 2, true);
slabShape.holes.push(hole);
const slabGeo = new THREE.ExtrudeGeometry(slabShape, { depth: 0.25, bevelEnabled: false, curveSegments: 64 });
slabGeo.rotateX(Math.PI / 2);
const slab = new THREE.Mesh(slabGeo, M.plasterDark);
slab.position.y = H + 0.001;
slab.castShadow = slab.receiveShadow = true;
scene.add(slab);

// Light falls through the opening
scene.add(new THREE.HemisphereLight(0xfff0dc, 0x0a0908, 0.18));
const key = new THREE.SpotLight(0xffe2b8, 220, 22, 0.5, 0.7, 1.6);
key.position.set(0.6, H + 6, 0.4);
key.target.position.set(0, 0, 0);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.bias = -0.0003;
scene.add(key, key.target);
const fill = new THREE.PointLight(0xffb878, 4, 7, 2);
fill.position.set(2.2, 1.0, 1.8);
scene.add(fill);
setEnvIntensity(scene, 0.45);

// Camera: top-down → orbit down around the spiral → look up from below
const keys = [{ t: 0, pos: v3(0.35, H + 6.2, 0.35), look: v3(0, 0, 0), fov: 34 }];
const orbit = 7;
for (let i = 0; i <= orbit; i++) {
  const f = i / orbit;
  const a = 0.6 - f * Math.PI * 2.6;
  const r = 1.8 + 1.1 * Math.min(1, f / 0.55);
  keys.push({
    t: 0.12 + f * 0.7,
    pos: v3(r * Math.cos(a), H + 0.9 - f * (H + 0.2), -r * Math.sin(a)),
    look: v3(0, H * 0.75 - f * H * 0.5, 0),
    fov: 36
  });
}
keys.push({ t: 0.9, pos: v3(0.62, 0.45, 0.62), look: v3(0, H + 3, 0), fov: 46 });
keys.push({ t: 1.0, pos: v3(0.42, 0.3, 0.42), look: v3(-0.05, H + 3, -0.05), fov: 52 });
const rig = createRig(keys, { sway: 0.06 });
const scroll = createScroll();
const chapters = createChapters();

onFrame((dt, t) => {
  const p = scroll.update(dt);
  rig.apply(camera, p, dt, t);
  chapters(p);
});
