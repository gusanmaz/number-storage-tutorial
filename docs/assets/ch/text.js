/* Bölüm 7 — Metin */
(function () {
  const { t, $, $$, el, esc, fmt, pad, toBase, lamps, steps, tryIt, LANG, pick } = NS;
  const hx = (b) => pad(toBase(b, 16), 2);
  const sub = (b) => '<span class="sub">' + b + '</span>';
  const enc = new TextEncoder();
  const u8 = (s) => Array.from(enc.encode(s));

  const CTRL = 'NUL SOH STX ETX EOT ENQ ACK BEL BS HT LF VT FF CR SO SI DLE DC1 DC2 DC3 DC4 NAK SYN ETB CAN EM SUB ESC FS GS RS US'.split(' ');
  const CDESC = {
    0: [{ tr: 'boş karakter', en: 'null' }, '\\0'], 7: [{ tr: 'zil', en: 'bell' }, '\\a'], 8: [{ tr: 'geri al', en: 'backspace' }, '\\b'], 9: [{ tr: 'yatay sekme', en: 'horizontal tab' }, '\\t'],
    10: [{ tr: 'satır besleme', en: 'line feed' }, '\\n'], 11: [{ tr: 'dikey sekme', en: 'vertical tab' }, '\\v'], 12: [{ tr: 'sayfa besleme', en: 'form feed' }, '\\f'], 13: [{ tr: 'satır başı', en: 'carriage return' }, '\\r'],
    27: [{ tr: 'kaçış', en: 'escape' }, '\\x1b'], 32: [{ tr: 'boşluk', en: 'space' }, "' '"], 127: [{ tr: 'sil', en: 'delete' }, '\\x7f'], 4: [{ tr: 'iletim sonu (Ctrl+D)', en: 'end of transmission (Ctrl+D)' }, ''], 3: [{ tr: 'metin sonu (Ctrl+C)', en: 'end of text (Ctrl+C)' }, ''],
  };
  const name = (c) => (c < 32 ? CTRL[c] : c === 127 ? 'DEL' : c === 32 ? 'SP' : String.fromCharCode(c));
  const kind = (c) => (c < 32 || c === 127 ? 'ctl' : c >= 48 && c <= 57 ? 'dig' : c >= 65 && c <= 90 ? 'up' : c >= 97 && c <= 122 ? 'lo' : 'pun');

  /* ---------- Şekil 1: karakter kümeleri ---------- */
  const SETS = [
    [{ tr: 'Sadece büyük harf', en: 'Uppercase letters only' }, 26, 'A B C … Z', { tr: 'telgraf (Baudot)', en: 'telegraph (Baudot)' }],
    [{ tr: '+ küçük harf ve rakam', en: '+ lowercase and digits' }, 62, 'a b c … 0 1 2'],
    [{ tr: '+ noktalama ve kontrol kodları', en: '+ punctuation and control codes' }, 128, '! ? @ # \\n', 'ASCII'],
    [{ tr: '+ Türkçe, Fransızca, Almanca harfler', en: '+ Turkish, French, German letters' }, 256, 'ç ğ ş é ß ñ', { tr: 'kod sayfaları', en: 'code pages' }],
    [{ tr: 'Yaygın Çince karakterler', en: 'Common Chinese characters' }, 20000, '中 文 字 書'],
    [{ tr: 'Dünyanın bütün yazıları', en: 'All the world’s scripts' }, 1114112, 'ش अ 한 𓂀 😀', 'Unicode'],
  ];
  $('#sets').innerHTML = '<div class="sets">' + SETS.map(([l, n, ex, tag]) => {
    const b = Math.ceil(Math.log2(n));
    return '<div class="set"><div class="set-l"><b>' + esc(t(l)) + '</b><span class="set-ex">' + esc(ex) + '</span></div><div class="set-n mono">' + fmt(n) + (tag ? ' <span class="set-tag">' + esc(t(tag)) + '</span>' : '') + '</div><div class="set-b"><span class="set-dots">' + '<i></i>'.repeat(b) + '</span><b class="mono">' + b + ' bit</b></div></div>';
  }).join('') + '</div>';

  /* ---------- Şekil 2: ASCII tablosu ---------- */
  let sel = 65, hl = null;
  const HL = [['ctl', { tr: 'Kontrol', en: 'Control' }], ['dig', { tr: 'Rakamlar', en: 'Digits' }], ['up', { tr: 'Büyük harf', en: 'Uppercase' }], ['lo', { tr: 'Küçük harf', en: 'Lowercase' }], ['pun', { tr: 'Noktalama', en: 'Punctuation' }]];
  const hlBtns = HL.map(([k, l]) => el('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', text: t(l), onclick: () => { hl = hl === k ? null : k; hlBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(HL[i][0] === hl))); drawAscii(); } }));
  $('#ascii-hl').append(...hlBtns);
  const asc = $('#ascii');
  function drawAscii() {
    let h = '<div class="asc"><span class="asc-h"></span>';
    for (let c = 0; c < 8; c++) h += '<span class="asc-h">' + c + '<small>' + pad(c.toString(2), 3) + '</small></span>';
    for (let r = 0; r < 16; r++) {
      h += '<span class="asc-h row">' + toBase(r, 16) + '<small>' + pad(r.toString(2), 4) + '</small></span>';
      for (let c = 0; c < 8; c++) {
        const code = c * 16 + r, k = kind(code);
        h += '<button type="button" class="ac ' + k + (code === sel ? ' sel' : '') + (hl && hl !== k ? ' dim' : '') + '" data-c="' + code + '" aria-label="' + code + '">' + esc(name(code)) + '</button>';
      }
    }
    asc.innerHTML = h + '</div>';
    const d = CDESC[sel];
    const b = pad(sel.toString(2), 7);
    $('#ascii-out').innerHTML = '<span class="asc-big">' + esc(sel < 33 || sel === 127 ? name(sel) : String.fromCharCode(sel)) + '</span> ' +
      '<span class="d">' + sel + '</span> = <span class="h">0x' + hx(sel) + '</span> = <span class="b">' + b.slice(0, 3) + ' ' + b.slice(3) + '</span>' + sub(2) +
      (d ? ' · ' + esc(t(d[0])) + (d[1] ? ' <code>' + esc(d[1]) + '</code>' : '') : '') +
      (sel >= 48 && sel <= 57 ? ' · ' + t({ tr: 'alt 4 bit = ', en: 'low 4 bits = ' }) + (sel - 48) : '') +
      (/[A-Za-z]/.test(String.fromCharCode(sel)) ? ' · ' + t({ tr: 'alfabedeki sırası (alt 5 bit) = ', en: 'position in alphabet (low 5 bits) = ' }) + (sel & 31) : '');
  }
  asc.addEventListener('click', (e) => { const b = e.target.closest('.ac'); if (b) { sel = +b.dataset.c; drawAscii(); } });
  drawAscii();

  /* ---------- Şekil 3: büyük/küçük harf biti ---------- */
  const CL = lamps($('#case-lamps'), { n: 7, value: 65, weight: (i) => String(2 ** (6 - i)), cls: (i) => (i === 1 ? 'case-bit' : ''), onChange: drawCase, label: 'ASCII bits' });
  function drawCase() {
    const v = CL.value(), ch = String.fromCharCode(v), letter = /[A-Za-z]/.test(ch);
    $('#case-out').innerHTML = '<span class="asc-big">' + esc(v < 33 || v === 127 ? name(v) : ch) + '</span> <span class="d">' + v + '</span> = <span class="h">0x' + hx(v) + '</span>' +
      '<div class="tell">' + (letter ? (v & 32 ? t({ tr: 'Bit 5 yanık → <b>küçük</b> harf.', en: 'Bit 5 on → <b>lowercase</b>.' }) : t({ tr: 'Bit 5 sönük → <b>büyük</b> harf.', en: 'Bit 5 off → <b>uppercase</b>.' })) : t({ tr: 'Bu bir harf değil. Bit 5 burada başka bir şey değiştirir.', en: 'Not a letter. Here bit 5 changes something else.' })) + '</div>';
  }
  $('#case-ctl').append(
    el('button', { class: 'btn fill', type: 'button', text: t({ tr: 'Shift (bit 5’i çevir)', en: 'Shift (flip bit 5)' }), onclick: () => CL.set(CL.value() ^ 32) }),
    el('button', { class: 'btn', type: 'button', text: t({ tr: 'Rastgele harf', en: 'Random letter' }), onclick: () => CL.set(pick([65, 97]) + Math.floor(Math.random() * 26)) }),
  );
  drawCase();

  /* ---------- Şekil 4: teleprinter ---------- */
  const COLS = 28, ROWS = 5;
  let grid, row, col, sent;
  const tty = $('#tty');
  tty.tabIndex = 0;
  tty.setAttribute('aria-label', t({ tr: 'teleprinter; yazmak için odaklan', en: 'teleprinter; focus to type' }));
  function resetTty() { grid = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => [])); row = 0; col = 0; sent = []; drawTty(); }
  function feed() { row++; if (row >= ROWS) { grid.shift(); grid.push(Array.from({ length: COLS }, () => [])); row = ROWS - 1; } }
  function send(code) {
    sent.push(code); if (sent.length > 18) sent.shift();
    if (code === 13) col = 0;
    else if (code === 10) feed();
    else if (code === 8) col = Math.max(0, col - 1);
    else if (code === 9) col = Math.min(COLS - 1, (Math.floor(col / 8) + 1) * 8);
    else if (code === 7) { tty.classList.remove('bell'); void tty.offsetWidth; tty.classList.add('bell'); }
    else if (code >= 32) { if (col < COLS) { grid[row][col].push(String.fromCharCode(code)); col = Math.min(COLS, col + 1); } }
  }
  function drawTty() {
    tty.innerHTML = '<div class="tty-paper">' + grid.map((r, ri) => '<div class="tty-row">' + r.map((c, ci) => '<span class="tc' + (ri === row && ci === col ? ' tcur' : '') + (c.length > 1 ? ' over' : '') + '">' + (c.length ? c.map((x, k) => '<i' + (k < c.length - 1 ? ' class="u"' : '') + '>' + esc(x) + '</i>').join('') : '') + '</span>').join('') + (ri === row && col >= COLS ? '<span class="tc tcur"></span>' : '') + '</div>').join('') + '</div>';
    $('#tty-bytes').innerHTML = sent.length ? sent.map((c) => '<span class="tb' + (c < 32 ? ' ctl' : '') + '" title="' + esc(name(c)) + '">' + (c < 32 ? esc(name(c)) : hx(c)) + '</span>').join(' ') : '<span class="muted">' + t({ tr: 'Gönderilen byte’lar burada görünecek.', en: 'Bytes sent will show here.' }) + '</span>';
  }
  const typeStr = (s) => { [...s].forEach((ch) => send(ch.charCodeAt(0))); drawTty(); };
  const W1 = t({ tr: 'MERHABA', en: 'HELLO' }), W2 = t({ tr: 'DUNYA', en: 'WORLD' });
  $('#tty-ctl').append(
    el('button', { class: 'btn', type: 'button', text: '“' + W1 + '”', onclick: () => typeStr(W1) }),
    el('button', { class: 'btn', type: 'button', text: '“' + W2 + '”', onclick: () => typeStr(W2) }),
    ...[[13, 'CR \\r'], [10, 'LF \\n'], [9, 'TAB \\t'], [8, 'BS \\b'], [7, 'BEL \\a']].map(([c, l]) => el('button', { class: 'btn fill', type: 'button', text: l, onclick: () => { send(c); drawTty(); } })),
    el('button', { class: 'btn ghost', type: 'button', text: t({ tr: 'Yeni kâğıt', en: 'New paper' }), onclick: resetTty }),
  );
  tty.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.length === 1 && e.key.charCodeAt(0) < 127) { send(e.key.toUpperCase().charCodeAt(0)); drawTty(); e.preventDefault(); }
    else if (e.key === 'Enter') { send(13); send(10); drawTty(); e.preventDefault(); }
    else if (e.key === 'Backspace') { send(8); drawTty(); e.preventDefault(); }
    else if (e.key === 'Tab') { send(9); drawTty(); e.preventDefault(); }
  });
  resetTty();

  /* ---------- Şekil 5: bellekte metin ---------- */
  let memMode = 'c', broken = false;
  const SECRET = t({ tr: 'parola=K4R4', en: 'passwd=K4R4' });
  const mseg = el('div', { class: 'seg', role: 'group' });
  [['c', { tr: 'C: sonda NUL', en: 'C: NUL at the end' }], ['p', { tr: 'Başta uzunluk', en: 'Length prefix' }]].forEach(([k, l]) => mseg.append(el('button', { type: 'button', 'aria-pressed': String(k === memMode), text: t(l), onclick: (e) => { memMode = k; broken = false; $$('button', mseg).forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget))); drawMem(); } })));
  $('#mem-mode').append(mseg);
  const brk = el('button', { class: 'btn', type: 'button', onclick: () => { broken = !broken; drawMem(); } });
  $('#mem-ctl').append(brk);
  function drawMem() {
    const s = $('#mem-in').value, bytes = u8(s), cells = [];
    if (memMode === 'p') cells.push({ b: bytes.length, tag: 'len' });
    bytes.forEach((b) => cells.push({ b, tag: 'str' }));
    if (memMode === 'c') cells.push({ b: broken ? 0x21 : 0, tag: broken ? 'bad' : 'nul' });
    u8(SECRET).forEach((b) => cells.push({ b, tag: 'sec' }));
    cells.push({ b: 0, tag: 'nul2' });
    [0x7f, 0x13, 0xa0].forEach((b) => cells.push({ b, tag: 'junk' }));
    // okuma
    let read = [];
    if (memMode === 'c') { for (const c of cells) { if (c.b === 0) break; read.push(c); } }
    else read = cells.slice(1, 1 + bytes.length);
    read.forEach((c) => (c.read = true));
    const start = 0x7ffe10;
    const lbl = (c) => (c.tag === 'nul' || c.tag === 'nul2' ? 'NUL' : c.tag === 'len' ? '#' + c.b : c.b >= 32 && c.b < 127 ? esc(String.fromCharCode(c.b)) : c.b >= 128 ? '·' : '');
    $('#mem').innerHTML = cells.map((c, i) => '<div class="mc ' + c.tag + (c.read ? ' rd' : '') + '"><b>' + hx(c.b) + '</b><span>' + lbl(c) + '</span><small>…' + toBase(start + i, 16).slice(-3) + '</small></div>').join('') +
      '<div class="mem-legend"><span class="lg str">' + esc(t({ tr: 'metin', en: 'string' })) + '</span>' + (memMode === 'p' ? '<span class="lg len">' + esc(t({ tr: 'uzunluk', en: 'length' })) + '</span>' : '<span class="lg nul">NUL</span>') + '<span class="lg sec">' + esc(t({ tr: 'yandaki değişken', en: 'neighboring variable' })) + '</span></div>';
    const outStr = new TextDecoder().decode(new Uint8Array(read.map((c) => c.b)));
    brk.hidden = memMode !== 'c';
    brk.textContent = broken ? t({ tr: 'NUL’u geri koy', en: 'Restore the NUL' }) : t({ tr: 'NUL’un üstüne yaz (hata!)', en: 'Overwrite the NUL (bug!)' });
    const nonAscii = bytes.length !== [...s].length;
    $('#mem-tell').innerHTML = (memMode === 'c'
      ? '<code>printf("%s")</code> → <b class="mono">' + esc(outStr) + '</b>' + (broken ? ' <span class="bad">' + t({ tr: 'NUL olmadığı için okuma yandaki değişkene taştı!', en: 'With no NUL, reading spilled into the neighboring variable!' }) + '</span>' : ' · <code>strlen</code> = ' + bytes.length)
      : t({ tr: 'Uzunluk baştan biliniyor: <b>' + bytes.length + '</b> byte. Saymaya gerek yok, taşma yok.', en: 'The length is known up front: <b>' + bytes.length + '</b> bytes. No counting, no overrun.' })) +
      (nonAscii ? '<br><span class="muted">' + t({ tr: 'Not: Türkçe harfler UTF-8’de 2 byte tutar; bu yüzden byte sayısı harf sayısından fazla.', en: 'Note: non-ASCII letters take 2+ bytes in UTF-8, so there are more bytes than letters.' }) + '</span>' : '');
  }
  $('#mem-in').addEventListener('input', drawMem);
  drawMem();

  /* ---------- Şekil 6: kod sayfaları ---------- */
  const L5 = { 'Ğ': 0xD0, 'İ': 0xDD, 'Ş': 0xDE, 'ğ': 0xF0, 'ı': 0xFD, 'ş': 0xFE };
  const L5X = new Set(Object.values(L5));
  function drawCp() {
    const s = [...$('#cp-in').value].slice(0, 40);
    let bad = false;
    const cells = s.map((ch) => {
      let b = L5[ch];
      if (b == null) { const c = ch.codePointAt(0); b = c <= 0xff && !L5X.has(c) ? c : null; }
      if (b == null) { bad = true; return { ch, b: null }; }
      return { ch, b, r: String.fromCharCode(b) };
    });
    $('#cp-out').innerHTML = '<div class="cp">' + cells.map((c) => '<div class="cpc' + (c.b != null && c.r !== c.ch ? ' diff' : '') + '"><span class="cp-a">' + esc(c.ch === ' ' ? '␣' : c.ch) + '</span><b class="h">' + (c.b != null ? hx(c.b) : '??') + '</b><span class="cp-b">' + esc(c.b == null ? '?' : c.r === ' ' ? '␣' : c.r) + '</span></div>').join('') + '</div>' +
      '<div class="cp-rows"><div><span class="muted">' + t({ tr: 'Yazan (Latin-5):', en: 'Writer (Latin-5):' }) + '</span> <b>' + esc(s.join('')) + '</b></div><div><span class="muted">' + t({ tr: 'Okuyan (Latin-1):', en: 'Reader (Latin-1):' }) + '</span> <b class="bad">' + esc(cells.map((c) => (c.b == null ? '?' : c.r)).join('')) + '</b></div></div>' +
      (bad ? '<p class="tell">' + t({ tr: '“??” olan karakterler Latin-5 tablosunda hiç yok; 256 yer her şeye yetmez.', en: 'Characters marked “??” are not in the Latin-5 table at all; 256 slots cannot hold everything.' }) + '</p>' : '');
  }
  $('#cp-in').addEventListener('input', drawCp);
  drawCp();

  /* ---------- Şekil 7: Unicode inceleyici ---------- */
  const seg = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter(LANG, { granularity: 'grapheme' }) : null;
  const UP = [['Aş€😀', 'Aş€😀'], ['é / e+◌́', 'é é'], ['👍🏽', '👍🏽'], ['👨‍👩‍👧', '👨‍👩‍👧'], ['🇹🇷', '🇹🇷'], ['İı', 'İıIi'], ['中文', '中文'], ['𝄞', '𝄞']];
  UP.forEach(([l, v]) => $('#uni-pre').append(el('button', { type: 'button', class: 'chip', text: l, onclick: () => { $('#uni-in').value = v; drawUni(); } })));
  const isMark = (c) => /\p{M}/u.test(c) || c === '‍' || (c.codePointAt(0) >= 0xFE00 && c.codePointAt(0) <= 0xFE0F) || (c.codePointAt(0) >= 0x1F3FB && c.codePointAt(0) <= 0x1F3FF);
  function drawUni() {
    const s = $('#uni-in').value;
    const graphemes = seg ? Array.from(seg.segment(s), (x) => x.segment) : [...s];
    let ncp = 0, total = 0, shown = 0;
    const h = graphemes.map((g) => {
      const cps = [...g];
      ncp += cps.length;
      if (shown > 30) return '';
      shown += cps.length;
      return '<div class="ug' + (cps.length > 1 ? ' multi' : '') + '">' + cps.map((c) => {
        const cp = c.codePointAt(0), by = u8(c); total += by.length;
        const glyph = c === '‍' ? 'ZWJ' : c === ' ' ? '␣' : isMark(c) && cp < 0x1F000 ? '◌' + c : c;
        return '<div class="uc n' + by.length + '"><span class="uc-g">' + esc(glyph) + '</span><span class="uc-cp">U+' + pad(toBase(cp, 16), 4) + '</span><span class="uc-b">' + by.map(hx).join(' ') + '</span></div>';
      }).join('') + '</div>';
    }).join('');
    total = u8(s).length;
    $('#uni').innerHTML = h || '<span class="muted">' + t({ tr: 'Bir şey yaz.', en: 'Type something.' }) + '</span>';
    $('#uni-tell').innerHTML = '<b>' + graphemes.length + '</b> ' + t({ tr: 'görünen karakter', en: 'visible characters' }) + ' · <b>' + ncp + '</b> ' + t({ tr: 'kod noktası', en: 'code points' }) + ' · <b>' + s.length + '</b> ' + t({ tr: 'UTF-16 birimi (JS length)', en: 'UTF-16 units (JS length)' }) + ' · <b>' + total + '</b> ' + t({ tr: 'UTF-8 byte', en: 'UTF-8 bytes' });
  }
  $('#uni-in').addEventListener('input', drawUni);
  drawUni();

  /* ---------- Şekil 8: UTF-8 kodlayıcı ---------- */
  const U8P = ['A', 'ç', 'ş', '€', '₺', '中', '😀'];
  let uc = 'ş';
  const TPL = [[7], [5, 6], [4, 6, 6], [3, 6, 6, 6]];
  const PFX = [['0'], ['110', '10'], ['1110', '10', '10'], ['11110', '10', '10', '10']];
  function u8parts(ch) {
    const cp = ch.codePointAt(0), n = cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4;
    const tot = TPL[n - 1].reduce((a, b) => a + b, 0), bits = pad(cp.toString(2), tot);
    const groups = []; let k = 0;
    TPL[n - 1].forEach((w) => { groups.push(bits.slice(k, k + w)); k += w; });
    return { cp, n, bits, groups };
  }
  const u8steps = steps($('#u8-steps'), { count: 4, render: drawU8 });
  const u8chips = U8P.map((c) => el('button', { type: 'button', class: 'chip', 'aria-pressed': String(c === uc), text: c, onclick: (e) => { uc = c; u8chips.forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget))); u8steps.go(0); } }));
  $('#u8-pre').append(...u8chips);
  function drawU8(i) {
    const P = u8parts(uc), real = u8(uc);
    let h = '<div class="u8-cp"><span class="u8-ch">' + esc(uc) + '</span><span class="h">U+' + pad(toBase(P.cp, 16), 4) + '</span> = <span class="d">' + fmt(P.cp) + '</span> = ' +
      '<span class="u8-bits">' + (i >= 2 ? P.groups.map((g, k) => '<span class="g' + k + '">' + g + '</span>').join('') : P.bits) + '</span>' + sub(2) + '</div>';
    if (i >= 1) {
      h += '<div class="u8-bytes">' + P.groups.map((g, k) => {
        const pre = PFX[P.n - 1][k];
        return '<div class="u8-byte"><span class="u8-b"><b>' + pre + '</b>' + (i >= 2 ? '<span class="g' + k + '">' + g + '</span>' : '<span class="x">' + 'x'.repeat(g.length) + '</span>') + '</span>' +
          (i >= 3 ? '<span class="u8-hex h">' + hx(real[k]) + '</span><span class="u8-dec">' + real[k] + '</span>' : '') + '</div>';
      }).join('') + '</div>';
    }
    $('#u8').innerHTML = h;
    $('#u8-tell').innerHTML = [
      t({ tr: 'Önce kod noktasını ikili yaz. ' + P.bits.replace(/^0+/, '').length + ' anlamlı bit var.', en: 'First write the code point in binary. It has ' + P.bits.replace(/^0+/, '').length + ' significant bits.' }),
      t({ tr: 'U+' + pad(toBase(P.cp, 16), 4) + ' tablodaki ' + P.n + '. satıra düşer: <b>' + P.n + ' byte</b>lık şablon, ' + P.bits.length + ' tane x.', en: 'U+' + pad(toBase(P.cp, 16), 4) + ' falls in row ' + P.n + ' of the table: a <b>' + P.n + '-byte</b> template with ' + P.bits.length + ' x’s.' }),
      t({ tr: 'Bitleri sağdan başlayarak x’lerin yerine dök. Soldaki boş x’ler 0 ile dolar.', en: 'Pour the bits into the x’s starting from the right. Leftover x’s on the left become 0.' }),
      '<span class="good">' + t({ tr: 'Sonuç:', en: 'Result:' }) + '</span> <b class="h">' + real.map(hx).join(' ') + '</b>. ' + t({ tr: 'Tarayıcının kendi kodlayıcısı da aynısını söylüyor.', en: 'The browser’s own encoder agrees.' }),
    ][i];
  }

  /* ---------- Şekil 9: mojibake ---------- */
  let dec1252 = null;
  try { dec1252 = new TextDecoder('windows-1252'); } catch (e) { /* eski tarayıcı */ }
  function drawMoji() {
    const s = $('#moji-in').value.slice(0, 80), bytes = u8(s);
    const moji = dec1252 ? dec1252.decode(new Uint8Array(bytes)) : '';
    const lat = [...s].map((c) => { const k = c.codePointAt(0); return k <= 0xff ? k : 0x3f; });
    const back = new TextDecoder('utf-8').decode(new Uint8Array(lat));
    $('#moji').innerHTML = '<div class="moji">' +
      '<div class="mj"><span class="mj-l">' + t({ tr: '1 · UTF-8 byte’ları', en: '1 · UTF-8 bytes' }) + '</span><span class="mj-v mono">' + bytes.map((b) => '<i class="' + (b >= 128 ? 'hi' : '') + '">' + hx(b) + '</i>').join(' ') + '</span></div>' +
      '<div class="mj"><span class="mj-l">' + t({ tr: '2 · Windows-1252 sanılırsa', en: '2 · Mistaken for Windows-1252' }) + '</span><span class="mj-v big2 bad">' + esc(moji) + '</span></div>' +
      '<div class="mj"><span class="mj-l">' + t({ tr: '3 · Ters yön: Latin-1 byte’ları UTF-8 sanılırsa', en: '3 · Reverse: Latin-1 bytes mistaken for UTF-8' }) + '</span><span class="mj-v big2 bad">' + esc(back) + '</span></div></div>';
  }
  $('#moji-in').addEventListener('input', drawMoji);
  drawMoji();

  /* ---------- alıştırma ---------- */
  function escQ() {
    const [e, c] = pick([['\\n', 10], ['\\t', 9], ['\\r', 13], ['\\0', 0], ['\\a', 7], ['\\b', 8]]);
    return { q: t({ tr: '<code>' + e + '</code> kaçış dizisi hangi ASCII koduna (onlu) karşılık gelir?', en: 'Which ASCII code (decimal) does the escape <code>' + e + '</code> stand for?' }), a: String(c), kind: 'dec', hint: 'NUL 0 · BEL 7 · BS 8 · HT 9 · LF 10 · CR 13', explain: '<code>' + e + '</code> = ' + CTRL[c] + ' = <b>' + c + '</b> = 0x' + hx(c) };
  }
  function caseQ() {
    const up = Math.random() < 0.5, c = (up ? 65 : 97) + Math.floor(Math.random() * 26), o = c ^ 32;
    return { q: t({ tr: '<code>' + String.fromCharCode(c) + '</code> = <span class="h">0x' + hx(c) + '</span>. <code>' + String.fromCharCode(o) + '</code> hex olarak kaçtır?', en: '<code>' + String.fromCharCode(c) + '</code> = <span class="h">0x' + hx(c) + '</span>. What is <code>' + String.fromCharCode(o) + '</code> in hex?' }), a: hx(o), kind: 'hex', hint: t({ tr: 'Fark 0x20 (bit 5).', en: 'The difference is 0x20 (bit 5).' }), explain: '0x' + hx(c) + (up ? ' + ' : ' − ') + '0x20 = <b class="h">0x' + hx(o) + '</b>' };
  }
  tryIt($('#try'), [
    { label: t({ tr: 'Karakter → kod', en: 'Character → code' }), fn: GEN.asciiCode },
    { label: t({ tr: 'Kod → karakter', en: 'Code → character' }), fn: GEN.asciiChar },
    { label: t({ tr: 'Büyük/küçük', en: 'Case' }), fn: caseQ },
    { label: t({ tr: 'Kaçış dizileri', en: 'Escapes' }), fn: escQ },
    { label: 'UTF-8', fn: GEN.utf8Bytes },
  ]);
})();
