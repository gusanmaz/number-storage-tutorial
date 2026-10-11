/* Bölüm 4 — Bit & Byte: ikiye katlanma, kaç bit gerekir, disk hesaplayıcı */
(function () {
  const { t, $, el, esc, fmt, toBase, pad } = NS;

  /* ---------- ikiye katlanma ---------- */
  let n = 2, prevN = null;
  const range = $('#dbl-range'), list = $('#dbl-list'), stats = $('#dbl-stats'), bar = $('#dbl-bar');
  const FACTS = [
    [1, { tr: 'Bir yazı-tura atışı', en: 'One coin toss' }],
    [3, { tr: 'Bir zarın yüzleri (6) için 3 bit yeter', en: '3 bits are enough for the faces of a die (6)' }],
    [7, { tr: 'ASCII: 128 karakter', en: 'ASCII: 128 characters' }],
    [8, { tr: 'Bir byte: 256 değer', en: 'One byte: 256 values' }],
    [10, { tr: '≈ bin (1 024)', en: '≈ a thousand (1,024)' }],
    [16, { tr: '65 536: bir bilgisayardaki ağ portu sayısı', en: '65,536: the number of network ports' }],
    [20, { tr: '≈ bir milyon', en: '≈ a million' }],
    [24, { tr: '≈ 16,7 milyon renk (#RRGGBB)', en: '≈ 16.7 million colors (#RRGGBB)' }],
    [30, { tr: '≈ bir milyar', en: '≈ a billion' }],
    [32, { tr: '≈ 4,3 milyar: tüm IPv4 adresleri (dünya nüfusundan az!)', en: '≈ 4.3 billion: all IPv4 addresses (fewer than people on Earth!)' }],
  ];
  function draw() {
    const count = Math.pow(2, n);
    range.value = n;
    stats.innerHTML =
      '<div class="stat"><div class="stat-label">' + t({ tr: 'Bit sayısı', en: 'Bits' }) + '</div><div class="stat-value">' + n + '</div></div>' +
      '<div class="stat"><div class="stat-label">' + t({ tr: 'Farklı değer', en: 'Distinct values' }) + '</div><div class="stat-value dec">2<sup>' + n + '</sup> = ' + fmt(count) + '</div></div>' +
      '<div class="stat"><div class="stat-label">' + t({ tr: 'Aralık', en: 'Range' }) + '</div><div class="stat-value">0 … ' + fmt(count - 1) + '</div></div>' +
      '<div class="stat"><div class="stat-label">' + t({ tr: 'En büyük (hex)', en: 'Max (hex)' }) + '</div><div class="stat-value hex">' + toBase(count - 1, 16) + '</div></div>';
    if (n <= 5) {
      const grew = prevN === n - 1, shrank = prevN === n + 1;
      const items = [];
      for (let v = 0; v < count; v++) {
        const s = pad(v.toString(2), n);
        const cls = grew ? (s[0] === '0' ? 'p0' : 'p1') : '';
        items.push('<span class="combo ' + cls + (grew || shrank ? ' fade-up' : '') + '" style="animation-delay:' + (grew ? (v % (count / 2)) * 25 : 0) + 'ms">' +
          (grew ? '<b>' + s[0] + '</b>' + s.slice(1) : s) + '<small>' + v + '</small></span>');
      }
      list.innerHTML = items.join('');
      list.hidden = false;
    } else {
      list.hidden = false;
      list.innerHTML = '<p class="muted center" style="margin:0;width:100%">' + esc(t({ tr: fmt(count) + ' kombinasyonun hepsini listelemek için ekran yetmez. İlk ve son birkaçı:', en: 'Too many to list all ' + fmt(count) + ' combinations. The first and last few:' })) + '</p>' +
        [0, 1, 2].map((v) => '<span class="combo">' + pad(v.toString(2), n) + '<small>' + v + '</small></span>').join('') + '<span class="combo dots">⋯</span>' +
        [count - 2, count - 1].map((v) => '<span class="combo">' + pad(v.toString(2), n) + '<small>' + fmt(v) + '</small></span>').join('');
    }
    const fact = FACTS.filter((f) => f[0] <= n).pop();
    bar.innerHTML = '<div class="dbl-meter"><span style="width:' + (100 * n / 32) + '%"></span></div>' +
      '<div class="muted" style="font-size:.88rem">' + (fact ? '<b>' + fact[0] + ' bit:</b> ' + esc(t(fact[1])) : '') + '</div>';
    $('#dbl-minus').disabled = n <= 1;
    $('#dbl-plus').disabled = n >= 32;
  }
  const set = (v) => { prevN = n; n = Math.max(1, Math.min(32, v)); draw(); };
  $('#dbl-plus').addEventListener('click', () => set(n + 1));
  $('#dbl-minus').addEventListener('click', () => set(n - 1));
  range.addEventListener('input', () => set(+range.value));
  draw();

  /* ---------- kaç bit gerekir ---------- */
  const needIn = $('#need-n'), needOut = $('#need-out');
  const presets = [[2, { tr: 'Açık/kapalı', en: 'On/off' }], [7, { tr: 'Haftanın günleri', en: 'Days of week' }], [26, { tr: 'İngilizce harfler', en: 'English letters' }], [NS.LANG === 'en' ? 50 : 81, { tr: '81 il', en: '50 US states' }], [365, { tr: 'Yılın günleri', en: 'Days of year' }], [1000, { tr: '1000 öğrenci', en: '1000 students' }], [8e9, { tr: 'Dünya nüfusu', en: 'World population' }]];
  presets.forEach(([v, l]) => {
    const b = el('button', { type: 'button', class: 'btn ghost sm', text: t(l) });
    b.addEventListener('click', () => { needIn.value = v; need(); });
    $('#need-presets').append(b);
  });
  function need() {
    const N = Math.max(1, Math.floor(+needIn.value || 1));
    const b = N <= 1 ? 0 : Math.ceil(Math.log2(N));
    if (N <= 1) { needOut.innerHTML = t({ tr: 'Tek bir değeri kodlamak için bite gerek yok: zaten hep aynı!', en: 'A single value needs no bits at all: it never changes!' }); return; }
    const exact = Math.pow(2, b) === N;
    needOut.innerHTML = '2<sup>' + (b - 1) + '</sup> = ' + fmt(Math.pow(2, b - 1)) + ' &lt; <b class="dec">' + fmt(N) + '</b> ≤ 2<sup>' + b + '</sup> = ' + fmt(Math.pow(2, b)) +
      ' &nbsp;→&nbsp; <b>' + b + ' bit</b>' + (exact ? '' : ' <span class="muted">(' + t({ tr: fmt(Math.pow(2, b) - N) + ' kod boşta kalır', en: fmt(Math.pow(2, b) - N) + ' codes stay unused' }) + ')</span>');
  }
  needIn.addEventListener('input', need);
  need();

  /* ---------- disk ---------- */
  const dn = $('#disk-n'), du = $('#disk-u'), dout = $('#disk-out'), dfoot = $('#disk-foot');
  function disk() {
    const v = Math.max(0, +dn.value || 0), u = +du.value;
    const bytes = v * Math.pow(10, u);
    const gib = bytes / Math.pow(2, 30), tib = bytes / Math.pow(2, 40);
    const shown = u === 9 ? gib : tib, unit = u === 9 ? 'GiB' : 'TiB';
    const lost = 100 * (1 - shown / v);
    const nf = (x) => x.toLocaleString(NS.LANG === 'en' ? 'en-US' : 'tr-TR', { maximumFractionDigits: 2 });
    dout.innerHTML =
      '<div class="stat"><div class="stat-label">' + t({ tr: 'Üretici der ki', en: 'Manufacturer says' }) + '</div><div class="stat-value">' + nf(v) + ' ' + (u === 9 ? 'GB' : 'TB') + '</div></div>' +
      '<div class="stat"><div class="stat-label">Byte</div><div class="stat-value dec">' + fmt(bytes) + '</div></div>' +
      '<div class="stat"><div class="stat-label">' + t({ tr: 'İşletim sistemi gösterir', en: 'OS shows' }) + '</div><div class="stat-value hex">' + nf(shown) + ' ' + unit + '</div></div>' +
      '<div class="stat"><div class="stat-label">' + t({ tr: '“Kayıp”', en: '“Missing”' }) + '</div><div class="stat-value bad">%' + nf(lost) + '</div></div>';
    dfoot.innerHTML = t({
      tr: 'Hiçbir byte kaybolmadı! ' + fmt(bytes) + ' byte ÷ 2<sup>' + (u === 9 ? 30 : 40) + '</sup> = ' + nf(shown) + ' ' + unit + '. Windows bunu “' + nf(shown) + ' GB” diye gösterdiği için eksik sanırız. (macOS 2009’dan beri ondalık birim kullanır ve tam ' + nf(v) + ' gösterir.)',
      en: 'No bytes are missing! ' + fmt(bytes) + ' bytes ÷ 2<sup>' + (u === 9 ? 30 : 40) + '</sup> = ' + nf(shown) + ' ' + unit + '. Windows labels this “' + nf(shown) + ' GB”, so it looks smaller. (macOS has used decimal units since 2009 and shows the full ' + nf(v) + '.)',
    }).replace(/GB”/, u === 9 ? 'GB”' : 'TB”');
  }
  dn.addEventListener('input', disk); du.addEventListener('change', disk);
  disk();

  /* ---------- alıştırma ---------- */
  NS.practice($('#practice'), [
    { label: t({ tr: 'n bit → değer sayısı', en: 'n bits → count' }), fn: GEN.capacity },
    { label: t({ tr: 'En büyük değer', en: 'Largest value' }), fn: GEN.maxValue },
    { label: t({ tr: 'Kaç bit gerekir?', en: 'Bits needed' }), fn: GEN.bitsNeeded },
    { label: t({ tr: 'Hex rakamı → bit', en: 'Hex digits → bits' }), fn: GEN.hexDigitsToBits },
    { label: t({ tr: 'Birimler', en: 'Units' }), fn: GEN.units },
  ]);
})();
