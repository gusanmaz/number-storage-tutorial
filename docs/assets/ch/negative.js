/* Bölüm 4 — Eksi sayılar */
(function () {
  const { t, $, $$, el, esc, fmt, pad, lamps, knob, tryIt } = NS;
  const b8 = (v) => pad(((v % 256) + 256).toString(2).slice(-8), 8);
  const sgn8 = (u) => (u >= 128 ? u - 256 : u);

  /* Şekil 1: geri sarılan sayaç */
  let ov = 3;
  function drawOdo(dir) {
    const s = pad(ov, 3);
    $('#odo').innerHTML = [...s].map((d) => '<span class="ow' + (dir ? ' roll' + (dir > 0 ? 'u' : 'd') : '') + '">' + d + '</span>').join('');
    $('#odo-tell').innerHTML = ov >= 500
      ? t({ tr: 'Sayaç <b>' + s + '</b> gösteriyor. Sıfırdan <b>' + (1000 - ov) + '</b> adım geride: bu desene <b class="n">−' + (1000 - ov) + '</b> diyebiliriz.', en: 'The counter shows <b>' + s + '</b>. That is <b>' + (1000 - ov) + '</b> steps behind zero: we can call this pattern <b class="n">−' + (1000 - ov) + '</b>.' })
      : t({ tr: 'Sayaç <b>' + s + '</b> gösteriyor. Geri sarmaya devam et.', en: 'The counter shows <b>' + s + '</b>. Keep rolling back.' });
  }
  $('#odo-ctl').append(
    el('button', { class: 'btn fill', type: 'button', text: t({ tr: '◀ Geri sür (−1)', en: '◀ Reverse (−1)' }), onclick: () => { ov = (ov + 999) % 1000; drawOdo(-1); } }),
    el('button', { class: 'btn', type: 'button', text: t({ tr: 'İleri (+1) ▶', en: 'Forward (+1) ▶' }), onclick: () => { ov = (ov + 1) % 1000; drawOdo(1); } }),
  );
  drawOdo();

  /* Şekil 2: sayı çemberi */
  let mode = 's', pos = 0;
  const svg = $('#wheel'), C = 180, R1 = 150, R2 = 112;
  const ang = (p) => (-90 + p * 22.5) * Math.PI / 180;
  const val = (p) => (mode === 's' && p >= 8 ? p - 16 : p);
  const seg = el('div', { class: 'seg', role: 'group' });
  [['u', { tr: 'İşaretsiz (0…15)', en: 'Unsigned (0…15)' }], ['s', { tr: 'İşaretli (−8…7)', en: 'Signed (−8…7)' }]].forEach(([k, l]) => seg.append(el('button', { type: 'button', 'aria-pressed': String(k === mode), text: t(l), onclick: (e) => { mode = k; $$('button', seg).forEach((b) => b.setAttribute('aria-pressed', String(b === e.target))); drawWheel(); $('#wh-tell').innerHTML = ''; } })));
  $('#wh-mode').append(seg);
  function drawWheel() {
    let h = '<circle cx="' + C + '" cy="' + C + '" r="' + (R1 + 22) + '" fill="var(--card)" stroke="var(--rule-2)"/>';
    h += '<circle cx="' + C + '" cy="' + C + '" r="' + (R2 - 26) + '" fill="var(--paper-2)" stroke="var(--rule)"/>';
    if (mode === 's') h += '<path d="M' + C + ' ' + C + ' L' + (C + Math.cos(ang(-0.5)) * (R1 + 22)) + ' ' + (C + Math.sin(ang(-0.5)) * (R1 + 22)) + ' A' + (R1 + 22) + ' ' + (R1 + 22) + ' 0 0 1 ' + (C + Math.cos(ang(7.5)) * (R1 + 22)) + ' ' + (C + Math.sin(ang(7.5)) * (R1 + 22)) + ' Z" fill="var(--dec)" opacity=".06"/>';
    const cut = mode === 'u' ? -0.5 : 7.5, a = ang(cut);
    h += '<line x1="' + (C + Math.cos(a) * (R2 - 30)) + '" y1="' + (C + Math.sin(a) * (R2 - 30)) + '" x2="' + (C + Math.cos(a) * (R1 + 26)) + '" y2="' + (C + Math.sin(a) * (R1 + 26)) + '" stroke="var(--neg)" stroke-width="3" stroke-dasharray="6 4"/>';
    for (let p = 0; p < 16; p++) {
      const x1 = C + Math.cos(ang(p)) * R1, y1 = C + Math.sin(ang(p)) * R1, x2 = C + Math.cos(ang(p)) * R2, y2 = C + Math.sin(ang(p)) * R2, v = val(p), cur = p === pos;
      h += '<g class="wpos" data-p="' + p + '">';
      if (cur) h += '<circle cx="' + x2 + '" cy="' + y2 + '" r="19" fill="var(--on)" style="filter:drop-shadow(0 0 8px var(--on-glow))"/>';
      h += '<circle cx="' + x2 + '" cy="' + y2 + '" r="19" fill="transparent"/>';
      h += '<text x="' + x1 + '" y="' + y1 + '" text-anchor="middle" dominant-baseline="central" font-family="var(--mono)" font-size="12" fill="' + (cur ? 'var(--ink)' : 'var(--ink-3)') + '" font-weight="' + (cur ? 700 : 500) + '">' + pad(p.toString(2), 4) + '</text>';
      h += '<text x="' + x2 + '" y="' + y2 + '" text-anchor="middle" dominant-baseline="central" font-family="var(--mono)" font-size="16" font-weight="700" fill="' + (cur ? '#3a1600' : v < 0 ? 'var(--neg)' : 'var(--dec)') + '">' + v + '</text></g>';
    }
    const px = C + Math.cos(ang(pos)) * (R2 - 34), py = C + Math.sin(ang(pos)) * (R2 - 34);
    h += '<line x1="' + C + '" y1="' + C + '" x2="' + px + '" y2="' + py + '" stroke="var(--ink)" stroke-width="4" stroke-linecap="round"/><circle cx="' + C + '" cy="' + C + '" r="8" fill="var(--ink)"/>';
    svg.innerHTML = h;
  }
  function move(d) {
    const old = pos; pos = ((pos + d) % 16 + 16) % 16;
    const exp = val(old) + d, got = val(pos);
    $('#wh-tell').innerHTML = '<span class="mono">' + pad(old.toString(2), 4) + ' ' + (d > 0 ? '+' : '−') + ' ' + Math.abs(d) + ' = ' + pad(pos.toString(2), 4) + '</span> → ' + val(old) + (d > 0 ? ' + ' : ' − ') + Math.abs(d) + ' = <b>' + got + '</b>' +
      (exp !== got ? ' <span class="bad">' + t({ tr: 'Taşma! Doğrusu ' + exp + ' olmalıydı; 4 bite sığmadı.', en: 'Overflow! It should be ' + exp + '; it does not fit in 4 bits.' }) + '</span>' : '');
    drawWheel();
  }
  [[-3, '−3'], [-1, '−1'], [1, '+1'], [3, '+3']].forEach(([d, l]) => $('#wh-ctl').append(el('button', { class: 'btn' + (d === 1 ? ' fill' : ''), type: 'button', text: l, onclick: () => move(d) })));
  // sürükleme / tıklama
  const toPos = (e) => { const r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 360 - C, y = (e.clientY - r.top) / r.height * 360 - C; let a = Math.atan2(y, x) * 180 / Math.PI + 90; if (a < 0) a += 360; return Math.round(a / 22.5) % 16; };
  let drag = false;
  svg.addEventListener('pointerdown', (e) => { drag = true; svg.setPointerCapture(e.pointerId); const p = toPos(e); if (p !== pos) { pos = p; drawWheel(); $('#wh-tell').innerHTML = '<span class="mono">' + pad(pos.toString(2), 4) + '</span> = <b>' + val(pos) + '</b>'; } });
  svg.addEventListener('pointermove', (e) => { if (!drag) return; const p = toPos(e); if (p !== pos) { pos = p; drawWheel(); $('#wh-tell').innerHTML = '<span class="mono">' + pad(pos.toString(2), 4) + '</span> = <b>' + val(pos) + '</b>'; } });
  svg.addEventListener('pointerup', () => { drag = false; });
  drawWheel();
  $('#wh-tell').innerHTML = t({ tr: 'İbreyi tutup çevir ya da −1’e basıp 0’dan geriye git.', en: 'Grab and turn the pointer, or press −1 to go back from 0.' });

  /* Şekil 3: işaretli / işaretsiz */
  const SG = lamps($('#sg-lamps'), { n: 8, value: 0xFB, group: 4, weight: (i) => (i === 0 ? '−128' : String(2 ** (7 - i))), cls: (i) => (i === 0 ? 'neg' : ''), onChange: drawSg, label: '8 bit' });
  function drawSg() {
    const u = SG.value(), s = sgn8(u), b = SG.get();
    const parts = b.map((x, i) => (x ? (i === 0 ? -128 : 2 ** (7 - i)) : null)).filter((x) => x != null);
    $('#sg-out').innerHTML =
      '<div class="dual-c"><div class="dual-h">' + esc(t({ tr: 'İşaretsiz okuma', en: 'Unsigned reading' })) + '</div><div class="big d">' + u + '</div><div class="muted mono">' + (b[0] ? '128' + (parts.length > 1 ? ' + ' : '') : '') + parts.filter((x) => x > 0).join(' + ') + '</div></div>' +
      '<div class="dual-c"><div class="dual-h">' + esc(t({ tr: 'İşaretli okuma', en: 'Signed reading' })) + '</div><div class="big ' + (s < 0 ? 'n' : 'd') + '">' + s + '</div><div class="muted mono">' + (parts.map((x, i) => (x < 0 ? '<span class="n">' + x + '</span>' : (i ? '+ ' : '') + x)).join(' ') || '0') + '</div></div>';
  }
  [[0, '0'], [1, '1'], [127, '127'], [128, '−128'], [255, '−1'], [251, '−5']].forEach(([v, l]) => $('#sg-pre').append(el('button', { type: 'button', class: 'chip', text: l, onclick: () => SG.set(v) })));
  drawSg();

  /* Şekil 4: ters çevir + 1 */
  const cells = (s, cmp, cls) => '<span class="nrb">' + [...s].map((c, i) => '<i class="' + (c === '1' ? 'on' : '') + (cmp && cmp[i] !== c ? ' chg' : '') + (cls || '') + '">' + c + '</i>').join('') + '</span>';
  function drawNeg(x) {
    const a = b8(x), inv = [...a].map((c) => (c === '1' ? '0' : '1')).join(''), r = b8(-x);
    const lbl = (s) => '<span class="nrl">' + s + '</span>';
    $('#neg-rows').innerHTML =
      '<div class="nr">' + lbl(t({ tr: 'sayı', en: 'number' })) + cells(a) + '<span class="nrv">' + x + '</span></div>' +
      '<div class="nr">' + lbl(t({ tr: '1. ters çevir', en: '1. flip' })) + cells(inv, a) + '<span class="nrv">' + sgn8(parseInt(inv, 2)) + '</span></div>' +
      '<div class="nr">' + lbl(t({ tr: '2. 1 ekle', en: '2. add 1' })) + cells(r, inv) + '<span class="nrv"><b>' + (x === -128 ? '−128 (!)' : -x) + '</b></span></div>' +
      '<div class="nr chk">' + lbl(t({ tr: 'kontrol: toplam', en: 'check: sum' })) + '<span class="nrb"><i class="carry">1</i>' + '00000000'.split('').map((c) => '<i>' + c + '</i>').join('') + '</span><span class="nrv">= 0 ✓</span></div>' +
      (x === -128 ? '<div class="tell"><span class="bad">' + t({ tr: '+128, 8 bitlik işaretli aralığa sığmaz; −128’in negatifi yine −128 çıkar.', en: '+128 does not fit in 8-bit signed range; the negative of −128 is −128 again.' }) + '</span></div>' : '');
  }
  knob($('#k-x'), { value: 5, min: -128, max: 127, px: 8, onChange: drawNeg });
  drawNeg(5);

  /* Şekil 5: taşmalı toplama */
  let A = 100, B = 50;
  function drawAdd() {
    const ua = (A + 256) % 256, ub = (B + 256) % 256, sa = b8(ua), sb = b8(ub);
    let c = 0; const carry = [], res = [];
    for (let i = 7; i >= 0; i--) { const s = +sa[i] + +sb[i] + c; carry[i] = c; res[i] = s % 2; c = s >> 1; }
    const rs = res.join(''), rv = sgn8(parseInt(rs, 2)), sum = A + B, ovf = sum > 127 || sum < -128;
    const row = (lab, s, cls) => '<div class="ar"><span class="arl">' + lab + '</span>' + [...s].map((x, i) => '<i class="' + (cls || '') + (i === 0 ? ' sb' : '') + '">' + x + '</i>').join('') + '</div>';
    $('#add').innerHTML = row(t({ tr: 'elde', en: 'carry' }), carry.map((x) => (x ? '1' : ' ')).join(''), 'cy') + row(String(A), sa) + row('+ ' + B, sb) + '<div class="arline"></div>' + row('=', rs, 'res' + (ovf ? ' bad' : ''));
    $('#add-tell').innerHTML = ovf
      ? '<span class="bad">' + t({ tr: 'Taşma!', en: 'Overflow!' }) + '</span> ' + t({ tr: 'Gerçek toplam ' + sum + ', ama 8 bitlik işaretli aralık −128…127. Sonuç <b class="n">' + rv + '</b> olarak okunuyor: en soldaki (işaret) biti ' + (sum > 0 ? 'yanlışlıkla 1 oldu.' : 'yanlışlıkla 0 oldu.'), en: 'The true sum is ' + sum + ', but 8-bit signed range is −128…127. The result reads as <b class="n">' + rv + '</b>: the leftmost (sign) bit ' + (sum > 0 ? 'wrongly became 1.' : 'wrongly became 0.') })
      : '<span class="good">' + A + ' + ' + B + ' = ' + rv + '</span> ' + t({ tr: '— sonuç aralığın içinde, sorun yok.', en: '— the result is in range, all good.' });
  }
  knob($('#k-a'), { value: 100, min: -128, max: 127, px: 6, onChange: (v) => { A = v; drawAdd(); } });
  knob($('#k-b'), { value: 50, min: -128, max: 127, px: 6, onChange: (v) => { B = v; drawAdd(); } });
  drawAdd();

  /* Şekil 6: canlı 32 bit Unix zamanı */
  const U = lamps($('#unix-lamps'), { n: 32, value: 0, ro: true, size: 'xs', group: 8, cls: (i) => (i === 0 ? 'neg' : ''), weight: (i) => (i === 0 ? '−2³¹' : i % 8 === 7 ? String(31 - i) : ''), label: 'unix time' });
  const END = Date.UTC(2038, 0, 19, 3, 14, 8);
  function tick() {
    const now = Math.floor(Date.now() / 1000);
    U.set(now >>> 0, true);
    const left = Math.max(0, Math.floor((END - Date.now()) / 1000)), d = Math.floor(left / 86400), h = Math.floor((left % 86400) / 3600), m = Math.floor((left % 3600) / 60), s = left % 60;
    $('#unix-out').innerHTML = '<b class="d">' + fmt(now) + '</b> ' + esc(t({ tr: 'saniye', en: 'seconds' })) + ' · ' + new Date(now * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    $('#unix-tell').innerHTML = t({ tr: 'Taşmaya kalan: <b>' + fmt(d) + ' gün ' + h + ' sa ' + m + ' dk ' + s + ' sn</b>. Sınır 2<sup>31</sup> − 1 = 2 147 483 647.', en: 'Time until overflow: <b>' + fmt(d) + ' days ' + h + ' h ' + m + ' min ' + s + ' s</b>. The limit is 2<sup>31</sup> − 1 = 2,147,483,647.' });
  }
  tick(); setInterval(tick, 1000);

  tryIt($('#try'), [
    { label: t({ tr: 'Onlu → ikiye tümleyen', en: 'Decimal → two’s complement' }), fn: GEN.twosEncode },
    { label: t({ tr: 'İkiye tümleyen → onlu', en: 'Two’s complement → decimal' }), fn: GEN.twosDecode },
  ]);
})();
