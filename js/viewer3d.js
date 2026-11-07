/* =========================================================
   VALIER — 3D-viewer: trap, leuningposities, gekozen leuningen.
   Draaien/zoomen (muis en touch), standpunten, klikken op posities.
   Rendert alleen als er iets verandert (zuinig op mobiel).
   ========================================================= */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildStair, looseSlots, DIM } from './stairs.js';
import { COLORS, PROFILE_FORMS } from './catalog.js';

const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const UP = v3(0, 1, 0);
const SIZES = Object.fromEntries(PROFILE_FORMS.flatMap(f => f.sizes.map(s => [s.id, { ...s, form: f.id }])));

export function createViewer(host, { onToggle } = {}) {
  const canvas = host.querySelector('canvas');
  const lowPower = matchMedia('(pointer: coarse), (max-width: 760px)').matches;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch {
    host.classList.add('no-webgl');
    return null;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, lowPower ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#ece7df');
  scene.fog = new THREE.Fog('#ece7df', 14, 30);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 100);
  const controls = new OrbitControls(camera, canvas);
  Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, minDistance: 1.2, maxDistance: 16, maxPolarAngle: Math.PI * 0.495, rotateSpeed: 0.7, screenSpacePanning: true });

  /* ---- light & floor ---- */
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8cfc2, 0.9));
  const sun = new THREE.DirectionalLight(0xfff4e6, 2.1);
  sun.position.set(4, 9, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(lowPower ? 1024 : 2048, lowPower ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 0.5, far: 30 });
  sun.shadow.bias = -0.0004;
  sun.shadow.radius = 4;
  scene.add(sun, sun.target);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0xe6e0d6, roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  /* ---- materials ---- */
  const wood = (() => {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#c9ab84'; g.fillRect(0, 0, 1024, 256);
    for (let i = 0; i < 260; i++) {
      const yy = Math.random() * 256, amp = 1 + Math.random() * 4, f = (1 + Math.floor(Math.random() * 3)) * Math.PI * 2 / 1024, ph = Math.random() * 6.28;
      g.strokeStyle = Math.random() < 0.6 ? '#a07f58' : '#dcc4a2'; g.globalAlpha = 0.05 + Math.random() * 0.14; g.lineWidth = 0.5 + Math.random() * 2;
      g.beginPath(); for (let x = 0; x <= 1024; x += 8) { const q = yy + Math.sin(x * f + ph) * amp; x ? g.lineTo(x, q) : g.moveTo(x, q); } g.stroke();
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.repeat.set(1, 1);
    return t;
  })();
  const powder = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'); const img = g.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) { const v = 205 + Math.random() * 50; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(12, 12);
    return t;
  })();
  const mats = {
    oak: new THREE.MeshStandardMaterial({ map: wood, roughness: 0.6, envMapIntensity: 0.5 }),
    white: new THREE.MeshStandardMaterial({ color: 0xf6f3ee, roughness: 0.7, envMapIntensity: 0.4 }),
    whiteDS: new THREE.MeshStandardMaterial({ color: 0xf6f3ee, roughness: 0.7, envMapIntensity: 0.4, side: THREE.DoubleSide }),
    wall: new THREE.MeshStandardMaterial({ color: 0xe9e3da, roughness: 0.95, envMapIntensity: 0.3 }),
    wallPanel: new THREE.MeshStandardMaterial({ color: 0xdcd4c8, roughness: 0.95, envMapIntensity: 0.3, side: THREE.DoubleSide, transparent: true, opacity: 0.55, depthWrite: false }),
    ghost: new THREE.MeshBasicMaterial({ color: 0x9a7b4f, transparent: true, opacity: 0.32, depthWrite: false }),
    ghostHover: new THREE.MeshStandardMaterial({ color: 0x9a7b4f, transparent: true, opacity: 0.6, roughness: 0.4, metalness: 0.3, depthWrite: false }),
    hit: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    screw: new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.6, roughness: 0.35 })
  };
  const railMats = new Map();
  const railMat = colorId => {
    if (!railMats.has(colorId)) {
      const c = COLORS.find(x => x.id === colorId) || COLORS[0];
      railMats.set(colorId, new THREE.MeshPhysicalMaterial({ color: c.hex, metalness: c.metalness, roughness: c.roughness, roughnessMap: powder, clearcoat: 0.25, clearcoatRoughness: 0.5, envMapIntensity: 0.9 }));
    }
    return railMats.get(colorId);
  };

  /* ---- geometry helpers ---- */
  function roundedRect(w, h, r) {
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  // frame for a rail: z along the rail, x towards the wall (horizontal), y "up" perpendicular
  function railFrame(t, out) {
    const z = t.clone().normalize();
    let x = out.clone().setY(0).normalize();
    let y = new THREE.Vector3().crossVectors(z, x);
    if (y.y < 0) { x.negate(); y.negate(); }
    return new THREE.Matrix4().makeBasis(x, y, z);
  }
  function railMesh(a, b, out, sizeId, mat) {
    const size = SIZES[sizeId] || SIZES['50x30'];
    const len = a.distanceTo(b), t = b.clone().sub(a);
    let geo;
    if (size.form === 'rond') {
      geo = new THREE.CylinderGeometry(size.d / 2000, size.d / 2000, len, 40, 1);
      geo.rotateX(Math.PI / 2); geo.translate(0, 0, len / 2);
    } else {
      const w = size.w / 1000, h = size.h / 1000, bev = 0.0015;
      geo = new THREE.ExtrudeGeometry(roundedRect(w - 2 * bev, h - 2 * bev, 0.003), { depth: len, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 6 });
    }
    const m = new THREE.Mesh(geo, mat);
    m.applyMatrix4(railFrame(t, out));
    m.position.copy(a);
    m.castShadow = m.receiveShadow = true;
    return m;
  }
  function bracket(railPt, t, out, halfH, mat) {
    // local frame: x along the rail (horizontal), y up, z from wall to rail
    const th = t.clone().setY(0); const hl = th.length();
    let hx = hl > 1e-4 ? th.normalize() : new THREE.Vector3().crossVectors(UP, out).normalize();
    const zAx = out.clone().setY(0).normalize().negate();
    if (new THREE.Vector3().crossVectors(hx, UP).dot(zAx) < 0) hx.negate();
    const ang = Math.atan2(t.clone().normalize().dot(UP), Math.max(1e-6, t.clone().setY(0).length() / t.length())) * Math.sign(hx.dot(t) || 1);
    const g = new THREE.Group();
    const drop = 0.098, bar = 0.015, OFF = DIM.off;
    const armY = -drop + 0.014;
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.066, 0.006), mat); plate.position.set(0, -drop, 0.003);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(bar, bar, OFF + bar / 2 - 0.006), mat); arm.position.set(0, armY, 0.006 + (OFF + bar / 2 - 0.006) / 2);
    const yTop = -halfH / Math.cos(ang) - 0.002;
    const up = new THREE.Mesh(new THREE.BoxGeometry(bar, Math.max(0.01, yTop - armY + bar / 2), bar), mat); up.position.set(0, (armY - bar / 2 + yTop) / 2, OFF);
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.003, 16), mats.screw); screw.rotation.x = Math.PI / 2; screw.position.set(0, -drop - 0.02, 0.007);
    [plate, arm, up, screw].forEach(m => { m.castShadow = true; g.add(m); });
    g.matrix.makeBasis(hx, UP, zAx);
    g.matrix.setPosition(railPt.clone().addScaledVector(out.clone().setY(0).normalize(), OFF));
    g.matrixAutoUpdate = false;
    return g;
  }
  function wallPanel(a, b, out) {
    const o = out.clone().setY(0).normalize().multiplyScalar(DIM.off + 0.004);
    const h = b.clone().sub(a).setY(0).normalize().multiplyScalar(0.1);
    const p0 = a.clone().add(o).sub(h), p1 = b.clone().add(o).add(h);
    const lo = 0.3, hi = 0.2; // a modest band of wall behind the rail, so the brackets sit on something
    const pts = [p0.clone().setY(p0.y - lo), p1.clone().setY(p1.y - lo), p1.clone().setY(p1.y + hi), p0.clone().setY(p0.y + hi)];
    const g = new THREE.BufferGeometry().setFromPoints([pts[0], pts[1], pts[2], pts[0], pts[2], pts[3]]);
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mats.wallPanel);
    m.renderOrder = -1;
    return m;
  }

  /* ---- state of the scene ---- */
  let stair = null, cands = [], mode = 'view', hover = null;
  const layers = { stair: new THREE.Group(), ghosts: new THREE.Group(), hits: new THREE.Group(), rails: new THREE.Group(), preview: new THREE.Group() };
  Object.values(layers).forEach(g => scene.add(g));
  const labelHost = host.querySelector('.v-labels');
  const tip = host.querySelector('.v-tip');
  let railLabels = [];
  let dirty = 30;
  const mark = (n = 30) => { dirty = Math.max(dirty, n); };

  const clear = g => { while (g.children.length) { const c = g.children.pop(); c.traverse?.(o => { if (o.geometry) o.geometry.dispose(); }); } };

  function setStair(type, dir, railCount = 1) {
    clear(layers.stair); clear(layers.ghosts); clear(layers.hits);
    if (type === 'los' || type === 'anders' || !type) {
      stair = null;
      cands = looseSlots(Math.max(1, railCount));
    } else {
      stair = buildStair(type, dir, mats);
      layers.stair.add(stair.group);
      cands = stair.cands;
    }
    for (const c of cands) {
      const len = c.a.distanceTo(c.b), mid = c.a.clone().add(c.b).multiplyScalar(0.5);
      const q = new THREE.Quaternion().setFromUnitVectors(UP, c.b.clone().sub(c.a).normalize());
      const ghost = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, len, 10), mats.ghost);
      ghost.quaternion.copy(q); ghost.position.copy(mid); ghost.userData.id = c.id;
      layers.ghosts.add(ghost);
      const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, len, 8), mats.hit);
      hit.quaternion.copy(q); hit.position.copy(mid); hit.userData.id = c.id;
      layers.hits.add(hit);
    }
    layers.ghosts.visible = mode === 'positions';
    frame();
    mark(60);
    return cands;
  }

  let lastRails = [];
  function setRails(list) {
    // list: [{ pos, nr, lengthMm, size, color }]
    lastRails = list;
    clear(layers.rails);
    railLabels.forEach(l => l.el.remove());
    railLabels = [];
    for (const r of list) {
      const c = cands.find(x => x.id === r.pos);
      if (!c) continue;
      const def = c.a.distanceTo(c.b);
      const len = r.lengthMm ? Math.max(0.2, Math.min(def * 1.8, r.lengthMm / 1000)) : def;
      const t = c.b.clone().sub(c.a).normalize(), mid = c.a.clone().add(c.b).multiplyScalar(0.5);
      const a = mid.clone().addScaledVector(t, -len / 2), b = mid.clone().addScaledVector(t, len / 2);
      const mat = railMat(r.color);
      const size = SIZES[r.size] || SIZES['50x30'];
      const halfH = size.form === 'rond' ? size.d / 2000 : size.h / 2000;
      layers.rails.add(wallPanel(a, b, c.out));
      layers.rails.add(railMesh(a, b, c.out, r.size, mat));
      const n = len < 0.7 ? 1 : Math.max(2, Math.round(len / 0.95) + 1);
      for (let i = 0; i < n; i++) {
        const u = n === 1 ? 0.5 : 0.12 + (0.76 * i) / (n - 1);
        layers.rails.add(bracket(a.clone().lerp(b, u), t, c.out, halfH, mat));
      }
      const el = document.createElement('span');
      el.className = 'v-num';
      el.textContent = r.nr;
      labelHost.appendChild(el);
      railLabels.push({ el, pt: mid.clone().add(v3(0, 0.16, 0)) });
    }
    mark(30);
  }

  function setMode(m) {
    mode = m;
    layers.ghosts.visible = m === 'positions';
    if (m !== 'positions') setHover(null);
    canvas.style.cursor = '';
    mark(10);
  }

  function setHover(id) {
    if (hover === id) return;
    hover = id;
    clear(layers.preview);
    if (id) {
      const c = cands.find(x => x.id === id);
      if (c && !lastRails.some(r => r.pos === id)) layers.preview.add(railMesh(c.a, c.b, c.out, lastRails[0]?.size || '50x30', mats.ghostHover));
      layers.ghosts.children.forEach(g => (g.material = g.userData.id === id ? mats.ghostHover : mats.ghost));
    } else layers.ghosts.children.forEach(g => (g.material = mats.ghost));
    host.classList.toggle('is-hovering', !!id);
    mark(4);
  }

  /* ---- camera framing & views ---- */
  let tween = null;
  const views = {
    perspectief: () => v3(1.0, 0.72, 1.15),
    boven: () => v3(0.0001, 1, 0.0001),
    zij: () => v3(1, 0.18, 0.0001)
  };
  let currentView = 'perspectief';
  function fitDistance(box) {
    // keep the whole model in view: bounding sphere against the narrowest field of view
    const r = box.getBoundingSphere(new THREE.Sphere()).radius;
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    return (r / Math.sin(Math.min(vfov, hfov) / 2)) * (camera.aspect < 1.3 ? 1.14 : 1.02);
  }
  function targetBox() {
    if (stair) return stair.bbox.clone().expandByScalar(0.1).union(new THREE.Box3().setFromCenterAndSize(stair.bbox.getCenter(v3()), v3(0, stair.topY + 0.9, 0)));
    const box = new THREE.Box3();
    cands.forEach(c => box.expandByPoint(c.a).expandByPoint(c.b));
    return box.expandByScalar(0.6);
  }
  function view(name, instant = false) {
    currentView = name;
    const box = targetBox();
    const center = box.getCenter(v3());
    if (!stair) center.z = 0.4;
    const dir = (stair ? views[name]() : v3(0.0001, 0.18, 1)).normalize();
    const dist = fitDistance(box);
    const to = { pos: center.clone().addScaledVector(dir, dist), target: center };
    if (instant) { camera.position.copy(to.pos); controls.target.copy(to.target); controls.update(); tween = null; }
    else tween = { from: { pos: camera.position.clone(), target: controls.target.clone() }, to, t: 0 };
    host.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('is-active', b.dataset.view === name));
    mark(60);
  }
  function frame() { view(currentView, !camera.userData.framed); camera.userData.framed = true; }

  /* ---- picking ---- */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pick = e => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(layers.hits.children, false)[0];
    return hit ? hit.object.userData.id : null;
  };
  let down = null;
  canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointermove', e => {
    if (mode !== 'positions' || e.pointerType === 'touch') return;
    const id = pick(e);
    setHover(id);
    canvas.style.cursor = id ? 'pointer' : 'grab';
    if (tip) {
      const c = id && cands.find(x => x.id === id);
      tip.hidden = !c;
      if (c) {
        const r = host.getBoundingClientRect();
        tip.textContent = (lastRails.some(x => x.pos === id) ? 'Verwijder: ' : 'Voeg toe: ') + c.label;
        tip.style.transform = `translate(${e.clientX - r.left + 14}px, ${e.clientY - r.top + 14}px)`;
      }
    }
  });
  canvas.addEventListener('pointerleave', () => { setHover(null); if (tip) tip.hidden = true; });
  canvas.addEventListener('pointerup', e => {
    if (!down || mode !== 'positions') return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    down = null;
    if (moved > 6) return;
    const id = pick(e);
    if (id && onToggle) onToggle(id);
  });
  controls.addEventListener('start', () => { tween = null; });
  controls.addEventListener('change', () => mark(2));
  host.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => view(b.dataset.view)));

  /* ---- size & loop ---- */
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    mark(10);
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  const proj = new THREE.Vector3();
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const clock = new THREE.Clock();
  let ready = false;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (tween) {
      tween.t = Math.min(1, tween.t + dt / 0.9);
      const e = ease(tween.t);
      camera.position.lerpVectors(tween.from.pos, tween.to.pos, e);
      controls.target.lerpVectors(tween.from.target, tween.to.target, e);
      if (tween.t >= 1) tween = null;
      mark(2);
    }
    if (controls.update()) mark(2);
    if (dirty <= 0 && ready) return;
    dirty--;
    sun.target.position.copy(controls.target);
    renderer.render(scene, camera);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    for (const l of railLabels) {
      proj.copy(l.pt).project(camera);
      l.el.style.opacity = proj.z < 1 ? 1 : 0;
      l.el.style.transform = `translate(${((proj.x * 0.5 + 0.5) * w).toFixed(1)}px, ${((-proj.y * 0.5 + 0.5) * h).toFixed(1)}px)`;
    }
    if (!ready) { ready = true; host.classList.add('is-ready'); }
  });

  return { setStair, setRails, setMode, view, candidates: () => cands, idle: () => !tween && dirty <= 0, mode: () => mode, pickAt: (x, y) => pick({ clientX: x, clientY: y }), renderer, camera, controls, mark };
}
