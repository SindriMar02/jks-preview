// SNDR booking sheet, prototype edition, localised (IS / EN / ES). Forked 18 Nov 2026 from the Mountain Villas
// sheet (03-prototypes/mountain-villa-twin/assets/vendor/sndr-booking.js): same request model and calendar rules
// (range calendar, two months from 768px, booked nights struck, a stay may end on a booked morning but never run
// through it, minimum stay, guests stepper, then the guest's details, then a request the owners confirm).
// Every visible word comes from `t` (the page's language); dates use Intl in that locale. Nothing here takes a
// payment or invents a confirmation: the final state says plainly that this is the design preview.
function mountBooking(root, { t, locale = 'en-GB', min = 3, max = 10, guests = 2, months = 12, onStep = () => {}, taken = () => false, submit = null, price = null } = {}) {
  const $ = (s, c = root) => c.querySelector(s);
  const $$ = (s, c = root) => [...c.querySelectorAll(s)];
  const form = $('form'), monthsBox = $('.bk-months'), from = $('[data-from]'), to = $('[data-to]');
  const minus = $('.bk-minus'), plus = $('.bk-plus'), gshow = $('.bk-n'), gnote = $('.bk-gnote');
  const sum = $('.bk-sum'), note = $('.bk-note'), action = $('.bk-action'), actionLabel = $('.bk-action > span');
  const who = $('.bk-who'), done = $('.bk-done'), dates = $('.bk-dates'), back = $('.bk-back');
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const at = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const addMonth = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate()));
  const monthOf = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const firstDay = iso(addDays(today, 1)), todayK = iso(today);
  const lastDay = iso(addMonth(today, months));
  const firstMonth = monthOf(today), lastMonth = monthOf(at(lastDay));
  const fShort = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' });
  const fLong = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const fMonth = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
  const fDow = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
  const dow = [...Array(7)].map((_, i) => fDow.format(new Date(2024, 0, 1 + i)));   // 1 Jan 2024 was a Monday
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const wide = matchMedia('(min-width: 768px)'), still = matchMedia('(prefers-reduced-motion: reduce)');
  // open on the first month that has a free night (Villa Almendro is closed on Airbnb until late January)
  let openFrom = firstMonth;
  for (let d = at(firstDay), e = at(lastDay); d <= e; d = addDays(d, 1)) if (!taken(iso(d))) { openFrom = monthOf(d); break; }
  const st = { start: '', end: '', hover: '', focus: '', view: openFrom, guests, drawn: false, step: 'dates' };
  const say = (s) => { note.textContent = s; };
  const nights = () => Math.round((at(st.end) - at(st.start)) / 864e5);
  const openNight = (k) => k >= firstDay && k <= lastDay && !taken(k);
  const days$ = () => $$('.bk-d');
  const blockAfter = (k) => { for (let d = addDays(at(k), 1), e = at(lastDay); d <= e; d = addDays(d, 1)) { const x = iso(d); if (taken(x)) return x; } return ''; };

  function paint() {
    const block = st.start && !st.end ? blockAfter(st.start) : '';
    const days = days$(); let b = st.end || (st.hover > st.start ? st.hover : ''); if (block && b > block) b = '';
    let tab = days.find((d) => d.dataset.d === st.focus && !d.disabled);
    if (!tab) tab = days.find((d) => d.dataset.d === st.start) || days.find((d) => !d.disabled);
    days.forEach((d) => {
      const k = d.dataset.d, on = k === st.start || k === st.end;
      if (d.classList.contains('bk-taken')) {
        const out = (block && k === block) || k === st.end;
        d.disabled = !out;
        d.setAttribute('aria-label', `${fLong.format(at(k))}, ${k === st.end ? t.yourDeparture : out ? t.departOnly : t.booked}`);
      }
      d.classList.toggle('bk-out', !!block && k === block);
      d.classList.toggle('beyond', !!block && k > block);
      d.classList.toggle('start', k === st.start); d.classList.toggle('end', !!st.end && k === st.end);
      d.classList.toggle('in', !!st.start && !!st.end && k > st.start && k < st.end);
      d.classList.toggle('pv', !st.end && !!b && k > st.start && k < b);
      d.classList.toggle('pv-end', !st.end && !!b && k === b && !(st.start && k < iso(addDays(at(st.start), min))));
      d.classList.toggle('today', k === todayK);
      d.classList.toggle('short', !!st.start && !st.end && k > st.start && k < iso(addDays(at(st.start), min)));
      d.setAttribute('aria-pressed', String(on)); d.tabIndex = d === tab ? 0 : -1;
    });
  }
  const cost = () => { const p = price && st.start && st.end ? price(st.start, st.end, nights()) : ''; return p ? `<span class="p">${p}</span>` : ''; };
  function labels() {
    from.textContent = st.start ? fShort.format(at(st.start)) : t.arrival; from.classList.toggle('is-set', !!st.start);
    to.textContent = st.end ? fShort.format(at(st.end)) : t.departure; to.classList.toggle('is-set', !!st.end);
    if (st.step === 'dates') {
      sum.innerHTML = st.start && st.end
        ? `<span class="d">${fShort.format(at(st.start))} – ${fShort.format(at(st.end))}</span>${cost()}<span class="a">${t.nights(nights())}, ${t.guests(st.guests)}. ${t.confirmLine}</span>`
        : `<span class="is-muted">${st.start ? t.chooseDeparture : t.chooseDates}</span>`;
      actionLabel.textContent = t.requestDates;
    } else if (st.step === 'who') {
      sum.innerHTML = `<span class="d">${fShort.format(at(st.start))} – ${fShort.format(at(st.end))}</span>${cost()}<span class="a">${t.nights(nights())}, ${t.guests(st.guests)}. ${t.addDetails}</span>`;
      actionLabel.textContent = t.send;
    }
  }
  function render() {
    const n = wide.matches ? 2 : 1;
    const prevOk = st.view > firstMonth, nextOk = new Date(st.view.getFullYear(), st.view.getMonth() + n - 1, 1) < lastMonth;
    const arrows = `<span class="bk-nav"><button class="bk-prev" type="button" aria-label="${t.prevMonth}"${prevOk ? '' : ' disabled'}><svg class="bk-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><button class="bk-next" type="button" aria-label="${t.nextMonth}"${nextOk ? '' : ' disabled'}><svg class="bk-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button></span>`;
    let html = '';
    for (let i = 0; i < n; i++) {
      const m = new Date(st.view.getFullYear(), st.view.getMonth() + i, 1), lead = (m.getDay() + 6) % 7, count = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
      html += `<div class="bk-m" role="group" aria-label="${fMonth.format(m)}"><div class="bk-m-h"><p class="bk-m-t">${cap(fMonth.format(m))}</p>${i === n - 1 ? arrows : ''}</div><div class="bk-dow" aria-hidden="true">${dow.map((d) => `<span>${d}</span>`).join('')}</div><div class="bk-days">${'<span></span>'.repeat(lead)}`;
      for (let d = 1; d <= count; d++) {
        const dt = new Date(m.getFullYear(), m.getMonth(), d), k = iso(dt), tk = k >= firstDay && k <= lastDay && taken(k);
        html += `<button type="button" class="bk-d${tk ? ' bk-taken' : ''}" data-d="${k}" aria-label="${fLong.format(dt)}${tk ? ', ' + t.booked : ''}" aria-pressed="false" tabindex="-1"${openNight(k) ? '' : ' disabled'}>${d}</button>`;
      }
      html += '</div></div>';
    }
    monthsBox.innerHTML = html; st.drawn = true;
    paint();
  }
  let slide = [];
  function page(step) {
    const v = new Date(st.view.getFullYear(), st.view.getMonth() + step, 1);
    if (v < firstMonth || v > lastMonth) return;
    st.view = v; render();
    const same = $(step > 0 ? '.bk-next' : '.bk-prev', monthsBox);
    (same && !same.disabled ? same : $('.bk-prev:not(:disabled), .bk-next:not(:disabled)', monthsBox))?.focus({ preventScroll: true });
    slide.forEach((a) => a.cancel());
    if (!still.matches) slide = $$('.bk-dow, .bk-days', monthsBox).map((el) => el.animate([{ opacity: 0, transform: `translateX(${step * 14}px)` }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.23, 1, .32, 1)' }));
  }
  function sync() { paint(); labels(); }
  function pick(k) {
    const block = st.start && !st.end ? blockAfter(st.start) : '';
    if (block && k > block) { st.start = k; st.end = ''; st.hover = ''; st.focus = k; sync(); say(t.crossed(fShort.format(at(k)))); return; }
    if (!st.start || st.end || k <= st.start) { st.start = k; st.end = ''; }
    else if (k < iso(addDays(at(st.start), min))) { say(t.minStay(min)); st.focus = k; paint(); return; }
    else st.end = k;
    st.hover = ''; st.focus = k; say(''); sync();
  }
  function goto(k) {
    const d = at(k), shown = wide.matches ? 2 : 1, first = st.view, last = new Date(first.getFullYear(), first.getMonth() + shown, 0);
    if (d < first || d > last) {
      const v = d > last ? new Date(d.getFullYear(), d.getMonth() - (shown - 1), 1) : monthOf(d);
      st.view = v < firstMonth ? firstMonth : v > lastMonth ? lastMonth : v; render();
    }
    st.focus = k; paint();
    let el = $(`.bk-d[data-d="${k}"]`);
    if (el && el.disabled) {
      const all = days$(), i = all.indexOf(el), dir = k < (document.activeElement?.dataset?.d || k) ? -1 : 1;
      for (let j = i + dir; j >= 0 && j < all.length; j += dir) if (!all[j].disabled) { el = all[j]; st.focus = el.dataset.d; paint(); break; }
    }
    if (el && !el.disabled) el.focus();
  }
  function fit() {
    st.guests = Math.min(Math.max(st.guests, 1), max);
    gshow.textContent = t.guests(st.guests); minus.disabled = st.guests <= 1; plus.disabled = st.guests >= max;
    gnote.textContent = st.guests >= max ? t.maxGuests : '';
    labels();
  }
  function setStep(step) {
    st.step = step;
    dates.hidden = step !== 'dates'; who.hidden = step !== 'who'; done.hidden = step !== 'done';
    back.hidden = step !== 'who'; action.hidden = step === 'done';
    $('.bk-body').scrollTop = 0;
    labels(); onStep(step);
  }
  monthsBox.addEventListener('click', (e) => {
    const b = e.target.closest('.bk-d'); if (b && !b.disabled) { pick(b.dataset.d); return; }
    const a = e.target.closest('.bk-prev, .bk-next'); if (a && !a.disabled) page(a.classList.contains('bk-next') ? 1 : -1);
  });
  monthsBox.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse' || !st.start || st.end) return;
    const b = e.target.closest('.bk-d'), k = b && !b.disabled ? b.dataset.d : '';
    if (k !== st.hover) { st.hover = k; paint(); }
  });
  monthsBox.addEventListener('pointerleave', () => { if (st.hover) { st.hover = ''; paint(); } });
  monthsBox.addEventListener('keydown', (e) => {
    const b = e.target.closest('.bk-d'); if (!b) return;
    const d = at(b.dataset.d), col = (d.getDay() + 6) % 7;
    const nd = { ArrowLeft: addDays(d, -1), ArrowRight: addDays(d, 1), ArrowUp: addDays(d, -7), ArrowDown: addDays(d, 7), Home: addDays(d, -col), End: addDays(d, 6 - col), PageUp: addMonth(d, -1), PageDown: addMonth(d, 1) }[e.key];
    if (!nd) return;
    e.preventDefault(); let k = iso(nd); if (k < firstDay) k = firstDay; if (k > lastDay) k = lastDay; goto(k);
  });
  minus.addEventListener('click', () => { st.guests -= 1; fit(); });
  plus.addEventListener('click', () => { st.guests += 1; fit(); });
  wide.addEventListener('change', () => { if (st.drawn) render(); });
  back.addEventListener('click', () => setStep('dates'));
  const submitRequest = submit || (async () => { await new Promise((r) => setTimeout(r, 650)); return { ok: true }; });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (st.step === 'dates') {
      if (!st.start || !st.end) { say(st.start ? t.chooseDeparture + '.' : t.chooseDates + '.'); $('.bk-d[tabindex="0"]')?.focus(); return; }
      say(''); setStep('who'); $('input[name="name"]')?.focus({ preventScroll: true }); return;
    }
    if (st.step === 'who') {
      const name = $('input[name="name"]'), email = $('input[name="email"]'), phone = $('input[name="phone"]'), terms = $('input[name="terms"]');
      const bad = [name, email, phone].filter(Boolean).find((i) => (i.required && !i.value.trim()) || (i.type === 'email' && !i.checkValidity()));
      if (bad) { say(t.ask[bad.name]); bad.focus(); return; }
      if (terms && !terms.checked) { say(t.acceptTerms); terms.focus(); return; }
      say(''); action.disabled = true; action.classList.add('is-busy'); actionLabel.textContent = t.sending;
      let res;
      try { res = await submitRequest({ start: st.start, end: st.end, nights: nights(), guests: st.guests, name: name.value.trim(), email: email.value.trim(), phone: phone ? phone.value.trim() : '', message: ($('textarea[name="message"]')?.value || '').trim() }); }
      catch (err) { res = { ok: false, message: t.failed }; }
      action.disabled = false; action.classList.remove('is-busy');
      if (!res || !res.ok) { actionLabel.textContent = t.send; say((res && res.message) || t.failed); return; }
      $('.bk-done-dates').textContent = `${fLong.format(at(st.start))} – ${fLong.format(at(st.end))}, ${t.nights(nights())}, ${t.guests(st.guests)}.`;
      $('.bk-done-name').textContent = name.value.trim();
      setStep('done'); $('.bk-done h3')?.focus({ preventScroll: true });
    }
  });
  return {
    prepare() { if (!st.drawn) { render(); fit(); } },
    firstDay() { return $('.bk-d[tabindex="0"]'); },
    reset() { st.start = st.end = st.hover = st.focus = ''; form.reset(); st.guests = guests; setStep('dates'); fit(); if (st.drawn) paint(); say(''); },
    get step() { return st.step; }
  };
}
window.mountBooking = mountBooking;
