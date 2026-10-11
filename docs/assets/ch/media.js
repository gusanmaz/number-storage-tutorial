/* Bölüm 7 — Renk, resim ve ses */
(function () {
  const { t, $, $$, el, esc, fmt, pad, toBase, knob, out, tryIt, human, rand, pick } = NS;
  const hx = (v) => pad(toBase(v, 16), 2);
  const hex3 = (r, g, b) => '#' + hx(r) + hx(g) + hx(b);

  /* ---------- Şekil 1: üç ışık ---------- */
  const rgb = [255, 136, 0];
  const cv = $('#rgb-cv'), cx = cv.getContext('2d');
  const CH = [['R', { tr: 'Kırmızı', en: 'Red' }, '#ff3b30'], ['G', { tr: 'Yeşil', en: 'Green' }, '#34c759'], ['B', { tr: 'Mavi', en: 'Blue' }, '#2f6bff']];
  const rows = CH.map(([k, l, col], i) => {
    const r = el('div', { class: 'rgb-row' });
    const rng = el('input', { type: 'range', min: '0', max: '255', value: String(rgb[i]), 'aria-label': t(l), style: 'accent-color:' + col });
    rng.addEventListener('input', () => { rgb[i] = +rng.value; drawRgb(); });
    r.append(el('span', { class: 'rgb-k', style: 'color:' + col, text: k }), rng, el('span', { class: 'rgb-v' }));
    $('#rgb-ctl').append(r);
    return r;
  });
  const mix = el('div', { class: 'rgb-mix' });
  $('#rgb-ctl').append(mix);
  function drawRgb() {
    const W = cv.width, H = cv.height;
    cx.globalCompositeOperation = 'source-over';
    cx.fillStyle = '#0b0a08'; cx.fillRect(0, 0, W, H);
    cx.globalCompositeOperation = 'lighter';
    const R = 92, P = [[W / 2, 112], [W / 2 - 58, 196], [W / 2 + 58, 196]];
    P.forEach(([x, y], i) => { const c = [0, 0, 0]; c[i] = rgb[i]; cx.fillStyle = 'rgb(' + c.join(',') + ')'; cx.beginPath(); cx.arc(x, y, R, 0, Math.PI * 2); cx.fill(); });
    cx.globalCompositeOperation = 'source-over';
    rows.forEach((r, i) => { $('.rgb-v', r).innerHTML = '<span class="d">' + pad(rgb[i], 3, ' ') + '</span> <span class="h">' + hx(rgb[i]) + '</span> <span class="b">' + pad(rgb[i].toString(2), 8) + '</span>'; });
    const h = hex3(...rgb);
    mix.innerHTML = '<span class="rgb-sw" style="background:' + h + '"></span><span><b class="h">' + h + '</b><br><span class="muted mono">rgb(' + rgb.join(', ') + ')</span></span>';
  }
  drawRgb();

  /* ---------- Şekil 2: hex renk düzenleyici ---------- */
  let hexd = 'FF8800'.split('');
  const ed = $('#hexed');
  function drawHex() {
    const h = '#' + hexd.join(''), r = parseInt(hexd[0] + hexd[1], 16), g = parseInt(hexd[2] + hexd[3], 16), b = parseInt(hexd[4] + hexd[5], 16);
    ed.innerHTML = '<span class="hx-sharp">#</span>' + hexd.map((d, i) => '<span class="hx-d c' + Math.floor(i / 2) + '"><button type="button" data-i="' + i + '" data-d="1" aria-label="+">▲</button><b tabindex="0" data-i="' + i + '">' + d + '</b><button type="button" data-i="' + i + '" data-d="-1" aria-label="−">▼</button><small>' + (i % 2 ? '×1' : '×16') + '</small></span>').join('') +
      '<span class="hx-sw" style="background:' + h + '"></span>';
    $('#hex-out').innerHTML = '<span class="c0">' + hexd[0] + hexd[1] + '</span><span class="c1">' + hexd[2] + hexd[3] + '</span><span class="c2">' + hexd[4] + hexd[5] + '</span> → rgb(<span class="c0">' + r + '</span>, <span class="c1">' + g + '</span>, <span class="c2">' + b + '</span>)' +
      '<div class="tell">' + t({ tr: 'Bellekte 3 byte: ', en: '3 bytes in memory: ' }) + '<span class="b">' + [r, g, b].map((v) => pad(v.toString(2), 8)).join(' ') + '</span></div>';
  }
  const bump = (i, d) => { hexd[i] = toBase((parseInt(hexd[i], 16) + d + 16) % 16, 16); drawHex(); const f = $('b[data-i="' + i + '"]', ed); f && f.focus(); };
  ed.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) bump(+b.dataset.i, +b.dataset.d); });
  ed.addEventListener('keydown', (e) => {
    const f = e.target.closest('b[data-i]'); if (!f) return;
    const i = +f.dataset.i;
    if (e.key === 'ArrowUp') { bump(i, 1); e.preventDefault(); } else if (e.key === 'ArrowDown') { bump(i, -1); e.preventDefault(); }
    else if (/^[0-9a-f]$/i.test(e.key)) { hexd[i] = e.key.toUpperCase(); drawHex(); const n = $('b[data-i="' + Math.min(5, i + 1) + '"]', ed); n && n.focus(); }
  });
  ['FF8800', '0E7C86', 'FFFF00', 'FF00FF', '00FFFF', '808080', 'FFFFFF', '000000', '1E90FF'].forEach((c) => $('#hex-pre').append(el('button', { type: 'button', class: 'chip', html: '<i class="sw" style="background:#' + c + '"></i>#' + c, onclick: () => { hexd = c.split(''); drawHex(); } })));
  drawHex();

  /* ---------- Şekil 3: renk derinliği ---------- */
  const dc = $('#depth-cv'), dx = dc.getContext('2d');
  function paintScene(c, W, H) {
    let g = c.createLinearGradient(0, 0, 0, H * 0.62);
    g.addColorStop(0, '#1b2a6b'); g.addColorStop(0.45, '#8a3d8f'); g.addColorStop(0.8, '#f2734a'); g.addColorStop(1, '#ffd27a');
    c.fillStyle = g; c.fillRect(0, 0, W, H * 0.62);
    g = c.createRadialGradient(W * 0.62, H * 0.6, 4, W * 0.62, H * 0.6, 120);
    g.addColorStop(0, 'rgba(255,250,220,1)'); g.addColorStop(0.28, 'rgba(255,214,120,0.95)'); g.addColorStop(1, 'rgba(255,160,90,0)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    g = c.createLinearGradient(0, H * 0.62, 0, H);
    g.addColorStop(0, '#e2865a'); g.addColorStop(0.3, '#7b3f6e'); g.addColorStop(1, '#141a40');
    c.fillStyle = g; c.fillRect(0, H * 0.62, W, H);
    c.fillStyle = 'rgba(255,220,150,0.5)';
    for (let i = 0; i < 9; i++) { const y = H * 0.64 + i * 10, w = 90 - i * 8; c.fillRect(W * 0.62 - w / 2, y, w, 3); }
    c.fillStyle = '#2a1636';
    c.beginPath(); c.moveTo(0, H * 0.62); c.quadraticCurveTo(W * 0.15, H * 0.42, W * 0.32, H * 0.6); c.lineTo(W * 0.32, H * 0.62); c.closePath(); c.fill();
  }
  paintScene(dx, dc.width, dc.height);
  const orig = dx.getImageData(0, 0, dc.width, dc.height);
  function drawDepth() {
    const bits = +$('#depth-r').value, L = 2 ** bits, img = new ImageData(new Uint8ClampedArray(orig.data), orig.width, orig.height), d = img.data;
    for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) d[i + k] = Math.round(Math.round(d[i + k] / 255 * (L - 1)) * 255 / (L - 1));
    dx.putImageData(img, 0, 0);
    $('#depth-v').textContent = bits;
    $('#depth-out').innerHTML = t({ tr: 'Kanal başına ' + L + ' seviye → ', en: L + ' levels per channel → ' }) + L + '³ = <b class="d">' + fmt(L ** 3) + '</b> ' + t({ tr: 'renk', en: 'colors' }) + ' · ' + 3 * bits + ' bit/piksel';
  }
  $('#depth-r').addEventListener('input', drawDepth);
  drawDepth();

  /* ---------- Şekil 4: piksel ızgarası ---------- */
  const PAL = { '.': '#8ED1FC', y: '#FFD23F', o: '#FF8800', k: '#3A2A1A', w: '#FFFFFF', g: '#3BA55C', d: '#23703F', b: '#1E6FD9', s: '#F2E3B3' };
  const ART = [
    '................',
    '..y...y...y.....',
    '....yyyyy....ww.',
    '.y.yyyyyyy..wwww',
    '..yykyyykyy..ww.',
    '.yyyyyyyyyy.....',
    '..yykyyykyy.....',
    '.y.yykkkyy......',
    '....yyyyy.......',
    '..y...y...y.....',
    '..........ggg...',
    '.....gggggggggg.',
    '..gggggggdggggggg',
    'gggdggggggggdggg',
    'bbbbbbbbbbbbbbbb',
    'bbwbbbbbbbwbbbbb',
  ].map((r) => r.slice(0, 16).padEnd(16, '.'));
  let pixels = ART.map((r) => [...r].map((c) => PAL[c]));
  let pr = 4, pc = 4, brush = null, nums = false, painting = false;
  const pix = $('#pix');
  function drawPix() {
    pix.classList.toggle('nums', nums);
    pix.innerHTML = pixels.map((row, r) => row.map((c, k) => '<i data-r="' + r + '" data-c="' + k + '" class="' + (r === pr && k === pc ? 'sel' : '') + '" style="background:' + c + ';color:' + (lum(c) > 140 ? '#000' : '#fff') + '">' + (nums ? c.slice(1, 3) : '') + '</i>').join('')).join('');
    const c = pixels[pr][pc], r = parseInt(c.slice(1, 3), 16), g = parseInt(c.slice(3, 5), 16), b = parseInt(c.slice(5, 7), 16), off = (pr * 16 + pc) * 3;
    $('#pix-info').innerHTML = '<span class="rgb-sw" style="background:' + c + '"></span><div><b>' + t({ tr: 'Satır ', en: 'Row ' }) + pr + ', ' + t({ tr: 'sütun ', en: 'column ' }) + pc + '</b><br><span class="h mono">' + c + '</span> <span class="muted mono">rgb(' + r + ', ' + g + ', ' + b + ')</span><br><span class="mono" style="font-size:13px">' + t({ tr: 'byte ', en: 'byte ' }) + '(' + pr + ' × 16 + ' + pc + ') × 3 = <b>' + off + '</b></span></div>';
    let bh = '';
    for (let k = 0; k < 16; k++) { const q = pixels[pr][k]; bh += '<span class="pb' + (k === pc ? ' sel' : '') + '">' + q.slice(1).match(/../g).join(' ') + '</span>'; }
    $('#pix-bytes').innerHTML = '<div class="muted" style="font-size:12px;margin-bottom:.2rem">' + t({ tr: 'Satır ' + pr + ' bellekte (byte ' + pr * 48 + '–' + (pr * 48 + 47) + '):', en: 'Row ' + pr + ' in memory (bytes ' + pr * 48 + '–' + (pr * 48 + 47) + '):' }) + '</div>' + bh +
      '<div class="muted" style="font-size:12px;margin-top:.4rem">' + t({ tr: 'Toplam: 16 × 16 × 3 = <b>768 byte</b>', en: 'Total: 16 × 16 × 3 = <b>768 bytes</b>' }) + '</div>';
  }
  const lum = (c) => 0.3 * parseInt(c.slice(1, 3), 16) + 0.59 * parseInt(c.slice(3, 5), 16) + 0.11 * parseInt(c.slice(5, 7), 16);
  const hit = (e) => { const p = document.elementFromPoint(e.clientX, e.clientY); return p && p.closest && p.closest('#pix i'); };
  function act(cell) { if (!cell) return; pr = +cell.dataset.r; pc = +cell.dataset.c; if (brush) pixels[pr][pc] = brush; drawPix(); }
  pix.addEventListener('pointerdown', (e) => { painting = true; if (brush) { pix.setPointerCapture(e.pointerId); e.preventDefault(); } act(hit(e)); });
  pix.addEventListener('pointermove', (e) => { if (painting && brush) { const c = hit(e); if (c && (+c.dataset.r !== pr || +c.dataset.c !== pc)) act(c); } });
  addEventListener('pointerup', () => { painting = false; });
  const pal = el('div', { class: 'pal' });
  const pbtn = [el('button', { type: 'button', class: 'pal-b on', text: t({ tr: 'İncele', en: 'Inspect' }), onclick: (e) => setBrush(null, e.currentTarget) })];
  ['#FF8800', '#FFD23F', '#3BA55C', '#1E6FD9', '#FFFFFF', '#3A2A1A', '#E0245E', '#8ED1FC'].forEach((c) => pbtn.push(el('button', { type: 'button', class: 'pal-b sw', style: 'background:' + c, 'aria-label': c, onclick: (e) => setBrush(c, e.currentTarget) })));
  function setBrush(c, b) { brush = c; pbtn.forEach((x) => x.classList.toggle('on', x === b)); pix.classList.toggle('paint', !!c); }
  pal.append(...pbtn);
  $('#pix-ctl').append(pal,
    el('button', { type: 'button', class: 'btn sm', text: t({ tr: 'Sayıları göster', en: 'Show numbers' }), onclick: (e) => { nums = !nums; e.currentTarget.classList.toggle('on', nums); drawPix(); } }),
    el('button', { type: 'button', class: 'btn sm ghost', text: t({ tr: 'Sıfırla', en: 'Reset' }), onclick: () => { pixels = ART.map((r) => [...r].map((c) => PAL[c])); drawPix(); } }));
  drawPix();

  /* ---------- boyut cümleleri ---------- */
  let iw = 1920, ih = 1080;
  const drawImg = () => out(null, 'img', fmt(iw * ih * 3) + ' byte ≈ ' + human(iw * ih * 3));
  knob($('#k-w'), { value: 1920, min: 16, max: 8000, step: 16, px: 2, fmt: (v) => fmt(v), onChange: (v) => { iw = v; drawImg(); } });
  knob($('#k-h'), { value: 1080, min: 16, max: 6000, step: 8, px: 2, fmt: (v) => fmt(v), onChange: (v) => { ih = v; drawImg(); } });
  drawImg();
  const drawWav = (m) => out(null, 'wav', '≈ ' + human(44100 * 2 * 2 * 60 * m));
  knob($('#k-min'), { value: 3, min: 1, max: 120, onChange: drawWav });
  drawWav(3);

  /* ---------- Şekil 5: örnekleme ---------- */
  const wv = $('#wave');
  function drawWave() {
    const f = +$('#w-f').value, R = +$('#w-r').value, bits = +$('#w-b').value, L = 2 ** bits;
    $('#w-fv').textContent = f + ' Hz'; $('#w-rv').textContent = R; $('#w-bv').textContent = bits + ' (' + L + ' ' + t({ tr: 'seviye', en: 'levels' }) + ')';
    const W = 900, H = 300, X0 = 20, X1 = W - 20, Y = (v) => H / 2 - v * (H / 2 - 22), X = (tt) => X0 + tt * (X1 - X0);
    const q = (v) => (L === 1 ? 0 : Math.round((v + 1) / 2 * (L - 1)) / (L - 1) * 2 - 1);
    let h = '';
    if (L <= 64) for (let k = 0; k < L; k++) { const y = Y(k / (L - 1) * 2 - 1); h += '<line x1="' + X0 + '" x2="' + X1 + '" y1="' + y + '" y2="' + y + '" stroke="var(--rule-2)" stroke-width="1"/>'; }
    let d = '';
    for (let i = 0; i <= 600; i++) { const tt = i / 600; d += (i ? 'L' : 'M') + X(tt).toFixed(1) + ' ' + Y(Math.sin(2 * Math.PI * f * tt)).toFixed(1); }
    h += '<path d="' + d + '" fill="none" stroke="var(--ink-3)" stroke-width="2" opacity=".7"/>';
    const S = [];
    for (let n = 0; n <= R; n++) S.push([n / R, q(Math.sin(2 * Math.PI * f * n / R))]);
    let st = '';
    S.forEach(([tt, v], n) => { st += (n ? 'L' + X(tt).toFixed(1) + ' ' + Y(S[n - 1][1]).toFixed(1) : 'M' + X(tt).toFixed(1) + ' ' + Y(v).toFixed(1)) + 'L' + X(tt).toFixed(1) + ' ' + Y(v).toFixed(1); });
    h += '<path d="' + st + '" fill="none" stroke="var(--on-deep)" stroke-width="2.5"/>';
    const k = Math.round(f / R), fa = f - k * R, alias = f > R / 2;
    if (alias && fa !== 0) { let a = ''; for (let i = 0; i <= 600; i++) { const tt = i / 600; a += (i ? 'L' : 'M') + X(tt).toFixed(1) + ' ' + Y(Math.sin(2 * Math.PI * fa * tt)).toFixed(1); } h += '<path d="' + a + '" fill="none" stroke="var(--dec)" stroke-width="2" stroke-dasharray="6 5"/>'; }
    S.forEach(([tt, v]) => { h += '<circle cx="' + X(tt).toFixed(1) + '" cy="' + Y(v).toFixed(1) + '" r="4.5" fill="var(--on)" stroke="var(--card)" stroke-width="1.5"/>'; });
    wv.innerHTML = h;
    $('#w-tell').innerHTML = t({ tr: 'Salınım başına ', en: 'Samples per cycle: ' }) + '<b>' + fmt(R / f, 1) + '</b>' + t({ tr: ' örnek. ', en: '. ' }) +
      (alias ? '<span class="bad">' + t({ tr: 'Örtüşme!', en: 'Aliasing!' }) + '</span> ' + t({ tr: 'Örnekler, gerçekte olmayan ' + Math.abs(fa) + ' Hz’lik bir dalgaya (mavi kesikli) da tam uyuyor. Bilgisayar ikisini ayırt edemez.', en: 'The samples also fit a ' + Math.abs(fa) + ' Hz wave (dashed blue) that is not really there. The computer cannot tell them apart.' })
        : t({ tr: 'Nyquist sınırı: ' + R / 2 + ' Hz. Bu frekans güvenle yakalanıyor.', en: 'Nyquist limit: ' + R / 2 + ' Hz. This frequency is captured safely.' }));
  }
  ['#w-f', '#w-r', '#w-b'].forEach((s) => $(s).addEventListener('input', drawWave));
  drawWave();

  /* ---------- Şekil 6: dinle ---------- */
  let ac = null, src = null;
  const H = { bits: 16, rate: 44100, f: 440 };
  const segs = [
    ['bits', { tr: 'Bit derinliği', en: 'Bit depth' }, [16, 8, 4, 2, 1], (v) => v + ' bit'],
    ['rate', { tr: 'Örnekleme', en: 'Sample rate' }, [44100, 11025, 4000, 1500], (v) => fmt(v / 1000, 2) + ' kHz'],
    ['f', { tr: 'Ton', en: 'Tone' }, [440, 1760, 3000], (v) => fmt(v) + ' Hz'],
  ];
  const hear = $('#hear');
  segs.forEach(([k, l, vals, f]) => {
    const s = el('div', { class: 'seg', role: 'group', 'aria-label': t(l) });
    vals.forEach((v) => s.append(el('button', { type: 'button', 'aria-pressed': String(H[k] === v), text: f(v), onclick: (e) => { H[k] = v; $$('button', s).forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget))); drawHear(); } })));
    hear.append(el('div', { class: 'hear-row' }, [el('span', { class: 'hear-l', text: t(l) }), s]));
  });
  const mini = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  mini.setAttribute('class', 'hear-wave'); mini.setAttribute('viewBox', '0 0 600 120');
  const play = el('button', { class: 'btn fill', type: 'button', text: '▶ ' + t({ tr: 'Çal', en: 'Play' }), onclick: doPlay });
  hear.append(el('div', { class: 'hear-row center' }, [play]));
  hear.append(mini);
  const sample = (tt) => { const n = Math.floor(tt * H.rate), v = Math.sin(2 * Math.PI * H.f * n / H.rate); if (H.bits >= 16) return v; const L = 2 ** H.bits; return L === 2 ? (v >= 0 ? 1 : -1) : Math.round((v + 1) / 2 * (L - 1)) / (L - 1) * 2 - 1; };
  function drawHear() {
    let d = '';
    const span = 3 / H.f;
    for (let i = 0; i <= 600; i++) { const tt = i / 600 * span; d += (i ? 'L' : 'M') + i + ' ' + (60 - sample(tt) * 50).toFixed(1); }
    mini.innerHTML = '<line x1="0" x2="600" y1="60" y2="60" stroke="var(--rule-2)"/><path d="' + d + '" fill="none" stroke="var(--on-deep)" stroke-width="2"/>';
    const k = Math.round(H.f / H.rate), fa = Math.abs(H.f - k * H.rate);
    $('#hear-tell').innerHTML = (H.bits >= 16 ? fmt(65536) : 2 ** H.bits) + ' ' + t({ tr: 'seviye', en: 'levels' }) + ' · Nyquist ' + fmt(H.rate / 2) + ' Hz' +
      (H.f > H.rate / 2 ? ' · <span class="bad">' + t({ tr: 'Bu ton sınırın üstünde: ' + fmt(fa) + ' Hz gibi duyulacak.', en: 'This tone is above the limit: it will sound like ' + fmt(fa) + ' Hz.' }) + '</span>' : '');
  }
  function doPlay() {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (src) { try { src.stop(); } catch (e) { /* */ } }
      const sr = ac.sampleRate, N = Math.floor(sr * 1.2), buf = ac.createBuffer(1, N, sr), ch = buf.getChannelData(0);
      for (let i = 0; i < N; i++) { const tt = i / sr, env = Math.min(1, tt / 0.03, (1.2 - tt) / 0.08); ch[i] = sample(tt) * 0.15 * env; }
      src = ac.createBufferSource(); src.buffer = buf; src.connect(ac.destination); src.start();
    } catch (e) { $('#hear-tell').textContent = t({ tr: 'Tarayıcın ses çalmayı desteklemiyor.', en: 'Your browser cannot play audio.' }); }
  }
  drawHear();

  /* ---------- alıştırma ---------- */
  function imgSize() {
    const w = pick([10, 20, 50, 100, 64, 128]), h = pick([10, 20, 50, 100, 32, 64]), c = pick([1, 3, 4]);
    const nm = { 1: { tr: 'gri (1 byte/piksel)', en: 'grayscale (1 byte/pixel)' }, 3: { tr: 'RGB (3 byte/piksel)', en: 'RGB (3 bytes/pixel)' }, 4: { tr: 'RGBA (4 byte/piksel)', en: 'RGBA (4 bytes/pixel)' } }[c];
    return { q: t({ tr: w + ' × ' + h + ' piksellik ' + t(nm) + ' bir resim sıkıştırılmadan kaç byte?', en: 'How many bytes is an uncompressed ' + w + ' × ' + h + ' ' + t(nm) + ' image?' }), a: String(w * h * c), kind: 'dec', hint: t({ tr: 'genişlik × yükseklik × byte/piksel', en: 'width × height × bytes/pixel' }), explain: w + ' × ' + h + ' × ' + c + ' = <b>' + fmt(w * h * c) + '</b>' };
  }
  function colorCount() {
    const b = rand(1, 5);
    return { q: t({ tr: 'Kanal başına ' + b + ' bit (R, G, B) ile kaç farklı renk yapılır?', en: 'How many colors with ' + b + ' bits per channel (R, G, B)?' }), a: String(2 ** (3 * b)), kind: 'dec', hint: t({ tr: 'Toplam bit = 3 × ' + b, en: 'Total bits = 3 × ' + b }), explain: '2<sup>' + 3 * b + '</sup> = <b>' + fmt(2 ** (3 * b)) + '</b>' };
  }
  tryIt($('#try'), [
    { label: t({ tr: 'Hex → kanal', en: 'Hex → channel' }), fn: GEN.colorChannel },
    { label: t({ tr: 'RGB → hex', en: 'RGB → hex' }), fn: GEN.rgbToHex },
    { label: t({ tr: 'Renk sayısı', en: 'Color count' }), fn: colorCount },
    { label: t({ tr: 'Resim boyutu', en: 'Image size' }), fn: imgSize },
  ]);
})();
