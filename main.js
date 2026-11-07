/* =========================================================
   VALIER — productpagina: samenstellen, prijs, bestellen, galerij.
   De 3D-viewer (js/viewer.js) luistert naar 'valier:config' en 'valier:shot'.
   ========================================================= */

/* ---------- Instellingen voor Valier ---------- */
const PRIJZEN = {
  perMeter: 85,          // leuning, per meter
  perLeuning: 35,        // montage, per leuning
  perKm: 1,              // reiskosten per km vanaf de werkplaats
  retour: false,         // true = heen en terug rekenen
  achterafToeslag: 0.10  // achteraf betalen: 10% extra
};
const WERKPLAATS = { postcode: '7071', plaats: 'Ulft' };
const WEGFACTOR = 1.25;  // hemelsbrede afstand × 1,25 ≈ afstand over de weg
const BESTEL_EMAIL = 'info@valier.nl';
// Bestellingen gaan via FormSubmit naar het e-mailadres hierboven. De eerste bestelling
// stuurt FormSubmit een bevestigingsmail naar dat adres; klik daarin op "Activate".
const BESTEL_URL = 'https://formsubmit.co/ajax/' + BESTEL_EMAIL;

(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const form = $('#config');
  const params = new URLSearchParams(location.search);
  const DEMO = window.VALIER_DEMO === true;

  /* ---------- State ---------- */
  const LABEL = {
    profiel: { '50x30': 'Koker 50 × 30 mm', '50x20': 'Koker 50 × 20 mm', rond: 'Rond Ø 50 mm' },
    profielKort: { '50x30': '50 × 30', '50x20': '50 × 20', rond: 'Rond Ø 50' },
    kleur: { zwart: 'Mat zwart', goud: 'Goud', wit: 'Wit' },
    trap: { recht: 'Rechte trap', kwartslag: 'Kwartslag', 'dubbele-kwartslag': 'Dubbele kwartslag', wenteltrap: 'Wenteltrap' },
    betaling: { direct: 'Direct betalen (iDEAL)', achteraf: 'Achteraf betalen (+10%)' }
  };
  const STANDAARD_LEUNINGEN = { recht: 1, kwartslag: 3, 'dubbele-kwartslag': 4, wenteltrap: 4 };
  const state = {
    profiel: '50x30', kleur: 'zwart', trap: 'kwartslag', delen: 3, lengte: 5, lengteOnbekend: false,
    postcode: '', km: null, plaats: '', betaling: 'direct'
  };
  let delenAangepast = false;

  // Testing / sharing a configuration: ?profiel=rond&kleur=goud&trap=recht&delen=2
  for (const k of ['profiel', 'kleur', 'trap']) if (params.get(k) && LABEL[k][params.get(k)]) state[k] = params.get(k);
  if (params.get('delen')) { state.delen = Math.max(1, Math.min(8, parseInt(params.get('delen'), 10) || 3)); delenAangepast = true; }
  window.valierState = state;

  const fmtLen = n => n.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const euro = n => '€ ' + Math.round(n).toLocaleString('nl-NL');
  const mv = n => (n === 1 ? 'leuning' : 'leuningen');

  /* ---------- Price ---------- */
  function price() {
    const P = PRIJZEN;
    const leuning = state.lengteOnbekend ? null : state.lengte * P.perMeter;
    const montage = state.delen * P.perLeuning;
    const reisKm = state.km == null ? null : state.km * (P.retour ? 2 : 1);
    const reis = reisKm == null ? null : reisKm * P.perKm;
    const basis = (leuning ?? 0) + montage + (reis ?? 0);
    const toeslag = state.betaling === 'achteraf' ? basis * P.achterafToeslag : 0;
    return { leuning, montage, reis, reisKm, toeslag, totaal: basis + toeslag, compleet: leuning != null && reis != null };
  }

  /* ---------- Distance from the workshop ---------- */
  let pc4 = null, pc4Loading = null;
  const loadPc4 = () => pc4Loading || (pc4Loading = fetch('data/pc4.json').then(r => r.json()).then(d => (pc4 = d)).catch(() => null));
  const haversine = (a, b) => {
    const R = 6371, rad = x => (x * Math.PI) / 180;
    const dLat = rad(b[0] - a[0]), dLon = rad(b[1] - a[1]);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };
  async function updateDistance(raw) {
    const m = raw.replace(/\s+/g, '').match(/^(\d{4})([a-z]{2})?$/i);
    const hint = $('.js-km');
    if (!m) {
      state.km = null; state.plaats = '';
      hint.textContent = raw.trim() ? 'Vul een postcode in, bijvoorbeeld 7071 AB.' : `Wij rekenen € ${PRIJZEN.perKm} per km vanaf onze werkplaats in ${WERKPLAATS.plaats}.`;
      render();
      return;
    }
    state.postcode = m[1] + (m[2] ? ' ' + m[2].toUpperCase() : '');
    await loadPc4();
    const here = pc4 && pc4[m[1]], from = pc4 && pc4[WERKPLAATS.postcode];
    if (!here || !from) {
      state.km = null; state.plaats = '';
      hint.textContent = pc4 ? 'Deze postcode kennen wij niet. Controleer de cijfers.' : 'De afstand kan nu niet berekend worden. Wij rekenen die na uw bestelling.';
    } else {
      state.km = Math.max(1, Math.round(haversine(from, here) * WEGFACTOR));
      state.plaats = here[2];
      hint.textContent = `${WERKPLAATS.plaats} → ${here[2]}: ca. ${state.km} km${PRIJZEN.retour ? ' (enkele reis)' : ''}.`;
      const plaats = $('#plaats');
      if (plaats && !plaats.value) plaats.value = here[2];
    }
    render();
  }

  /* ---------- Render ---------- */
  function render() {
    for (const k of ['profiel', 'kleur', 'trap', 'betaling']) {
      const r = $(`input[name="${k}"][value="${state[k]}"]`, form);
      if (r) r.checked = true;
    }
    $('#delen').value = state.delen;
    $('#lengte').value = state.lengte;
    $('.js-delen').textContent = state.delen;
    $('.js-delen-unit').textContent = mv(state.delen);
    $('.js-lengte').textContent = fmtLen(state.lengte);
    $('.stepper--len').classList.toggle('is-off', state.lengteOnbekend);
    $$('.stepper').forEach(s => {
      const val = s.classList.contains('stepper--len') ? state.lengte : state.delen;
      $('[data-step="-1"]', s).disabled = val <= +s.dataset.min;
      $('[data-step="1"]', s).disabled = val >= +s.dataset.max;
    });

    const p = price();
    $('.js-sum-spec').textContent = `${LABEL.profiel[state.profiel]} · ${LABEL.kleur[state.kleur]} · ${LABEL.trap[state.trap]}`;
    $('.js-l-leuning').textContent = state.lengteOnbekend ? 'Leuning, € 85 per meter' : `Leuning, ${fmtLen(state.lengte)} m × € ${PRIJZEN.perMeter}`;
    $('.js-p-leuning').textContent = p.leuning == null ? 'Na inmeten' : euro(p.leuning);
    $('.js-l-montage').textContent = `Montage, ${state.delen} × € ${PRIJZEN.perLeuning}`;
    $('.js-p-montage').textContent = euro(p.montage);
    $('.js-l-reis').textContent = p.reisKm == null ? `Reiskosten vanaf ${WERKPLAATS.plaats}` : `Reiskosten, ca. ${p.reisKm} km × € ${PRIJZEN.perKm}`;
    $('.js-p-reis').textContent = p.reis == null ? 'Vul uw postcode in' : euro(p.reis);
    $('.js-row-toeslag').hidden = state.betaling !== 'achteraf';
    $('.js-p-toeslag').textContent = euro(p.toeslag);
    $('.js-total').textContent = p.compleet ? euro(p.totaal) : state.lengteOnbekend ? 'Na inmeten' : `${euro(p.totaal)} + reiskosten`;
    $('.js-submit').textContent = state.betaling === 'direct' ? 'Bestellen en betalen' : 'Bestellen, achteraf betalen';
    $('.js-pay-note').textContent = state.lengteOnbekend
      ? 'Wij meten eerst bij u in. Daarna ontvangt u de definitieve prijs.'
      : (state.betaling === 'direct'
        ? 'Na uw bestelling ontvangt u per e-mail een betaalverzoek via iDEAL. De prijs is gebaseerd op de lengte die u opgeeft.'
        : 'U betaalt achteraf, na de montage. Daarvoor rekenen wij 10% extra. De prijs is gebaseerd op de lengte die u opgeeft.');

    $('.js-bar').textContent = `${LABEL.profielKort[state.profiel]} · ${LABEL.kleur[state.kleur]} · ${state.delen} ${mv(state.delen)}`;
    $('.js-bar-total').textContent = state.lengteOnbekend ? 'Prijs na inmeten' : euro(p.totaal);
    $('.js-bar-extra').textContent = state.lengteOnbekend || p.reis != null ? '' : '+ reiskosten';

    document.dispatchEvent(new CustomEvent('valier:config', { detail: { profiel: state.profiel, kleur: state.kleur, delen: state.delen } }));
  }

  /* ---------- Inputs ---------- */
  form.addEventListener('change', e => {
    const t = e.target;
    if (t.name === 'profiel' || t.name === 'kleur' || t.name === 'betaling') state[t.name] = t.value;
    if (t.name === 'trap') {
      state.trap = t.value;
      if (!delenAangepast) state.delen = STANDAARD_LEUNINGEN[t.value];
    }
    if (t.name === 'lengte_onbekend') state.lengteOnbekend = t.checked;
    if (['profiel', 'kleur', 'trap'].includes(t.name)) showShot(t.closest('[data-shot]').dataset.shot, true);
    render();
  });
  let pcTimer = null;
  $('#postcode').addEventListener('input', e => {
    clearTimeout(pcTimer);
    pcTimer = setTimeout(() => updateDistance(e.target.value), 250);
    e.target.closest('.field').classList.remove('is-invalid');
  });
  $('#postcode').addEventListener('focus', loadPc4, { once: true });
  $$('.stepper').forEach(s => s.addEventListener('click', e => {
    const b = e.target.closest('[data-step]');
    if (!b) return;
    if (s.classList.contains('stepper--len')) {
      state.lengte = Math.max(+s.dataset.min, Math.min(+s.dataset.max, state.lengte + (+b.dataset.step) * (+s.dataset.inc)));
      state.lengteOnbekend = false;
      $('#lengte_onbekend').checked = false;
      showShot('lengte', true);
    } else {
      state.delen = Math.max(+s.dataset.min, Math.min(+s.dataset.max, state.delen + (+b.dataset.step)));
      delenAangepast = true;
      showShot('hoek', true);
    }
    render();
  }));

  /* ---------- Viewer follows the step you are reading ---------- */
  let manualUntil = 0, lastShot = null;
  function showShot(name, force = false) {
    if (!force && performance.now() < manualUntil) return;
    if (name === lastShot && !force) return;
    lastShot = name;
    window.valierShot = name;
    document.dispatchEvent(new CustomEvent('valier:shot', { detail: name }));
  }
  $$('.viewer__tabs button').forEach(b => b.addEventListener('click', () => { manualUntil = performance.now() + 4000; lastShot = b.dataset.view; }));
  const sections = $$('.product__panel [data-shot]');
  const pickActive = () => {
    // a step becomes active once its title reaches the top of the reading area
    // (below the nav on desktop, below the pinned viewer on phones), so short steps count too
    const media = $('.product__media').getBoundingClientRect();
    const top = media.width < innerWidth * 0.9 ? 60 : Math.max(60, media.bottom);
    const line = top + 120;
    let active = sections[0];
    for (const s of sections) if (s.getBoundingClientRect().top < line) active = s;
    showShot(active.dataset.shot);
  };

  /* ---------- Order bar ---------- */
  const bar = $('.orderbar'), summary = $('#bestellen');
  const updateBar = () => {
    const r = summary.getBoundingClientRect();
    const summaryVisible = r.top < innerHeight - 40 && r.bottom > 80;
    bar.classList.toggle('is-hidden', summaryVisible || form.classList.contains('is-sent'));
  };
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { pickActive(); updateBar(); ticking = false; });
  }, { passive: true });
  addEventListener('resize', () => { pickActive(); updateBar(); });

  /* ---------- Submit ---------- */
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const required = [...$$('#stap-gegevens input[required]', form), $('#postcode')];
    let firstBad = null;
    required.forEach(inp => {
      const bad = !inp.checkValidity() || !inp.value.trim();
      inp.closest('.field').classList.toggle('is-invalid', bad);
      if (bad && !firstBad) firstBad = inp;
    });
    if (firstBad) {
      firstBad.closest('fieldset').scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => firstBad.focus({ preventScroll: true }), 450);
      return;
    }
    const btn = $('.js-submit');
    btn.disabled = true;
    btn.textContent = 'Bezig met versturen…';
    const p = price();
    const naam = $('#naam').value.trim();
    const order = {
      _subject: `Nieuwe bestelling: ${naam}, ${state.plaats || $('#plaats').value}`,
      _template: 'table',
      _replyto: $('#email').value.trim(),
      Naam: naam,
      'E-mail': $('#email').value.trim(),
      Telefoon: $('#telefoon').value.trim(),
      Adres: `${$('#adres').value.trim()}, ${state.postcode} ${$('#plaats').value.trim()}`,
      Profiel: LABEL.profiel[state.profiel],
      Kleur: LABEL.kleur[state.kleur],
      Trap: LABEL.trap[state.trap],
      'Aantal leuningen': state.delen,
      Lengte: state.lengteOnbekend ? 'Onbekend, inmeten' : `${fmtLen(state.lengte)} m`,
      'Afstand vanaf Ulft': state.km == null ? 'Onbekend' : `ca. ${state.km} km`,
      Betaling: LABEL.betaling[state.betaling],
      'Leuning (prijs)': p.leuning == null ? 'Na inmeten' : euro(p.leuning),
      'Montage (prijs)': euro(p.montage),
      'Reiskosten (prijs)': p.reis == null ? 'Onbekend' : euro(p.reis),
      'Toeslag achteraf': state.betaling === 'achteraf' ? euro(p.toeslag) : '—',
      Totaal: p.compleet ? euro(p.totaal) : 'Nog niet compleet'
    };

    let ok = false;
    if (!DEMO) {
      try {
        const res = await fetch(BESTEL_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(order) });
        ok = res.ok;
      } catch { ok = false; }
    }
    const first = naam.split(' ')[0];
    if (DEMO) {
      $('.js-done-title').textContent = `Dank u, ${first}.`;
      $('.js-done-body').textContent = 'Dit is een demo: uw bestelling is niet verstuurd. Op de echte site komt hij direct binnen bij ' + BESTEL_EMAIL + '.';
    } else if (ok) {
      $('.js-done-title').textContent = `Dank u, ${first}. Uw bestelling is ontvangen.`;
      $('.js-done-body').textContent = state.betaling === 'direct'
        ? `U ontvangt per e-mail een betaalverzoek via iDEAL. Foto's van uw trap kunt u sturen naar ${BESTEL_EMAIL}.`
        : `Wij nemen contact met u op voor de planning. Foto's van uw trap kunt u sturen naar ${BESTEL_EMAIL}.`;
    } else {
      btn.disabled = false;
      render();
      $('.js-done-title').textContent = 'Versturen is niet gelukt.';
      $('.js-done-body').textContent = `Probeer het opnieuw, of mail uw keuze naar ${BESTEL_EMAIL}.`;
      const done = $('.done', form);
      done.hidden = false;
      done.focus({ preventScroll: true });
      return;
    }
    form.classList.add('is-sent');
    const done = $('.done', form);
    done.hidden = false;
    done.focus({ preventScroll: true });
    done.scrollIntoView({ behavior: 'smooth', block: 'center' });
    updateBar();
  });
  $$('.field input').forEach(inp => inp.addEventListener('input', () => inp.closest('.field').classList.remove('is-invalid')));

  /* ---------- Project gallery: filters, show more ---------- */
  const grid = $('.work__grid');
  const figs = $$('.ph', grid);
  const more = $('.work__more');
  const isShown = f => getComputedStyle(f).display !== 'none';
  const stagger = () => {
    const cols = matchMedia('(max-width: 760px)').matches ? 2 : 3;
    figs.filter(isShown).forEach((f, i) => f.classList.toggle('is-mid', i % cols === 1));
  };
  grid.classList.add('is-collapsed');
  stagger();
  addEventListener('resize', stagger);
  $('.js-more', more).addEventListener('click', () => { grid.classList.remove('is-collapsed'); more.hidden = true; stagger(); });
  $$('.work__filters button').forEach(b => b.addEventListener('click', () => {
    if (b.classList.contains('is-active')) return;
    $$('.work__filters button').forEach(x => x.classList.toggle('is-active', x === b));
    const f = b.dataset.filter;
    grid.classList.remove('is-collapsed');
    more.hidden = true;
    grid.classList.add('is-switching');
    setTimeout(() => {
      figs.forEach(fig => fig.classList.toggle('is-hidden', f !== 'alle' && !fig.dataset.cat.split(' ').includes(f)));
      stagger();
      requestAnimationFrame(() => grid.classList.remove('is-switching'));
    }, 300);
  }));

  /* ---------- Lightbox (gallery and buy-box thumbnails) ---------- */
  const box = $('.lightbox');
  if (box && box.showModal) {
    const img = $('img', box), cap = $('.lightbox__cap', box);
    let list = [], at = 0;
    const show = i => {
      at = (i + list.length) % list.length;
      const it = list[at];
      img.src = it.src; img.alt = it.alt;
      cap.textContent = list.length > 1 ? `${it.cap}  ·  ${at + 1} / ${list.length}` : it.cap;
    };
    const item = btn => ({ src: btn.dataset.full, alt: $('img', btn).alt, cap: btn.dataset.cap || btn.closest('figure')?.querySelector('figcaption')?.textContent || '' });
    figs.forEach(fig => $('button', fig).addEventListener('click', () => {
      const shown = figs.filter(isShown);
      list = shown.map(f => item($('button', f)));
      show(shown.indexOf(fig));
      box.showModal();
    }));
    const thumbs = $$('.buy__thumbs button');
    thumbs.forEach((t, i) => t.addEventListener('click', () => { list = thumbs.map(item); show(i); box.showModal(); }));
    $('.lightbox__close', box).addEventListener('click', () => box.close());
    $('.lightbox__prev', box).addEventListener('click', () => show(at - 1));
    $('.lightbox__next', box).addEventListener('click', () => show(at + 1));
    box.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') show(at - 1); if (e.key === 'ArrowRight') show(at + 1); });
    let sx = null;
    box.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', e => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) show(at + (dx < 0 ? 1 : -1));
      sx = null;
    });
    box.addEventListener('click', e => { if (e.target === box) box.close(); });
  }

  /* ---------- Gentle reveal for the photo grid ---------- */
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -6% 0px' });
    figs.forEach(f => { f.classList.add('reveal'); io.observe(f); });
  }

  if (params.get('postcode')) { $('#postcode').value = params.get('postcode'); updateDistance(params.get('postcode')); }
  render();
  pickActive();
  updateBar();
})();
