/* Bölüm — Ses: örnekleme + nicemleme görselleştirmesi (dinlenebilir), ses boyutu hesabı */
(function () {
  const { t, $, el, fmt, pick } = NS;
  const nf = (x, d) => x.toLocaleString(NS.LANG === 'en' ? 'en-US' : 'tr-TR', { maximumFractionDigits: d == null ? 2 : d });
  const human = (b) => { const u = ['B', 'KiB', 'MiB', 'GiB']; let i = 0; while (b >= 1024 && i < 3) { b /= 1024; i++; } return nf(b) + ' ' + u[i]; };

  /* ---------- 1) örnekleme ---------- */
  const F = $('#sp-f'), R = $('#sp-r'), B = $('#sp-b'), svg = $('#sp-svg'), stats = $('#sp-stats'), msg = $('#sp-msg');
  const W = 640, H = 240, M = 14;
  const quant = (v, bits) => { if (bits >= 16) return v; const L = Math.pow(2, bits); return Math.round((v + 1) / 2 * (L - 1)) / (L - 1) * 2 - 1; };
  function draw() {
    const f = +F.value, sr = +R.value, bits = +B.value;
    const T = 2 / f; // iki periyot
    const X = (tt) => M + (W - 2 * M) * tt / T, Y = (v) => H / 2 - v * (H / 2 - M);
    let h = '';
    // seviye çizgileri
    if (bits <= 4) {
      const L = Math.pow(2, bits);
      for (let k = 0; k < L; k++) { const v = k / (L - 1) * 2 - 1; h += '<line x1="' + M + '" x2="' + (W - M) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="var(--border)" stroke-dasharray="3 4"/>'; }
    }
    h += '<line x1="' + M + '" x2="' + (W - M) + '" y1="' + H / 2 + '" y2="' + H / 2 + '" stroke="var(--border-strong)"/>';
    // gerçek dalga
    let d = '';
    for (let i = 0; i <= 400; i++) { const tt = T * i / 400; d += (i ? 'L' : 'M') + X(tt).toFixed(1) + ' ' + Y(Math.sin(2 * Math.PI * f * tt)).toFixed(1); }
    h += '<path d="' + d + '" fill="none" stroke="var(--muted)" stroke-width="2" opacity=".7"/>';
    // örnekler ve basamaklar
    const n = Math.floor(T * sr) + 1;
    let st = '', dots = '';
    for (let k = 0; k < n; k++) {
      const tt = k / sr, v = quant(Math.sin(2 * Math.PI * f * tt), bits), x = X(tt), x2 = X(Math.min(T, (k + 1) / sr));
      st += (k ? 'L' + x.toFixed(1) + ' ' + Y(v).toFixed(1) : 'M' + x.toFixed(1) + ' ' + Y(v).toFixed(1)) + 'L' + x2.toFixed(1) + ' ' + Y(v).toFixed(1);
      if (n <= 120) dots += '<circle cx="' + x.toFixed(1) + '" cy="' + Y(Math.sin(2 * Math.PI * f * tt)).toFixed(1) + '" r="3.5" fill="var(--c-hex)"/>';
    }
    h += '<path d="' + st + '" fill="none" stroke="var(--accent)" stroke-width="2.5"/>' + dots;
    svg.innerHTML = h;
    const L = Math.pow(2, bits);
    stats.innerHTML =
      '<div class="stat"><div class="stat-label">' + t({ tr: 'Periyot başına örnek', en: 'Samples per cycle' }) + '</div><div class="stat-value">' + nf(sr / f, 1) + '</div></div>' +
      '<div class="stat"><div class="stat-label">' + t({ tr: 'Seviye', en: 'Levels' }) + '</div><div class="stat-value">2<sup>' + bits + '</sup> = ' + fmt(L) + '</div></div>' +
      '<div class="stat"><div class="stat-label">' + t({ tr: 'Nyquist sınırı', en: 'Nyquist limit' }) + '</div><div class="stat-value">' + fmt(sr / 2) + ' Hz</div></div>' +
      '<div class="stat"><div class="stat-label">' + t({ tr: 'Mono, 1 saniye', en: 'Mono, 1 second' }) + '</div><div class="stat-value hex">' + human(sr * bits / 8) + '</div></div>';
    if (sr < 2 * f) {
      const alias = Math.abs(f - Math.round(f / sr) * sr);
      msg.hidden = false; msg.className = 'msg bad';
      msg.innerHTML = t({ tr: '⚠ <b>Aliasing!</b> Örnekleme hızı (' + fmt(sr) + ' Hz), frekansın iki katından (' + fmt(2 * f) + ' Hz) küçük. Ölçümler gerçek dalgayı değil, yaklaşık <b>' + fmt(alias) + ' Hz</b>’lik sahte bir dalgayı tarif ediyor. Dinleyince farkı duyacaksın.', en: '⚠ <b>Aliasing!</b> The sample rate (' + fmt(sr) + ' Hz) is below twice the frequency (' + fmt(2 * f) + ' Hz). The samples describe a fake wave of about <b>' + fmt(alias) + ' Hz</b>. You will hear it.' });
    } else if (bits <= 2) {
      msg.hidden = false; msg.className = 'msg warn';
      msg.innerHTML = t({ tr: 'Sadece ' + L + ' seviye var: her ölçüm kabaca yuvarlanıyor. Basamaklar ile gerçek dalga arasındaki fark <b>nicemleme gürültüsü</b> olarak duyulur.', en: 'Only ' + L + ' levels: every sample is rounded coarsely. The gap between the steps and the real wave is heard as <b>quantization noise</b>.' });
    } else msg.hidden = true;
  }
  [F, R, B].forEach((x) => x.addEventListener('change', draw));
  draw();

  let ctx = null;
  function play(digital) {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      const f = +F.value, sr = +R.value, bits = +B.value, rate = ctx.sampleRate, len = rate;
      const buf = ctx.createBuffer(1, len, rate), data = buf.getChannelData(0);
      let held = 0, next = 0;
      for (let i = 0; i < len; i++) {
        const tt = i / rate;
        let v;
        if (!digital) v = Math.sin(2 * Math.PI * f * tt);
        else { if (tt >= next) { const k = Math.floor(tt * sr); held = quant(Math.sin(2 * Math.PI * f * k / sr), bits); next = (k + 1) / sr; } v = held; }
        const env = Math.min(1, i / (rate * 0.02), (len - i) / (rate * 0.02));
        data[i] = v * 0.18 * env;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf; src.connect(ctx.destination); src.start();
    } catch (e) {
      msg.hidden = false; msg.className = 'msg warn'; msg.textContent = t({ tr: 'Tarayıcın Web Audio API’yi desteklemiyor.', en: 'Your browser does not support the Web Audio API.' });
    }
  }
  $('#sp-play-o').addEventListener('click', () => play(false));
  $('#sp-play-d').addEventListener('click', () => play(true));

  /* ---------- 2) ses boyutu ---------- */
  const r = $('#as-r'), b = $('#as-b'), c = $('#as-c'), m = $('#as-m'), out = $('#as-out'), foot = $('#as-foot');
  [['CD', 44100, 16, 2], [t({ tr: 'Telefon', en: 'Phone call' }), 8000, 8, 1], [t({ tr: 'Stüdyo', en: 'Studio' }), 96000, 24, 2], ['Podcast', 44100, 16, 1]].forEach(([l, sr, bits, ch]) => {
    const btn = el('button', { type: 'button', class: 'btn ghost sm', text: l });
    btn.addEventListener('click', () => { r.value = sr; b.value = bits; c.value = ch; size(); });
    $('#as-presets').append(btn);
  });
  function size() {
    const sr = Math.max(1, +r.value || 1), bits = +b.value, ch = +c.value, sec = Math.max(0, +m.value || 0) * 60;
    const bps = sr * bits * ch, bytes = bps / 8 * sec;
    out.innerHTML =
      '<div class="stat"><div class="stat-label">' + t({ tr: 'Bit hızı', en: 'Bit rate' }) + '</div><div class="stat-value">' + nf(bps / 1000, 1) + ' kbit/s</div></div>' +
      '<div class="stat"><div class="stat-label">' + t({ tr: 'Saniyede', en: 'Per second' }) + '</div><div class="stat-value">' + fmt(bps / 8) + ' B</div></div>' +
      '<div class="stat"><div class="stat-label">' + t({ tr: 'Toplam (ham)', en: 'Total (raw)' }) + '</div><div class="stat-value hex">' + human(bytes) + '</div></div>' +
      '<div class="stat"><div class="stat-label">MP3 128 kbit/s</div><div class="stat-value ok-text">' + human(128000 / 8 * sec) + '</div></div>';
    foot.innerHTML = fmt(sr) + ' × ' + bits + '/8 × ' + ch + ' × ' + fmt(sec) + ' s = ' + fmt(bytes) + ' byte. ' +
      t({ tr: 'MP3 bu sesi yaklaşık ' + nf(bps / 128000, 1) + ' kat küçültür.', en: 'MP3 shrinks it about ' + nf(bps / 128000, 1) + '×.' });
  }
  [r, m].forEach((x) => x.addEventListener('input', size)); [b, c].forEach((x) => x.addEventListener('change', size));
  size();

  /* ---------- alıştırma ---------- */
  const sizeQ = () => {
    const sr = pick([8000, 16000, 22050, 44100, 48000]), bits = pick([8, 16, 24]), ch = pick([1, 2]), s = pick([1, 2, 10, 60]);
    const ans = sr * bits / 8 * ch * s;
    return {
      q: t({ tr: s + ' saniyelik, ' + fmt(sr) + ' Hz, ' + bits + ' bit, ' + (ch === 1 ? 'mono' : 'stereo') + ' ses sıkıştırılmadan kaç byte tutar?', en: 'How many bytes does ' + s + ' s of ' + fmt(sr) + ' Hz, ' + bits + '-bit ' + (ch === 1 ? 'mono' : 'stereo') + ' audio take uncompressed?' }),
      a: String(ans), kind: 'dec',
      hint: t({ tr: 'hız × (bit ÷ 8) × kanal × saniye', en: 'rate × (bits ÷ 8) × channels × seconds' }),
      explain: fmt(sr) + ' × ' + bits / 8 + ' × ' + ch + ' × ' + s + ' = <b>' + fmt(ans) + '</b>',
    };
  };
  const levelQ = () => { const n = pick([1, 2, 3, 4, 8, 10, 12, 16]); return { q: t({ tr: n + ' bitlik ses örneği kaç farklı seviye alabilir?', en: 'How many levels can a ' + n + '-bit audio sample have?' }), a: String(Math.pow(2, n)), kind: 'dec', hint: '2ⁿ', explain: '2<sup>' + n + '</sup> = ' + fmt(Math.pow(2, n)) }; };
  const nyqQ = () => { const f = pick([3000, 4000, 5000, 8000, 10000, 12000, 20000]); return { q: t({ tr: f + ' Hz’e kadar olan sesleri kaydetmek için örnekleme hızı en az kaç Hz’in üzerinde olmalı?', en: 'To record sounds up to ' + f + ' Hz, the sample rate must exceed how many Hz?' }), a: String(2 * f), kind: 'dec', hint: 'Nyquist: 2 × f', explain: '2 × ' + f + ' = ' + 2 * f }; };
  NS.practice($('#practice'), [
    { label: t({ tr: 'Dosya boyutu', en: 'File size' }), fn: sizeQ },
    { label: t({ tr: 'Seviye sayısı', en: 'Levels' }), fn: levelQ },
    { label: 'Nyquist', fn: nyqQ },
  ]);
})();
