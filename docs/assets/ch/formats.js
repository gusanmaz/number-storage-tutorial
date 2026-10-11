/* Bölüm 9 — Az bilinen formatlar */
(function () {
  const { t, $, $$, el, esc, fmt, pad, toBase, group, lamps, knob, tryIt, rand, pick, LANG } = NS;
  const hx = (v, n) => pad(toBase(v, 16), n || 2);
  const sub = (b) => '<span class="sub">' + b + '</span>';
  const enc = new TextEncoder();

  /* ---------- Şekil 1: BCD + 7 segment ---------- */
  const SEG = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg'];
  const SEGP = { a: 'M14 6h32l-5 6H19z', b: 'M48 8v32l-6-4V14z', c: 'M48 46v32l-6-6V50z', d: 'M14 80h32l-5-6H19z', e: 'M12 46v32l6-6V50z', f: 'M12 8v32l6-4V14z', g: 'M15 43l4-4h22l4 4-4 4H19z' };
  function seg7(d) { const on = SEG[d]; return '<svg viewBox="0 0 60 86" class="seg7" aria-label="' + d + '">' + Object.entries(SEGP).map(([k, p]) => '<path d="' + p + '" class="' + (on.includes(k) ? 'on' : '') + '"/>').join('') + '</svg>'; }
  const segCode = (d) => 'gfedcba'.split('').map((k) => (SEG[d].includes(k) ? 1 : 0)).join('');
  function drawBcd(n) {
    const ds = String(n).padStart(4, '0').split('').map(Number);
    $('#bcd').innerHTML = ds.map((d) => '<div class="s7"><div class="s7-d">' + seg7(d) + '</div><b class="b">' + pad(d.toString(2), 4) + '</b><small>' + t({ tr: 'segment', en: 'segments' }) + ' <span class="mono">' + segCode(d) + '</span></small></div>').join('');
    const bin = n.toString(2);
    $('#bcd-tell').innerHTML = 'BCD: <b class="b">' + ds.map((d) => pad(d.toString(2), 4)).join(' ') + '</b> (16 bit) · ' + t({ tr: 'ikili: ', en: 'binary: ' }) + '<b class="b">' + bin + '</b> (' + bin.length + ' bit) · ' + t({ tr: 'hex gibi okunursa: ', en: 'read as hex: ' }) + '0x' + ds.join('') + ' = ' + fmt(parseInt(ds.join(''), 16));
  }
  knob($('#k-bcd'), { value: 2059, min: 0, max: 9999, px: 2, onChange: drawBcd });
  drawBcd(2059);

  /* ---------- Şekil 2: Gray kodu ---------- */
  let gv = 7;
  const gray = (n) => n ^ (n >> 1);
  const GB = lamps($('#gr-bin'), { n: 4, value: gv, ro: true, size: 'sm', weight: (i) => String(2 ** (3 - i)), label: 'binary' });
  const GG = lamps($('#gr-gray'), { n: 4, value: gray(gv), ro: true, size: 'sm', label: 'gray' });
  const popc = (x) => x.toString(2).split('1').length - 1;
  function drawGray(prev) {
    GB.set(gv, true); GG.set(gray(gv), true);
    let h = '<table><thead><tr><th>n</th><th>' + t({ tr: 'ikili', en: 'binary' }) + '</th><th>Δ</th><th>Gray</th><th>Δ</th></tr></thead><tbody>';
    for (let i = 0; i < 16; i++) { const db = i ? popc(i ^ (i - 1)) : 0, dg = i ? popc(gray(i) ^ gray(i - 1)) : 0; h += '<tr class="' + (i === gv ? 'cur' : '') + '"><td class="m">' + i + '</td><td class="m">' + pad(i.toString(2), 4) + '</td><td class="m ' + (db > 1 ? 'bad' : '') + '">' + (i ? db : '') + '</td><td class="m">' + pad(gray(i).toString(2), 4) + '</td><td class="m">' + (i ? dg : '') + '</td></tr>'; }
    $('#gr-tbl').innerHTML = h + '</tbody></table>';
    if (prev == null) { $('#gr-tell').innerHTML = t({ tr: 'İleri ya da geri git.', en: 'Step forward or back.' }); return; }
    const ch = prev ^ gv, glitch = [];
    for (let m = 1; m < 16; m++) if ((m & ch) === m && m !== ch) glitch.push(prev ^ m);
    $('#gr-tell').innerHTML = prev + ' → ' + gv + ': ' + t({ tr: 'ikilide ', en: 'binary changes ' }) + '<b class="' + (popc(ch) > 1 ? 'bad' : '') + '">' + popc(ch) + '</b> ' + t({ tr: 'bit değişti, Gray’de ', en: 'bit(s), Gray changes ' }) + '<b class="good">1</b>.' +
      (glitch.length ? ' ' + t({ tr: 'Olası yanlış ara okumalar: ', en: 'Possible false intermediate readings: ' }) + '<span class="bad">' + glitch.join(', ') + '</span>' : '');
  }
  $('#gr-ctl').append(
    el('button', { class: 'btn', type: 'button', text: '−1', onclick: () => { const p = gv; gv = (gv + 15) % 16; drawGray(p); } }),
    el('button', { class: 'btn fill', type: 'button', text: '+1', onclick: () => { const p = gv; gv = (gv + 1) % 16; drawGray(p); } }),
  );
  drawGray();

  /* ---------- Şekil 3: Hamming(7,4) ---------- */
  const HL = ['p1', 'p2', 'd1', 'p4', 'd2', 'd3', 'd4'];
  let recv = null;
  const encodeH = (d) => { const [d1, d2, d3, d4] = d, p1 = d1 ^ d2 ^ d4, p2 = d1 ^ d3 ^ d4, p4 = d2 ^ d3 ^ d4; return [p1, p2, d1, p4, d2, d3, d4]; };
  const HD = lamps($('#ham-data'), { n: 4, value: 0b1011, size: 'sm', weight: (i) => 'd' + (i + 1), onChange: () => { recv = null; drawHam(); }, label: 'data' });
  const HS = lamps($('#ham-sent'), { n: 7, value: 0, ro: true, size: 'sm', weight: (i) => (i + 1) + ' ' + HL[i], cls: (i) => ([0, 1, 3].includes(i) ? 'par' : ''), label: 'sent' });
  const HR = lamps($('#ham-recv'), { n: 7, value: 0, size: 'sm', weight: (i) => (i + 1) + ' ' + HL[i], cls: (i) => ([0, 1, 3].includes(i) ? 'par' : ''), onChange: (b) => { recv = b; drawHam(); }, label: 'received' });
  function drawHam() {
    const sent = encodeH(HD.get());
    HS.set(sent, true);
    if (!recv) recv = sent.slice();
    HR.set(recv, true);
    const r = recv, checks = [[1, [1, 3, 5, 7]], [2, [2, 3, 6, 7]], [4, [4, 5, 6, 7]]].map(([p, pos]) => [p, pos, pos.reduce((a, k) => a ^ r[k - 1], 0)]);
    const syn = checks.reduce((a, [p, , bad]) => a + (bad ? p : 0), 0);
    const diff = sent.map((b, i) => b !== r[i]).filter(Boolean).length;
    HR.buttons.forEach((b, i) => b.classList.toggle('flipped', sent[i] !== r[i]));
    $('#ham-chk').innerHTML = checks.map(([p, pos, bad]) => '<span class="hc-p ' + (bad ? 'bad' : 'ok') + '">p' + p + ': ' + pos.map((k) => r[k - 1]).join(' ⊕ ') + ' = ' + bad + ' ' + (bad ? '✗' : '✓') + '</span>').join('');
    const fixed = r.slice(); if (syn) fixed[syn - 1] ^= 1;
    const data = [fixed[2], fixed[4], fixed[5], fixed[6]].join('');
    $('#ham-tell').innerHTML = !syn ? (diff ? '<span class="bad">' + t({ tr: diff + ' bit bozuk ama sendrom 0: hata görünmüyor!', en: diff + ' bits corrupted but the syndrome is 0: the error is invisible!' }) + '</span>' : '<span class="good">' + t({ tr: 'Bütün pariteler tutuyor: hata yok.', en: 'All parities check out: no error.' }) + '</span> ' + t({ tr: 'Alınan bitlerden birine dokunup boz.', en: 'Tap one of the received bits to corrupt it.' }))
      : t({ tr: 'Sendrom = ', en: 'Syndrome = ' }) + checks.filter((c) => c[2]).map((c) => c[0]).join(' + ') + ' = <b>' + syn + '</b> → ' + t({ tr: 'bozuk bit ', en: 'bad bit is ' }) + '<b>' + syn + ' (' + HL[syn - 1] + ')</b>. ' + t({ tr: 'Düzeltilmiş veri: ', en: 'Corrected data: ' }) + '<b class="b">' + data + '</b> ' + (data === HD.get().join('') ? '<span class="good">✓</span>' : '<span class="bad">' + t({ tr: '✗ yanlış düzeltme (birden çok bit bozuk)', en: '✗ wrong correction (more than one bit flipped)' }) + '</span>');
  }
  drawHam();

  /* ---------- Şekil 4: sağlama toplamları ---------- */
  const CRC = (() => { const tb = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; tb[n] = c >>> 0; } return tb; })();
  const crc32 = (b) => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const inet = (b) => { let s2 = 0; for (let i = 0; i < b.length; i += 2) { s2 += (b[i] << 8) + (b[i + 1] || 0); s2 = (s2 & 0xffff) + (s2 >>> 16); } return ~s2 & 0xffff; };
  function drawCk() {
    const b = Array.from(enc.encode($('#ck-in').value)), sum = b.reduce((a, x) => a + x, 0);
    $('#ck').innerHTML = '<div class="ck-bytes mono">' + b.slice(0, 40).map((x) => hx(x)).join(' ') + (b.length > 40 ? ' …' : '') + '</div><div class="ck-grid">' +
      '<div class="ck-c"><small>' + t({ tr: 'Basit toplam (8 bit)', en: 'Simple sum (8 bit)' }) + '</small><b class="h">0x' + hx(sum & 255) + '</b><span>' + fmt(sum) + ' mod 256</span></div>' +
      '<div class="ck-c"><small>' + t({ tr: 'İnternet sağlama toplamı (16 bit)', en: 'Internet checksum (16 bit)' }) + '</small><b class="h">0x' + hx(inet(b), 4) + '</b><span>' + t({ tr: '1’e tümleyen toplam, ters', en: 'one’s complement sum, inverted' }) + '</span></div>' +
      '<div class="ck-c"><small>CRC-32</small><b class="h">0x' + hx(crc32(b), 8) + '</b><span>ZIP, PNG, Ethernet</span></div></div>';
  }
  $('#ck-in').addEventListener('input', drawCk);
  ['ab', 'ba', t({ tr: 'Merhaba dünya', en: 'Hello world' }), t({ tr: 'Merhaba dünyA', en: 'Hello worlD' })].forEach((v) => $('#ck-pre').append(el('button', { type: 'button', class: 'chip', text: v, onclick: () => { $('#ck-in').value = v; drawCk(); } })));
  drawCk();

  /* ---------- Şekil 5: varint ---------- */
  let zig = false;
  const vseg = el('div', { class: 'seg', role: 'group' });
  [[false, { tr: 'işaretsiz', en: 'unsigned' }], [true, { tr: 'işaretli (zigzag)', en: 'signed (zigzag)' }]].forEach(([k, l]) => vseg.append(el('button', { type: 'button', 'aria-pressed': String(k === zig), text: t(l), onclick: (e) => { zig = k; $$('button', vseg).forEach((x) => x.setAttribute('aria-pressed', String(x === e.currentTarget))); drawVi(); } })));
  $('#vi-mode').append(vseg);
  function drawVi() {
    const raw = $('#vi-in').value.trim().replace(/[\s_.]/g, '');
    let v; try { v = BigInt(raw); } catch (e) { v = null; }
    const ok = v != null && (zig || v >= 0n) && v < (1n << 63n) && v > -(1n << 62n);
    $('#vi-in').classList.toggle('bad', !ok);
    if (!ok) { $('#vi').innerHTML = '<p class="tell bad">' + t({ tr: zig ? 'Bir tamsayı yaz.' : 'İşaretsiz modda negatif olmayan bir tamsayı yaz.', en: zig ? 'Type an integer.' : 'In unsigned mode type a non-negative integer.' }) + '</p>'; return; }
    const u = zig ? (v >= 0n ? v * 2n : -v * 2n - 1n) : v, bin = u.toString(2), groups = [];
    for (let i = bin.length; i > 0; i -= 7) groups.unshift(bin.slice(Math.max(0, i - 7), i).padStart(7, '0'));
    const lo = groups.slice().reverse(), bytes = lo.map((g, i) => (i < lo.length - 1 ? '1' : '0') + g);
    $('#vi').innerHTML = (zig ? '<div class="vi-step"><span class="cv-l">zigzag</span><span class="mono">' + v + ' → ' + (v >= 0n ? '2 × ' + v : '−2 × ' + v + ' − 1') + ' = <b>' + u + '</b></span></div>' : '') +
      '<div class="vi-step"><span class="cv-l">' + t({ tr: 'ikili, 7’li gruplar', en: 'binary, groups of 7' }) + '</span><div class="cv-g">' + groups.map((g, i) => '<span class="vg' + ((groups.length - 1 - i) % 4) + '"><i>' + g + '</i></span>').join('') + '</div></div>' +
      '<div class="vi-step"><span class="cv-l">' + t({ tr: 'byte’lar (küçük grup önce, devam biti eklendi)', en: 'bytes (low group first, continuation bit added)' }) + '</span><div class="cv-g">' + bytes.map((b, i) => '<span class="vg' + (i % 4) + '"><i><u class="' + (b[0] === '1' ? 'on' : '') + '">' + b[0] + '</u>' + b.slice(1) + '</i><b>' + hx(parseInt(b, 2)) + '</b></span>').join('') + '</div></div>' +
      '<p class="tell">' + t({ tr: 'Varint: <b>' + bytes.length + ' byte</b> · sabit int32: 4 byte · int64: 8 byte', en: 'Varint: <b>' + bytes.length + ' byte(s)</b> · fixed int32: 4 bytes · int64: 8 bytes' }) + '</p>';
  }
  $('#vi-in').addEventListener('input', drawVi);
  drawVi();

  /* ---------- Şekil 6: Base64 ---------- */
  const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  function b64(bytes) { let o = ''; for (let i = 0; i < bytes.length; i += 3) { const n = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8) | (bytes[i + 2] || 0), k = Math.min(3, bytes.length - i); o += B64[n >> 18 & 63] + B64[n >> 12 & 63] + (k > 1 ? B64[n >> 6 & 63] : '=') + (k > 2 ? B64[n & 63] : '='); } return o; }
  function drawB64() {
    const all = Array.from(enc.encode($('#b64-in').value)), b = all.slice(0, 9), bits = b.map((x) => pad(x.toString(2), 8)).join(''), out = b64(all);
    const padTo = Math.ceil(bits.length / 24) * 24;
    let top = b.map((x, i) => '<span class="by c' + (i % 3) + '"><b>' + esc(x >= 32 && x < 127 ? String.fromCharCode(x) : '·') + '</b><i>' + pad(x.toString(2), 8) + '</i><small>' + hx(x) + '</small></span>').join('');
    let bot = '';
    for (let i = 0; i < padTo; i += 6) {
      if (i >= bits.length) { bot += '<span class="sx pad"><i>——</i><b>=</b></span>'; continue; }
      const g = bits.slice(i, i + 6).padEnd(6, '0');
      bot += '<span class="sx"><i>' + [...g].map((c, k) => { const pos = i + k; return pos < bits.length ? '<u class="c' + (Math.floor(pos / 8) % 3) + '">' + c + '</u>' : '<u class="z">' + c + '</u>'; }).join('') + '</i><b>' + B64[parseInt(g, 2)] + '</b><small>' + parseInt(g, 2) + '</small></span>';
    }
    $('#b64').innerHTML = '<div class="b64-row">' + top + '</div><div class="b64-row">' + bot + '</div>' +
      '<div class="cv-res"><span class="muted">Base64:</span> <b class="mono">' + esc(out) + '</b></div>' +
      '<p class="tell">' + fmt(all.length) + ' byte → ' + fmt(out.length) + t({ tr: ' karakter', en: ' characters' }) + (all.length > 9 ? ' · ' + t({ tr: '(şekilde ilk 9 byte)', en: '(first 9 bytes shown)' }) : '') + '</p>';
  }
  $('#b64-in').addEventListener('input', drawB64);
  drawB64();

  /* ---------- Şekil 7: eski kodlar ---------- */
  const ITA = { A: '00011', B: '11001', C: '01110', D: '01001', E: '00001', F: '01101', G: '11010', H: '10100', I: '00110', J: '01011', K: '01111', L: '10010', M: '11100', N: '01100', O: '11000', P: '10110', Q: '10111', R: '01010', S: '00101', T: '10000', U: '00111', V: '11110', W: '10011', X: '11101', Y: '10101', Z: '10001', ' ': '00100' };
  const ITAF = { 0: '10110', 1: '10111', 2: '10011', 3: '00001', 4: '01010', 5: '10000', 6: '10101', 7: '00111', 8: '00110', 9: '11000' };
  const MORSE = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.' };
  const ebc = (c) => { const k = c.charCodeAt(0); if (c === ' ') return 0x40; if (/[0-9]/.test(c)) return 0xf0 + (k - 48); if (/[A-I]/.test(c)) return 0xc1 + (k - 65); if (/[J-R]/.test(c)) return 0xd1 + (k - 74); if (/[S-Z]/.test(c)) return 0xe2 + (k - 83); return null; };
  function drawOld() {
    const s2 = $('#old-in').value.toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 16);
    let fig = false, itaBits = 0, h = '<table><thead><tr><th></th><th>ASCII</th><th>EBCDIC</th><th>Baudot (ITA2)</th><th>' + t({ tr: 'Mors', en: 'Morse' }) + '</th></tr></thead><tbody>';
    for (const c of s2) {
      const digit = /[0-9]/.test(c);
      let ita = '';
      if (digit && !fig) { ita += '<span class="sh">FIGS 11011</span> '; fig = true; itaBits += 5; }
      if (!digit && c !== ' ' && fig) { ita += '<span class="sh">LTRS 11111</span> '; fig = false; itaBits += 5; }
      ita += digit ? ITAF[c] : ITA[c]; itaBits += 5;
      h += '<tr><td class="m"><b>' + (c === ' ' ? '␣' : c) + '</b></td><td class="m">' + hx(c.charCodeAt(0)) + '</td><td class="m">' + hx(ebc(c)) + '</td><td class="m">' + ita + '</td><td class="m morse">' + (MORSE[c] || '/') + '</td></tr>';
    }
    $('#old').innerHTML = h + '</tbody></table>';
    $('#old-tell').innerHTML = t({ tr: 'Toplam: ASCII ' + s2.length * 7 + ' bit (7’şer), EBCDIC ' + s2.length * 8 + ' bit, Baudot ' + itaBits + ' bit (kaydırmalar dahil).', en: 'Total: ASCII ' + s2.length * 7 + ' bits (7 each), EBCDIC ' + s2.length * 8 + ' bits, Baudot ' + itaBits + ' bits (shifts included).' });
  }
  $('#old-in').addEventListener('input', drawOld);
  drawOld();

  /* ---------- Şekil 8: küçük float'lar ---------- */
  const rne = (q) => { const f = Math.floor(q), d = q - f; return d > 0.5 || (d === 0.5 && f % 2 === 1) ? f + 1 : f; };
  function quant(x, E, M, maxOverride) {
    if (Number.isNaN(x)) return { v: NaN };
    const bias = 2 ** (E - 1) - 1, emin = 1 - bias, maxv = maxOverride || (2 - 2 ** -M) * 2 ** (2 ** E - 2 - bias), s2 = x < 0 || Object.is(x, -0) ? 1 : 0, a = Math.abs(x);
    if (a === 0) return { v: s2 ? -0 : 0, s: s2, e: 0, m: 0, bias, maxv };
    if (!isFinite(a)) return { v: x, s: s2, inf: true, bias, maxv };
    const e = Math.max(Math.floor(Math.log2(a)), emin);
    let v = rne(a / 2 ** (e - M)) * 2 ** (e - M);
    if (v > maxv) return { v: maxOverride ? NaN : s2 ? -Infinity : Infinity, s: s2, over: true, bias, maxv };
    let ef, mf;
    if (v < 2 ** emin) { ef = 0; mf = Math.round(v / 2 ** (emin - M)); } else { const e2 = Math.floor(Math.log2(v)); ef = e2 + bias; mf = Math.round(v / 2 ** (e2 - M) - 2 ** M); }
    return { v: s2 ? -v : v, s: s2, e: ef, m: mf, bias, maxv };
  }
  const FMTS = [['float32', 8, 23], ['float16', 5, 10], ['bfloat16', 8, 7], ['FP8 E5M2', 5, 2], ['FP8 E4M3', 4, 3, 448]];
  const shortNum = (v) => { if (!isFinite(v) || Number.isNaN(v)) return Number.isNaN(v) ? 'NaN' : v > 0 ? '∞' : '−∞'; const a = Math.abs(v); return (a !== 0 && (a < 1e-4 || a >= 1e7) ? v.toExponential(6) : String(Number(v.toPrecision(10)))).replace('.', LANG === 'en' ? '.' : ','); };
  function drawSf() {
    const x = Number($('#sf-in').value.trim().replace(',', '.'));
    $('#sf-in').classList.toggle('bad', Number.isNaN(x));
    if (Number.isNaN(x)) return;
    let h = '<table><thead><tr><th>' + t({ tr: 'format', en: 'format' }) + '</th><th>' + t({ tr: 'saklanan değer', en: 'stored value' }) + '</th><th>' + t({ tr: 'bitler (s | e | m)', en: 'bits (s | e | m)' }) + '</th><th>' + t({ tr: 'bağıl hata', en: 'rel. error' }) + '</th></tr></thead><tbody>';
    for (const [nm, E, M, mx] of FMTS) {
      const q = quant(x, E, M, mx);
      const bits = q.over || q.inf || Number.isNaN(q.v) ? (q.over ? '<span class="bad">' + t({ tr: 'taşma', en: 'overflow' }) + ' (max ' + shortNum(q.maxv) + ')</span>' : '—') : '<span class="cs">' + q.s + '</span> <span class="ce">' + pad(q.e.toString(2), E) + '</span> <span class="cm">' + pad(q.m.toString(2), M) + '</span>';
      const err = x !== 0 && isFinite(q.v) ? Math.abs(q.v - x) / Math.abs(x) : null;
      h += '<tr><td><b>' + nm + '</b> <small class="muted">' + (1 + E + M) + ' bit</small></td><td class="m">' + shortNum(q.v) + '</td><td class="m sfb">' + bits + '</td><td class="m">' + (err == null ? '—' : err === 0 ? '0' : (err * 100).toPrecision(2).replace('.', LANG === 'en' ? '.' : ',') + ' %') + '</td></tr>';
    }
    $('#sf').innerHTML = h + '</tbody></table>';
  }
  $('#sf-in').addEventListener('input', drawSf);
  ['3.14159', '0.1', '1000', '100000', '0.0001', '65504', '-2.5'].forEach((v) => $('#sf-pre').append(el('button', { type: 'button', class: 'chip', text: LANG === 'en' ? v : v.replace('.', ','), onclick: () => { $('#sf-in').value = v; drawSf(); } })));
  drawSf();

  /* ---------- Şekil 9: RGB565 ---------- */
  function draw565() {
    const h = $('#c565-in').value, r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16);
    const r5 = Math.round(r * 31 / 255), g6 = Math.round(g * 63 / 255), b5 = Math.round(b * 31 / 255), v = (r5 << 11) | (g6 << 5) | b5;
    const R = Math.round(r5 * 255 / 31), G = Math.round(g6 * 255 / 63), B = Math.round(b5 * 255 / 31), back = '#' + [R, G, B].map((x) => hx(x)).join('');
    $('#c565-hex').textContent = h.toUpperCase();
    $('#c565').innerHTML = '<div class="c565-bits"><span class="r">' + pad(r5.toString(2), 5) + '</span><span class="g">' + pad(g6.toString(2), 6) + '</span><span class="bl">' + pad(b5.toString(2), 5) + '</span></div>' +
      '<div class="c565-lbl"><span>R ' + r + ' → ' + r5 + '/31</span><span>G ' + g + ' → ' + g6 + '/63</span><span>B ' + b + ' → ' + b5 + '/31</span></div>' +
      '<div class="c565-sw"><div><span class="rgb-sw" style="background:' + h + '"></span><small>24 bit ' + h.toUpperCase() + '</small></div><div class="fa-ar">→</div><div><b class="h">0x' + hx(v, 4) + '</b><small>16 bit</small></div><div class="fa-ar">→</div><div><span class="rgb-sw" style="background:' + back + '"></span><small>' + back.toUpperCase() + '</small></div></div>';
  }
  $('#c565-in').addEventListener('input', draw565);
  draw565();

  /* ---------- Şekil 10: zaman ---------- */
  function drawTm() {
    const ms = Date.now(), s2 = Math.floor(ms / 1000), ft = (BigInt(ms) + 11644473600000n) * 10000n, xl = ms / 86400000 + 25569;
    const row = (n, v, note) => '<tr><td>' + n + '</td><td class="m">' + v + '</td><td>' + note + '</td></tr>';
    $('#tm').innerHTML = '<table><tbody>' +
      row('Unix', fmt(s2), t({ tr: '1970’ten beri saniye · 32 bit hex: ', en: 'seconds since 1970 · 32-bit hex: ' }) + '<span class="h">0x' + hx(s2 >>> 0, 8) + '</span>') +
      row('JavaScript', fmt(ms), t({ tr: '1970’ten beri milisaniye (<code>Date.now()</code>)', en: 'milliseconds since 1970 (<code>Date.now()</code>)' })) +
      row('Windows FILETIME', group(ft.toString(), 3, LANG === 'en' ? ',' : '.'), t({ tr: '1601’den beri 100 ns aralıkları', en: '100 ns intervals since 1601' })) +
      row('Excel', xl.toFixed(5).replace('.', LANG === 'en' ? '.' : ','), t({ tr: '30.12.1899’dan beri gün', en: 'days since 30 Dec 1899' })) +
      row('ISO 8601', new Date(ms).toISOString(), t({ tr: 'metin: insanlar ve sıralama için', en: 'text: for people and sorting' })) + '</tbody></table>';
  }
  drawTm(); setInterval(drawTm, 1000);

  /* ---------- alıştırma ---------- */
  function bcdQ() { const n = rand(10, 99); return { q: t({ tr: 'Onlu ' + n + ' sayısının BCD gösterimi (8 bit)?', en: 'The BCD form of decimal ' + n + ' (8 bits)?' }), a: String(n).split('').map((d) => pad((+d).toString(2), 4)).join(''), kind: 'bits', ph: '8 bit', hint: t({ tr: 'Her basamağı ayrı ayrı 4 bitle yaz.', en: 'Write each digit separately in 4 bits.' }), explain: String(n).split('').map((d) => d + ' = ' + pad((+d).toString(2), 4)).join(', ') }; }
  function grayQ() { const n = rand(1, 31); return { q: t({ tr: n + ' sayısının 5 bitlik Gray kodu?', en: 'The 5-bit Gray code of ' + n + '?' }), a: pad(gray(n).toString(2), 5), kind: 'bits', ph: '5 bit', hint: 'n ^ (n >> 1)', explain: pad(n.toString(2), 5) + ' ⊕ ' + pad((n >> 1).toString(2), 5) + ' = <b class="b">' + pad(gray(n).toString(2), 5) + '</b>' }; }
  function parQ() { const v = rand(1, 127), p = popc(v) % 2; return { q: t({ tr: '7 bitlik <span class="b">' + pad(v.toString(2), 7) + '</span> için <b>çift</b> parite biti?', en: 'The <b>even</b> parity bit for the 7 bits <span class="b">' + pad(v.toString(2), 7) + '</span>?' }), a: String(p), kind: 'dec', hint: t({ tr: '1’leri say; tekse 1 ekle.', en: 'Count the 1s; if odd, add a 1.' }), explain: popc(v) + t({ tr: ' tane 1 → parite ', en: ' ones → parity ' }) + '<b>' + p + '</b>' }; }
  function b64Q() { const n = rand(1, 40); return { q: t({ tr: n + ' byte veri Base64 ile kaç karakter olur?', en: 'How many characters is ' + n + ' bytes in Base64?' }), a: String(4 * Math.ceil(n / 3)), kind: 'dec', hint: t({ tr: 'Her 3 byte → 4 karakter; eksik grup dolgulanır.', en: 'Every 3 bytes → 4 characters; a partial group is padded.' }), explain: '4 × ⌈' + n + '/3⌉ = <b>' + 4 * Math.ceil(n / 3) + '</b>' }; }
  function viQ() { const n = pick([5, 100, 127, 128, 300, 16383, 16384, 70000, 2097151, 3000000]); const k = Math.max(1, Math.ceil(n.toString(2).length / 7)); return { q: t({ tr: fmt(n) + ' sayısı varint olarak kaç byte tutar?', en: 'How many bytes does ' + fmt(n) + ' take as a varint?' }), a: String(k), kind: 'dec', hint: t({ tr: 'Bit sayısını 7’ye böl, yukarı yuvarla.', en: 'Divide the bit count by 7, round up.' }), explain: n.toString(2).length + ' bit → ⌈' + n.toString(2).length + '/7⌉ = <b>' + k + '</b>' }; }
  function hamQ() { const d = Array.from({ length: 4 }, () => rand(0, 1)), c = encodeH(d).join(''); return { q: t({ tr: 'Veri <span class="b">' + d.join('') + '</span> (d1 d2 d3 d4) için Hamming(7,4) kod sözcüğü? (p1 p2 d1 p4 d2 d3 d4)', en: 'The Hamming(7,4) codeword for data <span class="b">' + d.join('') + '</span> (d1 d2 d3 d4)? (p1 p2 d1 p4 d2 d3 d4)' }), a: c, kind: 'bits', ph: '7 bit', hint: 'p1 = d1⊕d2⊕d4 · p2 = d1⊕d3⊕d4 · p4 = d2⊕d3⊕d4', explain: '<b class="b">' + c + '</b>' }; }
  tryIt($('#try'), [
    { label: 'BCD', fn: bcdQ },
    { label: 'Gray', fn: grayQ },
    { label: t({ tr: 'Parite', en: 'Parity' }), fn: parQ },
    { label: 'Hamming', fn: hamQ },
    { label: 'Base64', fn: b64Q },
    { label: 'Varint', fn: viQ },
  ]);
})();
