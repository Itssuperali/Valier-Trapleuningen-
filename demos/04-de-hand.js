// Demo 04 — De Hand: macro, de camera glijdt over de handlijst zoals een hand dat doet.
import { createStage, createScroll, createRig, createChapters, setEnvIntensity, THREE, v3, lerp, range, smooth } from './lib/core.js';
import { createMaterials, straightStair, wallRail, plane } from './lib/stair.js';

const { scene, camera, onFrame } = createStage({ background: '#121110', fog: [0.4, 4], exposure: 1.1 });
const M = createMaterials();
// A stair between two walls (closed stairwell), wall-mounted handrail on the left wall
const st = straightStair(M, { treadMat: M.oakSmoked, metal: M.steel, infill: 'none', rail: false, stringers: 'none' });
scene.add(st.group);
const railMat = M.rvs.clone();
railMat.color.set(0xb9bcbf);
const wr = wallRail(M, st, { mat: railMat, bracketMat: M.steel, spacing: 0.8 });
scene.add(wr.group);

const wallMat = new THREE.MeshStandardMaterial({ color: 0x3b3833, roughness: 0.92 });
const wallL = plane(30, 12, wallMat); wallL.position.set(st.L / 2, 6, -st.W / 2); scene.add(wallL);
const wallR = plane(30, 12, wallMat); wallR.rotation.y = Math.PI; wallR.position.set(st.L / 2, 6, st.W / 2 + 0.001); scene.add(wallR);
const floor = plane(30, 30, M.concrete); floor.rotation.x = -Math.PI / 2; scene.add(floor);
// risers close the stair
for (let i = 0; i < st.N; i++) {
  const r = new THREE.Mesh(new THREE.BoxGeometry(0.02, st.rise, st.W), M.plasterDark);
  r.position.set(i * st.run - 0.03, i * st.rise + st.rise / 2 - 0.02, 0);
  r.receiveShadow = true;
  scene.add(r);
}

// Raking light grazing the wall and the brushed rail
scene.add(new THREE.HemisphereLight(0xfff2e2, 0x0c0b0a, 0.3));
const key = new THREE.SpotLight(0xffe7c8, 120, 14, 0.55, 0.8, 1.4);
key.position.set(st.L + 0.6, st.H + 2.4, 0.2);
key.target.position.set(st.L * 0.3, st.H * 0.4, -st.W / 2);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.bias = -0.0002;
scene.add(key, key.target);
const low = new THREE.PointLight(0xffc98f, 3, 4, 2);
low.position.set(0.4, 1.5, 0.3);
scene.add(low);
setEnvIntensity(scene, 0.9);
railMat.envMapIntensity = 0.6;

// Camera — very close to the rail
const C = u => wr.curve.getPointAt(u);
const b = wr.brackets[Math.floor(wr.brackets.length / 2)].userData.top;
const keys = [
  { t: 0.0, pos: C(0.05).add(v3(-0.16, 0.09, 0.26)), look: C(0.12), fov: 30 },
  { t: 0.2, pos: C(0.24).add(v3(-0.05, 0.045, 0.1)), look: C(0.32), fov: 24 },
  { t: 0.36, pos: C(0.4).add(v3(-0.03, 0.05, 0.1)), look: C(0.47), fov: 24 },
  { t: 0.5, pos: b.clone().add(v3(-0.16, -0.11, 0.22)), look: b.clone().add(v3(0, -0.05, -0.02)), fov: 28 },
  { t: 0.7, pos: C(0.9).add(v3(-0.22, 0.07, 0.17)), look: C(0.985), fov: 28 },
  { t: 0.86, pos: v3(-1.7, 1.25, 0.15), look: v3(st.L * 0.6, st.H * 0.62, -0.2), fov: 38 },
  { t: 1.0, pos: v3(-2.3, 1.35, 0.1), look: v3(st.L * 0.55, st.H * 0.56, -0.2), fov: 40 }
];
const rig = createRig(keys, { sway: 0.015 });
const scroll = createScroll();
const chapters = createChapters();

const hud = document.querySelector('.hud');
hud.innerHTML = '<div>Positie<b data-pos>0 mm</b></div><div>Profiel<b>Ø 42,4 mm</b></div><div>Houders<b data-br>0 / ' + wr.brackets.length + '</b></div>';
const hudPos = hud.querySelector('[data-pos]'), hudBr = hud.querySelector('[data-br]');
const railLen = wr.curve.getLength() * 1000;

onFrame((dt, t) => {
  const p = scroll.update(dt);
  rig.apply(camera, p, dt, t);
  chapters(p);
  // open up the fog for the final wide shot
  scene.fog.far = lerp(4, 16, smooth(range(p, 0.72, 0.9)));
  const along = smooth(range(p, 0.02, 0.72));
  hudPos.textContent = Math.round(along * railLen).toLocaleString('nl-NL') + ' mm';
  hudBr.textContent = Math.min(wr.brackets.length, Math.floor(along * wr.brackets.length + 0.4)) + ' / ' + wr.brackets.length;
});
