/* Bölüm 3 — Byte’lar */
(function () {
  const { t, $, el, esc, fmt, pad, toBase, lamps, knob, out, tryIt } = NS;
  const sub = (b) => '<span class="sub">' + b + '</span>';

  /* Şekil 1: byte anatomisi */
  const BL = lamps($('#byte-lamps'), { n: 8, value: 0xA7, group: 4, weight: (i) => String(2 ** (7 - i)), onChange: drawByte, label: 'byte' });
  function drawByte() {
    const v = BL.value(), b = BL.get(), hi = v >> 4, lo = v & 15;
    $('#byte-anat').innerHTML =
      '<div class="nib"><span class="nib-l">' + esc(t({ tr: 'üst yarım', en: 'high nibble' })) + '</span><b class="b">' + b.slice(0, 4).join('') + '</b><span class="nib-h h">' + toBase(hi, 16) + '</span></div>' +
      '<div class="nib"><span class="nib-l">' + esc(t({ tr: 'alt yarım', en: 'low nibble' })) + '</span><b class="b">' + b.slice(4).join('') + '</b><span class="nib-h h">' + toBase(lo, 16) + '</span></div>' +
      '<div class="nib tot"><span class="nib-l">' + esc(t({ tr: 'byte', en: 'byte' })) + '</span><b class="h">0x' + pad(toBase(v, 16), 2) + '</b><span class="nib-h d">' + v + '</span></div>';
  }
  drawByte();

  /* Şekil 2: ikiye bölmek */
  function drawHalve(n) {
    const chain = [n];
    while (chain[chain.length - 1] > 1) chain.push(Math.ceil(chain[chain.length - 1] / 2));
    const bits = chain.length - 1;
    $('#halve').innerHTML = chain.map((c, i) => '<span class="hv' + (i === chain.length - 1 ? ' last' : '') + '" style="animation-delay:' + i * 40 + 'ms">' + fmt(c) + '</span>' + (i < chain.length - 1 ? '<span class="hv-ar">÷2</span>' : '')).join('');
    $('#halve-tell').innerHTML = n <= 1
      ? t({ tr: 'Tek bir şeyi ayırt etmeye gerek yok: <b>0 bit</b>.', en: 'A single thing needs no distinguishing: <b>0 bits</b>.' })
      : t({ tr: '<b>' + bits + ' bölme</b> → <b>' + bits + ' bit</b>. ' + bits + ' bit 2<sup>' + bits + '</sup> = ' + fmt(2 ** bits) + ' desen verir; ' + fmt(2 ** bits - n) + ' tanesi boşta kalır.', en: '<b>' + bits + ' halvings</b> → <b>' + bits + ' bits</b>. ' + bits + ' bits give 2<sup>' + bits + '</sup> = ' + fmt(2 ** bits) + ' patterns; ' + fmt(2 ** bits - n) + ' stay unused.' });
  }
  knob($('#k-items'), { value: 1000, min: 1, max: 100000, px: 2, step: 1, fmt: (v) => fmt(v), onChange: drawHalve });
  drawHalve(1000);

  /* Şekil 3: 8 bitlik sayaç */
  let ov = 0;
  const OL = lamps($('#odo-lamps'), { n: 8, value: 250, ro: true, group: 4, weight: (i) => String(2 ** (7 - i)), label: 'counter' });
  function drawOdo(msg) { const v = OL.value(); $('#odo-out').innerHTML = '<b class="b">' + pad(v.toString(2), 8) + '</b>' + sub(2) + ' = <b class="d">' + v + '</b>'; $('#odo-tell').innerHTML = msg || ''; }
  function add(k) {
    const v = OL.value(), nv = (v + k) % 256;
    OL.set(nv, true);
    if (v + k > 255) { ov++; drawOdo('<span class="bad">' + t({ tr: 'Taşma!', en: 'Overflow!' }) + '</span> ' + t({ tr: v + ' + ' + k + ' = ' + (v + k) + ' olmalıydı, ama 8 bite sığmıyor. Kutu başa döndü: ' + nv + '.', en: v + ' + ' + k + ' should be ' + (v + k) + ', but it does not fit in 8 bits. The box wrapped around: ' + nv + '.' })); }
    else drawOdo('');
  }
  $('#odo-ctl').append(
    el('button', { class: 'btn fill', type: 'button', text: '+1', onclick: () => add(1) }),
    el('button', { class: 'btn', type: 'button', text: '+10', onclick: () => add(10) }),
    el('button', { class: 'btn ghost', type: 'button', text: t({ tr: '253’e git', en: 'Go to 253' }), onclick: () => { OL.set(253, true); drawOdo(''); } }),
    el('button', { class: 'btn ghost', type: 'button', text: t({ tr: 'Sıfırla', en: 'Reset' }), onclick: () => { OL.set(0, true); drawOdo(''); } }),
  );
  drawOdo(t({ tr: '+1’e birkaç kez bas.', en: 'Press +1 a few times.' }));
  void ov;

  /* Şekil 4: ön ekler */
  const P = [['k', 'Ki', 1], ['M', 'Mi', 2], ['G', 'Gi', 3], ['T', 'Ti', 4], ['P', 'Pi', 5]];
  $('#units').innerHTML = '<div class="units">' + P.map(([d, b, k]) => {
    const dec = Math.pow(1000, k), bin = Math.pow(1024, k), gap = 100 * (bin / dec - 1);
    return '<div class="u-row"><span class="u-l mono">1 ' + d + 'B</span><span class="u-bar"><i style="width:' + (100 / (bin / dec)) + '%"></i></span><span class="u-v mono">10<sup>' + 3 * k + '</sup></span>' +
      '<span class="u-l mono">1 ' + b + 'B</span><span class="u-bar bin"><i style="width:100%"></i></span><span class="u-v mono">2<sup>' + 10 * k + '</sup></span>' +
      '<span class="u-gap">+' + fmt(gap, 1) + '%</span></div>';
  }).join('') + '</div>';

  /* disk cümlesi */
  knob($('#k-disk'), { value: 500, min: 1, max: 20000, px: 2, step: 1, fmt: (v) => fmt(v), onChange: (v) => out(null, 'gib', fmt(v * 1e9 / 2 ** 30, 2)) });
  out(null, 'gib', fmt(500e9 / 2 ** 30, 2));

  /* indirme cümlesi */
  let sp = 100, fs = 4;
  const dlTime = (s) => { s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? h + t({ tr: ' sa ', en: ' h ' }) : '') + (m ? m + t({ tr: ' dk ', en: ' min ' }) : '') + (x || (!h && !m) ? x + t({ tr: ' sn', en: ' s' }) : '').trim(); };
  const drawDl = () => { out(null, 'dl', dlTime(fs * 8000 / sp)); out(null, 'mbs', fmt(sp / 8, 2)); };
  knob($('#k-speed'), { value: 100, min: 1, max: 10000, px: 3, fmt: (v) => fmt(v), onChange: (v) => { sp = v; drawDl(); } });
  knob($('#k-file'), { value: 4, min: 1, max: 200, onChange: (v) => { fs = v; drawDl(); } });
  drawDl();

  /* Şekil 5: veri merdiveni */
  const L = [
    ['1 bit', { tr: 'Bir yazı-tura atışı. Bir evet/hayır cevabı.', en: 'One coin toss. One yes/no answer.' }],
    ['1 byte', { tr: 'Bir harf. Bir rengin tek bir kanalı.', en: 'One letter. A single channel of a color.' }],
    ['1 KB', { tr: 'Kısa bir paragraf düz metin. Bu sayfadaki bir bölüm civarı.', en: 'A short paragraph of plain text, about one section of this page.' }],
    ['1 MB', { tr: 'Kalın bir romanın düz metni. Ya da sıkıştırılmış bir fotoğraf.', en: 'The plain text of a thick novel. Or one compressed photo.' }],
    ['1 GB', { tr: 'Yaklaşık bir saatlik standart kalitede video. Ya da 1000 roman.', en: 'About an hour of standard-quality video. Or 1000 novels.' }],
    ['1 TB', { tr: 'Bir dizüstü bilgisayarın diski. Yüzbinlerce fotoğraf.', en: 'A laptop’s disk. Hundreds of thousands of photos.' }],
    ['1 PB', { tr: 'Büyük bir şirketin ya da üniversitenin veri merkezi.', en: 'The data center of a large company or university.' }],
    ['1 EB', { tr: 'Dev bulut sağlayıcılarının toplam depolaması bu ölçekte ölçülür.', en: 'The total storage of giant cloud providers is measured at this scale.' }],
    ['1 ZB', { tr: 'İnsanlığın bir yılda ürettiği veri artık yüzlerce zettabyte olarak tahmin ediliyor.', en: 'The data humanity generates in a year is now estimated in hundreds of zettabytes.' }],
  ];
  $('#ladder').innerHTML = L.map(([u, d], i) => '<div class="ld" style="--i:' + i + '"><span class="ld-bar" style="width:' + (8 + i * 11.5) + '%"></span><span class="ld-u mono">' + u + '</span><span class="ld-d">' + esc(t(d)) + '</span><span class="ld-x mono">' + (i < 2 ? (i ? '8 bit' : '') : '≈ 10<sup>' + (3 * (i - 1)) + '</sup> B') + '</span></div>').join('');

  tryIt($('#try'), [
    { label: t({ tr: 'Kaç bit?', en: 'How many bits?' }), fn: GEN.bitsNeeded },
    { label: t({ tr: 'Desen sayısı', en: 'Patterns' }), fn: GEN.patterns },
    { label: t({ tr: 'En büyük sayı', en: 'Largest number' }), fn: GEN.maxValue },
    { label: t({ tr: 'Birimler', en: 'Units' }), fn: GEN.units },
  ]);
})();
