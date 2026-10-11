/* Bölüm 5 — Kesirli sayılar */
(function () {
  const { t, $, $$, el, esc, fmt, pad, lamps, knob, out, steps, tryIt, LANG } = NS;
  const DS = LANG === 'en' ? '.' : ',';
  const ds = (s) => String(s).replace('.', DS);
  const sub = (b) => '<span class="sub">' + b + '</span>';
  const FR = ['1/2', '1/4', '1/8', '1/16', '1/32', '1/64'];

  /* ---------- kesin onlu açılım (BigInt) ---------- */
  // m × 2^e değerinin tam onlu yazımı; '.' ile döner.
  function exactDecimal(m, e) {
    m = BigInt(m);
    if (e >= 0) return (m << BigInt(e)).toString();
    const k = -e, s = (m * 5n ** BigInt(k)).toString().padStart(k + 1, '0');
    const ip = s.slice(0, s.length - k), fp = s.slice(s.length - k).replace(/0+$/, '');
    return fp ? ip + '.' + fp : ip;
  }
  const dv = new DataView(new ArrayBuffer(8));
  function f32parts(x) {
    dv.setFloat32(0, x);
    const u = dv.getUint32(0);
    return { u, s: u >>> 31, ex: (u >>> 23) & 255, fr: u & 0x7fffff };
  }
  function f32exact(x) {
    const { s, ex, fr } = f32parts(x);
    if (ex === 255) return null;
    const str = ex === 0 ? exactDecimal(fr, -149) : exactDecimal(fr | 0x800000, ex - 150);
    return (s ? '-' : '') + str;
  }
  function f64exact(x) {
    if (!isFinite(x)) return null;
    dv.setFloat64(0, x);
    const u = dv.getBigUint64(0), s = u >> 63n, ex = Number((u >> 52n) & 0x7ffn), fr = u & ((1n << 52n) - 1n);
    const str = ex === 0 ? exactDecimal(fr, -1074) : exactDecimal(fr | (1n << 52n), ex - 1075);
    return (s ? '-' : '') + str;
  }
  // yazılan düz onlu sayıyı kanonik hale getirir ('.' ile); üslü yazımda null
  function canon(str) {
    const m = String(str).trim().match(/^([+-])?(\d*)(?:[.,](\d*))?$/);
    if (!m || (!m[2] && !m[3])) return null;
    const ip = (m[2] || '0').replace(/^0+(?=\d)/, ''), fp = (m[3] || '').replace(/0+$/, '');
    return (m[1] === '-' ? '-' : '') + ip + (fp ? '.' + fp : '');
  }
  // iki kanonik onlu sayının tam toplamı
  function decAdd(a, b) {
    const sp = (x) => { const n = x[0] === '-', [i, f = ''] = x.replace('-', '').split('.'); return { n, i, f }; };
    const A = sp(a), B = sp(b), k = Math.max(A.f.length, B.f.length);
    const big = (X) => (X.n ? -1n : 1n) * BigInt(X.i + X.f.padEnd(k, '0'));
    let s = big(A) + big(B);
    const neg = s < 0n; if (neg) s = -s;
    let str = s.toString().padStart(k + 1, '0');
    str = k ? str.slice(0, -k) + '.' + str.slice(-k) : str;
    return canon((neg ? '-' : '') + str);
  }
  // tam değeri, yazılan değerden saptığı yerden itibaren kırmızı göster
  function markDiff(exact, typed) {
    if (typed == null) return esc(ds(exact));
    let i = 0;
    {
      const L = Math.max(exact.length, typed.length);
      const ex = exact + (exact.includes('.') ? '' : '.'), ty = typed + (typed.includes('.') ? '' : '.');
      while (i < L && (ex[i] || '0') === (ty[i] || '0')) i++;
      if (i >= L) return '<span class="ok-d">' + esc(ds(exact)) + '</span>';
    }
    return esc(ds(exact.slice(0, i))) + '<span class="dv">' + esc(ds(exact.slice(i))) + '</span>';
  }

  /* ---------- Şekil 1: ikiye bölünmüş şerit ---------- */
  const BL = lamps($('#bar-lamps'), { n: 6, value: 0b101100, weight: (i) => FR[i], onChange: drawBar, label: 'fraction bits' });
  function drawBar() {
    const b = BL.get(), v = BL.value();
    let h = '', x = 0;
    b.forEach((bit, i) => {
      const w = 100 / 2 ** (i + 1);
      if (bit) h += '<span class="bar-p" style="left:' + x + '%;width:' + w + '%;--k:' + i + '">' + (w >= 6 ? FR[i] : '') + '</span>';
      x += bit ? w : 0;
    });
    let ticks = '';
    for (let k = 1; k < 64; k++) { const lvl = k % 32 === 0 ? 1 : k % 16 === 0 ? 2 : k % 8 === 0 ? 3 : k % 4 === 0 ? 4 : k % 2 === 0 ? 5 : 6; ticks += '<i class="l' + lvl + '" style="left:' + (k / 64 * 100) + '%"></i>'; }
    $('#bar').innerHTML = '<div class="bar-track">' + h + ticks + '</div><div class="bar-scale"><span>0</span><span>1/2</span><span>1</span></div>';
    const parts = b.map((bit, i) => (bit ? FR[i] : null)).filter(Boolean);
    $('#bar-out').innerHTML = '<b class="b">0' + DS + b.join('') + '</b>' + sub(2) + ' = ' + (parts.length ? parts.join(' + ') + ' = ' : '') + v + '/64 = <b class="d">' + ds(v / 64) + '</b>';
  }
  drawBar();

  /* ---------- Şekil 2: ikiyle çarpma ve döngü ---------- */
  const PRE = ['0.5', '0.625', '0.1', '0.2', '0.3', '0.7'];
  let dblSteps = null, rows = [], cyc = -1;
  const decStr = (num, k) => { const s = num.toString().padStart(k + 1, '0'); return ds(s.slice(0, -k) + '.' + s.slice(-k)).replace(new RegExp('\\' + DS + '?0+$'), '') || '0'; };
  function buildDbl(src) {
    const k = src.split('.')[1].length, den = 10 ** k;
    let x = Math.round(Number(src) * den);
    const seen = new Map();
    rows = []; cyc = -1;
    while (rows.length < 16) {
      seen.set(x, rows.length);
      const y = 2 * x, b = y >= den ? 1 : 0, nx = y - b * den;
      rows.push({ x: decStr(x, k), y: decStr(y, k), b, nx: decStr(nx, k) });
      x = nx;
      if (x === 0) break;
      if (seen.has(x)) { cyc = seen.get(x); break; }
    }
    dblSteps.reset(rows.length);
  }
  function drawDbl(i) {
    if (!rows.length) return;
    $('#dbl-rows').innerHTML = rows.slice(0, i + 1).map((r, j) => '<div class="dr' + (j === i ? ' cur' : '') + (cyc >= 0 && i === rows.length - 1 && j >= cyc ? ' loop' : '') + '"><span class="dr-n">' + (j + 1) + '.</span><span class="dr-x">' + r.x + ' × 2 = ' + r.y + '</span><span class="dr-b' + (r.b ? ' on' : '') + '">' + r.b + '</span><span class="dr-r">→ ' + r.nx + '</span></div>').join('');
    const bits = rows.slice(0, i + 1).map((r) => r.b), last = i === rows.length - 1;
    let shown = bits.join('');
    if (last && cyc >= 0) shown = bits.slice(0, cyc).join('') + '<u>' + bits.slice(cyc).join('') + '</u>' + bits.slice(cyc).join('') + '…';
    $('#dbl-out').innerHTML = '<b class="b">0' + DS + shown + '</b>' + sub(2);
    $('#dbl-tell').innerHTML = !last ? t({ tr: 'Her satır bir bit üretir. Kalan kesirle devam et.', en: 'Each row produces one bit. Continue with the leftover fraction.' })
      : cyc >= 0 ? '<span class="bad">' + t({ tr: 'Döngü!', en: 'A loop!' }) + '</span> ' + t({ tr: rows[i].nx + ' kesrini ' + (cyc + 1) + '. adımda zaten görmüştük. Buradan sonra aynı bitler sonsuza dek tekrar eder; altı çizili kısım hiç bitmez.', en: 'We already saw ' + rows[i].nx + ' at step ' + (cyc + 1) + '. From here the same bits repeat forever; the underlined part never ends.' })
        : '<span class="good">' + t({ tr: 'Bitti!', en: 'Done!' }) + '</span> ' + t({ tr: 'Kesir sıfıra indi: bu sayı ' + rows.length + ' bitle tam olarak yazılır.', en: 'The fraction reached zero: this number is written exactly in ' + rows.length + ' bits.' });
  }
  dblSteps = steps($('#dbl-steps'), { count: 1, render: drawDbl });
  const chipsDbl = PRE.map((p) => el('button', { type: 'button', class: 'chip', 'aria-pressed': String(p === '0.625'), text: ds(p), onclick: (e) => { chipsDbl.forEach((c) => c.setAttribute('aria-pressed', String(c === e.currentTarget))); buildDbl(p); } }));
  $('#dbl-pre').append(...chipsDbl);
  buildDbl('0.625');

  /* ---------- SVG sayı doğrusu ---------- */
  // vals: gösterilecek değerler; cur: seçili; bands: [a, b] aralıkları
  const lines = new Set();
  let rsz = 0;
  addEventListener('resize', () => { clearTimeout(rsz); rsz = setTimeout(() => lines.forEach((b) => line(b, b._o)), 120); });
  function line(box, o) {
    box._o = o; lines.add(box);
    const W = Math.max(300, Math.round(box.clientWidth || 1000)), X0 = 16, X1 = W - 16, H = 84, y = 46, FS = W < 600 ? 11 : 13;
    const sx = (v) => X0 + (v - o.min) / (o.max - o.min) * (X1 - X0);
    let h = '<svg class="nline" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.label || 'number line') + '">';
    (o.bands || []).forEach(([a, b], i) => { if (b <= o.min || a >= o.max) return; const A = sx(Math.max(a, o.min)), B = sx(Math.min(b, o.max)); h += '<rect x="' + A + '" y="' + (y - 26) + '" width="' + (B - A) + '" height="34" fill="' + (i % 2 ? 'var(--card)' : 'color-mix(in srgb, var(--hex) 12%, var(--card))') + '"/>'; });
    h += '<line x1="' + X0 + '" y1="' + y + '" x2="' + X1 + '" y2="' + y + '" stroke="var(--ink-3)" stroke-width="1.5"/>';
    o.vals.forEach((v) => { if (v < o.min || v > o.max) return; const x = sx(v); h += '<line x1="' + x + '" y1="' + (y - 16) + '" x2="' + x + '" y2="' + y + '" stroke="var(--ink-2)" stroke-width="1.2" opacity=".75"/>'; });
    (o.labels || []).forEach(([v, s, minor]) => { if (v < o.min || v > o.max) return; const x = sx(v); h += '<line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + (y + 7) + '" stroke="var(--ink-3)"/><text class="' + (minor ? 'nl-minor' : '') + '" x="' + x + '" y="' + (y + 24) + '" text-anchor="middle" font-family="var(--mono)" font-size="' + FS + '" fill="var(--ink-3)">' + esc(s) + '</text>'; });
    if (o.cur != null && o.cur >= o.min && o.cur <= o.max) {
      const x = sx(o.cur);
      h += '<line x1="' + x + '" y1="' + (y - 30) + '" x2="' + x + '" y2="' + y + '" stroke="var(--on-deep)" stroke-width="4"/><path d="M' + (x - 9) + ' ' + (y - 40) + 'h18l-9 12z" fill="var(--on)"/>';
    }
    h += '</svg>';
    box.innerHTML = h;
    const svg = $('svg', box);
    svg.onclick = (e) => {
      if (!o.pick) return;
      const r = svg.getBoundingClientRect(), v = o.min + ((e.clientX - r.left) / r.width * W - X0) / (X1 - X0) * (o.max - o.min);
      let best = null; o.vals.forEach((c) => { if (c >= o.min && c <= o.max && (best == null || Math.abs(c - v) < Math.abs(best - v))) best = c; });
      if (best != null) o.pick(best);
    };
  }

  /* ---------- Şekil 3: sabit nokta 4.4 ---------- */
  const FXW = ['8', '4', '2', '1', '1/2', '1/4', '1/8', '1/16'];
  const FX = lamps($('#fx-lamps'), { n: 8, value: 0b10110110, gaps: [4], weight: (i) => FXW[i], onChange: drawFx, label: 'fixed point' });
  const fxVals = Array.from({ length: 256 }, (_, i) => i / 16);
  function drawFx() {
    const v = FX.value() / 16, b = FX.get().join('');
    $('#fx-out').innerHTML = '<b class="b">' + b.slice(0, 4) + DS + b.slice(4) + '</b>' + sub(2) + ' = ' + FX.value() + ' / 16 = <b class="d">' + ds(v) + '</b>';
    line($('#fx-line'), { min: 0, max: 16, vals: fxVals, cur: v, labels: Array.from({ length: 17 }, (_, i) => [i, String(i), i % 4 !== 0]), pick: (c) => FX.set(Math.round(c * 16)), label: t({ tr: 'sabit noktalı değerler', en: 'fixed-point values' }) });
  }
  drawFx();

  /* ---------- Şekil 4: 8 bitlik oyuncak float ---------- */
  const MCLS = (i) => (i === 0 ? 'c-s' : i < 5 ? 'c-e' : 'c-m');
  const MW = ['±', '8', '4', '2', '1', '1/2', '1/4', '1/8'];
  const ML = lamps($('#mini-lamps'), { n: 8, value: 0b01010011, gaps: [1, 5], cls: MCLS, weight: (i) => MW[i], onChange: drawMini, label: 'minifloat' });
  function miniVal(p) {
    const s = p >> 7, e = (p >> 3) & 15, m = p & 7, sg = s ? -1 : 1;
    if (e === 15) return m ? NaN : sg * Infinity;
    return sg * (e === 0 ? (m / 8) * 2 ** -6 : (1 + m / 8) * 2 ** (e - 7));
  }
  const miniPos = [];
  for (let p = 0; p < 120; p++) miniPos.push(miniVal(p)); // e = 0…14, pozitif sonlu değerler
  const ZOOM = [[2, '0 – 2'], [16, '0 – 16'], [240, '0 – 240']];
  let zoom = 16;
  const seg = el('div', { class: 'seg', role: 'group', 'aria-label': 'zoom' });
  ZOOM.forEach(([z, l]) => seg.append(el('button', { type: 'button', 'aria-pressed': String(z === zoom), text: l, onclick: () => { zoom = z; drawMini(true); } })));
  $('#mini-zoom').append(el('span', { class: 'muted', text: t({ tr: 'Yakınlaştır:', en: 'Zoom:' }) }), seg);
  function drawMini(keepZoom) {
    const p = ML.value(), s = p >> 7, e = (p >> 3) & 15, m = p & 7, v = miniVal(p), b = ML.get().join('');
    const pat = '<span class="cs">' + b[0] + '</span> <span class="ce">' + b.slice(1, 5) + '</span> <span class="cm">' + b.slice(5) + '</span>';
    let h;
    if (e === 15) h = pat + ' → ' + (m ? '<b>NaN</b> ' + t({ tr: '(üs bitlerinin hepsi 1, mantis ≠ 0)', en: '(all exponent bits 1, mantissa ≠ 0)' }) : '<b>' + (s ? '−' : '+') + '∞</b> ' + t({ tr: '(üs bitlerinin hepsi 1)', en: '(all exponent bits 1)' }));
    else if (e === 0) h = pat + ' → ' + (s ? '−' : '+') + ' 0' + DS + b.slice(5) + sub(2) + ' × 2<sup>−6</sup> = <b class="d">' + ds(v) + '</b> <span class="muted">' + t({ tr: '(alt-normal: gizli bit 0)', en: '(subnormal: hidden bit 0)' }) + '</span>';
    else h = pat + ' → ' + (s ? '−' : '+') + ' 1' + DS + b.slice(5) + sub(2) + ' × 2<sup>' + e + '−7</sup> = ' + ds(1 + m / 8) + ' × ' + ds(2 ** (e - 7)) + ' = <b class="d">' + ds(v) + '</b>';
    const a = Math.abs(v);
    if (isFinite(a)) {
      const idx = miniPos.indexOf(a), nx = miniPos[idx + 1];
      h += '<div class="mini-gap">' + (nx != null ? t({ tr: 'Bir sonraki değer: ', en: 'Next value up: ' }) + ds(nx) + ' · ' + t({ tr: 'boşluk: ', en: 'gap: ' }) + '<b>' + ds(nx - a) + '</b>' : t({ tr: 'Bu, en büyük sonlu değer. Sonrası ∞.', en: 'This is the largest finite value. After it: ∞.' })) + '</div>';
      if (a > zoom && keepZoom !== true) zoom = ZOOM.find(([z]) => z >= a)[0];
    }
    $$('button', seg).forEach((x, i) => x.setAttribute('aria-pressed', String(ZOOM[i][0] === zoom)));
    $('#mini-out').innerHTML = h;
    const bands = [], labels = [[0, '0']];
    for (let k = -6; k <= 7; k++) { bands.push([2 ** k, 2 ** (k + 1)]); if (2 ** k <= zoom && 2 ** k * 16 >= zoom) labels.push([2 ** k, ds(2 ** k), 2 ** k * 8 < zoom]); }
    if (!labels.some((l) => l[0] === zoom)) labels.push([zoom, ds(zoom)]);
    line($('#mini-line'), { min: 0, max: zoom, vals: miniPos, cur: isFinite(a) ? a : null, bands, labels, label: t({ tr: 'oyuncak float değerleri', en: 'toy float values' }), pick: (c) => ML.set((s << 7) | miniPos.indexOf(c)) });
  }
  drawMini();

  /* ---------- Şekil 5: float32 laboratuvarı ---------- */
  const inp = $('#lab-in');
  const bitBox = el('div', { class: 'f32', role: 'group', 'aria-label': 'float32 bits' });
  const bbtn = [];
  for (let i = 0; i < 32; i++) {
    const c = i === 0 ? 's' : i < 9 ? 'e' : 'm';
    const b = el('button', { type: 'button', class: 'f32b ' + c, 'aria-label': 'bit ' + (31 - i) });
    b.addEventListener('click', () => { dv.setFloat32(0, cur); dv.setUint32(0, dv.getUint32(0) ^ (2 ** (31 - i)) >>> 0); setLab(dv.getFloat32(0), null); });
    bbtn.push(b); bitBox.append(b);
  }
  $('#lab-lamps').append(bitBox);
  let cur = 0.1;
  function shortest(x) {
    if (Number.isNaN(x)) return 'NaN';
    if (!isFinite(x)) return x > 0 ? '∞' : '−∞';
    if (Object.is(x, -0)) return '-0';
    for (let p = 1; p < 10; p++) { const s = String(Number(x.toPrecision(p))); if (Math.fround(Number(s)) === x) return s; }
    return String(x);
  }
  function parseIn(s) {
    s = s.trim().replace(/\s/g, '').replace(/^−/, '-');
    if (/^[+]?(∞|inf(inity)?)$/i.test(s)) return Infinity;
    if (/^-(∞|inf(inity)?)$/i.test(s)) return -Infinity;
    if (/^nan$/i.test(s)) return NaN;
    s = s.replace(',', '.');
    if (s === '' || isNaN(Number(s))) return null;
    return Number(s);
  }
  function setLab(x, typed) {
    cur = Math.fround(x);
    if (typed == null) { typed = shortest(cur); inp.value = ds(typed); }
    const { u, s, ex, fr } = f32parts(cur);
    bbtn.forEach((b, i) => { const on = (u >>> (31 - i)) & 1; b.textContent = on; b.classList.toggle('on', !!on); b.setAttribute('aria-pressed', String(!!on)); });
    const eb = pad(ex.toString(2), 8), mb = pad(fr.toString(2), 23);
    let eTxt, mTxt;
    if (ex === 255) { eTxt = t({ tr: 'hepsi 1 → özel değer', en: 'all ones → special value' }); mTxt = fr ? t({ tr: '≠ 0 → NaN', en: '≠ 0 → NaN' }) : t({ tr: '0 → sonsuz', en: '0 → infinity' }); }
    else if (ex === 0) { eTxt = t({ tr: '0 → alt-normal, üs −126', en: '0 → subnormal, exponent −126' }); mTxt = '0' + DS + mb.replace(/0+$/, '') + sub(2) + ' = ' + ds(exactDecimal(fr, -23)); }
    else { eTxt = ex + ' − 127 = <b>' + (ex - 127) + '</b>'; mTxt = '1' + DS + (mb.replace(/0+$/, '') || '0') + sub(2) + ' = ' + ds(exactDecimal(fr | 0x800000, -23)); }
    $('#lab-fields').innerHTML =
      '<div class="labf-c s"><span class="labf-h">' + t({ tr: 'işaret', en: 'sign' }) + '</span><b class="mono">' + s + '</b><span>' + (s ? '−' : '+') + '</span></div>' +
      '<div class="labf-c e"><span class="labf-h">' + t({ tr: 'üs', en: 'exponent' }) + '</span><b class="mono">' + eb + '</b><span>' + eTxt + '</span></div>' +
      '<div class="labf-c m"><span class="labf-h">' + t({ tr: 'mantis', en: 'mantissa' }) + '</span><b class="mono">' + mb + '</b><span>' + mTxt + '</span></div>';
    const hex = '0x' + pad(u.toString(16).toUpperCase(), 8);
    let h;
    if (ex === 255) h = '<div class="ex-row"><span class="ex-l">' + t({ tr: 'Değer', en: 'Value' }) + '</span><b>' + (fr ? 'NaN' : (s ? '−' : '+') + '∞') + '</b></div>';
    else {
      const exact = f32exact(cur), tc = canon(typed);
      h = '<div class="ex-row"><span class="ex-l">' + t({ tr: 'Bellekteki tam değer', en: 'Exact stored value' }) + '</span><span class="ex-v">' + markDiff(exact, tc) + '</span></div>';
      if (tc != null && tc !== exact) {
        const err = Math.abs(cur - Number(tc));
        h += '<div class="ex-row"><span class="ex-l">' + t({ tr: 'Yazdığından farkı', en: 'Off from what you typed by' }) + '</span><span class="ex-v">' + (err >= 1e-3 && err < 1e7 ? ds(String(err)) : err ? ds(err.toExponential(2)).replace(/e([+-])(\d+)/, ' × 10<sup>$1$2</sup>').replace('<sup>+', '<sup>') : t({ tr: 'çok küçük', en: 'tiny' })) + '</span></div>';
      } else if (tc != null) h += '<div class="ex-row"><span class="ex-l"></span><span class="ex-v good">' + t({ tr: 'Tam olarak saklandı.', en: 'Stored exactly.' }) + '</span></div>';
    }
    h += '<div class="ex-row"><span class="ex-l">' + t({ tr: 'Bellekteki 4 byte', en: 'The 4 bytes in memory' }) + '</span><span class="ex-v h">' + hex + '</span></div>';
    $('#lab-exact').innerHTML = h;
  }
  inp.addEventListener('input', () => { const x = parseIn(inp.value); inp.classList.toggle('bad', x == null); if (x != null) setLab(x, inp.value.trim().replace(',', '.').replace(/^−/, '-')); });
  const LP = [['0.1', '0,1'], ['0.5', '0,5'], ['-2.5', '−2,5'], ['3.14159265', 'π'], ['16777217', '2²⁴+1'], ['1e-45', t({ tr: 'en küçük', en: 'smallest' })], ['3.4028235e38', t({ tr: 'en büyük', en: 'largest' })], ['0', '0'], ['-0', '−0'], ['Infinity', '∞'], ['NaN', 'NaN']];
  LP.forEach(([v, l]) => $('#lab-pre').append(el('button', { type: 'button', class: 'chip', text: LANG === 'en' ? l.replace(',', '.') : l, onclick: () => { inp.value = ds(v); inp.classList.remove('bad'); setLab(parseIn(v), /e/.test(v) || !isFinite(Number(v)) ? null : v); } })));
  inp.value = ds('0.1');
  setLab(0.1, '0.1');

  /* ---------- Şekil 6: 0.1 + 0.2 ---------- */
  function drawSum() {
    const ra = $('#sum-a').value.trim().replace(',', '.'), rb = $('#sum-b').value.trim().replace(',', '.');
    const ca = canon(ra), cb = canon(rb);
    $('#sum-a').classList.toggle('bad', ca == null); $('#sum-b').classList.toggle('bad', cb == null);
    if (ca == null || cb == null) { $('#sum-out').innerHTML = '<p class="tell">' + t({ tr: 'Düz onlu sayılar yaz (ör. 0.1).', en: 'Type plain decimals (e.g. 0.1).' }) + '</p>'; return; }
    const a = Number(ca), b = Number(cb), r = a + b, ct = decAdd(ca, cb), tgt = Number(ct);
    const row = (lbl, x, ref, extra) => '<tr><td class="sl">' + lbl + '</td><td class="sv">' + markDiff(f64exact(x), ref) + '</td></tr>' + (extra || '');
    const same = r === tgt;
    $('#sum-out').innerHTML = '<div class="tbl sumt"><table><tbody>' +
      row(t({ tr: 'saklanan ', en: 'stored ' }) + ds(ca), a, ca) +
      row(t({ tr: 'saklanan ', en: 'stored ' }) + ds(cb), b, cb) +
      row(t({ tr: 'toplam (yuvarlanmış)', en: 'sum (rounded)' }), r, ct) +
      row(t({ tr: 'saklanan ', en: 'stored ' }) + ds(ct), tgt, ct) +
      '</tbody></table></div>' +
      '<p class="tell">' + '<code>' + esc(ca + ' + ' + cb + ' === ' + ct) + '</code> → ' + (same ? '<span class="good">true</span>' : '<span class="bad">false</span>') +
      ' · ' + t({ tr: 'yazdırılan: ', en: 'printed: ' }) + '<code>' + esc(String(r)) + '</code>' +
      (same ? ' — ' + t({ tr: 'bu sefer şanslıydık: hatalar birbirini götürdü ya da hiç yoktu.', en: 'lucky this time: the errors cancelled out or there were none.' }) : ' — ' + t({ tr: 'toplam, hedefin bir komşusuna düştü.', en: 'the sum landed on a neighbor of the target.' })) + '</p>';
  }
  $('#sum-a').addEventListener('input', drawSum); $('#sum-b').addEventListener('input', drawSum);
  drawSum();

  /* ---------- 2^24 sınırı ---------- */
  const drawBig = (v) => { const f = Math.fround(v); out(null, 'f32', '<b class="' + (f === v ? 'good' : 'bad') + '">' + fmt(f) + '</b>'); };
  knob($('#k-big'), { value: 16777217, min: 16777208, max: 16777240, px: 10, fmt: (v) => fmt(v), onChange: drawBig });
  drawBig(16777217);

  /* ---------- alıştırma ---------- */
  function exactQ() {
    const v = NS.pick(['0.5', '0.75', '0.1', '0.2', '0.375', '0.3', '0.25', '0.6', '0.125', '0.9', '0.0625', '0.05', '0.875', '0.4']);
    let x = Math.round(Number(v) * 1e4), d = 1e4; while (x % 2 === 0 && d % 2 === 0) { x /= 2; d /= 2; } while (x % 5 === 0 && d % 5 === 0) { x /= 5; d /= 5; }
    const ok = (d & (d - 1)) === 0;
    return {
      q: t({ tr: '<span class="d">' + ds(v) + '</span> bir float’ta <em>tam</em> saklanabilir mi? (evet / hayır)', en: 'Can <span class="d">' + v + '</span> be stored <em>exactly</em> in a float? (yes / no)' }),
      a: ok ? (LANG === 'en' ? ['yes', 'y'] : ['evet', 'e']) : (LANG === 'en' ? ['no', 'n'] : ['hayır', 'hayir', 'h']), kind: 'text',
      hint: t({ tr: 'Sadeleştirilmiş kesrin paydası 2’nin kuvveti mi?', en: 'Is the denominator of the reduced fraction a power of two?' }),
      explain: ds(v) + ' = ' + x + '/' + d + ' → ' + (ok ? t({ tr: 'payda 2’nin kuvveti, <b>evet</b>.', en: 'denominator is a power of two, <b>yes</b>.' }) : t({ tr: 'paydada 5 var, <b>hayır</b>.', en: 'the denominator has a factor 5, <b>no</b>.' })),
    };
  }
  tryIt($('#try'), [
    { label: t({ tr: 'Kesir → binary', en: 'Fraction → binary' }), fn: GEN.fracToBin },
    { label: t({ tr: 'Binary → kesir', en: 'Binary → fraction' }), fn: GEN.binFracToDec },
    { label: t({ tr: 'Tam mı?', en: 'Exact?' }), fn: exactQ },
  ]);
})();
