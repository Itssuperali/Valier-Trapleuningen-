/* =========================================================
   VALIER demos — core: renderer, scroll, camera rig, chapters
   ========================================================= */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export { THREE };

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = t => t * t * (3 - 2 * t);
export const range = (p, a, b) => clamp((p - a) / (b - a));
export const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

const params = new URLSearchParams(location.search);
export const forcedProgress = params.has('p') ? clamp(parseFloat(params.get('p'))) : null;
export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (params.has('clean')) document.body.classList.add('clean'); // UI-free renders (thumbnails)

/* ---------- Stage ---------- */
export function createStage({ background = '#0d0d0c', fog = null, exposure = 1, fov = 35, shadows = true } = {}) {
  const canvas = document.querySelector('.stage');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    document.body.classList.add('no-webgl');
    throw e;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, matchMedia('(pointer: coarse)').matches ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure;
  renderer.shadowMap.enabled = shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(background);
  if (fog) scene.fog = new THREE.Fog(background, fog[0], fog[1]);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(fov, innerWidth / innerHeight, 0.02, 150);
  const frames = new Set();

  const resize = () => {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  };
  addEventListener('resize', resize);
  resize();

  const clock = new THREE.Clock();
  const mobile = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
  let ready = false;
  // Adaptive quality: measure real frame times and lower the resolution on slow devices
  const perf = { n: 0, sum: 0, ratio: renderer.getPixelRatio() };
  renderer.setAnimationLoop(() => {
    const raw = clock.getDelta();
    const dt = Math.min(raw, 0.05);
    const t = clock.elapsedTime;
    if (!ready && mobile) {
      scene.traverse(o => { if (o.isLight && o.shadow) o.shadow.mapSize.set(1024, 1024); });
    }
    frames.forEach(f => f(dt, t));
    renderer.render(scene, camera);
    if (!ready) {
      ready = true;
      requestAnimationFrame(() => document.body.classList.add('is-ready'));
    } else if (perf.n < 90) {
      perf.n++;
      if (perf.n > 30) perf.sum += raw;
      if (perf.n === 90 && perf.sum / 60 > 0.026 && perf.ratio > 1) {
        perf.ratio = Math.max(1, perf.ratio * 0.7);
        renderer.setPixelRatio(perf.ratio);
        resize();
      }
    }
  });

  const setBackground = c => {
    scene.background.set(c);
    if (scene.fog) scene.fog.color.set(c);
    document.body.style.setProperty('--bg', '#' + scene.background.getHexString());
  };

  return { THREE, renderer, scene, camera, onFrame: f => frames.add(f), setBackground };
}

/** Set environment-reflection strength on every material in the scene. */
export function setEnvIntensity(root, v) {
  root.traverse(o => {
    if (!o.material) return;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => {
      if ('envMapIntensity' in m) m.envMapIntensity = v;
    });
  });
}

/* ---------- Scroll → progress ---------- */
export function createScroll({ damping = 3.2 } = {}) {
  const s = { target: 0, value: 0, lenis: null };
  if (window.Lenis && !reducedMotion && forcedProgress === null) {
    s.lenis = new Lenis({ duration: 1.6, smoothWheel: true });
    const raf = t => { s.lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const read = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    s.target = max > 0 ? clamp(scrollY / max) : 0;
  };
  if (forcedProgress !== null) {
    s.target = s.value = forcedProgress;
  } else {
    addEventListener('scroll', read, { passive: true });
    addEventListener('resize', read);
    read();
    s.value = s.target;
  }
  s.update = dt => {
    if (forcedProgress !== null) return s.value;
    s.value += (s.target - s.value) * (1 - Math.exp(-dt * damping));
    if (Math.abs(s.target - s.value) < 1e-5) s.value = s.target;
    return s.value;
  };
  s.scrollTo = p => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (s.lenis) s.lenis.scrollTo(p * max, { duration: 2 });
    else scrollTo({ top: p * max, behavior: reducedMotion ? 'auto' : 'smooth' });
  };
  return s;
}

