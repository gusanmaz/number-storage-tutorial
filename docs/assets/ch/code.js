/* Bölüm 11 — Kodda bitler ve referanslar */
(function () {
  const { t, $, $$, el, esc, fmt, pad, toBase, group, lamps, steps, tryIt, rand, pick, LANG } = NS;
  const sub = (b) => '<span class="sub">' + b + '</span>';

  /* ---------- Şekil 1: sabit çevirmeni ---------- */
  function parseLit(s) {
    s = s.trim().replace(/^−/, '-');
    let m = s.match(/^([+-]?)0([bBoOxX])([0-9a-fA-F_]+)$/);
    if (m) {
      const base = { b: 2, o: 8, x: 16 }[m[2].toLowerCase()], digits = m[3].replace(/_/g, '');
      if (!digits || /^_|_$|__/.test(m[3])) return { err: t({ tr: 'Alt çizgi rakamların arasında olmalı.', en: 'Underscores must sit between digits.' }) };
      const valid = { 2: /^[01]+$/, 8: /^[0-7]+$/, 16: /^[0-9a-f]+$/i }[base];
      if (!valid.test(digits)) return { err: t({ tr: base + ' tabanında geçersiz rakam var.', en: 'There is an invalid digit for base ' + base + '.' }) };
      let v = 0n; for (const d of digits) v = v * BigInt(base) + BigInt(parseInt(d, 16));
      return { v: m[1] === '-' ? -v : v, base };
    }
    m = s.match(/^([+-]?)(\d[\d_]*)$/);
    if (m) {
      const digits = m[2].replace(/_/g, '');
      if (/_$|__/.test(m[2])) return { err: t({ tr: 'Alt çizgi rakamların arasında olmalı.', en: 'Underscores must sit between digits.' }) };
      const v = BigInt(digits) * (m[1] === '-' ? -1n : 1n);
      if (/^0\d/.test(digits)) return { v, base: 10, legacy: /^[0-7]+$/.test(digits) ? parseInt(digits, 8) : null };
      return { v, base: 10 };
    }
    if (/^[+-]?(\d[\d_]*)?\.?\d*([eE][+-]?\d+)?$/.test(s) && /\d/.test(s)) {
      const f = Number(s.replace(/_/g, ''));
      if (Number.isInteger(f) && Math.abs(f) <= Number.MAX_SAFE_INTEGER) return { v: BigInt(f), base: 10, sci: true };
      return { f };
    }
    return { err: t({ tr: 'Bu bir sayı sabitine benzemiyor.', en: 'That does not look like a number literal.' }) };
  }
  function drawLit() {
    const r = parseLit($('#lit-in').value), o = $('#lit-out');
    $('#lit-in').classList.toggle('bad', !!r.err);
    if (r.err) { o.innerHTML = '<p class="tell bad">' + esc(r.err) + '</p>'; return; }
    if (r.f != null) { o.innerHTML = '<p class="tell">' + t({ tr: 'Bu bir kesirli sayı (float): ', en: 'This is a floating-point number: ' }) + '<b class="mono">' + esc(String(r.f)) + '</b>. ' + t({ tr: 'Nasıl saklandığını Bölüm 6’da gördük.', en: 'Chapter 6 showed how it is stored.' }) + '</p>'; return; }
    const v = r.v, neg = v < 0n, a = neg ? -v : v, sg = neg ? '-' : '';
    const b2 = a.toString(2), b8 = a.toString(8), b16 = a.toString(16).toUpperCase(), big = a > 9007199254740991n;
    const row = (lbl, cls, val, py, js) => '<div class="lit-r"><span class="lit-l">' + lbl + '</span><b class="' + cls + '">' + val + '</b><code>' + esc(py) + '</code><code>' + esc(js) + '</code></div>';
    const n = String(v), jn = big ? n + 'n' : n, jp = neg ? '(' + jn + ')' : jn;
    o.innerHTML = '<div class="lit">' +
      '<div class="lit-r lhd"><span></span><span></span><span>Python</span><span>JavaScript</span></div>' +
      row(t({ tr: 'onlu', en: 'decimal' }), 'd', sg + group(a.toString(), 3, LANG === 'tr' ? '.' : ','), 'print(' + n + ')', 'console.log(' + jn + ')') +
      row(t({ tr: 'ikili', en: 'binary' }), 'b', sg + '0b' + group(b2, 4, '_'), 'bin(' + n + ')', jp + '.toString(2)') +
      row(t({ tr: 'sekizli', en: 'octal' }), 'b', sg + '0o' + b8, 'oct(' + n + ')', jp + '.toString(8)') +
      row('hex', 'h', sg + '0x' + group(b16, 4, '_'), 'hex(' + n + ')', jp + '.toString(16)') + '</div>' +
      '<p class="tell">' + t({ tr: 'Bit sayısı: ', en: 'Bits: ' }) + '<b>' + b2.length + '</b>' + (r.base !== 10 ? ' · ' + t({ tr: 'yazdığın taban: ', en: 'base you typed: ' }) + r.base : '') +
      (big ? ' · <span class="bad">' + t({ tr: '2⁵³’ten büyük: JavaScript’te sonuna n ekleyip BigInt yapmazsan değer bozulur.', en: 'Bigger than 2⁵³: in JavaScript it gets corrupted unless you add n to make a BigInt.' }) + '</span>' : '') +
      (r.legacy != null ? ' · <span class="bad">' + t({ tr: 'Baştaki 0! Python 3 bunu reddeder; C ve eski JS sekizli okur: ' + r.legacy + '.', en: 'Leading 0! Python 3 rejects it; C and old JS read it as octal: ' + r.legacy + '.' }) + '</span>' : '') +
      (r.sci ? ' · ' + t({ tr: 'Bilimsel gösterim bir float üretir; değeri tamsayı olsa da türü float’tır.', en: 'Scientific notation makes a float; its value is whole but its type is float.' }) : '') + '</p>';
  }
  $('#lit-in').addEventListener('input', drawLit);
  ['0xFF', '0b1010_1010', '0o755', '1_000_000', '-0x80', '1e3', '010', '9007199254740993'].forEach((v) => $('#lit-pre').append(el('button', { type: 'button', class: 'chip', text: v, onclick: () => { $('#lit-in').value = v; drawLit(); } })));
  drawLit();

  /* ---------- tahmin kartları ---------- */
  const P = [
    ['2 ** 53 + 1', '9007199254740993', '9007199254740992', { tr: 'JavaScript’te sayı bir double; 2⁵³ + 1 yazılamaz, en yakın double’a yuvarlanır. Python’un int’i sınırsız.', en: 'In JavaScript the number is a double; 2⁵³ + 1 cannot be represented and rounds. Python’s int is unbounded.' }],
    ['1 << 31', '2147483648', '-2147483648', { tr: 'JS bit işlemleri 32 bit işaretli çalışır; bit 31 işaret biti.', en: 'JS bitwise ops work on signed 32-bit; bit 31 is the sign bit.' }],
    ['0xFFFFFFFF | 0', '4294967295', '-1', { tr: '32 tane 1, ikiye tümleyende −1’dir.', en: 'Thirty-two 1s is −1 in two’s complement.' }],
    ['~5', '-6', '-6', { tr: 'Burada iki dil anlaşıyor: ~x = −x − 1.', en: 'Here both agree: ~x = −x − 1.' }],
    ['2 ** 64', '18446744073709551616', '18446744073709552000', { tr: 'JS’nin yazdırdığı sayı yuvarlanmış bir double. Tam değer için 2n ** 64n.', en: 'JS prints a rounded double. For the exact value use 2n ** 64n.' }],
    ['-7 % 3', '2', '-1', { tr: 'Python’da kalan bölenin işaretini alır, JS’de bölünenin. Bit değil ama aynı derecede şaşırtıcı!', en: 'Python’s remainder takes the divisor’s sign, JS’s takes the dividend’s. Not bits, but just as surprising!' }],
    ['-7 >> 1', '-4', '-4', { tr: 'Sağa kaydırma aşağı yuvarlar (−3,5 → −4), sıfıra doğru değil.', en: 'Right shift rounds down (−3.5 → −4), not toward zero.' }],
  ];
  $('#predict').innerHTML = P.map(([e, py, js, why], i) => '<div class="pc" data-i="' + i + '"><code class="pc-e">' + esc(e) + '</code><div class="pc-r"><span><small>Python</small><b' + (py !== js ? ' class="diff"' : '') + '>' + esc(py) + '</b></span><span><small>JavaScript</small><b' + (py !== js ? ' class="diff"' : '') + '>' + esc(js) + '</b></span><p>' + esc(t(why)) + '</p></div><button type="button" class="btn sm">' + t({ tr: 'Çevir', en: 'Reveal' }) + '</button></div>').join('');
  $$('#predict .pc').forEach((c) => $('button', c).addEventListener('click', () => c.classList.add('open')));

  /* ---------- Şekil 2: bit işlemleri ---------- */
  let op = '&';
  const OPS = [['&', 'A & B'], ['|', 'A | B'], ['^', 'A ^ B'], ['~', '~A'], ['<<', 'A << B'], ['>>', 'A >> B']];
  const seg = el('div', { class: 'seg', role: 'group' });
  OPS.forEach(([k, l]) => seg.append(el('button', { type: 'button', 'aria-pressed': String(k === op), text: l, onclick: (e) => { op = k; $$('button', seg).forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget))); drawBw(); } })));
  $('#bw-ops').append(seg);
  const bw = $('#bw');
  const mk = (lbl, v, ro) => { const r = el('div', { class: 'bw-r' }); const l = el('span', { class: 'bw-l', html: lbl }); const box = el('div'); const v2 = el('span', { class: 'bw-v' }); r.append(l, box, v2); bw.append(r); return { r, v2, L: lamps(box, { n: 8, value: v, ro, group: 4, size: 'sm', onChange: drawBw, label: lbl }) }; };
  const A = mk('A', 0b11001010), Bv = mk('B', 0b10100110);
  bw.append(el('div', { class: 'bw-line' }));
  const R = mk('=', 0, true);
  function drawBw() {
    const a = A.L.value(), b = Bv.L.value(), sh = b & 7;
    const res = { '&': a & b, '|': a | b, '^': a ^ b, '~': ~a & 255, '<<': (a << sh) & 255, '>>': a >> sh }[op];
    R.L.set(res, true);
    Bv.r.classList.toggle('off', op === '~');
    const val = (x) => '<span class="d">' + x + '</span> <span class="h">0x' + pad(toBase(x, 16), 2) + '</span>';
    A.v2.innerHTML = val(a); Bv.v2.innerHTML = op === '<<' || op === '>>' ? t({ tr: 'kaydırma: ', en: 'shift: ' }) + '<b>' + sh + '</b>' : val(b); R.v2.innerHTML = val(res);
    const expr = op === '~' ? '~' + a : a + ' ' + op + ' ' + (op.length === 2 ? sh : b);
    $('#bw-out').innerHTML = '<code>' + esc(expr) + '</code> = <b>' + res + '</b>' + (op === '~' ? ' <span class="muted">' + t({ tr: '(8 bite kırpılmış; Python’da ~' + a + ' = ' + ~a + ')', en: '(clipped to 8 bits; in Python ~' + a + ' = ' + ~a + ')' }) + '</span>' : '') +
      (op === '<<' ? ' <span class="muted">= ' + a + ' × ' + 2 ** sh + (a << sh > 255 ? t({ tr: ', taşan bitler atıldı', en: ', overflow bits dropped' }) : '') + '</span>' : op === '>>' ? ' <span class="muted">= ⌊' + a + ' ÷ ' + 2 ** sh + '⌋</span>' : '');
    // sütun vurgusu
    const rb = R.L.get();
    R.L.buttons.forEach((btn, i) => btn.classList.toggle('why', op.length === 1 && op !== '~' && rb[i] === 1));
  }
  drawBw();

  /* ---------- Şekil 3: izinler ---------- */
  const PL = lamps($('#perm-lamps'), { n: 9, value: 0o755, group: 3, weight: (i) => 'rwx'[i % 3] + ' <small>' + [4, 2, 1][i % 3] + '</small>', onChange: () => drawPerm(''), label: 'permissions' });
  $('#perm-heads').innerHTML = [{ tr: 'sahip', en: 'owner' }, { tr: 'grup', en: 'group' }, { tr: 'diğerleri', en: 'others' }].map((x) => '<span>' + esc(t(x)) + '</span>').join('');
  const permStr = (v) => Array.from({ length: 9 }, (_, i) => ((v >> (8 - i)) & 1 ? 'rwx'[i % 3] : '-')).join('');
  function drawPerm(msg) {
    const v = PL.value();
    $('#perm-out').innerHTML = '<b class="mono">' + permStr(v) + '</b> = <span class="b">' + group(pad(v.toString(2), 9), 3) + '</span>' + sub(2) + ' = <b class="h">' + pad(v.toString(8), 3) + '</b>' + sub(8) + ' · <code>chmod ' + pad(v.toString(8), 3) + '</code>';
    $('#perm-tell').innerHTML = msg;
  }
  const doOp = (label, f, code) => { const old = PL.value(), nv = f(old) & 0o777; PL.set(nv, true); drawPerm('<code>' + esc(code) + '</code>: ' + pad(old.toString(8), 3) + ' → <b>' + pad(nv.toString(8), 3) + '</b>'); };
  $('#perm-ctl').append(
    el('button', { class: 'btn sm', type: 'button', text: t({ tr: 'Gruba yazma ekle', en: 'Give group write' }), onclick: () => doOp('', (v) => v | 0o020, t({ tr: 'izin |= 0o020', en: 'perm |= 0o020' })) }),
    el('button', { class: 'btn sm', type: 'button', text: t({ tr: 'Diğerlerinden okumayı al', en: 'Take read from others' }), onclick: () => doOp('', (v) => v & ~0o004, t({ tr: 'izin &= ~0o004', en: 'perm &= ~0o004' })) }),
    el('button', { class: 'btn sm', type: 'button', text: t({ tr: 'Sahibin x’ini çevir', en: 'Toggle owner x' }), onclick: () => doOp('', (v) => v ^ 0o100, t({ tr: 'izin ^= 0o100', en: 'perm ^= 0o100' })) }),
    ...[0o755, 0o644, 0o600, 0o777].map((p) => el('button', { class: 'btn sm ghost', type: 'button', text: pad(p.toString(8), 3), onclick: () => { PL.set(p, true); drawPerm(''); } })),
  );
  drawPerm('');

  /* ---------- Şekil 4: referanslar ---------- */
  const PROG = {
    py: {
      code: ['a = [1, 2, 3]', 'b = a', 'b.append(4)', 'c = a.copy()', 'c.append(5)', 'x = 10', 'y = x', 'y = y + 1', 'print(a is b, a is c)'],
      states: [
        [{}, {}],
        [{ a: 'L1' }, { L1: [1, 2, 3] }],
        [{ a: 'L1', b: 'L1' }, { L1: [1, 2, 3] }],
        [{ a: 'L1', b: 'L1' }, { L1: [1, 2, 3, '+4'] }],
        [{ a: 'L1', b: 'L1', c: 'L2' }, { L1: [1, 2, 3, 4], L2: [1, 2, 3, 4] }],
        [{ a: 'L1', b: 'L1', c: 'L2' }, { L1: [1, 2, 3, 4], L2: [1, 2, 3, 4, '+5'] }],
        [{ a: 'L1', b: 'L1', c: 'L2', x: 'I1' }, { L1: [1, 2, 3, 4], L2: [1, 2, 3, 4, 5], I1: 10 }],
        [{ a: 'L1', b: 'L1', c: 'L2', x: 'I1', y: 'I1' }, { L1: [1, 2, 3, 4], L2: [1, 2, 3, 4, 5], I1: 10 }],
        [{ a: 'L1', b: 'L1', c: 'L2', x: 'I1', y: 'I2' }, { L1: [1, 2, 3, 4], L2: [1, 2, 3, 4, 5], I1: 10, I2: 11 }],
        [{ a: 'L1', b: 'L1', c: 'L2', x: 'I1', y: 'I2' }, { L1: [1, 2, 3, 4], L2: [1, 2, 3, 4, 5], I1: 10, I2: 11 }],
      ],
      tell: [
        { tr: 'Henüz hiçbir şey yok.', en: 'Nothing yet.' },
        { tr: 'Bellekte bir liste nesnesi yaratıldı; <b>a</b> etiketi ona yapıştırıldı.', en: 'A list object is created in memory; the label <b>a</b> is stuck on it.' },
        { tr: '<b>b = a</b> yeni liste yaratmaz. Aynı nesneye ikinci etiket.', en: '<b>b = a</b> does not create a new list. Same object, second label.' },
        { tr: '<b>b</b> üzerinden ekledik, ama tek bir liste olduğu için <b>a</b> da [1, 2, 3, 4] gösteriyor.', en: 'We appended through <b>b</b>, but there is only one list, so <b>a</b> also shows [1, 2, 3, 4].' },
        { tr: '<b>copy()</b> gerçekten yeni bir nesne yaratır (farklı adres).', en: '<b>copy()</b> really creates a new object (different address).' },
        { tr: '<b>c</b>’yi değiştirmek <b>a</b>’yı etkilemez: artık ayrı nesneler.', en: 'Changing <b>c</b> does not affect <b>a</b>: they are separate objects now.' },
        { tr: 'Python’da 10 da bir nesne. <b>x</b> onu gösteriyor.', en: 'In Python 10 is an object too. <b>x</b> points to it.' },
        { tr: '<b>y = x</b>: yine aynı nesneye ikinci etiket.', en: '<b>y = x</b>: again, a second label on the same object.' },
        { tr: 'int değiştirilemez. <b>y + 1</b> yeni bir nesne (11) üretti; <b>y</b> etiketi oraya taşındı. <b>x</b> hâlâ 10.', en: 'An int is immutable. <b>y + 1</b> made a new object (11); the <b>y</b> label moved there. <b>x</b> is still 10.' },
        { tr: 'Çıktı: <code>True False</code>. a ile b aynı nesne, a ile c eşit içerikli ama farklı nesneler.', en: 'Output: <code>True False</code>. a and b are the same object; a and c have equal content but are different objects.' },
      ],
    },
    js: {
      code: ['let a = [1, 2, 3];', 'let b = a;', 'b.push(4);', 'const c = [...a];', 'c.push(5);', 'let x = 10;', 'let y = x;', 'y = y + 1;', 'console.log(a === b, a === c);'],
      states: [
        [{}, {}],
        [{ a: 'L1' }, { L1: [1, 2, 3] }],
        [{ a: 'L1', b: 'L1' }, { L1: [1, 2, 3] }],
        [{ a: 'L1', b: 'L1' }, { L1: [1, 2, 3, '+4'] }],
        [{ a: 'L1', b: 'L1', c: 'L2' }, { L1: [1, 2, 3, 4], L2: [1, 2, 3, 4] }],
        [{ a: 'L1', b: 'L1', c: 'L2' }, { L1: [1, 2, 3, 4], L2: [1, 2, 3, 4, '+5'] }],
        [{ a: 'L1', b: 'L1', c: 'L2', x: 10 }, { L1: [1, 2, 3, 4], L2: [1, 2, 3, 4, 5] }],
        [{ a: 'L1', b: 'L1', c: 'L2', x: 10, y: 10 }, { L1: [1, 2, 3, 4], L2: [1, 2, 3, 4, 5] }],
        [{ a: 'L1', b: 'L1', c: 'L2', x: 10, y: '+11' }, { L1: [1, 2, 3, 4], L2: [1, 2, 3, 4, 5] }],
        [{ a: 'L1', b: 'L1', c: 'L2', x: 10, y: 11 }, { L1: [1, 2, 3, 4], L2: [1, 2, 3, 4, 5] }],
      ],
      tell: [
        { tr: 'Henüz hiçbir şey yok.', en: 'Nothing yet.' },
        { tr: 'Dizi bir nesnedir ve bellekte ayrı bir yerde (heap) yaşar; <b>a</b> onun referansını tutar.', en: 'An array is an object living elsewhere in memory (the heap); <b>a</b> holds a reference to it.' },
        { tr: '<b>let b = a</b>: referans kopyalandı, dizi değil.', en: '<b>let b = a</b>: the reference was copied, not the array.' },
        { tr: 'Tek bir dizi var; <b>a</b> da değişmiş görünüyor.', en: 'There is only one array; <b>a</b> looks changed too.' },
        { tr: 'Yayma sözdizimi <b>[...a]</b> yeni bir dizi yaratır (sığ kopya). <b>const</b> sadece c’nin başka diziye atanmasını yasaklar.', en: 'The spread <b>[...a]</b> creates a new array (shallow copy). <b>const</b> only forbids reassigning c.' },
        { tr: '<b>const</b> olmasına rağmen c’nin içi değişebiliyor.', en: 'Even though it is <b>const</b>, c’s contents can change.' },
        { tr: 'Sayı ilkel bir değer: doğrudan değişkenin kutusuna yazılır, ok yok.', en: 'A number is a primitive: written directly into the variable’s box, no arrow.' },
        { tr: '<b>let y = x</b>: değer kopyalandı. İki ayrı 10 var.', en: '<b>let y = x</b>: the value was copied. There are two separate 10s.' },
        { tr: '<b>y</b> değişti; <b>x</b> etkilenmedi.', en: '<b>y</b> changed; <b>x</b> is untouched.' },
        { tr: 'Çıktı: <code>true false</code>.', en: 'Output: <code>true false</code>.' },
      ],
    },
  };
  let rl = 'py';
  const ADDR = { L1: '0x7f3a…e80', L2: '0x7f3a…f40', I1: '0x55d1…a48', I2: '0x55d1…a68' };
  const OROW = { L1: 30, L2: 112, I1: 194, I2: 262 };
  const NROW = { a: 30, b: 82, c: 134, x: 194, y: 252 };
  const rseg = el('div', { class: 'seg', role: 'group' });
  [['py', 'Python'], ['js', 'JavaScript']].forEach(([k, l]) => rseg.append(el('button', { type: 'button', 'aria-pressed': String(k === rl), text: l, onclick: (e) => { rl = k; $$('button', rseg).forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget))); refSteps.go(0); } })));
  $('#ref-lang').append(rseg);
  function drawRef(k) {
    const P2 = PROG[rl], [names, objs] = P2.states[k];
    $('#ref-code').innerHTML = P2.code.map((l, i) => '<span class="pl' + (i === k - 1 ? ' cur' : i < k - 1 ? ' done' : '') + '">' + esc(l) + '</span>').join('\n');
    let h = '<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--ink-2)"/></marker></defs>';
    h += '<text x="20" y="16" font-family="var(--sans)" font-size="11" font-weight="700" fill="var(--ink-3)" letter-spacing="1">' + esc(t({ tr: 'ADLAR', en: 'NAMES' })) + '</text><text x="250" y="16" font-family="var(--sans)" font-size="11" font-weight="700" fill="var(--ink-3)" letter-spacing="1">' + esc(t({ tr: 'NESNELER (BELLEK)', en: 'OBJECTS (MEMORY)' })) + '</text>';
    Object.entries(objs).forEach(([id, val]) => {
      const y = OROW[id];
      if (Array.isArray(val)) {
        const w = 34 * val.length + 12;
        h += '<g class="fadein"><rect x="250" y="' + y + '" width="' + w + '" height="44" rx="8" fill="var(--card)" stroke="var(--rule-2)"/>';
        val.forEach((x, i) => { const nw = String(x).startsWith('+'); h += '<rect x="' + (256 + i * 34) + '" y="' + (y + 6) + '" width="30" height="24" rx="5" fill="' + (nw ? 'var(--on)' : 'var(--paper-2)') + '"/><text x="' + (271 + i * 34) + '" y="' + (y + 22) + '" text-anchor="middle" font-family="var(--mono)" font-size="14" font-weight="600" fill="' + (nw ? '#ffffff' : 'var(--ink)') + '">' + String(x).replace('+', '') + '</text>'; });
        h += '<text x="252" y="' + (y + 56) + '" font-family="var(--mono)" font-size="10" fill="var(--ink-3)">' + (rl === 'py' ? 'list' : 'Array') + ' @ ' + ADDR[id] + '</text></g>';
      } else {
        const nw = k > 0 && !(id in P2.states[k - 1][1]);
        h += '<g class="fadein"><rect x="250" y="' + y + '" width="52" height="34" rx="8" fill="' + (nw && k > 0 ? 'color-mix(in srgb, var(--on) 25%, var(--card))' : 'var(--card)') + '" stroke="var(--rule-2)"/><text x="276" y="' + (y + 22) + '" text-anchor="middle" font-family="var(--mono)" font-size="15" font-weight="700" fill="var(--ink)">' + val + '</text><text x="310" y="' + (y + 21) + '" font-family="var(--mono)" font-size="10" fill="var(--ink-3)">int @ ' + ADDR[id] + '</text></g>';
      }
    });
    Object.entries(names).forEach(([n, ref]) => {
      const y = NROW[n], prim = typeof ref === 'number' || String(ref).startsWith('+');
      h += '<g><rect x="20" y="' + y + '" width="' + (prim ? 110 : 64) + '" height="34" rx="8" fill="var(--ink)"/><text x="40" y="' + (y + 22) + '" text-anchor="middle" font-family="var(--mono)" font-size="16" font-weight="700" fill="var(--paper)">' + n + '</text>';
      if (prim) { const nw = String(ref).startsWith('+'); h += '<rect x="62" y="' + (y + 5) + '" width="62" height="24" rx="5" fill="' + (nw ? 'var(--on)' : 'var(--card)') + '"/><text x="93" y="' + (y + 22) + '" text-anchor="middle" font-family="var(--mono)" font-size="15" font-weight="700" fill="' + (nw ? '#ffffff' : 'var(--ink)') + '">' + String(ref).replace('+', '') + '</text>'; }
      else { const ty = OROW[ref] + (Array.isArray(objs[ref]) ? 22 : 17), x1 = 84, y1 = y + 17; h += '<circle cx="74" cy="' + y1 + '" r="4" fill="var(--on)"/><path d="M' + x1 + ' ' + y1 + ' C ' + (x1 + 90) + ' ' + y1 + ', ' + (250 - 90) + ' ' + ty + ', 247 ' + ty + '" fill="none" stroke="var(--ink-2)" stroke-width="2" marker-end="url(#ah)"/>'; }
      h += '</g>';
    });
    $('#ref-svg').innerHTML = h;
    $('#ref-tell').innerHTML = t(P2.tell[k]);
  }
  const refSteps = steps($('#ref-steps'), { count: 10, render: drawRef, nextLabel: t({ tr: 'Satırı çalıştır →', en: 'Run line →' }) });

  /* ---------- alıştırma ---------- */
  function litQ() {
    const v = rand(5, 255), b = pick([2, 8, 16]), lit = { 2: '0b' + v.toString(2), 8: '0o' + v.toString(8), 16: '0x' + v.toString(16).toUpperCase() }[b];
    return { q: t({ tr: 'Kodda <code>' + lit + '</code> yazan sayının onlu değeri?', en: 'What is the decimal value of the literal <code>' + lit + '</code>?' }), a: String(v), kind: 'dec', hint: t({ tr: 'Ön ek tabanı söyler: 0b → 2, 0o → 8, 0x → 16.', en: 'The prefix gives the base: 0b → 2, 0o → 8, 0x → 16.' }), explain: lit + ' = <b>' + v + '</b>' };
  }
  function permQ() {
    const p = pick([0o755, 0o644, 0o600, 0o700, 0o750, 0o640, 0o777, 0o711, 0o444]);
    if (Math.random() < 0.5) return { q: t({ tr: '<code>chmod ' + pad(p.toString(8), 3) + '</code> hangi izin dizisini verir? (ör. rwxr-xr-x)', en: 'Which permission string does <code>chmod ' + pad(p.toString(8), 3) + '</code> give? (e.g. rwxr-xr-x)' }), a: permStr(p), kind: 'text', hint: 'r = 4, w = 2, x = 1', explain: [...pad(p.toString(8), 3)].map((d) => d + ' = ' + permStr(+d).slice(6)).join(' · ') + ' → <b class="mono">' + permStr(p) + '</b>' };
    return { q: t({ tr: '<code class="mono">' + permStr(p) + '</code> sekizli olarak?', en: '<code class="mono">' + permStr(p) + '</code> in octal?' }), a: pad(p.toString(8), 3), kind: 'oct', hint: 'r = 4, w = 2, x = 1', explain: '<b>' + pad(p.toString(8), 3) + '</b>' };
  }
  tryIt($('#try'), [
    { label: t({ tr: 'Sabitler', en: 'Literals' }), fn: litQ },
    { label: t({ tr: 'Bit işlemleri', en: 'Bitwise' }), fn: GEN.bitwise },
    { label: t({ tr: 'İzinler', en: 'Permissions' }), fn: permQ },
  ]);
})();
