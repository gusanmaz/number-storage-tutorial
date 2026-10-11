/* Bölüm 3 — Hexadecimal: rakam tablosu, nibble gruplayıcı, basamak değeri, gerçek örnekler */
(function () {
  const { t, $, $$, el, esc, fmt, toBase, pad, group, pick, rand } = NS;

  /* ---------- rakam tablosu ---------- */
  const table = $('#hex-table');
  for (let v = 0; v < 16; v++) {
    const b = pad(v.toString(2), 4);
    const c = el('div', { class: 'hx-cell' + (v >= 10 ? ' letter' : '') });
    c.innerHTML = '<div class="hx-d hex">' + toBase(v, 16) + '</div><div class="hx-v">' + v + '</div><div class="hx-b">' +
      [...b].map((x) => '<i class="' + (x === '1' ? 'on' : '') + '">' + x + '</i>').join('') + '</div>';
    table.append(c);
  }

  /* ---------- nibble gruplayıcı ---------- */
  let mode = 'bin';
  const inp = $('#nib-in'), groupsBox = $('#nib-groups'), out = $('#nib-out');
  $$('#nib-mode button').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.mode === mode) return;
    // mevcut değeri diğer moda taşı
    const v = current();
    mode = b.dataset.mode;
    $$('#nib-mode button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    $('#nib-label').textContent = mode === 'bin' ? 'Binary' : 'Hex';
    if (v != null) inp.value = mode === 'bin' ? v.bits : v.hex;
    render();
  }));
  function current() {
    const s = inp.value.trim().replace(/^0[xb]/i, '').replace(/[\s_]/g, '').toUpperCase();
    if (!s) return null;
    if (mode === 'bin') { if (/[^01]/.test(s)) return null; const bits = s; const padded = pad(bits, Math.ceil(bits.length / 4) * 4); const hex = group(padded, 4).split(' ').map((g) => toBase(parseInt(g, 2), 16)).join(''); return { bits, padded, hex, padCount: padded.length - bits.length }; }
    if (/[^0-9A-F]/.test(s)) return null;
    const padded = [...s].map((c) => pad(parseInt(c, 16).toString(2), 4)).join('');
    return { bits: padded, padded, hex: s, padCount: 0 };
  }
  function render() {
    const v = current();
    groupsBox.innerHTML = '';
    if (!v) {
      inp.classList.toggle('invalid', !!inp.value.trim());
      out.innerHTML = inp.value.trim() ? '<span class="bad">' + esc(t(mode === 'bin' ? { tr: 'Binary’de yalnızca 0 ve 1 olabilir.', en: 'Binary may only contain 0 and 1.' } : { tr: 'Hex’te yalnızca 0–9 ve A–F olabilir.', en: 'Hex may only contain 0–9 and A–F.' })) + '</span>' : '';
      return;
    }
    inp.classList.remove('invalid');
    const groups = group(v.padded, 4).split(' ');
    let idx = 0;
    groups.forEach((g, gi) => {
      const box = el('div', { class: 'nib fade-up', style: 'animation-delay:' + gi * 40 + 'ms' });
      const bitsHtml = [...g].map((x, j) => {
        const isPad = idx++ < v.padCount;
        return '<span class="nb' + (x === '1' ? ' on' : '') + (isPad ? ' pad' : '') + '"><b>' + x + '</b><small>' + [8, 4, 2, 1][j] + '</small></span>';
      }).join('');
      const val = parseInt(g, 2);
      box.innerHTML = '<div class="nib-bits">' + bitsHtml + '</div><div class="nib-arrow">' + (val ? [...g].map((x, j) => (x === '1' ? [8, 4, 2, 1][j] : null)).filter(Boolean).join('+') + ' = ' + val : '0') + ' ↓</div><div class="nib-hex hex">' + toBase(val, 16) + '</div>';
      groupsBox.append(box);
    });
    const dec = parseInt(v.padded, 2);
    out.innerHTML = '<span class="bin">' + group(v.padded, 4) + '</span><sub>2</sub> = <b class="hex">' + v.hex + '</b><sub>16</sub>' +
      (Number.isSafeInteger(dec) ? ' = <span class="dec">' + fmt(dec) + '</span><sub>10</sub>' : '') +
      (v.padCount ? ' <span class="muted">(' + t({ tr: 'başa ' + v.padCount + ' sıfır eklendi', en: v.padCount + ' leading zero(s) added' }) + ')</span>' : '');
  }
  inp.addEventListener('input', render);
  render();

  /* ---------- basamak değeri ---------- */
  NS.placeValue($('#pv-box'), { bases: [16], base: 16, value: '1F4' });

  /* ---------- gerçek hayattan örnekler ---------- */
  const tilesOf = (hexes, cls) => '<div class="digit-tiles">' + hexes.map((h) => '<div class="tile ' + (cls || 'hex') + '">' + h + '<small>' + parseInt(h, 16) + '</small></div>').join('') + '</div>';
  const EX = [
    {
      label: t({ tr: 'Renk kodu', en: 'Color code' }), value: '#FF5733',
      html: () => tilesOf(['FF', '57', '33']) +
        '<div style="display:flex;gap:.6rem;align-items:center;justify-content:center;margin:.6rem 0"><span style="width:48px;height:48px;border-radius:10px;background:#FF5733;display:inline-block;border:1px solid var(--border)"></span><span class="mono">rgb(255, 87, 51)</span></div>' +
        '<p>' + t({ tr: 'Altı hex rakamı = 3 byte. Sırayla <b style="color:var(--c-r)">kırmızı</b>, <b style="color:var(--c-g)">yeşil</b> ve <b style="color:var(--c-b)">mavi</b> ışığın şiddeti (0–255). Ayrıntılar “Renk Kodları” bölümünde.', en: 'Six hex digits = 3 bytes: the intensity (0–255) of <b style="color:var(--c-r)">red</b>, <b style="color:var(--c-g)">green</b> and <b style="color:var(--c-b)">blue</b> light. More in the “Color Codes” chapter.' }) + '</p>',
    },
    {
      label: t({ tr: 'MAC adresi', en: 'MAC address' }), value: '00:1A:2B:3C:4D:5E',
      html: () => tilesOf(['00', '1A', '2B', '3C', '4D', '5E']) +
        '<p>' + t({ tr: 'Her ağ kartının fabrikada verilen kimliği. 6 byte = 48 bit = 2⁴⁸ ≈ 281 trilyon farklı adres. İlk 3 byte üreticiyi gösterir (OUI).', en: 'The factory-assigned ID of a network card. 6 bytes = 48 bits = 2⁴⁸ ≈ 281 trillion addresses. The first 3 bytes identify the manufacturer (OUI).' }) + '</p>',
    },
    {
      label: t({ tr: 'Bellek adresi', en: 'Memory address' }), value: '0x7FFE42A0',
      html: () => tilesOf(['7F', 'FE', '42', 'A0']) +
        '<p>' + t({ tr: '8 hex rakamı = 32 bit. Onlu olarak <span class="dec">2.147.369.632</span>; bu sayıdan bitleri görmek imkânsız, hex’te ise her byte ayrı okunuyor. 64 bitlik sistemlerde adresler 16 hex rakamına kadar çıkar.', en: '8 hex digits = 32 bits. In decimal it is <span class="dec">2,147,369,632</span>; you cannot see the bits in that, while hex shows each byte. On 64-bit systems addresses go up to 16 hex digits.' }) + '</p>',
    },
    {
      label: 'Unicode', value: 'U+00E7 / U+1F600',
      html: () => '<div class="digit-tiles"><div class="tile hex">U+00E7<small>ç</small></div><div class="tile hex">U+011F<small>ğ</small></div><div class="tile hex">U+20BA<small>₺</small></div><div class="tile hex">U+1F600<small>😀</small></div></div>' +
        '<p>' + t({ tr: 'Dünyadaki her karakterin bir numarası (kod noktası) vardır ve hex olarak yazılır. HTML’de <code>&amp;#xE7;</code> yazarsan “ç” görünür.', en: 'Every character in the world has a number (code point), written in hex. In HTML, <code>&amp;#xE7;</code> renders as “ç”.' }) + '</p>',
    },
    {
      label: t({ tr: 'Hata kodu', en: 'Error code' }), value: '0x80070005',
      html: () => tilesOf(['80', '07', '00', '05']) +
        '<p>' + t({ tr: 'Windows’un “Erişim engellendi” (E_ACCESSDENIED) hata kodu. En yüksek bit 1 (<span class="bin">1</span>000 0000…) “hata” anlamına gelir; <code>0007</code> hatanın kaynağını (Win32), <code>0005</code> hata numarasını gösterir. Bitlerin anlamı olduğu için hex kullanılır.', en: 'Windows’ “Access denied” (E_ACCESSDENIED) error. The top bit being 1 (<span class="bin">1</span>000 0000…) means “failure”; <code>0007</code> is the facility (Win32) and <code>0005</code> the error number. Hex is used because individual bits carry meaning.' }) + '</p>',
    },
    {
      label: 'IPv6', value: '2001:0db8::1',
      html: () => '<div class="digit-tiles">' + ['2001', '0DB8', '0000', '0000', '0000', '0000', '0000', '0001'].map((g) => '<div class="tile hex">' + g + '<small>16 bit</small></div>').join('') + '</div>' +
        '<p>' + t({ tr: 'IPv6 adresleri 128 bittir: 4 hex rakamlık 8 grup. <code>::</code> art arda gelen sıfır gruplarının kısaltmasıdır. <code>2001:db8::/32</code> belgelerde örnek için ayrılmış adres bloğudur.', en: 'IPv6 addresses are 128 bits: 8 groups of 4 hex digits. <code>::</code> abbreviates a run of zero groups. <code>2001:db8::/32</code> is reserved for documentation examples.' }) + '</p>',
    },
  ];
  const chips = $('#wild-chips'), wout = $('#wild-out');
  EX.forEach((ex, i) => {
    const c = el('button', { type: 'button', class: 'chip' + (i === 0 ? ' on' : ''), 'aria-pressed': String(i === 0), html: esc(ex.label) + ' <span class="mono">' + esc(ex.value) + '</span>' });
    c.addEventListener('click', () => { $$('.chip', chips).forEach((x) => { x.classList.toggle('on', x === c); x.setAttribute('aria-pressed', String(x === c)); }); show(i); });
    chips.append(c);
  });
  function show(i) { wout.innerHTML = '<div class="fade-up"><div class="wild-value mono hex">' + esc(EX[i].value) + '</div>' + EX[i].html() + '</div>'; }
  show(0);

  /* ---------- alıştırmalar ---------- */
  NS.practice($('#practice'), [
    { label: t({ tr: 'Hex → onlu', en: 'Hex → decimal' }), fn: GEN.hexToDec },
    { label: t({ tr: 'Onlu → hex', en: 'Decimal → hex' }), fn: GEN.decToHex },
    { label: t({ tr: 'Hex → binary', en: 'Hex → binary' }), fn: GEN.hexToBin },
    { label: t({ tr: 'Binary → hex', en: 'Binary → hex' }), fn: GEN.binToHex },
  ]);
  const digitQ = () => {
    const v = rand(0, 15), kind = pick(['h2d', 'b2h', 'd2h']);
    const b = pad(v.toString(2), 4), h = toBase(v, 16);
    if (kind === 'h2d') return { q: '<span class="num hex">' + h + '</span><sub>16</sub> = ? <sub>10</sub>', a: String(v), kind: 'dec', hint: 'A=10, B=11, C=12, D=13, E=14, F=15', explain: h + ' = ' + v };
    if (kind === 'b2h') return { q: '<span class="num bin">' + b + '</span><sub>2</sub> = ? <sub>16</sub>', a: h, kind: 'hex', hint: t({ tr: 'Ağırlıklar 8 4 2 1', en: 'Weights 8 4 2 1' }), explain: b + ' = ' + [...b].map((x, j) => (x === '1' ? [8, 4, 2, 1][j] : null)).filter(Boolean).join('+') + ' = ' + v + ' = ' + h };
    return { q: '<span class="num dec">' + v + '</span><sub>10</sub> = ? <sub>16</sub>', a: h, kind: 'hex', hint: t({ tr: '10’dan itibaren harfler başlar: A=10', en: 'Letters start at 10: A=10' }), explain: v + ' = ' + h };
  };
  NS.practice($('#drill'), [digitQ], { title: t({ tr: 'Hızlı tekrar: tek hex rakamı', en: 'Quick drill: single hex digit' }) });
})();
