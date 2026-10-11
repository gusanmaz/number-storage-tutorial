/* Bölüm 12 — Kendini sına */
(function () {
  const { t, $, fmt, pad, toBase, pick, tryIt } = NS;
  const any = (...fs) => () => pick(fs)();
  tryIt($('#try'), [
    { label: t({ tr: 'Taban dönüşümü', en: 'Base conversion' }), fn: GEN.anyBase },
    { label: t({ tr: 'Bit ve byte', en: 'Bits and bytes' }), fn: any(GEN.patterns, GEN.maxValue, GEN.bitsNeeded, GEN.units) },
    { label: t({ tr: 'Eksi sayılar', en: 'Negative numbers' }), fn: any(GEN.twosEncode, GEN.twosDecode) },
    { label: t({ tr: 'Kesirler', en: 'Fractions' }), fn: any(GEN.fracToBin, GEN.binFracToDec) },
    { label: t({ tr: 'Metin', en: 'Text' }), fn: any(GEN.asciiCode, GEN.asciiChar, GEN.utf8Bytes) },
    { label: t({ tr: 'Renk', en: 'Color' }), fn: any(GEN.colorChannel, GEN.rgbToHex) },
    { label: t({ tr: 'Bit işlemleri', en: 'Bitwise' }), fn: GEN.bitwise },
  ], { title: t({ tr: 'Karışık', en: 'Mixed' }) });
  const P = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 20, 24, 30, 32];
  $('#pow').innerHTML = P.map((k) => '<span><i>2<sup>' + k + '</sup></i><b>' + fmt(2 ** k) + '</b>' + (k === 10 ? '<small>Ki</small>' : k === 20 ? '<small>Mi</small>' : k === 30 ? '<small>Gi</small>' : '') + '</span>').join('');
  $('#hexgrid').innerHTML = Array.from({ length: 16 }, (_, i) => '<span><i>' + i + '</i><b class="b">' + pad(i.toString(2), 4) + '</b><b class="h">' + toBase(i, 16) + '</b></span>').join('');
  $('#print').addEventListener('click', () => print());
})();
