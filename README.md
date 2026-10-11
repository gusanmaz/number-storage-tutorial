# Sayı Sistemleri · Number Systems

**Bilgisayarlar veriyi nasıl saklar?** Binary ve hex’ten başlayıp negatif sayılar, IEEE 754, metin kodlaması, renkler, ses, bellek, referanslar ve dosyalara kadar uzanan etkileşimli, iki dilli (Türkçe / English) bir ders sitesi.

**How do computers store data?** An interactive, bilingual (Turkish / English) course that starts with binary and hex and goes all the way to negative numbers, IEEE 754, text encoding, colors, sound, memory, references and files.

- Türkçe: `docs/index.html`
- English: `docs/en/index.html`

## Bölümler / Chapters

| # | Türkçe | English | Öne çıkan etkileşim / Highlight |
|---|--------|---------|------------------------------|
| 0 | `index.html` | `en/index.html` | Bir sayı, dört taban / one number in four bases |
| 1 | `taban-kavrami.html` | `en/number-bases.html` | Her tabanda sayaç, adım adım tekrarlı bölme / odometer, step-by-step division |
| 2 | `binary.html` | `en/binary.html` | Bit anahtarları + hedef oyunu, elde ile toplama / bit toggles, target game, carry adder |
| 3 | `hexadecimal.html` | `en/hexadecimal.html` | Nibble gruplayıcı, gerçek hayattan hex / nibble grouper, hex in the wild |
| 4 | `bit-byte.html` | `en/bits-bytes.html` | 2ⁿ ikiye katlanma, KB/KiB disk hesabı / doubling, disk-size calculator |
| 5 | `negatif-sayilar.html` | `en/negative-numbers.html` | İkiye tümleyen, sayı çemberi / two’s complement, number wheel |
| 6 | `ondalikli-sayilar.html` | `en/floating-point.html` | Float laboratuvarı, 0.1 + 0.2 / float lab |
| 7 | `metin-kodlama.html` | `en/text-encoding.html` | ASCII tablosu, UTF-8 kodlayıcı, mojibake |
| 8 | `renkler.html` | `en/colors.html` | RGB karıştırıcı, piksel editörü / RGB mixer, pixel editor |
| 9 | `ses.html` | `en/sound.html` | Örnekleme ve bit derinliği (dinlenebilir) / audible sampling demo |
| 10 | `memory.html` | `en/memory.html` | Bellek simülatörü, pointer izleyici / memory simulator, pointer stepper |
| 11 | `referanslar.html` | `en/references.html` | Python/JS referans izleyici / reference visualizer |
| 12 | `dosyalar.html` | `en/files.html` | Hex görüntüleyici (kendi dosyan), RLE / hex viewer, RLE |
| 13 | `programlama.html` | `en/programming.html` | Bit operatörü oyun alanı / bitwise playground |
| 14 | `pratik.html` | `en/practice.html` | Karma pratik + özet kartı / mixed practice + cheat sheet |

Her bölümde öğrenme hedefleri, etkileşimli görseller, rastgele üretilen alıştırmalar, özet ve test bulunur. İlerleme tarayıcıda saklanır; açık/koyu tema desteklenir.

Every chapter has learning objectives, interactive visualizations, randomly generated exercises, a summary and a quiz. Progress is stored in the browser; light and dark themes are supported.

## Yapı / Structure

```
docs/
  *.html            Türkçe sayfalar / Turkish pages
  en/*.html         İngilizce sayfalar / English pages
  styles.css        Tasarım sistemi / design system (light + dark)
  js/common.js      Sayfa iskeleti, dil/tema, stepper, bits, practice, quiz bileşenleri
  js/generators.js  Alıştırma soru üreteçleri / exercise generators
  js/pages/*.js     Bölüme özel etkileşimler (iki dil ortak) / per-chapter widgets (shared by both languages)
```

Arayüz metinleri `NS.t({ tr: '…', en: '…' })` ile verilir; sayfanın `lang` özniteliğine göre doğru dil seçilir. Bölüm listesi `js/common.js` içindeki `CHAPTERS` dizisindedir.

UI strings are given as `NS.t({ tr: '…', en: '…' })` and resolved from the page’s `lang` attribute. The chapter list lives in `CHAPTERS` in `js/common.js`.

## Yerelde çalıştırma / Run locally

Derleme adımı yoktur; `docs/index.html` dosyasını tarayıcıda açman yeterli. İstersen basit bir sunucu da kullanabilirsin:

There is no build step; just open `docs/index.html` in a browser, or serve the folder:

```sh
python3 -m http.server -d docs 8000
```

## Katkı / Contributing

Hata bulduysan ya da bir fikrin varsa pull request gönderebilirsin. Yeni bir bölüm eklerken hem Türkçe hem İngilizce sayfayı ekleyip `CHAPTERS` dizisini güncelle.

Found a mistake or have an idea? Pull requests are welcome. When adding a chapter, add both the Turkish and English page and update `CHAPTERS`.
