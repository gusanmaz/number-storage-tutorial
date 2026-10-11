/* Bölüm 10 — Bellek */
(function () {
  const { t, $, $$, el, esc, fmt, pad, toBase, knob, out, steps, tryIt, rand, pick } = NS;
  const sub = (b) => '<span class="sub">' + b + '</span>';
  const hx = (b) => pad(toBase(b, 16), 2);
  const asc = (b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : '.');

  /* ---------- Şekil 1: bellek şeridi ---------- */
  const BASE = 0x7ffe3a10;
  const stripBytes = Array.from(new TextEncoder().encode(t({ tr: 'Bellek, numaralı byte şeridi.', en: 'Memory: one long strip.' }))).concat([0, 0x2a, 0, 0, 0, 0xff, 0x10]).slice(0, 32);
  while (stripBytes.length < 32) stripBytes.push(0);
  let sp = 12;
  function drawStrip() {
    $('#strip').innerHTML = stripBytes.map((b, i) => { const a = BASE + i; return '<button type="button" class="sc' + (i === sp ? ' sel' : '') + ((a & 15) === 0 ? ' row0' : '') + '" data-i="' + i + '"><b>' + hx(b) + '</b><small>…' + toBase(a, 16).slice(-2) + '</small></button>'; }).join('');
    const a = BASE + sp, b = stripBytes[sp];
    $('#strip-out').innerHTML = t({ tr: 'Adres', en: 'Address' }) + ' <b class="h">0x' + toBase(a, 16) + '</b> = <span class="d">' + fmt(a) + '</span> · ' + t({ tr: 'içerik', en: 'contents' }) + ' <b class="h">' + hx(b) + '</b> = ' + b + (b >= 32 && b < 127 ? " = '" + esc(String.fromCharCode(b)) + "'" : '');
  }
  $('#strip').addEventListener('click', (e) => { const c = e.target.closest('.sc'); if (c) { sp = +c.dataset.i; drawStrip(); } });
  drawStrip();
  const U = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB'];
  const drawAddr = (n) => out(null, 'addr', '2<sup>' + n + '</sup> = <b>' + fmt(2 ** (n % 10)) + ' ' + U[Math.floor(n / 10)] + '</b>');
  knob($('#k-ab'), { value: 32, min: 8, max: 64, onChange: drawAddr });
  drawAddr(32);

  /* ---------- Şekil 2: aynı byte'lar, farklı türler ---------- */
  let lb = [0x4d, 0x65, 0x72, 0x68, 0x61, 0x62, 0x61, 0x21];
  const inputs = lb.map((b, i) => {
    const inp = el('input', { class: 'inp hexb', value: hx(b), maxlength: '2', spellcheck: 'false', 'aria-label': 'byte ' + i });
    inp.addEventListener('input', () => { const v = inp.value.trim(); if (/^[0-9a-f]{1,2}$/i.test(v)) { lb[i] = parseInt(v, 16); inp.classList.remove('bad'); drawLens(); } else inp.classList.add('bad'); });
    inp.addEventListener('focus', () => inp.select());
    return inp;
  });
  $('#lens-bytes').append(...inputs.map((inp, i) => el('label', { class: 'hexcell' }, [inp, el('small', { text: '+' + i })])));
  const setBytes = (arr) => { lb = arr.slice(); inputs.forEach((inp, i) => { inp.value = hx(lb[i]); inp.classList.remove('bad'); }); drawLens(); };
  const fromDV = (f) => { const dv = new DataView(new ArrayBuffer(8)); f(dv); return Array.from(new Uint8Array(dv.buffer)); };
  [
    ['"Merhaba!"', () => Array.from(new TextEncoder().encode('Merhaba!'))],
    ['3.14159 (double)', () => fromDV((d) => d.setFloat64(0, 3.14159, true))],
    ['1.0, 2.0 (float)', () => fromDV((d) => { d.setFloat32(0, 1, true); d.setFloat32(4, 2, true); })],
    ['1, −1 (int32)', () => fromDV((d) => { d.setInt32(0, 1, true); d.setInt32(4, -1, true); })],
    ['FF × 8', () => Array(8).fill(255)],
    ['00 × 8', () => Array(8).fill(0)],
  ].forEach(([l, f]) => $('#lens-pre').append(el('button', { type: 'button', class: 'chip', text: l, onclick: () => setBytes(f()) })));
  const num = (v) => { if (typeof v === 'bigint') return v.toString(); if (Number.isNaN(v)) return 'NaN'; if (!isFinite(v)) return v > 0 ? '∞' : '−∞'; if (Number.isInteger(v)) return String(v); const a = Math.abs(v); return a !== 0 && (a < 1e-4 || a >= 1e9) ? v.toExponential(4) : String(Number(v.toPrecision(7))); };
  function drawLens() {
    const dv = new DataView(new Uint8Array(lb).buffer);
    const R = (k, size, fn) => Array.from({ length: 8 / size }, (_, i) => num(fn(i * size)));
    const rows = [
      ['uint8', 1, R(0, 1, (o) => dv.getUint8(o)), 'b'],
      ['int8', 1, R(0, 1, (o) => dv.getInt8(o)), 'b'],
      ['uint16 LE', 2, R(0, 2, (o) => dv.getUint16(o, true))],
      ['int16 LE', 2, R(0, 2, (o) => dv.getInt16(o, true))],
      ['int32 LE', 4, R(0, 4, (o) => dv.getInt32(o, true))],
      ['int32 BE', 4, R(0, 4, (o) => dv.getInt32(o, false))],
      ['float32 LE', 4, R(0, 4, (o) => dv.getFloat32(o, true))],
      ['float64 LE', 8, [num(dv.getFloat64(0, true))]],
      ['uint64 LE', 8, [dv.getBigUint64(0, true).toString()]],
      ['ASCII', 1, lb.map((b) => (b >= 32 && b < 127 ? esc(String.fromCharCode(b)) : '<span class="muted">·</span>'))],
    ];
    $('#lens-out').innerHTML = '<table><tbody>' + rows.map(([n, size, vals]) => '<tr><td class="ln">' + n + '</td><td><div class="lv" style="grid-template-columns:repeat(' + 8 / size + ',1fr)">' + vals.map((v) => '<span>' + v + '</span>').join('') + '</div></td></tr>').join('') + '</tbody></table>';
  }
  drawLens();

  /* ---------- Şekil 3: endianness ---------- */
  function drawEnd() {
    const raw = $('#end-in').value.trim();
    const ok = /^[0-9a-f]{1,8}$/i.test(raw);
    $('#end-in').classList.toggle('bad', !ok);
    if (!ok) return;
    const v = parseInt(raw, 16) >>> 0, bytes = [24, 16, 8, 0].map((s) => (v >>> s) & 255);
    $('#end-dec').textContent = '= ' + fmt(v);
    const row = (lbl, arr, note) => '<div class="en-row"><div class="en-l"><b>' + lbl + '</b><small>' + note + '</small></div><div class="en-cells">' + arr.map((b, i) => '<div class="enc w' + bytes.indexOf(b) + '"><b>' + hx(b) + '</b><small>0x' + toBase(0x100 + i, 16) + '</small></div>').join('') + '</div></div>';
    const uniq = new Set(bytes).size === 4;
    $('#endian').innerHTML = '<div class="en-num">' + bytes.map((b, i) => '<span class="w' + i + '">' + hx(b) + '</span>').join('') + '<small>' + t({ tr: 'en anlamlı → en anlamsız', en: 'most → least significant' }) + '</small></div>' +
      row('Big endian', bytes, t({ tr: 'ağ, PNG, Java', en: 'network, PNG, Java' })) +
      row('Little endian', bytes.slice().reverse(), t({ tr: 'x86, ARM, BMP, WAV', en: 'x86, ARM, BMP, WAV' })) +
      (uniq ? '' : '<p class="tell muted">' + t({ tr: 'Aynı byte’tan birkaç tane var; renkler ilk eşleşmeye göre.', en: 'Some bytes repeat; colors follow the first match.' }) + '</p>');
  }
  $('#end-in').addEventListener('input', drawEnd);
  drawEnd();

  /* ---------- Şekil 4: program ve bellek ---------- */
  const B = 0x1000;
  const AR = t({ tr: 'dizi', en: 'arr' }), L = (x) => x.replace(/dizi/g, AR);
  const CODE = [
    'int a = 5;',
    'short b = -2;',
    "char c = 'A';",
    'int dizi[3] = {10, 20, 30};',
    'int *p = &dizi[1];',
    '*p = 99;',
    'p = p + 1;',
    '*p = *p + 1;',
    'a = dizi[0] + *p;',
  ].map(L);
  const VARS = { a: [0, 4, 'v0'], b: [4, 2, 'v1'], c: [6, 1, 'v2'], dizi: [8, 12, 'v3'], p: [24, 8, 'v4'] };
  const PADS = [7, 20, 21, 22, 23];
  function stateAt(k) {
    const m = Array(32).fill(null), live = {};
    const w = (off, size, val) => { let x = BigInt.asUintN(size * 8, BigInt(val)); for (let i = 0; i < size; i++) { m[off + i] = Number(x & 255n); x >>= 8n; } };
    const r32 = (off) => { let v = 0; for (let i = 3; i >= 0; i--) v = v * 256 + m[off + i]; return v | 0; };
    let p = 0, msg = t({ tr: 'Program başlamadı. Bellekte önceki programlardan kalan rastgele byte’lar var (?).', en: 'The program has not started. Memory holds leftover random bytes (?).' });
    const S = [
      () => { w(0, 4, 5); live.a = 1; msg = t({ tr: '<b>a</b> için 4 byte ayrıldı (0x1000–0x1003). 5 little endian yazıldı: 05 00 00 00.', en: '4 bytes reserved for <b>a</b> (0x1000–0x1003). 5 written little endian: 05 00 00 00.' }); },
      () => { w(4, 2, -2); live.b = 1; msg = t({ tr: '<b>b</b> bir short: 2 byte. −2, ikiye tümleyende FFFE; little endian: FE FF.', en: '<b>b</b> is a short: 2 bytes. −2 in two’s complement is FFFE; little endian: FE FF.' }); },
      () => { w(6, 1, 65); live.c = 1; msg = t({ tr: "<b>c</b> tek byte: 'A' = 0x41. Ardından gelen byte boş bırakıldı (hizalama).", en: "<b>c</b> is one byte: 'A' = 0x41. The next byte is left empty (alignment)." }); },
      () => { w(8, 4, 10); w(12, 4, 20); w(16, 4, 30); live.dizi = 1; msg = t({ tr: '<b>dizi</b>: 3 × 4 = 12 byte, arka arkaya. dizi[i] = 0x1008 + i × 4.', en: '<b>dizi</b>: 3 × 4 = 12 bytes, back to back. dizi[i] = 0x1008 + i × 4.' }); },
      () => { p = B + 12; w(24, 8, p); live.p = 1; msg = t({ tr: '<b>p</b> bir pointer: değeri dizi[1]’in adresi, 0x100C. 64 bitlik sistemde 8 byte tutar.', en: '<b>p</b> is a pointer: its value is the address of dizi[1], 0x100C. On a 64-bit system it takes 8 bytes.' }); },
      () => { p = B + 12; w(12, 4, 99); msg = t({ tr: '<b>*p = 99</b>: p’nin gösterdiği adrese (0x100C) 99 yazıldı. dizi[1] artık 99; dizi’ye hiç dokunmadık!', en: '<b>*p = 99</b>: 99 written to the address p points to (0x100C). dizi[1] is now 99; we never touched dizi by name!' }); },
      () => { p = B + 16; w(24, 8, p); msg = t({ tr: '<b>p + 1</b>: adres 1 değil, sizeof(int) = 4 arttı: 0x1010, yani dizi[2].', en: '<b>p + 1</b>: the address grew by sizeof(int) = 4, not 1: 0x1010, i.e. dizi[2].' }); },
      () => { p = B + 16; w(16, 4, r32(16) + 1); msg = t({ tr: '<b>*p = *p + 1</b>: 0x1010’daki değer okundu (30), 1 eklenip geri yazıldı: 31.', en: '<b>*p = *p + 1</b>: the value at 0x1010 was read (30), incremented and written back: 31.' }); },
      () => { p = B + 16; w(0, 4, r32(8) + r32(16)); msg = t({ tr: '<b>a</b> = 10 + 31 = 41 = 0x29. Program bitti.', en: '<b>a</b> = 10 + 31 = 41 = 0x29. Done.' }); },
    ];
    for (let i = 0; i < k; i++) S[i]();
    return { m, live, p: k >= 5 ? p : null, msg };
  }
  function drawProg(k) {
    $('#prog-code').innerHTML = CODE.map((l, i) => '<span class="pl' + (i === k - 1 ? ' cur' : i < k - 1 ? ' done' : '') + '">' + esc(l) + '</span>').join('\n');
    const st = stateAt(k), owner = Array(32).fill(null);
    Object.entries(VARS).forEach(([n, [o, s, c]]) => { if (st.live[n]) for (let i = 0; i < s; i++) owner[o + i] = [n, c, i === 0]; });
    const tgt = st.p != null ? st.p - B : -1;
    let h = '';
    for (let r = 0; r < 2; r++) {
      h += '<div class="pm-row"><span class="pm-a">0x' + toBase(B + r * 16, 16) + '</span>';
      for (let i = r * 16; i < r * 16 + 16; i++) {
        const o = owner[i], pd = PADS.includes(i) && st.live[i < 8 ? 'c' : 'dizi'] && (i === 7 || st.live.p);
        h += '<span class="pm' + (o ? ' ' + o[1] : pd ? ' pad' : '') + (i >= tgt && i < tgt + 4 && tgt >= 0 ? ' tgt' : '') + '">' + (o ? hx(st.m[i]) : pd ? '··' : '<span class="muted">?' + '</span>') + (o && o[2] ? '<small>' + L(o[0]) + '</small>' : '') + '</span>';
      }
      h += '</div>';
    }
    $('#prog-mem').innerHTML = h + (st.p != null ? '<div class="pm-note">p = <b class="h">0x' + toBase(st.p, 16) + '</b> → *p = <b>' + (st.m.slice(tgt, tgt + 4).reduceRight((a, b) => a * 256 + b, 0) | 0) + '</b></div>' : '');
    $('#prog-tell').innerHTML = L(st.msg);
  }
  steps($('#prog-steps'), { count: CODE.length + 1, render: drawProg, nextLabel: t({ tr: 'Satırı çalıştır →', en: 'Run line →' }) });

  /* ---------- Şekil 5: hex görüntüleyici ---------- */
  const b64 = (s) => Array.from(atob(s), (c) => c.charCodeAt(0));
  function wav() {
    const n = 24, dv = new DataView(new ArrayBuffer(44 + n * 2)), str = (o, s) => [...s].forEach((c, i) => dv.setUint8(o + i, c.charCodeAt(0)));
    str(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); str(8, 'WAVE'); str(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
    dv.setUint32(24, 44100, true); dv.setUint32(28, 88200, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); str(36, 'data'); dv.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) dv.setInt16(44 + i * 2, Math.round(Math.sin(i / n * 2 * Math.PI) * 12000), true);
    return Array.from(new Uint8Array(dv.buffer));
  }
  function bmp() {
    const dv = new DataView(new ArrayBuffer(70)), px = [[0, 0, 255], [0, 255, 0], [255, 0, 0], [255, 255, 255]];
    dv.setUint8(0, 0x42); dv.setUint8(1, 0x4d); dv.setUint32(2, 70, true); dv.setUint32(10, 54, true); dv.setUint32(14, 40, true); dv.setInt32(18, 2, true); dv.setInt32(22, 2, true);
    dv.setUint16(26, 1, true); dv.setUint16(28, 24, true); dv.setUint32(34, 16, true);
    px.forEach((c, i) => { const o = 54 + Math.floor(i / 2) * 8 + (i % 2) * 3; c.forEach((v, k) => dv.setUint8(o + k, v)); });
    return Array.from(new Uint8Array(dv.buffer));
  }
  const SAMPLES = [
    [t({ tr: 'Metin', en: 'Text' }), () => Array.from(new TextEncoder().encode(t({ tr: 'Merhaba dünya!\nİkinci satır: ğüşıöç\n', en: 'Hello world!\nSecond line: café, naïve\n' })))],
    ['PNG 1×1', () => b64('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==')],
    ['BMP 2×2', bmp],
    ['WAV', wav],
  ];
  const SIGS = [
    [[0x89, 0x50, 0x4e, 0x47], 'PNG'], [[0xff, 0xd8, 0xff], 'JPEG'], [[0x47, 0x49, 0x46, 0x38], 'GIF'], [[0x25, 0x50, 0x44, 0x46], 'PDF'],
    [[0x50, 0x4b, 0x03, 0x04], 'ZIP / docx / xlsx'], [[0x52, 0x49, 0x46, 0x46], 'RIFF (WAV / AVI / WebP)'], [[0x7f, 0x45, 0x4c, 0x46], 'ELF'], [[0x4d, 0x5a], 'Windows EXE'],
    [[0x42, 0x4d], 'BMP'], [[0x49, 0x44, 0x33], 'MP3 (ID3)'], [[0x1f, 0x8b], 'gzip'], [[0x25, 0x21], 'PostScript'], [[0xef, 0xbb, 0xbf], t({ tr: 'UTF-8 metin (BOM ile)', en: 'UTF-8 text (with BOM)' })],
  ];
  let data = [], shown = 256, fname = '';
  function drawHex() {
    const sig = SIGS.find(([s]) => s.every((b, i) => data[i] === b));
    const sl = sig ? sig[0].length : 0;
    const textish = !sig && data.length && data.slice(0, 256).every((b) => b === 9 || b === 10 || b === 13 || b >= 32);
    $('#hex-sig').innerHTML = '<b>' + esc(fname) + '</b> · ' + fmt(data.length) + ' byte · ' + (sig ? t({ tr: 'İmza: ', en: 'Signature: ' }) + '<b class="good">' + esc(sig[1]) + '</b>' : textish ? t({ tr: 'İmza yok; byte’lar metne benziyor.', en: 'No signature; the bytes look like text.' }) : t({ tr: 'Bilinen bir imza bulunamadı.', en: 'No known signature found.' }));
    let h = '';
    for (let o = 0; o < Math.min(data.length, shown); o += 16) {
      const row = data.slice(o, o + 16);
      h += '<div class="hd"><span class="hd-o">' + pad(toBase(o, 16), 8) + '</span><span class="hd-h">' + row.map((b, i) => '<i class="' + (o + i < sl ? 'sig' : b === 0 ? 'z' : '') + '">' + hx(b) + '</i>').join('') + '</span><span class="hd-a">' + row.map((b, i) => '<i class="' + (o + i < sl ? 'sig' : '') + '">' + esc(asc(b)) + '</i>').join('') + '</span></div>';
    }
    if (data.length > shown) h += '<div class="center" style="margin-top:.6rem"><button type="button" class="btn sm" id="hex-more">' + t({ tr: '+512 byte daha göster', en: 'Show 512 more bytes' }) + '</button></div>';
    $('#hexdump').innerHTML = h;
    const more = $('#hex-more'); if (more) more.onclick = () => { shown += 512; drawHex(); };
  }
  const load = (name, bytes) => { fname = name; data = bytes; shown = 256; drawHex(); };
  const ctl = $('#hex-ctl');
  const sbtns = SAMPLES.map(([l, f], i) => el('button', { type: 'button', class: 'chip', 'aria-pressed': String(i === 1), text: l, onclick: (e) => { sbtns.forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget))); load(l, f()); } }));
  ctl.append(...sbtns);
  const file = el('input', { type: 'file', class: 'sr-file', id: 'hex-file' });
  file.addEventListener('change', () => {
    const f = file.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { sbtns.forEach((b) => b.setAttribute('aria-pressed', 'false')); load(f.name, Array.from(new Uint8Array(r.result.slice(0, 1 << 20)))); if (f.size > 1 << 20) fname += ' (' + t({ tr: 'ilk 1 MiB', en: 'first 1 MiB' }) + ')'; drawHex(); };
    r.readAsArrayBuffer(f);
  });
  ctl.append(el('label', { class: 'btn sm fill', for: 'hex-file', text: t({ tr: 'Dosya aç…', en: 'Open a file…' }) }), file);
  load(SAMPLES[1][0], SAMPLES[1][1]());

  /* ---------- alıştırma ---------- */
  function endianQ() {
    const v = rand(0x10000000, 0xffffffff) >>> 0, bytes = [24, 16, 8, 0].map((s) => (v >>> s) & 255), little = Math.random() < 0.6, k = rand(0, 3);
    const order = little ? bytes.slice().reverse() : bytes;
    return { q: t({ tr: (little ? 'Little' : 'Big') + ' endian bir makinede <span class="h">0x' + pad(toBase(v, 16), 8) + '</span>, adres 0x200’den itibaren yazılıyor. <b>0x20' + k + '</b> adresindeki byte (hex)?', en: 'On a ' + (little ? 'little' : 'big') + ' endian machine <span class="h">0x' + pad(toBase(v, 16), 8) + '</span> is stored from address 0x200. The byte at <b>0x20' + k + '</b> (hex)?' }), a: hx(order[k]), kind: 'hex', hint: little ? t({ tr: 'Küçük uç önce: en sağdaki byte 0x200’e.', en: 'Little end first: the rightmost byte goes to 0x200.' }) : t({ tr: 'Büyük uç önce: yazdığın sırayla.', en: 'Big end first: in reading order.' }), explain: order.map((b, i) => '0x20' + i + ': ' + (i === k ? '<b>' + hx(b) + '</b>' : hx(b))).join(' · ') };
  }
  function arrQ() {
    const base = pick([0x1000, 0x2000, 0x4000, 0x8000]), sz = pick([1, 2, 4, 8]), i = rand(1, 9), tn = { 1: 'char', 2: 'short', 4: 'int', 8: 'double' }[sz], a = base + i * sz;
    return { q: t({ tr: '<code>' + tn + '</code> (' + sz + ' byte) dizisi <span class="h">0x' + toBase(base, 16) + '</span>’da başlıyor. <code>dizi[' + i + ']</code> hangi adreste (hex)?', en: 'A <code>' + tn + '</code> (' + sz + '-byte) array starts at <span class="h">0x' + toBase(base, 16) + '</span>. Where is <code>dizi[' + i + ']</code> (hex)?' }), a: toBase(a, 16), kind: 'hex', hint: t({ tr: 'başlangıç + i × boyut', en: 'start + i × size' }), explain: '0x' + toBase(base, 16) + ' + ' + i + ' × ' + sz + ' = 0x' + toBase(base, 16) + ' + ' + i * sz + ' = <b class="h">0x' + toBase(a, 16) + '</b>' };
  }
  function addrQ() {
    const n = pick([8, 10, 12, 16, 20, 24, 32]);
    return { q: t({ tr: n + ' bitlik adreslerle kaç farklı byte adreslenebilir?', en: 'How many different bytes can ' + n + '-bit addresses reach?' }), a: String(2 ** n), kind: 'dec', hint: '2ⁿ', explain: '2<sup>' + n + '</sup> = <b>' + fmt(2 ** n) + '</b> = ' + fmt(2 ** (n % 10)) + ' ' + U[Math.floor(n / 10)] };
  }
  /* ---------- tek bir bite erişmek ---------- */
  const mem8 = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
  let bitK = 13, lastOpB = null;
  function drawBits() {
    const byte = bitK >> 3, bit = bitK & 7, mask = 1 << bit, v = mem8[byte];
    let h = '<div class="bm-row">';
    for (let i = 0; i < 8; i++) {
      h += '<div class="bm-byte' + (i === byte ? ' cur' : '') + '"><div class="bm-bits">' + Array.from({ length: 8 }, (_, k) => { const bb = 7 - k, idx = i * 8 + bb; return '<button type="button" class="bm-b' + ((mem8[i] >> bb) & 1 ? ' on' : '') + (idx === bitK ? ' sel' : '') + '" data-k="' + idx + '" title="bit ' + idx + '"></button>'; }).join('') + '</div><small>' + t({ tr: 'adres ', en: 'addr ' }) + '0x' + toBase(0x40 + i, 16) + '</small><b class="h">' + pad(toBase(mem8[i], 16), 2) + '</b></div>';
    }
    h += '</div>';
    const b8s = (x) => pad(x.toString(2), 8);
    h += '<div class="bm-calc mono"><div>' + t({ tr: 'bit ', en: 'bit ' }) + bitK + ' → ' + t({ tr: 'byte ', en: 'byte ' }) + '<b>' + bitK + ' >> 3 = ' + byte + '</b> (0x' + toBase(0x40 + byte, 16) + '), ' + t({ tr: 'byte içinde bit ', en: 'bit within byte ' }) + '<b>' + bitK + ' & 7 = ' + bit + '</b></div>' +
      '<div>' + t({ tr: 'maske', en: 'mask' }) + ' = 1 << ' + bit + ' = <span class="b">' + b8s(mask) + '</span> = 0x' + pad(toBase(mask, 16), 2) + '</div>' +
      (lastOpB ? '<div class="bm-op">' + lastOpB + '</div>' : '') + '</div>';
    $('#bm').innerHTML = h;
  }
  const doBit = (kind) => {
    const byte = bitK >> 3, bit = bitK & 7, mask = 1 << bit, old = mem8[byte], b8s = (x) => pad(x.toString(2), 8);
    let nv = old, code, res = '';
    if (kind === 'set') { nv = old | mask; code = 'm[' + byte + '] |= ' + '0x' + pad(toBase(mask, 16), 2); }
    if (kind === 'clr') { nv = old & ~mask & 255; code = 'm[' + byte + '] &= ~0x' + pad(toBase(mask, 16), 2) + ' (= 0x' + pad(toBase(~mask & 255, 16), 2) + ')'; }
    if (kind === 'tog') { nv = old ^ mask; code = 'm[' + byte + '] ^= 0x' + pad(toBase(mask, 16), 2); }
    if (kind === 'tst') { code = '(m[' + byte + '] & 0x' + pad(toBase(mask, 16), 2) + ') != 0'; res = ' → <b>' + ((old & mask) ? 'true' : 'false') + '</b>'; }
    mem8[byte] = nv;
    lastOpB = '<code>' + esc(code) + '</code>' + res + (kind !== 'tst' ? ' · ' + t({ tr: 'oku ', en: 'read ' }) + '<span class="b">' + b8s(old) + '</span> → ' + t({ tr: 'değiştir → yaz ', en: 'modify → write ' }) + '<span class="b">' + b8s(nv) + '</span>' : '');
    drawBits();
  };
  $('#bm').addEventListener('click', (e) => { const b = e.target.closest('.bm-b'); if (b) { bitK = +b.dataset.k; lastOpB = null; drawBits(); kb.set(bitK); } });
  const kb = knob($('#k-bit'), { value: bitK, min: 0, max: 63, px: 8, onChange: (v) => { bitK = v; lastOpB = null; drawBits(); } });
  $('#bm-ctl').append(...[['set', { tr: 'Aç (OR)', en: 'Set (OR)' }], ['clr', { tr: 'Kapat (AND NOT)', en: 'Clear (AND NOT)' }], ['tog', { tr: 'Çevir (XOR)', en: 'Toggle (XOR)' }], ['tst', { tr: 'Oku (AND)', en: 'Test (AND)' }]].map(([k, l]) => el('button', { class: 'btn' + (k === 'set' ? ' fill' : ''), type: 'button', text: t(l), onclick: () => doBit(k) })));
  drawBits();

  /* ---------- hizalama ---------- */
  let AS = 4, AA = 6;
  const aseg = el('div', { class: 'seg', role: 'group' });
  [[1, 'char · 1'], [2, 'short · 2'], [4, 'int · 4'], [8, 'double · 8']].forEach(([k, l]) => aseg.append(el('button', { type: 'button', 'aria-pressed': String(k === AS), text: l, onclick: (e) => { AS = k; $$('button', aseg).forEach((x) => x.setAttribute('aria-pressed', String(x === e.currentTarget))); drawAl(); } })));
  $('#al-size').append(aseg);
  function drawAl() {
    const ok = (AA & (AS - 1)) === 0, w0 = AA >> 3, w1 = (AA + AS - 1) >> 3, cross = w0 !== w1;
    let h = '';
    for (let w = 0; w < 4; w++) {
      h += '<div class="al-row"><span class="al-l">word ' + w + '<small>0x' + pad(toBase(w * 8, 16), 2) + '</small></span>';
      for (let i = 0; i < 8; i++) { const a = w * 8 + i, inside = a >= AA && a < AA + AS; h += '<span class="al-c' + (inside ? (ok ? ' ok' : ' bad') : '') + (a % AS === 0 ? ' bd' : '') + '">' + pad(toBase(a, 16), 2) + '</span>'; }
      h += '</div>';
    }
    $('#al').innerHTML = h;
    const bin = pad(AA.toString(2), 5), low = Math.log2(AS);
    $('#al-tell').innerHTML = t({ tr: 'Adres ', en: 'Address ' }) + '<b>' + AA + '</b> = <span class="mono">' + bin.slice(0, 5 - low) + '<b class="' + (ok ? 'good' : 'bad') + '">' + bin.slice(5 - low) + '</b></span>' + sub(2) + ' · ' + AA + ' % ' + AS + ' = ' + AA % AS + ' → ' +
      (ok ? '<span class="good">' + t({ tr: 'hizalı', en: 'aligned' }) + '</span>' : '<span class="bad">' + t({ tr: 'hizasız', en: 'misaligned' }) + '</span>') + (cross ? ' · <span class="bad">' + t({ tr: 'iki word’e taşıyor: işlemci iki kez okumalı', en: 'spans two words: the CPU must read twice' }) + '</span>' : '') +
      (ok ? '' : ' · ' + t({ tr: 'bir sonraki hizalı adres: ', en: 'next aligned address: ' }) + '(' + AA + ' + ' + (AS - 1) + ') & ~' + (AS - 1) + ' = <b>' + ((AA + AS - 1) & ~(AS - 1)) + '</b>');
  }
  knob($('#k-al'), { value: AA, min: 0, max: 24, px: 10, onChange: (v) => { AA = v; drawAl(); } });
  drawAl();

  /* ---------- struct dolgusu ---------- */
  const TY = { char: 1, short: 2, int: 4, double: 8, 'char*': 8 };
  let fields = [['c', 'char'], ['d', 'double'], ['s', 'short'], ['i', 'int'], ['c2', 'char']];
  function layout(fs) { let off = 0, mx = 1; const out2 = []; fs.forEach(([n, ty]) => { const sz = TY[ty]; mx = Math.max(mx, sz); const padb = (sz - off % sz) % sz; if (padb) out2.push({ pad: padb, off }); off += padb; out2.push({ n, ty, sz, off }); off += sz; }); const tail = (mx - off % mx) % mx; if (tail) out2.push({ pad: tail, off, tail: true }); return { items: out2, size: off + tail, raw: fs.reduce((a, [, ty]) => a + TY[ty], 0), align: mx }; }
  function drawSt() {
    const L = layout(fields);
    $('#st-code').innerHTML = '<span class="tk-k">struct</span> S {\n' + fields.map(([n, ty], i) => '  <span class="tk-k">' + ty + '</span> ' + n + ';' + '<button type="button" class="st-up" data-i="' + i + '" aria-label="up"' + (i ? '' : ' disabled') + '>↑</button>').join('\n') + '\n};';
    let cells = '';
    L.items.forEach((it) => { for (let k = 0; k < (it.pad || it.sz); k++) cells += it.pad ? '<span class="st-c pad" title="padding"></span>' : '<span class="st-c f' + (fields.findIndex((f) => f[0] === it.n) % 5) + '">' + (k === 0 ? it.n : '') + '</span>'; });
    $('#st-map').innerHTML = cells;
    $('#st-tell').innerHTML = 'sizeof(S) = <b>' + L.size + '</b> byte · ' + t({ tr: 'alanların toplamı ', en: 'sum of fields ' }) + L.raw + ' · ' + t({ tr: 'dolgu ', en: 'padding ' }) + '<b class="' + (L.size - L.raw ? 'bad' : 'good') + '">' + (L.size - L.raw) + '</b> · ' + t({ tr: 'hizalama ', en: 'alignment ' }) + L.align;
  }
  $('#st-code').addEventListener('click', (e) => { const b = e.target.closest('.st-up'); if (!b) return; const i = +b.dataset.i; [fields[i - 1], fields[i]] = [fields[i], fields[i - 1]]; drawSt(); });
  $('#st-ctl').append(
    el('button', { class: 'btn', type: 'button', text: t({ tr: 'Büyükten küçüğe sırala', en: 'Sort largest first' }), onclick: () => { fields.sort((x, y) => TY[y[1]] - TY[x[1]]); drawSt(); } }),
    el('button', { class: 'btn ghost', type: 'button', text: t({ tr: 'Kötü sıra', en: 'Bad order' }), onclick: () => { fields = [['c', 'char'], ['d', 'double'], ['s', 'short'], ['i', 'int'], ['c2', 'char']]; drawSt(); } }),
  );
  drawSt();

  /* ---------- adresin bitleri ---------- */
  let amode = 'page';
  const AM = { page: [[20, { tr: 'sayfa numarası', en: 'page number' }, 'f1'], [12, { tr: 'sayfa içi ofset (4 KiB)', en: 'offset in page (4 KiB)' }, 'f2']], cache: [[20, 'tag', 'f3'], [6, { tr: 'küme (64 küme)', en: 'set (64 sets)' }, 'f4'], [6, { tr: 'satır içi ofset (64 B)', en: 'offset in line (64 B)' }, 'f2']], word: [[29, { tr: 'word numarası', en: 'word number' }, 'f1'], [3, { tr: 'word içi byte (8 B)', en: 'byte in word (8 B)' }, 'f2']] };
  const mseg = el('div', { class: 'seg', role: 'group' });
  [['page', { tr: 'Sanal bellek sayfası', en: 'Virtual memory page' }], ['cache', { tr: 'Önbellek', en: 'Cache' }], ['word', { tr: '64 bit word', en: '64-bit word' }]].forEach(([k, l]) => mseg.append(el('button', { type: 'button', 'aria-pressed': String(k === amode), text: t(l), onclick: (e) => { amode = k; $$('button', mseg).forEach((x) => x.setAttribute('aria-pressed', String(x === e.currentTarget))); drawAd(); } })));
  $('#ad-mode').append(mseg);
  function drawAd() {
    const raw = $('#ad-in').value.trim().replace(/^0x/i, '');
    const ok = /^[0-9a-f]{1,8}$/i.test(raw); $('#ad-in').classList.toggle('bad', !ok); if (!ok) return;
    const v = parseInt(raw, 16) >>> 0, bin = pad(v.toString(2), 32);
    let pos = 0, strip = '', legend = '';
    AM[amode].forEach(([w, l, cls]) => { const part = bin.slice(pos, pos + w), val = parseInt(part, 2); strip += '<span class="ad-f ' + cls + '">' + part.replace(/(.{4})(?=.)/g, '$1 ').trim() + '</span>'; legend += '<div class="ad-lg ' + cls + '"><small>' + esc(t(l)) + ' · ' + w + ' bit</small><b class="mono">0x' + toBase(val, 16) + ' = ' + fmt(val) + '</b><span class="mono">' + (pos ? '(a >> ' + (32 - pos - w) + ') & 0x' + toBase(2 ** w - 1, 16) : 'a >> ' + (32 - w)) + '</span></div>'; pos += w; });
    $('#ad').innerHTML = '<div class="ad-strip mono">' + strip + '</div><div class="ad-legend">' + legend + '</div>';
  }
  $('#ad-in').addEventListener('input', drawAd);
  drawAd();

  function bitQ() { const k = rand(8, 255); return { q: t({ tr: 'Bir bit dizisinde ' + k + '. bit hangi byte’ta (0’dan sayarak)?', en: 'In a bit array, which byte holds bit ' + k + ' (counting from 0)?' }), a: String(k >> 3), kind: 'dec', hint: 'k >> 3 = ⌊k ÷ 8⌋', explain: k + ' >> 3 = <b>' + (k >> 3) + '</b>, ' + t({ tr: 'byte içinde bit ', en: 'bit within byte ' }) + (k & 7) }; }
  function alQ() { const a = pick([2, 4, 8, 16]), x = rand(1, 200); return { q: t({ tr: x + ' adresinden sonraki (ya da kendisi) ' + a + ' byte’a hizalı ilk adres?', en: 'The first address at or after ' + x + ' that is aligned to ' + a + ' bytes?' }), a: String((x + a - 1) & ~(a - 1)), kind: 'dec', hint: '(x + a − 1) & ~(a − 1)', explain: '(' + x + ' + ' + (a - 1) + ') & ~' + (a - 1) + ' = <b>' + ((x + a - 1) & ~(a - 1)) + '</b>' }; }
  function stQ() { const pool = Object.keys(TY).filter((k) => k !== 'char*'), fs = Array.from({ length: rand(2, 4) }, (_, i) => ['f' + i, pick(pool)]), L = layout(fs); return { q: t({ tr: 'Bu struct’ın boyutu (64 bit sistem, doğal hizalama)?', en: 'The size of this struct (64-bit system, natural alignment)?' }) + ' <code>struct { ' + fs.map(([n, ty]) => ty + ' ' + n + ';').join(' ') + ' }</code>', a: String(L.size), kind: 'dec', hint: t({ tr: 'Her alan kendi boyutunun katı olan ofsette başlar; toplam boyut en büyük hizalamanın katıdır.', en: 'Each field starts at a multiple of its size; the total is a multiple of the largest alignment.' }), explain: L.items.map((it) => (it.pad ? '+' + it.pad + ' pad' : it.ty + '@' + it.off)).join(', ') + ' → <b>' + L.size + '</b>' }; }
  function pgQ() { const v = rand(0x10000, 0xffffff); return { q: t({ tr: '4 KiB’lık sayfalarda <span class="h">0x' + toBase(v, 16) + '</span> adresinin sayfa içi ofseti (hex)?', en: 'With 4 KiB pages, the in-page offset of address <span class="h">0x' + toBase(v, 16) + '</span> (hex)?' }), a: toBase(v & 0xfff, 16), kind: 'hex', hint: t({ tr: 'Son 12 bit = son 3 hex rakamı.', en: 'The last 12 bits = the last 3 hex digits.' }), explain: '0x' + toBase(v, 16) + ' & 0xFFF = <b class="h">0x' + toBase(v & 0xfff, 16) + '</b>' }; }

  tryIt($('#try'), [
    { label: t({ tr: 'Bit → byte', en: 'Bit → byte' }), fn: bitQ },
    { label: t({ tr: 'Hizalama', en: 'Alignment' }), fn: alQ },
    { label: 'struct', fn: stQ },
    { label: t({ tr: 'Sayfa ofseti', en: 'Page offset' }), fn: pgQ },
    { label: t({ tr: 'Byte sırası', en: 'Byte order' }), fn: endianQ },
    { label: t({ tr: 'Dizi adresi', en: 'Array address' }), fn: arrQ },
    { label: t({ tr: 'Adres bitleri', en: 'Address bits' }), fn: addrQ },
    { label: 'Hex → dec', fn: GEN.hexToDec },
  ]);
})();
