/* VALIER — gedeeld: menu, fotofilter en lightbox */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* mobiel menu */
  const burger = $('.burger');
  if (burger) {
    const set = open => { document.body.classList.toggle('nav-open', open); burger.setAttribute('aria-expanded', String(open)); burger.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen'); };
    burger.addEventListener('click', () => set(!document.body.classList.contains('nav-open')));
    $$('#menu a').forEach(a => a.addEventListener('click', () => set(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
    matchMedia('(min-width: 961px)').addEventListener('change', e => { if (e.matches) set(false); });
  }

  /* projectfilter */
  const filters = $$('.filter');
  filters.forEach(btn => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    filters.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    $$('.gallery figure').forEach(fig => { fig.hidden = f !== 'alle' && !fig.dataset.cat.split(' ').includes(f); });
  }));

  /* lightbox */
  const lb = $('#lightbox');
  if (!lb || typeof lb.showModal !== 'function') return;
  const img = $('img', lb), cap = $('.lb-cap', lb);
  let list = [], idx = 0, opener = null;
  const show = i => {
    idx = (i + list.length) % list.length;
    const b = list[idx];
    img.src = b.dataset.zoom; img.alt = b.dataset.cap || '';
    cap.textContent = `${b.dataset.cap || ''}  ·  ${idx + 1} / ${list.length}`;
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-zoom]'); if (!b) return;
    list = $$('[data-zoom]').filter(x => !x.closest('[hidden]'));
    opener = b; show(list.indexOf(b)); lb.showModal();
  });
  $('.lb-close', lb).addEventListener('click', () => lb.close());
  $('.lb-prev', lb).addEventListener('click', () => show(idx - 1));
  $('.lb-next', lb).addEventListener('click', () => show(idx + 1));
  lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1); });
  lb.addEventListener('close', () => { img.removeAttribute('src'); opener?.focus(); });
  let x0 = null;
  lb.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1)); x0 = null; });
})();
