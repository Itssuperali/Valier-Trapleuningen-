/* =========================================================
   VALIER — configurator: stappen, validatie, overzicht en aanvraag.
   Alle keuzes gaan via state.js; de detailfoto, de prijs
   (pricing.js) en het overzicht lezen dezelfde status.
   ========================================================= */
import * as S from './state.js';
import { STAIR_TYPES, PROFILE_FORMS, COLORS, DELIVERY, LIMITS, PRICING, QUOTE, MOUNTING, PHOTOS } from './catalog.js';
import { calculate, euro } from './pricing.js';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const params = new URLSearchParams(location.search);
const DEMO = window.VALIER_DEMO === true;

const SIZES = Object.fromEntries(PROFILE_FORMS.flatMap(f => f.sizes.map(z => [z.id, { ...z, form: f.id, formName: f.name }])));
const colorOf = id => COLORS.find(c => c.id === id) || COLORS[0];
const typeOf = id => STAIR_TYPES.find(t => t.id === id);
const isLoose = t => t === 'los' || t === 'anders';

const STEPS = [
  { id: 'posities', short: 'Leuningen', title: 'Waar wil je een trapleuning?', sub: 'Klik op de gewenste plekken in het 3D-model.' },
  { id: 'lengte', short: 'Lengte', title: 'Wat is de lengte van jouw leuningen?', sub: 'Meet langs de leuning, in millimeters.' },
  { id: 'vorm', short: 'Vorm', title: 'Welke vorm past bij jouw interieur?', sub: 'Kies de vorm en de maat van het profiel.' },
  { id: 'kleur', short: 'Kleur', title: 'Welke kleur krijgt jouw trapleuning?', sub: 'Tweelaagse poedercoating.' },
  { id: 'overzicht', short: 'Overzicht', title: 'Jouw trapleuningen op maat', sub: 'Controleer je keuzes. Alles is nog te wijzigen.' },
  { id: 'aanvraag', short: 'Aanvraag', title: 'Bijna klaar!', sub: 'Vul je gegevens in en ontvang een offerte op maat.' }
];

