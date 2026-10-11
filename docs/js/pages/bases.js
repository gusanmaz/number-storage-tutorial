/* Bölüm 1 — Taban Kavramı: sayaç, basamak değeri, tekrarlı bölme */
(function () {
  const { t, $, el, esc, fmt, toBase, sub, pad } = NS;

  /* ---------- 1) Her tabanda sayaç ---------- */
  const BASES = [2, 3, 8, 10, 16];
  let base = 2, n = 0, timer = null;
  const wheelsBox = $('#odo-wheels'), note = $('#odo-note'), seg = $('#odo-base');
  const digitsFor = (b) => (b === 2 ? 6 : b === 3 ? 5 : 4);

  BASES.forEach((b) => {
    const btn = el('button', { type: 'button', 'aria-pressed': String(b === base), text: t({ tr: 'Taban ', en: 'Base ' }) + b });
    btn.addEventListener('click', () => {
      base = b; n = 0; stop();
      [...seg.children].forEach((c) => c.setAttribute('aria-pressed', String(c === btn)));
      draw(null);
      note.innerHTML = t({ tr: 'Taban ' + b + ': her çarkta <b>' + b + '</b> rakam var (0 … ' + toBase(b - 1, b) + '). Çark ' + toBase(b - 1, b) + '’den sonra 0’a döner ve solundakini bir artırır.', en: 'Base ' + b + ': each wheel has <b>' + b + '</b> digits (0 … ' + toBase(b - 1, b) + '). After ' + toBase(b - 1, b) + ' a wheel returns to 0 and bumps the wheel on its left.' });
    });
    seg.append(btn);
  });

  function digitsOf(v) { const d = digitsFor(base), out = []; for (let k = d - 1; k >= 0; k--) out.push(Math.floor(v / Math.pow(base, k)) % base); return out; }

  function draw(prev) {
    const d = digitsFor(base), cur = digitsOf(n), old = prev == null ? null : digitsOf(prev);
    wheelsBox.innerHTML = '';
    cur.forEach((dg, i) => {
      const k = d - 1 - i;
      const w = el('div', { class: 'wheel' + (dg === 0 && cur.slice(0, i).every((x) => x === 0) && k > 0 ? ' lead' : '') });
      w.innerHTML = '<div class="wheel-digit">' + toBase(dg, base) + '</div><div class="wheel-w">' + base + '<sup>' + k + '</sup> = ' + fmt(Math.pow(base, k)) + '</div>';
      if (old && old[i] !== dg) {
        w.classList.add(prev < n && dg === 0 ? 'carry' : 'roll');
      }
      wheelsBox.append(w);
    });
    const dec = el('div', { class: 'odo-dec', html: '= <b class="dec">' + fmt(n) + '</b><sub>10</sub>' });
    wheelsBox.append(dec);
  }

  function step(delta) {
    const max = Math.pow(base, digitsFor(base));
    const prev = n;
    n = (n + delta + max) % max;
    draw(prev);
    if (delta > 0) {
      const a = digitsOf(prev), b = digitsOf(n);
      const carries = a.filter((x, i) => x !== b[i] && b[i] === 0).length;
      if (n === 0) note.innerHTML = t({ tr: '<b>Sayaç doldu!</b> Bütün çarklar başa döndü ve en soldaki taşma kayboldu. Sabit sayıda basamakla saymanın bir sınırı vardır; buna <em>taşma (overflow)</em> denir. Bölüm 5’te bilgisayarlarda bunun nasıl hatalara yol açtığını göreceğiz.', en: '<b>The counter is full!</b> All wheels returned to 0 and the leftmost carry was lost. Counting with a fixed number of digits has a limit; this is called <em>overflow</em>. In chapter 5 we will see the bugs it causes in computers.' });
      else if (carries > 0) note.innerHTML = t({ tr: '<b>Taşma!</b> ' + (carries === 1 ? 'En sağdaki çark ' + toBase(base - 1, base) + '’den 0’a döndü ve solundaki çarkı bir artırdı. ' : carries + ' çark art arda ' + toBase(base - 1, base) + '’den 0’a döndü; her biri solundaki çarkı bir artırdı (zincirleme taşma). ') + toBase(prev, base) + sub(base) + ' + 1 = ' + toBase(n, base) + sub(base), en: '<b>Carry!</b> ' + (carries === 1 ? 'The rightmost wheel went from ' + toBase(base - 1, base) + ' back to 0 and bumped the wheel on its left. ' : carries + ' wheels in a row went from ' + toBase(base - 1, base) + ' back to 0, each bumping its left neighbour (a carry chain). ') + toBase(prev, base) + sub(base) + ' + 1 = ' + toBase(n, base) + sub(base) });
      else note.innerHTML = t({ tr: 'Sadece en sağdaki çark ilerledi: ' + toBase(prev, base) + sub(base) + ' → ' + toBase(n, base) + sub(base), en: 'Only the rightmost wheel moved: ' + toBase(prev, base) + sub(base) + ' → ' + toBase(n, base) + sub(base) });
    } else {
      note.innerHTML = t({ tr: 'Geri saymada da aynı şey tersten olur: 0’dan geri giden çark ' + toBase(base - 1, base) + '’e döner ve solundan “ödünç” alır.', en: 'Counting down is the mirror image: a wheel going below 0 wraps to ' + toBase(base - 1, base) + ' and “borrows” from its left.' });
    }
  }
  function stop() { clearInterval(timer); timer = null; $('#odo-play').textContent = t({ tr: '▶ Otomatik say', en: '▶ Auto count' }); }
  $('#odo-inc').addEventListener('click', () => { stop(); step(1); });
  $('#odo-dec').addEventListener('click', () => { stop(); step(-1); });
  $('#odo-reset').addEventListener('click', () => { stop(); n = 0; draw(null); note.textContent = ''; });
  $('#odo-play').addEventListener('click', (e) => {
    if (timer) return stop();
    e.target.textContent = t({ tr: '⏸ Durdur', en: '⏸ Stop' });
    timer = setInterval(() => step(1), base === 2 ? 700 : 420);
  });
  $('#odo-jump').addEventListener('click', () => {
    stop();
    const max = Math.pow(base, digitsFor(base));
    let target = (Math.floor(n / base) + 1) * base - 1;
    if (target === n) target += base;
    if (target >= max) target = max - 1;
    const prev = n; n = target; draw(prev);
    note.innerHTML = t({ tr: 'En sağdaki çark şimdi en büyük rakamda (<b>' + toBase(base - 1, base) + '</b>). <kbd>+1</kbd>’e bas ve taşmayı izle.', en: 'The rightmost wheel is now at its largest digit (<b>' + toBase(base - 1, base) + '</b>). Press <kbd>+1</kbd> and watch the carry.' });
  });
  draw(null);
  note.innerHTML = t({ tr: 'Taban 2’de her çarkta yalnızca iki rakam var: 0 ve 1. <kbd>+1</kbd>’e basarak saymaya başla.', en: 'In base 2 each wheel has only two digits: 0 and 1. Press <kbd>+1</kbd> to start counting.' });

  /* ---------- 2) Basamak değeri ---------- */
  NS.placeValue($('#pv-box'), { bases: [2, 8, 10, 16, 3, 5], base: 2, value: '1011' });

  /* ---------- 3) Tekrarlı bölme ---------- */
  const nIn = $('#div-n'), bIn = $('#div-b'), rowsBox = $('#div-rows'), tiles = $('#div-tiles'), dnote = $('#div-note');
  let rows = [], N = 25, B = 2;
  function compute() {
    N = Math.max(0, Math.min(99999, parseInt(nIn.value, 10) || 0)); B = +bIn.value;
    rows = []; let x = N;
    while (x > 0) { rows.push({ n: x, q: Math.floor(x / B), r: x % B }); x = Math.floor(x / B); }
    if (!rows.length) rows.push({ n: 0, q: 0, r: 0 });
  }
  function render(i) {
    const R = rows.length;
    const shown = Math.min(i, R);
    rowsBox.innerHTML = rows.slice(0, shown).map((r, j) =>
      '<tr class="' + (j === shown - 1 && i <= R ? 'cur' : '') + '"><td class="m">' + fmt(r.n) + '</td><td class="m">' + B + '</td><td class="m">' + fmt(r.q) + '</td><td class="m"><b class="' + NS.baseClass(B) + '">' + r.r + (B > 10 && r.r > 9 ? ' → ' + toBase(r.r, B) : '') + '</b></td></tr>'
    ).join('') || '<tr><td colspan="4" class="muted">' + esc(t({ tr: 'Henüz bölme yapılmadı.', en: 'No division yet.' })) + '</td></tr>';
    tiles.innerHTML = '';
    for (let p = R - 1; p >= 0; p--) {
      const filled = p < shown; // p. kalan (0 = ilk bulunan = en sağ)
      const tile = el('div', { class: 'tile ' + (filled ? NS.baseClass(B) : 'ghost') + (filled && p === shown - 1 && i <= R ? ' pop' : '') });
      tile.innerHTML = (filled ? toBase(rows[p].r, B) : '?') + '<small>' + B + '<sup>' + p + '</sup></small>';
      tiles.append(tile);
    }
    const res = toBase(N, B);
    if (i === 0) {
      dnote.innerHTML = t({ tr: '<b>' + fmt(N) + '</b> sayısını taban <b>' + B + '</b>’ye çevireceğiz. Sonucun ' + R + ' basamağı olacak. ▶ ile ilk bölmeyi yap.', en: 'We will convert <b>' + fmt(N) + '</b> to base <b>' + B + '</b>. The result will have ' + R + ' digit(s). Press ▶ for the first division.' });
    } else if (i <= R) {
      const r = rows[i - 1];
      dnote.innerHTML = t({
        tr: fmt(r.n) + ' ÷ ' + B + ' = ' + fmt(r.q) + ', kalan <b>' + toBase(r.r, B) + '</b>. Bu kalan sonucun ' + (i === 1 ? '<b>en sağdaki</b> basamağı' : 'sağdan ' + i + '. basamağı') + ' (' + B + '<sup>' + (i - 1) + '</sup>). ' + (r.q === 0 ? 'Bölüm 0 oldu → dur.' : 'Şimdi bölümle (' + fmt(r.q) + ') devam ediyoruz.'),
        en: fmt(r.n) + ' ÷ ' + B + ' = ' + fmt(r.q) + ', remainder <b>' + toBase(r.r, B) + '</b>. This remainder is the ' + (i === 1 ? '<b>rightmost</b> digit' : 'digit ' + i + ' from the right') + ' (' + B + '<sup>' + (i - 1) + '</sup>). ' + (r.q === 0 ? 'The quotient is 0 → stop.' : 'Now continue with the quotient (' + fmt(r.q) + ').'),
      });
    } else {
      const check = [...res].map((d, k) => { const v = NS.digitValue(d), p = res.length - 1 - k; return v ? v + '×' + B + '<sup>' + p + '</sup>' : null; }).filter(Boolean).join(' + ') || '0';
      dnote.innerHTML = t({ tr: 'Kalanları <b>aşağıdan yukarıya</b> okuyoruz: <b class="' + NS.baseClass(B) + '">' + res + '</b><sub>' + B + '</sub>. Kontrol: ' + check + ' = ' + fmt(N) + ' ✓', en: 'Read the remainders <b>from bottom to top</b>: <b class="' + NS.baseClass(B) + '">' + res + '</b><sub>' + B + '</sub>. Check: ' + check + ' = ' + fmt(N) + ' ✓' });
    }
  }
  compute();
  const st = NS.stepper($('#div-stepper'), { count: rows.length + 2, render, interval: 1500 });
  const recompute = () => { compute(); st.reset(rows.length + 2); };
  nIn.addEventListener('input', recompute);
  bIn.addEventListener('change', recompute);

  /* ---------- Alıştırma ---------- */
  NS.practice($('#practice'), [
    { label: t({ tr: 'İkili → onlu', en: 'Binary → decimal' }), fn: GEN.binToDec },
    { label: t({ tr: 'Onlu → ikili', en: 'Decimal → binary' }), fn: GEN.decToBin },
    { label: t({ tr: 'Sekizli → onlu', en: 'Octal → decimal' }), fn: GEN.octToDec },
    { label: t({ tr: 'Onaltılı → onlu', en: 'Hex → decimal' }), fn: GEN.hexToDec },
    { label: t({ tr: 'İkili ↔ sekizli', en: 'Binary ↔ octal' }), fn: () => (Math.random() < 0.5 ? GEN.binToOct() : GEN.octToBin()) },
  ]);
  void pad;
})();
