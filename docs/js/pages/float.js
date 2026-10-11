/* Bölüm — Ondalıklı sayılar: kesir → binary, IEEE 754 dönüştürücü, float laboratuvarı, 0.1+0.2, boşluklar */
(function () {
  const { t, $, el, esc, pad, fmt } = NS;
  const dv = new DataView(new ArrayBuffer(8));
  const f32bits = (x) => { dv.setFloat32(0, x); return dv.getUint32(0); };
  const f32val = (u) => { dv.setUint32(0, u >>> 0); return dv.getFloat32(0); };
  const hex32 = (u) => '0x' + pad((u >>> 0).toString(16).toUpperCase(), 8);
  const bin32 = (u) => pad((u >>> 0).toString(2), 32);

  /** m × 2^e değerinin tam onlu açılımı (BigInt). */
  function exactDecimal(m, e) {
    if (m === 0n) return '0';
    if (e >= 0) return (m << BigInt(e)).toString();
    const n = -e;
    const s = (m * 5n ** BigInt(n)).toString().padStart(n + 1, '0');
    const ip = s.slice(0, s.length - n), fp = s.slice(s.length - n).replace(/0+$/, '');
    return ip + (fp ? '.' + fp : '');
  }
  function f32exact(u) {
    const sign = u >>> 31, ex = (u >>> 23) & 255, fr = u & 0x7fffff;
    if (ex === 255) return fr ? 'NaN' : (sign ? '−∞' : '+∞');
    const m = ex === 0 ? BigInt(fr) : BigInt(fr | 0x800000), e = ex === 0 ? -149 : ex - 150;
    return (sign ? '−' : '') + exactDecimal(m, e);
  }
  function f64exact(x) {
    dv.setFloat64(0, x);
    const b = dv.getBigUint64(0), sign = b >> 63n, ex = Number((b >> 52n) & 0x7ffn), fr = b & ((1n << 52n) - 1n);
    if (ex === 2047) return fr ? 'NaN' : (sign ? '−∞' : '+∞');
    const m = ex === 0 ? fr : fr | (1n << 52n), e = ex === 0 ? -1074 : ex - 1075;
    return (sign ? '−' : '') + exactDecimal(m, e);
  }
  const clip = (s, n) => (s.length > n ? s.slice(0, n) + '…' : s);
  /** "0.625" → { neg, ip: BigInt, num: BigInt, den: BigInt, k } */
  function parseDec(str) {
    const m = String(str).trim().replace(',', '.').match(/^([+-])?(\d*)(?:\.(\d*))?$/);
    if (!m || (!m[2] && !m[3])) return null;
    const fpart = (m[3] || '').slice(0, 15);
    return { neg: m[1] === '-', ip: BigInt(m[2] || '0'), num: BigInt(fpart || '0'), den: 10n ** BigInt(fpart.length), k: fpart.length };
  }
  const ratStr = (num, den, k) => { // num/den (den = 10^k) onlu yazımı
    const ip = num / den, r = num % den;
    if (k === 0) return ip.toString();
    const f = r.toString().padStart(k, '0').replace(/0+$/, '');
    return ip.toString() + (f ? '.' + f : '.0');
  };
  /** Kesri 2 ile çarparak bitlere ayırır; döngü yakalanır. */
  function fracBits(num, den, max) {
    const rows = [], seen = new Map();
    let x = num, cycle = -1;
    while (x !== 0n && rows.length < max) {
      if (seen.has(x)) { cycle = seen.get(x); break; }
      seen.set(x, rows.length);
      const y = x * 2n, bit = y >= den ? 1 : 0;
      rows.push({ x, y, bit });
      x = bit ? y - den : y;
    }
    return { rows, cycle, done: x === 0n };
  }

  /* ---------- 1) kesir → binary ---------- */
  (function () {
    const inp = $('#fr-in'), rowsBox = $('#fr-rows'), out = $('#fr-out'), note = $('#fr-note');
    ['0.625', '0.75', '0.1', '0.2', '0.3125', '0.7'].forEach((v) => {
      const b = el('button', { type: 'button', class: 'btn ghost sm mono', text: v });
      b.addEventListener('click', () => { inp.value = v; recompute(); });
      $('#fr-presets').append(b);
    });
    let P = null, R = null;
    function compute() {
      P = parseDec(inp.value);
      inp.classList.toggle('invalid', !P);
      if (!P) { R = { rows: [], cycle: -1, done: true }; return; }
      R = fracBits(P.num, P.den, 24);
    }
    function bitsStr(n) {
      let s = R.rows.slice(0, n).map((r) => r.bit).join('');
      if (R.cycle >= 0 && n >= R.rows.length) s = s.slice(0, R.cycle) + '<span class="rep">' + s.slice(R.cycle) + '</span>';
      return s;
    }
    function render(i) {
      if (!P) { rowsBox.innerHTML = ''; out.innerHTML = ''; note.innerHTML = '<span class="bad">' + esc(t({ tr: 'Geçerli bir sayı yaz (ör. 0.625).', en: 'Enter a valid number (e.g. 0.625).' })) + '</span>'; return; }
      const n = R.rows.length, shown = Math.min(i + 1, n);
      rowsBox.innerHTML = R.rows.slice(0, shown).map((r, j) => {
        const rep = R.cycle >= 0 && j >= R.cycle;
        return '<tr class="' + (j === shown - 1 && i < n ? 'cur' : '') + (rep ? ' reprow' : '') + '"><td class="m muted">' + (j + 1) + '</td><td class="m">' + ratStr(r.x, P.den, P.k) + ' × 2</td><td class="m">= ' + ratStr(r.y, P.den, P.k) + '</td><td class="m"><b class="bin">' + r.bit + '</b></td></tr>';
      }).join('') || '<tr><td colspan="4" class="muted">' + esc(t({ tr: 'Kesir kısmı 0: binary’de de 0.', en: 'The fraction is 0: also 0 in binary.' })) + '</td></tr>';
      const ip = P.ip.toString(2);
      out.innerHTML = '<span class="dec">' + (P.neg ? '−' : '') + P.ip + (P.k ? '.' + ratStr(P.num, P.den, P.k).split('.')[1] : '') + '</span><sub>10</sub> = <b class="bin">' + (P.neg ? '−' : '') + ip + '.' + (bitsStr(i >= n ? n : shown) || '0') + (i >= n && !R.done && R.cycle < 0 ? '…' : '') + '</b><sub>2</sub>';
      if (i < n) {
        const r = R.rows[shown - 1];
        note.innerHTML = t({ tr: ratStr(r.x, P.den, P.k) + ' × 2 = ' + ratStr(r.y, P.den, P.k) + ' → tam kısım <b>' + r.bit + '</b>. ' + (r.bit ? '1’i çıkarıp kesirle devam: ' : 'Kesirle devam: ') + ratStr(r.bit ? r.y - P.den : r.y, P.den, P.k), en: ratStr(r.x, P.den, P.k) + ' × 2 = ' + ratStr(r.y, P.den, P.k) + ' → integer part <b>' + r.bit + '</b>. ' + (r.bit ? 'Drop the 1 and continue with ' : 'Continue with ') + ratStr(r.bit ? r.y - P.den : r.y, P.den, P.k) });
      } else if (R.done) {
        note.innerHTML = t({ tr: 'Kesir 0 oldu → dur. Bu sayı binary’de <b>tam olarak</b> yazılabilir (' + n + ' bit). Bitleri yukarıdan aşağı oku.', en: 'The fraction reached 0 → stop. This number is <b>exactly</b> representable in binary (' + n + ' bits). Read the bits top to bottom.' });
      } else if (R.cycle >= 0) {
        note.innerHTML = t({ tr: '<b>Döngü!</b> ' + ratStr(R.rows[R.cycle].x, P.den, P.k) + ' kesri ' + (R.cycle + 1) + '. adımda zaten görülmüştü. Bundan sonra aynı bitler sonsuza kadar tekrar eder (vurgulu kısım). Bilgisayar bu yüzden sayıyı bir yerde <b>keser ve yuvarlar</b>.', en: '<b>A cycle!</b> The fraction ' + ratStr(R.rows[R.cycle].x, P.den, P.k) + ' was already seen at step ' + (R.cycle + 1) + '. From here the same bits repeat forever (highlighted). That is why the computer must <b>cut and round</b> it.' });
      } else {
        note.innerHTML = t({ tr: '24 adımda bitmedi; bu kesir çok uzun ya da sonsuz.', en: 'Not finished after 24 steps; this fraction is very long or infinite.' });
      }
    }
    compute();
    const st = NS.stepper($('#fr-stepper'), { count: Math.max(1, R.rows.length + 1), render, interval: 1100 });
    function recompute() { compute(); st.reset(Math.max(1, R.rows.length + 1)); }
    inp.addEventListener('input', recompute);
  })();

  /* ---------- 2) IEEE 754 dönüştürücü ---------- */
  (function () {
    const inp = $('#cv-in'), board = $('#cv-board'), note = $('#cv-note');
    ['6.75', '-0.15625', '0.1', '13.5', '3.14'].forEach((v) => {
      const b = el('button', { type: 'button', class: 'btn ghost sm mono', text: v });
      b.addEventListener('click', () => { inp.value = v; recompute(); });
      $('#cv-presets').append(b);
    });
    let S = null;
    function compute() {
      const P = parseDec(inp.value);
      const x = parseFloat(String(inp.value).replace(',', '.'));
      if (!P || !isFinite(x)) { S = null; return; }
      const u = f32bits(x), ex = (u >>> 23) & 255;
      if (ex === 0 || ex === 255 || x === 0) { S = { special: true, x, u }; return; }
      const F = fracBits(P.num, P.den, 40);
      const ipBin = P.ip.toString(2);
      let fb = F.rows.map((r) => r.bit).join('');
      const fracInfinite = !F.done;
      let E, norm;
      if (P.ip > 0n) { E = ipBin.length - 1; norm = ipBin.slice(1) + fb; }
      else { const p = fb.indexOf('1'); E = -(p + 1); norm = fb.slice(p + 1); }
      const realE = ex - 127;
      S = { x, u, P, ipBin, fb, fracInfinite, cycle: F.cycle, E: realE, Eguess: E, norm, ex, mant: bin32(u).slice(9), rounded: norm.length > 23 || fracInfinite };
    }
    const line = (label, html, cur) => '<div class="cv-line' + (cur ? ' cur' : '') + '"><span class="cv-l">' + label + '</span><span class="cv-v">' + html + '</span></div>';
    function render(i) {
      if (!S) { board.innerHTML = ''; note.innerHTML = '<span class="bad">' + esc(t({ tr: 'Geçerli bir sayı yaz (ör. 6.75).', en: 'Enter a valid number (e.g. 6.75).' })) + '</span>'; return; }
      if (S.special) {
        board.innerHTML = line(t({ tr: 'Bitler', en: 'Bits' }), colorBits(S.u), true);
        note.innerHTML = t({ tr: 'Bu sayı özel bir durum (sıfır, alt-normal ya da float aralığının dışında). Ayrıntılar için aşağıdaki laboratuvarı kullan.', en: 'This number is a special case (zero, subnormal, or out of float range). Use the lab below for details.' });
        return;
      }
      const L = [];
      const neg = S.x < 0;
      L.push(line(t({ tr: '1 · İşaret', en: '1 · Sign' }), (neg ? t({ tr: 'negatif', en: 'negative' }) : t({ tr: 'pozitif', en: 'positive' })) + ' → <b class="s-sign">' + (neg ? 1 : 0) + '</b>', i === 0));
      if (i >= 1) L.push(line(t({ tr: '2 · Tam kısım', en: '2 · Integer part' }), S.P.ip + ' → <b class="bin">' + S.ipBin + '</b>', i === 1));
      if (i >= 2) L.push(line(t({ tr: '3 · Kesir kısmı', en: '3 · Fraction part' }), '0.' + (S.P.k ? ratStr(S.P.num, S.P.den, S.P.k).split('.')[1] : '0') + ' → <b class="bin">.' + (clip(S.fb, 28) || '0') + (S.fracInfinite ? '…' : '') + '</b>', i === 2));
      if (i >= 3) L.push(line(t({ tr: '4 · Birleştir', en: '4 · Combine' }), '<b class="bin">' + S.ipBin + '.' + (clip(S.fb, 28) || '0') + (S.fracInfinite ? '…' : '') + '</b>', i === 3));
      if (i >= 4) L.push(line(t({ tr: '5 · Normalize', en: '5 · Normalize' }), '<b class="bin">1.' + clip(S.norm, 26) + (S.fracInfinite ? '…' : '') + '</b> × 2<sup>' + S.E + '</sup>', i === 4));
      if (i >= 5) L.push(line(t({ tr: '6 · Üs alanı', en: '6 · Exponent field' }), S.E + ' + 127 = ' + S.ex + ' → <b class="s-exp">' + pad(S.ex.toString(2), 8) + '</b>', i === 5));
      if (i >= 6) L.push(line(t({ tr: '7 · Mantis', en: '7 · Mantissa' }), '<b class="s-mant">' + S.mant + '</b>', i === 6));
      if (i >= 7) L.push(line(t({ tr: '8 · Sonuç', en: '8 · Result' }), colorBits(S.u) + ' <span class="hex">' + hex32(S.u) + '</span>', i === 7));
      board.innerHTML = L.join('');
      const notes = [
        t({ tr: 'Sayı ' + (neg ? 'negatif, işaret biti 1.' : 'pozitif, işaret biti 0.') + ' Bundan sonra sayının mutlak değeriyle çalışıyoruz.', en: 'The number is ' + (neg ? 'negative, sign bit 1.' : 'positive, sign bit 0.') + ' From now on we work with its absolute value.' }),
        t({ tr: 'Tam kısmı normal yöntemle binary’ye çeviriyoruz.', en: 'Convert the integer part to binary the usual way.' }),
        t({ tr: 'Kesir kısmını “2 ile çarp, tam kısmı al” yöntemiyle çeviriyoruz.' + (S.fracInfinite ? ' Bu kesir bitmiyor; bir yerde kesilecek.' : ''), en: 'Convert the fraction with “multiply by 2, take the integer part”.' + (S.fracInfinite ? ' This fraction never ends; it will be cut somewhere.' : '') }),
        t({ tr: 'İki parçayı nokta ile birleştiriyoruz.', en: 'Join the two parts with the point.' }),
        t({ tr: 'Noktayı ilk 1’in sağına kaydırıyoruz. ' + Math.abs(S.E) + ' basamak ' + (S.E >= 0 ? 'sola' : 'sağa') + ' kaydı → üs ' + S.E + '.', en: 'Move the point just right of the first 1. It moved ' + Math.abs(S.E) + ' place(s) ' + (S.E >= 0 ? 'left' : 'right') + ' → exponent ' + S.E + '.' }),
        t({ tr: 'Üsse 127 (bias) ekleyip 8 bit olarak yazıyoruz.', en: 'Add the bias 127 to the exponent and write it in 8 bits.' }),
        t({ tr: 'Noktadan sonraki bitleri 23 bite tamamlıyoruz; baştaki 1 saklanmıyor.' + (S.rounded ? ' 23 bite sığmayan kısım <b>yuvarlandı</b> — hassasiyet kaybı burada oluşuyor.' : ' Kalan yerler 0 ile doluyor.'), en: 'Fill the bits after the point to 23 bits; the leading 1 is not stored.' + (S.rounded ? ' The part that did not fit was <b>rounded</b> — this is where precision is lost.' : ' The rest is padded with zeros.') }),
        t({ tr: 'Bitti! Saklanan tam değer: <b class="mono">' + clip(f32exact(S.u), 40) + '</b>' + (S.rounded ? ' — yazdığın sayıya çok yakın ama aynısı değil.' : ' — yazdığın sayının ta kendisi.'), en: 'Done! The exact stored value is <b class="mono">' + clip(f32exact(S.u), 40) + '</b>' + (S.rounded ? ' — very close to what you typed, but not the same.' : ' — exactly what you typed.') }),
      ];
      note.innerHTML = notes[i];
    }
    compute();
    const st = NS.stepper($('#cv-stepper'), { count: 8, render, interval: 1800 });
    function recompute() { compute(); st.reset(S && S.special ? 1 : 8); }
    inp.addEventListener('input', recompute);
  })();

  function colorBits(u) {
    const b = bin32(u);
    return '<span class="cbits"><b class="s-sign">' + b[0] + '</b> <b class="s-exp">' + b.slice(1, 9) + '</b> <b class="s-mant">' + b.slice(9) + '</b></span>';
  }

  /* ---------- 3) float laboratuvarı ---------- */
  (function () {
    const inp = $('#lab-in'), stats = $('#lab-stats'), formula = $('#lab-formula'), exact = $('#lab-exact');
    const presets = [['1', 1], ['−2', -2], ['0.1', 0.1], ['6.75', 6.75], ['π', Math.PI], ['0', 0], ['−0', -0], ['∞', Infinity], ['NaN', NaN], ['max', 3.4028234663852886e38], [t({ tr: 'en küçük normal', en: 'min normal' }), 1.1754943508222875e-38], [t({ tr: 'en küçük', en: 'min' }), 1.401298464324817e-45]];
    presets.forEach(([l, v]) => {
      const b = el('button', { type: 'button', class: 'btn ghost sm mono', text: l });
      b.addEventListener('click', () => { inp.value = Object.is(v, -0) ? '-0' : String(v); fromInput(); });
      $('#lab-presets').append(b);
    });
    const row = NS.bits($('#lab-bits'), {
      n: 32, value: 0, size: 'xs', gaps: [1, 9], label: 'float32',
      cls: (i) => (i === 0 ? 'b-sign' : i < 9 ? 'b-exp' : 'b-mant'),
      onChange: () => { const u = row.value(); inp.value = String(f32val(u)).replace(/^-0$/, '-0'); show(u, null); },
    });
    function fromInput() {
      const raw = inp.value.trim().replace(',', '.');
      let x = raw === '∞' || /^\+?inf/i.test(raw) ? Infinity : /^-inf/i.test(raw) || raw === '-∞' ? -Infinity : /^nan$/i.test(raw) ? NaN : Number(raw);
      if (raw === '' || (isNaN(x) && !/^nan$/i.test(raw))) { inp.classList.add('invalid'); return; }
      inp.classList.remove('invalid');
      const u = f32bits(x);
      row.set(u, true);
      show(u, x);
    }
    function show(u, typed) {
      const sign = u >>> 31, ex = (u >>> 23) & 255, fr = u & 0x7fffff, v = f32val(u);
      let expTxt, mantTxt, form;
      if (ex === 255) {
        expTxt = '11111111 = 255 (' + t({ tr: 'özel', en: 'special' }) + ')';
        mantTxt = fr ? '≠ 0 → NaN' : '0 → ∞';
        form = fr ? t({ tr: 'Üs tamamen 1 ve mantis ≠ 0 → <b>NaN</b> (Not a Number)', en: 'Exponent all ones and mantissa ≠ 0 → <b>NaN</b> (Not a Number)' }) : t({ tr: 'Üs tamamen 1 ve mantis 0 → <b>' + (sign ? '−' : '+') + '∞</b>', en: 'Exponent all ones and mantissa 0 → <b>' + (sign ? '−' : '+') + '∞</b>' });
      } else if (ex === 0) {
        expTxt = '00000000 → 2<sup>−126</sup> (' + t({ tr: 'alt-normal', en: 'subnormal' }) + ')';
        mantTxt = '0.' + bin32(u).slice(9).replace(/0+$/, '') + ' ≈ ' + (fr / 8388608).toPrecision(8);
        form = fr ? '(−1)<sup>' + sign + '</sup> × 0.' + t({ tr: 'mantis', en: 'mantissa' }) + ' × 2<sup>−126</sup> = <b>' + v + '</b> <span class="muted">(' + t({ tr: 'gizli bit 0', en: 'hidden bit is 0' }) + ')</span>' : t({ tr: 'Üs ve mantis tamamen 0 → <b>' + (sign ? '−' : '+') + '0</b>', en: 'Exponent and mantissa all zero → <b>' + (sign ? '−' : '+') + '0</b>' });
      } else {
        const m = 1 + fr / 8388608;
        expTxt = pad(ex.toString(2), 8) + ' = ' + ex + ' → ' + ex + ' − 127 = <b>' + (ex - 127) + '</b>';
        mantTxt = '1.' + (bin32(u).slice(9).replace(/0+$/, '') || '0') + '₂ ≈ ' + m.toPrecision(10).replace(/0+$/, '');
        form = '(−1)<sup>' + sign + '</sup> × ' + m.toPrecision(10).replace(/0+$/, '').replace(/\.$/, '') + ' × 2<sup>' + (ex - 127) + '</sup> = <b>' + (Object.is(v, -0) ? '-0' : v) + '</b>';
      }
      stats.innerHTML =
        '<div class="stat"><div class="stat-label">' + t({ tr: 'İşaret', en: 'Sign' }) + '</div><div class="stat-value s-sign">' + sign + ' <small>(' + (sign ? '−' : '+') + ')</small></div></div>' +
        '<div class="stat"><div class="stat-label">' + t({ tr: 'Üs', en: 'Exponent' }) + '</div><div class="stat-value s-exp" style="font-size:.95rem">' + expTxt + '</div></div>' +
        '<div class="stat"><div class="stat-label">' + t({ tr: 'Mantis', en: 'Mantissa' }) + '</div><div class="stat-value s-mant" style="font-size:.95rem">' + mantTxt + '</div></div>' +
        '<div class="stat"><div class="stat-label">Hex</div><div class="stat-value hex">' + hex32(u) + '</div></div>';
      formula.innerHTML = form;
      if (ex === 255) { exact.innerHTML = ''; return; }
      const ex32 = f32exact(u);
      let h = t({ tr: 'Bellekte saklanan <b>tam</b> değer: ', en: 'The <b>exact</b> value stored in memory: ' }) + '<span class="mono exact-num">' + esc(clip(ex32, 120)) + '</span>';
      if (typed != null && isFinite(typed) && typed !== v) {
        h += '<br>' + t({ tr: 'Yazdığın değerle fark: ', en: 'Difference from what you typed: ' }) + '<span class="mono bad">' + (v - typed).toExponential(3) + '</span>' +
          ' <span class="muted">(' + t({ tr: 'yuvarlama hatası', en: 'rounding error' }) + ')</span>';
      } else if (typed != null && isFinite(typed)) {
        h += '<br><span class="ok-text">✓ ' + t({ tr: 'Bu sayı float32’de tam olarak saklanabiliyor.', en: 'This number is stored exactly in float32.' }) + '</span>';
      }
      exact.innerHTML = h;
    }
    inp.addEventListener('input', fromInput);
    fromInput();
  })();

  /* ---------- 4) 0.1 + 0.2 ---------- */
  (function () {
    const a = $('#sum-a'), b = $('#sum-b'), out = $('#sum-out');
    function render() {
      const A = parseDec(a.value), B = parseDec(b.value);
      if (!A || !B) { out.innerHTML = '<p class="bad">' + esc(t({ tr: 'İki geçerli ondalık sayı yaz.', en: 'Enter two valid decimals.' })) + '</p>'; return; }
      const x = Number(a.value.replace(',', '.')), y = Number(b.value.replace(',', '.'));
      // onlu (kesin) toplam
      const k = Math.max(A.k, B.k), sc = (P) => ((P.ip * P.den + P.num) * (P.neg ? -1n : 1n)) * 10n ** BigInt(k - P.k);
      const S = sc(A) + sc(B), den = 10n ** BigInt(k);
      const neg = S < 0n, absS = neg ? -S : S;
      const exactSum = (neg ? '-' : '') + ratStr(absS, den, k).replace(/\.0$/, '');
      const js = x + y, target = Number(exactSum);
      const same = js === target;
      const row = (label, val, store, cls) => '<tr><td>' + label + '</td><td class="m">' + esc(val) + '</td><td class="m exact-num ' + (cls || '') + '">' + esc(clip(store, 60)) + '</td></tr>';
      out.innerHTML = '<div class="table-wrap"><table class="compact"><thead><tr><th></th><th>' + t({ tr: 'Yazılan / sonuç', en: 'Typed / result' }) + '</th><th>' + t({ tr: 'Bellekte saklanan tam değer (double)', en: 'Exact value stored (double)' }) + '</th></tr></thead><tbody>' +
        row('a', a.value, f64exact(x)) + row('b', b.value, f64exact(y)) +
        row('a + b', String(js), f64exact(js), same ? 'ok-text' : 'bad') +
        row(t({ tr: 'beklenen', en: 'expected' }) + ' ' + exactSum, exactSum, f64exact(target), same ? 'ok-text' : '') +
        '</tbody></table></div>' +
        '<div class="msg ' + (same ? 'good' : 'bad') + '">' + (same
          ? t({ tr: '✓ Bu sefer şanslısın: a + b, ' + exactSum + ' sayısının temsil edildiği double ile aynı yere düştü. (<code>' + a.value + ' + ' + b.value + ' === ' + exactSum + '</code> → true)', en: '✓ Lucky this time: a + b landed on the same double that represents ' + exactSum + '. (<code>' + a.value + ' + ' + b.value + ' === ' + exactSum + '</code> → true)' })
          : t({ tr: '✗ a + b sonucu, ' + exactSum + ' sayısının saklandığı double’dan farklı. Bu yüzden <code>' + a.value + ' + ' + b.value + ' === ' + exactSum + '</code> → <b>false</b>. Aradaki fark: ' + (js - target).toExponential(2), en: '✗ a + b is a different double from the one storing ' + exactSum + '. So <code>' + a.value + ' + ' + b.value + ' === ' + exactSum + '</code> → <b>false</b>. Difference: ' + (js - target).toExponential(2) })) + '</div>';
    }
    a.addEventListener('input', render); b.addEventListener('input', render);
    render();
  })();

  /* ---------- 5) boşluklar ---------- */
  (function () {
    const inp = $('#gap-in'), out = $('#gap-out');
    [['16777216', '2²⁴'], ['16777217', '2²⁴+1'], ['0.1', '0.1'], ['123456789', '123456789'], ['9007199254740993', '2⁵³+1']].forEach(([v, l]) => {
      const b = el('button', { type: 'button', class: 'btn ghost sm mono', text: l });
      b.addEventListener('click', () => { inp.value = v; render(); });
      $('#gap-presets').append(b);
    });
    function ulp64(x) { dv.setFloat64(0, Math.abs(x)); const b = dv.getBigUint64(0); dv.setBigUint64(0, b + 1n); return dv.getFloat64(0) - Math.abs(x); }
    function render() {
      const raw = inp.value.trim().replace(',', '.');
      const x = Number(raw);
      if (!raw || !isFinite(x)) { out.innerHTML = ''; inp.classList.add('invalid'); return; }
      inp.classList.remove('invalid');
      const f = Math.fround(x), u = f32bits(f);
      const up = f32val(u + 1) - f;
      const okF = f === x && String(BigInt.asIntN ? raw : raw) && (/^\d+$/.test(raw) ? BigInt(raw) === BigInt(Math.round(f)) : f === x);
      const isInt = /^-?\d+$/.test(raw);
      const okD = isInt ? BigInt(raw) === BigInt(x) : String(x) === raw || Number(raw) === x;
      out.innerHTML =
        '<div class="stat"><div class="stat-label">float32 ' + t({ tr: 'saklar', en: 'stores' }) + '</div><div class="stat-value ' + (okF ? 'ok-text' : 'bad') + '">' + esc(clip(f32exact(u), 26)) + '</div></div>' +
        '<div class="stat"><div class="stat-label">float32 ' + t({ tr: 'komşu aralığı', en: 'gap to next' }) + '</div><div class="stat-value">' + (up >= 1 ? fmt(up) : up.toExponential(2)) + '</div></div>' +
        '<div class="stat"><div class="stat-label">double ' + t({ tr: 'saklar', en: 'stores' }) + '</div><div class="stat-value ' + (okD ? 'ok-text' : 'bad') + '">' + esc(clip(isInt ? BigInt(x).toString() : f64exact(x), 26)) + '</div></div>' +
        '<div class="stat"><div class="stat-label">double ' + t({ tr: 'komşu aralığı', en: 'gap to next' }) + '</div><div class="stat-value">' + (ulp64(x) >= 1 ? fmt(ulp64(x)) : ulp64(x).toExponential(2)) + '</div></div>';
    }
    inp.addEventListener('input', render);
    render();
  })();

  /* ---------- alıştırma ---------- */
  NS.practice($('#practice'), [
    { label: t({ tr: 'Onlu kesir → binary', en: 'Decimal fraction → binary' }), fn: GEN.fracToBin },
    { label: t({ tr: 'Binary kesir → onlu', en: 'Binary fraction → decimal' }), fn: GEN.binFracToDec },
  ]);
})();
