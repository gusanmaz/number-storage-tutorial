/* Bölüm — Negatif sayılar: işaretli/işaretsiz yorum, ters çevir+1, sayı çemberi */
(function () {
  const { t, $, $$, el, esc, pad, toBase, group } = NS;

  /* ---------- 1) aynı bitler, iki yorum ---------- */
  const stats = $('#sg-stats'), expr = $('#sg-expr');
  const row = NS.bits($('#sg-bits'), {
    n: 8, value: 0xFB, group: 4, label: '8 bit',
    weight: (i) => (i === 0 ? '−128' : String(Math.pow(2, 7 - i))),
    cls: (i) => (i === 0 ? 'b-neg' : ''),
    onChange: update,
  });
  function update() {
    const u = row.value(), s = u >= 128 ? u - 256 : u, b = row.get();
    stats.innerHTML =
      '<div class="stat"><div class="stat-label">Binary</div><div class="stat-value bin">' + group(pad(u.toString(2), 8), 4) + '</div></div>' +
      '<div class="stat"><div class="stat-label">' + t({ tr: 'İşaretsiz', en: 'Unsigned' }) + ' <span lang="en">(uint8)</span></div><div class="stat-value dec">' + u + '</div></div>' +
      '<div class="stat"><div class="stat-label">' + t({ tr: 'İşaretli', en: 'Signed' }) + ' <span lang="en">(int8)</span></div><div class="stat-value ' + (s < 0 ? 'bad' : 'dec') + '">' + s + '</div></div>' +
      '<div class="stat"><div class="stat-label">Hex</div><div class="stat-value hex">' + pad(toBase(u, 16), 2) + '</div></div>';
    const parts = b.map((x, i) => (x ? (i === 0 ? -128 : Math.pow(2, 7 - i)) : null)).filter((x) => x != null);
    expr.innerHTML = t({ tr: 'İşaretli: ', en: 'Signed: ' }) + (parts.length ? parts.map((p, i) => (p < 0 ? '<b class="bad">' + p + '</b>' : (i ? '+ ' : '') + p)).join(' ').replace('</b> ', '</b> ') : '0') + ' = <b class="' + (s < 0 ? 'bad' : 'dec') + '">' + s + '</b>';
  }
  [[0, '0'], [1, '1'], [127, '127'], [128, '−128'], [255, '−1'], [251, '−5']].forEach(([v, l]) => {
    const btn = el('button', { type: 'button', class: 'btn ghost sm mono', text: l });
    btn.addEventListener('click', () => row.set(v));
    $('#sg-presets').append(btn);
  });
  update();

  /* ---------- 2) ters çevir + 1 ---------- */
  const nIn = $('#neg-n'), rowsBox = $('#neg-rows'), note = $('#neg-note');
  let X = 5;
  const bits8 = (v) => pad(((v % 256) + 256).toString(2).slice(-8), 8);
  const colored = (s, ref) => [...s].map((c, i) => '<span class="nb2' + (c === '1' ? ' on' : '') + (ref && ref[i] !== c ? ' chg' : '') + '">' + c + '</span>').join('');
  function render(i) {
    const start = bits8(X), inv = [...start].map((c) => (c === '1' ? '0' : '1')).join(''), res = bits8(-X);
    const signedOf = (s) => { const u = parseInt(s, 2); return u >= 128 ? u - 256 : u; };
    const rows = [
      [t({ tr: '1. Yaz', en: '1. Write' }), start, null, signedOf(start)],
      [t({ tr: '2. Ters çevir', en: '2. Flip' }), inv, start, signedOf(inv)],
      [t({ tr: '3. 1 ekle', en: '3. Add 1' }), res, inv, signedOf(res)],
    ];
    rowsBox.innerHTML = rows.slice(0, Math.min(i + 1, 3)).map((r, k) =>
      '<div class="neg-row fade-up"><span class="neg-lbl">' + r[0] + '</span><span class="neg-bits">' + colored(r[1], k === i ? r[2] : null) + '</span><span class="neg-val">= ' + r[3] + '</span></div>'
    ).join('');
    if (i === 0) note.innerHTML = t({ tr: X + ' sayısını 8 bit olarak yazıyoruz.' + (X < 0 ? ' (Negatif bir sayıyla başladık; aynı yöntem bizi pozitife götürecek.)' : ''), en: 'We write ' + X + ' in 8 bits.' + (X < 0 ? ' (We started with a negative number; the same method takes us to the positive.)' : '') });
    else if (i === 1) note.innerHTML = t({ tr: 'Bütün bitleri ters çevirdik (değişenler vurgulu). Bu “bire tümleyen” değeri: ' + signedOf(inv) + '. Henüz istediğimiz sayı değil; bir eksik.', en: 'We flipped every bit (changed bits highlighted). This “one’s complement” is ' + signedOf(inv) + ' — not quite there, it is one short.' });
    else if (i === 2) note.innerHTML = t({ tr: '1 ekledik. Sonuç: <b class="bin">' + res + '</b> = <b>' + (-X) + '</b>.', en: 'We added 1. Result: <b class="bin">' + res + '</b> = <b>' + (-X) + '</b>.' });
    else {
      const parts = [...res].map((c, k) => (c === '1' ? (k === 0 ? '−128' : String(Math.pow(2, 7 - k))) : null)).filter(Boolean);
      note.innerHTML = t({ tr: 'Kontrol (en sol bit −128): ', en: 'Check (leftmost bit −128): ' }) + (parts.join(' + ').replace('+ −', '− ') || '0') + ' = <b>' + (-X) + '</b> ✓. ' +
        t({ tr: 'Bir de toplayalım: ' + start + ' + ' + res + ' = 1 00000000 → 9. bit atılır → 0 ✓', en: 'Add them: ' + start + ' + ' + res + ' = 1 00000000 → the 9th bit is dropped → 0 ✓' });
    }
  }
  const st = NS.stepper($('#neg-stepper'), { count: 4, render, interval: 1800 });
  nIn.addEventListener('input', () => { X = Math.max(-127, Math.min(127, parseInt(nIn.value, 10) || 0)); st.reset(4); });

  /* ---------- 3) sayı çemberi ---------- */
  const svg = $('#wh-svg'), wnote = $('#wh-note');
  let mode = 's', pos = 0, timer = null;
  const C = 170, R1 = 140, R2 = 103;
  const sval = (p) => (p >= 8 ? p - 16 : p);
  const ang = (p) => (-90 + p * 22.5) * Math.PI / 180;
  function drawWheel() {
    let h = '<circle cx="' + C + '" cy="' + C + '" r="' + (R1 + 18) + '" fill="var(--surface-2)" stroke="var(--border)"/>';
    h += '<circle cx="' + C + '" cy="' + C + '" r="' + (R2 - 22) + '" fill="var(--surface)" stroke="var(--border)"/>';
    // taşma çizgisi
    const cut = mode === 'u' ? -0.5 : 7.5;
    const a = ang(cut);
    h += '<line x1="' + (C + Math.cos(a) * (R2 - 26)) + '" y1="' + (C + Math.sin(a) * (R2 - 26)) + '" x2="' + (C + Math.cos(a) * (R1 + 22)) + '" y2="' + (C + Math.sin(a) * (R1 + 22)) + '" stroke="var(--bad)" stroke-width="3" stroke-dasharray="5 4"/>';
    for (let p = 0; p < 16; p++) {
      const x1 = C + Math.cos(ang(p)) * R1, y1 = C + Math.sin(ang(p)) * R1;
      const x2 = C + Math.cos(ang(p)) * R2, y2 = C + Math.sin(ang(p)) * R2;
      const v = mode === 'u' ? p : sval(p);
      const cur = p === pos;
      if (cur) h += '<circle cx="' + x2 + '" cy="' + y2 + '" r="17" fill="var(--accent)"/>';
      h += '<text x="' + x1 + '" y="' + y1 + '" text-anchor="middle" dominant-baseline="central" font-family="var(--font-mono)" font-size="11" fill="' + (cur ? 'var(--text)' : 'var(--muted)') + '" font-weight="' + (cur ? 700 : 500) + '">' + pad(p.toString(2), 4) + '</text>';
      h += '<text x="' + x2 + '" y="' + y2 + '" text-anchor="middle" dominant-baseline="central" font-family="var(--font-mono)" font-size="15" font-weight="700" fill="' + (cur ? '#fff' : v < 0 ? 'var(--bad)' : 'var(--c-dec)') + '">' + v + '</text>';
    }
    // ibre
    const px = C + Math.cos(ang(pos)) * (R2 - 30), py = C + Math.sin(ang(pos)) * (R2 - 30);
    h += '<line x1="' + C + '" y1="' + C + '" x2="' + px + '" y2="' + py + '" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/>';
    h += '<circle cx="' + C + '" cy="' + C + '" r="6" fill="var(--accent)"/>';
    h += '<text x="' + C + '" y="' + (C + 26) + '" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="var(--font-sans)">' + esc(mode === 'u' ? t({ tr: 'işaretsiz', en: 'unsigned' }) : t({ tr: 'işaretli', en: 'signed' })) + '</text>';
    svg.innerHTML = h;
  }
  function move(d) {
    const old = pos;
    pos = ((pos + d) % 16 + 16) % 16;
    const vOld = mode === 'u' ? old : sval(old), vNew = mode === 'u' ? pos : sval(pos);
    const expected = vOld + d;
    const ovf = expected !== vNew;
    wnote.innerHTML = '<span class="mono">' + pad(old.toString(2), 4) + ' ' + (d > 0 ? '+ ' + d : '− ' + -d) + ' = ' + pad(pos.toString(2), 4) + '</span> &nbsp;→&nbsp; ' + vOld + (d > 0 ? ' + ' + d : ' − ' + -d) + ' = <b>' + vNew + '</b>' +
      (ovf ? ' <b class="bad">' + t({ tr: '⚠ Taşma! Gerçek sonuç ' + expected + ' olmalıydı ama 4 bite sığmıyor; çember başa sardı.', en: '⚠ Overflow! The real result is ' + expected + ', which does not fit in 4 bits; the wheel wrapped around.' }) + '</b>' : '');
    drawWheel();
  }
  $$('#wh-mode button').forEach((b) => b.addEventListener('click', () => {
    mode = b.dataset.mode;
    $$('#wh-mode button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    drawWheel();
    wnote.innerHTML = mode === 'u'
      ? t({ tr: 'İşaretsiz yorumda taşma noktası 15 ile 0 arasındadır.', en: 'In the unsigned view the overflow point is between 15 and 0.' })
      : t({ tr: 'İşaretli yorumda taşma noktası 7 ile −8 arasındadır. Sol bit 1 olan her sayı negatiftir.', en: 'In the signed view the overflow point is between 7 and −8. Every pattern starting with 1 is negative.' });
  }));
  const stopPlay = () => { clearInterval(timer); timer = null; $('#wh-play').textContent = t({ tr: '▶ Oynat', en: '▶ Play' }); };
  $('#wh-p').addEventListener('click', () => { stopPlay(); move(1); });
  $('#wh-m').addEventListener('click', () => { stopPlay(); move(-1); });
  $('#wh-p3').addEventListener('click', () => { stopPlay(); move(3); });
  $('#wh-play').addEventListener('click', (e) => {
    if (timer) return stopPlay();
    e.target.textContent = t({ tr: '⏸ Durdur', en: '⏸ Stop' });
    timer = setInterval(() => move(1), 800);
  });
  drawWheel();
  wnote.innerHTML = t({ tr: 'İşaretli yorumdasın. +1’e basarak 7’den sonra ne olduğunu gör.', en: 'You are in the signed view. Press +1 and see what comes after 7.' });

  /* ---------- alıştırma ---------- */
  NS.practice($('#practice'), [
    { label: t({ tr: 'Onlu → 8 bit ikiye tümleyen', en: 'Decimal → 8-bit two’s complement' }), fn: GEN.twosEncode },
    { label: t({ tr: '8 bit → işaretli onlu', en: '8 bits → signed decimal' }), fn: GEN.twosDecode },
  ]);
})();
