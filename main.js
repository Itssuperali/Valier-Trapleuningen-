/* =========================================================
   VALIER — Interaction & motion
   ========================================================= */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- Split manifest into words ---------- */
  $$('.js-split-words').forEach(el => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
  });

  /* ---------- Fallback: no GSAP or reduced motion ---------- */
  if (!hasGSAP || reduce) {
    $('.intro')?.remove();
    document.body.classList.remove('is-loading');
    $$('.manifest__text .w').forEach(w => (w.style.opacity = 1));
    $$('[data-count]').forEach(n => (n.textContent = n.dataset.count));
    initForm();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  const ease = 'expo.out';

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.25, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const target = id === '#top' ? 0 : $(id);
      if (target === null) return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.8 });
    }));
  }

  /* ---------- Path helpers ---------- */
  const prepPath = p => {
    const len = p.getTotalLength();
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
    return len;
  };

  /* ---------- Intro ---------- */
  const introPaths = $$('.intro__line path');
  introPaths.forEach(prepPath);
  const counter = { v: 0 };
  gsap.set('.hero__title .line > span', { yPercent: 110 });
  gsap.set('.reveal-up, .hero .btn, .nav', { autoAlpha: 0, y: 20 });
  const heroRail = $('.scene__rail-path');
  prepPath(heroRail);

  const intro = gsap.timeline({ defaults: { ease } });
  intro
    .from('.intro__word span', { yPercent: 110, duration: 1.4, stagger: 0.06 })
    .to(introPaths, { strokeDashoffset: 0, duration: 1.6, stagger: 0.3, ease: 'power2.inOut' }, 0.2)
    .to(counter, {
      v: 100, duration: 1.9, ease: 'power2.inOut',
      onUpdate: () => ($('.js-count').textContent = String(Math.round(counter.v)).padStart(3, '0'))
    }, 0)
    .to('.intro__word span', { yPercent: -110, duration: 1, stagger: 0.04, ease: 'expo.in' }, 2.1)
    .to('.intro__line, .intro__count', { autoAlpha: 0, duration: .6 }, 2.2)
    .to('.intro', { clipPath: 'inset(0 0 100% 0)', duration: 1.3, ease: 'expo.inOut' }, 2.6)
    .add(() => {
      $('.intro').remove();
      document.body.classList.remove('is-loading');
      lenis?.start();
      ScrollTrigger.refresh();
    })
    .from('.scene', { scale: 1.2, duration: 2.6, ease: 'expo.out' }, 2.7)
    .to(heroRail, { strokeDashoffset: 0, duration: 2.4, ease: 'expo.inOut' }, 2.9)
    .to('.hero__title .line > span', { yPercent: 0, duration: 1.6, stagger: 0.12 }, 3.1)
    .to('.reveal-up, .hero .btn, .nav', { autoAlpha: 1, y: 0, duration: 1.4, stagger: 0.08 }, 3.5);

  /* ---------- Hero parallax ---------- */
  gsap.to('.scene', {
    yPercent: 14, scale: 1.08, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('.hero__content', {
    yPercent: -30, autoAlpha: 0, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true }
  });

  /* ---------- Nav hide on scroll down ---------- */
  const nav = $('.nav');
  ScrollTrigger.create({
    start: 200, end: 'max',
    onUpdate: s => nav.classList.toggle('is-hidden', s.direction === 1)
  });

  /* ---------- Manifest word reveal ---------- */
  gsap.to('.manifest__text .w', {
    opacity: 1, stagger: 0.05, ease: 'none',
    scrollTrigger: { trigger: '.manifest__text', start: 'top 80%', end: 'bottom 45%', scrub: true }
  });

  /* ---------- Section headings reveal ---------- */
  $$('.h2').filter(h => !h.closest('.draw, .materials')).forEach(h => {
    gsap.from(h, {
      y: 60, autoAlpha: 0, duration: 1.6, ease,
      scrollTrigger: { trigger: h, start: 'top 85%' }
    });
  });

  /* ---------- Horizontal materials ---------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 861px)', () => {
    const track = $('.materials__track');
    const dist = () => track.scrollWidth - window.innerWidth;
    gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '.materials', start: 'top top', end: () => '+=' + dist(),
        pin: '.materials__pin', scrub: 1, invalidateOnRefresh: true
      }
    });
  });
  mm.add('(max-width: 860px)', () => {
    $('.materials__pin').style.height = 'auto';
    $('.materials__track').style.cssText = 'width:auto;flex-direction:column';
  });

  /* ---------- Draw the railing ---------- */
  const drawRail = $('.draw__rail');
  const drawSteps = $('.draw__steps path');
  prepPath(drawRail); prepPath(drawSteps);
  const drawTl = gsap.timeline({
    scrollTrigger: { trigger: '.draw', start: 'top top', end: '+=140%', pin: '.draw__pin', scrub: 1 }
  });
  drawTl
    .to(drawSteps, { strokeDashoffset: 0, duration: 1, ease: 'none' })
    .from('.draw__posts line', { scaleY: 0, transformOrigin: 'bottom', stagger: .1, duration: .4 }, .5)
    .to(drawRail, { strokeDashoffset: 0, duration: 1, ease: 'power1.inOut' }, .9)
    .from('.draw__dims text', { autoAlpha: 0, y: 10, stagger: .1, duration: .3 }, 1.6)
    .from('.draw__copy > *', { autoAlpha: 0, y: 40, stagger: .1, duration: .6 }, .2);

  /* ---------- Process steps ---------- */
  gsap.from('.step', {
    y: 50, autoAlpha: 0, duration: 1.4, stagger: 0.12, ease,
    scrollTrigger: { trigger: '.process__list', start: 'top 80%' }
  });

  /* ---------- Projects: reveal + inner parallax ---------- */
  $$('.proj').forEach(p => {
    const img = $('.proj__img', p);
    gsap.from(img, {
      clipPath: 'inset(100% 0 0 0)', duration: 1.8, ease: 'expo.inOut',
      scrollTrigger: { trigger: p, start: 'top 85%' }
    });
    gsap.fromTo($('.ph', p), { yPercent: -8 }, {
      yPercent: 8, ease: 'none',
      scrollTrigger: { trigger: p, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  /* ---------- Counters ---------- */
  $$('[data-count]').forEach(n => {
    const o = { v: 0 };
    gsap.to(o, {
      v: +n.dataset.count, duration: 2.2, ease: 'power3.out',
      onUpdate: () => (n.textContent = Math.round(o.v)),
      scrollTrigger: { trigger: n, start: 'top 85%' }
    });
  });

  gsap.from('.quote p', {
    y: 60, autoAlpha: 0, duration: 1.8, ease,
    scrollTrigger: { trigger: '.quote', start: 'top 80%' }
  });

  /* ---------- Footer mark ---------- */
  gsap.from('.footer__mark', {
    yPercent: 40, ease: 'none',
    scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true }
  });

  /* ---------- Cursor & magnetic ---------- */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const cursor = $('.cursor');
    const xTo = gsap.quickTo(cursor, 'x', { duration: .5, ease: 'power3' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: .5, ease: 'power3' });
    window.addEventListener('mousemove', e => { xTo(e.clientX); yTo(e.clientY); });
    $$('a, button, label').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
    });
    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .35, duration: .6, ease: 'power3' });
      });
      el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, .4)' }));
    });
  }

  initForm();

  /* ---------- Multi-step intake ---------- */
  function initForm() {
    const form = $('.form');
    if (!form) return;
    const steps = $$('.form__step', form);
    const next = $('.js-next', form);
    const prev = $('.js-prev', form);
    const bar = $('.form__progress i', form);
    let i = 0;

    const render = () => {
      steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
      bar.style.width = `${((i + 1) / 3) * 100}%`;
      prev.hidden = i === 0 || i === 3;
      next.hidden = i === 3;
      $('span', next).textContent = i === 2 ? 'Verstuur aanvraag' : 'Volgende';
    };

    const valid = () => {
      const step = steps[i];
      const radios = $$('input[type=radio]', step);
      if (radios.length) return radios.some(r => r.checked);
      let ok = true;
      $$('input[required]', step).forEach(inp => {
        const bad = !inp.checkValidity();
        inp.closest('.field').classList.toggle('is-invalid', bad);
        if (bad) ok = false;
      });
      return ok;
    };

    $$('input[type=radio]', form).forEach(r => r.addEventListener('change', () => {
      setTimeout(() => { if (i < 2) { i++; render(); } }, 350);
    }));

    next.addEventListener('click', () => {
      if (!valid()) {
        steps[i].animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 300 });
        return;
      }
      if (i === 2) {
        // TODO: koppel aan Formspree / HubSpot / eigen endpoint
        // fetch('https://formspree.io/f/XXXX', { method: 'POST', body: new FormData(form) });
        console.info('Aanvraag:', Object.fromEntries(new FormData(form)));
      }
      i++; render();
    });
    prev.addEventListener('click', () => { i = Math.max(0, i - 1); render(); });
    form.addEventListener('submit', e => e.preventDefault());
    render();
  }
})();
