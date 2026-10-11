/* Bölüm — Renkler ve görüntüler: ışık karışımı, RGB karıştırıcı, alfa, tahmin oyunu, piksel editörü, boyut hesabı */
(function () {
  const { t, $, $$, el, esc, pad, toBase, fmt, pick, shuffle, rand } = NS;
  const h2 = (v) => pad(toBase(v, 16), 2);
  const toHex = (r, g, b) => '#' + h2(r) + h2(g) + h2(b);
  const parseHex = (s) => {
    s = String(s).trim().replace(/^#/, '');
    if (/^[0-9a-f]{3}$/i.test(s)) s = s.split('').map((c) => c + c).join('');
    if (!/^[0-9a-f]{6}$/i.test(s)) return null;
    return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
  };
  const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const CH = [['R', 'var(--c-r)', { tr: 'Kırmızı', en: 'Red' }], ['G', 'var(--c-g)', { tr: 'Yeşil', en: 'Green' }], ['B', 'var(--c-b)', { tr: 'Mavi', en: 'Blue' }]];

  /* ---------- 1) ışık karışımı ---------- */
  const mixVals = [255, 255, 255];
  CH.forEach(([k, c, name], i) => {
    const row = el('div', { class: 'slider-row' });
    const s = el('input', { type: 'range', min: 0, max: 255, value: 255, 'aria-label': t(name) });
    const v = el('b', { class: 'mono', text: '255' });
    row.append(el('span', { style: 'color:' + c + ';font-weight:700', text: t(name) }), s, v);
    s.addEventListener('input', () => { mixVals[i] = +s.value; v.textContent = s.value; paintMix(); });
    $('#mix-sliders').append(row);
  });
  function paintMix() {
    $('#mix-r').setAttribute('fill', 'rgb(' + mixVals[0] + ',0,0)');
    $('#mix-g').setAttribute('fill', 'rgb(0,' + mixVals[1] + ',0)');
    $('#mix-b').setAttribute('fill', 'rgb(0,0,' + mixVals[2] + ')');
  }
  paintMix();

  /* ---------- 2) RGB karıştırıcı ---------- */
  let rgb = [255, 87, 51];
  const ctl = [];
  CH.forEach(([k, c, name], i) => {
    const row = el('div', { class: 'rgb-ch' });
    const top = el('div', { class: 'rgb-ch-top' });
    const num = el('input', { type: 'number', min: 0, max: 255, class: 'input mono rgb-num', 'aria-label': t(name) });
    top.append(el('span', { class: 'rgb-name', style: 'color:' + c, text: k + ' · ' + t(name) }), num);
    const s = el('input', { type: 'range', min: 0, max: 255, class: 'rgb-range rgb-' + k.toLowerCase(), 'aria-label': t(name) });
    const info = el('div', { class: 'rgb-info' });
    row.append(top, s, info);
    s.addEventListener('input', () => { rgb[i] = +s.value; update('slider'); });
    num.addEventListener('input', () => { rgb[i] = Math.max(0, Math.min(255, +num.value || 0)); update('num'); });
    ctl.push({ s, num, info });
    $('#rgb-sliders').append(row);
  });
  const hexIn = $('#rgb-hex'), pickIn = $('#rgb-pick'), sw = $('#rgb-swatch');
  hexIn.addEventListener('input', () => { const p = parseHex(hexIn.value); hexIn.classList.toggle('invalid', !p); if (p) { rgb = p; update('hex'); } });
  pickIn.addEventListener('input', () => { rgb = parseHex(pickIn.value); update('pick'); });
  function update(src) {
    const hex = toHex(...rgb);
    ctl.forEach((c, i) => {
      if (src !== 'slider') c.s.value = rgb[i];
      if (src !== 'num') c.num.value = rgb[i];
      const bits = pad(rgb[i].toString(2), 8);
      c.info.innerHTML = '<span class="mono hex">' + h2(rgb[i]) + '</span><span class="rgb-bits">' + [...bits].map((b) => '<i class="' + (b === '1' ? 'on' : '') + '" style="--c:' + CH[i][1] + '">' + b + '</i>').join('') + '</span><span class="muted mono">' + Math.round(rgb[i] / 2.55) + '%</span>';
      c.s.style.setProperty('--fill', (rgb[i] / 2.55) + '%');
    });
    if (src !== 'hex') { hexIn.value = hex; hexIn.classList.remove('invalid'); }
    if (src !== 'pick') pickIn.value = hex.toLowerCase();
    sw.style.background = hex;
    const dark = lum(...rgb) < 140;
    sw.style.color = dark ? '#fff' : '#000';
    sw.innerHTML = '<span class="mono">' + hex + '</span><small>rgb(' + rgb.join(', ') + ')' + (rgb[0] === rgb[1] && rgb[1] === rgb[2] ? ' · ' + t({ tr: 'gri', en: 'gray' }) : '') + '</small>';
    $('#rgb-css').innerHTML = '<code>color: <span class="hex">' + hex + '</span>;\ncolor: rgb(' + rgb.join(', ') + ');</code>';
    $('#rgb-p5').innerHTML = '<code>fill("' + hex + '");\nfill(' + rgb.join(', ') + ');</code>';
    $('#rgb-py').innerHTML = '<code>r, g, b = ' + rgb.join(', ') + '\nhex_kod = f"#{r:02X}{g:02X}{b:02X}"   # "' + hex + '"\nr = int("' + hex.slice(1, 3) + '", 16)                    # ' + rgb[0] + '</code>';
    paintAlpha();
  }

  /* ---------- 3) alfa ---------- */
  const al = $('#al-a');
  function paintAlpha() {
    const a = +al.value, [r, g, b] = rgb;
    $('#al-v').textContent = a;
    $('#al-sw').style.background = 'rgba(' + r + ',' + g + ',' + b + ',' + (a / 255).toFixed(3) + ')';
    $('#al-out').innerHTML =
      '<div class="stat"><div class="stat-label">CSS hex</div><div class="stat-value hex">' + toHex(r, g, b) + h2(a) + '</div></div>' +
      '<div class="stat"><div class="stat-label">CSS</div><div class="stat-value" style="font-size:.9rem">rgba(' + r + ', ' + g + ', ' + b + ', ' + (a / 255).toFixed(2) + ')</div></div>' +
      '<div class="stat"><div class="stat-label">p5.js</div><div class="stat-value" style="font-size:.9rem">fill(' + r + ', ' + g + ', ' + b + ', ' + a + ')</div></div>' +
      '<div class="stat"><div class="stat-label">' + t({ tr: 'Opaklık', en: 'Opacity' }) + '</div><div class="stat-value">%' + Math.round(a / 2.55) + '</div></div>';
  }
  al.addEventListener('input', paintAlpha);
  update();

  /* ---------- 4) tahmin oyunu ---------- */
  const LV = [0, 0x33, 0x66, 0x99, 0xcc, 0xff];
  const randColor = () => [pick(LV), pick(LV), pick(LV)];
  const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
  let gsRight = 0, gsTotal = 0, gsDone = false;
  function describe(c) {
    const lvl = (v) => (v >= 0xcc ? t({ tr: 'yüksek', en: 'high' }) : v >= 0x66 ? t({ tr: 'orta', en: 'medium' }) : t({ tr: 'düşük', en: 'low' }));
    return CH.map(([k, col], i) => '<b style="color:' + col + '">' + k + '=' + h2(c[i]) + '</b> (' + lvl(c[i]) + ')').join(', ');
  }
  function newGuess() {
    gsDone = false;
    const ans = randColor();
    const opts = [ans];
    while (opts.length < 4) { const c = randColor(); if (opts.every((o) => dist(o, c) > 150)) opts.push(c); }
    const mode = Math.random() < 0.5 ? 'hex' : 'swatch';
    const q = $('#gs-q'), box = $('#gs-opts'), msg = $('#gs-msg');
    msg.hidden = true;
    q.innerHTML = mode === 'hex'
      ? t({ tr: 'Hangi renk ', en: 'Which color is ' }) + '<span class="mono hex" style="font-size:1.4rem">' + toHex(...ans) + '</span>?'
      : t({ tr: 'Bu rengin kodu hangisi?', en: 'What is the code of this color?' }) + ' <span class="gs-sw" style="background:' + toHex(...ans) + '"></span>';
    box.innerHTML = '';
    box.className = 'guess-opts m-' + mode;
    shuffle(opts).forEach((c) => {
      const b = el('button', { type: 'button', class: 'gs-opt' });
      if (mode === 'hex') { b.style.background = toHex(...c); b.setAttribute('aria-label', toHex(...c)); }
      else b.innerHTML = '<span class="mono">' + toHex(...c) + '</span>';
      b.addEventListener('click', () => {
        if (gsDone) return; gsDone = true; gsTotal++;
        const ok = c === ans; if (ok) gsRight++;
        $$('.gs-opt', box).forEach((x) => (x.disabled = true));
        b.classList.add(ok ? 'correct' : 'wrong');
        [...box.children][opts.indexOf(ans) >= 0 ? [...box.children].findIndex((x) => (mode === 'hex' ? x.getAttribute('aria-label') : x.textContent) === toHex(...ans)) : 0].classList.add('correct');
        if (mode === 'hex') [...box.children].forEach((x) => { x.innerHTML = '<span class="mono gs-lbl">' + x.getAttribute('aria-label') + '</span>'; });
        msg.hidden = false; msg.className = 'msg ' + (ok ? 'good' : 'bad');
        msg.innerHTML = (ok ? '✓ ' : '✗ ') + toHex(...ans) + ': ' + describe(ans);
        $('#gs-score').textContent = gsRight + ' / ' + gsTotal;
      });
      box.append(b);
    });
  }
  $('#gs-next').addEventListener('click', newGuess);
  newGuess();

  /* ---------- 5) piksel editörü ---------- */
  const PAL = ['#000000', '#FFFFFF', '#FF0000', '#00C000', '#0060FF', '#FFD700', '#FF8800', '#8A2BE2', '#FFB6C1', '#808080'];
  let cur = '#FF0000', painting = false;
  const pix = Array(64).fill('#FFFFFF');
  const gridEl = $('#pix-grid'), dump = $('#pix-dump');
  PAL.forEach((c) => {
    const b = el('button', { type: 'button', class: 'pal' + (c === cur ? ' on' : ''), style: 'background:' + c, 'aria-label': c, title: c });
    b.addEventListener('click', () => { cur = c; $$('.pal').forEach((x) => x.classList.toggle('on', x === b)); });
    $('#pix-pal').append(b);
  });
  for (let i = 0; i < 64; i++) {
    const c = el('button', { type: 'button', class: 'px', 'data-i': i, 'aria-label': t({ tr: 'piksel ', en: 'pixel ' }) + (i % 8) + ',' + Math.floor(i / 8) });
    c.addEventListener('pointerdown', (e) => { e.preventDefault(); painting = true; paint(i); });
    c.addEventListener('pointerenter', () => { if (painting) paint(i); hl(i); });
    c.addEventListener('pointerleave', () => hl(-1));
    c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); paint(i); } });
    gridEl.append(c);
  }
  window.addEventListener('pointerup', () => { painting = false; });
  function paint(i) { pix[i] = cur; drawPix(); }
  function hl(i) { $$('.pd-px', dump).forEach((d) => d.classList.toggle('hl', +d.dataset.i === i)); $$('.px', gridEl).forEach((d) => d.classList.toggle('hl', +d.dataset.i === i)); }
  function drawPix() {
    $$('.px', gridEl).forEach((c, i) => { c.style.background = pix[i]; });
    let h = '';
    for (let y = 0; y < 8; y++) {
      h += '<div class="pd-row"><span class="pd-off">' + pad(toBase(y * 24, 16), 3) + '</span>';
      for (let x = 0; x < 8; x++) {
        const i = y * 8 + x, c = parseHex(pix[i]);
        h += '<span class="pd-px" data-i="' + i + '"><i style="color:var(--c-r)">' + h2(c[0]) + '</i><i style="color:var(--c-g)">' + h2(c[1]) + '</i><i style="color:var(--c-b)">' + h2(c[2]) + '</i></span>';
      }
      h += '</div>';
    }
    dump.innerHTML = h;
    $$('.pd-px', dump).forEach((d) => { d.addEventListener('mouseenter', () => hl(+d.dataset.i)); d.addEventListener('mouseleave', () => hl(-1)); });
    const used = new Set(pix).size;
    $('#pix-stats').innerHTML =
      '<div class="stat"><div class="stat-label">' + t({ tr: 'Piksel', en: 'Pixels' }) + '</div><div class="stat-value">8 × 8 = 64</div></div>' +
      '<div class="stat"><div class="stat-label">RGB</div><div class="stat-value hex">64 × 3 = 192 B</div></div>' +
      '<div class="stat"><div class="stat-label">' + t({ tr: 'Kullanılan renk', en: 'Colors used' }) + '</div><div class="stat-value">' + used + '</div></div>';
  }
  const DEMO = [
    '..YYYY..', '.YYYYYY.', 'YYKYYKYY', 'YYYYYYYY', 'YKYYYYKY', 'YYKKKKYY', '.YYYYYY.', '..YYYY..',
  ];
  $('#pix-demo').addEventListener('click', () => { DEMO.join('').split('').forEach((ch, i) => { pix[i] = ch === 'Y' ? '#FFD700' : ch === 'K' ? '#000000' : '#FFFFFF'; }); drawPix(); });
  $('#pix-clear').addEventListener('click', () => { pix.fill('#FFFFFF'); drawPix(); });
  $('#pix-demo').click();

  /* ---------- 6) boyut hesabı ---------- */
  const W = $('#sz-w'), H = $('#sz-h'), D = $('#sz-d');
  [['Full HD', 1920, 1080], ['4K', 3840, 2160], [t({ tr: 'Telefon 12 MP', en: 'Phone 12 MP' }), 4000, 3000], [t({ tr: 'Simge', en: 'Icon' }), 64, 64]].forEach(([l, w, h]) => {
    const b = el('button', { type: 'button', class: 'btn ghost sm', text: l });
    b.addEventListener('click', () => { W.value = w; H.value = h; size(); });
    $('#sz-presets').append(b);
  });
  const human = (b) => {
    const u = ['B', 'KiB', 'MiB', 'GiB']; let i = 0;
    while (b >= 1024 && i < 3) { b /= 1024; i++; }
    return b.toLocaleString(NS.LANG === 'en' ? 'en-US' : 'tr-TR', { maximumFractionDigits: 2 }) + ' ' + u[i];
  };
  function size() {
    const w = Math.max(1, +W.value || 1), h = Math.max(1, +H.value || 1), d = +D.value;
    const px = w * h, bytes = Math.ceil(px * d / 8);
    $('#sz-out').innerHTML =
      '<div class="stat"><div class="stat-label">' + t({ tr: 'Piksel', en: 'Pixels' }) + '</div><div class="stat-value">' + fmt(px) + '</div></div>' +
      '<div class="stat"><div class="stat-label">' + t({ tr: 'Renk sayısı', en: 'Colors' }) + '</div><div class="stat-value">2<sup>' + Math.min(d, 24) + '</sup>' + (d === 32 ? ' + α' : '') + '</div></div>' +
      '<div class="stat"><div class="stat-label">' + t({ tr: 'Ham boyut', en: 'Raw size' }) + '</div><div class="stat-value hex">' + human(bytes) + '</div></div>' +
      '<div class="stat"><div class="stat-label">' + t({ tr: '60 fps video, 1 sn', en: '60 fps video, 1 s' }) + '</div><div class="stat-value">' + human(bytes * 60) + '</div></div>';
    $('#sz-foot').innerHTML = fmt(w) + ' × ' + fmt(h) + ' × ' + d + ' bit ÷ 8 = ' + fmt(bytes) + ' byte. ' +
      t({ tr: 'Sıkıştırılmamış bir videoda her saniye 60 kare olduğunu düşün: video sıkıştırma olmadan internetten film izlemek imkânsız olurdu.', en: 'An uncompressed video has 60 such frames every second: without compression, streaming films would be impossible.' });
  }
  [W, H].forEach((x) => x.addEventListener('input', size)); D.addEventListener('change', size);
  size();

  /* ---------- alıştırma ---------- */
  NS.practice($('#practice'), [
    { label: t({ tr: 'Hex → kanal değeri', en: 'Hex → channel value' }), fn: GEN.colorChannel },
    { label: t({ tr: 'RGB → hex', en: 'RGB → hex' }), fn: GEN.rgbToHex },
  ]);
  void esc; void rand;
})();
