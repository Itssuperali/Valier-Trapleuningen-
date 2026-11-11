/* VALIER — scrollblok "Van tekening tot leuning": speelt een beeldreeks af terwijl je scrolt. */
(() => {
  const root = document.querySelector('[data-build]'); if (!root) return;
  const canvas = root.querySelector('canvas'), ctx = canvas.getContext('2d');
  const list = root.querySelector('.build__phases'), cap = root.querySelector('[data-cap]'), bar = root.querySelector('.build__bar i');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let m, imgs = [], shown = -1, want = 0, active = -1;

  fetch(root.dataset.build).then(r => r.json()).then(start).catch(() => root.remove());

  function start(man) {
    m = man;
    const src = i => m.pattern.replace('{n}', String(i + 1).padStart(m.pad, '0'));
    list.innerHTML = m.phases.map((p, i) => `<li><span>${String(i + 1).padStart(2, '0')}</span><div><b>${p.title}</b><p>${p.text}</p></div></li>`).join('');
    root.querySelector('.build__temp').hidden = !m.placeholder;
    imgs = Array.from({ length: m.count }, () => null);
    const load = i => new Promise(res => { if (imgs[i]) return res(); const im = new Image(); im.decoding = 'async'; im.onload = () => { imgs[i] = im; res(); draw(); }; im.onerror = res; im.src = src(i); });
    if (still) { root.classList.add('is-static'); load(m.count - 1).then(() => paint(m.count - 1)); setPhase(m.phases.length - 1); return; }
    load(0).then(() => paint(0));
    // de rest pas laden als het blok in beeld komt; eerst om de 8, dan de tussenliggende
    new IntersectionObserver(async ([e], io) => {
      if (!e.isIntersecting) return; io.disconnect();
      const order = [...Array(m.count).keys()].sort((a, b) => (a % 8 ? 1 : 0) - (b % 8 ? 1 : 0) || a - b);
      for (let k = 0; k < order.length; k += 6) await Promise.all(order.slice(k, k + 6).map(load));
    }, { rootMargin: '100% 0px' }).observe(root);
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', () => { shown = -1; size(); onScroll(); });
    size(); onScroll();
  }
  function size() {
    const r = canvas.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * d); canvas.height = Math.round(r.height * d);
  }
  function onScroll() {
    const r = root.getBoundingClientRect(), run = r.height - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / (run || 1)));
    want = Math.round(p * (m.count - 1));
    bar.style.transform = `scaleY(${p})`;
    let ph = 0; m.phases.forEach((x, i) => { if (want >= x.start) ph = i; }); setPhase(ph);
    requestAnimationFrame(draw);
  }
  function draw() {
    if (!m) return;
    // dichtstbijzijnde geladen beeld tonen tot het gevraagde binnen is
    for (let d = 0; d < m.count; d++) for (const i of [want - d, want + d]) if (imgs[i]) { if (i !== shown) paint(i); return; }
  }
  function paint(i) {
    const im = imgs[i]; if (!im) return; shown = i;
    if (!canvas.width) size();
    const cw = canvas.width, ch = canvas.height, s = Math.max(cw / im.naturalWidth, ch / im.naturalHeight);
    const w = im.naturalWidth * s, h = im.naturalHeight * s;
    ctx.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h);
  }
  function setPhase(i) {
    if (i === active) return; active = i;
    [...list.children].forEach((li, k) => { li.classList.toggle('is-on', k === i); li.classList.toggle('is-done', k < i); });
    const p = m.phases[i]; cap.innerHTML = `<b>${p.title}</b><span>${p.text}</span>`;
  }
})();
