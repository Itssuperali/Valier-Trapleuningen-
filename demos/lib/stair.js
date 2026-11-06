/* =========================================================
   VALIER demos — procedural stairs, railings & materials
   Units: metres. Stair climbs along +x, up +y. Open side = +z.
   ========================================================= */
import { THREE, v3 } from './core.js';

/* ---------- Procedural textures ---------- */
function woodTexture({ base = '#a87b4f', dark = '#6e4a2b', light = '#c9a274', rotate = false, seed = 1 } = {}) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 256;
  const g = c.getContext('2d');
  let s = seed * 9301;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  g.fillStyle = base; g.fillRect(0, 0, 1024, 256);
  for (let i = 0; i < 320; i++) {
    const y = rnd() * 256, amp = 1 + rnd() * 5, freq = (1 + Math.floor(rnd() * 4)) * Math.PI * 2 / 1024, ph = rnd() * 6.28;
    g.strokeStyle = rnd() < 0.55 ? dark : light;
    g.globalAlpha = 0.04 + rnd() * 0.16;
    g.lineWidth = 0.4 + rnd() * 2.4;
    g.beginPath();
    for (let x = 0; x <= 1024; x += 8) {
      const yy = y + Math.sin(x * freq + ph) * amp;
      x ? g.lineTo(x, yy) : g.moveTo(x, yy);
    }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (rotate) { t.center.set(0.5, 0.5); t.rotation = Math.PI / 2; }
  return t;
}

function brushedTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#c8c8c8'; g.fillRect(0, 0, 1024, 128);
  for (let i = 0; i < 900; i++) {
    const y = Math.random() * 128, v = 150 + Math.random() * 105;
    g.fillStyle = `rgba(${v},${v},${v},${0.15 + Math.random() * 0.35})`;
    g.fillRect(0, y, 1024, 0.5 + Math.random());
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 1);
  return t;
}

/* ---------- Materials ---------- */
export function createMaterials() {
  const brushed = brushedTexture();
  const std = o => new THREE.MeshStandardMaterial(o);
  return {
    steel: std({ color: 0x1b1b1c, metalness: 0.62, roughness: 0.36 }),
    white: std({ color: 0xf1efea, metalness: 0.15, roughness: 0.42 }),
    rvs: std({ color: 0xd9dbdd, metalness: 1, roughness: 0.34, roughnessMap: brushed }),
    brass: std({ color: 0xcaa26a, metalness: 1, roughness: 0.28, roughnessMap: brushed }),
    oak: std({ map: woodTexture({ base: '#94704d', dark: '#5f4129', light: '#b08d69', rotate: true }), roughness: 0.6 }),
    oakLight: std({ map: woodTexture({ base: '#cfae84', dark: '#a0784e', light: '#e2c7a0', rotate: true, seed: 3 }), roughness: 0.62 }),
    oakSmoked: std({ map: woodTexture({ base: '#4a3424', dark: '#2a1c12', light: '#6b4d36', rotate: true, seed: 5 }), roughness: 0.55 }),
    oakRail: std({ map: woodTexture({ base: '#9c6e43', dark: '#6a4527', light: '#bd8f60', seed: 7 }), roughness: 0.48 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xd8ebe6, metalness: 0, roughness: 0.03, transparent: true, opacity: 0.22,
      depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.6, reflectivity: 0.6
    }),
    glassEdge: std({ color: 0x9fc6bd, metalness: 0, roughness: 0.1, transparent: true, opacity: 0.55 }),
    plaster: std({ color: 0xe9e4db, roughness: 0.95 }),
    plasterDark: std({ color: 0x1f1d1a, roughness: 0.92 }),
    concrete: std({ color: 0x3a3835, roughness: 0.9 }),
    concreteLight: std({ color: 0xcfcac2, roughness: 0.92 }),
    floorOak: (() => {
      const m = std({ map: woodTexture({ base: '#9f8466', dark: '#6f5940', light: '#bba284', seed: 11 }), roughness: 0.55 });
      m.map.repeat.set(6, 24);
      return m;
    })(),
    clay: std({ color: 0xe8e5df, roughness: 0.85 }),
    led: new THREE.MeshBasicMaterial({ color: 0xffd9a8 }),
    hidden: new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })
  };
}

const shadowed = (mesh, cast = true, receive = true) => {
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  return mesh;
};

