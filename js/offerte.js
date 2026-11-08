/* =========================================================
   VALIER — offerteformulier (één pagina)
   Eén status-object → formulier, overzicht en prijs worden samen bijgewerkt.
   Keuzes blijven bewaard in de browser.
   ========================================================= */
import { PROFILE_FORMS, COLORS, DELIVERY, LIMITS, PRICING, QUOTE, MOUNTING } from './catalog.js';
import { calculate, euro } from './pricing.js';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const DEMO = window.VALIER_DEMO === true;
const KEY = 'valier-offerte-v1';

const SIZES = PROFILE_FORMS.flatMap(f => f.sizes.map(z => ({ ...z, form: f.id, label: f.id === 'rond' ? `Rond ${z.name}` : `Rechthoekig ${z.name}` })));
const PHOTO = { '50x30': 'koker-diagonaal', '50x20': 'eindkap', r50: 'rond-trap' };
const NOTE = { '50x30': 'Meest gekozen', '50x20': 'Slanker profiel', r50: 'Klassiek rond' };
const sizeOf = id => SIZES.find(z => z.id === id) || SIZES[0];
const colorOf = id => COLORS.find(c => c.id === id) || COLORS[0];

/* ---------- state ---------- */
const fresh = () => ({ profile: '50x30', color: 'zwart', ral: '', rails: [{ mm: null }], unknown: false, delivery: 'montage', postcode: '', km: null, plaats: '' });
let st = fresh();
try { st = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch { /* storage blocked */ }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* ignore */ } };

// shape for pricing.js (shared with the earlier configurator)
const pricingState = () => ({
  stair: { type: 'los' }, apply: { profile: 'all', color: 'all' }, profile: st.profile, color: st.color,
  rails: st.rails.map((r, i) => ({ pos: `los-${i + 1}`, lengthMm: r.mm })), lengthsUnknown: st.unknown,
  delivery: st.delivery, km: st.delivery === 'afhalen' ? 0 : st.km
});
const lenOk = mm => Number.isFinite(mm) && mm >= LIMITS.minMm && mm <= LIMITS.maxMm;

/* ---------- static option groups ---------- */
$('[data-group="profile"]').innerHTML = SIZES.map(z => `
  <label class="opt opt--img"><input type="radio" name="Profiel" value="${z.id}">
    <span class="opt__img"><img src="assets/lux/${PHOTO[z.id]}-720.jpg" alt="" width="720" height="960" loading="lazy"></span>
    <span class="opt__txt"><b>${z.label}</b><small>${NOTE[z.id]}</small></span></label>`).join('');
$('[data-group="color"]').innerHTML = COLORS.map(c => `
  <label class="opt opt--sw"><input type="radio" name="Kleur" value="${c.id}"><i style="background:${c.id === 'ral' ? 'conic-gradient(#a33a26,#d0a14a,#2f6b4f,#2c4a7a,#a33a26)' : (c.swatch || c.hex)}"></i><b>${c.id === 'ral' ? 'RAL-kleur' : c.name}</b>${c.custom ? '<small>op aanvraag</small>' : ''}</label>`).join('');
$('[data-group="delivery"]').innerHTML = DELIVERY.map(d => `
  <label class="opt"><input type="radio" name="Leverwijze" value="${d.id}"><span class="opt__txt"><b>${d.name}</b><small>${d.sub}</small></span></label>`).join('');

/* ---------- rails list ---------- */
const railsBox = $('[data-rails]');
function renderRails() {
  railsBox.innerHTML = st.rails.map((r, i) => `
    <div class="rail" data-i="${i}">
      <span class="rail__nr">Leuning ${i + 1}</span>
      <label class="rail__len"><span class="sr">Lengte leuning ${i + 1} in millimeter</span><input type="text" inputmode="numeric" data-len value="${r.mm ?? ''}" placeholder="bijv. 2400" ${st.unknown ? 'disabled' : ''} autocomplete="off"><span>mm</span></label>
      <button type="button" class="rail__del" data-del aria-label="Verwijder leuning ${i + 1}" ${st.rails.length < 2 ? 'disabled' : ''}>×</button>
      <span class="rail__msg" data-msg></span>
    </div>`).join('');
}
railsBox.addEventListener('input', e => {
  const inp = e.target.closest('[data-len]'); if (!inp) return;
  const i = +inp.closest('.rail').dataset.i;
  const digits = inp.value.replace(/[^\d]/g, '');
  if (digits !== inp.value) inp.value = digits;
  st.rails[i].mm = digits ? +digits : null;
  railMsg(i, false); update();
});
railsBox.addEventListener('focusout', e => { const r = e.target.closest('.rail'); if (r) railMsg(+r.dataset.i, true); });
railsBox.addEventListener('click', e => {
  if (!e.target.closest('[data-del]')) return;
  st.rails.splice(+e.target.closest('.rail').dataset.i, 1); renderRails(); update();
});
$('[data-add]').addEventListener('click', () => {
  if (st.rails.length >= 8) return;
  st.rails.push({ mm: null }); renderRails(); update();
  $$('[data-len]').at(-1)?.focus();
});
$('[data-unknown]').addEventListener('change', e => { st.unknown = e.target.checked; renderRails(); update(); });
function railMsg(i, final) {
  const row = railsBox.querySelector(`[data-i="${i}"]`); if (!row) return;
  const mm = st.rails[i].mm, msg = $('[data-msg]', row);
  let text = '';
  if (mm != null && mm > LIMITS.maxMm) text = `Langer dan ${LIMITS.maxMm / 1000} meter? Zet het bij opmerkingen.`;
  else if (final && mm != null && mm < LIMITS.minMm) text = `Minimaal ${LIMITS.minMm} mm.`;
  msg.textContent = text;
  row.classList.toggle('is-invalid', !!text);
}

