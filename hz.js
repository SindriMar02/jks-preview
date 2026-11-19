/* ALMENDRO landing motion. Every value is from the Horizonte source teardown unless marked "ours"
   (_docs/jks-fasteignir-2026-11-18/design/TEARDOWN-HORIZONTE.md §2 grammar, §4 sections). */
(() => {
  const html = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const G = window.gsap, ST = window.ScrollTrigger, Split = window.SplitText;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const desktop = () => innerWidth >= 1024;
  if (!G) { html.classList.add('no-motion'); return; }
  G.registerPlugin(ST); if (Split) G.registerPlugin(Split);
  const EASE = 'cubic-bezier(.16,1,.3,1)';
  G.defaults({ ease: 'expo.out' });
  const ease = (t) => 1 - Math.pow(1 - t, 4);                 // close to (.16,1,.3,1) for GSAP tweens
  const DE = 'power4.out';
  try { localStorage.setItem('jks-lang', html.lang); } catch (_) {}
  if (reduce) html.classList.add('no-motion');

  /* ---------- Lenis (measured: Lenis on the site; ours: fine pointers only) ---------- */
  let lenis = null;
  if (!reduce && fine && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ST.update); G.ticker.add((t) => lenis.raf(t * 1000)); G.ticker.lagSmoothing(0);
    html.classList.add('lenis');
    window.__lenis = lenis;   // test hook: captures jump with lenis.scrollTo(y, { immediate: true })
  }
  const lock = (on) => { if (lenis) on ? lenis.stop() : lenis.start(); document.body.style.overflow = on ? 'hidden' : ''; };

  /* ---------- reveal grammar (§2) ---------- */
  function titleIn(el, delay = 0) {
    if (!Split || reduce) return G.timeline();
    const sp = new Split(el, { type: 'words,chars', wordsClass: 'w', charsClass: 'c' });
    const tl = G.timeline({ delay });
    sp.words.forEach((w) => {
      tl.fromTo($$('.c', w), { opacity: 0, scale: 1.7 }, { opacity: 1, scale: 1, duration: 0.5, ease: DE, stagger: { each: 0.015, from: 'edges' } }, Math.random() * 0.5);
    });
    return tl;
  }
  function textIn(el) {
    el.style.visibility = 'visible';
    if (!Split || reduce) return;
    const sp = new Split(el, { type: 'lines' });
    G.from(sp.lines, { yPercent: 20, autoAlpha: 0, duration: 0.8, stagger: 0.05, ease: DE });
  }
  $$('.anim-title').forEach((el) => {
    if (reduce) return;
    G.set(el, { autoAlpha: 0 });
    ST.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => { G.set(el, { autoAlpha: 1 }); titleIn(el); } });
  });
  $$('.anim-text').forEach((el) => {
    if (reduce) { el.style.visibility = 'visible'; return; }
    ST.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => textIn(el) });
  });
  /* photo parallax (§2: wrapper scale 1.2, scrub top bottom → bottom top; travel est. ±8%) */
  if (!reduce) $$('.wrap img').forEach((im) => G.fromTo(im, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: im.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));

  /* ---------- header: theme per section, hide on scroll down (§4 header) ---------- */
  const hd = $('.hd');
  if (hd) {
    let last = 0;
    ST.create({ start: 0, end: 'max', onUpdate: (s) => {
      const y = s.scroll(), down = y > last && y > 200; last = y;
      if (!html.classList.contains('menu-open')) hd.classList.toggle('is-hidden', down);
    } });
    $$('[data-theme]').forEach((sec) => {
      if (sec === hd) return;
      ST.create({ trigger: sec, start: 'top 4rem', end: 'bottom 4rem', onToggle: (s) => { if (s.isActive) hd.dataset.theme = sec.dataset.theme; } });
    });
    const hero = $('#hero');
    if (hero) ST.create({ trigger: hero, start: 'top top', end: 'bottom 4rem', onToggle: (s) => { if (s.isActive) hd.dataset.theme = 'light'; } });
  }

  /* ---------- hero (§4.1) ---------- */
  const hero = $('#hero');
  if (hero) {
    const word = $('.stage-word', hero), photo = $('.stage-photo', hero), cut = $('.stage-cut', hero);
    const titles = $$('.hero-title', hero), discs = $$('.discs .disc', hero), desc = $('.hero-desc', hero);
    const fromGate = html.classList.contains('from-gate');
    /* ALMENDRO: eight outlined letters rise one at a time from behind the palms (the sky-free cutout sits in front),
       each easing out while the next starts, so it reads as one wave. Letters start hidden in CSS before first paint. */
    const letters = $$('.wm-l', word);
    function lettersIn(delay) {
      G.set(word, { autoAlpha: 1 });
      return G.fromTo(letters, { yPercent: 62, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.7, ease: 'expo.out', stagger: { each: 0.085 }, delay });
    }
    if (reduce) G.set(letters, { opacity: 1, yPercent: 0 });
    /* arrival (ours, using the grammar): photo settles, wordmark chars arrive, then the labels */
    if (reduce) G.set([desc, $('.hero-loc', hero), $('.hero-scroll', hero), hd], { autoAlpha: 1 });
    if (!reduce) {
      if (!fromGate) {
        const tl = G.timeline();
        tl.from(photo, { scale: 1.12, duration: 2.2, ease: 'power3.out' }, 0).from(cut, { scale: 1.16, duration: 2.2, ease: 'power3.out' }, 0);
        tl.add(lettersIn(0.55), 0);
        tl.fromTo([desc, $('.hero-loc', hero), $('.hero-scroll', hero), hd], { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.08, ease: DE }, 0.9);
      } else {
        lettersIn(0.15);
        G.fromTo([desc, $('.hero-loc', hero), $('.hero-scroll', hero), hd], { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08, ease: DE, delay: 0.35 });
      }
    }
    /* wordmark → header mark (measured: scale 152/1360, y up, over 0 → .5 innerHeight, scrub) */
    const mark = $('.hd-mark');
    const toMark = () => {
      const w = ($('.wm', word) || word).getBoundingClientRect(), m = ($('.wm', mark) || mark).getBoundingClientRect();
      const s = (m.width / Math.max(w.width, 1));
      return { s, dy: (m.top + m.height / 2) - (w.top + w.height / 2) };
    };
    let tm = toMark();
    G.to(word, { scale: () => tm.s, y: () => tm.dy, ease: 'none', transformOrigin: '50% 50%',
      scrollTrigger: { trigger: hero, start: 0, end: () => innerHeight * 0.5, scrub: 0.6, invalidateOnRefresh: true,
        onRefreshInit: () => { G.set(word, { clearProps: 'transform' }); tm = toMark(); },
        onLeave: () => { hd.classList.add('mark-in'); G.to(word, { autoAlpha: 0, duration: 0.35, ease: 'power1.out', overwrite: 'auto' }); },
        onEnterBack: () => { hd.classList.remove('mark-in'); G.to(word, { autoAlpha: 1, duration: 0.25, ease: 'power1.out', overwrite: 'auto' }); } } });
    /* description lines out (measured: yPercent 20, autoAlpha 0, stagger -.15, 0 → .5 innerHeight) */
    if (Split && desc) { const sp = new Split(desc, { type: 'lines' }); G.to(sp.lines, { yPercent: 20, autoAlpha: 0, stagger: -0.15, ease: 'none', scrollTrigger: { trigger: hero, start: 0, end: () => innerHeight * 0.5, scrub: true } }); }
    G.to([$('.hero-loc', hero), $('.hero-scroll', hero)], { autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 0, end: () => innerHeight * 0.4, scrub: true } });
    /* the flight (sequence stand-in, ours): photo and cutout dolly in at different rates toward the island */
    G.to(photo, { scale: 1.28, ease: 'none', transformOrigin: '50% 58%', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: true } });
    G.to(cut, { scale: 1.55, ease: 'none', transformOrigin: '50% 62%', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: true } });
    /* titles (measured windows: k=2 viewports split across the titles, in + out each scrubbed) */
    const n = titles.length, k = 2;
    titles.forEach((t, i) => {
      const E = k / n - 0.5, W = 0.5, z = i * E + W, X = i !== n - 1 ? z + E : z + E / 2;
      let sp = Split ? new Split(t, { type: 'words,chars', charsClass: 'c' }) : null;
      const chars = sp ? sp.chars : [t];
      G.set(t, { opacity: 1 }); G.set(chars, { opacity: 0, scale: 1.7 });
      G.to(chars, { opacity: 1, scale: 1, ease: 'none', stagger: { each: 0.015, from: 'edges' },
        scrollTrigger: { trigger: hero, start: () => innerHeight * z, end: () => innerHeight * (i === n - 1 ? X : z + (X - z) / 2 - 0.1), scrub: true,
          onEnter: () => { if (i === n - 1) showDiscs(true); }, onLeaveBack: () => { if (i === n - 1) showDiscs(false); } } });
      if (i < n - 1) G.fromTo(chars, { opacity: 1, scale: 1 }, { opacity: 0, scale: 0.8, ease: 'none', immediateRender: false, stagger: { each: 0.01, from: 'edges' },
        scrollTrigger: { trigger: hero, start: () => innerHeight * (z + (X - z) / 2 + 0.1), end: () => innerHeight * X, scrub: true } });
    });
    function showDiscs(on) { G.to(discs, { autoAlpha: on ? 1 : 0, duration: 0.4, stagger: -0.1, ease: DE, onStart: () => discs.forEach((d) => { d.style.pointerEvents = on ? 'all' : 'none'; }) }); }
    /* smart discs: hover / focus shows what the disc is (status, facts, where it goes) and dims the scene;
       touch: first tap opens the card, a second tap follows the link */
    const hin = $('.hero-in', hero);
    const hot = (d, on) => { discs.forEach((x) => x.classList.toggle('is-hot', on && x === d)); hin.classList.toggle('has-disc', !!on); };
    discs.forEach((d) => {
      d.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hot(d, true); });
      d.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hot(d, false); });
      d.addEventListener('focus', () => { if (html.dataset.input !== 'pointer') hot(d, true); }); d.addEventListener('blur', () => hot(d, false));
      let ptype = 'mouse';
      d.addEventListener('pointerdown', (e) => { ptype = e.pointerType; });
      d.addEventListener('click', (e) => { if ((ptype === 'touch' || ptype === 'pen' || !fine) && !d.classList.contains('is-hot')) { e.preventDefault(); hot(d, true); } });
    });
    document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.disc')) hot(null, false); });
    /* hero background sinks as the hero leaves (measured: yPercent 30, bottom bottom → bottom top) */
    G.to($('.stage', hero), { yPercent: 30, ease: 'none', scrollTrigger: { trigger: hero, start: 'bottom bottom', end: 'bottom top', scrub: true } });
  }

  /* ---------- interior: stretch-slide room switch (§4.7, measured) ---------- */
  const interior = $('.interior');
  if (interior) {
    const btns = $$('.room-btn', interior), photos = $$('.room-photo', interior), descEl = $('.int-desc', interior);
    const descs = JSON.parse(descEl.dataset.desc); let cur = 0, busy = false;
    const go = (to) => {
      if (to === cur || busy) return; busy = true;
      btns.forEach((b, i) => b.setAttribute('aria-pressed', String(i === to)));
      const A = photos[cur], B = photos[to], Ai = $('.room-inner', A), Bi = $('.room-inner', B);
      const pts = $$('.pt', A).concat($$('.pt', B));
      if (reduce) { A.classList.remove('is-on'); B.classList.add('is-on'); G.set(B, { zIndex: 3 }); G.set(A, { zIndex: -1 }); descEl.textContent = descs[to]; cur = to; busy = false; return; }
      G.to($$('.pt', A), { opacity: 0, duration: 0.4, stagger: 0.1, ease: DE });
      G.set(A, { zIndex: 2, transformOrigin: 'right center' }); G.set(B, { zIndex: 3, transformOrigin: 'left center' });
      G.fromTo(A, { xPercent: 0 }, { xPercent: -100, duration: 1.1, ease: 'power2.out' });
      G.fromTo(Ai, { scaleX: 1, scaleY: 1, xPercent: 0 }, { scaleX: 2.2, scaleY: 1.2, xPercent: 30, duration: 1.1, ease: 'power2.out' });
      G.fromTo(B, { xPercent: 100 }, { xPercent: 0, duration: 1.1, ease: 'power2.out', onComplete: () => { G.set(A, { zIndex: -1, xPercent: 0 }); G.set(Ai, { clearProps: 'transform' }); A.classList.remove('is-on'); B.classList.add('is-on'); busy = false; } });
      G.fromTo(Bi, { scaleX: 2.2, scaleY: 1.2, xPercent: -30 }, { scaleX: 1, scaleY: 1, xPercent: 0, duration: 1.1, ease: 'power2.out' });
      G.fromTo($$('.pt', B), { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.1, ease: DE, delay: 0.8 });
      // description lines out (yPercent 20, stagger -.05, .4 s) then in (stagger .05)
      const out = Split ? new Split(descEl, { type: 'lines' }).lines : [descEl];
      G.to(out, { yPercent: 20, autoAlpha: 0, duration: 0.4, stagger: -0.05, ease: DE, onComplete: () => {
        descEl.textContent = descs[to];
        const inn = Split ? new Split(descEl, { type: 'lines' }).lines : [descEl];
        G.from(inn, { yPercent: 20, autoAlpha: 0, duration: 0.4, stagger: 0.05, ease: DE });
      } });
      cur = to; if (cnt) cnt.textContent = String(to + 1).padStart(2, '0');
    };
    btns.forEach((b, i) => b.addEventListener('click', () => go(i)));
    const cnt = $('.int-n', interior);
    $$('.int-b', interior).forEach((b) => b.addEventListener('click', () => go((cur + +b.dataset.d + photos.length) % photos.length)));
    $('.int-photos', interior).addEventListener('click', (e) => { if (!e.target.closest('.pt')) go((cur + 1) % photos.length); });
    photos.forEach((p, i) => { if (i) G.set(p, { zIndex: -1 }); });
    interior.addEventListener('click', (e) => { const p = e.target.closest('.pt'); if (!p) return; const was = p.classList.contains('is-open'); $$('.pt.is-open', interior).forEach((x) => x.classList.remove('is-open')); if (!was) p.classList.add('is-open'); });
  }

  /* ---------- location cards: active card opens its photo (§4.4) + numbers count up (ours) ---------- */
  /* the drawn map: the coast inks in once (like the gate drawing), then the routes; a list row lights its route */
  $$('.loc-map').forEach((m) => {
    const coast = $$('.mp-coast path', m);
    coast.forEach((pth) => { const L = pth.getTotalLength(); pth.style.strokeDasharray = L; pth.style.strokeDashoffset = reduce ? 0 : L; });
    if (!reduce) {
      G.set($$('.mp-sea, .mp-minor, .mp-pt, .mp-home, .mp-routes', m), { autoAlpha: 0 });
      ST.create({ trigger: m, start: 'top 80%', once: true, onEnter: () => {
        G.to(coast, { strokeDashoffset: 0, duration: 2.6, ease: 'power3.inOut', stagger: 0.004 });
        G.to($$('.mp-sea, .mp-minor', m), { autoAlpha: 1, duration: 1.2, ease: DE, delay: 1.2, stagger: 0.08 });
        G.to($$('.mp-home, .mp-pt', m), { autoAlpha: 1, duration: 1, ease: DE, delay: 1.6, stagger: 0.1 });
        G.to($('.mp-routes', m), { autoAlpha: 1, duration: 1.2, ease: DE, delay: 2.1 });
      } });
    }
  });
  $$('.loc-body').forEach((lb) => {
    const rows = $$('.lrow', lb), phs = $$('.lph', lb);
    const marks = $$('.mp-route, .mp-pt', lb);
    const pick = (i) => { rows.forEach((r, j) => r.classList.toggle('is-on', j === i)); phs.forEach((ph, j) => ph.classList.toggle('is-on', j === i)); marks.forEach((m) => m.classList.toggle('is-on', +m.dataset.i === i)); lb.classList.add('has-pick'); };
    pick(0);
    rows.forEach((r, i) => { r.addEventListener('mouseenter', () => pick(i)); r.addEventListener('focus', () => pick(i)); r.addEventListener('click', () => pick(i)); });
  });
  const dcards = $$('.dcard');
  dcards.forEach((c) => {
    const on = () => { dcards.forEach((x) => x.classList.toggle('is-on', x === c)); };
    c.addEventListener('mouseenter', on); c.addEventListener('focus', on); c.addEventListener('click', on);
  });
  const nums = $$('.dcard-n');
  if (nums.length && !reduce) ST.create({ trigger: '.lrows', start: 'top 85%', once: true, onEnter: () => nums.forEach((el, i) => {
    const to = +el.dataset.n, o = { v: 0 }; G.to(o, { v: to, duration: 0.9, delay: i * 0.08, ease: DE, onUpdate: () => { el.textContent = Math.round(o.v); } });
  }) });

  /* ---------- amenity cards: click opens the description through a closing circle (§4.8) ---------- */
  const acards = $$('.acard'), prog = $('.amen-prog i'), count = $('.amen-ctl .l1');
  acards.forEach((c, i) => {
    const toggle = () => {
      const open = !c.classList.contains('is-open');
      acards.forEach((x) => x.classList.remove('is-open')); if (open) c.classList.add('is-open');
      if (prog) prog.style.width = `${((i + 1) / acards.length) * 100}%`;
      if (count) count.textContent = `0${i + 1} / 0${acards.length}`;
    };
    c.addEventListener('click', toggle);
    c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.acard')) acards.forEach((x) => x.classList.remove('is-open')); });

  /* ---------- menu (measured modal grammar: panel .8 s + overlay .8 s; close reverses) ---------- */
  const mBtn = $('.hd-menu'), menu = $('#menu');
  if (mBtn && menu) {
    const panel = $('.menu-in', menu), bg = $('.menu-bg', menu), items = $$('.menu-list li, .menu-foot', menu);
    let tl = null, open = false;
    const set = (v, key) => {
      if (v === open) return; open = v; mBtn.setAttribute('aria-expanded', String(v));
      tl && tl.kill();
      if (v) {
        menu.hidden = false; html.classList.add('menu-open'); hd.classList.remove('is-hidden'); lock(true);
        tl = G.timeline().to(panel, { x: 0, xPercent: 0, duration: reduce ? 0 : 0.8, ease: DE }).to(bg, { opacity: 1, duration: reduce ? 0 : 0.8, ease: DE }, '<')
          .fromTo(items, { x: -24, opacity: 0 }, { x: 0, opacity: 1, duration: reduce ? 0 : 0.8, stagger: 0.05, ease: DE }, '<0.15');
        (key ? $('a', menu) : menu).focus({ preventScroll: true });
      } else {
        tl = G.timeline({ onComplete: () => { menu.hidden = true; html.classList.remove('menu-open'); lock(false); } })
          .to(panel, { xPercent: -100, duration: reduce ? 0 : 0.6, ease: 'power3.inOut' }).to(bg, { opacity: 0, duration: reduce ? 0 : 0.6 }, '<');
        mBtn.focus({ preventScroll: true });
      }
    };
    G.set(panel, { xPercent: -100 });
    mBtn.addEventListener('click', (e) => set(!open, e.detail === 0));
    bg.addEventListener('click', () => set(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) set(false); });
  }

  /* ---------- booking sheet (SNDR Bókun, same wiring as the inner pages) ---------- */
  const book = $('#book');
  if (book && window.mountBooking) {
    const t = JSON.parse(book.dataset.t);
    const W = { is: { night: ['nótt', 'nætur'], guest: ['gestur', 'gestir'], min: (n) => `Lágmarksdvöl er ${n} nætur.`, crossed: (d) => `Þessar dagsetningar ná yfir bókaðar nætur, svo ${d} er nú komudagur. Veldu brottför.` },
      en: { night: ['night', 'nights'], guest: ['guest', 'guests'], min: (n) => `Minimum stay is ${n} nights.`, crossed: (d) => `Those dates cross nights that are already booked, so ${d} is now your arrival. Choose your departure.` },
      es: { night: ['noche', 'noches'], guest: ['huésped', 'huéspedes'], min: (n) => `La estancia mínima es de ${n} noches.`, crossed: (d) => `Esas fechas cruzan noches ya reservadas, así que ${d} es ahora tu llegada. Elige la salida.` } }[html.lang];
    const one = (n) => html.lang === 'is' ? (n % 10 === 1 && n % 100 !== 11) : n === 1;
    Object.assign(t, { nights: (n) => `${n} ${one(n) ? W.night[0] : W.night[1]}`, guests: (n) => `${n} ${one(n) ? W.guest[0] : W.guest[1]}`, minStay: W.min, crossed: W.crossed });
    const ranges = window.TAKEN_RANGES || [];
    const booking = window.mountBooking(book, { t, locale: t.locale, min: 3, max: 10, guests: 4, months: 12, taken: (k) => ranges.some(([a, b]) => k >= a && k <= b), price: () => t.guide, onStep: (s) => { book.dataset.step = s; } });
    let opener = null; const bar = $('.bk-bar', book);
    const openB = (tr, key) => { booking.prepare(); if (booking.step === 'done') booking.reset(); opener = tr; lock(true); html.classList.add('bk-open'); if (!book.open) book.showModal(); (key ? booking.firstDay() || bar : bar).focus({ preventScroll: true }); };
    const closeB = () => { if (!book.open) return; book.close(); html.classList.remove('bk-open'); lock(false); opener && opener.focus && opener.focus({ preventScroll: true }); };
    book.addEventListener('cancel', (e) => { e.preventDefault(); closeB(); });
    $$('[data-book-close]', book).forEach((el) => el.addEventListener('click', closeB));
    document.addEventListener('click', (e) => { const tr = e.target.closest('[data-book]'); if (!tr) return; e.preventDefault(); openB(tr, e.detail === 0); });
  }

  /* ---------- inner-page hero arrival (title grammar + photo settle) ---------- */
  const ph = $('.phero');
  if (ph && !reduce) {
    const tl = G.timeline();
    tl.from($('.phero-ph img', ph), { scale: 1.32, duration: 2.2, ease: 'power3.out' }, 0);
    tl.add(titleIn($('.phero-t', ph)), 0.3);
    tl.from($$('.phero-k, .phero-s, .phero-cta, .phero-scroll, .phero .tag', ph).concat(hd), { autoAlpha: 0, y: 12, duration: 0.8, stagger: 0.08, ease: DE }, 0.7);
  }

  /* ---------- gallery: Horizonte directional wipe; buttons, arrow keys and swipe (no wheel capture) ---------- */
  $$('.gal').forEach((g) => {
    const slides = $$('.gs', g), n = slides.length, num = $('.gal-n', g), capEl = $('.gal-cap', g), caps = JSON.parse(capEl.dataset.caps);
    let cur = 0, busy = false;
    const show = (to, dir) => {
      to = (to + n) % n; if (to === cur || busy) return; busy = true;
      const A = slides[cur], Bs = slides[to], Bi = $('.gs-in', Bs);
      G.set(Bs, { zIndex: 3 }); G.set(A, { zIndex: 2 });
      const from = dir > 0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)';
      const done = () => { A.classList.remove('is-on'); G.set(A, { zIndex: 1, clipPath: 'inset(0 0 0 100%)' }); Bs.classList.add('is-on'); G.set(Bs, { zIndex: 2, clearProps: 'clipPath' }); busy = false; };
      if (reduce) { G.set(Bs, { clipPath: 'inset(0)' }); done(); }
      else {
        G.fromTo(Bs, { clipPath: from }, { clipPath: 'inset(0 0 0 0%)', duration: 1.2, ease: 'expo.inOut', onComplete: done });
        G.fromTo(Bi, { scale: 1.25, xPercent: dir * 8 }, { scale: 1, xPercent: 0, duration: 1.6, ease: 'expo.out' });
        G.to($('.gs-in', A), { xPercent: -dir * 12, duration: 1.2, ease: 'expo.inOut', onComplete: () => G.set($('.gs-in', A), { clearProps: 'transform' }) });
      }
      cur = to; num.textContent = String(to + 1).padStart(2, '0');
      G.fromTo(capEl, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: DE, onStart: () => { capEl.textContent = caps[to]; } });
    };
    $$('.gal-b', g).forEach((b) => b.addEventListener('click', () => show(cur + +b.dataset.d, +b.dataset.d)));
    g.tabIndex = 0;
    g.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') show(cur + 1, 1); if (e.key === 'ArrowLeft') show(cur - 1, -1); });
    let sx = null;
    g.addEventListener('pointerdown', (e) => { if (!e.target.closest('.gal-b')) sx = e.clientX; });
    g.addEventListener('pointerup', (e) => { if (sx === null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); });
  });

  /* ---------- penthouse notify form: preview only, nothing is sent or stored ---------- */
  const nf = $('.nt-f');
  if (nf) nf.addEventListener('submit', (e) => {
    e.preventDefault();
    const em = $('input[type=email]', nf), note = $('.nt-note', nf);
    if (!em.value.trim() || !em.checkValidity()) { note.textContent = note.dataset.bad; em.focus(); return; }
    const done = $('.nt-done');
    const swap = () => { nf.hidden = true; done.hidden = false; done.focus({ preventScroll: true }); if (!reduce) G.from(done, { autoAlpha: 0, y: 12, duration: 0.6, ease: DE }); };
    reduce ? swap() : G.to(nf, { autoAlpha: 0, duration: 0.3, onComplete: swap });
  });

  /* stays: the two panels rise in as the section arrives (photo settles inside its frame) */
  const sps = $$('.sp');
  if (sps.length && !reduce) {
    G.set(sps, { clipPath: 'inset(14% 0% 0% 0%)', y: 60, autoAlpha: 0 });
    ST.create({ trigger: '.sp-row', start: 'top 82%', once: true, onEnter: () => {
      G.to(sps, { clipPath: 'inset(0% 0% 0% 0%)', y: 0, autoAlpha: 1, duration: 1.5, ease: 'expo.out', stagger: 0.14 });
      G.fromTo($$('.sp-ph img'), { scale: 1.18 }, { scale: 1.06, duration: 2, ease: 'expo.out', stagger: 0.14 });
    } });
  }
  html.classList.add('ready');
  addEventListener('load', () => ST.refresh());
  document.fonts && document.fonts.ready.then(() => ST.refresh());
})();