/** Path made of straight segments with rounded corners. */
export function roundedPath(points, r = 0.1) {
  const path = new THREE.CurvePath();
  let prev = points[0].clone();
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1], b = points[i], c = points[i + 1];
    const d1 = b.clone().sub(a), d2 = c.clone().sub(b);
    const rr = Math.min(r, d1.length() / 2, d2.length() / 2);
    const p1 = b.clone().sub(d1.normalize().multiplyScalar(rr));
    const p2 = b.clone().add(d2.normalize().multiplyScalar(rr));
    path.add(new THREE.LineCurve3(prev, p1));
    path.add(new THREE.QuadraticBezierCurve3(p1, b.clone(), p2));
    prev = p2;
  }
  path.add(new THREE.LineCurve3(prev, points[points.length - 1].clone()));
  return path;
}

const cyl = (r, h, mat, seg = 20) => {
  const g = new THREE.CylinderGeometry(r, r, h, seg);
  g.translate(0, h / 2, 0); // origin at base
  return shadowed(new THREE.Mesh(g, mat));
};
const box = (x, y, z, mat, base = false) => {
  const g = new THREE.BoxGeometry(x, y, z);
  if (base) g.translate(0, y / 2, 0);
  return shadowed(new THREE.Mesh(g, mat));
};

/* =========================================================
   Straight stair with railing
   ========================================================= */
