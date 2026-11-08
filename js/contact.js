/* VALIER — contactformulier */
(() => {
  const form = document.getElementById('contact'); if (!form) return;
  const status = form.querySelector('[data-status]');
  form.addEventListener('input', e => e.target.closest('.field')?.classList.remove('is-invalid'));
  form.addEventListener('submit', e => {
    e.preventDefault();
    let first = null;
    form.querySelectorAll('[required]').forEach(inp => {
      const bad = !inp.value.trim() || !inp.checkValidity();
      inp.closest('.field').classList.toggle('is-invalid', bad);
      if (bad && !first) first = inp;
    });
    if (first) { status.textContent = 'Vul de gemarkeerde velden in.'; status.style.color = 'var(--danger)'; first.focus(); return; }
    status.style.color = '';
    if (window.VALIER_DEMO === true) { status.textContent = 'Dit is een demo: je bericht is niet verstuurd.'; form.reset(); return; }
    const next = document.createElement('input');
    next.type = 'hidden'; next.name = '_next'; next.value = `${location.origin}${location.pathname}?verstuurd=1`;
    form.appendChild(next);
    const btn = form.querySelector('[type="submit"]'); btn.disabled = true; btn.textContent = 'Bezig met versturen…';
    form.submit();
  });
  if (new URLSearchParams(location.search).has('verstuurd')) status.textContent = 'Bedankt, je bericht is verstuurd. We reageren zo snel mogelijk.';
})();
