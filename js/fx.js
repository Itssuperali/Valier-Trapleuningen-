/* =========================================================
   VALIER — effecten: intro, hero-diavoorstelling, onthullen bij scrollen.
   Alles is decoratie: zonder dit script is de pagina volledig bruikbaar.
   ========================================================= */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  root.classList.add('fx');

  /* ---- Intro: once per visit ---- */
  const intro = document.querySelector('.intro');
  let seen = false;
  try { seen = sessionStorage.getItem('valier-intro') === '1'; sessionStorage.setItem('valier-intro', '1'); } catch { /* ignore */ }
  const start = () => root.classList.add('is-loaded');
  if (!intro || reduce || seen || location.hash) { intro?.remove(); start(); }
  else {
    root.classList.add('is-intro');
    setTimeout(() => { root.classList.remove('is-intro'); start(); }, 1500);
    setTimeout(() => intro.remove(), 2600);
  }

  /* ---- Hero slideshow with progress bars ---- */
  const slides = [...document.querySelectorAll('.hero2__media .hs')];
  const bars = [...document.querySelectorAll('.hero2__bars i')];
  const cap = document.querySelector('.js-hs-cap'), num = document.querySelector('.js-hs-n');
  let at = 0, timer = null;
  const DUR = 6000;
  const show = i => {
    slides[at].classList.remove('is-on');
    at = (i + slides.length) % slides.length;
    slides[at].classList.add('is-on');
    if (slides[at].loading === 'lazy') slides[at].loading = 'eager';
    cap.textContent = slides[at].dataset.cap;
    num.textContent = String(at + 1).padStart(2, '0');
    bars.forEach((b, k) => { b.classList.toggle('is-done', k < at); b.classList.remove('is-run'); });
    void bars[at]?.offsetWidth;
    if (!reduce) bars[at]?.classList.add('is-run');
  };
  if (slides.length > 1) {
    bars.forEach(b => b.style.setProperty('--dur', DUR + 'ms'));
    const play = () => { clearInterval(timer); if (!reduce) timer = setInterval(() => show(at + 1), DUR); };
    show(0); play();
    document.addEventListener('visibilitychange', () => (document.hidden ? clearInterval(timer) : play()));
    bars.forEach((b, k) => { b.addEventListener('click', () => { show(k); play(); }); });
  }

  /* ---- Reveal on scroll ---- */
  const els = [...document.querySelectorAll('.reveal')];
  if (reduce || !('IntersectionObserver' in window)) els.forEach(e => e.classList.add('is-in'));
  else {
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -10% 0px' });
    els.forEach((e, i) => { e.style.transitionDelay = `${(i % 3) * 110}ms`; io.observe(e); });
  }

  /* ---- Gentle parallax on the hero photo ---- */
  const media = document.querySelector('.hero2__media');
  if (media && !reduce) {
    let ticking = false;
    addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = Math.min(scrollY, innerHeight);
        media.style.setProperty('--py', (y * 0.12).toFixed(1) + 'px');
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---- Nav turns dark while over the dark hero ---- */
  const nav = document.querySelector('.nav'), hero = document.querySelector('.hero2');
  if (nav && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => nav.classList.toggle('nav--dark', en.isIntersecting), { rootMargin: '-60px 0px -100% 0px' }).observe(hero);
  }
})();
