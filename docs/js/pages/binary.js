/* Bölüm 2 — İkili sistem: bit anahtarları + hedef oyunu, çıkarma yöntemi, toplama */
(function () {
  const { t, $, $$, el, esc, fmt, toBase, pad, group, rand } = NS;

  /* ---------- 1) 8 bit anahtar ---------- */
  const exprBox = $('#tg-expr'), statsBox = $('#tg-stats'), msg = $('#tg-msg');
  let target = null, tries = 0;
  const row = NS.bits($('#tg-bits'), {
    n: 8, value: 0, group: 4, label: '8 bit',
    weight: (i) => String(Math.pow(2, 7 - i)),
    onChange: () => { tries++; update(); },
  });
  function update() {
    const v = row.value(), b = row.get();
    const parts = b.map((x, i) => (x ? Math.pow(2, 7 - i) : null)).filter((x) => x != null);
    exprBox.innerHTML = parts.length
      ? parts.join(' + ') + ' = <b class="dec">' + v + '</b>'
      : t({ tr: 'Hiç bit açık değil → <b class="dec">0</b>', en: 'No bits on → <b class="dec">0</b>' });
    statsBox.innerHTML =
      '<div class="stat"><div class="stat-label">Binary</div><div class="stat-value bin">' + group(pad(toBase(v, 2), 8), 4) + '</div></div>' +
      '<div class="stat"><div class="stat-label">' + t({ tr: 'Onlu', en: 'Decimal' }) + '</div><div class="stat-value dec">' + v + '</div></div>' +
      '<div class="stat"><div class="stat-label">Hex</div><div class="stat-value hex">' + pad(toBase(v, 16), 2) + '</div></div>' +
      '<div class="stat"><div class="stat-label">' + t({ tr: 'Açık bit', en: 'Bits on' }) + '</div><div class="stat-value">' + parts.length + ' / 8</div></div>';
    if (target != null) {
      if (v === target) {
        msg.className = 'msg good';
        msg.innerHTML = t({ tr: '🎉 Buldun! <b>' + target + '</b> = ' + group(pad(toBase(target, 2), 8), 4) + ' (' + tries + ' tıklama). Sıradaki hedef 2 saniye içinde…', en: '🎉 Got it! <b>' + target + '</b> = ' + group(pad(toBase(target, 2), 8), 4) + ' (' + tries + ' clicks). Next target in 2 seconds…' });
        const done = target; target = -1;
        setTimeout(() => { if (target === -1) newTarget(done); }, 2000);
      } else if (target >= 0) {
        msg.className = 'msg';
        const diff = target - v;
        msg.innerHTML = t({ tr: '🎯 Hedef: <b class="dec">' + target + '</b> &nbsp;·&nbsp; şu an ' + v + ' &nbsp;·&nbsp; ' + (diff > 0 ? diff + ' eksik' : -diff + ' fazla'), en: '🎯 Target: <b class="dec">' + target + '</b> &nbsp;·&nbsp; now ' + v + ' &nbsp;·&nbsp; ' + (diff > 0 ? diff + ' to go' : -diff + ' too many') });
      }
    }
  }
  function newTarget(prev) {
    let x; do { x = rand(1, 255); } while (x === prev);
    target = x; tries = 0; msg.hidden = false; row.set(0, true); update();
  }
  $$('#toggler [data-act]').forEach((b) => b.addEventListener('click', () => {
    const v = row.value(), a = b.dataset.act;
    const nv = a === 'clear' ? 0 : a === 'all' ? 255 : a === 'inc' ? (v + 1) % 256 : a === 'shl' ? (v << 1) & 255 : v >> 1;
    if (a === 'shl' && v & 128) { msg.hidden = false; msg.className = 'msg warn'; msg.innerHTML = t({ tr: 'En soldaki 1 dışarı kaydı ve kayboldu! 8 bitte ' + v + ' × 2 = ' + v * 2 + ' sığmaz → ' + nv + '.', en: 'The leftmost 1 was shifted out and lost! ' + v + ' × 2 = ' + v * 2 + ' does not fit in 8 bits → ' + nv + '.' }); }
    else if (a === 'shr' && v & 1) { msg.hidden = false; msg.className = 'msg'; msg.innerHTML = t({ tr: 'En sağdaki 1 dışarı kaydı: ' + v + ' ÷ 2 = ' + v / 2 + ' → tam kısmı ' + nv + '.', en: 'The rightmost 1 fell off: ' + v + ' ÷ 2 = ' + v / 2 + ' → integer part ' + nv + '.' }); }
    else if (a === 'inc' && v === 255) { msg.hidden = false; msg.className = 'msg warn'; msg.innerHTML = t({ tr: '255 + 1 = 256 için 9 bit gerekir. 8 bitte sayaç başa sarıp 0 oldu (taşma).', en: '255 + 1 = 256 needs 9 bits. In 8 bits the counter wrapped to 0 (overflow).' }); }
    else if (target == null) msg.hidden = true;
    row.set(nv, true); tries++; update();
  }));
  $('#tg-game').addEventListener('click', (e) => {
    if (target != null) { target = null; msg.hidden = true; e.target.textContent = t({ tr: '🎯 Hedef oyunu', en: '🎯 Target game' }); return; }
    e.target.textContent = t({ tr: 'Oyunu bitir', en: 'End game' });
    newTarget();
  });
  update();

  /* ---------- 2) Çıkarma (greedy) yöntemi ---------- */
  const grN = $('#gr-n'), grTiles = $('#gr-tiles'), grNote = $('#gr-note'), grRemain = $('#gr-remain');
  let N = 42;
  function grRender(i) {
    // adım 0: başlangıç; 1..8: ağırlıklar 128..1; 9: sonuç
    let rem = N; const bitsArr = [];
    for (let k = 0; k < Math.min(i, 8); k++) { const w = Math.pow(2, 7 - k); if (rem >= w) { bitsArr.push(1); rem -= w; } else bitsArr.push(0); }
    grTiles.innerHTML = '';
    for (let k = 0; k < 8; k++) {
      const w = Math.pow(2, 7 - k);
      const known = k < bitsArr.length;
      const tile = el('div', { class: 'tile ' + (known ? (bitsArr[k] ? 'bin' : '') : 'ghost') + (k === i - 1 ? ' pop cur' : '') });
      tile.innerHTML = (known ? bitsArr[k] : '?') + '<small>' + w + '</small>';
      grTiles.append(tile);
    }
    grRemain.innerHTML = t({ tr: 'Kalan: ', en: 'Remaining: ' }) + '<b class="dec">' + rem + '</b>';
    if (i === 0) grNote.innerHTML = t({ tr: '<b>' + N + '</b> sayısını 8 bit ile yazacağız. En büyük ağırlık olan 128’den başlıyoruz.', en: 'We will write <b>' + N + '</b> in 8 bits, starting with the largest weight, 128.' });
    else if (i <= 8) {
      const w = Math.pow(2, 8 - i), before = rem + (bitsArr[i - 1] ? w : 0);
      grNote.innerHTML = bitsArr[i - 1]
        ? t({ tr: before + ' ≥ ' + w + ' mi? <b>Evet</b> → bu bit <b class="bin">1</b>. ' + before + ' − ' + w + ' = ' + rem, en: 'Is ' + before + ' ≥ ' + w + '? <b>Yes</b> → this bit is <b class="bin">1</b>. ' + before + ' − ' + w + ' = ' + rem })
        : t({ tr: before + ' ≥ ' + w + ' mi? <b>Hayır</b> → bu bit <b>0</b>. Kalan değişmez.', en: 'Is ' + before + ' ≥ ' + w + '? <b>No</b> → this bit is <b>0</b>. Remainder unchanged.' });
    } else {
      const parts = bitsArr.map((b, k) => (b ? Math.pow(2, 7 - k) : null)).filter(Boolean);
      grNote.innerHTML = t({ tr: 'Sonuç: <b class="bin">' + group(bitsArr.join(''), 4) + '</b>₂. Kontrol: ' + (parts.join(' + ') || '0') + ' = ' + N + ' ✓', en: 'Result: <b class="bin">' + group(bitsArr.join(''), 4) + '</b>₂. Check: ' + (parts.join(' + ') || '0') + ' = ' + N + ' ✓' });
    }
  }
  const grSt = NS.stepper($('#gr-stepper'), { count: 10, render: grRender, interval: 1300 });
  grN.addEventListener('input', () => { N = Math.max(0, Math.min(255, parseInt(grN.value, 10) || 0)); grSt.reset(10); });

  /* ---------- 3) Binary toplama ---------- */
  const aIn = $('#ad-a'), bIn = $('#ad-b'), grid = $('#ad-grid'), adNote = $('#ad-note');
  let A = '01011011', B = '00110110', cols = [];
  function compute() {
    const clean = (s) => pad(s.replace(/[^01]/g, '').slice(-8) || '0', 8);
    A = clean(aIn.value); B = clean(bIn.value);
    aIn.classList.toggle('invalid', /[^01]/.test(aIn.value));
    bIn.classList.toggle('invalid', /[^01]/.test(bIn.value));
    cols = []; let c = 0;
    for (let i = 7; i >= 0; i--) { const s = +A[i] + +B[i] + c; cols[i] = { cin: c, s: s % 2, cout: s >> 1, sum: s }; c = s >> 1; }
  }
  function adRender(i) {
    // adım 0: başlangıç; 1..8: sütun 7..0; 9: sonuç
    const doneCols = Math.min(i, 8);
    const isDone = (col) => col >= 8 - doneCols;
    const cur = i >= 1 && i <= 8 ? 8 - i : -1;
    const overflow = cols[0].cout;
    const cell = (txt, cls) => '<div class="ac ' + (cls || '') + '">' + txt + '</div>';
    let h = cell('', 'lbl') + cell(i >= 9 && overflow ? '1' : '', 'carry ovf' + (i >= 9 && overflow ? ' show' : ''));
    for (let k = 0; k < 8; k++) { const cin = cols[k].cin; const show = isDone(k) && cin; h += cell(show ? '1' : '', 'carry' + (show ? ' show' : '') + (k === cur ? ' cur' : '')); }
    h += cell(t({ tr: 'elde', en: 'carry' }), 'lbl small');
    h += cell('A', 'lbl') + cell('', '') + [...A].map((d, k) => cell(d, k === cur ? 'cur' : '')).join('') + cell('= ' + parseInt(A, 2), 'lbl small');
    h += cell('B', 'lbl') + cell('+', 'op') + [...B].map((d, k) => cell(d, k === cur ? 'cur' : '')).join('') + cell('= ' + parseInt(B, 2), 'lbl small');
    h += '<div class="ac-line"></div>';
    h += cell('', 'lbl') + cell(i >= 9 && overflow ? '1' : '', 'res ovf' + (i >= 9 && overflow ? ' show' : '')) + cols.map((c, k) => cell(isDone(k) ? c.s : '', 'res' + (k === cur ? ' cur' : ''))).join('') +
      cell(i >= 9 ? '= ' + (parseInt(A, 2) + parseInt(B, 2) & 255) : '', 'lbl small');
    grid.innerHTML = h;
    if (i === 0) adNote.innerHTML = t({ tr: 'Toplamaya en sağdaki sütundan başlıyoruz. ▶ ile ilerle.', en: 'We start from the rightmost column. Press ▶ to continue.' });
    else if (i <= 8) {
      const c = cols[cur], terms = [A[cur], B[cur]].concat(c.cin ? ['1 (' + t({ tr: 'elde', en: 'carry' }) + ')'] : []);
      adNote.innerHTML = terms.join(' + ') + ' = ' + c.sum + (c.sum >= 2 ? ' = <span class="bin">' + c.sum.toString(2) + '</span>₂' : '') + ' → ' +
        t({ tr: '<b>' + c.s + '</b> yaz' + (c.cout ? ', <b class="hex">1 elde</b> sola geçer.' : ', elde yok.'), en: 'write <b>' + c.s + '</b>' + (c.cout ? ', <b class="hex">carry 1</b> to the left.' : ', no carry.') });
    } else {
      const sa = parseInt(A, 2), sb = parseInt(B, 2);
      adNote.innerHTML = overflow
        ? t({ tr: sa + ' + ' + sb + ' = ' + (sa + sb) + ', ama bu 8 bite sığmıyor! En soldaki elde (kırmızı) 9. bit olurdu; 8 bitlik bir kutuda kaybolur ve sonuç <b>' + ((sa + sb) & 255) + '</b> görünür. Bu bir <b>taşmadır</b>.', en: sa + ' + ' + sb + ' = ' + (sa + sb) + ', but that does not fit in 8 bits! The leftmost carry (red) would be bit 9; in an 8-bit box it is lost and the result looks like <b>' + ((sa + sb) & 255) + '</b>. This is an <b>overflow</b>.' })
        : t({ tr: 'Sonuç: <b class="bin">' + cols.map((c) => c.s).join('') + '</b>₂ = ' + (sa + sb) + '. Kontrol: ' + sa + ' + ' + sb + ' = ' + (sa + sb) + ' ✓', en: 'Result: <b class="bin">' + cols.map((c) => c.s).join('') + '</b>₂ = ' + (sa + sb) + '. Check: ' + sa + ' + ' + sb + ' = ' + (sa + sb) + ' ✓' });
    }
  }
  compute();
  const adSt = NS.stepper($('#ad-stepper'), { count: 10, render: adRender, interval: 1500 });
  [aIn, bIn].forEach((x) => x.addEventListener('input', () => { compute(); adSt.reset(10); }));

  /* ---------- alıştırma ---------- */
  NS.practice($('#practice'), [
    { label: t({ tr: 'Binary → onlu', en: 'Binary → decimal' }), fn: GEN.binToDec },
    { label: t({ tr: 'Onlu → binary', en: 'Decimal → binary' }), fn: GEN.decToBin },
    { label: t({ tr: 'Kapasite', en: 'Capacity' }), fn: () => (Math.random() < 0.5 ? GEN.capacity() : GEN.maxValue()) },
  ]);
  void esc; void fmt;
})();