/* ---------- 2D stair icons (top view, walking direction = arrow) ---------- */
const svg = body => `<svg viewBox="0 0 64 64" aria-hidden="true">${body}</svg>`;
const ARROW = d => `<path class="ic-arrow" d="${d}" marker-end="url(#ic-head)"/>`;
const lines = arr => arr.map(([x1, y1, x2, y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`).join('');
const ICONS = {
  recht: svg(`<rect class="ic-out" x="20" y="6" width="24" height="52"/>${lines([6, 12, 18, 24, 30, 36, 42, 48].map(y => [20, y + 4, 44, y + 4]))}${ARROW('M32 54 V14')}`),
  kwart: svg(`<path class="ic-out" d="M36 58 H54 V6 H10 V22 H36 Z"/>${lines([[36, 28, 54, 28], [36, 34, 54, 34], [36, 40, 54, 40], [36, 46, 54, 46], [36, 52, 54, 52], [36, 22, 54, 22], [36, 22, 54, 12], [36, 22, 45, 6], [36, 22, 36, 6], [30, 6, 30, 22], [24, 6, 24, 22], [18, 6, 18, 22]])}${ARROW('M45 54 V15 H15')}`),
  halfdraai: svg(`<path class="ic-out" d="M38 58 H54 V6 H10 V58 H26 V20 H38 Z"/><rect class="ic-core" x="26" y="20" width="12" height="38"/>${lines([[38, 26, 54, 26], [38, 32, 54, 32], [38, 38, 54, 38], [38, 44, 54, 44], [38, 50, 54, 50], [38, 20, 54, 20], [32, 20, 54, 9], [32, 20, 40, 6], [32, 20, 24, 6], [32, 20, 10, 9], [10, 20, 26, 20], [10, 26, 26, 26], [10, 32, 26, 32], [10, 38, 26, 38], [10, 44, 26, 44], [10, 50, 26, 50]])}${ARROW('M46 54 V13 H18 V54')}`),
  dubbelkwart: svg(`<path class="ic-out" d="M40 58 H54 V6 H10 V58 H24 V20 H40 Z"/>${lines([[40, 26, 54, 26], [40, 32, 54, 32], [40, 38, 54, 38], [40, 44, 54, 44], [40, 50, 54, 50], [40, 20, 54, 20], [40, 20, 54, 11], [40, 20, 46, 6], [35, 6, 35, 20], [29, 6, 29, 20], [24, 20, 18, 6], [24, 20, 10, 11], [10, 20, 24, 20], [10, 26, 24, 26], [10, 32, 24, 32], [10, 38, 24, 38], [10, 44, 24, 44], [10, 50, 24, 50]])}${ARROW('M47 54 V13 H17 V54')}`),
  bordes: svg(`<path class="ic-out" d="M36 58 H54 V6 H10 V22 H36 Z"/><rect class="ic-land" x="36" y="6" width="18" height="16"/>${lines([[36, 28, 54, 28], [36, 34, 54, 34], [36, 40, 54, 40], [36, 46, 54, 46], [36, 52, 54, 52], [36, 22, 54, 22], [36, 6, 36, 22], [30, 6, 30, 22], [24, 6, 24, 22], [18, 6, 18, 22]])}${ARROW('M45 54 V14 H15')}`),
  anders: svg(`<circle class="ic-out ic-dash" cx="32" cy="32" r="24"/>${lines([[32, 32, 32, 8], [32, 32, 52, 20], [32, 32, 54, 40], [32, 32, 40, 55], [32, 32, 16, 50], [32, 32, 9, 28]])}<circle class="ic-core" cx="32" cy="32" r="4"/>`)
};
const PROFILE_ICONS = {
  rechthoekig: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect class="ic-solid" x="10" y="22" width="44" height="20" rx="2"/></svg>`,
  rond: `<svg viewBox="0 0 64 64" aria-hidden="true"><circle class="ic-solid" cx="32" cy="32" r="20"/></svg>`
};

/* ---------- candidates (positions) per stair, without needing WebGL ---------- */
function candidates(s) {
  // every VALIER rail is a separate straight rail; positions are simply "Leuning 1..n"
  return s.rails.map((_, i) => ({ id: `los-${i + 1}`, label: `Leuning ${i + 1}` }));
}
const candLen = () => null;
const posLabel = (s, pos) => candidates(s).find(x => x.id === pos)?.label || pos;
function sortRails(s) {
  const order = candidates(s).map(c => c.id);
  s.rails.sort((a, b) => order.indexOf(a.pos) - order.indexOf(b.pos));
}
const numbered = s => s.rails.map((r, i) => ({ ...r, nr: i + 1 }));

/* ---------- state & detail photo ---------- */
let state = S.load();
let maxStep = state.step;
const host = $('.cfg-viewer');
let photoImg = $('.d-photo.is-on', host);
const PROFILE_PHOTOS = { rechthoekig: ['koker-diagonaal', 'lijn-glas', 'led-detail', 'spots'], rond: ['rond-trap'] };
const viewKey = { rail: 1, photo: null };   // which rail the photo shows when finishes differ per rail
const preload = new Set();
function syncViewer() {
  const s = state;
  const list = numbered(s);
  if (viewKey.rail > list.length) viewKey.rail = 1;
  const r = list[viewKey.rail - 1] || { nr: 1 };
  const size = SIZES[S.railProfile(s, r)] || SIZES['50x30'];
  const color = S.railColor(s, r), col = colorOf(color);
  const photos = PROFILE_PHOTOS[size.form === 'rond' ? 'rond' : 'rechthoekig'];
  if (!photos.includes(viewKey.photo)) viewKey.photo = photos[0];
  const file = `assets/lux/${viewKey.photo}.jpg`;
  const altText = `Geplaatste VALIER-leuning, ${size.formName.toLowerCase()} profiel`;
  const syncAlt = () => host.querySelectorAll('.d-photo').forEach(i => (i.alt = i === photoImg ? altText : ''));
  if (photoImg.getAttribute('src') !== file) {
    // cross-fade: load into the hidden layer, then swap layers
    const next = [...host.querySelectorAll('.d-photo')].find(i => i !== photoImg);
    const img = new Image();
    img.onload = () => {
      next.src = file;
      next.removeAttribute('aria-hidden');
      photoImg.setAttribute('aria-hidden', 'true');
      requestAnimationFrame(() => { next.classList.add('is-on'); photoImg.classList.remove('is-on'); photoImg = next; syncAlt(); });
    };
    img.src = file;
  }
  syncAlt();
  const ral = color === 'ral' && S.railRal(s, r) ? ' ' + esc(S.railRal(s, r)) : '';
  $('.d-swatch', host).style.background = col.swatch || col.hex;
  $('.d-spec', host).innerHTML = `<b>${esc(col.name)}${ral}</b><span>${esc(size.formName)} ${esc(size.name)}</span>`;
  $('.d-thumbs', host).innerHTML = photos.length > 1 ? photos.map(p => `<button type="button" class="d-thumb${p === viewKey.photo ? ' is-on' : ''}" data-photo-id="${p}" aria-label="Toon andere foto"><img src="assets/lux/${p}-720.jpg" alt="" width="72" height="96" loading="lazy"></button>`).join('') : '';
  const lens = list.map(x => (lenOk(x.lengthMm) ? x.lengthMm.toLocaleString('nl-NL') + ' mm' : '—'));
  const differs = list.some(x => S.railProfile(s, x) !== S.railProfile(s, list[0]) || S.railColor(s, x) !== S.railColor(s, list[0]));
  $('.d-rails', host).innerHTML = list.map((x, i) => `<button type="button" class="d-rail${differs && x.nr === r.nr ? ' is-on' : ''}" data-rail="${x.nr}" ${differs ? '' : 'tabindex="-1"'}><span class="badge">${x.nr}</span>${s.lengthsUnknown ? 'inmeten' : lens[i]}</button>`).join('');
  host.classList.toggle('is-multi', differs);
  photos.forEach(p => { const f = `assets/lux/${p}.jpg`; if (!preload.has(f)) { preload.add(f); new Image().src = f; } });
}
host.addEventListener('click', e => { const t = e.target.closest('[data-photo-id]'); if (t) { viewKey.photo = t.dataset.photoId; syncViewer(); } });
host.addEventListener('click', e => { const b = e.target.closest('[data-rail]'); if (b && host.classList.contains('is-multi')) { viewKey.rail = +b.dataset.rail; syncViewer(); } });
function set(fn, { rerender = true } = {}) {
  S.update(fn);
  state = S.get();
  syncViewer();
  if (rerender) render(); else { renderNav(); renderPrice(); }
}

/* ---------- actions ---------- */
function chooseType(id) {
  set(s => {
    const prev = s.stair.type;
    s.stair.type = id;
    if (!typeOf(id)?.turn) s.stair.dir = 'links';
    if (isLoose(id)) {
      if (!isLoose(prev)) s.rails = [{ pos: 'los-1', lengthMm: null }];
    } else {
      const ok = new Set(candidates(s).map(c => c.id));
      s.rails = s.rails.filter(r => ok.has(r.pos));
      sortRails(s);
    }
  });
}
function chooseDir(dir) {
  set(s => {
    // ids are physical sides (left/right when walking up), so a chosen side stays where it is
    s.stair.dir = dir;
    const ok = new Set(candidates(s).map(c => c.id));
    s.rails = s.rails.filter(r => ok.has(r.pos));
    sortRails(s);
  });
}
function toggleRail(id) {
  if (STEPS[state.step].id !== 'posities') return;
  set(s => {
    const i = s.rails.findIndex(r => r.pos === id);
    if (i >= 0) s.rails.splice(i, 1);
    else s.rails.push({ pos: id, lengthMm: null });
    sortRails(s);
  });
}
function setLooseCount(n) {
  set(s => {
    n = Math.max(1, Math.min(8, n));
    while (s.rails.length < n) s.rails.push({ pos: `los-${s.rails.length + 1}`, lengthMm: null });
    s.rails.length = n;
    s.rails.forEach((r, i) => (r.pos = `los-${i + 1}`));
  });
}
function quickRoute() {
  set(s => {
    s.stair = { type: 'los', dir: 'links' };
    if (!s.rails.length || !s.rails.every(r => r.pos.startsWith('los-'))) s.rails = [{ pos: 'los-1', lengthMm: null }];
    s.step = 0;
  });
  maxStep = Math.max(maxStep, 0);
  $('#configurator').scrollIntoView({ behavior: 'smooth' });
}

/* ---------- validation ---------- */
const lenOk = mm => Number.isFinite(mm) && mm >= LIMITS.minMm && mm <= LIMITS.maxMm;
function stepError(i, s = state) {
  switch (STEPS[i].id) {
    case 'trap': return s.stair.type ? '' : 'Kies eerst je traptype.';
    case 'posities': return s.rails.length ? '' : 'Kies minstens één plek voor een leuning.';
    case 'lengte': return s.lengthsUnknown || s.rails.every(r => lenOk(r.lengthMm)) ? '' : `Vul voor elke leuning een lengte in tussen ${LIMITS.minMm} en ${LIMITS.maxMm} mm, of vink aan dat je de maten nog niet weet.`;
    case 'kleur': {
      const needsRal = s.apply.color === 'all' ? s.color === 'ral' && !s.ral.trim() : s.rails.some(r => (r.color || s.color) === 'ral' && !(r.ral || '').trim());
      return needsRal ? 'Vul de RAL-code in van de kleur die je wilt.' : '';
    }
    default: return '';
  }
}
function go(i) {
  if (i > state.step) for (let k = state.step; k < i; k++) { const e = stepError(k); if (e) { showError(e); return; } }
  maxStep = Math.max(maxStep, i);
  set(s => { s.step = Math.max(0, Math.min(STEPS.length - 1, i)); });
  $('.cfg-panel__body').scrollTop = 0;
  const top = $('#configurator').getBoundingClientRect().top;
  if (top < -40 || top > innerHeight * 0.5) $('#configurator').scrollIntoView({ behavior: 'smooth' });
}
function showError(msg) {
  const el = $('.cfg-error');
  el.textContent = msg;
  el.hidden = false;
  el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }], { duration: 260 });
}

