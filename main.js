/* =========================================================
   VALIER — productpagina: samenstellen, bestelbalk, galerij.
   De 3D-viewer (js/viewer.js) luistert naar 'valier:config' en 'valier:shot'.
   ========================================================= */

/* ---------- Instellingen voor Valier ----------
   PRIJZEN: vul bedragen in (euro) om direct een prijsindicatie te tonen.
   Zolang een bedrag null is, toont de pagina "Prijs op maat".
   AANVRAAG_URL: adres van een formulierdienst (bijv. https://formspree.io/f/xxxx).
   Leeg = nog niet gekoppeld; de bezoeker krijgt dat dan eerlijk te zien. */
const PRIJZEN = { perMeter: null, perDeel: null, inmeten: null };
const AANVRAAG_URL = '';

(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const form = $('#config');
  const params = new URLSearchParams(location.search);

  /* ---------- State ---------- */
  const LABEL = {
    profiel: { vierkant: 'Vierkant 40 × 40 mm', rond: 'Rond' },
    profielKort: { vierkant: 'Vierkant', rond: 'Rond' },
    kleur: { zwart: 'Mat zwart', goud: 'Goud', wit: 'Wit' },
    trap: { recht: 'Rechte trap', kwartslag: 'Kwartslag', 'dubbele-kwartslag': 'Dubbele kwartslag', wenteltrap: 'Wenteltrap' }
  };
  const ADVIES = {
    recht: [1, 'Bij een rechte trap is één doorlopende leuning meestal genoeg.'],
    kwartslag: [3, 'Bij een kwartslag maken wij meestal 3 delen: langs de muur, om de hoek en weer omhoog.'],
    'dubbele-kwartslag': [4, 'Bij een dubbele kwartslag komen er meestal 4 delen. Bij het inmeten controleren wij dit.'],
    wenteltrap: [3, 'Een wenteltrap volgen wij in korte delen. Bij het inmeten bepalen wij het precieze aantal.']
  };
  const state = { profiel: 'vierkant', kleur: 'zwart', trap: 'kwartslag', delen: 3, lengte: 5, lengteOnbekend: false, inmeten: false };
  let delenAangepast = false;

  // Testing / sharing a configuration: ?profiel=rond&kleur=goud&trap=recht&delen=2
  for (const k of ['profiel', 'kleur', 'trap']) if (params.get(k) && LABEL[k][params.get(k)]) state[k] = params.get(k);
  if (params.get('delen')) { state.delen = Math.max(1, Math.min(8, parseInt(params.get('delen'), 10) || 3)); delenAangepast = true; }
  window.valierState = state;

  const fmtLen = n => n.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const euro = n => '€ ' + Math.round(n).toLocaleString('nl-NL');

  function priceText() {
    const p = PRIJZEN;
    if (p.perMeter == null || p.perDeel == null || state.lengteOnbekend) return null;
    let total = state.lengte * p.perMeter + state.delen * p.perDeel;
    if (state.inmeten && p.inmeten) total += p.inmeten;
    return euro(total);
  }

  function render() {
    // form controls reflect state
    for (const k of ['profiel', 'kleur', 'trap']) {
      const r = $(`input[name="${k}"][value="${state[k]}"]`, form);
      if (r) r.checked = true;
    }
    $('#delen').value = state.delen;
    $('#lengte').value = state.lengte;
    $('.js-delen').textContent = state.delen;
    $('.js-delen-unit').textContent = state.delen === 1 ? 'deel' : 'delen';
    $('.js-delen-hint').textContent = ADVIES[state.trap][1];
    $('.js-lengte').textContent = fmtLen(state.lengte);
    $('.stepper--len').classList.toggle('is-off', state.lengteOnbekend);
    $$('.stepper').forEach(s => {
      const val = s.classList.contains('stepper--len') ? state.lengte : state.delen;
      $('[data-step="-1"]', s).disabled = val <= +s.dataset.min;
      $('[data-step="1"]', s).disabled = val >= +s.dataset.max;
    });

    // summary + bar
    const lengte = state.lengteOnbekend ? 'Wordt ingemeten' : `ca. ${fmtLen(state.lengte)} m`;
    $('.js-sum-profiel').textContent = LABEL.profiel[state.profiel];
    $('.js-sum-kleur').textContent = LABEL.kleur[state.kleur];
    $('.js-sum-trap').textContent = LABEL.trap[state.trap];
    $('.js-sum-delen').textContent = state.delen;
    $('.js-sum-lengte').textContent = lengte + (state.inmeten ? ' · inmeten' : '');
    $('.js-bar').textContent = [LABEL.profielKort[state.profiel], LABEL.kleur[state.kleur], LABEL.trap[state.trap], `${state.delen} ${state.delen === 1 ? 'deel' : 'delen'}`].join(' · ');
    const price = priceText();
    $$('.js-price').forEach(el => (el.textContent = price ? `${price} indicatie` : 'Prijs op maat'));
    $('.js-price-note').textContent = price ? 'Inclusief montage. U ontvangt een definitieve prijs na uw aanvraag.' : 'U ontvangt de prijs na uw aanvraag.';

    document.dispatchEvent(new CustomEvent('valier:config', { detail: { profiel: state.profiel, kleur: state.kleur, delen: state.delen } }));
  }

  /* ---------- Inputs ---------- */
  form.addEventListener('change', e => {
    const t = e.target;
    if (t.name === 'profiel' || t.name === 'kleur') state[t.name] = t.value;
    if (t.name === 'trap') {
      state.trap = t.value;
      if (!delenAangepast) state.delen = ADVIES[t.value][0];
    }
    if (t.name === 'lengte_onbekend') state.lengteOnbekend = t.checked;
    if (t.name === 'inmeten') state.inmeten = t.checked;
    if (t.name === 'fotos') {
      const n = t.files.length;
      $('.js-fotos').textContent = n ? `${n} foto${n === 1 ? '' : "'s"} gekozen` : 'Optioneel. Zo kunnen wij sneller een prijs geven.';
    }
    if (['profiel', 'kleur', 'trap'].includes(t.name)) showShot(t.closest('[data-shot]').dataset.shot, true);
    render();
  });
  $$('.stepper').forEach(s => s.addEventListener('click', e => {
    const b = e.target.closest('[data-step]');
    if (!b) return;
    const len = s.classList.contains('stepper--len');
    if (len) {
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
    sections.forEach(s => s.classList.toggle('is-current', s === active && s.classList.contains('step')));
  };

  /* ---------- Order bar ---------- */
  const bar = $('.orderbar'), summary = $('#bestellen'), product = $('#product');
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
    const required = $$('#stap-gegevens input[required]', form);
    let firstBad = null;
    required.forEach(inp => {
      const bad = !inp.checkValidity() || !inp.value.trim();
      inp.closest('.field').classList.toggle('is-invalid', bad);
      if (bad && !firstBad) firstBad = inp;
    });
    if (firstBad) {
      $('#stap-gegevens').scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => firstBad.focus({ preventScroll: true }), 450);
      return;
    }
    const naam = $('#naam').value.trim().split(' ')[0];
    const done = $('.done', form);
    let sent = false;
    if (AANVRAAG_URL) {
      const data = new FormData(form);
      data.append('samenvatting', $('.js-bar').textContent);
      try {
        const res = await fetch(AANVRAAG_URL, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        sent = res.ok;
      } catch { sent = false; }
      $('.js-done-title').textContent = sent ? `Dank u, ${naam}.` : 'Versturen is niet gelukt.';
      $('.js-done-body').textContent = sent
        ? 'Wij hebben uw aanvraag ontvangen en nemen contact met u op over prijs en planning.'
        : 'Probeer het opnieuw, of mail uw keuze naar info@valier.nl.';
    } else {
      $('.js-done-title').textContent = `Dank u, ${naam}.`;
      $('.js-done-body').textContent = 'Deze site is nog niet gekoppeld aan een e-mailadres, dus uw aanvraag is niet verstuurd.';
    }
    form.classList.add('is-sent');
    done.hidden = false;
    done.focus({ preventScroll: true });
    done.scrollIntoView({ behavior: 'smooth', block: 'center' });
    updateBar();
  });
  $$('#stap-gegevens input').forEach(inp => inp.addEventListener('input', () => inp.closest('.field').classList.remove('is-invalid')));

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

  /* ---------- Gentle reveal for the photo grid (content is visible without JS) ---------- */
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -6% 0px' });
    figs.forEach(f => { f.classList.add('reveal'); io.observe(f); });
  }

  render();
  pickActive();
  updateBar();
})();
