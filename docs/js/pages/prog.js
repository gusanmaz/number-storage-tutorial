/* Bölüm — Kodda sayılar: konsol (eval'siz), bit operatörü oyun alanı, JS sayı sınırı */
(function () {
  const { t, $, $$, el, esc, pad, toBase, fmt, rand, pick } = NS;

  /* ---------- 1) konsol ---------- */
  const cin = $('#cv-in'), cout = $('#cv-out');
  function parseLit(s) {
    const m = s.trim().match(/^([+-])?(0x[0-9a-f_]+|0b[01_]+|0o[0-7_]+|\d[\d_]*)$/i);
    if (!m || /__|_$/.test(m[2])) return null;
    const body = m[2].replace(/_/g, '');
    const v = BigInt(body);
    return m[1] === '-' ? -v : v;
  }
  const line = (code, out, cls) => '<div class="cl-line"><span class="cl-in">' + esc(code) + '</span><span class="cl-out ' + (cls || '') + '">' + esc(out) + '</span></div>';
  function conv() {
    const v = parseLit(cin.value);
    cin.classList.toggle('invalid', v == null && !!cin.value.trim());
    if (v == null) { cout.innerHTML = '<p class="bad">' + esc(t({ tr: 'Geçerli bir tamsayı yaz: 255, -42, 0xFF, 0b1010, 0o17, 1_000…', en: 'Enter a valid integer: 255, -42, 0xFF, 0b1010, 0o17, 1_000…' })) + '</p>'; return; }
    const neg = v < 0n, abs = neg ? -v : v, sgn = neg ? '-' : '';
    const n = Number(v), safe = Number.isSafeInteger(n);
    let js = line('let n = ' + cin.value.trim() + ';', '') + line('n', safe ? String(n) : String(n) + '  ⚠', safe ? '' : 'bad') +
      line('n.toString(2)', '"' + sgn + abs.toString(2) + '"') + line('n.toString(8)', '"' + sgn + abs.toString(8) + '"') + line('n.toString(16)', '"' + sgn + abs.toString(16) + '"');
    if (neg && v >= -2147483648n) js += line('(n >>> 0).toString(2)', '"' + (Number(v) >>> 0).toString(2) + '"', 'hexc');
    if (!safe) js += line('BigInt("' + v + '")', v + 'n', 'okc');
    let py = line('n = ' + cin.value.trim(), '') + line('n', String(v)) + line('bin(n)', "'" + sgn + '0b' + abs.toString(2) + "'") + line('oct(n)', "'" + sgn + '0o' + abs.toString(8) + "'") + line('hex(n)', "'" + sgn + '0x' + abs.toString(16) + "'") + line('n.bit_length()', String(abs.toString(2).length * (abs ? 1 : 0)));
    if (neg && v >= -128n) py += line('bin(n & 0xFF)', "'0b" + (Number(v) & 255).toString(2) + "'", 'hexc');
    cout.innerHTML = '<div class="console"><div class="console-h">JavaScript</div>' + js + '</div><div class="console"><div class="console-h">Python</div>' + py + '</div>';
  }
  cin.addEventListener('input', conv);
  conv();

  /* ---------- 2) bit operatörü oyun alanı ---------- */
  let op = '&', sh = 2;
  const OPS = [['&', 'AND'], ['|', 'OR'], ['^', 'XOR'], ['~', 'NOT'], ['<<', t({ tr: 'sola kaydır', en: 'shift left' })], ['>>', t({ tr: 'sağa kaydır', en: 'shift right' })]];
  const w = (i) => String(Math.pow(2, 7 - i));
  const A = NS.bits($('#bw-a'), { n: 8, value: 0b11001010, group: 4, size: 'sm', weight: w, onChange: upd, label: 'A' });
  const B = NS.bits($('#bw-b'), { n: 8, value: 0b10100110, group: 4, size: 'sm', weight: w, onChange: upd, label: 'B' });
  const Rb = NS.bits($('#bw-r'), { n: 8, value: 0, group: 4, size: 'sm', weight: w, readonly: true, label: 'result' });
  const opsBox = $('#bw-ops');
  OPS.forEach(([o, l]) => {
    const b = el('button', { type: 'button', class: 'btn sm' + (o === op ? ' on' : ''), html: '<b class="mono">' + esc(o === '~' ? '~A' : o === '<<' || o === '>>' ? 'A ' + o + ' n' : 'A ' + o + ' B') + '</b> <span class="muted">' + esc(l) + '</span>' });
    b.addEventListener('click', () => { op = o; $$('.btn', opsBox).forEach((x) => x.classList.toggle('on', x === b)); upd(); });
    opsBox.append(b);
  });
  const shSel = el('select', { class: 'input', style: 'width:auto;height:34px', 'aria-label': 'n' });
  [1, 2, 3, 4].forEach((k) => shSel.append(el('option', { value: k, text: 'n = ' + k, selected: k === sh ? true : null })));
  shSel.addEventListener('change', () => { sh = +shSel.value; upd(); });
  opsBox.append(shSel);
  const b8 = (x) => pad((x & 255).toString(2), 8);
  function upd() {
    const a = A.value(), b = B.value();
    const usesB = ['&', '|', '^'].includes(op);
    $('#bw-brow').style.display = usesB ? '' : 'none';
    shSel.style.display = op === '<<' || op === '>>' ? '' : 'none';
    let r, why, js, py;
    const ab = A.get(), bb = B.get();
    if (op === '&') { r = a & b; why = t({ tr: 'Sadece A’da <b>ve</b> B’de 1 olan konumlar 1 olur.', en: 'Only positions that are 1 in A <b>and</b> B become 1.' }); }
    if (op === '|') { r = a | b; why = t({ tr: 'A’da <b>veya</b> B’de 1 olan her konum 1 olur.', en: 'Every position that is 1 in A <b>or</b> B becomes 1.' }); }
    if (op === '^') { r = a ^ b; why = t({ tr: 'Bitlerin <b>farklı</b> olduğu konumlar 1 olur. Aynıysa 0.', en: 'Positions where the bits <b>differ</b> become 1. Same → 0.' }); }
    if (op === '~') { r = ~a & 255; why = t({ tr: 'Her bit ters çevrildi. (8 bitte ~A = 255 − A)', en: 'Every bit flipped. (In 8 bits ~A = 255 − A)' }); }
    if (op === '<<') { const full = a << sh; r = full & 255; why = t({ tr: 'Bitler ' + sh + ' basamak sola kaydı, sağdan 0 girdi. A × 2<sup>' + sh + '</sup> = ' + full + (full > 255 ? ', ama 8 bite sığmadığı için soldan taşan bitler kayboldu → ' + r : ''), en: 'Bits moved ' + sh + ' places left, zeros came in on the right. A × 2<sup>' + sh + '</sup> = ' + full + (full > 255 ? ', but it does not fit in 8 bits, so the bits shifted out are lost → ' + r : '') }); }
    if (op === '>>') { r = a >> sh; why = t({ tr: 'Bitler ' + sh + ' basamak sağa kaydı; sağdan düşenler kayboldu. ⌊A ÷ 2<sup>' + sh + '</sup>⌋ = ' + r, en: 'Bits moved ' + sh + ' places right; the ones falling off are lost. ⌊A ÷ 2<sup>' + sh + '</sup>⌋ = ' + r }); }
    Rb.set(r, true);
    // sonuç bitlerini işlemle ilişkilendir
    Rb.buttons.forEach((btn, i) => { btn.classList.toggle('from-a', !!(op === '~' ? !ab[i] : false)); });
    const val = (x) => x + ' <span class="hex">0x' + pad(toBase(x, 16), 2) + '</span>';
    $('#bw-av').innerHTML = val(a); $('#bw-bv').innerHTML = val(b); $('#bw-rv').innerHTML = val(r);
    $('#bw-note').innerHTML = why;
    const ex = op === '~' ? '~0b' + b8(a) + ' & 0xFF' : op === '<<' || op === '>>' ? '0b' + b8(a) + ' ' + op + ' ' + sh + (op === '<<' ? '  & 0xFF' : '') : '0b' + b8(a) + ' ' + op + ' 0b' + b8(b);
    js = esc(ex).replace('  &amp; 0xFF', ' &amp; 0xFF') + '   <span class="tk-c">// ' + r + ' (0b' + b8(r) + ')</span>';
    py = js.replace('//', '#');
    $('#bw-js').innerHTML = '<code>' + (op === '<<' ? '(' + esc('0b' + b8(a) + ' << ' + sh) + ') &amp; 0xFF   <span class="tk-c">// ' + r + ' (0b' + b8(r) + ')</span>' : js) + '</code>';
    $('#bw-py').innerHTML = '<code>' + (op === '<<' ? '(' + esc('0b' + b8(a) + ' << ' + sh) + ') &amp; 0xFF   <span class="tk-c"># ' + r + ' (0b' + b8(r) + ')</span>' : py) + '</code>';
    void bb;
  }
  upd();

  /* ---------- 3) JS sınırı ---------- */
  const jl = $('#jl-in'), jo = $('#jl-out');
  function limit() {
    const s = jl.value.trim().replace(/_/g, '');
    if (!/^-?\d+$/.test(s)) { jl.classList.add('invalid'); jo.innerHTML = ''; return; }
    jl.classList.remove('invalid');
    const big = BigInt(s), num = Number(s), back = BigInt(num);
    const ok = back === big;
    jo.innerHTML =
      '<div class="stat"><div class="stat-label">' + t({ tr: 'Yazdığın', en: 'You typed' }) + '</div><div class="stat-value" style="font-size:.95rem">' + esc(big.toString()) + '</div></div>' +
      '<div class="stat"><div class="stat-label">Number(…)</div><div class="stat-value ' + (ok ? 'ok-text' : 'bad') + '" style="font-size:.95rem">' + esc(back.toString()) + '</div></div>' +
      '<div class="stat"><div class="stat-label">Number.isSafeInteger</div><div class="stat-value ' + (Number.isSafeInteger(num) ? 'ok-text' : 'bad') + '">' + Number.isSafeInteger(num) + '</div></div>' +
      '<div class="stat"><div class="stat-label">' + t({ tr: 'Güvenli sınır', en: 'Safe limit' }) + '</div><div class="stat-value" style="font-size:.85rem">2<sup>53</sup> − 1 = ' + fmt(Number.MAX_SAFE_INTEGER) + '</div></div>';
  }
  jl.addEventListener('input', limit);
  limit();

  /* ---------- alıştırma ---------- */
  const codeQ = () => {
    const n = rand(1, 255), k = pick(['js16', 'js2', 'pyhex', 'pybin', 'f08b', 'parse']);
    const Q = {
      js16: ['JS: <code>(' + n + ').toString(16)</code>', '"' + n.toString(16) + '"'],
      js2: ['JS: <code>(' + n + ').toString(2)</code>', '"' + n.toString(2) + '"'],
      pyhex: ['Python: <code>hex(' + n + ')</code>', "'0x" + n.toString(16) + "'"],
      pybin: ['Python: <code>bin(' + n + ')</code>', "'0b" + n.toString(2) + "'"],
      f08b: ['Python: <code>f"{' + n + ':08b}"</code>', "'" + pad(n.toString(2), 8) + "'"],
      parse: ['JS: <code>parseInt("' + n.toString(16).toUpperCase() + '", 16)</code>', String(n)],
    }[k];
    return { q: Q[0] + ' ' + t({ tr: 'ne döndürür?', en: 'returns what?' }), a: Q[1], kind: 'code', hint: t({ tr: 'Tırnakları yazmasan da olur. toString/hex küçük harf kullanır.', en: 'Quotes are optional. toString/hex use lowercase.' }), explain: '<code>' + esc(Q[1]) + '</code>' };
  };
  const maskQ = () => {
    const x = rand(0, 255), n = rand(0, 7), kind = pick(['get', 'set', 'clr', 'tog']);
    const res = { get: (x >> n) & 1, set: x | (1 << n), clr: x & ~(1 << n), tog: x ^ (1 << n) }[kind];
    const ex = { get: '(x >> ' + n + ') & 1', set: 'x | (1 << ' + n + ')', clr: 'x & ~(1 << ' + n + ')', tog: 'x ^ (1 << ' + n + ')' }[kind];
    return { q: '<code>x = 0b' + pad(x.toString(2), 8) + '</code> → <code>' + esc(ex) + '</code> = ? ' + t({ tr: '(onlu)', en: '(decimal)' }), a: String(res), kind: 'dec', hint: '1 << ' + n + ' = 0b' + pad((1 << n).toString(2), 8), explain: '<b>' + res + '</b> = 0b' + pad(res.toString(2), kind === 'get' ? 1 : 8) };
  };
  NS.practice($('#practice'), [
    { label: t({ tr: 'Bit operatörleri', en: 'Bitwise operators' }), fn: GEN.bitwise },
    { label: t({ tr: 'Maskeler', en: 'Masks' }), fn: maskQ },
    { label: t({ tr: 'Fonksiyon çıktısı', en: 'Function output' }), fn: codeQ },
  ]);
})();
