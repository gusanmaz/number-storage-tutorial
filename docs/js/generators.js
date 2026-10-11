/* ==========================================================================
   Alıştırma soru üreteçleri — tüm bölümler ve "Karma Pratik" sayfası kullanır.
   Her üreteç { q, a, kind, hint, explain } döndürür.
   ========================================================================== */
(function () {
  'use strict';
  const { t, rand, pick, fmt, toBase, pad, sub, baseClass, group, esc } = NS;

  /** Renkli sayı gösterimi: num('1011', 2) → 1011₂ */
  const num = (v, b) => '<span class="num"><span class="' + baseClass(b) + '">' + esc(v) + '</span><sub>' + b + '</sub></span>';
  const bname = (b) => t({ 2: { tr: 'ikili (binary)', en: 'binary' }, 8: { tr: 'sekizli (octal)', en: 'octal' }, 10: { tr: 'onlu (decimal)', en: 'decimal' }, 16: { tr: 'onaltılı (hex)', en: 'hexadecimal' } }[b]);
  const kindOf = (b) => ({ 2: 'bin', 8: 'oct', 10: 'dec', 16: 'hex' }[b]);

  /** Bir sayının verilen tabandan onluya açılımı (açıklama metni). */
  function expand(s, b) {
    const parts = [...s].map((d, i) => {
      const k = s.length - 1 - i, v = parseInt(d, 36);
      return v ? (v + '×' + b + '<sup>' + k + '</sup>') : null;
    }).filter(Boolean);
    return parts.join(' + ') || '0';
  }
  /** Tekrarlı bölme açıklaması. */
  function divSteps(n, b) {
    if (n === 0) return '0';
    const rows = [];
    let x = n;
    while (x > 0) { rows.push(x + ' ÷ ' + b + ' = ' + Math.floor(x / b) + ' ' + t({ tr: 'kalan', en: 'remainder' }) + ' <b>' + toBase(x % b, b) + '</b>'); x = Math.floor(x / b); }
    return rows.join('<br>') + '<br>' + t({ tr: 'Kalanları aşağıdan yukarı oku.', en: 'Read the remainders from bottom to top.' });
  }

  function conv(from, to, max) {
    return function () {
      const n = rand(from === 10 || to === 10 ? 2 : 1, max);
      const s = toBase(n, from), ans = toBase(n, to);
      let hint, explain;
      if (to === 10) {
        hint = t({ tr: 'Her basamağı, bulunduğu konumun değeriyle (' + from + '’nin kuvveti) çarpıp topla.', en: 'Multiply each digit by its place value (a power of ' + from + ') and add.' });
        explain = expand(s, from) + ' = <b>' + n + '</b>';
      } else if (from === 10) {
        hint = t({ tr: 'Sayıyı tekrar tekrar ' + to + '’ye böl; kalanları sondan başa yaz.', en: 'Divide by ' + to + ' repeatedly; write the remainders in reverse order.' });
        explain = divSteps(n, to);
      } else if ((from === 2 && to === 16) || (from === 16 && to === 2)) {
        const bin = toBase(n, 2), padded = pad(bin, Math.ceil(bin.length / 4) * 4);
        hint = t({ tr: 'Her hex rakamı tam 4 bite karşılık gelir. Binary’yi sağdan 4’erli grupla.', en: 'Each hex digit is exactly 4 bits. Group the binary in 4s from the right.' });
        explain = group(padded, 4).split(' ').map((g) => '<span class="bin">' + g + '</span>→<span class="hex">' + toBase(parseInt(g, 2), 16) + '</span>').join('  ');
      } else if ((from === 2 && to === 8) || (from === 8 && to === 2)) {
        const bin = toBase(n, 2), padded = pad(bin, Math.ceil(bin.length / 3) * 3);
        hint = t({ tr: 'Her octal rakamı tam 3 bite karşılık gelir. Binary’yi sağdan 3’erli grupla.', en: 'Each octal digit is exactly 3 bits. Group the binary in 3s from the right.' });
        explain = group(padded, 3).split(' ').map((g) => '<span class="bin">' + g + '</span>→<span class="oct">' + toBase(parseInt(g, 2), 8) + '</span>').join('  ');
      } else {
        hint = t({ tr: 'Önce onluya çevir, sonra hedef tabana.', en: 'Convert to decimal first, then to the target base.' });
        explain = num(s, from) + ' = ' + n + '<sub>10</sub> = ' + num(ans, to);
      }
      return {
        q: num(s, from) + ' → ' + t({ tr: bname(to) + ' karşılığı nedir?', en: 'what is it in ' + bname(to) + '?' }),
        a: ans, kind: kindOf(to), hint, explain,
        placeholder: to === 16 ? 'ör. 2F' : to === 2 ? 'ör. 1011' : undefined,
      };
    };
  }

  const G = {
    num, conv,
    binToDec: conv(2, 10, 255),
    decToBin: conv(10, 2, 255),
    hexToDec: conv(16, 10, 255),
    decToHex: conv(10, 16, 255),
    hexToBin: conv(16, 2, 255),
    binToHex: conv(2, 16, 255),
    octToBin: conv(8, 2, 511),
    binToOct: conv(2, 8, 511),
    octToDec: conv(8, 10, 511),
    anyBase() { const bs = [2, 8, 10, 16]; const f = pick(bs); let to; do { to = pick(bs); } while (to === f); return conv(f, to, 255)(); },

    capacity() {
      const n = pick([1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 16]);
      return {
        q: t({ tr: n + ' bit ile kaç farklı değer gösterilebilir?', en: 'How many different values can ' + n + ' bits represent?' }),
        a: String(Math.pow(2, n)), kind: 'dec',
        hint: t({ tr: 'Her bit 2 seçenek → 2 × 2 × … (n kez) = 2ⁿ', en: 'Each bit has 2 options → 2 × 2 × … (n times) = 2ⁿ' }),
        explain: '2<sup>' + n + '</sup> = <b>' + fmt(Math.pow(2, n)) + '</b>',
      };
    },
    maxValue() {
      const n = pick([2, 3, 4, 5, 6, 8, 10, 12, 16]);
      return {
        q: t({ tr: n + ' bitlik işaretsiz (unsigned) bir sayının alabileceği en büyük değer nedir?', en: 'What is the largest value an unsigned ' + n + '-bit number can hold?' }),
        a: String(Math.pow(2, n) - 1), kind: 'dec',
        hint: t({ tr: 'Sayım 0’dan başlar. 2ⁿ farklı değer varsa en büyüğü 2ⁿ − 1 olur.', en: 'Counting starts at 0. With 2ⁿ values, the largest is 2ⁿ − 1.' }),
        explain: '2<sup>' + n + '</sup> − 1 = ' + fmt(Math.pow(2, n)) + ' − 1 = <b>' + fmt(Math.pow(2, n) - 1) + '</b> (' + t({ tr: 'tüm bitler 1', en: 'all bits 1' }) + ')',
      };
    },
    bitsNeeded() {
      const items = [
        { n: 26, tr: 'İngiliz alfabesindeki 26 harfi', en: 'the 26 letters of the English alphabet' },
        { n: 7, tr: 'haftanın 7 gününü', en: 'the 7 days of the week' },
        { n: 12, tr: 'yılın 12 ayını', en: 'the 12 months of the year' },
        { n: 100, tr: '0–99 arası notları (100 değer)', en: 'grades 0–99 (100 values)' },
        { n: 60, tr: 'bir dakikadaki saniyeleri (0–59)', en: 'the seconds in a minute (0–59)' },
        { n: 1000, tr: '1000 farklı ürün kodunu', en: '1000 different product codes' },
        { n: 2, tr: 'açık/kapalı durumunu', en: 'an on/off state' },
        { n: 300, tr: 'bir okuldaki 300 öğrenciyi', en: '300 students in a school' },
        NS.LANG === 'en' ? { n: 50, en: 'the 50 US states' } : { n: 81, tr: 'Türkiye’nin 81 ilini' },
        { n: 24, tr: 'günün 24 saatini (0–23)', en: 'the 24 hours of a day (0–23)' },
      ];
      const it = pick(items);
      const b = Math.max(1, Math.ceil(Math.log2(it.n)));
      return {
        q: t({ tr: it.tr + ' ayrı ayrı kodlamak için en az kaç bit gerekir?', en: 'What is the minimum number of bits needed to encode ' + it.en + '?' }),
        a: String(b), kind: 'dec',
        hint: t({ tr: '2ⁿ ≥ ' + it.n + ' olacak en küçük n’yi bul.', en: 'Find the smallest n with 2ⁿ ≥ ' + it.n + '.' }),
        explain: '2<sup>' + (b - 1) + '</sup> = ' + Math.pow(2, b - 1) + ' &lt; ' + it.n + ' ≤ 2<sup>' + b + '</sup> = ' + Math.pow(2, b) + ' → <b>' + b + ' bit</b>',
      };
    },
    hexDigitsToBits() {
      const h = rand(1, 8);
      return {
        q: t({ tr: h + ' hex rakamı kaç bit eder?', en: 'How many bits are ' + h + ' hex digits?' }),
        a: String(h * 4), kind: 'dec',
        hint: t({ tr: '1 hex rakamı = 4 bit', en: '1 hex digit = 4 bits' }),
        explain: h + ' × 4 = <b>' + h * 4 + '</b> bit' + (h % 2 === 0 ? ' = ' + h / 2 + ' byte' : ''),
      };
    },
    units() {
      const cases = [
        () => { const k = rand(1, 8); return { q: t({ tr: k + ' KiB kaç byte’tır?', en: 'How many bytes is ' + k + ' KiB?' }), a: String(k * 1024), explain: k + ' × 1024 = <b>' + fmt(k * 1024) + '</b>', hint: '1 KiB = 2¹⁰ = 1024 byte' }; },
        () => { const k = rand(1, 9); return { q: t({ tr: k + ' kB (SI) kaç byte’tır?', en: 'How many bytes is ' + k + ' kB (SI)?' }), a: String(k * 1000), explain: k + ' × 1000 = <b>' + fmt(k * 1000) + '</b>', hint: t({ tr: 'SI önekleri 10’un kuvvetidir: kilo = 1000', en: 'SI prefixes are powers of 10: kilo = 1000' }) }; },
        () => { const k = pick([2, 4, 8, 16, 32]); return { q: t({ tr: k + ' byte kaç bit’tir?', en: 'How many bits are ' + k + ' bytes?' }), a: String(k * 8), explain: k + ' × 8 = <b>' + k * 8 + '</b>', hint: '1 byte = 8 bit' }; },
        () => { const k = pick([1, 2, 4, 8]); return { q: t({ tr: k + ' MiB kaç KiB’tır?', en: 'How many KiB is ' + k + ' MiB?' }), a: String(k * 1024), explain: k + ' × 1024 = <b>' + fmt(k * 1024) + '</b>', hint: '1 MiB = 1024 KiB' }; },
      ];
      const c = pick(cases)();
      c.kind = 'dec';
      return c;
    },
    twosEncode() {
      const n = -rand(1, 128);
      const bits = pad(((n + 256) % 256).toString(2), 8);
      const p = pad((-n).toString(2), 8);
      const inv = p.replace(/[01]/g, (c) => (c === '0' ? '1' : '0'));
      return {
        q: t({ tr: num(n, 10) + ' sayısını 8 bitlik ikiye tümleyen (two’s complement) olarak yaz.', en: 'Write ' + num(n, 10) + ' as an 8-bit two’s complement number.' }),
        a: bits, kind: 'bits', placeholder: '8 bit',
        hint: t({ tr: '|' + n + '| sayısını 8 bit yaz → bitleri ters çevir → 1 ekle.', en: 'Write |' + n + '| in 8 bits → flip all bits → add 1.' }),
        explain: '<span class="mono">' + p + '</span> → ' + t({ tr: 'ters', en: 'flip' }) + ' <span class="mono">' + inv + '</span> → +1 → <b class="mono">' + bits + '</b>',
      };
    },
    twosDecode() {
      const v = rand(0, 255);
      const bits = pad(v.toString(2), 8);
      const s = v >= 128 ? v - 256 : v;
      return {
        q: t({ tr: '8 bitlik işaretli (signed, two’s complement) <span class="num bin">' + bits + '</span> onlu olarak kaçtır?', en: 'What is the 8-bit signed (two’s complement) value <span class="num bin">' + bits + '</span> in decimal?' }),
        a: String(s), kind: 'dec',
        hint: t({ tr: 'En soldaki bitin ağırlığı +128 değil, −128’dir.', en: 'The leftmost bit is worth −128, not +128.' }),
        explain: [...bits].map((b, i) => (b === '1' ? (i === 0 ? '−128' : String(Math.pow(2, 7 - i))) : null)).filter(Boolean).join(' + ').replace(/\+ −/g, '− ') + ' = <b>' + s + '</b>',
      };
    },
    asciiCode() {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const c = pick(chars.split(''));
      const code = c.charCodeAt(0);
      const asHex = Math.random() < 0.4;
      const base = /[A-Z]/.test(c) ? ['A', 65] : /[a-z]/.test(c) ? ['a', 97] : ['0', 48];
      return {
        q: t({ tr: '<code>\'' + c + '\'</code> karakterinin ASCII kodu ' + (asHex ? 'hex olarak' : 'onlu olarak') + ' nedir?', en: 'What is the ASCII code of <code>\'' + c + '\'</code> in ' + (asHex ? 'hex' : 'decimal') + '?' }),
        a: asHex ? toBase(code, 16) : String(code), kind: asHex ? 'hex' : 'dec',
        hint: t({ tr: "'" + base[0] + "' = " + base[1] + ' (0x' + toBase(base[1], 16) + '). Ardışık karakterlerin kodları da ardışıktır.', en: "'" + base[0] + "' = " + base[1] + ' (0x' + toBase(base[1], 16) + '). Consecutive characters have consecutive codes.' }),
        explain: "'" + base[0] + "' + " + (code - base[1]) + ' = ' + code + ' = 0x' + toBase(code, 16),
      };
    },
    asciiChar() {
      const pool = [[65, 90], [97, 122], [48, 57]];
      const r = pick(pool), code = rand(r[0], r[1]);
      return {
        q: t({ tr: 'ASCII kodu <span class="num dec">' + code + '</span> olan karakter hangisidir?', en: 'Which character has ASCII code <span class="num dec">' + code + '</span>?' }),
        a: String.fromCharCode(code), kind: 'text',
        hint: "'A' = 65, 'a' = 97, '0' = 48",
        explain: code + ' → <code>' + esc(String.fromCharCode(code)) + '</code>',
      };
    },
    utf8Bytes() {
      const items = [['A', 1], ['z', 1], ['7', 1], ['ş', 2], ['ğ', 2], ['ü', 2], ['ç', 2], ['İ', 2], ['é', 2], ['€', 3], ['₺', 3], ['ア', 3], ['中', 3], ['😀', 4], ['🚀', 4]];
      const [c, n] = pick(items);
      const cp = c.codePointAt(0);
      const bytes = Array.from(new TextEncoder().encode(c)).map((b) => pad(toBase(b, 16), 2)).join(' ');
      return {
        q: t({ tr: '<code>' + c + '</code> karakteri UTF-8’de kaç byte yer kaplar?', en: 'How many bytes does <code>' + c + '</code> take in UTF-8?' }),
        a: String(n), kind: 'dec',
        hint: t({ tr: 'U+007F’ye kadar 1, U+07FF’e kadar 2, U+FFFF’e kadar 3, üstü 4 byte.', en: 'Up to U+007F: 1 byte, up to U+07FF: 2, up to U+FFFF: 3, above: 4.' }),
        explain: 'U+' + pad(toBase(cp, 16), 4) + ' → <span class="mono hex">' + bytes + '</span> (' + n + ' byte)',
      };
    },
    fracToBin() {
      const opts = [0.5, 0.25, 0.75, 0.125, 0.375, 0.625, 0.875, 0.0625, 0.1875, 0.3125, 0.5625, 0.8125, 0.9375];
      const f = pick(opts);
      let x = f, out = '', steps = [];
      while (x > 0 && out.length < 8) { const y = x * 2; const b = Math.floor(y); steps.push(x + ' × 2 = ' + y + ' → <b>' + b + '</b>'); out += b; x = y - b; }
      return {
        q: t({ tr: num(f, 10) + ' sayısını binary kesir olarak yaz (ör. 0.101).', en: 'Write ' + num(f, 10) + ' as a binary fraction (e.g. 0.101).' }),
        a: '0.' + out, kind: 'text', placeholder: '0.…',
        hint: t({ tr: 'Kesri 2 ile çarp, tam kısmı (0/1) not et, kesirle devam et.', en: 'Multiply the fraction by 2, record the integer part (0/1), continue with the fraction.' }),
        explain: steps.join('<br>') + '<br>→ <b>0.' + out + '</b>',
      };
    },
    binFracToDec() {
      const n = rand(1, 15); const s = pad(n.toString(2), 4).replace(/0+$/, '');
      const val = n / 16;
      return {
        q: t({ tr: num('0.' + s, 2) + ' onlu olarak kaçtır?', en: 'What is ' + num('0.' + s, 2) + ' in decimal?' }),
        a: [String(val), String(val).replace('.', ',')], kind: 'text',
        hint: t({ tr: 'Noktadan sonraki basamaklar ½, ¼, ⅛, 1/16 değerindedir.', en: 'Digits after the point are worth ½, ¼, ⅛, 1/16.' }),
        explain: [...s].map((b, i) => (b === '1' ? '2<sup>−' + (i + 1) + '</sup>' : null)).filter(Boolean).join(' + ') + ' = <b>' + val + '</b>',
      };
    },
    bitwise() {
      const a = rand(0, 255), b = rand(0, 255);
      const ops = [
        ['&', (x, y) => x & y, t({ tr: 'Her iki bit de 1 ise 1.', en: '1 only where both bits are 1.' })],
        ['|', (x, y) => x | y, t({ tr: 'Bitlerden en az biri 1 ise 1.', en: '1 where at least one bit is 1.' })],
        ['^', (x, y) => x ^ y, t({ tr: 'Bitler farklıysa 1.', en: '1 where the bits differ.' })],
      ];
      const [op, f, hint] = pick(ops);
      const useShift = Math.random() < 0.3;
      if (useShift) {
        const k = rand(1, 3), left = Math.random() < 0.5, x = rand(1, 31);
        const r = left ? x << k : x >> k;
        return {
          q: '<code>' + x + (left ? ' &lt;&lt; ' : ' &gt;&gt; ') + k + '</code> ' + t({ tr: 'ifadesinin değeri nedir?', en: 'evaluates to?' }),
          a: String(r), kind: 'dec',
          hint: left ? t({ tr: 'Sola k kaydırma = 2ᵏ ile çarpma.', en: 'Shifting left by k = multiplying by 2ᵏ.' }) : t({ tr: 'Sağa k kaydırma = 2ᵏ’ye bölüp aşağı yuvarlama.', en: 'Shifting right by k = dividing by 2ᵏ and rounding down.' }),
          explain: '<span class="mono">' + x.toString(2) + '</span> → <span class="mono">' + r.toString(2) + '</span> = <b>' + r + '</b>',
        };
      }
      const r = f(a, b);
      return {
        q: '<code>0x' + pad(toBase(a, 16), 2) + ' ' + op + ' 0x' + pad(toBase(b, 16), 2) + '</code> ' + t({ tr: 'sonucu hex olarak nedir?', en: 'in hex?' }),
        a: toBase(r, 16), kind: 'hex',
        hint: hint + ' ' + t({ tr: 'Önce iki sayıyı da 8 bit binary yaz.', en: 'Write both as 8-bit binary first.' }),
        explain: '<span class="mono">' + pad(a.toString(2), 8) + '<br>' + pad(b.toString(2), 8) + ' ' + op + '<br>' + pad(r.toString(2), 8) + '</span> = <b>0x' + pad(toBase(r, 16), 2) + '</b>',
      };
    },
    colorChannel() {
      const r = rand(0, 255), g = rand(0, 255), b = rand(0, 255);
      const hex = '#' + [r, g, b].map((x) => pad(toBase(x, 16), 2)).join('');
      const ch = pick([[0, 'R', { tr: 'kırmızı (R)', en: 'red (R)' }, r], [1, 'G', { tr: 'yeşil (G)', en: 'green (G)' }, g], [2, 'B', { tr: 'mavi (B)', en: 'blue (B)' }, b]]);
      const pair = hex.slice(1 + ch[0] * 2, 3 + ch[0] * 2);
      return {
        q: '<span class="num hex">' + hex + '</span> <span style="display:inline-block;width:1.2em;height:1.2em;border-radius:4px;vertical-align:middle;background:' + hex + ';border:1px solid var(--border)"></span> — ' + t({ tr: 'renginin ' + t(ch[2]) + ' kanalı onlu olarak kaçtır?', en: 'what is the ' + t(ch[2]) + ' channel in decimal?' }),
        a: String(ch[3]), kind: 'dec',
        hint: t({ tr: '#RRGGBB: istenen kanalın iki hex rakamını al ve onluya çevir.', en: '#RRGGBB: take the two hex digits of that channel and convert to decimal.' }),
        explain: '<span class="hex">' + pair + '</span> = ' + parseInt(pair[0], 16) + '×16 + ' + parseInt(pair[1], 16) + ' = <b>' + ch[3] + '</b>',
      };
    },
    rgbToHex() {
      const vals = [0, 51, 102, 128, 153, 204, 255, rand(0, 255)];
      const r = pick(vals), g = pick(vals), b = pick(vals);
      const hex = '#' + [r, g, b].map((x) => pad(toBase(x, 16), 2)).join('');
      return {
        q: '<code>rgb(' + r + ', ' + g + ', ' + b + ')</code> ' + t({ tr: 'renginin hex kodu nedir?', en: 'as a hex color code?' }),
        a: hex, kind: 'color', placeholder: '#RRGGBB',
        hint: t({ tr: 'Her kanalı 2 haneli hex’e çevir (gerekirse başa 0 ekle) ve yan yana yaz.', en: 'Convert each channel to 2-digit hex (pad with 0) and concatenate.' }),
        explain: [r, g, b].map((x) => x + ' → ' + pad(toBase(x, 16), 2)).join(', ') + ' → <b class="hex">' + hex + '</b>',
      };
    },
  };
  window.GEN = G;
})();