/* ---------- rendering ---------- */
const body = $('.cfg-panel__body');
function render() {
  const s = state, step = STEPS[s.step];
  $('.cfg-error').hidden = true;
  $('.cfg-step-no').textContent = `Stap ${s.step + 1} van ${STEPS.length}`;
  $('.cfg-title').textContent = step.title;
  $('.cfg-sub').textContent = step.id === 'posities' && isLoose(s.stair.type) ? 'Hoeveel losse, rechte leuningen heb je nodig?' : step.id === 'posities' && s.stair.type && innerWidth < 960 ? 'Tik op de gewenste plekken in het 3D-model, of kies ze hieronder.' : step.sub;
  if (step.id === 'posities' && isLoose(s.stair.type)) $('.cfg-title').textContent = 'Hoeveel leuningen?';
  body.innerHTML = VIEWS[step.id](s);
  renderNav();
  renderPrice();
  if (step.id === 'aanvraag') {
    // keep the quote total, place name and photo list fresh on the request step
    renderPhotos();
    if (s.customer.postcode && s.km == null) onPostcode(s.customer.postcode); else quoteTotal();
  }
}
function renderNav() {
  const s = state;
  $$('.cfg-progress li').forEach((li, i) => {
    li.classList.toggle('is-done', i < s.step);
    li.classList.toggle('is-current', i === s.step);
    li.querySelector('button').disabled = i > maxStep;
  });
  $('.cfg-back').hidden = s.step === 0;
  const next = $('.cfg-next');
  next.hidden = STEPS[s.step].id === 'aanvraag';
  next.textContent = STEPS[s.step].id === 'overzicht' ? 'Gegevens invullen' : 'Volgende';
}
function renderPrice() {
  const el = $('.cfg-price');
  const s = state, step = STEPS[s.step].id;
  const show = PRICING.showToCustomer && s.rails.length && ['lengte', 'vorm', 'kleur', 'overzicht', 'aanvraag'].includes(step);
  if (!show) { el.hidden = true; return; }
  const p = calculate(s, { withDelivery: step === 'aanvraag' });
  el.hidden = false;
  el.innerHTML = p.status === 'indicatie'
    ? `<span>Indicatie${step === 'aanvraag' ? ' totaal' : ''}</span><strong>${euro(p.total)}</strong><small>${PRICING.inclBtw ? 'incl. btw' : 'excl. btw'}</small>`
    : `<span>Prijs</span><strong>Op aanvraag</strong>`;
}

