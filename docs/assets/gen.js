/* Alıştırma soru üreteçleri. Her biri { q, a, kind, hint, explain, ph } döndürür. */
(function () {
  'use strict';
  const { t, rand, pick, fmt, toBase, pad, group, esc } = NS;
  const cls = (b) => ({ 2: 'b', 16: 'h', 10: 'd', 8: 'b' }[b]);
  const num = (v, b) => '<span class="' + cls(b) + '">' + esc(v) + '</span><span class="sub">' + b + '</span>';
  const bname = (b) => t({ 2: { tr: 'ikili (binary)', en: 'binary' }, 8: { tr: 'sekizli', en: 'octal' }, 10: { tr: 'onlu', en: 'decimal' }, 16: { tr: 'onaltılı (hex)', en: 'hex' } }[b]);
  const kindOf = (b) => ({ 2: 'bin', 8: 'oct', 10: 'dec', 16: 'hex' }[b]);

  function conv(from, to, max) {
    return () => {
      const n = rand(from === 10 || to === 10 ? 2 : 1, max), s = toBase(n, from), a = toBase(n, to);
      let hint, explain;
      if (to === 10) {
        hint = t({ tr: 'Her rakamı basamak değeriyle (' + from + '’nin kuvvetleri) çarpıp topla.', en: 'Multiply each digit by its place value (powers of ' + from + ') and add.' });
        explain = [...s].map((d, i) => { const v = parseInt(d, 16), k = s.length - 1 - i; return v ? v + '×' + from + '<sup>' + k + '</sup>' : null; }).filter(Boolean).join(' + ') + ' = <b>' + n + '</b>';
      } else if (from === 10) {
        hint = to === 2 ? t({ tr: 'Sığan en büyük 2’nin kuvvetinden başla: 128, 64, 32…', en: 'Start with the largest power of two that fits: 128, 64, 32…' }) : t({ tr: 'Tekrar tekrar ' + to + '’ya böl; kalanları sondan başa yaz.', en: 'Divide by ' + to + ' repeatedly; write remainders in reverse.' });
        let x = n; const r = []; while (x) { r.push(x + ' ÷ ' + to + ' → ' + t({ tr: 'kalan', en: 'rem' }) + ' ' + toBase(x % to, to)); x = Math.floor(x / to); }
        explain = r.join(', ') + ' → <b>' + a + '</b>';
      } else {
        const k = from === 8 || to === 8 ? 3 : 4, bin = n.toString(2), p = pad(bin, Math.ceil(bin.length / k) * k);
        hint = t({ tr: 'Bitleri sağdan ' + k + '’erli grupla; her grup tek bir rakam.', en: 'Group the bits in ' + k + 's from the right; each group is one digit.' });
        explain = group(p, k).split(' ').map((g) => '<span class="b">' + g + '</span>→<span class="h">' + toBase(parseInt(g, 2), 16) + '</span>').join(' ');
      }
      return { q: num(s, from) + ' → ' + t({ tr: bname(to) + ' olarak?', en: 'in ' + bname(to) + '?' }), a, kind: kindOf(to), hint, explain };
    };
  }

  const G = {
    num, conv,
    binToDec: conv(2, 10, 255), decToBin: conv(10, 2, 255), hexToDec: conv(16, 10, 255), decToHex: conv(10, 16, 255),
    hexToBin: conv(16, 2, 255), binToHex: conv(2, 16, 255), octToBin: conv(8, 2, 511), binToOct: conv(2, 8, 511), octToDec: conv(8, 10, 511),
    anyBase() { const B = [2, 8, 10, 16]; const f = pick(B); let to; do { to = pick(B); } while (to === f); return conv(f, to, 255)(); },
    patterns() {
      const n = pick([1, 2, 3, 4, 5, 6, 8, 10, 12, 16]);
      return { q: t({ tr: n + ' anahtarla kaç farklı desen yapılabilir?', en: 'How many different patterns can ' + n + ' switches make?' }), a: String(2 ** n), kind: 'dec', hint: t({ tr: 'Her yeni anahtar desen sayısını ikiye katlar.', en: 'Each new switch doubles the number of patterns.' }), explain: '2<sup>' + n + '</sup> = <b>' + fmt(2 ** n) + '</b>' };
    },
    maxValue() {
      const n = pick([3, 4, 5, 6, 8, 10, 12, 16]);
      return { q: t({ tr: n + ' bitle yazılabilecek en büyük (işaretsiz) sayı?', en: 'Largest unsigned number in ' + n + ' bits?' }), a: String(2 ** n - 1), kind: 'dec', hint: t({ tr: 'Bütün ampuller yanık: 2ⁿ − 1', en: 'All lamps on: 2ⁿ − 1' }), explain: '2<sup>' + n + '</sup> − 1 = <b>' + fmt(2 ** n - 1) + '</b>' };
    },
    bitsNeeded() {
      const items = NS.LANG === 'en'
        ? [[26, 'the 26 letters of the alphabet'], [7, 'the days of the week'], [12, 'the months'], [100, 'a number from 1 to 100'], [52, 'a card from a deck'], [1000, '1000 products'], [50, 'the 50 US states'], [365, 'a day of the year']]
        : [[29, 'Türk alfabesinin 29 harfini'], [7, 'haftanın günlerini'], [12, 'ayları'], [100, '1–100 arası bir sayıyı'], [52, 'desteden bir kartı'], [1000, '1000 ürünü'], [81, '81 ili'], [365, 'yılın bir gününü']];
      const [n, what] = pick(items), b = Math.ceil(Math.log2(n));
      return { q: t({ tr: what + ' kodlamak için en az kaç bit gerekir?', en: 'Minimum bits needed to encode ' + what + '?' }), a: String(b), kind: 'dec', hint: t({ tr: '2ⁿ ≥ ' + n + ' olan en küçük n. (Ya da: kaç evet/hayır sorusu?)', en: 'Smallest n with 2ⁿ ≥ ' + n + '. (Or: how many yes/no questions?)' }), explain: '2<sup>' + (b - 1) + '</sup> = ' + 2 ** (b - 1) + ' &lt; ' + n + ' ≤ 2<sup>' + b + '</sup> = ' + 2 ** b + ' → <b>' + b + '</b>' };
    },
    units() {
      const c = pick([
        () => { const k = rand(2, 8); return [t({ tr: k + ' KiB kaç byte?', en: 'How many bytes in ' + k + ' KiB?' }), k * 1024, k + ' × 1024']; },
        () => { const k = rand(2, 9); return [t({ tr: k + ' kB (SI) kaç byte?', en: 'How many bytes in ' + k + ' kB (SI)?' }), k * 1000, k + ' × 1000']; },
        () => { const k = pick([4, 8, 16, 32]); return [t({ tr: k + ' byte kaç bit?', en: 'How many bits in ' + k + ' bytes?' }), k * 8, k + ' × 8']; },
        () => { const k = pick([8, 16, 40, 80, 100]); return [t({ tr: k + ' Mbit/s hat saniyede en fazla kaç MB indirir?', en: 'At most how many MB per second on a ' + k + ' Mbit/s line?' }), k / 8, k + ' ÷ 8']; },
      ])();
      return { q: c[0], a: [String(c[1]), String(c[1]).replace('.', ',')], kind: 'text', explain: c[2] + ' = <b>' + fmt(c[1]) + '</b>' };
    },
    twosEncode() {
      const n = -rand(1, 128), bits = pad(((n + 256) % 256).toString(2), 8), p = pad((-n).toString(2), 8), inv = p.replace(/[01]/g, (c) => (c === '0' ? '1' : '0'));
      return { q: t({ tr: '<span class="n">' + n + '</span> sayısını 8 bit ikiye tümleyen olarak yaz.', en: 'Write <span class="n">' + n + '</span> as 8-bit two’s complement.' }), a: bits, kind: 'bits', ph: '8 bit', hint: t({ tr: '|' + n + '| → 8 bit → ters çevir → +1', en: '|' + n + '| → 8 bits → flip → +1' }), explain: '<span class="b">' + p + '</span> → <span class="b">' + inv + '</span> → <b class="b">' + bits + '</b>' };
    },
    twosDecode() {
      const v = rand(0, 255), bits = pad(v.toString(2), 8), s = v >= 128 ? v - 256 : v;
      return { q: t({ tr: '8 bit işaretli <span class="b">' + bits + '</span> kaçtır?', en: 'What is the 8-bit signed value <span class="b">' + bits + '</span>?' }), a: String(s), kind: 'dec', hint: t({ tr: 'En soldaki bit +128 değil −128 değerindedir.', en: 'The leftmost bit is worth −128, not +128.' }), explain: [...bits].map((b, i) => (b === '1' ? (i ? 2 ** (7 - i) : '−128') : null)).filter(Boolean).join(' + ').replace('+ −', '− ') + ' = <b>' + s + '</b>' };
    },
    fracToBin() {
      const f = pick([0.5, 0.25, 0.75, 0.125, 0.375, 0.625, 0.875, 0.0625, 0.1875, 0.3125, 0.8125]);
      let x = f, o = '', st = [];
      while (x > 0) { const y = x * 2, b = Math.floor(y); st.push(x + '×2=' + y); o += b; x = y - b; }
      return { q: t({ tr: '<span class="d">' + String(f).replace('.', ',') + '</span> binary kesir olarak?', en: '<span class="d">' + f + '</span> as a binary fraction?' }), a: '0.' + o, kind: 'text', ph: '0.…', hint: t({ tr: '2 ile çarp, tam kısmı al, kesirle devam et.', en: 'Multiply by 2, take the integer part, continue.' }), explain: st.join(', ') + ' → <b>0.' + o + '</b>' };
    },
    binFracToDec() {
      const n = rand(1, 15), s = pad(n.toString(2), 4).replace(/0+$/, ''), v = n / 16;
      return { q: t({ tr: '<span class="b">0.' + s + '</span><span class="sub">2</span> onlu olarak?', en: '<span class="b">0.' + s + '</span><span class="sub">2</span> in decimal?' }), a: [String(v), String(v).replace('.', ',')], kind: 'text', hint: '½, ¼, ⅛, 1/16', explain: [...s].map((b, i) => (b === '1' ? '2<sup>−' + (i + 1) + '</sup>' : null)).filter(Boolean).join(' + ') + ' = <b>' + v + '</b>' };
    },
    asciiCode() {
      const c = pick('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split('')), code = c.charCodeAt(0), hx = Math.random() < 0.4;
      const base = /[A-Z]/.test(c) ? ['A', 65] : /[a-z]/.test(c) ? ['a', 97] : ['0', 48];
      return { q: t({ tr: '<code>' + c + '</code> karakterinin ASCII kodu (' + (hx ? 'hex' : 'onlu') + ')?', en: 'ASCII code of <code>' + c + '</code> (' + (hx ? 'hex' : 'decimal') + ')?' }), a: hx ? toBase(code, 16) : String(code), kind: hx ? 'hex' : 'dec', hint: "'" + base[0] + "' = " + base[1] + ' = 0x' + toBase(base[1], 16), explain: "'" + base[0] + "' + " + (code - base[1]) + ' = ' + code + ' = 0x' + toBase(code, 16) };
    },
    asciiChar() {
      const r = pick([[65, 90], [97, 122], [48, 57]]), code = rand(r[0], r[1]);
      return { q: t({ tr: 'ASCII kodu <span class="d">' + code + '</span> olan karakter?', en: 'Which character has ASCII code <span class="d">' + code + '</span>?' }), a: String.fromCharCode(code), kind: 'text', hint: "'A' = 65, 'a' = 97, '0' = 48", explain: code + ' → <code>' + esc(String.fromCharCode(code)) + '</code>' };
    },
    utf8Bytes() {
      const [c, n] = pick([['A', 1], ['7', 1], ['ş', 2], ['ğ', 2], ['é', 2], ['ñ', 2], ['Ω', 2], ['€', 3], ['₺', 3], ['中', 3], ['😀', 4], ['🚀', 4]]);
      const bytes = Array.from(new TextEncoder().encode(c)).map((b) => pad(toBase(b, 16), 2)).join(' ');
      return { q: t({ tr: '<code>' + c + '</code> UTF-8’de kaç byte?', en: 'How many bytes is <code>' + c + '</code> in UTF-8?' }), a: String(n), kind: 'dec', hint: t({ tr: 'U+007F’e kadar 1, U+07FF’e kadar 2, U+FFFF’e kadar 3, sonrası 4.', en: 'Up to U+007F: 1, up to U+07FF: 2, up to U+FFFF: 3, beyond: 4.' }), explain: 'U+' + pad(toBase(c.codePointAt(0), 16), 4) + ' → <span class="h">' + bytes + '</span>' };
    },
    colorChannel() {
      const r = rand(0, 255), g = rand(0, 255), b = rand(0, 255), hex = '#' + [r, g, b].map((x) => pad(toBase(x, 16), 2)).join('');
      const k = rand(0, 2), nm = [{ tr: 'kırmızı', en: 'red' }, { tr: 'yeşil', en: 'green' }, { tr: 'mavi', en: 'blue' }][k], v = [r, g, b][k], pr = hex.slice(1 + 2 * k, 3 + 2 * k);
      return { q: '<span class="h">' + hex + '</span> <span style="display:inline-block;width:1.1em;height:1.1em;border-radius:4px;vertical-align:-0.15em;background:' + hex + ';box-shadow:0 0 0 1px var(--rule-2)"></span> ' + t({ tr: '— ' + t(nm) + ' kanalı onlu olarak?', en: '— the ' + t(nm) + ' channel in decimal?' }), a: String(v), kind: 'dec', hint: t({ tr: '#RRGGBB: ilgili iki rakamı onluya çevir.', en: '#RRGGBB: convert that pair of digits.' }), explain: '<span class="h">' + pr + '</span> = ' + parseInt(pr[0], 16) + '×16 + ' + parseInt(pr[1], 16) + ' = <b>' + v + '</b>' };
    },
    rgbToHex() {
      const V = [0, 51, 102, 128, 153, 204, 255], r = pick(V), g = pick(V), b = pick(V), hex = '#' + [r, g, b].map((x) => pad(toBase(x, 16), 2)).join('');
      return { q: '<code>rgb(' + r + ', ' + g + ', ' + b + ')</code> ' + t({ tr: 'hex kodu?', en: 'as a hex code?' }), a: hex, kind: 'color', ph: '#RRGGBB', hint: t({ tr: 'Her kanalı 2 haneli hex yap.', en: 'Make each channel 2 hex digits.' }), explain: '<b class="h">' + hex + '</b>' };
    },
    bitwise() {
      if (Math.random() < 0.3) {
        const x = rand(1, 31), k = rand(1, 3), left = Math.random() < 0.5, r = left ? x << k : x >> k;
        return { q: '<code>' + x + (left ? ' &lt;&lt; ' : ' &gt;&gt; ') + k + '</code> = ?', a: String(r), kind: 'dec', hint: left ? t({ tr: 'Sola k kaydırma = ×2ᵏ', en: 'Shift left by k = ×2ᵏ' }) : t({ tr: 'Sağa k kaydırma = ÷2ᵏ (aşağı yuvarla)', en: 'Shift right by k = ÷2ᵏ (round down)' }), explain: '<span class="b">' + x.toString(2) + '</span> → <span class="b">' + r.toString(2) + '</span> = <b>' + r + '</b>' };
      }
      const a = rand(0, 255), b = rand(0, 255), [op, f] = pick([['&', (x, y) => x & y], ['|', (x, y) => x | y], ['^', (x, y) => x ^ y]]), r = f(a, b);
      return { q: '<code>0x' + pad(toBase(a, 16), 2) + ' ' + op + ' 0x' + pad(toBase(b, 16), 2) + '</code> = ? (hex)', a: toBase(r, 16), kind: 'hex', hint: t({ tr: 'İkisini de 8 bit yaz, sütun sütun uygula.', en: 'Write both in 8 bits and apply column by column.' }), explain: '<span class="b">' + pad(a.toString(2), 8) + ' ' + op + ' ' + pad(b.toString(2), 8) + ' = ' + pad(r.toString(2), 8) + '</span> = <b class="h">' + toBase(r, 16) + '</b>' };
    },
    binAdd() { const x = rand(5, 120), y = rand(5, 120); return { q: '<span class="b">' + x.toString(2) + '</span> + <span class="b">' + y.toString(2) + '</span> = ? ' + t({ tr: '(ikili)', en: '(binary)' }), a: (x + y).toString(2), kind: 'bin', hint: t({ tr: '1 + 1 = 10: 0 yaz, 1 elde.', en: '1 + 1 = 10: write 0, carry 1.' }), explain: x + ' + ' + y + ' = <b class="b">' + (x + y).toString(2) + '</b>' }; },
    binSub() { const x = rand(40, 200), y = rand(3, x - 1); return { q: '<span class="b">' + x.toString(2) + '</span> − <span class="b">' + y.toString(2) + '</span> = ? ' + t({ tr: '(ikili)', en: '(binary)' }), a: (x - y).toString(2), kind: 'bin', hint: t({ tr: '0 − 1: soldan ödünç al.', en: '0 − 1: borrow from the left.' }), explain: x + ' − ' + y + ' = <b class="b">' + (x - y).toString(2) + '</b>' }; },
    onesComp() { const x = rand(1, 127), r = pad((~x & 255).toString(2), 8); return { q: t({ tr: '<span class="n">−' + x + '</span>, 8 bit 1’e tümleyen?', en: '<span class="n">−' + x + '</span> in 8-bit one’s complement?' }), a: r, kind: 'bits', ph: '8 bit', hint: t({ tr: 'Bitleri ters çevir.', en: 'Flip the bits.' }), explain: pad(x.toString(2), 8) + ' → <b class="b">' + r + '</b>' }; },
    signExt() { const u = rand(0, 255), v = (u >= 128 ? u - 256 : u) & 0xffff; return { q: t({ tr: '8 bit işaretli <span class="h">0x' + pad(toBase(u, 16), 2) + '</span>, 16 bite işaretle genişletilince (hex)?', en: '8-bit signed <span class="h">0x' + pad(toBase(u, 16), 2) + '</span> sign-extended to 16 bits (hex)?' }), a: pad(toBase(v, 16), 4), kind: 'hex', hint: t({ tr: 'Üst bit 1 → FF, 0 → 00.', en: 'Top bit 1 → FF, 0 → 00.' }), explain: '<b class="h">' + pad(toBase(v, 16), 4) + '</b>' }; },
    bcd() { const n = rand(10, 99), a = String(n).split('').map((d) => pad((+d).toString(2), 4)).join(''); return { q: t({ tr: n + ' sayısının BCD gösterimi?', en: 'The BCD form of ' + n + '?' }), a, kind: 'bits', ph: '8 bit', hint: t({ tr: 'Her basamak 4 bit.', en: 'Each digit is 4 bits.' }), explain: '<b class="b">' + a + '</b>' }; },
    gray() { const n = rand(1, 31), g = pad((n ^ (n >> 1)).toString(2), 5); return { q: t({ tr: n + ' sayısının 5 bitlik Gray kodu?', en: 'The 5-bit Gray code of ' + n + '?' }), a: g, kind: 'bits', ph: '5 bit', hint: 'n ^ (n >> 1)', explain: '<b class="b">' + g + '</b>' }; },
    patCount() { const b = pick([2, 3, 4, 8, 10, 16]), n = rand(2, b > 8 ? 3 : 5); return { q: t({ tr: 'Taban ' + b + '’de ' + n + ' basamakla kaç farklı sayı yazılır?', en: 'How many numbers can ' + n + ' digits write in base ' + b + '?' }), a: String(b ** n), kind: 'dec', hint: 'bⁿ', explain: b + '<sup>' + n + '</sup> = <b>' + fmt(b ** n) + '</b>' }; },
    alignUp() { const a = pick([4, 8, 16]), x = rand(1, 200), r = (x + a - 1) & ~(a - 1); return { q: t({ tr: x + ' ya da sonrası, ' + a + '’ya hizalı ilk adres?', en: 'First address at or after ' + x + ' aligned to ' + a + '?' }), a: String(r), kind: 'dec', hint: '(x + a − 1) & ~(a − 1)', explain: '<b>' + r + '</b>' }; },
    wrap8() { const x = rand(100, 255), y = rand(60, 255); return { q: t({ tr: '8 bit işaretsiz: <code>' + x + ' + ' + y + '</code> = ?', en: '8-bit unsigned: <code>' + x + ' + ' + y + '</code> = ?' }), a: String((x + y) & 255), kind: 'dec', hint: 'mod 256', explain: (x + y) + ' mod 256 = <b>' + ((x + y) & 255) + '</b>' }; },
  };
  window.GEN = G;
})();
