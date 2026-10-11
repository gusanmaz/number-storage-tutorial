/* Bölüm 5 — Eksi sayılar */
(function () {
  const { t, $, $$, el, esc, fmt, pad, toBase, lamps, knob, tryIt } = NS;
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

  /* Taşma ve bayraklar */
  let A = 100, B = 50, op = '+';
  const oseg = el('div', { class: 'seg', role: 'group' });
  [['+', 'A + B'], ['-', 'A − B']].forEach(([k, l]) => oseg.append(el('button', { type: 'button', 'aria-pressed': String(k === op), text: l, onclick: (e) => { op = k; $$('button', oseg).forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget))); drawAdd(); } })));
  $('#add-op').append(oseg);
  function drawAdd() {
    const ua = (A + 256) % 256, ubRaw = (B + 256) % 256, ub = op === '+' ? ubRaw : (~ubRaw & 255), c0 = op === '+' ? 0 : 1;
    const sa = b8(ua), sb = b8(ub);
    let c = c0; const carry = [], res = [];
    for (let i = 7; i >= 0; i--) { const s2 = +sa[i] + +sb[i] + c; carry[i] = c; res[i] = s2 % 2; c = s2 >> 1; }
    const C = c, cin7 = carry[0], rs = res.join(''), ru = parseInt(rs, 2), rv = sgn8(ru), V = cin7 !== C ? 1 : 0, N = +rs[0], Z = ru === 0 ? 1 : 0;
    const exact = op === '+' ? A + B : A - B, uexact = op === '+' ? ua + ubRaw : ua - ubRaw;
    const row = (lab, s2, cls) => '<div class="ar"><span class="arl">' + lab + '</span>' + [...s2].map((x, i) => '<i class="' + (cls || '') + (i === 0 ? ' sb' : '') + '">' + x + '</i>').join('') + '</div>';
    $('#add').innerHTML = row(t({ tr: 'elde', en: 'carry' }), carry.map((x) => (x ? '1' : ' ')).join(''), 'cy') + row(String(A), sa) + row(op === '+' ? '+ ' + B : '+ ~' + B, sb, op === '-' ? ' invb' : '') + '<div class="arline"></div>' + row('=', rs, 'res' + (V ? ' bad' : ''));
    const fl = (n, v, tip) => '<span class="flag' + (v ? ' on' : '') + '" title="' + esc(tip) + '">' + n + ' = ' + v + '</span>';
    $('#add-flags').innerHTML = fl('C', C, 'carry') + fl('V', V, 'overflow') + fl('N', N, 'negative') + fl('Z', Z, 'zero');
    $('#add-tell').innerHTML =
      '<div class="two-read"><div><small>' + t({ tr: 'İşaretsiz okuma', en: 'Unsigned reading' }) + '</small> ' + ua + ' ' + (op === '+' ? '+' : '−') + ' ' + ubRaw + ' = <b>' + ru + '</b> ' + ((op === '+' ? C : !C) ? '<span class="bad">' + t({ tr: '✗ yanlış (doğrusu ' + uexact + ') → C bunu söyler', en: '✗ wrong (should be ' + uexact + ') → C says so' }) + '</span>' : '<span class="good">✓</span>') + '</div>' +
      '<div><small>' + t({ tr: 'İşaretli okuma', en: 'Signed reading' }) + '</small> ' + A + ' ' + (op === '+' ? '+' : '−') + ' ' + B + ' = <b>' + rv + '</b> ' + (V ? '<span class="bad">' + t({ tr: '✗ yanlış (doğrusu ' + exact + ') → V bunu söyler', en: '✗ wrong (should be ' + exact + ') → V says so' }) + '</span>' : '<span class="good">✓</span>') + '</div></div>';
  }
  knob($('#k-a'), { value: 100, min: -128, max: 127, px: 6, onChange: (v) => { A = v; drawAdd(); } });
  knob($('#k-b'), { value: 50, min: -128, max: 127, px: 6, onChange: (v) => { B = v; drawAdd(); } });
  drawAdd();

  /* Birler tümleyeni: döngüsel elde */
  let OA = 5, OB = -3;
  const oc = (v) => (v >= 0 ? v : (~(-v)) & 255);
  const ocDec = (u) => (u & 128 ? -((~u) & 255) : u);
  function drawOc() {
    const ua = oc(OA), ub = oc(OB), raw = ua + ub, C = raw >> 8, r1 = raw & 255, r = (r1 + C) & 255, C2 = (r1 + C) >> 8;
    const cells = (u, cls) => '<span class="nrb">' + [...b8(u)].map((x) => '<i class="' + (x === '1' ? 'on' : '') + (cls || '') + '">' + x + '</i>').join('') + '</span>';
    const lbl = (x) => '<span class="nrl">' + x + '</span>';
    $('#oc').innerHTML =
      '<div class="nr">' + lbl(OA + ' → ' + t({ tr: 'desen', en: 'pattern' })) + cells(ua) + '<span class="nrv">' + (OA < 0 ? t({ tr: 'bitleri ters', en: 'bits flipped' }) : '') + '</span></div>' +
      '<div class="nr">' + lbl(OB + ' → ' + t({ tr: 'desen', en: 'pattern' })) + cells(ub) + '<span class="nrv">' + (OB < 0 ? t({ tr: 'bitleri ters', en: 'bits flipped' }) : '') + '</span></div>' +
      '<div class="nr chk">' + lbl(t({ tr: 'ham toplam', en: 'raw sum' })) + '<span class="nrb">' + (C ? '<i class="carry wrap">1</i>' : '<i class="carry" style="opacity:.2">0</i>') + [...b8(r1)].map((x) => '<i class="' + (x === '1' ? 'on' : '') + '">' + x + '</i>').join('') + '</span><span class="nrv">' + (C ? t({ tr: 'elde çıktı ↺', en: 'carry out ↺' }) : '') + '</span></div>' +
      (C ? '<div class="nr">' + lbl(t({ tr: '+ döngüsel elde', en: '+ end-around carry' })) + cells(1) + '<span class="nrv">' + t({ tr: 'eldeyi başa ekle', en: 'add the carry back' }) + '</span></div>' : '') +
      '<div class="nr chk">' + lbl('=') + cells(r) + '<span class="nrv"><b>' + (r === 255 ? '−0' : ocDec(r)) + '</b></span></div>';
    const exact = OA + OB;
    $('#oc-tell').innerHTML = (exact > 127 || exact < -127 ? '<span class="bad">' + t({ tr: 'Aralık dışı: 1’e tümleyende 8 bit −127…127 tutar.', en: 'Out of range: 8-bit one’s complement holds −127…127.' }) + '</span>'
      : '<span class="good">' + OA + ' + ' + OB + ' = ' + exact + '</span>' + (r === 255 ? ' ' + t({ tr: '(ama “eksi sıfır” deseniyle!)', en: '(but as the “negative zero” pattern!)' }) : '')) + (C2 ? '' : '');
  }
  knob($('#k-oa'), { value: OA, min: -127, max: 127, px: 6, onChange: (v) => { OA = v; drawOc(); } });
  knob($('#k-ob'), { value: OB, min: -127, max: 127, px: 6, onChange: (v) => { OB = v; drawOc(); } });
  drawOc();

  /* Dört gösterim yan yana (4 bit) */
  const REP = [
    [{ tr: 'İşaretsiz', en: 'Unsigned' }, (u) => u],
    [{ tr: 'İşaret-büyüklük', en: 'Sign-magnitude' }, (u) => (u & 8 ? (u & 7 ? -(u & 7) : '−0') : u)],
    [{ tr: '1’e tümleyen', en: 'One’s complement' }, (u) => (u & 8 ? (u === 15 ? '−0' : -(~u & 15)) : u)],
    [{ tr: '2’ye tümleyen', en: 'Two’s complement' }, (u) => (u & 8 ? u - 16 : u)],
    [{ tr: 'Fazlalık-8', en: 'Excess-8' }, (u) => u - 8],
  ];
  const CL = lamps($('#cmp-lamps'), { n: 4, value: 0b1101, weight: (i) => String(2 ** (3 - i)), onChange: drawCmp, label: '4 bit' });
  function drawCmp() {
    const cur = CL.value();
    let h = '<table class="cmp"><thead><tr><th>' + t({ tr: 'desen', en: 'pattern' }) + '</th>' + REP.map(([l]) => '<th>' + esc(t(l)) + '</th>').join('') + '</tr></thead><tbody>';
    for (let u = 0; u < 16; u++) {
      h += '<tr class="' + (u === cur ? 'cur' : '') + '" data-u="' + u + '"><td class="m">' + pad(u.toString(2), 4) + '</td>' + REP.map(([, f]) => { const v = f(u); return '<td class="m ' + (typeof v === 'string' ? 'nz' : v < 0 ? 'n' : '') + '">' + v + '</td>'; }).join('') + '</tr>';
    }
    $('#cmp').innerHTML = h + '</tbody></table>';
  }
  $('#cmp').addEventListener('click', (e) => { const r = e.target.closest('tr[data-u]'); if (r) CL.set(+r.dataset.u); });
  drawCmp();

  /* Fazlalıklı (bias) gösterim */
  const EX = lamps($('#ex-lamps'), { n: 8, value: 0b10000011, group: 4, weight: (i) => String(2 ** (7 - i)), onChange: drawEx, label: 'excess' });
  function drawEx() {
    const u = EX.value();
    $('#ex-out').innerHTML = ['<div class="dual-c"><div class="dual-h">' + t({ tr: 'İşaretsiz', en: 'Unsigned' }) + '</div><div class="big d">' + u + '</div></div>',
      '<div class="dual-c"><div class="dual-h">' + t({ tr: 'Fazlalık-127 (float üssü)', en: 'Excess-127 (float exponent)' }) + '</div><div class="big ' + (u - 127 < 0 ? 'n' : 'd') + '">' + (u - 127) + '</div><div class="muted mono">' + u + ' − 127</div></div>',
      '<div class="dual-c"><div class="dual-h">' + t({ tr: '2’ye tümleyen', en: 'Two’s complement' }) + '</div><div class="big ' + (sgn8(u) < 0 ? 'n' : 'd') + '">' + sgn8(u) + '</div></div>'].join('');
  }
  drawEx();

  /* İşaret genişletme */
  const SX = lamps($('#sx-lamps'), { n: 8, value: 0xFB, group: 4, weight: (i) => (i === 0 ? '±' : ''), cls: (i) => (i === 0 ? 'neg' : ''), onChange: drawSx, label: '8 bit' });
  function drawSx() {
    const u = SX.value(), sbit = u >> 7, z = b8(u).padStart(16, '0'), sx = b8(u).padStart(16, String(sbit));
    const cells = (s2, fill) => '<span class="nrb wide">' + [...s2].map((x, i) => '<i class="' + (x === '1' ? 'on' : '') + (i < 8 ? ' ' + fill : '') + (i === 8 ? ' gapl' : '') + '">' + x + '</i>').join('') + '</span>';
    const zv = u, sv = sgn8(u);
    $('#sx-out').innerHTML =
      '<div class="nr"><span class="nrl">' + t({ tr: 'sıfırla genişlet', en: 'zero-extend' }) + '</span>' + cells(z, 'ext0') + '<span class="nrv">' + zv + ' <small class="muted">0x' + pad(toBase(zv, 16), 4) + '</small></span></div>' +
      '<div class="nr"><span class="nrl">' + t({ tr: 'işaretle genişlet', en: 'sign-extend' }) + '</span>' + cells(sx, 'ext1') + '<span class="nrv"><b class="' + (sv < 0 ? 'n' : '') + '">' + sv + '</b> <small class="muted">0x' + pad(toBase(sv & 0xffff, 16), 4) + '</small></span></div>';
    $('#sx-tell').innerHTML = t({ tr: '8 bitlik desen işaretli okunursa <b>' + sv + '</b>. ', en: 'Read as signed, the 8-bit pattern is <b>' + sv + '</b>. ' }) + (sbit ? t({ tr: 'Sıfırla genişletmek onu <span class="bad">' + zv + '</span> yapar; işaret bitini kopyalamak değeri korur.', en: 'Zero-extending turns it into <span class="bad">' + zv + '</span>; copying the sign bit keeps the value.' }) : t({ tr: 'İşaret biti 0 olduğu için iki yöntem de aynı sonucu verir.', en: 'The sign bit is 0, so both methods agree.' }));
  }
  drawSx();

  /* Aritmetik / mantıksal kaydırma */
  let lastSh = '';
  const AS = lamps($('#ash-lamps'), { n: 8, value: 0b11110100, group: 4, weight: (i) => (i === 0 ? '−128' : String(2 ** (7 - i))), cls: (i) => (i === 0 ? 'neg' : ''), onChange: () => { lastSh = ''; drawAsh(); }, label: '8 bit' });
  function drawAsh() { const u = AS.value(); $('#ash-out').innerHTML = '<b class="b">' + b8(u) + '</b> = <b class="' + (sgn8(u) < 0 ? 'n' : 'd') + '">' + sgn8(u) + '</b> <span class="muted">(' + t({ tr: 'işaretsiz ', en: 'unsigned ' }) + u + ')</span>'; $('#ash-tell').innerHTML = lastSh || t({ tr: 'İki sağa kaydırmayı karşılaştır.', en: 'Compare the two right shifts.' }); }
  $('#ash-ctl').append(
    el('button', { class: 'btn fill', type: 'button', text: t({ tr: '>> 1 aritmetik', en: '>> 1 arithmetic' }), onclick: () => { const u = AS.value(), r = (u >> 1) | (u & 128); AS.set(r, true); lastSh = sgn8(u) + ' >> 1 = <b>' + sgn8(r) + '</b> · ' + t({ tr: 'işaret biti kopyalandı; değer ⌊x ÷ 2⌋', en: 'the sign bit was copied; value ⌊x ÷ 2⌋' }); drawAsh(); } }),
    el('button', { class: 'btn fill', type: 'button', text: t({ tr: '>>> 1 mantıksal', en: '>>> 1 logical' }), onclick: () => { const u = AS.value(), r = u >> 1; AS.set(r, true); lastSh = t({ tr: 'soldan 0 girdi: ', en: 'a 0 came in on the left: ' }) + sgn8(u) + ' → <b>' + sgn8(r) + '</b>' + (u & 128 ? ' <span class="bad">' + t({ tr: '(negatif sayı için anlamsız)', en: '(meaningless for a negative number)' }) + '</span>' : ''); drawAsh(); } }),
    el('button', { class: 'btn', type: 'button', text: '<< 1', onclick: () => { const u = AS.value(), r = (u << 1) & 255; AS.set(r, true); lastSh = sgn8(u) + ' << 1 = <b>' + sgn8(r) + '</b>' + (sgn8(u) * 2 !== sgn8(r) ? ' <span class="bad">' + t({ tr: '(taşma)', en: '(overflow)' }) + '</span>' : ' = ' + sgn8(u) + ' × 2'); drawAsh(); } }),
    el('button', { class: 'btn ghost', type: 'button', text: '−12', onclick: () => { AS.set(0b11110100, true); lastSh = ''; drawAsh(); } }),
    el('button', { class: 'btn ghost', type: 'button', text: '−7', onclick: () => { AS.set(0b11111001, true); lastSh = ''; drawAsh(); } }),
  );
  drawAsh();

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

  const { rand, pick } = NS;
  function onesQ() { const x = rand(1, 127); return { q: t({ tr: '<span class="n">−' + x + '</span> sayısını 8 bit <b>1’e tümleyen</b> olarak yaz.', en: 'Write <span class="n">−' + x + '</span> as 8-bit <b>one’s complement</b>.' }), a: b8(~x & 255), kind: 'bits', ph: '8 bit', hint: t({ tr: 'Sadece bütün bitleri ters çevir, +1 yok.', en: 'Just flip every bit, no +1.' }), explain: b8(x) + ' → <b class="b">' + b8(~x & 255) + '</b>' }; }
  function sxQ() { const u = rand(0, 255), v = sgn8(u) & 0xffff; return { q: t({ tr: '8 bitlik işaretli <span class="h">0x' + pad(toBase(u, 16), 2) + '</span> değeri 16 bite <b>işaretle genişletilince</b> hex olarak?', en: 'The 8-bit signed value <span class="h">0x' + pad(toBase(u, 16), 2) + '</span> <b>sign-extended</b> to 16 bits, in hex?' }), a: pad(toBase(v, 16), 4), kind: 'hex', hint: t({ tr: 'En soldaki bit 1 ise üst byte FF, 0 ise 00.', en: 'If the top bit is 1 the high byte is FF, otherwise 00.' }), explain: t({ tr: 'işaret biti ', en: 'sign bit ' }) + (u >> 7) + ' → <b class="h">' + pad(toBase(v, 16), 4) + '</b> = ' + sgn8(u) }; }
  function excessQ() { const u = rand(100, 160); return { q: t({ tr: 'Fazlalık-127 gösterimindeki <span class="b">' + b8(u) + '</span> deseni kaçtır?', en: 'What value does <span class="b">' + b8(u) + '</span> hold in excess-127?' }), a: String(u - 127), kind: 'dec', hint: t({ tr: 'İşaretsiz oku, 127 çıkar.', en: 'Read it unsigned, subtract 127.' }), explain: u + ' − 127 = <b>' + (u - 127) + '</b>' }; }
  function ovQ() { const a = rand(-128, 127), b = rand(-128, 127), s2 = a + b, ov = s2 > 127 || s2 < -128; return { q: t({ tr: '8 bit işaretli: <code>' + a + ' + ' + b + '</code> taşar mı? (evet/hayır)', en: '8-bit signed: does <code>' + a + ' + ' + b + '</code> overflow? (yes/no)' }), a: ov ? t({ tr: ['evet', 'e'], en: ['yes', 'y'] }) : t({ tr: ['hayır', 'hayir', 'h'], en: ['no', 'n'] }), kind: 'text', hint: t({ tr: 'Aralık −128…127. Farklı işaretli iki sayının toplamı asla taşmaz.', en: 'Range −128…127. Two numbers of different signs never overflow.' }), explain: a + ' + ' + b + ' = ' + s2 + ' → <b>' + (ov ? t({ tr: 'evet', en: 'yes' }) : t({ tr: 'hayır', en: 'no' })) + '</b>' }; }
  function rangeQ() { const n = pick([4, 6, 8, 10, 12, 16]), lo = Math.random() < 0.5; return { q: t({ tr: n + ' bitlik ikiye tümleyende ' + (lo ? 'en küçük' : 'en büyük') + ' sayı?', en: (lo ? 'Smallest' : 'Largest') + ' number in ' + n + '-bit two’s complement?' }), a: String(lo ? -(2 ** (n - 1)) : 2 ** (n - 1) - 1), kind: 'dec', hint: '−2ⁿ⁻¹ … 2ⁿ⁻¹ − 1', explain: '<b>' + (lo ? -(2 ** (n - 1)) : 2 ** (n - 1) - 1) + '</b>' }; }
  function ashQ() { const x = -rand(2, 100), k = rand(1, 3); return { q: '<code>' + x + ' >> ' + k + '</code> ' + t({ tr: '(aritmetik kaydırma) = ?', en: '(arithmetic shift) = ?' }), a: String(x >> k), kind: 'dec', hint: t({ tr: '÷ 2ᵏ, aşağı yuvarla (−∞’a doğru).', en: '÷ 2ᵏ, round down (toward −∞).' }), explain: '⌊' + x + ' ÷ ' + 2 ** k + '⌋ = <b>' + (x >> k) + '</b>' }; }
  tryIt($('#try'), [
    { label: t({ tr: 'Onlu → 2’ye tümleyen', en: 'Decimal → two’s complement' }), fn: GEN.twosEncode },
    { label: t({ tr: '2’ye tümleyen → onlu', en: 'Two’s complement → decimal' }), fn: GEN.twosDecode },
    { label: t({ tr: '1’e tümleyen', en: 'One’s complement' }), fn: onesQ },
    { label: t({ tr: 'İşaret genişletme', en: 'Sign extension' }), fn: sxQ },
    { label: t({ tr: 'Fazlalık-127', en: 'Excess-127' }), fn: excessQ },
    { label: t({ tr: 'Taşma', en: 'Overflow' }), fn: ovQ },
    { label: t({ tr: 'Aralık', en: 'Range' }), fn: rangeQ },
    { label: t({ tr: 'Aritmetik kaydırma', en: 'Arithmetic shift' }), fn: ashQ },
  ]);
})();
