/* Bölüm — Metin: ASCII tablosu, büyük/küçük harf biti, UTF-8 kodlayıcı, mojibake */
(function () {
  const { t, $, $$, el, esc, pad, toBase } = NS;
  const CTRL = ['NUL', 'SOH', 'STX', 'ETX', 'EOT', 'ENQ', 'ACK', 'BEL', 'BS', 'TAB', 'LF', 'VT', 'FF', 'CR', 'SO', 'SI', 'DLE', 'DC1', 'DC2', 'DC3', 'DC4', 'NAK', 'SYN', 'ETB', 'CAN', 'EM', 'SUB', 'ESC', 'FS', 'GS', 'RS', 'US'];
  const cat = (c) => (c < 32 || c === 127 ? 'ctrl' : c === 32 ? 'space' : c >= 48 && c <= 57 ? 'digit' : c >= 65 && c <= 90 ? 'upper' : c >= 97 && c <= 122 ? 'lower' : 'sym');
  const label = (c) => (c < 32 ? CTRL[c] : c === 127 ? 'DEL' : c === 32 ? '␣' : String.fromCharCode(c));

  /* ---------- 1) ASCII tablosu ---------- */
  const grid = $('#as-grid'), detail = $('#as-detail');
  let sel = 65;
  grid.append(el('div', { class: 'ag-h corner', text: '' }));
  for (let c = 0; c < 16; c++) grid.append(el('div', { class: 'ag-h', text: toBase(c, 16) }));
  for (let r = 0; r < 8; r++) {
    grid.append(el('div', { class: 'ag-h row', text: r + '_' }));
    for (let c = 0; c < 16; c++) {
      const code = r * 16 + c;
      const b = el('button', { type: 'button', class: 'ag-c ' + cat(code), 'data-code': code, title: code + ' · 0x' + pad(toBase(code, 16), 2), html: '<span>' + esc(label(code)) + '</span>' });
      b.addEventListener('click', () => select(code));
      grid.append(b);
    }
  }
  const FILTERS = [['all', { tr: 'Hepsi', en: 'All' }], ['ctrl', { tr: 'Kontrol (0–31, 127)', en: 'Control (0–31, 127)' }], ['digit', { tr: 'Rakamlar', en: 'Digits' }], ['upper', { tr: 'Büyük harfler', en: 'Uppercase' }], ['lower', { tr: 'Küçük harfler', en: 'Lowercase' }], ['sym', { tr: 'Semboller', en: 'Symbols' }]];
  FILTERS.forEach(([k, l], i) => {
    const b = el('button', { type: 'button', class: 'chip' + (i === 0 ? ' on' : ''), text: t(l), 'aria-pressed': String(i === 0) });
    b.addEventListener('click', () => {
      $$('#as-filters .chip').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
      grid.dataset.filter = k;
    });
    $('#as-filters').append(b);
  });
  grid.dataset.filter = 'all';
  function select(code) {
    sel = code;
    $$('.ag-c', grid).forEach((b) => b.classList.toggle('sel', +b.dataset.code === code));
    const k = cat(code), bin = pad(code.toString(2), 8);
    const binHtml = [...bin].map((x, i) => (i === 2 && (k === 'upper' || k === 'lower') ? '<b class="hex" title="32">' + x + '</b>' : x)).join('');
    let rel = '';
    if (k === 'upper') rel = t({ tr: 'Küçüğü: <code>\'' + String.fromCharCode(code + 32) + '\'</code> = ' + code + ' + 32 = ' + (code + 32) + ' (sadece turuncu bit farklı)', en: 'Lowercase: <code>\'' + String.fromCharCode(code + 32) + '\'</code> = ' + code + ' + 32 = ' + (code + 32) + ' (only the orange bit differs)' });
    else if (k === 'lower') rel = t({ tr: 'Büyüğü: <code>\'' + String.fromCharCode(code - 32) + '\'</code> = ' + code + ' − 32 = ' + (code - 32), en: 'Uppercase: <code>\'' + String.fromCharCode(code - 32) + '\'</code> = ' + code + ' − 32 = ' + (code - 32) });
    else if (k === 'digit') rel = t({ tr: 'Sayısal değeri: <code>\'' + label(code) + '\' − \'0\'</code> = ' + code + ' − 48 = <b>' + (code - 48) + '</b>. Hex’in son rakamına bak: 0x3<b>' + (code - 48) + '</b>', en: 'Numeric value: <code>\'' + label(code) + '\' − \'0\'</code> = ' + code + ' − 48 = <b>' + (code - 48) + '</b>. Look at the last hex digit: 0x3<b>' + (code - 48) + '</b>' });
    else if (k === 'ctrl') rel = t({ tr: 'Kontrol karakteri: ekrana bir şey çizmez, cihaza komut verir.', en: 'Control character: draws nothing, it commands the device.' }) + ({ 0: ' \\0', 9: ' \\t', 10: ' \\n', 13: ' \\r', 27: ' \\x1b' }[code] ? ' <code>' + { 0: '\\0', 9: '\\t', 10: '\\n', 13: '\\r', 27: '\\x1b' }[code] + '</code>' : '');
    else if (k === 'space') rel = t({ tr: 'Boşluk da bir karakterdir ve 1 byte yer kaplar.', en: 'A space is a character too and takes 1 byte.' });
    detail.innerHTML = '<div class="ad-char">' + esc(label(code)) + '</div><div class="ad-info">' +
      '<div><span class="muted">Dec</span> <b class="dec">' + code + '</b></div><div><span class="muted">Hex</span> <b class="hex">0x' + pad(toBase(code, 16), 2) + '</b></div>' +
      '<div><span class="muted">Bin</span> <b class="bin mono">' + binHtml + '</b></div><div class="ad-rel">' + rel + '</div></div>';
  }
  document.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea, select')) return;
    if (e.key.length === 1 && e.key.charCodeAt(0) < 128 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const r = $('#ascii').getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) select(e.key.charCodeAt(0));
    }
  });
  select(65);

  /* ---------- 2) büyük/küçük harf biti ---------- */
  const cin = $('#case-in'), cout = $('#case-out');
  const crow = NS.bits($('#case-bits'), {
    n: 8, value: 71, group: 4, label: 'ASCII',
    weight: (i) => String(Math.pow(2, 7 - i)), cls: (i) => (i === 2 ? 'b-case' : ''),
    onChange: () => { const v = crow.value(); cin.value = v >= 32 && v < 127 ? String.fromCharCode(v) : ''; caseOut(v); },
  });
  function caseOut(v) {
    const ch = v >= 32 && v < 127 ? String.fromCharCode(v) : label(v);
    const isLetter = /[A-Za-z]/.test(ch);
    cout.innerHTML = '<span class="case-big">' + esc(ch) + '</span><span class="mono">= ' + v + ' = 0x' + pad(toBase(v, 16), 2) + '</span>' +
      (isLetter ? '<span class="muted">' + (v & 32 ? t({ tr: '5. bit 1 → küçük harf', en: 'bit 5 is 1 → lowercase' }) : t({ tr: '5. bit 0 → büyük harf', en: 'bit 5 is 0 → uppercase' })) + '</span>' : '<span class="muted">' + t({ tr: 'Harf değil; kural sadece harflerde geçerli.', en: 'Not a letter; the rule only applies to letters.' }) + '</span>');
  }
  cin.addEventListener('input', () => { const c = cin.value.charCodeAt(0); if (c < 128) { crow.set(c, true); caseOut(c); } });
  caseOut(71);

  /* ---------- 3) UTF-8 kodlayıcı ---------- */
  const uin = $('#u8-in'), ulist = $('#u8-list'), ustats = $('#u8-stats'), uhex = $('#u8-hex');
  const enc = new TextEncoder();
  [[t({ tr: 'Merhaba', en: 'Hello' }), t({ tr: 'Merhaba', en: 'Hello' })], [t({ tr: 'Şükrü', en: 'naïve café' }), t({ tr: 'Şükrü', en: 'naïve café' })], ['₺ € $', '₺ € $'], ['日本語', '日本語'], ['😀👍', '😀👍'], ['👨‍👩‍👧', '👨‍👩‍👧 (ZWJ)']].forEach(([v, l]) => {
    const b = el('button', { type: 'button', class: 'btn ghost sm', text: l });
    b.addEventListener('click', () => { uin.value = v; u8(); });
    $('#u8-presets').append(b);
  });
  const PREFIX = [[1, 1], [2, 3], [3, 4], [4, 5]]; // [byte sayısı, ilk byte önek uzunluğu]
  function u8() {
    const s = uin.value;
    const chars = Array.from(s);
    const allBytes = enc.encode(s);
    ustats.innerHTML =
      '<div class="stat"><div class="stat-label">' + t({ tr: 'Kod noktası', en: 'Code points' }) + '</div><div class="stat-value">' + chars.length + '</div></div>' +
      '<div class="stat"><div class="stat-label">UTF-8 byte</div><div class="stat-value hex">' + allBytes.length + '</div></div>' +
      '<div class="stat"><div class="stat-label">JS <code>.length</code></div><div class="stat-value">' + s.length + '</div></div>' +
      '<div class="stat"><div class="stat-label">UTF-32 byte</div><div class="stat-value">' + chars.length * 4 + '</div></div>';
    ulist.innerHTML = chars.slice(0, 24).map((ch) => {
      const cp = ch.codePointAt(0), bytes = Array.from(enc.encode(ch)), n = bytes.length, pre = PREFIX[n - 1][1];
      const payload = cp.toString(2);
      const bitsHtml = bytes.map((b, i) => {
        const bs = pad(b.toString(2), 8), p = i === 0 ? pre : 2;
        return '<span class="u8b"><span class="u8p">' + bs.slice(0, p) + '</span><span class="u8d">' + bs.slice(p) + '</span><small>' + pad(toBase(b, 16), 2) + '</small></span>';
      }).join('');
      const vis = cp === 0x200d ? 'ZWJ' : cp === 32 ? '␣' : ch;
      return '<div class="u8-row fade-up"><div class="u8-ch">' + esc(vis) + '</div><div class="u8-cp"><span class="mono">U+' + pad(toBase(cp, 16), 4) + '</span><small class="mono">' + payload + '</small></div><div class="u8-arrow">→</div><div class="u8-bytes">' + bitsHtml + '</div><div class="u8-n">' + n + ' B</div></div>';
    }).join('') + (chars.length > 24 ? '<p class="muted center">…</p>' : '');
    uhex.innerHTML = Array.from(allBytes).slice(0, 64).map((b) => pad(toBase(b, 16), 2)).join(' ') + (allBytes.length > 64 ? ' …' : '');
  }
  uin.addEventListener('input', u8);
  u8();

  /* ---------- 4) mojibake ---------- */
  const min = $('#mj-in'), mout = $('#mj-out');
  let dec1252 = null;
  try { dec1252 = new TextDecoder('windows-1252'); } catch (e) { /* eski tarayıcı */ }
  function moji() {
    const s = min.value, bytes = enc.encode(s);
    const wrong = dec1252 ? dec1252.decode(bytes) : '';
    const pairs = Array.from(s).filter((c) => c.codePointAt(0) > 127).filter((c, i, a) => a.indexOf(c) === i).slice(0, 8).map((c) => {
      const b = Array.from(enc.encode(c));
      return '<span class="mj-pair"><b>' + esc(c) + '</b> → <span class="mono hex">' + b.map((x) => pad(toBase(x, 16), 2)).join(' ') + '</span> → <b class="bad">' + esc(dec1252 ? dec1252.decode(new Uint8Array(b)) : '?') + '</b></span>';
    }).join('');
    mout.innerHTML =
      '<div class="mj-step"><span class="muted">1. ' + t({ tr: 'UTF-8 olarak kaydedildi', en: 'Saved as UTF-8' }) + '</span><div class="mono hex mj-bytes">' + Array.from(bytes).slice(0, 60).map((b) => pad(toBase(b, 16), 2)).join(' ') + (bytes.length > 60 ? ' …' : '') + '</div></div>' +
      '<div class="mj-step"><span class="muted">2. ' + t({ tr: 'Windows-1252 sanılarak okundu', en: 'Read as if it were Windows-1252' }) + '</span><div class="mj-wrong">' + esc(wrong) + '</div></div>' +
      (pairs ? '<div class="mj-pairs">' + pairs + '</div>' : '<p class="muted">' + t({ tr: 'Metinde ASCII dışı karakter yok, bu yüzden bozulma olmadı! UTF-8’in ASCII uyumluluğu sayesinde.', en: 'No non-ASCII characters, so nothing broke! Thanks to UTF-8’s ASCII compatibility.' }) + '</p>');
  }
  min.addEventListener('input', moji);
  moji();

  /* ---------- alıştırma ---------- */
  NS.practice($('#practice'), [
    { label: t({ tr: 'Karakter → kod', en: 'Character → code' }), fn: GEN.asciiCode },
    { label: t({ tr: 'Kod → karakter', en: 'Code → character' }), fn: GEN.asciiChar },
    { label: t({ tr: 'UTF-8 byte sayısı', en: 'UTF-8 byte count' }), fn: GEN.utf8Bytes },
  ]);
})();
