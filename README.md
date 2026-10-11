# Sıfırlar ve Birler · Zeros & Ones

**Bilgisayar veriyi nasıl saklar?** Bitlerden byte’lara, ikili ve onaltılı sayılardan negatif sayılara, kayan noktadan Unicode’a, renklerden belleğe ve pointer’lara uzanan etkileşimli, iki dilli (Türkçe / English) bir anlatı. Ezber tabloları yerine ampullere dokunarak, metnin içindeki sayıları sürükleyerek ve adım adım çalışan şekillerle öğretir.

**How do computers store data?** An interactive, bilingual (Turkish / English) essay that runs from bits and bytes, binary and hex, through negative numbers, floating point and Unicode, to colors, memory and pointers. Instead of tables to memorize, you tap lamps, drag numbers inside the text and step through figures.

- Türkçe: `docs/index.html`
- English: `docs/en/index.html`

## Bölümler / Chapters

| # | Türkçe | English | Neler var / What’s inside |
|---|--------|---------|---------------------------|
| 1 | `anahtarlar.html` | `en/switches.html` | Bit, 2ⁿ desen, 20 soru oyunu, gürültü ve ikili sistem, mantık kapıları, aynı desenin farklı anlamları / bits, 2ⁿ patterns, 20 questions, noise, logic gates, lenses |
| 2 | `sayma.html` | `en/counting.html` | Patlayan noktalar, ikili sayma, terazi ile dönüşüm, tekrarlı bölme, sekizli ve hex / exploding dots, binary counting, balance, division, octal and hex |
| 3 | `byte.html` | `en/bytes.html` | Byte anatomisi, kaç bit gerekir, taşma, kB/KiB, bit/byte, veri merdiveni / byte anatomy, bits needed, overflow, units |
| 4 | `negatif.html` | `en/negative.html` | İşaret-büyüklük, sayaç, sayı çemberi, ikiye tümleyen, taşma, canlı 2038 saati / two’s complement, number wheel, overflow, live 2038 clock |
| 5 | `kesir.html` | `en/fractions.html` | İkili kesirler, 0,1’in döngüsü, sabit nokta, 8 bitlik oyuncak float, IEEE 754 laboratuvarı, 0.1 + 0.2 / binary fractions, toy float, float lab |
| 6 | `metin.html` | `en/text.html` | ASCII tablosu, kontrol karakterleri ve teleprinter, NUL sonlandırıcı, kod sayfaları, Unicode, UTF-8 kodlayıcı, mojibake / ASCII, escapes, code pages, UTF-8 |
| 7 | `medya.html` | `en/media.html` | RGB ışık karışımı, #RRGGBB, renk derinliği, piksel ızgarası, örnekleme ve dinlenebilir nicemleme / RGB, hex colors, pixels, audible sampling |
| 8 | `bellek.html` | `en/memory.html` | Adresler, aynı byte’ların farklı türleri, endianness, adım adım C programı ve pointer’lar, hex görüntüleyici / addresses, types, endianness, pointers, hex viewer |
| 9 | `kod.html` | `en/code.html` | Sayı sabitleri, dil farkları, bit işlemleri, izin bayrakları, değer ve referans görselleştirici / literals, bitwise ops, flags, references |
| 10 | `pratik.html` | `en/practice.html` | Sınırsız karışık alıştırma ve tek sayfalık özet / unlimited practice and a one-page summary |

Eski sayfa adresleri (ör. `binary.html`, `en/floating-point.html`) yeni bölümlere yönlendirilir. / Old page URLs redirect to the new chapters.

## Yapı / Structure

```
docs/
  *.html              Türkçe sayfalar / Turkish pages
  en/*.html           İngilizce sayfalar / English pages
  assets/site.css     Tasarım (açık + koyu tema) / design (light + dark)
  assets/site.js      İskelet ve bileşenler: başlık, içindekiler, lamps, knob, steps, tryIt, quiz, kod renklendirme
  assets/gen.js       Alıştırma soru üreteçleri / exercise generators
  assets/ch/*.js      Bölüme özel şekiller (iki dil ortak) / per-chapter figures (shared by both languages)
```

Arayüz metinleri `NS.t({ tr: '…', en: '…' })` ile verilir; sayfanın `lang` özniteliğine göre doğru dil seçilir. Bölüm listesi `assets/site.js` içindeki `CHAPTERS` dizisindedir.

UI strings are given as `NS.t({ tr: '…', en: '…' })` and resolved from the page’s `lang` attribute. The chapter list lives in `CHAPTERS` in `assets/site.js`.

## Yerelde çalıştırma / Run locally

Derleme adımı yoktur; `docs/index.html` dosyasını tarayıcıda açman yeterli. / There is no build step; just open `docs/index.html`, or serve the folder:

```sh
python3 -m http.server -d docs 8000
```

## Katkı / Contributing

Hata bulduysan ya da bir fikrin varsa pull request gönderebilirsin. Yeni bir bölüm eklerken hem Türkçe hem İngilizce sayfayı ekleyip `CHAPTERS` dizisini güncelle.

Found a mistake or have an idea? Pull requests are welcome. When adding a chapter, add both the Turkish and the English page and update `CHAPTERS`.