/* ---------- inputs ---------- */
const form = $('#quote');
form.addEventListener('change', e => {
  const t = e.target;
  if (t.name === 'Profiel') st.profile = t.value;
  if (t.name === 'Kleur') st.color = t.value;
  if (t.name === 'Leverwijze') st.delivery = t.value;
  update();
});
$('.js-ral input').addEventListener('input', e => { st.ral = e.target.value; save(); });

/* ---------- postcode → distance ---------- */
let pc4 = null, loading = null, timer = null;
const loadPc4 = () => loading || (loading = fetch('data/pc4.json').then(r => r.json()).then(d => (pc4 = d)).catch(() => null));
const hav = (a, b) => { const R = 6371, rad = x => x * Math.PI / 180, dLa = rad(b[0] - a[0]), dLo = rad(b[1] - a[1]); const h = Math.sin(dLa / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
const pcInput = $('[data-postcode]');
async function lookup(raw) {
  const m = raw.replace(/\s+/g, '').match(/^(\d{4})([a-z]{2})?$/i);
  st.postcode = raw.toUpperCase(); st.km = null; st.plaats = '';
  let hint = '';
  if (m) {
    await loadPc4();
    const here = pc4?.[m[1]], from = pc4?.[PRICING.workshop.postcode];
    if (here && from) { st.km = Math.max(1, Math.round(hav(from, here) * PRICING.roadFactor)); st.plaats = here[2]; hint = here[2]; const pl = $('[data-plaats]'); if (!pl.value) pl.value = here[2]; }
    else hint = 'Onbekende postcode';
  }
  $('[data-place]').textContent = hint;
  update();
}
pcInput.addEventListener('input', e => { clearTimeout(timer); e.target.closest('.field').classList.remove('is-invalid'); timer = setTimeout(() => lookup(e.target.value), 250); });

/* ---------- photos ---------- */
let photos = [];
$('[data-photos]').addEventListener('change', e => {
  let err = '';
  for (const f of e.target.files) {
    if (photos.length >= QUOTE.maxPhotos) { err = `Maximaal ${QUOTE.maxPhotos} foto's.`; break; }
    if (!(QUOTE.photoTypes.includes(f.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name))) { err = `${f.name} is geen foto.`; continue; }
    if (photos.reduce((a, p) => a + p.size, 0) + f.size > QUOTE.maxTotalBytes) { err = "Samen meer dan 10 MB. Kies minder of kleinere foto's."; continue; }
    photos.push(f);
  }
  e.target.value = '';
  const el = $('[data-photoerr]'); el.textContent = err; el.hidden = !err;
  renderPhotos();
});
function renderPhotos() {
  $('[data-photolist]').innerHTML = photos.map((f, i) => `<li><span>${esc(f.name)}</span><button type="button" data-rm="${i}">Verwijder</button></li>`).join('');
}
$('[data-photolist]').addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (b) { photos.splice(+b.dataset.rm, 1); renderPhotos(); } });