const badge = n => `<span class="badge">${n}</span>`;
const VIEWS = {
  trap(s) {
    const t = typeOf(s.stair.type);
    return `
      <div class="types" data-dir="${s.stair.dir}">
        ${STAIR_TYPES.map(x => `<button type="button" class="type${x.turn ? ' type--turn' : ''}${s.stair.type === x.id ? ' is-on' : ''}" data-action="type" data-id="${x.id}" aria-pressed="${s.stair.type === x.id}"><span class="type__icon">${ICONS[x.id]}</span><span class="type__name">${x.name}</span></button>`).join('')}
      </div>
      ${t?.turn ? `<div class="seg" role="group" aria-label="Draairichting"><span class="seg__label">Draairichting</span>
        <button type="button" data-action="dir" data-id="links" class="${s.stair.dir === 'links' ? 'is-on' : ''}" aria-pressed="${s.stair.dir === 'links'}">Linksom</button>
        <button type="button" data-action="dir" data-id="rechts" class="${s.stair.dir === 'rechts' ? 'is-on' : ''}" aria-pressed="${s.stair.dir === 'rechts'}">Rechtsom</button></div>
        <p class="fine">Linksom: je draait naar links als je naar boven loopt.</p>` : ''}
      ${s.stair.type === 'anders' ? `<p class="note">Maatwerk. We tonen losse, rechte leuningen. Beschrijf je trap in de laatste stap en voeg foto's toe; wij denken mee.</p>` : ''}
      <button type="button" class="link quick" data-action="quick">Ik weet al welke leuning ik nodig heb →</button>`;
  },
  '3d'(s) {
    return `
      <p class="lead">${isLoose(s.stair.type) ? 'Losse, rechte leuningen op een wand.' : `Dit is een ${esc(typeOf(s.stair.type)?.name.toLowerCase())}${typeOf(s.stair.type)?.turn ? `, ${s.stair.dir}om` : ''}.`} Sleep om te draaien, knijp of scroll om te zoomen.</p>
      <div class="seg" role="group" aria-label="Standpunt">
        <button type="button" data-action="view" data-id="perspectief">Perspectief</button>
        <button type="button" data-action="view" data-id="boven">Bovenaanzicht</button>
        <button type="button" data-action="view" data-id="zij">Zijaanzicht</button>
      </div>
      <p class="fine">Schematisch model: de vorm klopt, de exacte maten van jouw woning niet.</p>`;
  },
  posities(s) {
    if (isLoose(s.stair.type)) return `
      <div class="stepper" role="group" aria-label="Aantal leuningen">
        <button type="button" data-action="count" data-d="-1" aria-label="Eén leuning minder" ${s.rails.length <= 1 ? 'disabled' : ''}>−</button>
        <output>${s.rails.length} ${s.rails.length === 1 ? 'leuning' : 'leuningen'}</output>
        <button type="button" data-action="count" data-d="1" aria-label="Eén leuning meer" ${s.rails.length >= 8 ? 'disabled' : ''}>+</button>
      </div>
      <p class="note">Elke VALIER-leuning is recht. Je vult straks per leuning de lengte in.</p>`;
    const nums = Object.fromEntries(numbered(s).map(r => [r.pos, r.nr]));
    return `
      <ul class="positions">
        ${candidates(s).map(c => `<li><button type="button" class="pos${nums[c.id] ? ' is-on' : ''}" data-action="pos" data-id="${c.id}" aria-pressed="${!!nums[c.id]}">${nums[c.id] ? badge(nums[c.id]) : '<span class="badge badge--empty">+</span>'}<span>${esc(c.label)}</span></button></li>`).join('')}
      </ul>
      <p class="note">VALIER-leuningen zijn altijd recht. Om een hoek komt per stuk wand een aparte leuning. Wil je een doorlopende of gebogen leuning? Dat is maatwerk: zet het bij je opmerkingen.</p>`;
  },
  lengte(s) {
    const cm = s.unit === 'cm';
    const total = s.rails.reduce((a, r) => a + (lenOk(r.lengthMm) ? r.lengthMm : 0), 0);
    return `
      <div class="lenhead">
        <div class="seg seg--sm" role="group" aria-label="Eenheid"><button type="button" data-action="unit" data-id="mm" class="${!cm ? 'is-on' : ''}">mm</button><button type="button" data-action="unit" data-id="cm" class="${cm ? 'is-on' : ''}">cm</button></div>
        <button type="button" class="link" data-action="howto">Hoe meet ik mijn trapleuning?</button>
      </div>
      <div class="lens">
        ${numbered(s).map(r => {
          const est = isLoose(s.stair.type) ? null : candLen(s, r.pos);
          const val = r.lengthMm ? (cm ? r.lengthMm / 10 : r.lengthMm) : '';
          return `<div class="len" data-pos="${r.pos}">
            ${badge(r.nr)}
            <label for="len-${r.pos}"><span>${esc(posLabel(s, r.pos))}</span>${est ? `<small>In het model ca. ${Math.round(est / 10) * 10} mm</small>` : ''}</label>
            <span class="len__field"><input id="len-${r.pos}" type="text" inputmode="numeric" autocomplete="off" data-action="len" data-pos="${r.pos}" value="${val}" placeholder="${est ? (cm ? Math.round(est / 100) * 10 : Math.round(est / 100) * 100) : (cm ? 220 : 2200)}" ${s.lengthsUnknown ? 'disabled' : ''} aria-describedby="warn-${r.pos}"><span>${cm ? 'cm' : 'mm'}</span></span>
            <p class="len__warn" id="warn-${r.pos}" hidden></p>
          </div>`;
        }).join('')}
      </div>
      <label class="check"><input type="checkbox" data-action="unknown" ${s.lengthsUnknown ? 'checked' : ''}><span>Ik weet de maten nog niet. VALIER komt inmeten.</span></label>
      <p class="total">Totale lengte <strong class="js-total-len">${total ? total.toLocaleString('nl-NL') + ' mm' : '—'}</strong></p>`;
  },
  vorm(s) {
    const cur = SIZES[s.profile] || SIZES['50x30'];
    return `
      <div class="forms">
        ${PROFILE_FORMS.map(f => `<button type="button" class="form-card${cur.form === f.id ? ' is-on' : ''}" data-action="form" data-id="${f.id}" aria-pressed="${cur.form === f.id}"><span class="form-card__icon">${PROFILE_ICONS[f.id] || ''}</span><span>${f.name}</span></button>`).join('')}
      </div>
      <div class="chips" role="group" aria-label="Profielmaat">
        ${PROFILE_FORMS.find(f => f.id === cur.form).sizes.map(z => `<button type="button" class="chip${s.profile === z.id ? ' is-on' : ''}" data-action="size" data-id="${z.id}">${z.name}</button>`).join('')}
      </div>
      ${s.rails.length > 1 ? applyToggle('profile', s.apply.profile) : ''}
      ${s.apply.profile === 'per' ? `<div class="per">${numbered(s).map(r => `<label class="per__row">${badge(r.nr)}<span>${esc(posLabel(s, r.pos))}</span>
        <select data-action="rail-profile" data-pos="${r.pos}">${PROFILE_FORMS.map(f => `<optgroup label="${f.name}">${f.sizes.map(z => `<option value="${z.id}" ${S.railProfile(s, r) === z.id ? 'selected' : ''}>${f.name} ${z.name}</option>`).join('')}</optgroup>`).join('')}</select></label>`).join('')}</div>` : ''}
      <p class="fine">Het 3D-model toont de echte doorsnede: rechthoekig ligt plat, 50 mm breed.</p>`;
  },
  kleur(s) {
    return `
      <div class="swatches">
        ${COLORS.map(c => `<button type="button" class="sw${s.color === c.id ? ' is-on' : ''}" data-action="color" data-id="${c.id}" aria-pressed="${s.color === c.id}"><i style="background:${c.swatch || c.hex}"></i><span>${c.name}</span>${c.ral ? `<small>${c.ral}</small>` : c.custom ? '<small>Op aanvraag</small>' : ''}</button>`).join('')}
      </div>
      ${s.apply.color === 'all' && s.color === 'ral' ? `<label class="field"><span>RAL-code</span><input type="text" data-action="ral" value="${esc(s.ral)}" placeholder="bijv. RAL 7016"></label>` : ''}
      ${s.rails.length > 1 ? applyToggle('color', s.apply.color) : ''}
      ${s.apply.color === 'per' ? `<div class="per">${numbered(s).map(r => `<label class="per__row">${badge(r.nr)}<span>${esc(posLabel(s, r.pos))}</span>
        <select data-action="rail-color" data-pos="${r.pos}">${COLORS.map(c => `<option value="${c.id}" ${S.railColor(s, r) === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}</select>
        ${S.railColor(s, r) === 'ral' ? `<input class="per__ral" type="text" data-action="rail-ral" data-pos="${r.pos}" value="${esc(r.ral || '')}" placeholder="RAL-code">` : ''}</label>`).join('')}</div>` : ''}
      <p class="fine">Kleuren op een scherm zijn indicatief. De definitieve kleur en afwerking bevestigen we in de offerte.</p>`;
  },
  overzicht(s) {
    const t = typeOf(s.stair.type);
    const total = s.rails.reduce((a, r) => a + (lenOk(r.lengthMm) ? r.lengthMm : 0), 0);
    const edit = (old, txt = 'Wijzig') => { const id = { 2: 'posities', 3: 'lengte', 4: 'vorm', 5: 'kleur' }[old]; return `<button type="button" class="link link--sm" data-action="goto" data-step="${STEPS.findIndex(x => x.id === id)}">${txt}</button>`; };
    return `
      <dl class="ov">
        <div><dt>Aantal leuningen</dt><dd>${s.rails.length}</dd>${edit(2)}</div>
        <div><dt>Bevestiging</dt><dd>${MOUNTING.name}</dd></div>
        <div><dt>Totale lengte</dt><dd>${s.lengthsUnknown ? 'Wordt ingemeten' : total.toLocaleString('nl-NL') + ' mm'}</dd>${edit(3)}</div>
      </dl>
      <ol class="rails">
        ${numbered(s).map(r => `<li class="rail">
          <div class="rail__head">${badge(r.nr)}<strong>${esc(posLabel(s, r.pos))}</strong></div>
          <dl>
            <div><dt>Lengte</dt><dd>${s.lengthsUnknown ? 'Inmeten' : r.lengthMm.toLocaleString('nl-NL') + ' mm'}</dd>${edit(3)}</div>
            <div><dt>Profiel</dt><dd>${SIZES[S.railProfile(s, r)].formName} ${SIZES[S.railProfile(s, r)].name}</dd>${edit(4)}</div>
            <div><dt>Kleur</dt><dd>${colorOf(S.railColor(s, r)).name}${S.railColor(s, r) === 'ral' ? ' ' + esc(S.railRal(s, r)) : ''}</dd>${edit(5)}</div>
          </dl>
        </li>`).join('')}
      </ol>
      <p class="fine">Je maten zijn voorlopig. Wij controleren ze voordat we een offerte maken.</p>`;
  },
  aanvraag(s) {
    const c = s.customer;
    return `
      <form class="quote" id="quote" method="POST" action="${QUOTE.endpoint}" enctype="multipart/form-data" novalidate>
        <div class="fields">
          <label class="field"><span>Naam</span><input name="Naam" id="q-naam" value="${esc(c.naam)}" required autocomplete="name"></label>
          <label class="field"><span>E-mailadres</span><input name="E-mail" id="q-email" type="email" value="${esc(c.email)}" required autocomplete="email"></label>
          <label class="field"><span>Telefoonnummer</span><input name="Telefoon" id="q-tel" type="tel" value="${esc(c.telefoon)}" required autocomplete="tel"></label>
          <label class="field"><span>Postcode</span><input name="Postcode" id="q-pc" value="${esc(c.postcode)}" required autocomplete="postal-code" maxlength="7"><small class="js-plaats">${esc(c.plaats)}</small></label>
        </div>
        <fieldset class="deliv"><legend>Hoe wil je de leuningen ontvangen?</legend>
          ${DELIVERY.map(d => `<label class="deliv__opt"><input type="radio" name="Leverwijze" value="${d.id}" ${s.delivery === d.id ? 'checked' : ''} data-action="delivery"><span><b>${d.name}</b><small>${d.sub}</small></span></label>`).join('')}
        </fieldset>
        <div class="upload">
          <p class="upload__title">Foto's van je trap <small>optioneel, max. ${QUOTE.maxPhotos} foto's, samen max. 10 MB</small></p>
          <p class="fine">Handig: een overzichtsfoto van de trap, de muur waar de leuning komt, en details van hoeken of obstakels.</p>
          <label class="upload__btn"><input type="file" id="q-photos" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple>Foto's kiezen</label>
          <ul class="photos js-photos"></ul>
          <p class="len__warn js-photo-err" hidden></p>
        </div>
        <label class="field field--area"><span>Opmerkingen</span><textarea name="Opmerkingen" id="q-notes" rows="3" placeholder="Bijv. bijzonderheden van je trap of muur">${esc(s.notes)}</textarea></label>
        <div class="quote__total js-quote-total"></div>
        <div class="hp" aria-hidden="true"><input type="text" name="_honey" tabindex="-1" autocomplete="off"></div>
        <div class="js-hidden"></div>
        <button type="submit" class="btn btn--solid btn--wide">Vraag jouw offerte aan</button>
        <p class="fine">Vrijblijvend. Wij controleren je maten en situatie en sturen je daarna een offerte. Een bestelling is pas definitief na jouw akkoord.</p>
      </form>`;
  }
};
const applyToggle = (what, val) => `<div class="seg seg--sm" role="group" aria-label="Toepassen"><button type="button" data-action="apply-${what}" data-id="all" class="${val === 'all' ? 'is-on' : ''}">Alle leuningen</button><button type="button" data-action="apply-${what}" data-id="per" class="${val === 'per' ? 'is-on' : ''}">Per leuning</button></div>`;

/* ---------- events ---------- */
body.addEventListener('click', e => {
  const b = e.target.closest('[data-action]');
  if (!b || b.tagName === 'INPUT' || b.tagName === 'SELECT') return;
  const a = b.dataset.action, id = b.dataset.id;
  if (a === 'type') chooseType(id);
  if (a === 'dir') chooseDir(id);
  if (a === 'quick') quickRoute();
  if (a === 'pos') toggleRail(id);
  if (a === 'count') setLooseCount(state.rails.length + +b.dataset.d);
  if (a === 'unit') set(s => { s.unit = id; });
  if (a === 'howto') $('#howto').showModal();
  if (a === 'form') set(s => { const f = PROFILE_FORMS.find(x => x.id === id); if (SIZES[s.profile].form !== id) s.profile = f.sizes[0].id; });
  if (a === 'size') set(s => { s.profile = id; });
  if (a === 'apply-profile') set(s => { s.apply.profile = id; if (id === 'per') s.rails.forEach(r => (r.profile = r.profile || s.profile)); });
  if (a === 'color') set(s => { s.color = id; });
  if (a === 'apply-color') set(s => { s.apply.color = id; if (id === 'per') s.rails.forEach(r => (r.color = r.color || s.color)); });
  if (a === 'goto') go(+b.dataset.step);
});
body.addEventListener('input', e => {
  const t = e.target, a = t.dataset.action;
  if (a === 'len') {
    const raw = t.value.replace(/[^\d.,]/g, '').replace(',', '.');
    const n = raw ? parseFloat(raw) * (state.unit === 'cm' ? 10 : 1) : NaN;
    const mm = Number.isFinite(n) ? Math.round(n) : null;
    set(s => { const r = s.rails.find(x => x.pos === t.dataset.pos); r.lengthMm = mm; }, { rerender: false });
    lengthFeedback(t.dataset.pos, false);
    updateTotalLen();
  }
  if (a === 'ral') set(s => { s.ral = t.value; }, { rerender: false });
  if (a === 'rail-ral') set(s => { s.rails.find(x => x.pos === t.dataset.pos).ral = t.value; }, { rerender: false });
  if (t.id === 'q-naam' || t.id === 'q-email' || t.id === 'q-tel') {
    const key = { 'q-naam': 'naam', 'q-email': 'email', 'q-tel': 'telefoon' }[t.id];
    set(s => { s.customer[key] = t.value; }, { rerender: false });
    t.closest('.field').classList.remove('is-invalid');
  }
  if (t.id === 'q-notes') set(s => { s.notes = t.value; }, { rerender: false });
  if (t.id === 'q-pc') { t.closest('.field').classList.remove('is-invalid'); onPostcode(t.value); }
});
body.addEventListener('input', () => { $('.cfg-error').hidden = true; });
body.addEventListener('click', e => { if (e.target.closest('[data-action]')) $('.cfg-error').hidden = true; }, true);
body.addEventListener('focusout', e => { if (e.target.dataset?.action === 'len') lengthFeedback(e.target.dataset.pos, true); });
body.addEventListener('change', e => {
  const t = e.target, a = t.dataset.action;
  if (a === 'unknown') set(s => { s.lengthsUnknown = t.checked; });
  if (a === 'rail-profile') set(s => { s.rails.find(x => x.pos === t.dataset.pos).profile = t.value; });
  if (a === 'rail-color') set(s => { s.rails.find(x => x.pos === t.dataset.pos).color = t.value; });
  if (a === 'delivery') { set(s => { s.delivery = t.value; }, { rerender: false }); quoteTotal(); }
  if (t.id === 'q-photos') addPhotos(t.files);
});
body.addEventListener('submit', e => { if (e.target.id === 'quote') { e.preventDefault(); submitQuote(e.target); } });

function lengthFeedback(pos, final) {
  const r = state.rails.find(x => x.pos === pos);
  const warn = $(`#warn-${CSS.escape(pos)}`);
  const field = $(`#len-${CSS.escape(pos)}`)?.closest('.len');
  if (!warn || !r) return;
  let msg = '', bad = false;
  if (r.lengthMm == null) { if (final && $(`#len-${CSS.escape(pos)}`).value.trim()) { msg = 'Vul alleen cijfers in.'; bad = true; } }
  else if (!lenOk(r.lengthMm)) { if (final || r.lengthMm > LIMITS.maxMm) { msg = r.lengthMm > LIMITS.maxMm ? `Langer dan ${LIMITS.maxMm / 1000} meter? Zet het bij je opmerkingen; dan nemen wij contact op.` : `Een leuning is minimaal ${LIMITS.minMm} mm.`; bad = true; } }
  else if (!isLoose(state.stair.type)) {
    const est = candLen(state, pos);
    if (est && Math.abs(r.lengthMm / est - 1) > LIMITS.warnDeviation) msg = `Dit wijkt flink af van het model (ca. ${Math.round(est / 10) * 10} mm). Dat kan kloppen; wij controleren je maten altijd.`;
  }
  warn.textContent = msg;
  warn.hidden = !msg;
  field?.classList.toggle('is-invalid', bad);
}
function updateTotalLen() {
  const el = $('.js-total-len');
  if (!el) return;
  const total = state.rails.reduce((a, r) => a + (lenOk(r.lengthMm) ? r.lengthMm : 0), 0);
  el.textContent = total ? total.toLocaleString('nl-NL') + ' mm' : '—';
}

/* ---------- postcode → distance ---------- */
let pc4 = null, pc4Loading = null;
const loadPc4 = () => pc4Loading || (pc4Loading = fetch('data/pc4.json').then(r => r.json()).then(d => (pc4 = d)).catch(() => null));
const haversine = (a, b) => { const R = 6371, rad = x => (x * Math.PI) / 180; const dLat = rad(b[0] - a[0]), dLon = rad(b[1] - a[1]); const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
let pcTimer = null;
function onPostcode(raw) {
  set(s => { s.customer.postcode = raw.toUpperCase(); }, { rerender: false });
  clearTimeout(pcTimer);
  pcTimer = setTimeout(async () => {
    const m = raw.replace(/\s+/g, '').match(/^(\d{4})([a-z]{2})?$/i);
    let km = null, plaats = '';
    if (m) {
      await loadPc4();
      const here = pc4 && pc4[m[1]], from = pc4 && pc4[PRICING.workshop.postcode];
      if (here && from) { km = Math.max(1, Math.round(haversine(from, here) * PRICING.roadFactor)); plaats = here[2]; }
    }
    set(s => { s.km = km; s.customer.plaats = plaats; }, { rerender: false });
    const el = $('.js-plaats');
    if (el) el.textContent = plaats || (m ? 'Onbekende postcode' : '');
    quoteTotal();
  }, 250);
}
function quoteTotal() {
  const el = $('.js-quote-total');
  if (!el) return;
  renderPrice();
  if (!PRICING.showToCustomer) { el.innerHTML = ''; return; }
  const p = calculate(state, { withDelivery: true });
  el.innerHTML = p.status === 'indicatie'
    ? `<span>Indicatieprijs</span><strong>${euro(p.total)}</strong><small>${PRICING.inclBtw ? 'incl. btw' : 'excl. btw'}, inclusief ${state.delivery === 'montage' ? 'montage en reiskosten' : state.delivery === 'bezorgen' ? 'bezorging' : 'afhalen in Ulft'}</small>`
    : `<span>Prijs</span><strong>Op aanvraag</strong><small>${state.km == null && state.delivery !== 'afhalen' ? 'Vul je postcode in voor een indicatie.' : 'Je ontvangt de prijs in je offerte.'}</small>`;
}

/* ---------- photos ---------- */
let photos = []; // { file, rail }
function addPhotos(list) {
  const err = $('.js-photo-err');
  let msg = '';
  for (const f of list) {
    if (photos.length >= QUOTE.maxPhotos) { msg = `Maximaal ${QUOTE.maxPhotos} foto's.`; break; }
    const typeOk = QUOTE.photoTypes.includes(f.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name);
    if (!typeOk) { msg = `${f.name} is geen foto (jpg, png, webp of heic).`; continue; }
    const totalBytes = photos.reduce((a, p) => a + p.file.size, 0) + f.size;
    if (totalBytes > QUOTE.maxTotalBytes) { msg = "Samen meer dan 10 MB. Kies minder of kleinere foto's."; continue; }
    photos.push({ file: f, rail: '' });
  }
  err.textContent = msg; err.hidden = !msg;
  $('#q-photos').value = '';
  renderPhotos();
}
function renderPhotos() {
  const ul = $('.js-photos');
  if (!ul) return;
  ul.innerHTML = photos.map((p, i) => `<li><span class="photos__name">${esc(p.file.name)}</span><select data-photo="${i}" aria-label="Hoort bij"><option value="">Algemeen</option>${numbered(state).map(r => `<option value="${r.nr}" ${p.rail == r.nr ? 'selected' : ''}>Leuning ${r.nr}</option>`).join('')}</select><button type="button" class="link link--sm" data-remove="${i}">Verwijder</button></li>`).join('');
}
body.addEventListener('click', e => { const b = e.target.closest('[data-remove]'); if (b) { photos.splice(+b.dataset.remove, 1); renderPhotos(); } });
body.addEventListener('change', e => { const sel = e.target.closest('[data-photo]'); if (sel) photos[+sel.dataset.photo].rail = sel.value; });

/* ---------- request ---------- */
function requestId() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `VAL-${ymd}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
function buildRequest(s, id) {
  const p = calculate(s, { withDelivery: true });
  return {
    id, createdAt: new Date().toISOString(), status: 'ingediend', type: 'offerteaanvraag',
    customer: { ...s.customer },
    delivery: s.delivery,
    stair: { type: s.stair.type, name: s.stair.type === 'los' ? 'Losse leuningen' : typeOf(s.stair.type)?.name, direction: typeOf(s.stair.type)?.turn ? s.stair.dir : null },
    rails: numbered(s).map(r => ({
      nr: r.nr, positionId: r.pos, position: posLabel(s, r.pos),
      lengthMm: s.lengthsUnknown ? null : r.lengthMm, modelLengthMm: isLoose(s.stair.type) ? null : candLen(s, r.pos),
      profile: { form: SIZES[S.railProfile(s, r)].form, size: S.railProfile(s, r), label: `${SIZES[S.railProfile(s, r)].formName} ${SIZES[S.railProfile(s, r)].name}` },
      color: { id: S.railColor(s, r), name: colorOf(S.railColor(s, r)).name, ral: S.railColor(s, r) === 'ral' ? S.railRal(s, r) : colorOf(S.railColor(s, r)).ral },
      mounting: MOUNTING.id
    })),
    totals: { rails: s.rails.length, lengthMm: s.lengthsUnknown ? null : s.rails.reduce((a, r) => a + (r.lengthMm || 0), 0), lengthsUnknown: s.lengthsUnknown },
    distanceKm: s.km,
    photos: photos.map(ph => ({ name: ph.file.name, rail: ph.rail ? +ph.rail : null })),
    notes: s.notes,
    pricing: { status: p.status, currency: 'EUR', inclBtw: PRICING.inclBtw, total: p.status === 'indicatie' ? p.total : null, lines: p.lines, reasons: p.reasons }
  };
}
function submitQuote(form) {
  let first = null;
  for (const id of ['q-naam', 'q-email', 'q-tel', 'q-pc']) {
    const inp = $('#' + id);
    const bad = !inp.value.trim() || !inp.checkValidity() || (id === 'q-pc' && !/^\d{4}\s?[a-z]{2}$/i.test(inp.value.trim()));
    inp.closest('.field').classList.toggle('is-invalid', bad);
    if (bad && !first) first = inp;
  }
  if (first) { first.focus(); showError('Vul de gemarkeerde velden in. Postcode als 1234 AB.'); return; }
  const id = requestId();
  const req = buildRequest(state, id);
  try { localStorage.setItem('valier-laatste-aanvraag', JSON.stringify(req)); } catch { /* ignore */ }
  if (DEMO) { showConfirmation(req); return; }

  // Hidden fields for the e-mail to VALIER (readable table + full structured data)
  const hidden = $('.js-hidden', form);
  const next = location.origin + location.pathname + `?aanvraag=${id}#configurator`;
  const fields = {
    _subject: `Offerteaanvraag ${id}: ${req.customer.naam}, ${req.customer.plaats || req.customer.postcode}`,
    _template: 'table', _captcha: 'false', _next: next,
    Aanvraagnummer: id,
    Plaats: req.customer.plaats,
    Traptype: `${req.stair.name}${req.stair.direction ? ', ' + req.stair.direction + 'om' : ''}`,
    'Aantal leuningen': req.rails.length,
    Leuningen: req.rails.map(r => `${r.nr}. ${r.position}: ${r.lengthMm ? r.lengthMm + ' mm' : 'inmeten'}, ${r.profile.label}, ${r.color.name}${r.color.ral ? ' ' + r.color.ral : ''}`).join(' | '),
    Bevestiging: MOUNTING.name,
    'Afstand vanaf Ulft': req.distanceKm == null ? 'onbekend' : `ca. ${req.distanceKm} km`,
    "Foto's": req.photos.map(p => `${p.name}${p.rail ? ' → leuning ' + p.rail : ''}`).join(', ') || 'geen',
    'Prijs (intern)': req.pricing.status === 'indicatie' ? `€ ${req.pricing.total} ${req.pricing.inclBtw ? 'incl.' : 'excl.'} btw` : 'op aanvraag: ' + req.pricing.reasons.join('; '),
    'Prijsopbouw (intern)': req.pricing.lines.map(l => `${l.label} = € ${Math.round(l.amount)}`).join(' | '),
    Configuratie: JSON.stringify(req)
  };
  hidden.innerHTML = Object.entries(fields).map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`).join('');
  // one file input per photo, so each arrives as its own attachment
  photos.forEach((p, i) => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.name = `attachment${i + 1}`; inp.hidden = true;
    try { const dt = new DataTransfer(); dt.items.add(p.file); inp.files = dt.files; hidden.appendChild(inp); } catch { /* old browser: photos can be e-mailed */ }
  });
  form.querySelector('[type=submit]').disabled = true;
  form.querySelector('[type=submit]').textContent = 'Bezig met versturen…';
  form.submit();
}
function showConfirmation(req) {
  $('.cfg').classList.add('is-confirmed');
  body.innerHTML = `
    <div class="done">
      <p class="eyebrow">Aanvraag ontvangen</p>
      <h3>Bedankt${req?.customer?.naam ? ', ' + esc(req.customer.naam.split(' ')[0]) : ''}.</h3>
      <p>Je aanvraagnummer is <strong>${esc(req?.id || params.get('aanvraag'))}</strong>. ${DEMO ? 'Dit is een demo: er is niets verstuurd.' : `Je ontvangt binnenkort een reactie van ${QUOTE.email}.`}</p>
      ${req ? `<ol class="rails rails--compact">${req.rails.map(r => `<li>${badge(r.nr)}<span>${esc(r.position)}</span><span>${r.lengthMm ? r.lengthMm.toLocaleString('nl-NL') + ' mm' : 'inmeten'} · ${esc(r.profile.label)} · ${esc(r.color.name)}${r.color.ral ? ' ' + esc(r.color.ral) : ''}</span></li>`).join('')}</ol>` : ''}
      <h4>Wat gebeurt er nu?</h4>
      <ol class="next-steps"><li>Wij controleren je maten en situatie.</li><li>Je ontvangt een offerte per e-mail.</li><li>Na jouw akkoord maken wij je leuningen op maat.</li></ol>
      <button type="button" class="btn" data-action="restart">Nieuwe configuratie</button>
    </div>`;
  $('.cfg-title').textContent = 'Jouw aanvraag';
  $('.cfg-sub').textContent = '';
  $('.cfg-step-no').textContent = '';
  $('.cfg-nav').hidden = true;
  $('.cfg-price').hidden = true;
}
body.addEventListener('click', e => { if (e.target.closest('[data-action="restart"]')) { S.reset(); state = S.get(); photos = []; maxStep = 0; $('.cfg').classList.remove('is-confirmed'); $('.cfg-nav').hidden = false; history.replaceState(null, '', location.pathname + '#configurator'); syncViewer(); render(); } });

/* ---------- nav & progress ---------- */
$('.cfg-progress').innerHTML = STEPS.map((st, i) => `<li><button type="button" data-goto="${i}"><span class="dot"></span><span class="lbl">${st.short}</span></button></li>`).join('');
$('.cfg-progress').addEventListener('click', e => { const b = e.target.closest('[data-goto]'); if (b && !b.disabled) go(+b.dataset.goto); });
$('.cfg-next').addEventListener('click', () => go(state.step + 1));
$('.cfg-back').addEventListener('click', () => go(state.step - 1));
$$('[data-start]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); quickRoute(); }));

// Mobile: bottom nav only while the configurator is on screen
const cfg = $('.cfg');
new IntersectionObserver(([en]) => document.body.classList.toggle('cfg-in-view', en.isIntersecting), { threshold: 0.15 }).observe(cfg);

/* ---------- photo lightbox (hero) ---------- */
const box = $('#lightbox');
if (box?.showModal) {
  const img = $('img', box), cap = $('.lb-cap', box);
  let list = PHOTOS, at = 0;
  const show = i => { at = (i + list.length) % list.length; img.src = `assets/photos/${list[at].id}.jpg`; img.alt = list[at].alt; cap.textContent = `${list[at].cap}  ·  ${at + 1} / ${list.length}`; };
  $$('[data-lightbox]').forEach(b => b.addEventListener('click', () => { const i = PHOTOS.findIndex(p => p.id === b.dataset.lightbox); show(Math.max(0, i)); box.showModal(); }));
  $('.lb-close', box).addEventListener('click', () => box.close());
  $('.lb-prev', box).addEventListener('click', () => show(at - 1));
  $('.lb-next', box).addEventListener('click', () => show(at + 1));
  box.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') show(at - 1); if (e.key === 'ArrowRight') show(at + 1); });
  let sx = null;
  box.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(at + (dx < 0 ? 1 : -1)); sx = null; });
  box.addEventListener('click', e => { if (e.target === box) box.close(); });
}
$$('[data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));

/* ---------- start ---------- */
// Test/share hooks: ?type=kwart&dir=rechts&rails=v1-r,d1-a&step=2
if (params.get('type') && (typeOf(params.get('type')) || params.get('type') === 'los')) {
  S.update(s => {
    s.stair.type = params.get('type'); s.stair.dir = params.get('dir') === 'rechts' ? 'rechts' : 'links';
    if (params.get('rails')) s.rails = params.get('rails').split(',').map((p, i) => ({ pos: p, lengthMm: params.get('len') ? +params.get('len').split(',')[i] || null : null }));
    if (params.get('step')) s.step = +params.get('step');
    if (params.get('profile') && SIZES[params.get('profile')]) s.profile = params.get('profile');
    if (params.get('color') && COLORS.some(c => c.id === params.get('color'))) s.color = params.get('color');
  });
  state = S.get();
}
maxStep = Math.max(maxStep, state.step);
syncViewer();
for (let k = 0; k < state.step; k++) if (stepError(k)) { state.step = k; break; }
window.valier = { get: () => S.get(), set, go, toggleRail, STEPS, buildRequest: () => buildRequest(S.get(), 'TEST') };
if (params.get('aanvraag')) {
  let req = null;
  try { req = JSON.parse(localStorage.getItem('valier-laatste-aanvraag')); } catch { /* ignore */ }
  render();
  showConfirmation(req && req.id === params.get('aanvraag') ? req : { id: params.get('aanvraag'), rails: [] });
} else render();
