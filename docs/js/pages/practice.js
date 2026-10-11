/* Karma pratik: tüm üreteçler + özet kartı */
(function () {
  const { t, $, pad, toBase } = NS;
  NS.practice($('#practice'), [
    { label: t({ tr: 'Taban dönüşümü', en: 'Base conversion' }), fn: GEN.anyBase },
    { label: t({ tr: 'Binary ↔ hex', en: 'Binary ↔ hex' }), fn: () => (Math.random() < 0.5 ? GEN.binToHex() : GEN.hexToBin()) },
    { label: t({ tr: 'Bit & byte', en: 'Bits & bytes' }), fn: () => [GEN.capacity, GEN.maxValue, GEN.bitsNeeded, GEN.units][Math.floor(Math.random() * 4)]() },
    { label: t({ tr: 'İkiye tümleyen', en: 'Two’s complement' }), fn: () => (Math.random() < 0.5 ? GEN.twosEncode() : GEN.twosDecode()) },
    { label: t({ tr: 'Kesirler', en: 'Fractions' }), fn: () => (Math.random() < 0.5 ? GEN.fracToBin() : GEN.binFracToDec()) },
    { label: t({ tr: 'Metin', en: 'Text' }), fn: () => [GEN.asciiCode, GEN.asciiChar, GEN.utf8Bytes][Math.floor(Math.random() * 3)]() },
    { label: t({ tr: 'Renkler', en: 'Colors' }), fn: () => (Math.random() < 0.5 ? GEN.colorChannel() : GEN.rgbToHex()) },
    { label: t({ tr: 'Bit işlemleri', en: 'Bitwise' }), fn: GEN.bitwise },
  ], { title: t({ tr: 'Sınırsız karışık soru', en: 'Unlimited mixed questions' }) });
  const box = $('#cheat-hex');
  let h = '';
  for (let v = 0; v < 16; v++) h += '<span><b class="hex">' + toBase(v, 16) + '</b> <span class="bin">' + pad(v.toString(2), 4) + '</span> <small>' + v + '</small></span>';
  box.innerHTML = h;
})();
