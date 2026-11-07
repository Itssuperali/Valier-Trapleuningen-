/* =========================================================
   VALIER — page behaviour (non-3D): smooth scroll, nav, reveals,
   photo lightbox, request form. The 3D film lives in js/film.js.
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Never leave the loader up: if the 3D film cannot start, hide it anyway
  setTimeout(() => $('.loader')?.classList.add('is-done'), 6000);

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ duration: 1.35, smoothWheel: true });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const target = id === '#top' ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.8 });
    else (target === 0 ? scrollTo({ top: 0, behavior: 'smooth' }) : target.scrollIntoView({ behavior: 'smooth' }));
  }));

  /* ---------- Nav & mobile CTA ---------- */
  const nav = $('.nav'), film = $('.film'), cta = $('.sticky-cta'), intake = $('#aanvraag');
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    const filmEnd = film.offsetTop + film.offsetHeight - innerHeight;
    nav.classList.toggle('is-solid', y > filmEnd);
    nav.classList.toggle('is-hidden', y > lastY && y > 300 && y < filmEnd);
    const r = intake.getBoundingClientRect();
    cta.classList.toggle('is-on', y > innerHeight * 0.8 && r.top > innerHeight);
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Reveals ---------- */
  const revealEls = $$('.work__head > *, .ph, .why__item, .process__head > *, .steps li, .specs__img, .specs__body > *, .faq__head > *, .faq details, .intake__head > *, .footer__claim');
  revealEls.forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  revealEls.forEach((el, i) => { el.style.transitionDelay = `${(i % 3) * 90}ms`; io.observe(el); });

  // Gentle parallax on the photo grid
  if (window.gsap && window.ScrollTrigger && !reduce) {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) lenis.on('scroll', ScrollTrigger.update);
    gsap.from('.footer__mark', { yPercent: 40, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  }

  /* ---------- Project filters + staggered grid ---------- */
  const grid = $('.work__grid');
  const figs = $$('.ph', grid);
  const stagger = () => {
    const cols = matchMedia('(max-width: 760px)').matches ? 2 : 3;
    figs.filter(f => !f.classList.contains('is-hidden')).forEach((f, i) => f.classList.toggle('is-mid', i % cols === 1));
  };
  stagger();
  addEventListener('resize', stagger);
  $$('.work__filters button').forEach(b => b.addEventListener('click', () => {
    if (b.classList.contains('is-active')) return;
    $$('.work__filters button').forEach(x => x.classList.toggle('is-active', x === b));
    const f = b.dataset.filter;
    grid.classList.add('is-switching');
    setTimeout(() => {
      figs.forEach(fig => fig.classList.toggle('is-hidden', f !== 'alle' && !fig.dataset.cat.split(' ').includes(f)));
      stagger();
      requestAnimationFrame(() => grid.classList.remove('is-switching'));
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }, 350);
  }));

  /* ---------- Lightbox (with browsing) ---------- */
  const box = $('.lightbox');
  if (box && box.showModal) {
    const img = $('img', box), cap = $('.lightbox__cap', box);
    let list = [], at = 0;
    const show = i => {
      at = (i + list.length) % list.length;
      const fig = list[at], btn = $('button', fig);
      img.src = btn.dataset.full;
      img.alt = $('img', btn).alt;
      cap.textContent = `${$('figcaption', fig).textContent}  ·  ${at + 1} / ${list.length}`;
    };
    figs.forEach(fig => $('button', fig).addEventListener('click', () => {
      list = figs.filter(x => !x.classList.contains('is-hidden'));
      show(list.indexOf(fig));
      box.showModal();
      lenis?.stop();
    }));
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
    box.addEventListener('close', () => lenis?.start());
  }

  /* ---------- Request form (3 steps) ---------- */
  const form = $('.form');
  if (form) {
    const steps = $$('.form__step', form), next = $('.js-next', form), prev = $('.js-prev', form), bar = $('.form__progress i', form);
    let i = 0;
    const render = () => {
      steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
      bar.style.width = `${Math.min(3, i + 1) / 3 * 100}%`;
      prev.hidden = i === 0 || i === 3;
      next.hidden = i === 3;
      $('span', next).textContent = i === 2 ? 'Verstuur aanvraag' : 'Volgende';
    };
    const valid = () => {
      const radios = $$('input[type=radio]', steps[i]);
      if (radios.length) return radios.some(r => r.checked);
      let ok = true;
      $$('input[required]', steps[i]).forEach(inp => {
        const bad = !inp.checkValidity();
        inp.closest('.field').classList.toggle('is-invalid', bad);
        if (bad) ok = false;
      });
      return ok;
    };
    $$('input[type=radio]', form).forEach(r => r.addEventListener('change', () => setTimeout(() => { if (i < 2) { i++; render(); } }, 320)));
    next.addEventListener('click', () => {
      if (!valid()) {
        steps[i].animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 300 });
        return;
      }
      if (i === 2) {
        // TODO: koppel aan een formulierdienst (bijv. Formspree) of eigen e-mailadres
        // fetch('https://formspree.io/f/XXXX', { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        console.info('Aanvraag:', Object.fromEntries(new FormData(form)));
      }
      i++; render();
    });
    prev.addEventListener('click', () => { i = Math.max(0, i - 1); render(); });
    form.addEventListener('submit', e => e.preventDefault());
    render();
  }
})();
