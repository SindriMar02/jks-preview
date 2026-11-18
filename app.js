/* JKS / Santa Rosalía. Motion spec: _docs/jks-fasteignir-2026-11-18/design/MOTION.md.
   GSAP + ScrollTrigger own every transform they touch; CSS owns hover/press feedback only. Lenis on fine pointers
   only. Everything degrades to visible, static content (html.js is removed by a failsafe if this never runs). */
(() => {
  const html = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const G = window.gsap, ST = window.ScrollTrigger;
  const still = reduce.matches || !G;
  try { localStorage.setItem('jks-lang', html.lang); } catch (_) { /* private mode */ }

  /* ---------- smooth scroll (desktop only, Casa Cook default lerp .1) ---------- */
  let lenis = null;
  if (!still && fine.matches && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    if (ST) { lenis.on('scroll', ST.update); G.ticker.add((t) => lenis.raf(t * 1000)); G.ticker.lagSmoothing(0); }
    else { const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
  }
  const lock = (on) => { if (lenis) on ? lenis.stop() : lenis.start(); };
  if (G && ST) G.registerPlugin(ST);

  /* ---------- opening arrival ---------- */
  const heroImg = $('.hero-m img'), heroWords = $$('.hero .split .ln > span');
  const arrive = () => {
    html.classList.add('ready');
    if (still) { $$('.rv, .split .ln > span, .rv-img, .rv-img img, .hero-m img, .bar, .strip').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; el.style.clipPath = 'none'; }); return; }
    G.set(heroWords, { y: 0, yPercent: 105 });
    const tl = G.timeline({ defaults: { ease: 'expo.out' } });
    if (heroImg) tl.to(heroImg, { scale: 1, duration: 2.4 }, 0);
    tl.to(heroWords, { yPercent: 0, y: 0, duration: 1.1, stagger: 0.09, ease: 'power4.out' }, 0.25)
      .fromTo('.hero .hero-k, .hero .hero-s', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1, stagger: 0.1 }, 0.55)
      .fromTo('.bar', { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.7 }, 0.6)
      .fromTo('.strip', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.9 }, 0.8);
  };
  if (heroImg && !heroImg.complete) { heroImg.addEventListener('load', arrive, { once: true }); setTimeout(() => html.classList.contains('ready') || arrive(), 1200); }
  else arrive();

  /* ---------- bar: solid after the hero, the dock after the strip ---------- */
  const bar = $('.bar'), hero = $('.hero');
  if (bar && hero && 'IntersectionObserver' in window) {
    /* solid once the headline has scrolled up to the bar: a sentinel 55% down the hero */
    const s = document.createElement('i'); s.style.cssText = 'position:absolute;left:0;top:55%;width:1px;height:1px;pointer-events:none';
    hero.appendChild(s);
    new IntersectionObserver(([en]) => bar.classList.toggle('is-solid', !en.isIntersecting && en.boundingClientRect.top < innerHeight), { rootMargin: `-${bar.offsetHeight}px 0px 0px 0px` }).observe(s);
  } else if (bar) bar.classList.add('is-solid');
  const strip = $('.strip'), dock = $('.dock');
  if (strip && dock && 'IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => dock.classList.toggle('is-on', !en.isIntersecting && en.boundingClientRect.top < 0), { threshold: 0 }).observe(strip);
  }

  /* ---------- scroll reveals ---------- */
  if (!still && ST) {
    $$('.split').forEach((h) => {
      if (h.closest('.hero')) return;
      G.fromTo($$('.ln > span', h), { y: 0, yPercent: 105 }, { yPercent: 0, duration: 1.1, stagger: 0.07, ease: 'power4.out', scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
    });
    $$('.rv').forEach((el) => G.fromTo(el, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }));
    $$('.rv-img').forEach((el) => {
      const im = $('img', el);
      const tl = G.timeline({ scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
      tl.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.out' }, 0);
      if (im) tl.fromTo(im, { scale: 1.15 }, { scale: 1, duration: 1.6, ease: 'expo.out' }, 0);
    });
    const mm = G.matchMedia();
    mm.add('(min-width: 768px)', () => {
      $$('.bleed-f img, .game-m img').forEach((im) => G.fromTo(im, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: im.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
      $$('.pair-b.par').forEach((el) => G.fromTo(el, { y: 60 }, { y: -60, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } }));
    });
    /* signature: the lagoon opens from a framed window to full bleed */
    $$('.lagoon').forEach((sec) => {
      const m = $('.lagoon-m', sec), wide = innerWidth >= 768;
      G.fromTo(m, { clipPath: wide ? 'inset(10% 14%)' : 'inset(6% 5%)' }, { clipPath: 'inset(0% 0%)', ease: 'none', scrollTrigger: { trigger: sec, start: 'top 85%', end: 'top 10%', scrub: true } });
      G.fromTo($('img', m), { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    addEventListener('load', () => ST.refresh());
    document.fonts && document.fonts.ready.then(() => ST.refresh());
  } else {
    $$('.lagoon-m').forEach((m) => { m.style.clipPath = 'none'; });
  }

  /* ---------- menu (phone / tablet) ---------- */
  const menuBtn = $('.bar-menu'), menu = $('#menu');
  if (menuBtn && menu) {
    let open = false, tl = null;
    const items = $$('.menu-list li, .menu-end', menu);
    const setOpen = (v, viaKey) => {
      if (v === open) return; open = v;
      menuBtn.setAttribute('aria-expanded', String(v)); menuBtn.querySelector('.bar-menu-l').textContent = v ? (menuBtn.dataset.close || 'Close') : (menuBtn.dataset.open || menuBtn.querySelector('.bar-menu-l').textContent);
      tl && tl.kill();
      if (v) {
        menu.hidden = false; html.classList.add('menu-open'); lock(true);
        if (still) { menu.classList.add('is-open'); }
        else {
          tl = G.timeline();
          tl.fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.7, ease: 'expo.inOut' })
            .fromTo(items, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.05, ease: 'expo.out' }, 0.2);
        }
        (viaKey ? $('a', menu) : menu).focus({ preventScroll: true });
      } else {
        const done = () => { menu.hidden = true; menu.classList.remove('is-open'); html.classList.remove('menu-open'); lock(false); };
        if (still) done();
        else { tl = G.timeline({ onComplete: done }); tl.to(items, { opacity: 0, duration: 0.2 }).to(menu, { clipPath: 'inset(0 0 100% 0)', duration: 0.5, ease: 'expo.inOut' }, 0.05); }
        menuBtn.focus({ preventScroll: true });
      }
    };
    menuBtn.dataset.open = menuBtn.querySelector('.bar-menu-l').textContent;
    menuBtn.dataset.close = { is: 'Loka', es: 'Cerrar' }[html.lang] || 'Close';
    menuBtn.addEventListener('click', (e) => setOpen(!open, e.detail === 0));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) setOpen(false); });
    menu.addEventListener('click', (e) => { if (e.target.closest('a, [data-book]')) setOpen(false); });
    addEventListener('resize', () => { if (open && innerWidth >= 1024) setOpen(false); });
  }

  /* ---------- language popovers ---------- */
  $$('.ls').forEach((ls) => {
    const btn = $('.ls-btn', ls), pop = $('.ls-pop', ls);
    const set = (v, viaKey) => {
      btn.setAttribute('aria-expanded', String(v));
      if (v) { pop.hidden = false; requestAnimationFrame(() => pop.classList.add('is-open')); if (viaKey) $('a', pop).focus(); }
      else { pop.classList.remove('is-open'); setTimeout(() => { if (btn.getAttribute('aria-expanded') === 'false') pop.hidden = true; }, 200); }
    };
    btn.addEventListener('click', (e) => set(btn.getAttribute('aria-expanded') !== 'true', e.detail === 0));
    document.addEventListener('click', (e) => { if (!ls.contains(e.target) && btn.getAttribute('aria-expanded') === 'true') set(false); });
    ls.addEventListener('keydown', (e) => { if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { e.stopPropagation(); set(false); btn.focus(); } });
  });

  /* ---------- photo rail: drag, arrows, progress ---------- */
  $$('.railsec').forEach((sec) => {
    const rail = $('.rail', sec), prog = $('.rail-prog i', sec), [prev, next] = $$('.rail-b', sec);
    const upd = () => {
      const max = rail.scrollWidth - rail.clientWidth, p = max > 0 ? rail.scrollLeft / max : 1;
      prog.style.transform = `scaleX(${0.1 + 0.9 * p})`;
      if (prev) { prev.disabled = rail.scrollLeft < 4; next.disabled = rail.scrollLeft > max - 4; }
    };
    rail.addEventListener('scroll', upd, { passive: true }); upd();
    const step = () => (rail.querySelector('.rail-i')?.getBoundingClientRect().width || 300) + 24;
    [prev, next].forEach((b) => b && b.addEventListener('click', () => rail.scrollBy({ left: step() * +b.dataset.dir, behavior: still ? 'auto' : 'smooth' })));
    let down = null;
    rail.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = { x: e.clientX, l: rail.scrollLeft, moved: false }; });
    addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - down.x; if (Math.abs(dx) > 4) { down.moved = true; rail.classList.add('is-drag'); } rail.scrollLeft = down.l - dx; });
    addEventListener('pointerup', () => { if (!down) return; down = null; rail.classList.remove('is-drag'); });
    rail.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); rail.scrollBy({ left: step() * (e.key === 'ArrowRight' ? 1 : -1), behavior: still ? 'auto' : 'smooth' }); } });
  });

  /* ---------- gallery filter + lightbox ---------- */
  const gal = $('.g');
  if (gal) {
    const items = $$('.g-i', gal), fs = $$('.g-f');
    fs.forEach((f) => f.addEventListener('click', () => {
      const k = f.dataset.f; fs.forEach((x) => x.setAttribute('aria-pressed', String(x === f)));
      const show = (i) => k === 'all' || i.dataset.cat === k;
      if (still) { items.forEach((i) => { i.hidden = !show(i); }); return; }
      items.forEach((i) => i.classList.add('is-out'));
      setTimeout(() => {
        items.forEach((i) => { i.hidden = !show(i); });
        items.filter((i) => !i.hidden).forEach((i, n) => setTimeout(() => i.classList.remove('is-out'), 30 * Math.min(n, 12)));
        ST && ST.refresh();
      }, 220);
    }));
    const lb = $('#lb'), lbImg = $('.lb-f img', lb), lbCap = $('.lb-f figcaption', lb), lbCount = $('.lb-c', lb);
    let cur = 0, opener = null;
    const vis = () => items.filter((i) => !i.hidden);
    const show = (n, dir = 0) => {
      const v = vis(); cur = (n + v.length) % v.length;
      const b = $('.g-b', v[cur]), im = $('img', b);
      const swap = () => { lbImg.src = b.dataset.full; lbImg.alt = im.alt; lbCap.textContent = b.getAttribute('aria-label'); lbCount.textContent = `${cur + 1} / ${v.length}`; };
      if (still || !dir) { swap(); return; }
      lbImg.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-dir * 24}px)` }], { duration: 160, easing: 'ease-in' }).onfinish = () => {
        swap(); lbImg.animate([{ opacity: 0, transform: `translateX(${dir * 24}px)` }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.16,1,.3,1)' });
      };
    };
    const openLb = (n, btn) => { opener = btn; show(n); lb.showModal(); lock(true); requestAnimationFrame(() => lb.classList.add('is-on')); $('.lb-in', lb).focus?.(); };
    const closeLb = () => { lb.classList.remove('is-on'); setTimeout(() => { lb.close(); lock(false); opener && opener.focus({ preventScroll: true }); }, still ? 0 : 300); };
    $('.lb-in', lb).tabIndex = -1;
    gal.addEventListener('click', (e) => { const b = e.target.closest('.g-b'); if (b) openLb(vis().indexOf(b.closest('.g-i')), b); });
    $('.lb-x', lb).addEventListener('click', closeLb);
    $('.lb-p', lb).addEventListener('click', () => show(cur - 1, -1));
    $('.lb-n', lb).addEventListener('click', () => show(cur + 1, 1));
    lb.addEventListener('cancel', (e) => { e.preventDefault(); closeLb(); });
    lb.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') show(cur + 1, 1); if (e.key === 'ArrowLeft') show(cur - 1, -1); });
    lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lb-in')) closeLb(); });
    let sx = null;
    lbImg.addEventListener('pointerdown', (e) => { sx = e.clientX; });
    lbImg.addEventListener('pointerup', (e) => { if (sx === null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); });
  }

  /* ---------- notify form (penthouse): preview only, nothing is sent ---------- */
  const nf = $('.nt-f');
  if (nf) nf.addEventListener('submit', (e) => {
    e.preventDefault();
    const em = $('input[type=email]', nf), note = $('.nt-note', nf);
    if (!em.value.trim() || !em.checkValidity()) { note.textContent = note.dataset.bad; em.focus(); return; }
    const done = $('.nt-done');
    const swap = () => { nf.hidden = true; done.hidden = false; done.focus({ preventScroll: true }); if (!still) G.fromTo(done, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'expo.out' }); };
    if (still) swap(); else G.to(nf, { opacity: 0, duration: 0.25, onComplete: swap });
  });

  /* ---------- booking sheet (SNDR Bókun, prototype) ---------- */
  const book = $('#book');
  if (book && window.mountBooking) {
    const t = JSON.parse(book.dataset.t);
    const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
    const W = { is: { night: ['nótt', 'nætur'], guest: ['gestur', 'gestir'], min: (n) => `Lágmarksdvöl er ${n} nætur.`, crossed: (d) => `Þessar dagsetningar ná yfir bókaðar nætur, svo ${d} er nú komudagur. Veldu brottför.` },
      en: { night: ['night', 'nights'], guest: ['guest', 'guests'], min: (n) => `Minimum stay is ${n} nights.`, crossed: (d) => `Those dates cross nights that are already booked, so ${d} is now your arrival. Choose your departure.` },
      es: { night: ['noche', 'noches'], guest: ['huésped', 'huéspedes'], min: (n) => `La estancia mínima es de ${n} noches.`, crossed: (d) => `Esas fechas cruzan noches ya reservadas, así que ${d} es ahora tu llegada. Elige la salida.` } }[html.lang] || null;
    /* Icelandic counts: 1, 21, 31 ... take the singular (except 11) */
    const one = (n) => html.lang === 'is' ? (n % 10 === 1 && n % 100 !== 11) : n === 1;
    Object.assign(t, {
      nights: (n) => `${n} ${one(n) ? W.night[0] : W.night[1]}`,
      guests: (n) => `${n} ${one(n) ? W.guest[0] : W.guest[1]}`,
      minStay: W.min, crossed: W.crossed,
    });
    const ranges = (window.TAKEN_RANGES || []);
    const taken = (k) => ranges.some(([a, b]) => k >= a && k <= b);
    /* Price guide only, never multiplied out: €2,250 for 4 nights, 1 to 5 July 2027, 6 guests, on Airbnb (18 Nov)
       ≈ €560 a night. Rates change by season; the owners confirm the real price. */
    const price = () => t.guide;
    const booking = window.mountBooking(book, { t, locale: t.locale, min: 3, max: 10, guests: 4, months: 12, taken, price, onStep: (step) => { book.dataset.step = step; } });
    let opener = null;
    const barEl = $('.bk-bar', book);
    const openBooking = (trigger, viaKey) => {
      booking.prepare();
      if (booking.step === 'done') booking.reset();
      opener = trigger; lock(true); html.classList.add('bk-open');
      if (!book.open) book.showModal();
      (viaKey ? booking.firstDay() || barEl : barEl).focus({ preventScroll: true });
    };
    const closeBooking = () => {
      if (!book.open) return;
      book.close(); html.classList.remove('bk-open'); lock(false);
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    };
    book.addEventListener('cancel', (e) => { e.preventDefault(); closeBooking(); });
    $$('[data-book-close]', book).forEach((el) => el.addEventListener('click', closeBooking));
    document.addEventListener('click', (e) => { const tr = e.target.closest('[data-book]'); if (!tr) return; e.preventDefault(); openBooking(tr, e.detail === 0); });
    if (location.hash === '#book') openBooking(null, false);
    $$('.skip').forEach((s) => s.addEventListener('click', (e) => { e.preventDefault(); openBooking(s, true); }));
  }
})();