export function straightStair(M, o = {}) {
  const N = o.steps ?? 15, rise = o.rise ?? 0.19, run = o.run ?? 0.27, W = o.width ?? 1.0;
  const tT = o.treadThickness ?? 0.045;
  const hr = o.railHeight ?? 0.9;
  const L = N * run, H = N * rise, slope = rise / run;
  const treadMat = o.treadMat ?? M.oak, metal = o.metal ?? M.steel, railMat = o.railMat ?? metal;
  const railR = o.railRadius ?? 0.0212;
  const zr = W / 2 - 0.035;

  const group = new THREE.Group();
  const parts = { treads: [], stringers: [], posts: [], infill: new THREE.Group(), rail: null, clamps: [] };
  group.add(parts.infill);

  // Treads
  for (let i = 0; i < N; i++) {
    const t = box(run + 0.035, tT, W, treadMat);
    t.position.set(i * run + run / 2 - 0.0175, (i + 1) * rise - tT / 2, 0);
    t.userData.home = t.position.clone();
    parts.treads.push(t);
    group.add(t);
  }

  // Zig-zag stringers (steel plate)
  const stringerMode = o.stringers ?? 'open';
  if (stringerMode !== 'none') {
    const d = 0.3;
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    for (let i = 0; i < N; i++) {
      s.lineTo(i * run, (i + 1) * rise - tT);
      s.lineTo((i + 1) * run, (i + 1) * rise - tT);
    }
    s.lineTo(L, H - d);
    s.lineTo((d / slope), 0);
    s.lineTo(0, 0);
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: false });
    const zs = stringerMode === 'both' ? [W / 2, -W / 2 - 0.012] : [W / 2];
    for (const z of zs) {
      const m = shadowed(new THREE.Mesh(geo, o.stringerMat ?? metal));
      m.position.z = z;
      parts.stringers.push(m);
      group.add(m);
    }
  }

  // Handrail curve (open side)
  const railY = x => rise + hr + slope * x;
  const xTop = (N - 1) * run;
  const ext = o.railExtension ?? 0.3;
  const railPts = [
    v3(-ext, railY(0), zr),
    v3(0, railY(0), zr),
    v3(xTop, railY(xTop), zr),
    v3(xTop + ext + run, railY(xTop), zr)
  ];
  const railCurve = roundedPath(railPts, 0.14);
  const infillType = o.infill ?? 'rods';
  const capOnGlass = infillType === 'glass';

  if (o.rail !== false) {
    const rail = shadowed(new THREE.Mesh(new THREE.TubeGeometry(railCurve, 700, railR, 32, false), railMat));
    const caps = [railPts[0], railPts[3]].map(p => {
      const c = shadowed(new THREE.Mesh(new THREE.SphereGeometry(railR, 24, 16), railMat));
      c.position.copy(p);
      return c;
    });
    rail.add(...caps.map(c => { c.position.sub(v3(0, 0, 0)); return c; }));
    parts.rail = rail;
    group.add(rail);
  }

  // Posts (square 40×40) at bottom and top
  const postXs = [0.06, xTop + run * 0.5];
  if (infillType === 'bars' || infillType === 'glass') {
    const segs = o.panels ?? 3;
    for (let k = 1; k < segs; k++) postXs.splice(postXs.length - 1, 0, (xTop / segs) * k + 0.03);
  }
  if (!capOnGlass && o.rail !== false && o.posts !== false) {
    for (const x of postXs) {
      const baseY = x > xTop ? H : Math.floor(x / run + 1e-6) * rise + rise;
      const h = railY(Math.min(x, xTop)) - baseY;
      const p = box(0.04, h, 0.04, metal, true);
      p.position.set(x, baseY, zr);
      parts.posts.push(p);
      group.add(p);
    }
  }

  // Infill
  if (infillType === 'rods') {
    for (let i = 0; i < N - 1; i++) {
      for (const f of [0.28, 0.78]) {
        const x = i * run + run * f;
        const y0 = (i + 1) * rise;
        const r = cyl(0.008, railY(x) - y0 - railR, metal, 12);
        r.position.set(x, y0, zr);
        parts.infill.add(r);
      }
    }
  } else if (infillType === 'bars') {
    const len = Math.hypot(xTop, slope * xTop);
    const ang = Math.atan2(slope * xTop, xTop);
    for (const off of [0.15, 0.3, 0.45, 0.6, 0.75]) {
      const g = new THREE.CylinderGeometry(0.0075, 0.0075, len, 14);
      g.rotateZ(-Math.PI / 2);
      g.translate(len / 2, 0, 0);
      const m = shadowed(new THREE.Mesh(g, metal));
      m.position.set(0, railY(0) - off, zr);
      m.rotation.z = ang;
      parts.infill.add(m);
    }
  } else if (infillType === 'glass') {
    const segs = o.panels ?? 3;
    const gap = 0.02;
    for (let k = 0; k < segs; k++) {
      const x0 = (xTop / segs) * k + gap, x1 = (xTop / segs) * (k + 1) - gap;
      const yb = x => rise + slope * x - 0.02;
      const yt = x => railY(x) - (capOnGlass ? railR : 0.07);
      const s = new THREE.Shape();
      s.moveTo(x0, yb(x0)); s.lineTo(x1, yb(x1)); s.lineTo(x1, yt(x1)); s.lineTo(x0, yt(x0)); s.lineTo(x0, yb(x0));
      const geo = new THREE.ExtrudeGeometry(s, { depth: 0.017, bevelEnabled: false });
      geo.translate(0, 0, -0.0085);
      const glass = new THREE.Mesh(geo, o.glassMat ?? M.glass);
      glass.receiveShadow = true;
      glass.position.z = W / 2 + 0.04;
      glass.renderOrder = 2;
      parts.infill.add(glass);
      // clamps fixed to the stringer / tread edge
      for (const f of [0.2, 0.8]) {
        const x = lerp(x0, x1, f);
        const c = box(0.06, 0.07, 0.035, o.clampMat ?? metal);
        c.position.set(x, yb(x) + 0.08, W / 2 + 0.04);
        c.rotation.z = Math.atan(slope);
        parts.clamps.push(c);
        group.add(c);
      }
    }
  }

  if (capOnGlass && parts.rail) parts.rail.position.z = 0.075; // cap rail sits on the glass

  return {
    group, parts, railCurve, railY, N, rise, run, W, L, H, xTop, zr, slope, hr,
    railPoint: (u, target = new THREE.Vector3()) => railCurve.getPointAt(u, target).add(parts.rail ? parts.rail.position : v3(0, 0, 0))
  };
}

