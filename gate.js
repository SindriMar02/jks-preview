/* ALMENDRO gate: three language doors over ONE drawn scene (the Crystal Lagoon jetty).
   Horizonte's Selector (TEARDOWN §3) paints the photograph into a <canvas> over the sketch; we do the same, with a
   watercolour brush: one organic, feathered ink shape is pre-rendered once and composited every frame
   (destination-in), so the paint is cheap to draw and holds the frame rate. A main bloom follows the pointer with soft
   inertia and a slower satellite trails it, so the shape keeps changing as you move; at rest it breathes.
   Ours: three doors (Sindri 18 Nov), each with something smart computed in the browser, and on click the paint takes
   the whole screen and becomes the landing's first frame (same .stage markup) before the language page loads. */
(() => {
  const G = window.gsap;
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const gate = $('.gate'), cv = $('.gate-canvas'), photo = $('.gate-photo-src'), line = $('.gate-line');
  const doors = $$('.door'), lines = $$('.door-line'), stage = $('.gate-scene .stage');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = !matchMedia('(hover: hover) and (pointer: fine)').matches;
  const ctx = cv.getContext('2d');
  let W = innerWidth, H = innerHeight, DPR = Math.min(devicePixelRatio || 1, 1.75);
  const mask = document.createElement('canvas'), mctx = mask.getContext('2d');
  const fit = () => {
    W = innerWidth; H = innerHeight; DPR = Math.min(devicePixelRatio || 1, 1.75);
    for (const c of [cv, mask]) { c.width = Math.round(W * DPR); c.height = Math.round(H * DPR); }
    cover = null;
  };
  let cover = null; // cached cover-fit of the photo
  const coverRect = () => {
    if (cover || !photo.naturalWidth) return cover;
    const iw = photo.naturalWidth, ih = photo.naturalHeight, s = Math.max(cv.width / iw, cv.height / ih);
    const w = iw * s, h = ih * s; cover = [(cv.width - w) / 2, (cv.height - h) / 2, w, h]; return cover;
  };
  fit(); addEventListener('resize', fit);

  /* ---------- the brush: one organic feathered ink shape, drawn once ---------- */
  const brush = (() => {
    const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const b = c.getContext('2d');
    let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const dab = (x, y, r, a) => { const g = b.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.68, `rgba(0,0,0,${a * 0.9})`); g.addColorStop(1, 'rgba(0,0,0,0)'); b.fillStyle = g; b.beginPath(); b.arc(x, y, r, 0, Math.PI * 2); b.fill(); };
    dab(S / 2, S / 2, S * 0.36, 1);                                   // solid heart
    for (let i = 0; i < 70; i++) {                                    // the ragged, feathered rim
      const a = rnd() * Math.PI * 2, d = S * (0.2 + rnd() * 0.17), r = S * (0.05 + rnd() * 0.12);
      dab(S / 2 + Math.cos(a) * d, S / 2 + Math.sin(a) * d, r, 0.55 + rnd() * 0.45);
    }
    return c;
  })();

  /* ---------- something smart (no network, no API) ---------- */
  const TZ = 'Europe/Madrid', LAT = 37.79, LON = -0.93;
  const hm = (d) => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ }).format(d);
  const offsetH = (tz, d) => { const p = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(d).find((x) => x.type === 'timeZoneName').value; const m = p.match(/GMT([+-]\d+)?/); return m && m[1] ? +m[1] : 0; };
  function sunset(d) { // NOAA simplified solar position; today's sunset at LAT/LON as a UTC instant
    const rad = Math.PI / 180, day = Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 0)) / 864e5);
    const g = 2 * Math.PI / 365 * (day - 1 + 0.5);
    const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    const dec = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    const ha = Math.acos(Math.cos(90.833 * rad) / (Math.cos(LAT * rad) * Math.cos(dec)) - Math.tan(LAT * rad) * Math.tan(dec)) / rad;
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) + (720 - 4 * (LON - ha) - eq) * 6e4);
  }
  const tick = () => {
    const now = new Date(), diff = offsetH(TZ, now) - offsetH('Atlantic/Reykjavik', now), ss = hm(sunset(now));
    doors.forEach((d) => {
      const dl = d.dataset;
      const two = dl.smart === 'tz' ? [`${dl.lClock} ${hm(now)}`, diff ? `${diff} ${dl.lAhead}` : dl.lSame] : [`${dl.lClock} ${hm(now)}`, `${dl.lSunset} ${ss}`];
      $('.door-smart', d).innerHTML = two.map((x) => `<span>${x}</span>`).join('');
    });
  };
  tick(); setInterval(tick, 20000);

  /* ---------- paint state: per door a main bloom + a lagging satellite ---------- */
  const P = doors.map(() => ({ x: W / 2, y: H / 2, sx: W / 2, sy: H / 2, tx: W / 2, ty: H / 2, r: 0, a: 0 }));
  let going = false, t0 = performance.now(), pointerSeen = false;
  const place = () => {
    if (innerWidth >= 1024) doors.forEach((d, i) => { if (i) { lines[i - 1].style.left = `${d.getBoundingClientRect().left}px`; lines[i - 1].style.top = '0'; } });
    else doors.forEach((d, i) => { if (i) lines[i - 1].style.top = `${d.getBoundingClientRect().top}px`; });
  };
  const draw = (now) => {
    const t = (now - t0) / 1000, k = DPR;
    mctx.setTransform(1, 0, 0, 1, 0, 0); mctx.clearRect(0, 0, mask.width, mask.height);
    let any = false;
    P.forEach((p, i) => {
      // inertia: the main bloom eases to the pointer, the satellite follows the bloom more slowly
      p.x += (p.tx - p.x) * 0.075; p.y += (p.ty - p.y) * 0.075;
      p.sx += (p.x - p.sx) * 0.035; p.sy += (p.y - p.sy) * 0.035;
      if (p.r < 0.5) return; any = true;
      const breathe = 1 + Math.sin(t * 0.9 + i * 2.1) * 0.018;
      const dabAt = (x, y, r, rot, alpha) => {
        mctx.save(); mctx.globalAlpha = alpha; mctx.translate(x * k, y * k); mctx.rotate(rot);
        const s = (r * 2 * k) / 0.8; mctx.drawImage(brush, -s / 2, -s / 2, s, s); mctx.restore();
      };
      dabAt(p.x, p.y, p.r * breathe, t * 0.05 + i, p.a);
      dabAt(p.sx, p.sy, p.r * 0.72 * breathe, -t * 0.04 + i * 1.7, p.a);
    });
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    const cr = coverRect();
    if (any && cr) {
      ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(photo, cr[0], cr[1], cr[2], cr[3]);
      ctx.globalCompositeOperation = 'destination-in'; ctx.drawImage(mask, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
    }
    place();
    requestAnimationFrame(draw);
  };
  const start = () => requestAnimationFrame(draw);
  if (photo.complete && photo.naturalWidth) start(); else photo.addEventListener('load', start, { once: true });

  /* ---------- open / close ---------- */
  const reach = (i) => { const R = doors[i].getBoundingClientRect(); return Math.max(R.width * 0.95, R.height * 0.62, 320); };
  let on = -1;
  const open = (i, x, y) => {
    if (going) return;
    const p = P[i];
    if (i !== on) {
      const prev = on; on = i;
      doors.forEach((d, j) => d.classList.toggle('is-on', j === i)); $('.doors').classList.add('has-on');
      if (p.r < 2) { p.x = p.sx = x; p.y = p.sy = y; }
      G.killTweensOf(p);
      if (reduce) { p.r = reach(i); p.a = 1; }
      else G.to(p, { r: reach(i), a: 1, duration: 1.6, ease: 'expo.out' });
      if (prev > -1) close(prev);
    }
    p.tx = x; p.ty = y;
  };
  const close = (i) => { const p = P[i]; G.killTweensOf(p); G.to(p, { r: 0, a: 0, duration: reduce ? 0 : 1.1, ease: 'power3.inOut' }); doors[i].classList.remove('is-on'); };
  const none = () => { if (on > -1 && !going) { close(on); on = -1; $('.doors').classList.remove('has-on'); } };

  doors.forEach((d, i) => {
    d.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { pointerSeen = true; open(i, e.clientX, e.clientY); } });
    d.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { if (on !== i) open(i, e.clientX, e.clientY); else { P[i].tx = e.clientX; P[i].ty = e.clientY; } } });
    d.addEventListener('focus', () => { if (pointerSeen && document.documentElement.dataset.input === 'pointer') return; const R = d.getBoundingClientRect(); open(i, R.left + R.width / 2, R.top + R.height * 0.45); });
    d.addEventListener('click', (e) => { e.preventDefault(); const R = d.getBoundingClientRect(); go(i, e.clientX || R.left + R.width / 2, e.clientY || R.top + R.height / 2); });
  });
  $('.doors').addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') none(); });

  /* ---------- engulf: the paint takes the screen and becomes the landing's first frame ---------- */
  function go(i, x, y) {
    if (going) return; going = true;
    const d = doors[i], href = d.getAttribute('href');
    try { sessionStorage.setItem('jks-gate', '1'); localStorage.setItem('jks-lang', d.dataset.lang); } catch (_) {}
    if (reduce) { location.href = href; return; }
    gate.classList.add('is-going');
    P.forEach((p, j) => { if (j !== i) { G.killTweensOf(p); G.to(p, { r: 0, a: 0, duration: 0.9, ease: 'power3.inOut' }); } });
    const p = P[i]; if (p.r < 2) { p.x = p.sx = x; p.y = p.sy = y; }
    G.killTweensOf(p);
    const tl = G.timeline({ onComplete: () => { location.href = href; } });
    tl.to(p, { r: Math.hypot(W, H) * 0.95, a: 1, duration: 1.5, ease: 'expo.inOut' }, 0)
      .to(p, { tx: W / 2, ty: H / 2, duration: 1.5, ease: 'power2.inOut' }, 0)
      .to(line, { opacity: 0, duration: 0.8, ease: 'power2.out' }, 0.7)
      .set(stage, { visibility: 'visible' }, 1.3)
      .fromTo(stage, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 1.3);
  }

  /* ---------- arrival: the drawing appears like ink, door names rise ---------- */
  place();
  if (reduce) { G.set(line, { opacity: 1 }); return; }
  const tl = G.timeline({ delay: 0.15 });
  tl.fromTo(line, { opacity: 0, clipPath: 'inset(0 100% 0 0)' }, { opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: 2.4, ease: 'power3.inOut' }, 0)
    .fromTo($$('.door-name, .door-code'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.09, ease: 'expo.out', clearProps: 'opacity,transform', onStart: () => gate.classList.add('is-intro'), onComplete: () => gate.classList.remove('is-intro') }, 0.5)
    .from(['.gate-mark', '.gate-place'], { opacity: 0, duration: 1.2, ease: 'expo.out' }, 0.9);
  /* touch: each door blooms once in sequence (Horizonte opens its panels 200 ms apart on touch) */
  if (touch) tl.add(() => doors.forEach((d, i) => setTimeout(() => {
    const R = d.getBoundingClientRect(), p = P[i]; p.x = p.sx = p.tx = R.left + R.width / 2; p.y = p.sy = p.ty = R.top + R.height / 2;
    G.to(p, { r: Math.max(R.width, R.height) * 1.15, a: 1, duration: 1.8, ease: 'expo.out' }); d.classList.add('is-on'); gate.classList.add('is-bloomed');
  }, 300 + i * 220)), 1.8);
})();
