/* =========================================================
   VALIER — parametrische trapmodellen.
   Eén bouwer voor alle traptypen: trapvluchten, spiltreden (kwart/halve draai)
   en bordessen worden achter elkaar gezet. Elk type levert ook de logische
   leuningposities (rechte stukken langs een wand) met een vaste id en naam.
   Schematisch: geen exacte weergave van een woning.
   ========================================================= */
import * as THREE from 'three';

export const DIM = { W: 0.85, rise: 0.185, run: 0.25, T: 0.04, H: 0.9, off: 0.068, G: 0.1 };
const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const leftOf = d => v3(d.z, 0, -d.x);

const PLANS = {
  recht: [['flight', 15, 'v1', 'Trap']],
  kwart: [['flight', 9, 'v1', 'Onderste trapvlucht'], ['wind90', 3, 'd1', 'Draai'], ['flight', 3, 'v2', 'Bovenste trapvlucht']],
  halfdraai: [['flight', 6, 'v1', 'Onderste trapvlucht'], ['wind180', 4, 'd1', 'Draai'], ['flight', 5, 'v2', 'Bovenste trapvlucht']],
  dubbelkwart: [['flight', 5, 'v1', 'Onderste trapvlucht'], ['wind90', 2, 'd1', 'Onderste draai'], ['flight', 2, 'v2', 'Middelste trapvlucht'], ['wind90', 2, 'd2', 'Bovenste draai'], ['flight', 4, 'v3', 'Bovenste trapvlucht']],
  bordes: [['flight', 8, 'v1', 'Onderste trapvlucht'], ['landing', 1, 'b1', 'Bordes'], ['flight', 6, 'v2', 'Bovenste trapvlucht']]
};

