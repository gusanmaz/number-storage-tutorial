/* Bölüm 4 — İkili aritmetik */
(function () {
  const { t, $, $$, el, esc, fmt, pad, toBase, lamps, knob, steps, tryIt, rand, pick } = NS;
  const b8 = (v) => pad((v & 255).toString(2), 8);
  const sub = (b) => '<span class="sub">' + b + '</span>';

  /* ---------- Şekil 1: tam toplayıcı ---------- */
  const fa = $('#fa');
  const inBox = el('div', { class: 'fa-side' }), outBox = el('div', { class: 'fa-side' });
  inBox.append(el('div', { class: 'fa-h', text: t({ tr: 'Girişler', en: 'Inputs' }) }));
  outBox.append(el('div', { class: 'fa-h', text: t({ tr: 'Çıkışlar', en: 'Outputs' }) }));
  const IN = lamps(inBox, { n: 3, value: 0b110, weight: (i) => ['a', 'b', t({ tr: 'elde', en: 'carry' }) + ' in'][i], onChange: drawFa, label: 'inputs' });
  const OUT = lamps(outBox, { n: 2, value: 0, ro: true, weight: (i) => [t({ tr: 'elde', en: 'carry' }) + ' out', t({ tr: 'toplam', en: 'sum' })][i], label: 'outputs' });
  const box = el('div', { class: 'fa-box', html: '<b>FA</b><small>' + esc(t({ tr: 'tam toplayıcı', en: 'full adder' })) + '</small>' });
  const tbl = el('div', { class: 'tbl fa-tbl' });
  fa.append(el('div', { class: 'fa-row' }, [inBox, el('span', { class: 'fa-ar', text: '→' }), box, el('span', { class: 'fa-ar', text: '→' }), outBox]), tbl);
  function drawFa() {
    const [a, b, c] = IN.get(), n = a + b + c, s = n & 1, co = n >> 1;
    OUT.set([co, s], true);
    tbl.innerHTML = '<table><thead><tr><th>a</th><th>b</th><th>' + esc(t({ tr: 'elde gir.', en: 'c in' })) + '</th><th>' + esc(t({ tr: 'elde çık.', en: 'c out' })) + '</th><th>' + esc(t({ tr: 'toplam', en: 'sum' })) + '</th></tr></thead><tbody>' +
      Array.from({ length: 8 }, (_, k) => { const x = k >> 2 & 1, y = k >> 1 & 1, z = k & 1, m = x + y + z; return '<tr class="' + (x === a && y === b && z === c ? 'cur' : '') + '"><td class="m">' + x + '</td><td class="m">' + y + '</td><td class="m">' + z + '</td><td class="m">' + (m >> 1) + '</td><td class="m">' + (m & 1) + '</td></tr>'; }).join('') + '</tbody></table>';
    $('#fa-tell').innerHTML = a + ' + ' + b + ' + ' + c + ' = <b>' + n + '</b> = <span class="b">' + co + s + '</span>' + sub(2) + ' → ' + t({ tr: 'toplam ', en: 'sum ' }) + '<b>' + s + '</b>, ' + t({ tr: 'elde ', en: 'carry ' }) + '<b>' + co + '</b>';
  }
  drawFa();

  /* ---------- ortak: sütunlu toplama/çıkarma ızgarası ---------- */
  // rows: [{lbl, cells:[...9 items, index 8 = soldaki taşma sütunu], cls}]
  function grid(container, rows, cur) {
    container.innerHTML = rows.map((r) => r.line ? '<div class="arline"></div>' : '<div class="ar ' + (r.cls || '') + '"><span class="arl">' + r.lbl + '</span>' +
      Array.from({ length: 9 }, (_, k) => { const j = 8 - k, v = r.cells[j]; return '<i class="' + (j === cur ? 'cur ' : '') + (j === 8 ? 'ov ' : '') + (r.ccls ? r.ccls(j) : '') + '">' + (v == null ? '' : v) + '</i>'; }).join('') + '</div>').join('');
  }

  /* ---------- Şekil 2: toplama ---------- */
  let A = 181, B = 107;
  const addSteps = steps($('#add-steps'), { count: 10, render: drawAdd, nextLabel: t({ tr: 'Sonraki sütun →', en: 'Next column →' }) });
  knob($('#k-aa'), { value: A, min: 0, max: 255, px: 3, onChange: (v) => { A = v; addSteps.go(0); } });
  knob($('#k-ab'), { value: B, min: 0, max: 255, px: 3, onChange: (v) => { B = v; addSteps.go(0); } });
  function addCols(a, b, c0) {
    const c = [c0 || 0], s = [];
    for (let j = 0; j < 8; j++) { const n = (a >> j & 1) + (b >> j & 1) + c[j]; s[j] = n & 1; c[j + 1] = n >> 1; }
    return { c, s };
  }
  function drawAdd(k) {
    const { c, s } = addCols(A, B, 0), done = Math.min(k, 8);
    const bits = (v) => Array.from({ length: 8 }, (_, j) => v >> j & 1);
    grid($('#add'), [
      { lbl: t({ tr: 'elde', en: 'carry' }), cls: 'cyr', cells: Array.from({ length: 9 }, (_, j) => (j >= 1 && j <= done && c[j] ? 1 : null)) },
      { lbl: String(A), cells: bits(A) },
      { lbl: '+ ' + B, cells: bits(B) },
      { line: true },
      { lbl: '=', cls: 'res', cells: Array.from({ length: 9 }, (_, j) => (j < done ? s[j] : j === 8 && k >= 9 ? c[8] : null)), ccls: (j) => (j === 8 && c[8] ? 'bad' : '') },
    ], k >= 1 && k <= 8 ? k - 1 : -1);
    const j = k - 1, sum = A + B, r = sum & 255;
    $('#add-tell').innerHTML = k === 0 ? t({ tr: 'En sağdaki sütundan başlıyoruz. İlk elde 0.', en: 'We start at the rightmost column. The first carry is 0.' })
      : k <= 8 ? t({ tr: 'Sütun ' + j + ' (değeri ' + 2 ** j + '): ', en: 'Column ' + j + ' (worth ' + 2 ** j + '): ' }) + (A >> j & 1) + ' + ' + (B >> j & 1) + ' + ' + c[j] + ' = ' + ((A >> j & 1) + (B >> j & 1) + c[j]) + ' → ' + t({ tr: 'toplam ', en: 'sum ' }) + '<b>' + s[j] + '</b>, ' + t({ tr: 'elde ', en: 'carry ' }) + '<b>' + c[j + 1] + '</b>'
        : '<b class="b">' + b8(r) + '</b> = <b>' + r + '</b> · C = <b>' + c[8] + '</b> · ' + (c[8] ? '<span class="bad">' + t({ tr: 'Taşma! ' + A + ' + ' + B + ' = ' + sum + ' sığmadı: ' + sum + ' − 256 = ' + r + '.', en: 'Overflow! ' + A + ' + ' + B + ' = ' + sum + ' did not fit: ' + sum + ' − 256 = ' + r + '.' }) + '</span>' : '<span class="good">' + t({ tr: 'Doğru: ' + A + ' + ' + B + ' = ' + sum + '.', en: 'Correct: ' + A + ' + ' + B + ' = ' + sum + '.' }) + '</span>');
  }

  /* ---------- Şekil 3: byte byte toplama (ADC) ---------- */
  let WA = 0x12F0, WB = 0x0A35;
  const h2 = (v) => '0x' + pad(toBase(v, 16), 2), h4 = (v) => '0x' + pad(toBase(v, 16), 4);
  function drawAdc() {
    const lo = (WA & 255) + (WB & 255), C = lo >> 8, hi = (WA >> 8) + (WB >> 8) + C, C2 = hi >> 8, r = ((hi & 255) << 8) | (lo & 255);
    $('#adc').innerHTML = '<div class="adc">' +
      '<div class="adc-r"><span class="adc-l">1 · ' + t({ tr: 'alt byte’lar', en: 'low bytes' }) + '</span><span class="mono">' + h2(WA & 255) + ' + ' + h2(WB & 255) + ' = ' + h2(lo & 255) + '</span><span class="flag' + (C ? ' on' : '') + '">C = ' + C + '</span></div>' +
      '<div class="adc-r"><span class="adc-l">2 · ' + t({ tr: 'üst byte’lar + C', en: 'high bytes + C' }) + '</span><span class="mono">' + h2(WA >> 8) + ' + ' + h2(WB >> 8) + ' + <b class="' + (C ? 'b' : '') + '">' + C + '</b> = ' + h2(hi & 255) + '</span><span class="flag' + (C2 ? ' on' : '') + '">C = ' + C2 + '</span></div>' +
      '<div class="adc-r tot"><span class="adc-l">' + t({ tr: 'sonuç', en: 'result' }) + '</span><span class="mono"><b class="h">' + h4(r) + '</b> = <b class="d">' + fmt(r) + '</b></span><span class="muted">' + fmt(WA) + ' + ' + fmt(WB) + ' = ' + fmt(WA + WB) + (C2 ? ' (' + t({ tr: '16 biti aştı', en: 'exceeds 16 bits' }) + ')' : '') + '</span></div></div>';
  }
  knob($('#k-wa'), { value: WA, min: 0, max: 65535, px: 1, step: 1, fmt: (v) => h4(v), onChange: (v) => { WA = v; drawAdc(); } });
  knob($('#k-wb'), { value: WB, min: 0, max: 65535, px: 1, step: 1, fmt: (v) => h4(v), onChange: (v) => { WB = v; drawAdc(); } });
  drawAdc();

  /* ---------- Şekil 4: çıkarma ---------- */
  let SA = 3, SB = 5, smode = 'borrow';
  const subSteps = steps($('#sub-steps'), { count: 10, render: drawSub, nextLabel: t({ tr: 'Sonraki sütun →', en: 'Next column →' }) });
  const sseg = el('div', { class: 'seg', role: 'group' });
  [['borrow', { tr: 'Ödünç ile', en: 'With borrows' }], ['comp', { tr: 'Tümleyenle topla', en: 'Add the complement' }]].forEach(([k, l]) => sseg.append(el('button', { type: 'button', 'aria-pressed': String(k === smode), text: t(l), onclick: (e) => { smode = k; $$('button', sseg).forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget))); subSteps.go(0); } })));
  $('#sub-mode').append(sseg);
  knob($('#k-sa'), { value: SA, min: 0, max: 255, px: 3, onChange: (v) => { SA = v; subSteps.go(0); } });
  knob($('#k-sb'), { value: SB, min: 0, max: 255, px: 3, onChange: (v) => { SB = v; subSteps.go(0); } });
  function drawSub(k) {
    const done = Math.min(k, 8), bits = (v) => Array.from({ length: 8 }, (_, j) => v >> j & 1), r = (SA - SB) & 255;
    let tell;
    if (smode === 'borrow') {
      const br = [0], d = [];
      for (let j = 0; j < 8; j++) { let x = (SA >> j & 1) - (SB >> j & 1) - br[j]; br[j + 1] = x < 0 ? 1 : 0; d[j] = x < 0 ? x + 2 : x; }
      grid($('#sub'), [
        { lbl: t({ tr: 'ödünç', en: 'borrow' }), cls: 'cyr brw', cells: Array.from({ length: 9 }, (_, j) => (j >= 1 && j <= done && br[j] ? 1 : null)) },
        { lbl: String(SA), cells: bits(SA) },
        { lbl: '− ' + SB, cells: bits(SB) },
        { line: true },
        { lbl: '=', cls: 'res', cells: Array.from({ length: 9 }, (_, j) => (j < done ? d[j] : j === 8 && k >= 9 && br[8] ? '↑' : null)), ccls: (j) => (j === 8 ? 'bad' : '') },
      ], k >= 1 && k <= 8 ? k - 1 : -1);
      const j = k - 1;
      tell = k === 0 ? t({ tr: 'Sağdan başla. Başta ödünç yok.', en: 'Start on the right. No borrow yet.' })
        : k <= 8 ? t({ tr: 'Sütun ' + j + ': ', en: 'Column ' + j + ': ' }) + (SA >> j & 1) + ' − ' + (SB >> j & 1) + ' − ' + br[j] + (br[j + 1] ? ' < 0 → ' + t({ tr: 'soldan 1 ödünç al (bu sütunda 2 eder): ', en: 'borrow 1 from the left (worth 2 here): ' }) + ((SA >> j & 1) + 2 - (SB >> j & 1) - br[j]) : ' = ' + d[j]) + ' → <b>' + d[j] + '</b>'
          : '<b class="b">' + b8(r) + '</b> = <b>' + r + '</b> · ' + (br[8] ? '<span class="bad">' + t({ tr: 'En soldan bir ödünç dışarı çıktı: ' + SA + ' < ' + SB + '. Sonuç başa sardı: ' + SA + ' − ' + SB + ' + 256 = ' + r + '.', en: 'A borrow left the leftmost column: ' + SA + ' < ' + SB + '. The result wrapped: ' + SA + ' − ' + SB + ' + 256 = ' + r + '.' }) + '</span>' : '<span class="good">' + t({ tr: 'Doğru: ' + SA + ' − ' + SB + ' = ' + r + '.', en: 'Correct: ' + SA + ' − ' + SB + ' = ' + r + '.' }) + '</span>');
    } else {
      const nb = ~SB & 255, { c, s } = addCols(SA, nb, 1);
      grid($('#sub'), [
        { lbl: t({ tr: 'elde', en: 'carry' }), cls: 'cyr', cells: Array.from({ length: 9 }, (_, j) => (j === 0 ? 1 : j <= done && c[j] ? 1 : null)) },
        { lbl: String(SA), cells: bits(SA) },
        { lbl: '+ ~' + SB, cls: 'inv', cells: bits(nb) },
        { line: true },
        { lbl: '=', cls: 'res', cells: Array.from({ length: 9 }, (_, j) => (j < done ? s[j] : j === 8 && k >= 9 ? c[8] : null)), ccls: (j) => (j === 8 ? 'muted' : '') },
      ], k >= 1 && k <= 8 ? k - 1 : -1);
      const j = k - 1;
      tell = k === 0 ? t({ tr: 'B’nin bütün bitleri ters çevrildi (~' + SB + ' = ' + nb + ') ve ilk elde 1 yapıldı. Şimdi sıradan bir toplama.', en: 'All bits of B are flipped (~' + SB + ' = ' + nb + ') and the first carry is set to 1. Now it is an ordinary addition.' })
        : k <= 8 ? t({ tr: 'Sütun ' + j + ': ', en: 'Column ' + j + ': ' }) + (SA >> j & 1) + ' + ' + (nb >> j & 1) + ' + ' + c[j] + ' → <b>' + s[j] + '</b>, ' + t({ tr: 'elde ', en: 'carry ' }) + c[j + 1]
          : '<b class="b">' + b8(r) + '</b> = <b>' + r + '</b> — ' + t({ tr: 'ödünçlü çıkarmayla aynı sonuç! Elde çıkışı ' + c[8] + (c[8] ? ': ödünç yok.' : ': ödünç var (A < B).'), en: 'the same result as borrowing! Carry out is ' + c[8] + (c[8] ? ': no borrow.' : ': there was a borrow (A < B).') });
    }
    $('#sub-tell').innerHTML = tell;
  }

  /* ---------- Şekil 5: kaydırma ---------- */
  let dropped = null, lastOp = '';
  const SH = lamps($('#sh-lamps'), { n: 8, value: 13, group: 4, weight: (i) => String(2 ** (7 - i)), onChange: () => { dropped = null; lastOp = ''; drawSh(); }, label: 'bits' });
  function drawSh() {
    const v = SH.value();
    $('#sh-out').innerHTML = '<b class="b">' + b8(v) + '</b>' + sub(2) + ' = <b class="d">' + v + '</b>';
    $('#sh-tell').innerHTML = lastOp ? lastOp + (dropped != null ? ' · ' + t({ tr: 'düşen bit: ', en: 'bit dropped: ' }) + '<b class="' + (dropped ? 'bad' : '') + '">' + dropped + '</b>' : '') : t({ tr: 'Bitlere dokun ya da kaydır.', en: 'Tap bits or shift.' });
  }
  $('#sh-ctl').append(
    el('button', { class: 'btn fill', type: 'button', text: '<< 1', onclick: () => { const v = SH.value(); dropped = v >> 7; SH.set((v << 1) & 255, true); lastOp = v + ' << 1 = ' + ((v << 1) & 255) + (dropped ? t({ tr: ' (taşma: ' + (v * 2) + ' olmalıydı)', en: ' (overflow: should be ' + (v * 2) + ')' }) : ' = ' + v + ' × 2'); drawSh(); } }),
    el('button', { class: 'btn fill', type: 'button', text: '>> 1', onclick: () => { const v = SH.value(); dropped = v & 1; SH.set(v >> 1, true); lastOp = v + ' >> 1 = ' + (v >> 1) + ' = ⌊' + v + ' ÷ 2⌋' + t({ tr: ', kalan ', en: ', remainder ' }) + (v & 1); drawSh(); } }),
    el('button', { class: 'btn ghost', type: 'button', text: '13', onclick: () => { SH.set(13, true); dropped = null; lastOp = ''; drawSh(); } }),
    el('button', { class: 'btn ghost', type: 'button', text: '200', onclick: () => { SH.set(200, true); dropped = null; lastOp = ''; drawSh(); } }),
  );
  drawSh();

  /* ---------- Şekil 6: çarpma ---------- */
  let MA = 13, MB = 11;
  const mulSteps = steps($('#mul-steps'), { count: 6, render: drawMul });
  knob($('#k-ma'), { value: MA, min: 0, max: 15, onChange: (v) => { MA = v; mulSteps.go(0); } });
  knob($('#k-mb'), { value: MB, min: 0, max: 15, onChange: (v) => { MB = v; mulSteps.go(0); } });
  function drawMul(k) {
    const row = (lbl, val, shift, width, cls) => { const bits = val == null ? [] : pad(val.toString(2), width).split(''); let cells = ''; for (let c = 0; c < 8; c++) { const p = 7 - c, idx = bits.length - 1 - (p - shift); const v = val == null ? '' : p >= shift && p < shift + width ? bits[idx] : ''; cells += '<i class="' + (p < shift && val != null && cls !== 'tot' ? 'z' : '') + '">' + v + '</i>'; } return '<div class="mr ' + (cls || '') + '"><span class="ml">' + lbl + '</span>' + cells + '</div>'; };
    let h = row('A = ' + MA, MA, 0, 4) + row('× B = ' + MB, MB, 0, 4) + '<div class="mline"></div>';
    for (let i = 0; i < 4; i++) {
      if (k <= i) { h += row('', null, 0, 0); continue; }
      const on = MB >> i & 1;
      h += row((on ? 'A << ' + i : '0') + (on ? ' = ' + (MA << i) : ''), on ? MA : 0, i, 4, on ? 'pp' : 'pp off');
    }
    h += '<div class="mline"></div>' + (k >= 5 ? row('= ' + MA * MB, MA * MB, 0, 8, 'tot') : row('', null, 0, 0));
    $('#mul').innerHTML = h;
    $('#mul-tell').innerHTML = k === 0 ? t({ tr: 'B’nin bitlerine sağdan sola bakacağız.', en: 'We look at the bits of B from right to left.' })
      : k <= 4 ? t({ tr: 'B’nin ' + (k - 1) + '. biti ', en: 'Bit ' + (k - 1) + ' of B is ' }) + '<b>' + (MB >> (k - 1) & 1) + '</b> → ' + (MB >> (k - 1) & 1 ? t({ tr: 'A’yı ' + (k - 1) + ' sola kaydırıp yaz (' + MA + ' × ' + 2 ** (k - 1) + ' = ' + (MA << (k - 1)) + ').', en: 'write A shifted left by ' + (k - 1) + ' (' + MA + ' × ' + 2 ** (k - 1) + ' = ' + (MA << (k - 1)) + ').' }) : t({ tr: 'bu satır sıfır.', en: 'this row is zero.' }))
        : t({ tr: 'Kısmi çarpımları topla: ', en: 'Add the partial products: ' }) + [0, 1, 2, 3].filter((i) => MB >> i & 1).map((i) => MA << i).join(' + ') + ' = <b>' + MA * MB + '</b> = <span class="b">' + (MA * MB).toString(2) + '</span>' + sub(2);
  }

  /* ---------- Şekil 7: bölme ---------- */
  let DN = 200, DD = 7;
  const divSteps = steps($('#div-steps'), { count: 9, render: drawDiv, nextLabel: t({ tr: 'Sonraki bit →', en: 'Next bit →' }) });
  knob($('#k-da'), { value: DN, min: 0, max: 255, px: 3, onChange: (v) => { DN = v; divSteps.go(0); } });
  knob($('#k-db'), { value: DD, min: 1, max: 15, onChange: (v) => { DD = v; divSteps.go(0); } });
  function drawDiv(k) {
    let R = 0, q = 0, h = '<div class="dv-head"><span class="mono">' + b8(DN) + '</span>' + sub(2) + ' ÷ <span class="mono">' + DD.toString(2) + '</span>' + sub(2) + '</div>';
    const rows = [];
    for (let i = 7; i >= 0 && 8 - i <= k; i--) {
      const bit = DN >> i & 1; R = (R << 1) | bit; const fits = R >= DD, before = R;
      if (fits) R -= DD; q = (q << 1) | (fits ? 1 : 0);
      rows.push('<div class="dvr' + (8 - i === k ? ' cur' : '') + '"><span class="dv-n">' + (8 - i) + '</span><span>' + t({ tr: 'bit indir: ', en: 'bring down: ' }) + '<b>' + bit + '</b></span><span class="mono">R = ' + before.toString(2) + sub(2) + ' = ' + before + '</span><span>' + (fits ? '≥ ' + DD + ' → <b class="good">' + t({ tr: 'çıkar', en: 'subtract' }) + '</b>, q = 1' : '< ' + DD + ' → q = 0') + '</span></div>');
    }
    const qs = pad(q.toString(2), Math.min(8, Math.max(k, 1))).slice(-Math.max(k, 1));
    h += rows.join('') + '<div class="dv-q">' + t({ tr: 'Bölüm: ', en: 'Quotient: ' }) + '<b class="b">' + (k ? qs : '…') + '</b>' + (k ? sub(2) : '') + ' · ' + t({ tr: 'kalan: ', en: 'remainder: ' }) + '<b>' + R + '</b></div>';
    $('#div').innerHTML = h;
    $('#div-tell').innerHTML = k < 8 ? t({ tr: 'Soldan sağa, her adımda bölünenin bir biti kalana eklenir.', en: 'Left to right, each step appends one bit of the dividend to the remainder.' })
      : '<span class="good">' + DN + ' ÷ ' + DD + ' = ' + Math.floor(DN / DD) + t({ tr: ', kalan ', en: ', remainder ' }) + DN % DD + '</span> · ' + t({ tr: 'kontrol: ', en: 'check: ' }) + Math.floor(DN / DD) + ' × ' + DD + ' + ' + DN % DD + ' = ' + DN;
  }

  /* ---------- alıştırma ---------- */
  const bin = (v) => '<span class="b">' + v.toString(2) + '</span>' + sub(2);
  function addQ() { const a = rand(5, 120), b = rand(5, 120); return { q: bin(a) + ' + ' + bin(b) + ' = ? ' + t({ tr: '(ikili)', en: '(binary)' }), a: (a + b).toString(2), kind: 'bin', hint: t({ tr: 'Sağdan başla: 1 + 1 = 0, elde 1.', en: 'Start right: 1 + 1 = 0, carry 1.' }), explain: a + ' + ' + b + ' = ' + (a + b) + ' = <b class="b">' + (a + b).toString(2) + '</b>' }; }
  function subQ() { const a = rand(40, 200), b = rand(3, a - 1); return { q: bin(a) + ' − ' + bin(b) + ' = ? ' + t({ tr: '(ikili)', en: '(binary)' }), a: (a - b).toString(2), kind: 'bin', hint: t({ tr: '0 − 1 = 1, soldan ödünç al.', en: '0 − 1 = 1, borrow from the left.' }), explain: a + ' − ' + b + ' = ' + (a - b) + ' = <b class="b">' + (a - b).toString(2) + '</b>' }; }
  function wrapQ() {
    const a = rand(100, 255), b = rand(60, 255), plus = Math.random() < 0.6, r = plus ? (a + b) & 255 : (b - a) & 255, x = plus ? a + ' + ' + b : b + ' − ' + a;
    return { q: t({ tr: '8 bit işaretsiz: <code>' + x + '</code> = ? (onlu)', en: '8-bit unsigned: <code>' + x + '</code> = ? (decimal)' }), a: String(r), kind: 'dec', hint: t({ tr: 'Gerçek sonucu bul, sonra 256’ya göre kalanı al.', en: 'Find the true result, then take it mod 256.' }), explain: (plus ? a + b : b - a) + ' mod 256 = <b>' + r + '</b>' };
  }
  function mulQ() { const a = rand(3, 15), b = rand(2, 7); return { q: bin(a) + ' × ' + bin(b) + ' = ? ' + t({ tr: '(ikili)', en: '(binary)' }), a: (a * b).toString(2), kind: 'bin', hint: t({ tr: 'B’nin her 1 biti için A’yı kaydırıp yaz, topla.', en: 'For every 1 bit of B write A shifted, then add.' }), explain: a + ' × ' + b + ' = ' + a * b + ' = <b class="b">' + (a * b).toString(2) + '</b>' }; }
  function maskQ() { const k = pick([2, 3, 4, 5]), x = rand(20, 250), m = 2 ** k; return { q: '<code>' + x + ' % ' + m + '</code> = <code>' + x + ' &amp; ?</code> ' + t({ tr: '(maskeyi onlu yaz)', en: '(give the mask in decimal)' }), a: String(m - 1), kind: 'dec', hint: t({ tr: '2ᵏ’ye göre kalan = son k bit.', en: 'Remainder mod 2ᵏ = the last k bits.' }), explain: m + ' − 1 = <b>' + (m - 1) + '</b> = ' + (m - 1).toString(2) + '₂ · ' + x + ' % ' + m + ' = ' + (x % m) };
  }
  tryIt($('#try'), [
    { label: t({ tr: 'Toplama', en: 'Addition' }), fn: addQ },
    { label: t({ tr: 'Çıkarma', en: 'Subtraction' }), fn: subQ },
    { label: t({ tr: '8 bit taşma', en: '8-bit overflow' }), fn: wrapQ },
    { label: t({ tr: 'Çarpma', en: 'Multiplication' }), fn: mulQ },
    { label: t({ tr: 'Maske', en: 'Mask' }), fn: maskQ },
  ]);
})();