/* ---------- Camera rig: keyframes → smooth spline ---------- */
export function createRig(keys, { sway = 0.04 } = {}) {
  const P = new THREE.CatmullRomCurve3(keys.map(k => k.pos.clone ? k.pos.clone() : v3(...k.pos)), false, 'centripetal');
  const T = new THREE.CatmullRomCurve3(keys.map(k => k.look.clone ? k.look.clone() : v3(...k.look)), false, 'centripetal');
  const n = keys.length;
  const pos = new THREE.Vector3(), look = new THREE.Vector3();
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', e => {
    mouse.x = e.clientX / innerWidth - 0.5;
    mouse.y = e.clientY / innerHeight - 0.5;
  });

  const param = p => {
    let i = 0;
    while (i < n - 2 && p > keys[i + 1].t) i++;
    const a = keys[i].t, b = keys[i + 1].t;
    const local = clamp((p - a) / (b - a));
    return { u: (i + lerp(local, smooth(local), 0.55)) / (n - 1), i, local };
  };

  return {
    apply(camera, p, dt = 0.016, time = 0) {
      const { u, i, local } = param(clamp(p));
      P.getPoint(u, pos);
      T.getPoint(u, look);
      const f0 = keys[i].fov, f1 = keys[i + 1].fov;
      if (f0 !== undefined && f1 !== undefined) {
        const f = lerp(f0, f1, smooth(local));
        if (Math.abs(camera.fov - f) > 1e-3) { camera.fov = f; camera.updateProjectionMatrix(); }
      }
      camera.position.copy(pos);
      camera.lookAt(look);
      // subtle hand-held life: mouse sway + breathing
      mouse.sx += (mouse.x - mouse.sx) * (1 - Math.exp(-dt * 2));
      mouse.sy += (mouse.y - mouse.sy) * (1 - Math.exp(-dt * 2));
      const d = pos.distanceTo(look);
      const k = sway * Math.min(1, d / 3);
      camera.translateX(mouse.sx * k + Math.sin(time * 0.6) * k * 0.15);
      camera.translateY(-mouse.sy * k + Math.sin(time * 0.8) * k * 0.12);
      camera.lookAt(look);
      return { u, pos, look };
    }
  };
}

/* ---------- Chapters (HTML overlay text tied to progress) ---------- */
export function createChapters() {
  const els = [...document.querySelectorAll('.chapter')].map(el => ({
    el, from: +el.dataset.from, to: +el.dataset.to
  }));
  const bar = document.querySelector('.progress i');
  const hint = document.querySelector('.hint');
  return p => {
    for (const c of els) {
      const fi = c.from <= 0 ? 1 : smooth(range(p, c.from, c.from + 0.045));
      const fo = c.to >= 1 ? 0 : smooth(range(p, c.to - 0.045, c.to));
      const o = fi * (1 - fo);
      c.el.style.opacity = o.toFixed(3);
      c.el.style.transform = `translate3d(0, ${((1 - fi) * 28 - fo * 28).toFixed(1)}px, 0)`;
      c.el.style.pointerEvents = o > 0.6 ? 'auto' : 'none';
      c.el.style.visibility = o < 0.002 ? 'hidden' : 'visible';
    }
    if (bar) bar.style.transform = `scaleY(${p.toFixed(4)})`;
    if (hint) hint.style.opacity = (1 - smooth(range(p, 0.01, 0.05))).toFixed(3);
  };
}

/* ---------- Project a 3D point to screen (for labels/hotspots) ---------- */
const _p = new THREE.Vector3();
export function toScreen(point, camera) {
  _p.copy(point).project(camera);
  return {
    x: (_p.x * 0.5 + 0.5) * innerWidth,
    y: (-_p.y * 0.5 + 0.5) * innerHeight,
    visible: _p.z < 1 && _p.z > -1
  };
}
