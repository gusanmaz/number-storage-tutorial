/* Bölüm 1 — Anahtarlar */
(function () {
  const { t, $, $$, el, esc, fmt, pad, toBase, lamps, knob, out, tryIt } = NS;

  /* Şekil 1: tek bit */
  let flips = 0;
  const one = lamps($('#sw-lamp'), {
    n: 1, value: 0, size: 'lg', label: 'bit',
    onChange: (b) => {
      flips++;
      $('#sw-tell').innerHTML = (b[0] ? t({ tr: 'Açık. Bu duruma <b>1</b> diyelim.', en: 'On. Let’s call this state <b>1</b>.' }) : t({ tr: 'Kapalı. Bu duruma <b>0</b> diyelim.', en: 'Off. Let’s call this state <b>0</b>.' })) +
        (flips >= 4 ? ' <span class="muted">' + t({ tr: '(' + flips + ' kez değiştirdin. Bir işlemci bunu saniyede milyarlarca kez yapar.)', en: '(You flipped it ' + flips + ' times. A processor does this billions of times a second.)' }) + '</span>' : '') ;
    },
  });
  void one;

  /* Şekil 2: desenler ikiye katlanıyor */
  const FACTS = {
    1: { tr: 'Bir yazı-tura atışı kadar.', en: 'As much as one coin toss.' },
    2: { tr: 'Bir trafik lambası için bile yetmez (3 renk + kapalı = 4, tam sığar!).', en: 'Just enough for a traffic light (3 colors + off = 4).' },
    3: { tr: 'Haftanın 7 gününe yeter, bir yer boşta kalır.', en: 'Enough for the 7 days of the week, with one to spare.' },
    4: { tr: 'Bu 16 desene ileride bir ad vereceğiz: bir onaltılık (hex) rakamı.', en: 'Later we’ll give these 16 patterns a name: one hexadecimal digit.' },
    5: { tr: 'Türk alfabesinin 29 harfine yeter.', en: 'Enough for the 26 letters of the alphabet.' },
    6: { tr: 'Satranç tahtasındaki 64 kareden biri.', en: 'One of the 64 squares of a chessboard.' },
    7: { tr: 'ASCII’nin bütün karakterleri: harfler, rakamlar, noktalama.', en: 'All of ASCII: letters, digits, punctuation.' },
    8: { tr: 'Bu sekizliye bir ad vereceğiz: byte.', en: 'We’ll give this group of eight a name: a byte.' },
    9: { tr: 'Her yeni anahtar yine ikiye katlıyor…', en: 'Each new switch doubles it again…' },
    10: { tr: 'Bine yakın. 2¹⁰ = 1024, “kibi” ön ekinin kaynağı.', en: 'Close to a thousand. 2¹⁰ = 1024, the origin of the “kibi” prefix.' },
    11: { tr: 'Sadece 11 anahtar ve iki binin üstündeyiz.', en: 'Only 11 switches and we’re past two thousand.' },
    12: { tr: '32 anahtar 4 milyardan fazla, 64 anahtar Dünya’daki kum tanelerinden fazla desen verir.', en: '32 switches give over 4 billion patterns; 64 give more than the grains of sand on Earth.' },
  };
  const grow = $('#grow');
  const mini = (bits, hiFirst) => '<span class="mini">' + bits.map((b, i) => '<i class="' + (b ? 'on' : '') + (hiFirst && i === 0 ? ' new' : '') + '"></i>').join('') + '</span>';
  function drawGrow(n) {
    const total = 2 ** n;
    out(null, 'pat', fmt(total)); out(null, 'pat2', fmt(total)); out(null, 'nn', n);
    out(null, 'fact', esc(t(FACTS[n] || FACTS[12])));
    if (n > 6) {
      grow.innerHTML = '<div class="grow-big"><div class="big">2<sup>' + n + '</sup> = ' + fmt(total) + '</div><div class="muted">' + esc(t({ tr: 'Hepsini çizmek için ekran yetmez. 6 ya da daha az anahtarla listeyi gör.', en: 'Too many to draw. Use 6 or fewer switches to see the list.' })) + '</div></div>';
      return;
    }
    const rows = Array.from({ length: total }, (_, v) => NS.bitsOf(v, n));
    if (n === 1) { grow.innerHTML = '<div class="grow-col"><div class="grow-list">' + rows.map((r) => mini(r)).join('') + '</div></div>'; return; }
    const half = total / 2;
    grow.innerHTML =
      '<div class="grow-col"><div class="grow-h">' + esc(t({ tr: 'yeni anahtar kapalı', en: 'new switch off' })) + ' · ' + half + '</div><div class="grow-list">' + rows.slice(0, half).map((r) => mini(r, true)).join('') + '</div></div>' +
      '<div class="grow-col"><div class="grow-h">' + esc(t({ tr: 'yeni anahtar açık', en: 'new switch on' })) + ' · ' + half + '</div><div class="grow-list">' + rows.slice(half).map((r) => mini(r, true)).join('') + '</div></div>';
  }
  knob($('#k-n'), { value: 3, min: 1, max: 12, onChange: drawGrow });
  drawGrow(3);

  /* Şekil 3: sayını bulayım (cevaplar = bitler) */
  const game = $('#game');
  let lo, ans;
  function startGame() {
    lo = 0; ans = [];
    game.innerHTML = '<div class="game-q"></div><div class="ctl game-btns"></div><div class="game-lamps"></div><div class="tell game-tell"></div>';
    const L = lamps($('.game-lamps', game), { n: 7, value: 0, ro: true, size: 'sm', weight: (i) => String(2 ** (6 - i)), label: t({ tr: 'cevaplar', en: 'answers' }) });
    game._L = L;
    $$('.lamp', game).forEach((b) => b.classList.add('pending'));
    ask();
  }
  function ask() {
    const k = ans.length;
    const L = game._L;
    if (k === 7) {
      $('.game-q', game).innerHTML = t({ tr: 'Tuttuğun sayı: ', en: 'Your number is ' }) + '<span class="big d">' + lo + '</span>';
      $('.game-btns', game).innerHTML = '';
      $('.game-btns', game).append(el('button', { class: 'btn', type: 'button', text: t({ tr: 'Bir daha oyna', en: 'Play again' }), onclick: startGame }));
      $('.game-tell', game).innerHTML = t({ tr: 'Cevapların sırasıyla <b class="b">' + ans.join('') + '</b>. Bu, ' + lo + ' sayısının ikili yazılışının ta kendisi: ', en: 'Your answers in order were <b class="b">' + ans.join('') + '</b>. That is exactly how ' + lo + ' is written in binary: ' }) +
        ans.map((b, i) => (b ? 2 ** (6 - i) : null)).filter(Boolean).join(' + ') + (lo ? ' = ' + lo : '0') + '.';
      return;
    }
    const step = 2 ** (6 - k), mid = lo + step;
    $('.game-q', game).innerHTML = (k === 0 ? t({ tr: '0–127 arasında bir sayı tuttun. ', en: 'You picked a number from 0 to 127. ' }) : '') + t({ tr: 'Sayın <b class="d">' + mid + '</b> ya da daha büyük mü?', en: 'Is your number <b class="d">' + mid + '</b> or more?' });
    const box = $('.game-btns', game); box.innerHTML = '';
    const answer = (yes) => {
      ans.push(yes ? 1 : 0); if (yes) lo = mid;
      const bits = ans.concat(Array(7 - ans.length).fill(0));
      L.set(bits, true);
      $$('.lamp', game).forEach((b, i) => b.classList.toggle('pending', i >= ans.length));
      const left = 2 ** (6 - k);
      $('.game-tell', game).innerHTML = t({ tr: 'Geriye <b>' + left + '</b> olasılık kaldı' + (left > 1 ? ' (' + lo + '–' + (lo + left - 1) + ').' : '.'), en: '<b>' + left + '</b> possibilit' + (left > 1 ? 'ies left (' + lo + '–' + (lo + left - 1) + ').' : 'y left.') });
      ask();
    };
    box.append(el('button', { class: 'btn fill', type: 'button', text: t({ tr: 'Evet', en: 'Yes' }), onclick: () => answer(true) }), el('button', { class: 'btn', type: 'button', text: t({ tr: 'Hayır', en: 'No' }), onclick: () => answer(false) }));
    if (k === 0) $('.game-tell', game).innerHTML = t({ tr: '128 olasılık var. Her cevap bunu yarıya indirecek.', en: '128 possibilities. Each answer halves them.' });
  }
  startGame();

  /* Şekil 4: gürültü */
  const noise = $('#noise');
  const N = 24;
  let msg2, msg10, z;
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  function newMsg() {
    msg2 = Array.from({ length: N }, () => Math.round(Math.random()));
    msg10 = Array.from({ length: N }, () => Math.floor(Math.random() * 10));
    z = Array.from({ length: N }, () => Array.from({ length: 6 }, gauss));
  }
  noise.innerHTML =
    '<div class="ctl" style="margin:0 0 1rem"><label class="field" style="flex-direction:row;align-items:center;gap:.6rem;text-transform:none;letter-spacing:0;font-size:14px">' + esc(t({ tr: 'Gürültü', en: 'Noise' })) + ' <input type="range" id="nz" min="0" max="30" value="7" style="width:200px"> <b id="nzv" class="mono"></b></label>' +
    '<button class="btn sm ghost" type="button" id="nz-new">' + esc(t({ tr: 'Yeni mesaj', en: 'New message' })) + '</button></div>' +
    '<div class="lanes"><div class="lane" id="lane2"></div><div class="lane" id="lane10"></div></div>';
  function lane(box, levels, msg, sigma) {
    const W = 640, H = 130, m = 14, w = (W - 2 * m) / N;
    const Y = (v) => H - m - v * (H - 2 * m);
    let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="svgfig" preserveAspectRatio="none" style="width:100%;height:130px">';
    for (let l = 0; l < levels; l++) svg += '<line x1="' + m + '" x2="' + (W - m) + '" y1="' + Y(l / (levels - 1)) + '" y2="' + Y(l / (levels - 1)) + '" stroke="var(--rule-2)" stroke-dasharray="2 4"/>';
    let d = '', errs = 0, recv = [];
    msg.forEach((s, i) => {
      const base = s / (levels - 1);
      let sum = 0;
      z[i].forEach((zz, k) => { const v = base + zz * sigma; sum += v; const x = m + i * w + (k + 0.5) * w / 6; d += (i || k ? 'L' : 'M') + x.toFixed(1) + ' ' + Y(Math.max(-0.15, Math.min(1.15, v))).toFixed(1); });
      const r = Math.max(0, Math.min(levels - 1, Math.round(sum / 6 * (levels - 1))));
      recv.push(r); if (r !== s) { errs++; svg += '<rect x="' + (m + i * w) + '" y="0" width="' + w + '" height="' + H + '" fill="var(--neg)" opacity=".12"/>'; }
    });
    svg += '<path d="' + d + '" fill="none" stroke="var(--on-deep)" stroke-width="1.6"/></svg>';
    const row = (arr, cmp) => '<div class="lane-row">' + arr.map((v, i) => '<span class="' + (cmp && v !== cmp[i] ? 'err' : '') + '">' + v + '</span>').join('') + '</div>';
    box.innerHTML = '<div class="lane-h"><b>' + levels + ' ' + esc(t({ tr: 'seviye', en: 'levels' })) + '</b><span class="' + (errs ? 'n' : 'y') + '">' + errs + ' ' + esc(t({ tr: 'hata', en: 'errors' })) + ' / ' + N + '</span></div>' + svg +
      '<div class="lane-rows"><span class="muted">' + esc(t({ tr: 'gönderilen', en: 'sent' })) + '</span>' + row(msg) + '<span class="muted">' + esc(t({ tr: 'alınan', en: 'received' })) + '</span>' + row(recv, msg) + '</div>';
  }
  function drawNoise() {
    const s = +$('#nz').value / 100;
    $('#nzv').textContent = '±' + Math.round(s * 100) + '%';
    lane($('#lane2'), 2, msg2, s); lane($('#lane10'), 10, msg10, s);
  }
  newMsg(); drawNoise();
  $('#nz').addEventListener('input', drawNoise);
  $('#nz-new').addEventListener('click', () => { newMsg(); drawNoise(); });

  /* Şekil 5: anahtarlarla mantık */
  let gmode = 'and', A = 0, B = 0;
  const modes = [['and', { tr: 'VE (seri)', en: 'AND (series)' }], ['or', { tr: 'VEYA (paralel)', en: 'OR (parallel)' }], ['xor', { tr: 'ÖZEL VEYA', en: 'XOR' }]];
  const seg = el('div', { class: 'seg', role: 'group' });
  modes.forEach(([k, l]) => seg.append(el('button', { type: 'button', 'aria-pressed': String(k === gmode), text: t(l), onclick: (e) => { gmode = k; $$('button', seg).forEach((b) => b.setAttribute('aria-pressed', String(b === e.target))); drawGate(); } })));
  $('#gate-mode').append(seg);
  function sw(x, y, closed, key) {
    const lx = x + 50, ly = closed ? y : y - 22;
    return '<g class="sw" data-k="' + key + '" role="button" tabindex="0" aria-label="' + key + '">' +
      '<rect x="' + (x - 8) + '" y="' + (y - 34) + '" width="66" height="50" fill="transparent"/>' +
      '<circle cx="' + x + '" cy="' + y + '" r="4.5" fill="var(--ink)"/><circle cx="' + (x + 50) + '" cy="' + y + '" r="4.5" fill="var(--ink)"/>' +
      '<line x1="' + x + '" y1="' + y + '" x2="' + lx + '" y2="' + ly + '" stroke="' + (closed ? 'var(--on-deep)' : 'var(--ink)') + '" stroke-width="5" stroke-linecap="round"/>' +
      '<text x="' + (x + 25) + '" y="' + (y + 24) + '" text-anchor="middle" font-family="var(--mono)" font-size="14" font-weight="600" fill="var(--ink-2)">' + key + ' = ' + (closed ? 1 : 0) + '</text></g>';
  }
  function drawGate() {
    const lit = gmode === 'and' ? A && B : gmode === 'or' ? A || B : A !== B;
    const wire = lit ? 'var(--on-deep)' : 'var(--ink-3)';
    let s = '<svg viewBox="0 0 460 190" class="svgfig" style="width:100%;max-width:520px">';
    // pil
    s += '<line x1="30" y1="70" x2="30" y2="160" stroke="' + wire + '" stroke-width="3"/><rect x="18" y="104" width="24" height="22" fill="var(--paper-2)"/><line x1="16" y1="108" x2="44" y2="108" stroke="var(--ink)" stroke-width="3"/><line x1="23" y1="120" x2="37" y2="120" stroke="var(--ink)" stroke-width="3"/>';
    s += '<line x1="30" y1="160" x2="420" y2="160" stroke="' + wire + '" stroke-width="3"/>';
    if (gmode === 'and') {
      s += '<path d="M30 70 H130 M180 70 H250 M300 70 H420 V95" fill="none" stroke="' + wire + '" stroke-width="3"/>' + sw(130, 70, A, 'A') + sw(250, 70, B, 'B');
    } else if (gmode === 'or') {
      s += '<path d="M30 70 H110 M110 40 V100 M110 40 H160 M110 100 H160 M210 40 H260 M210 100 H260 M260 40 V100 M260 70 H420 V95" fill="none" stroke="' + wire + '" stroke-width="3"/>' + sw(160, 40, A, 'A') + sw(160, 100, B, 'B');
    } else {
      s += '<path d="M30 70 H120 M300 70 H420 V95" fill="none" stroke="' + wire + '" stroke-width="3"/><rect x="120" y="22" width="180" height="96" rx="14" fill="var(--card)" stroke="var(--ink)" stroke-width="2"/>' +
        '<text x="210" y="50" text-anchor="middle" font-family="var(--sans)" font-size="13" fill="var(--ink-3)">' + esc(t({ tr: 'yalnız biri açıksa', en: 'exactly one on' })) + '</text>' + sw(130, 92, A, 'A').replace('stroke-width="5"', 'stroke-width="4"') + sw(240, 92, B, 'B').replace('stroke-width="5"', 'stroke-width="4"');
    }
    s += '<circle cx="420" cy="122" r="26" fill="' + (lit ? 'var(--on)' : 'var(--off)') + '" stroke="' + (lit ? 'var(--on-deep)' : 'var(--off-ring)') + '" stroke-width="2.5"' + (lit ? ' style="filter:drop-shadow(0 0 12px var(--on-glow))"' : '') + '/>';
    s += '<text x="420" y="127" text-anchor="middle" font-family="var(--mono)" font-size="16" font-weight="700" fill="' + (lit ? '#5a2300' : 'var(--ink-3)') + '">' + (lit ? 1 : 0) + '</text></svg>';
    $('#gate').innerHTML = s;
    $$('#gate .sw').forEach((g) => {
      const tog = () => { if (g.dataset.k === 'A') A = A ? 0 : 1; else B = B ? 0 : 1; drawGate(); };
      g.addEventListener('click', tog);
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tog(); } });
    });
    const rows = [[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => { const r = gmode === 'and' ? a & b : gmode === 'or' ? a | b : a ^ b; return '<tr class="' + (a === A && b === B ? 'cur' : '') + '"><td>' + a + '</td><td>' + b + '</td><td><b>' + r + '</b></td></tr>'; }).join('');
    $('#gate-tell').innerHTML = '<table class="truth"><thead><tr><th>A</th><th>B</th><th>' + esc(t({ tr: 'lamba', en: 'lamp' })) + '</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }
  drawGate();

  /* Şekil 6: aynı desen, farklı mercekler */
  let lens = 'num';
  const LENS = [['num', { tr: 'Sayı', en: 'Number' }], ['chr', { tr: 'Harf (ASCII)', en: 'Letter (ASCII)' }], ['gray', { tr: 'Gri ton', en: 'Gray level' }], ['note', { tr: 'Müzik notası', en: 'Musical note' }], ['pix', { tr: '8 piksellik resim', en: '8-pixel picture' }]];
  const CTRL = ['NUL', 'SOH', 'STX', 'ETX', 'EOT', 'ENQ', 'ACK', 'BEL', 'BS', 'TAB', 'LF', 'VT', 'FF', 'CR', 'SO', 'SI', 'DLE', 'DC1', 'DC2', 'DC3', 'DC4', 'NAK', 'SYN', 'ETB', 'CAN', 'EM', 'SUB', 'ESC', 'FS', 'GS', 'RS', 'US'];
  const NOTES = NS.LANG === 'en' ? ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'] : ['Do', 'Do♯', 'Re', 'Re♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];
  const L8 = lamps($('#lens-lamps'), { n: 8, value: 65, group: 4, weight: (i) => String(2 ** (7 - i)), onChange: drawLens, label: '8 bit' });
  LENS.forEach(([k, l]) => $('#lens-chips').append(el('button', { type: 'button', class: 'chip', 'aria-pressed': String(k === lens), text: t(l), onclick: (e) => { lens = k; $$('#lens-chips .chip').forEach((c) => c.setAttribute('aria-pressed', String(c === e.target))); drawLens(); } })));
  let actx = null;
  function play(f) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, actx.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.9);
      o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + 1);
    } catch (e) { /* ses yok */ }
  }
  function drawLens() {
    const v = L8.value(), bits = L8.get(), o = $('#lens-out');
    if (lens === 'num') o.innerHTML = '<div class="big d">' + v + '</div><div class="muted">' + (bits.map((b, i) => (b ? 2 ** (7 - i) : null)).filter(Boolean).join(' + ') || '0') + '</div>';
    if (lens === 'chr') o.innerHTML = v >= 32 && v < 127 ? '<div class="lens-chr">' + esc(String.fromCharCode(v)) + '</div><div class="muted">' + esc(t({ tr: 'ASCII tablosunda ' + v + ' numaralı karakter', en: 'character number ' + v + ' in the ASCII table' })) + '</div>'
      : v < 32 || v === 127 ? '<div class="lens-chr small">' + (CTRL[v] || 'DEL') + '</div><div class="muted">' + esc(t({ tr: 'Görünmez bir kontrol karakteri (Bölüm 6’da)', en: 'An invisible control character (chapter 6)' })) + '</div>'
      : '<div class="lens-chr small">?</div><div class="muted">' + esc(t({ tr: 'ASCII 7 bittir (0–127). Bu desen ASCII’de yok; başka bir anlaşma gerekir.', en: 'ASCII is 7 bits (0–127). This pattern isn’t in ASCII; another agreement is needed.' })) + '</div>';
    if (lens === 'gray') o.innerHTML = '<div class="lens-sw" style="background:rgb(' + v + ',' + v + ',' + v + ')"></div><div class="muted">' + esc(t({ tr: '0 = siyah, 255 = beyaz. Bu desen: ', en: '0 = black, 255 = white. This pattern: ' })) + '<span class="h">#' + (pad(toBase(v, 16), 2)).repeat(3) + '</span></div>';
    if (lens === 'note') {
      if (v > 127) { o.innerHTML = '<div class="lens-chr small">—</div><div class="muted">' + esc(t({ tr: 'MIDI notaları 0–127 arasıdır; bu desen bir nota değil.', en: 'MIDI notes run from 0 to 127; this pattern is not a note.' })) + '</div>'; }
      else {
        const f = 440 * Math.pow(2, (v - 69) / 12), name = NOTES[v % 12] + (Math.floor(v / 12) - 1);
        o.innerHTML = '<div class="lens-chr">' + name + '</div><div class="muted">MIDI ' + v + ' · ' + fmt(f, 1) + ' Hz</div>';
        o.append(el('button', { class: 'btn sm', type: 'button', style: 'margin-top:.6rem', text: '♪ ' + t({ tr: 'Çal', en: 'Play' }), onclick: () => play(f) }));
      }
    }
    if (lens === 'pix') o.innerHTML = '<div class="lens-pix">' + bits.map((b) => '<i class="' + (b ? 'on' : '') + '"></i>').join('') + '</div><div class="muted">' + esc(t({ tr: '1 = siyah piksel, 0 = beyaz piksel. Sekiz satırını yan yana koyarsan 8×8 bir resim olur.', en: '1 = black pixel, 0 = white pixel. Stack eight rows and you have an 8×8 picture.' })) + '</div>';
  }
  drawLens();

  tryIt($('#try'), [
    { label: t({ tr: 'Desen sayısı', en: 'Patterns' }), fn: GEN.patterns },
    { label: t({ tr: 'En büyük sayı', en: 'Largest number' }), fn: GEN.maxValue },
    { label: t({ tr: 'Kaç bit?', en: 'How many bits?' }), fn: GEN.bitsNeeded },
  ]);
})();