/* ---------- Wall-mounted handrail with brackets ---------- */
export function wallRail(M, st, o = {}) {
  const mat = o.mat ?? M.rvs, bracketMat = o.bracketMat ?? M.steel;
  const zWall = -st.W / 2, off = o.offset ?? 0.075, z = zWall + off;
  const y = x => st.railY(x);
  const xA = -0.15, xB = st.xTop + st.run + 0.15;
  const pts = [v3(xA - 0.05, y(0), zWall), v3(xA, y(0), z), v3(0, y(0), z), v3(st.xTop, y(st.xTop), z), v3(xB, y(st.xTop), z), v3(xB + 0.05, y(st.xTop), zWall)];
  const curve = roundedPath(pts, 0.06);
  const group = new THREE.Group();
  const r = o.radius ?? 0.0212;
  group.add(shadowed(new THREE.Mesh(new THREE.TubeGeometry(curve, 800, r, 40, false), mat)));

  const brackets = [];
  const spacing = o.spacing ?? 0.8;
  const len = st.xTop;
  const count = Math.max(2, Math.round(len / spacing) + 1);
  for (let k = 0; k < count; k++) {
    const x = (len / (count - 1)) * k;
    const b = new THREE.Group();
    const drop = 0.065;
    const rose = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.008, 32), bracketMat);
    rose.rotation.x = Math.PI / 2;
    rose.position.set(0, -drop, 0.004);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.0065, off, 16), bracketMat);
    arm.rotation.x = Math.PI / 2;
    arm.position.set(0, -drop, off / 2);
    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.0065, 16, 12), bracketMat);
    elbow.position.set(0, -drop, off);
    const stemLen = drop - r - 0.006;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.0065, stemLen, 16), bracketMat);
    stem.position.set(0, -drop + stemLen / 2, off);
    const saddle = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.008, 0.01, 24), bracketMat);
    saddle.position.set(0, -r - 0.004, off);
    [rose, arm, elbow, stem, saddle].forEach(m => shadowed(m));
    b.add(rose, arm, elbow, stem, saddle);
    b.position.set(x, y(x), zWall);
    b.userData.top = v3(x, y(x), z);
    brackets.push(b);
    group.add(b);
  }
  return { group, curve, brackets };
}

/* =========================================================
   Spiral stair
   ========================================================= */
class Helix extends THREE.Curve {
  constructor(R, a0, a1, y0, k) { super(); Object.assign(this, { R, a0, a1, y0, k }); }
  getPoint(t, target = new THREE.Vector3()) {
    const a = this.a0 + (this.a1 - this.a0) * t;
    return target.set(this.R * Math.cos(a), this.y0 + this.k * (a - this.a0), -this.R * Math.sin(a));
  }
}

export function spiralStair(M, o = {}) {
  const N = o.steps ?? 18, rise = o.rise ?? 0.19, R = o.radius ?? 1.05, r0 = 0.07, tT = 0.05;
  const th = o.stepAngle ?? THREE.MathUtils.degToRad(22);
  const hr = 0.9, H = N * rise;
  const treadMat = o.treadMat ?? M.oakSmoked, metal = o.metal ?? M.steel, railMat = o.railMat ?? M.brass;
  const group = new THREE.Group();

  const shape = new THREE.Shape();
  shape.moveTo(r0, 0);
  shape.lineTo(R, 0);
  shape.absarc(0, 0, R, 0, th + 0.01, false);
  shape.lineTo(r0 * Math.cos(th), r0 * Math.sin(th));
  shape.absarc(0, 0, r0, th, 0, true);
  const tg = new THREE.ExtrudeGeometry(shape, { depth: tT, bevelEnabled: false, curveSegments: 16 });
  tg.rotateX(-Math.PI / 2);

  const treads = [];
  for (let i = 0; i < N; i++) {
    const t = shadowed(new THREE.Mesh(tg, treadMat));
    t.rotation.y = i * th;
    t.position.y = (i + 1) * rise - tT;
    treads.push(t);
    group.add(t);
    // baluster at outer edge
    const a = i * th + th / 2;
    const yb = (i + 1) * rise;
    const ry = rise + hr + rise * (a / th);
    const b = cyl(0.008, ry - yb, metal, 12);
    b.position.set((R - 0.04) * Math.cos(a), yb, -(R - 0.04) * Math.sin(a));
    group.add(b);
  }
  const column = cyl(0.055, H + 0.25, metal, 32);
  group.add(column);

  const helix = new Helix(R - 0.04, 0, N * th, rise + hr, rise / th);
  const rail = shadowed(new THREE.Mesh(new THREE.TubeGeometry(helix, 900, 0.022, 32, false), railMat));
  group.add(rail);
  return { group, helix, H, N, th, R, rise, treads, rail };
}

/* ---------- Helpers ---------- */
export function lerp(a, b, t) { return a + (b - a) * t; }

export function addEdges(root, { color = 0xffffff, opacity = 1, threshold = 25 } = {}) {
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  const lines = [];
  root.traverse(o => {
    if (!o.isMesh || o.userData.noEdges) return;
    const l = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, threshold), mat);
    o.add(l);
    lines.push(l);
  });
  return { mat, lines };
}

export function plane(w, h, mat, { receive = true } = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.receiveShadow = receive;
  return m;
}
export { box, cyl, shadowed };
