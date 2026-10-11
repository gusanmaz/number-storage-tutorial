/* Kapak */
(function () {
  const { t, $, el, esc, pad, lamps, store, CHAPTERS, LANG } = NS;
  const word = t({ tr: 'SELAM', en: 'HELLO' });
  const board = $('#board');
  const rows = [...word].map((ch, r) => {
    const row = el('div', { class: 'cover-row' });
    const lbl = el('span', { class: 'lbl', text: pad(r, 2) });
    const box = el('div');
    const chr = el('span', { class: 'chr' });
    row.append(lbl, box, chr);
    board.append(row);
    const show = (bits) => { const v = parseInt(bits.join(''), 2); chr.textContent = v >= 33 && v < 127 ? String.fromCharCode(v) : v === 32 ? '␣' : '·'; };
    const L = lamps(box, { n: 8, value: ch.charCodeAt(0), size: 'sm', text: false, onChange: (b) => { show(b); hint(); }, label: ch });
    show(L.get());
    return L;
  });
  let touched = false;
  function hint() {
    if (touched) return; touched = true;
    $('#board-hint').innerHTML = t({ tr: 'Gördün mü? Sadece bir bit değişti. Nedenini <a href="metin.html">Bölüm 6</a> anlatıyor.', en: 'See? Only one bit changed. <a href="text.html">Chapter 6</a> explains why.' });
  }
  void rows;
  const read = store.get('zo-read', {});
  $('#journey').innerHTML = CHAPTERS.slice(1).map((c, i) => '<li><a href="' + c[LANG] + '"><span class="jn">' + pad(i + 1, 2) + ' · ' + pad((i + 1).toString(2), 4) + '</span><span class="jt">' + esc(t(c.title)) + '<span class="jd">' + esc(t(c.desc)) + '</span></span>' + (read[c.id] ? '<span class="jr">✓ ' + esc(t({ tr: 'okundu', en: 'read' })) + '</span>' : '<span></span>') + '</a></li>').join('');
})();