/* ---------- render everything that depends on state ---------- */
function update() {
  save();
  for (const [name, val] of [['Profiel', st.profile], ['Kleur', st.color], ['Leverwijze', st.delivery]]) { const r = form.querySelector(`input[name="${name}"][value="${val}"]`); if (r) r.checked = true; }
  $('.js-ral').hidden = st.color !== 'ral';
  $('[data-unknown]').checked = st.unknown;
  $('.js-pc').hidden = st.delivery === 'afhalen';
  const z = sizeOf(st.profile), c = colorOf(st.color);
  const img = $('[data-sumimg]'), src = `assets/lux/${PHOTO[z.id]}-720.jpg`;
  if (img.getAttribute('src') !== src) { img.src = src; }
  img.alt = `Voorbeeld: ${z.label}`;
  $('[data-sum="profile"]').textContent = z.label;
  $('[data-sum="color"]').innerHTML = `<i class="dot" style="background:${c.swatch || c.hex}"></i>${esc(c.id === 'ral' ? 'RAL-kleur' + (st.ral ? ' ' + st.ral : '') : c.name)}`;
  $('[data-sum="rails"]').textContent = `${st.rails.length} ${st.rails.length === 1 ? 'leuning' : 'leuningen'}`;
  const total = st.rails.reduce((a, r) => a + (lenOk(r.mm) ? r.mm : 0), 0);
  $('[data-sum="length"]').textContent = st.unknown ? 'Wordt ingemeten' : total ? (total / 1000).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' m' : '–';
  $('[data-sum="delivery"]').textContent = (DELIVERY.find(d => d.id === st.delivery)?.name || '') + (st.delivery !== 'afhalen' && st.plaats ? `, ${st.plaats}` : '');
  const allLen = !st.unknown && st.rails.every(r => lenOk(r.mm));
  const p = allLen ? calculate(pricingState(), { withDelivery: true }) : null;
  const priceText = !PRICING.showToCustomer ? 'In je offerte' : p?.status === 'indicatie' ? euro(p.total) : 'Op aanvraag';
  $$('[data-sum="price"]').forEach(el => (el.textContent = priceText));
  $('[data-sum="pricenote"]').textContent = p?.status === 'indicatie'
    ? `Inclusief btw${st.delivery === 'montage' ? ', montage en reiskosten' : st.delivery === 'bezorgen' ? ' en bezorging' : ''}`
    : st.unknown ? 'Na het inmeten ontvang je de prijs' : !allLen ? 'Vul de lengtes in voor een indicatie' : st.color === 'ral' ? 'RAL-kleuren prijzen we op aanvraag' : st.delivery !== 'afhalen' && st.km == null ? 'Vul je postcode in voor een indicatie' : 'Je ontvangt de prijs in je offerte';
}