export function buildStair(type, dir, mats) {
  const { W, rise, run, T, H, off, G } = DIM;
  const slope = rise / run;
  const group = new THREE.Group();
  const cands = [];
  const P = v3(0, 0, 0);
  let d = v3(0, 0, -1), y = 0;

  const yaw = dv => Math.atan2(dv.x, dv.z);
  function box(w, h, l, mat, pos, dv, pitch = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, l), mat);
    m.rotation.order = 'YXZ';
    m.rotation.y = yaw(dv);
    m.rotation.x = pitch;
    m.position.copy(pos);
    m.castShadow = m.receiveShadow = true;
    group.add(m);
    return m;
  }
  function polyTread(pts, toW, top, mat) {
    const s = new THREE.Shape();
    pts.forEach(([u, v], i) => { const p = toW(u, v); i ? s.lineTo(p.x, p.z) : s.moveTo(p.x, p.z); });
    const g = new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false });
    g.rotateX(Math.PI / 2);
    const m = new THREE.Mesh(g, mat);
    m.position.y = top;
    m.castShadow = m.receiveShadow = true;
    group.add(m);
  }
  function riserAlong(p0, p1, bottom) {
    const len = Math.hypot(p1.x - p0.x, p1.z - p0.z);
    const r = new THREE.Mesh(new THREE.PlaneGeometry(len, rise - T), mats.whiteDS);
    r.rotation.y = -Math.atan2(p1.z - p0.z, p1.x - p0.x);
    r.position.set((p0.x + p1.x) / 2, bottom + (rise - T) / 2, (p0.z + p1.z) / 2);
    r.receiveShadow = true;
    group.add(r);
  }
  const cand = (id, label, a, b, out, kind = 'schuin') => cands.push({ id, label, a, b, out: out.clone().normalize(), kind });

  /* ---- pieces ---- */
  function flight(n, id, name) {
    const P0 = P.clone(), y0 = y, L = leftOf(d);
    for (let i = 0; i < n; i++) {
      const tp = P0.clone().addScaledVector(d, i * run + run / 2 - 0.015); tp.y = y0 + (i + 1) * rise - T / 2;
      box(W, T, run + 0.03, mats.oak, tp, d);
      const rp = P0.clone().addScaledVector(d, i * run + 0.009); rp.y = y0 + i * rise + (rise - T) / 2;
      box(W, rise - T, 0.018, mats.white, rp, d);
    }
    const len = Math.hypot(n * run, n * rise);
    for (const side of [1, -1]) {
      const c = P0.clone().addScaledVector(d, n * run / 2).addScaledVector(L, side * (W / 2 + 0.02));
      c.y = y0 + rise + (n * rise) / 2 - 0.1;
      box(0.035, 0.26, len + 0.12, mats.white, c, d, -Math.atan(slope));
    }
    const words = [[1, 'l', 'links'], [-1, 'r', 'rechts']];
    for (const [side, sfx, word] of words) {
      const sa = -0.04, sb = (n - 1) * run + 0.06;
      const a = P0.clone().addScaledVector(d, sa).addScaledVector(L, side * (W / 2 - off)); a.y = y0 + rise + H + sa * slope;
      const b = P0.clone().addScaledVector(d, sb).addScaledVector(L, side * (W / 2 - off)); b.y = y0 + rise + H + sb * slope;
      cand(`${id}-${sfx}`, `${name} · ${word}`, a, b, L.clone().multiplyScalar(side));
    }
    P.addScaledVector(d, n * run);
    y += n * rise;
  }

  // Spiltreden rond een binnenhoek. halfWidthV = halve breedte van het draaigebied (dwars).
  function winders(k, id, name, sweep) {
    const L = leftOf(d);
    const vmax = sweep === 180 ? W + G / 2 : W;          // buitenrand dwars, vanaf de spil
    const A = sweep === 180 ? P.clone().addScaledVector(L, W / 2 + G / 2) : P.clone().addScaledVector(L, W / 2);
    const toW = (u, v) => A.clone().addScaledVector(d, u).addScaledVector(L, v);
    const edge = th => {
      const c = Math.cos(th), s = Math.sin(th);
      let t = Infinity;
      if (c > 1e-6) t = Math.min(t, W / c);
      if (s < -1e-6) t = Math.min(t, -vmax / s);
      if (s > 1e-6 && sweep === 180) t = Math.min(t, vmax / s);
      return [t * c, t * s];
    };
    const corners = sweep === 180 ? [[Math.atan2(-vmax, W), [W, -vmax]], [Math.atan2(vmax, W), [W, vmax]]] : [[Math.atan2(-vmax, W), [W, -vmax]]];
    const th0 = -Math.PI / 2, th1 = sweep === 180 ? Math.PI / 2 : 0;
    for (let i = 0; i < k; i++) {
      const a0 = th0 + ((th1 - th0) * i) / k, a1 = th0 + ((th1 - th0) * (i + 1)) / k;
      const pts = [[0, 0], edge(a0)];
      for (const [ang, pt] of corners) if (a0 < ang && a1 > ang) pts.push(pt);
      pts.push(edge(a1));
      polyTread(pts, toW, y + (i + 1) * rise, mats.oak);
      const e = edge(a0);
      riserAlong(toW(0, 0), toW(e[0], e[1]), y + i * rise);
    }
    // outer wall path: right edge → far edge (→ left edge for 180°)
    const total = sweep === 180 ? 2 * W + 2 * vmax : 2 * W;
    const yr = y + rise + H, dy = k * rise;
    const at = (u, v, len) => { const p = toW(u, v); p.y = yr + (dy * len) / total; return p; };
    cand(`${id}-a`, `${name} · buitenzijde 1`, at(0.03, -vmax + off, 0.03), at(W - off - 0.06, -vmax + off, W - off - 0.06), L.clone().negate());
    if (sweep === 180) {
      cand(`${id}-b`, `${name} · buitenzijde 2`, at(W - off, -vmax + off + 0.06, W + off + 0.06), at(W - off, vmax - off - 0.06, W + 2 * vmax - off - 0.06), d);
      cand(`${id}-c`, `${name} · buitenzijde 3`, at(W - off - 0.06, vmax - off, W + 2 * vmax + off + 0.06), at(0.03, vmax - off, total - 0.03), L);
    } else {
      cand(`${id}-b`, `${name} · buitenzijde 2`, at(W - off, -vmax + off + 0.06, W + off + 0.06), at(W - off, -0.03, 2 * W - 0.03), d);
    }
    if (sweep === 180) {
      P.copy(A).addScaledVector(L, W / 2 + G / 2);
      d = d.clone().negate();
    } else {
      P.copy(A).addScaledVector(d, W / 2);
      d = L;
    }
    y += k * rise;
  }

  function landing(id, name) {
    const L = leftOf(d);
    const A = P.clone().addScaledVector(L, W / 2);
    const toW = (u, v) => A.clone().addScaledVector(d, u).addScaledVector(L, v);
    polyTread([[0, 0], [0, -W], [W, -W], [W, 0]], toW, y + rise, mats.oak);
    riserAlong(toW(0, 0), toW(0, -W), y);
    const yr = y + rise + H;
    const at = (u, v) => { const p = toW(u, v); p.y = yr; return p; };
    cand(`${id}-a`, `${name} · zijkant`, at(0.03, -W + off), at(W - off - 0.06, -W + off), L.clone().negate(), 'horizontaal');
    cand(`${id}-b`, `${name} · achterkant`, at(W - off, -W + off + 0.06), at(W - off, -0.03), d, 'horizontaal');
    P.copy(A).addScaledVector(d, W / 2);
    d = L;
    y += rise;
  }

  const plan = PLANS[type] || PLANS.recht;
  let centralWall = null;
  for (const [kind, n, id, name] of plan) {
    if (kind === 'flight') flight(n, id, name);
    if (kind === 'wind90') winders(n, id, name, 90);
    if (kind === 'wind180') {
      // central wall between the two flights of a half-turn stair
      const L = leftOf(d), len = plan[0][1] * run + 0.05;
      const c = P.clone().addScaledVector(L, W / 2 + G / 2).addScaledVector(d, -len / 2);
      c.y = (y + 1.1) / 2;
      centralWall = box(G, y + 1.1, len, mats.wall, c, d);
      winders(n, id, name, 180);
    }
    if (kind === 'landing') landing(id, name);
  }

  // Mirror for "rechtsom": geometry flips in x, left/right labels swap.
  if (dir === 'rechts' && (type !== 'recht')) {
    group.scale.x = -1;
    for (const c of cands) {
      c.a.x *= -1; c.b.x *= -1; c.out.x *= -1;
      if (/-l$/.test(c.id)) { c.id = c.id.replace(/-l$/, '-r'); c.label = c.label.replace('links', 'rechts'); }
      else if (/-r$/.test(c.id)) { c.id = c.id.replace(/-r$/, '-l'); c.label = c.label.replace('rechts', 'links'); }
    }
  }
  // stable order: bottom → top, left before right
  const order = id => {
    const m = id.match(/^([a-z])(\d)-([a-z])$/);
    const piece = { v: 0, d: 1, b: 1 }[m[1]];
    const idx = (+m[2]) * 2 + piece;
    const side = { l: 0, r: 1, a: 0, b: 1, c: 2 }[m[3]];
    return idx * 10 + side;
  };
  cands.sort((p, q) => order(p.id) - order(q.id));

  const bbox = new THREE.Box3().setFromObject(group);
  return { group, cands, bbox, topY: y };
}

/* Losse leuningen (snelle route / andere trap): rechte leuningen naast elkaar op een wand. */
export function looseSlots(n) {
  const slots = [];
  const spacing = 1.9, slope = 0.62, len = 2.2;
  const x0 = -((n - 1) * spacing) / 2;
  for (let i = 0; i < n; i++) {
    const cx = x0 + i * spacing;
    const t = v3(1, slope, 0).normalize();
    const mid = v3(cx, 1.45, 0.06);
    slots.push({
      id: `los-${i + 1}`, label: `Losse leuning ${i + 1}`, kind: 'los',
      a: mid.clone().addScaledVector(t, -len / 2), b: mid.clone().addScaledVector(t, len / 2), out: v3(0, 0, -1)
    });
  }
  return slots;
}
