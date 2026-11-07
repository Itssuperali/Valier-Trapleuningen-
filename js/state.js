/* =========================================================
   VALIER — centrale configuratiestatus.
   Eén object; elke wijziging gaat via update() en wordt doorgegeven
   aan het 3D-model, de prijs en het overzicht. Keuzes worden lokaal bewaard.
   ========================================================= */
const KEY = 'valier-configuratie-v2';

const DEFAULTS = () => ({
  step: 0,
  stair: { type: null, dir: 'links' },
  rails: [],                          // [{ pos, lengthMm, profile, color, ral }]
  apply: { profile: 'all', color: 'all' },
  profile: '50x30',                   // keuze voor "alle leuningen"
  color: 'zwart',
  ral: '',
  unit: 'mm',
  lengthsUnknown: false,
  delivery: 'montage',
  customer: { naam: '', email: '', telefoon: '', postcode: '', plaats: '' },
  notes: '',
  km: null
});

let state = DEFAULTS();
const listeners = new Set();

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = Object.assign(DEFAULTS(), JSON.parse(raw));
  } catch { /* private mode or blocked storage: start fresh */ }
  return state;
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
}
export const get = () => state;
export function update(fn, why = '') {
  fn(state);
  save();
  listeners.forEach(l => l(state, why));
}
export const subscribe = l => (listeners.add(l), () => listeners.delete(l));
export function reset() {
  state = DEFAULTS();
  save();
  listeners.forEach(l => l(state, 'reset'));
}

/* Per-rail effective profile/colour (respecting "all" vs "per leuning"). */
export const railProfile = (s, r) => (s.apply.profile === 'all' ? s.profile : r.profile || s.profile);
export const railColor = (s, r) => (s.apply.color === 'all' ? s.color : r.color || s.color);
export const railRal = (s, r) => (s.apply.color === 'all' ? s.ral : r.ral || '');