/* ---------- submit ---------- */
const requestId = () => { const d = new Date(); return `VAL-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`; };
function validate() {
  const errs = [];
  if (!st.unknown) st.rails.forEach((r, i) => { if (!lenOk(r.mm)) { errs.push(`#q-lengtes`); railMsg(i, true); if (r.mm == null) { const row = railsBox.querySelector(`[data-i="${i}"]`); row.classList.add('is-invalid'); $('[data-msg]', row).textContent = 'Vul een lengte in, of vink aan dat we komen inmeten.'; } } });
  if (st.color === 'ral' && !st.ral.trim()) { errs.push('#q-kleur'); $('.js-ral').classList.add('is-invalid'); }
  if (st.delivery !== 'afhalen' && !/^\d{4}\s?[a-z]{2}$/i.test(pcInput.value.trim())) { errs.push('#q-levering'); pcInput.closest('.field').classList.add('is-invalid'); }
  $$('[data-req]').forEach(inp => { const bad = !inp.value.trim() || !inp.checkValidity(); inp.closest('.field').classList.toggle('is-invalid', bad); if (bad) errs.push('#q-gegevens'); });
  return errs;
}
form.addEventListener('submit', e => {
  e.preventDefault();
  const errs = validate(), errEl = $('[data-formerr]');
  if (errs.length) { errEl.textContent = 'Controleer de gemarkeerde velden.'; errEl.hidden = false; $(errs[0]).scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
  errEl.hidden = true;
  const id = requestId(), z = sizeOf(st.profile), c = colorOf(st.color);
  const p = calculate(pricingState(), { withDelivery: true });
  const data = {
    id, createdAt: new Date().toISOString(), status: 'ingediend', type: 'offerteaanvraag',
    customer: { naam: form.Naam.value.trim(), email: form['E-mail'].value.trim(), telefoon: form.Telefoon.value.trim(), postcode: st.postcode, plaats: form.Plaats.value.trim() || st.plaats },
    profile: { id: z.id, label: z.label }, color: { id: c.id, name: c.name, ral: st.color === 'ral' ? st.ral : null },
    rails: st.rails.map((r, i) => ({ nr: i + 1, lengthMm: st.unknown ? null : r.mm })), lengthsUnknown: st.unknown,
    mounting: MOUNTING.id, delivery: st.delivery, distanceKm: st.km, photos: photos.map(f => f.name),
    notes: form.Opmerkingen.value.trim(),
    pricing: { status: p.status, total: p.status === 'indicatie' ? p.total : null, inclBtw: PRICING.inclBtw, lines: p.lines, reasons: p.reasons }
  };
  try { localStorage.setItem('valier-laatste-aanvraag', JSON.stringify(data)); } catch { /* ignore */ }
  if (DEMO) { confirmation(data); return; }
  const hidden = $('.js-hidden');
  const fields = {
    _subject: `Offerteaanvraag ${id}: ${data.customer.naam}, ${data.customer.plaats || data.customer.postcode}`,
    _template: 'table', _captcha: 'false', _next: `${location.origin}${location.pathname}?aanvraag=${id}`,
    Aanvraagnummer: id, Profiel: z.label, Kleur: c.name + (data.color.ral ? ' ' + data.color.ral : ''),
    Leuningen: st.unknown ? `${st.rails.length} stuks, maten onbekend (inmeten)` : st.rails.map((r, i) => `${i + 1}: ${r.mm} mm`).join(' | '),
    Leverwijze: DELIVERY.find(d => d.id === st.delivery)?.name, 'Afstand vanaf Ulft': st.km == null ? 'n.v.t.' : `ca. ${st.km} km`,
    'Prijs (intern)': p.status === 'indicatie' ? `€ ${p.total} incl. btw` : 'op aanvraag: ' + p.reasons.join('; '),
    'Prijsopbouw (intern)': p.lines.map(l => `${l.label} = € ${Math.round(l.amount)}`).join(' | '),
    Configuratie: JSON.stringify(data)
  };
  hidden.innerHTML = Object.entries(fields).map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`).join('');
  photos.forEach((f, i) => { const inp = document.createElement('input'); inp.type = 'file'; inp.name = `attachment${i + 1}`; inp.hidden = true; try { const dt = new DataTransfer(); dt.items.add(f); inp.files = dt.files; hidden.appendChild(inp); } catch { /* old browser */ } });
  const btn = $('[data-submit]'); btn.disabled = true; btn.textContent = 'Bezig met versturen…';
  form.submit();
});

function confirmation(d) {
  const wrap = $('.quote');
  wrap.innerHTML = `
    <div class="done card">
      <span class="label">Aanvraag ontvangen</span>
      <h2>Bedankt${d?.customer?.naam ? ', ' + esc(d.customer.naam.split(' ')[0]) : ''}</h2>
      <p>Je aanvraagnummer is <strong>${esc(d?.id || '')}</strong>. ${DEMO ? 'Dit is een demo: er is niets verstuurd.' : `We nemen binnen enkele werkdagen contact met je op via ${esc(d?.customer?.email || 'e-mail')}.`}</p>
      ${d?.rails ? `<dl class="sumlist"><div><dt>Profiel</dt><dd>${esc(d.profile.label)}</dd></div><div><dt>Kleur</dt><dd>${esc(d.color.name)}${d.color.ral ? ' ' + esc(d.color.ral) : ''}</dd></div><div><dt>Leuningen</dt><dd>${d.lengthsUnknown ? d.rails.length + ', maten worden ingemeten' : d.rails.map(r => r.lengthMm.toLocaleString('nl-NL') + ' mm').join(' · ')}</dd></div></dl>` : ''}
      <h3>Wat gebeurt er nu?</h3>
      <ol class="nextsteps"><li>We controleren je maten en situatie.</li><li>Je ontvangt een offerte per e-mail.</li><li>Na jouw akkoord maken we je leuningen.</li></ol>
      <div><a class="btn btn--outline" href="index.html">Terug naar home</a></div>
    </div>`;
  document.querySelector('.mbar')?.remove();
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- start ---------- */
const params = new URLSearchParams(location.search);
if (params.get('aanvraag')) {
  let d = null; try { d = JSON.parse(localStorage.getItem('valier-laatste-aanvraag')); } catch { /* ignore */ }
  confirmation(d && d.id === params.get('aanvraag') ? d : { id: params.get('aanvraag') });
} else {
  renderRails();
  if (st.postcode) { pcInput.value = st.postcode; lookup(st.postcode); }
  $('.js-ral input').value = st.ral;
  update();
}
// mobile bar: hide while the summary is on screen
const mbar = document.querySelector('.mbar');
if (mbar && 'IntersectionObserver' in window) new IntersectionObserver(([en]) => mbar.classList.toggle('is-off', en.isIntersecting), { threshold: 0.1 }).observe($('.summary'));
