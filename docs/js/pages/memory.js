/* Bölüm — Bellek: endianness, bellek simülatörü, dizi adresi, pointer izleyici */
(function () {
  const { t, $, $$, el, esc, pad, toBase, rand, pick, fmt } = NS;
  const h2 = (v) => pad(toBase(v, 16), 2);
  const hexA = (a) => '0x' + pad(toBase(a, 16), 4);
  const COLORS = ['#f472b6', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f87171', '#22d3ee', '#fb923c'];

  /* ---------- 1) endianness ---------- */
  const enIn = $('#en-in'), enBytes = $('#en-bytes'), enRows = $('#en-rows');
  function endian() {
    const raw = enIn.value.trim();
    let v = /^-?0x/i.test(raw) ? parseInt(raw.replace(/^(-?)0x/i, '$1'), 16) : parseInt(raw, 10);
    if (isNaN(v) || v > 0xffffffff || v < -0x80000000) { enIn.classList.add('invalid'); return; }
    enIn.classList.remove('invalid');
    v = v >>> 0;
    const bytes = [24, 16, 8, 0].map((s) => (v >>> s) & 255); // MSB önce
    enBytes.innerHTML = '<div class="en-val mono">' + hexA(v).replace('0x', '0x<span>').replace(/$/, '</span>') + ' = ' + fmt(v) + '</div><div class="digit-tiles">' +
      bytes.map((b, i) => '<div class="tile" style="border-color:' + COLORS[i] + ';color:' + COLORS[i] + '">' + h2(b) + '<small>' + (i === 0 ? t({ tr: 'en anlamlı', en: 'most significant' }) : i === 3 ? t({ tr: 'en az anlamlı', en: 'least significant' }) : '&nbsp;') + '</small></div>').join('') + '</div>';
    const row = (label, order) => '<div class="en-row fade-up"><div class="en-lbl">' + label + '</div><div class="en-cells">' +
      order.map((i, k) => '<div class="en-cell"><span class="en-addr">' + hexA(0x1000 + k) + '</span><b style="background:' + COLORS[i] + '22;border-color:' + COLORS[i] + ';color:' + COLORS[i] + '">' + h2(bytes[i]) + '</b></div>').join('') + '</div></div>';
    enRows.innerHTML = row('Big-endian', [0, 1, 2, 3]) + row('Little-endian', [3, 2, 1, 0]);
  }
  enIn.addEventListener('input', endian);
  endian();

  /* ---------- 2) bellek simülatörü ---------- */
  const BASE = 0x1000, SIZE = 64;
  const TYPES = {
    char: { size: 1, c: 'char', ex: 'A' }, int8: { size: 1, c: 'int8_t', ex: '-5' }, int16: { size: 2, c: 'short', ex: '1000' },
    int32: { size: 4, c: 'int', ex: '42' }, float: { size: 4, c: 'float', ex: '3.14' }, double: { size: 8, c: 'double', ex: '0.1' },
    str: { size: 0, c: 'char[]', ex: 'Hi' }, ptr: { size: 8, c: 'int*', ex: 'x' },
  };
  let vars = [], endianMode = 'le', selVar = null;
  const typeSel = $('#sim-type'), nameIn = $('#sim-name'), valIn = $('#sim-val'), msg = $('#sim-msg');
  const dv = new DataView(new ArrayBuffer(8));
  function encode(type, val) {
    const v = String(val).trim();
    const intIn = (lo, hi) => { if (!/^-?\d+$/.test(v)) throw t({ tr: 'Tamsayı gir.', en: 'Enter an integer.' }); const n = +v; if (n < lo || n > hi) throw t({ tr: 'Aralık: ' + lo + ' … ' + hi, en: 'Range: ' + lo + ' … ' + hi }); return n; };
    const le = (n, size) => { const out = []; let x = BigInt.asUintN(size * 8, BigInt(n)); for (let i = 0; i < size; i++) { out.push(Number(x & 255n)); x >>= 8n; } return out; };
    switch (type) {
      case 'char': { const s = v.replace(/^'(.*)'$/, '$1'); if (s.length !== 1 || s.charCodeAt(0) > 127) throw t({ tr: 'Tek bir ASCII karakteri gir.', en: 'Enter a single ASCII character.' }); return { bytes: [s.charCodeAt(0)], show: "'" + s + "'" }; }
      case 'int8': return { bytes: le(intIn(-128, 127), 1), show: v };
      case 'int16': return { bytes: le(intIn(-32768, 32767), 2), show: v };
      case 'int32': return { bytes: le(intIn(-2147483648, 2147483647), 4), show: v };
      case 'float': { const n = Number(v.replace(',', '.')); if (!v || isNaN(n)) throw t({ tr: 'Sayı gir.', en: 'Enter a number.' }); dv.setFloat32(0, n, true); return { bytes: [0, 1, 2, 3].map((i) => dv.getUint8(i)), show: v }; }
      case 'double': { const n = Number(v.replace(',', '.')); if (!v || isNaN(n)) throw t({ tr: 'Sayı gir.', en: 'Enter a number.' }); dv.setFloat64(0, n, true); return { bytes: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => dv.getUint8(i)), show: v }; }
      case 'str': { const s = v.replace(/^"(.*)"$/, '$1'); if (!s) throw t({ tr: 'Bir metin gir.', en: 'Enter some text.' }); const b = Array.from(new TextEncoder().encode(s)); return { bytes: b.concat([0]), show: '"' + s + '"', multi: false }; }
      case 'ptr': { const target = vars.find((x) => x.name === v.replace(/^&/, '')); if (!target) throw t({ tr: 'Var olan bir değişkenin adını yaz (ör. x).', en: 'Type the name of an existing variable (e.g. x).' }); return { bytes: le(target.addr, 8), show: '&' + target.name, target: target.name }; }
    }
    throw 'type';
  }
  function add(type, name, val, silent) {
    try {
      if (!/^[A-Za-z_]\w{0,7}$/.test(name)) throw t({ tr: 'Geçerli bir değişken adı gir (harf ile başlamalı).', en: 'Enter a valid variable name (must start with a letter).' });
      if (vars.some((x) => x.name === name)) throw t({ tr: '“' + name + '” adı zaten kullanılıyor.', en: '“' + name + '” is already used.' });
      const e = encode(type, val);
      const size = e.bytes.length, align = type === 'str' ? 1 : size;
      const end = vars.length ? vars[vars.length - 1].addr + vars[vars.length - 1].size : BASE;
      const addr = Math.ceil(end / align) * align;
      if (addr + size > BASE + SIZE) throw t({ tr: 'Bellek doldu! (Bu simülatörde 64 byte var.) Temizleyip tekrar dene.', en: 'Memory is full! (This simulator has 64 bytes.) Clear it and try again.' });
      vars.push({ type, name, addr, size, bytes: e.bytes, show: e.show, target: e.target, pad: addr - end, color: COLORS[vars.length % COLORS.length] });
      if (!silent) {
        msg.hidden = false; msg.className = 'msg good';
        msg.innerHTML = '<code>' + TYPES[type].c + ' ' + name + (type === 'str' ? '[]' : '') + ' = ' + esc(e.show) + ';</code> → ' + hexA(addr) + ', ' + size + ' byte' + (addr - end ? ' · ' + t({ tr: (addr - end) + ' byte hizalama boşluğu', en: (addr - end) + ' byte(s) of alignment padding' }) : '');
        const next = 'xyzabcdefghijk'.split('').find((c) => !vars.some((v) => v.name === c));
        if (next) nameIn.value = next;
      }
      selVar = name;
      render();
    } catch (err) {
      msg.hidden = false; msg.className = 'msg bad'; msg.textContent = String(err);
    }
  }
  function cellInfo(a) {
    const v = vars.find((x) => a >= x.addr && a < x.addr + x.size);
    if (!v) {
      const padOwner = vars.find((x) => a >= x.addr - x.pad && a < x.addr);
      return { v: null, pad: !!padOwner, padOwner };
    }
    const k = a - v.addr; // bellekteki sıra
    const multi = !['str', 'char', 'int8'].includes(v.type);
    const byteIdx = multi && endianMode === 'be' ? v.size - 1 - k : k; // LE dizisindeki indis
    return { v, k, b: v.bytes[byteIdx], byteIdx, multi };
  }
  function render() {
    const mem = $('#sim-mem');
    let h = '<div class="sm-head"><span></span>' + Array.from({ length: 16 }, (_, i) => '<span>+' + toBase(i, 16) + '</span>').join('') + '</div>';
    for (let r = 0; r < SIZE / 16; r++) {
      h += '<div class="sm-row"><span class="sm-addr">' + hexA(BASE + r * 16) + '</span>';
      for (let c = 0; c < 16; c++) {
        const a = BASE + r * 16 + c, info = cellInfo(a);
        if (info.v) h += '<span class="sm-cell used' + (info.v.name === selVar ? ' sel' : '') + (info.k === 0 ? ' first' : '') + '" data-a="' + a + '" style="--vc:' + info.v.color + '">' + h2(info.b) + '</span>';
        else h += '<span class="sm-cell ' + (info.pad ? 'pad' : 'free') + '" data-a="' + a + '">' + (info.pad ? '··' : '00') + '</span>';
      }
      h += '</div>';
    }
    mem.innerHTML = h;
    $$('.sm-cell', mem).forEach((c) => {
      c.addEventListener('mouseenter', () => info(+c.dataset.a));
      c.addEventListener('click', () => { const i = cellInfo(+c.dataset.a); if (i.v) { selVar = i.v.name; render(); } info(+c.dataset.a); });
    });
    $('#sim-vars').innerHTML = vars.length ? '<div class="table-wrap"><table class="compact"><thead><tr><th></th><th>' + t({ tr: 'Bildirim', en: 'Declaration' }) + '</th><th>' + t({ tr: 'Adres', en: 'Address' }) + '</th><th>' + t({ tr: 'Boyut', en: 'Size' }) + '</th><th>' + t({ tr: 'Bellekteki byte’lar', en: 'Bytes in memory' }) + '</th></tr></thead><tbody>' +
      vars.map((v) => {
        const order = !['str', 'char', 'int8'].includes(v.type) && endianMode === 'be' ? v.bytes.slice().reverse() : v.bytes;
        return '<tr class="' + (v.name === selVar ? 'sel' : '') + '" data-n="' + v.name + '"><td><span class="vdot" style="background:' + v.color + '"></span></td><td class="m">' + TYPES[v.type].c.replace('[]', '') + ' ' + v.name + (v.type === 'str' ? '[]' : '') + ' = ' + esc(v.show) + '</td><td class="m hex">' + hexA(v.addr) + '</td><td class="m">' + v.size + ' B</td><td class="m">' + order.map(h2).join(' ') + '</td></tr>';
      }).join('') + '</tbody></table></div>' : '<p class="muted center">' + t({ tr: 'Henüz değişken yok. “Örnek program”a bas ya da kendin tanımla.', en: 'No variables yet. Press “Sample program” or declare your own.' }) + '</p>';
    $$('#sim-vars tr[data-n]').forEach((tr) => tr.addEventListener('click', () => { selVar = tr.dataset.n; render(); }));
    const sv = vars.find((v) => v.name === selVar);
    if (sv) describe(sv);
  }
  function describe(v) {
    const order = !['str', 'char', 'int8'].includes(v.type) && endianMode === 'be' ? v.bytes.slice().reverse() : v.bytes;
    let ex = '';
    if (['int16', 'int32', 'double', 'float', 'ptr'].includes(v.type)) {
      const be = v.bytes.slice().reverse().map(h2).join('');
      ex = t({ tr: ' Değerin hex karşılığı <span class="hex">0x' + be + '</span>; ' + (endianMode === 'le' ? 'little-endian olduğu için byte’lar <b>ters sırada</b> yazıldı.' : 'big-endian olduğu için byte’lar <b>okuduğumuz sırada</b> yazıldı.'), en: ' Its hex value is <span class="hex">0x' + be + '</span>; ' + (endianMode === 'le' ? 'being little-endian, the bytes are stored in <b>reverse order</b>.' : 'being big-endian, the bytes are stored in <b>reading order</b>.') });
      if (v.type === 'float' || v.type === 'double') ex += t({ tr: ' (IEEE 754 ' + (v.size * 8) + ' bit)', en: ' (IEEE 754 ' + (v.size * 8) + '-bit)' });
      if (v.type === 'ptr') ex += t({ tr: ' Bu bir adres: <b>' + v.target + '</b> değişkeninin yeri.', en: ' This is an address: where <b>' + v.target + '</b> lives.' });
    } else if (v.type === 'str') ex = t({ tr: ' Her karakter UTF-8 byte’ları; sondaki 00 metnin bittiğini gösterir.', en: ' Each character’s UTF-8 bytes; the trailing 00 marks the end.' });
    else if (v.type === 'char') ex = t({ tr: ' ASCII kodu ' + v.bytes[0] + '.', en: ' ASCII code ' + v.bytes[0] + '.' });
    else if (v.type === 'int8') ex = t({ tr: ' 8 bit ikiye tümleyen.', en: ' 8-bit two’s complement.' });
    $('#sim-info').innerHTML = '<span class="vdot" style="background:' + v.color + '"></span> <code>' + v.name + '</code> @ <span class="hex">' + hexA(v.addr) + '</span>–<span class="hex">' + hexA(v.addr + v.size - 1) + '</span>: <span class="mono">' + order.map(h2).join(' ') + '</span>.' + ex;
  }
  function info(a) {
    const i = cellInfo(a);
    if (i.v) {
      $('#sim-info').innerHTML = '<span class="hex">' + hexA(a) + '</span>: <b>' + i.v.name + '</b> ' + t({ tr: 'değişkeninin ' + (i.k + 1) + '. byte’ı', en: 'byte ' + (i.k + 1) + ' of' }) + ' (' + TYPES[i.v.type].c + ', ' + i.v.size + ' B) = <span class="hex">' + h2(i.b) + '</span>' +
        (i.multi ? ' · ' + t({ tr: 'değerin ' + (i.byteIdx === 0 ? 'en az anlamlı' : i.byteIdx === i.v.size - 1 ? 'en anlamlı' : i.byteIdx + '. sıradaki') + ' byte’ı', en: (i.byteIdx === 0 ? 'least significant' : i.byteIdx === i.v.size - 1 ? 'most significant' : 'byte #' + i.byteIdx + ' of the') + ' byte of the value' }) : '');
    } else if (i.pad) $('#sim-info').innerHTML = '<span class="hex">' + hexA(a) + '</span>: ' + t({ tr: 'hizalama boşluğu (padding): <b>' + i.padOwner.name + '</b> ' + i.padOwner.size + '’in katı bir adrese hizalandığı için kullanılmadı.', en: 'alignment padding: unused because <b>' + i.padOwner.name + '</b> was aligned to a multiple of ' + i.padOwner.size + '.' });
    else $('#sim-info').innerHTML = '<span class="hex">' + hexA(a) + '</span>: ' + t({ tr: 'boş', en: 'free' });
  }
  typeSel.addEventListener('change', () => { valIn.value = TYPES[typeSel.value].ex === 'x' && vars.length ? vars[0].name : TYPES[typeSel.value].ex; });
  $('#sim-add').addEventListener('click', () => add(typeSel.value, nameIn.value.trim(), valIn.value));
  [nameIn, valIn].forEach((x) => x.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#sim-add').click(); }));
  $('#sim-clear').addEventListener('click', () => { vars = []; selVar = null; msg.hidden = true; $('#sim-info').textContent = ''; nameIn.value = 'x'; render(); });
  $('#sim-demo').addEventListener('click', () => {
    vars = []; msg.hidden = true;
    [['char', 'c', 'A'], ['int32', 'x', '42'], ['int16', 's', '-2'], ['float', 'f', '3.14'], ['str', 'ad', 'Hi'], ['ptr', 'p', 'x'], ['double', 'd', '0.1']].forEach(([ty, n, v]) => add(ty, n, v, true));
    selVar = 'x'; render();
    msg.hidden = false; msg.className = 'msg';
    msg.innerHTML = t({ tr: 'Örnek program belleğe yazıldı. Byte’ların üzerine gel ya da tablodan bir değişken seç. <code>c</code> ile <code>x</code> arasındaki çizgili boşluklara dikkat!', en: 'The sample program was written to memory. Hover over bytes or pick a variable in the table. Notice the striped gaps between <code>c</code> and <code>x</code>!' });
  });
  $$('#sim-endian button').forEach((b) => b.addEventListener('click', () => {
    endianMode = b.dataset.e;
    $$('#sim-endian button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    render();
  }));
  $('#sim-demo').click();

  /* ---------- 3) dizi adresi ---------- */
  const arrT = $('#arr-t'), arrI = $('#arr-i');
  function arr() {
    const sz = +arrT.value, i = +arrI.value, base = 0x2000;
    let h = '';
    for (let k = 0; k < 8; k++) {
      h += '<div class="arr-el' + (k === i ? ' on' : '') + '" style="flex:' + sz + '"><div class="arr-bytes">' + Array.from({ length: sz }, () => '<i></i>').join('') + '</div><b>[' + k + ']</b><small>' + hexA(base + k * sz) + '</small></div>';
    }
    $('#arr-strip').innerHTML = h;
    $('#arr-out').innerHTML = hexA(base) + ' + ' + i + ' × ' + sz + ' = ' + hexA(base) + ' + ' + i * sz + ' = <b class="hex">' + hexA(base + i * sz) + '</b>';
  }
  arrT.addEventListener('change', arr); arrI.addEventListener('input', arr);
  arr();

  /* ---------- 4) pointer izleyici ---------- */
  const code = 'int x = 42;\nint y = 7;\nint *p = &x;\n*p = 100;\np = &y;\n*p = *p + 1;\nprintf("%d %d", x, y);';
  const box = (name, type, addr, val, opts) => '<div class="pv-box' + (opts && opts.hl ? ' hl' : '') + (opts && opts.flash ? ' flash' : '') + (opts && opts.ptr ? ' ptr' : '') + '"><div class="pvb-top"><b>' + name + '</b><span>' + type + '</span></div><div class="pvb-val">' + val + '</div><div class="pvb-addr">@ ' + addr + '</div></div>';
  const S = (x, y, p, o) => {
    o = o || {};
    let h = '<div class="pv-mem"><div class="pv-row">';
    h += x != null ? box('x', 'int', '0x1000', x, { hl: p === 'x', flash: o.fx }) : '<div class="pv-box empty"></div>';
    h += y != null ? box('y', 'int', '0x1004', y, { hl: p === 'y', flash: o.fy }) : '<div class="pv-box empty"></div>';
    h += '</div>';
    if (p) h += '<div class="pv-arrow">↑ p → ' + p + '</div>' + '<div class="pv-row">' + box('p', 'int*', '0x1008', '<span class="hex">' + (p === 'x' ? '0x1000' : '0x1004') + '</span>', { ptr: true }) + '</div>';
    return h + '</div>' + (o.out ? '<div class="out-line">' + o.out + '</div>' : '');
  };
  NS.codeStepper($('#ptr-box'), {
    lang: 'c', code,
    steps: [
      { line: 1, state: S(42), note: t({ tr: '<code>x</code> için 4 byte ayrıldı (adres 0x1000) ve içine 42 yazıldı.', en: '4 bytes are reserved for <code>x</code> (address 0x1000) and 42 is stored.' }) },
      { line: 2, state: S(42, 7), note: t({ tr: '<code>y</code> hemen arkasına, 0x1004’e yerleşti.', en: '<code>y</code> is placed right after it, at 0x1004.' }) },
      { line: 3, state: S(42, 7, 'x'), note: t({ tr: '<code>&amp;x</code> = x’in adresi = 0x1000. <code>p</code> bu adresi saklıyor; yani x’i <em>gösteriyor</em>.', en: '<code>&amp;x</code> = the address of x = 0x1000. <code>p</code> stores that address; it <em>points to</em> x.' }) },
      { line: 4, state: S(100, 7, 'x', { fx: true }), note: t({ tr: '<code>*p = 100</code>: “p’nin gösterdiği yere 100 yaz”. <code>x</code>’e hiç dokunmadık ama değeri değişti!', en: '<code>*p = 100</code>: “write 100 where p points”. We never touched <code>x</code> directly, yet it changed!' }) },
      { line: 5, state: S(100, 7, 'y'), note: t({ tr: '<code>p</code>’ye yeni bir adres atadık: artık <code>y</code>’yi gösteriyor.', en: 'We gave <code>p</code> a new address: it now points to <code>y</code>.' }) },
      { line: 6, state: S(100, 8, 'y', { fy: true }), note: t({ tr: '<code>*p</code> okununca 7 gelir; 7 + 1 = 8 yine p’nin gösterdiği yere, yani <code>y</code>’ye yazılır.', en: 'Reading <code>*p</code> gives 7; 7 + 1 = 8 is written back where p points: <code>y</code>.' }) },
      { line: 7, state: S(100, 8, 'y', { out: '100 8' }), note: t({ tr: 'Çıktı: <b>100 8</b>. İki değişkeni de pointer üzerinden değiştirdik.', en: 'Output: <b>100 8</b>. We changed both variables through the pointer.' }) },
    ],
  });

  /* ---------- alıştırma ---------- */
  const arrQ = () => {
    const sz = pick([1, 2, 4, 8]), base = pick([0x1000, 0x2000, 0x4000, 0x7ff0]), i = rand(1, 9);
    const name = { 1: 'char', 2: 'short', 4: 'int', 8: 'double' }[sz];
    return { q: '<code>' + name + ' a[10]</code> ' + t({ tr: 'dizisi', en: 'starts at' }) + ' <span class="hex">' + hexA(base) + '</span>' + t({ tr: ' adresinden başlıyor (' + name + ' = ' + sz + ' B). ', en: ' (' + name + ' = ' + sz + ' B). ' }) + '<code>a[' + i + ']</code> ' + t({ tr: 'hangi adreste? (hex)', en: 'is at which address? (hex)' }), a: toBase(base + i * sz, 16), kind: 'hex', placeholder: '0x…', hint: t({ tr: 'başlangıç + i × boyut; sonucu hex yaz', en: 'start + i × size; answer in hex' }), explain: hexA(base) + ' + ' + i + ' × ' + sz + ' = ' + hexA(base) + ' + ' + (i * sz) + ' (0x' + toBase(i * sz, 16) + ') = <b>' + hexA(base + i * sz) + '</b>' };
  };
  const endQ = () => {
    const v = rand(0x10000000, 0xffffffff) >>> 0, le = Math.random() < 0.5, k = rand(0, 3);
    const bytesBE = [24, 16, 8, 0].map((s) => (v >>> s) & 255), order = le ? bytesBE.slice().reverse() : bytesBE;
    return { q: '<span class="hex mono">0x' + pad(toBase(v, 16), 8) + '</span> ' + t({ tr: (le ? 'little' : 'big') + '-endian olarak 0x1000’e yazıldı. 0x100' + k + ' adresindeki byte nedir?', en: 'is stored ' + (le ? 'little' : 'big') + '-endian at 0x1000. Which byte is at 0x100' + k + '?' }), a: h2(order[k]), kind: 'hex', hint: le ? t({ tr: 'Little-endian: en sağdaki iki hex rakamı en küçük adrese.', en: 'Little-endian: the rightmost two hex digits go to the lowest address.' }) : t({ tr: 'Big-endian: okuduğun sırayla.', en: 'Big-endian: in reading order.' }), explain: order.map((b, i) => hexA(0x1000 + i) + ': ' + (i === k ? '<b>' + h2(b) + '</b>' : h2(b))).join(', ') };
  };
  NS.practice($('#practice'), [
    { label: t({ tr: 'Dizi adresi', en: 'Array address' }), fn: arrQ },
    { label: t({ tr: 'Byte sırası', en: 'Byte order' }), fn: endQ },
  ]);
})();
