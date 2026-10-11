/* Bölüm — Dosyalar: hex görüntüleyici (örnek + kendi dosyan), başlık çözümleme, RLE */
(function () {
  const { t, $, $$, el, esc, pad, toBase, fmt, pick, rand } = NS;
  const h2 = (v) => pad(toBase(v, 16), 2);
  const FC = ['#f472b6', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f87171', '#22d3ee', '#fb923c', '#c084fc', '#4ade80'];

  /* ---------- örnek dosyalar ---------- */
  function bmp() {
    const W = 4, H = 2, row = W * 3, size = 54 + row * H;
    const b = new Uint8Array(size), d = new DataView(b.buffer);
    b[0] = 0x42; b[1] = 0x4d; d.setUint32(2, size, true); d.setUint32(10, 54, true);
    d.setUint32(14, 40, true); d.setInt32(18, W, true); d.setInt32(22, H, true); d.setUint16(26, 1, true); d.setUint16(28, 24, true);
    d.setUint32(30, 0, true); d.setUint32(34, row * H, true); d.setInt32(38, 2835, true); d.setInt32(42, 2835, true);
    const top = [[255, 0, 0], [0, 200, 0], [0, 96, 255], [255, 255, 255]], bottom = [[0, 0, 0], [255, 215, 0], [0, 255, 255], [255, 0, 255]];
    [bottom, top].forEach((r, y) => r.forEach(([R, G, B], x) => { const o = 54 + y * row + x * 3; b[o] = B; b[o + 1] = G; b[o + 2] = R; }));
    return b;
  }
  function wav() {
    const N = 32, b = new Uint8Array(44 + N), d = new DataView(b.buffer), w = (o, s) => [...s].forEach((c, i) => (b[o + i] = c.charCodeAt(0)));
    w(0, 'RIFF'); d.setUint32(4, 36 + N, true); w(8, 'WAVE'); w(12, 'fmt '); d.setUint32(16, 16, true); d.setUint16(20, 1, true); d.setUint16(22, 1, true);
    d.setUint32(24, 8000, true); d.setUint32(28, 8000, true); d.setUint16(32, 1, true); d.setUint16(34, 8, true); w(36, 'data'); d.setUint32(40, N, true);
    for (let i = 0; i < N; i++) b[44 + i] = Math.round(128 + 120 * Math.sin(2 * Math.PI * 1000 * i / 8000));
    return b;
  }
  const png = () => Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=='), (c) => c.charCodeAt(0));
  const txt = () => new TextEncoder().encode(t({ tr: 'Merhaba Dünya!\nSatır 2: çğış\n', en: 'Hello, World!\nLine 2: café ☕\n' }));
  const SAMPLES = NS.LANG === 'en' ? [['text.txt', txt], ['image.bmp', bmp], ['sound.wav', wav], ['dot.png', png]] : [['metin.txt', txt], ['resim.bmp', bmp], ['ses.wav', wav], ['nokta.png', png]];

  /* ---------- başlık çözümleyiciler ---------- */
  const u16 = (b, o, le) => new DataView(b.buffer, b.byteOffset).getUint16(o, le);
  const u32 = (b, o, le) => new DataView(b.buffer, b.byteOffset).getUint32(o, le);
  const i32 = (b, o, le) => new DataView(b.buffer, b.byteOffset).getInt32(o, le);
  const asc = (b, o, n) => String.fromCharCode(...b.slice(o, o + n));
  const LE = t({ tr: 'little-endian', en: 'little-endian' }), BE = t({ tr: 'big-endian', en: 'big-endian' });
  function parse(b) {
    if (b.length >= 2 && b[0] === 0x42 && b[1] === 0x4d && b.length >= 54) {
      const f = [
        [0, 2, t({ tr: 'İmza', en: 'Signature' }), '"BM"'],
        [2, 4, t({ tr: 'Dosya boyutu', en: 'File size' }), fmt(u32(b, 2, true)) + ' byte (' + LE + ')'],
        [6, 4, t({ tr: 'Ayrılmış', en: 'Reserved' }), '0'],
        [10, 4, t({ tr: 'Piksel verisinin başladığı yer', en: 'Pixel data offset' }), u32(b, 10, true) + ' (0x' + toBase(u32(b, 10, true), 16) + ')'],
        [14, 4, t({ tr: 'Bilgi başlığı boyutu', en: 'Info header size' }), u32(b, 14, true)],
        [18, 4, t({ tr: 'Genişlik', en: 'Width' }), i32(b, 18, true) + ' px'],
        [22, 4, t({ tr: 'Yükseklik', en: 'Height' }), i32(b, 22, true) + ' px ' + t({ tr: '(pozitif = satırlar aşağıdan yukarı)', en: '(positive = rows bottom-up)' })],
        [26, 2, t({ tr: 'Düzlem', en: 'Planes' }), u16(b, 26, true)],
        [28, 2, t({ tr: 'Piksel başına bit', en: 'Bits per pixel' }), u16(b, 28, true)],
        [30, 4, t({ tr: 'Sıkıştırma', en: 'Compression' }), u32(b, 30, true) === 0 ? t({ tr: '0 = yok', en: '0 = none' }) : u32(b, 30, true)],
        [34, 4, t({ tr: 'Görüntü verisi boyutu', en: 'Image data size' }), fmt(u32(b, 34, true)) + ' byte'],
        [38, 8, t({ tr: 'Çözünürlük (piksel/metre)', en: 'Resolution (px/m)' }), i32(b, 38, true) + ' × ' + i32(b, 42, true)],
        [46, 8, t({ tr: 'Palet bilgisi', en: 'Palette info' }), '0'],
      ];
      const off = u32(b, 10, true), bpp = u16(b, 28, true), Wd = i32(b, 18, true);
      if (bpp === 24 && off < b.length) {
        const row = Math.ceil(Wd * 3 / 4) * 4;
        for (let o = off, k = 0; o + 3 <= Math.min(b.length, off + row * 2) && k < 8; o += 3, k++) f.push([o, 3, t({ tr: 'Piksel (B, G, R)', en: 'Pixel (B, G, R)' }), '<span class="sw-dot" style="background:rgb(' + b[o + 2] + ',' + b[o + 1] + ',' + b[o] + ')"></span> rgb(' + b[o + 2] + ', ' + b[o + 1] + ', ' + b[o] + ')']);
      }
      return { type: 'BMP', desc: t({ tr: 'Windows bitmap görüntüsü (sıkıştırılmamış)', en: 'Windows bitmap image (uncompressed)' }), fields: f };
    }
    if (b.length >= 12 && asc(b, 0, 4) === 'RIFF' && asc(b, 8, 4) === 'WAVE') {
      const f = [[0, 4, t({ tr: 'İmza', en: 'Signature' }), '"RIFF"'], [4, 4, t({ tr: 'Kalan boyut', en: 'Remaining size' }), fmt(u32(b, 4, true)) + ' (' + LE + ')'], [8, 4, t({ tr: 'Biçim', en: 'Format' }), '"WAVE"']];
      if (b.length >= 44 && asc(b, 12, 4) === 'fmt ') {
        f.push([12, 4, t({ tr: 'Bölüm', en: 'Chunk' }), '"fmt "'], [16, 4, t({ tr: 'Bölüm boyutu', en: 'Chunk size' }), u32(b, 16, true)],
          [20, 2, t({ tr: 'Ses biçimi', en: 'Audio format' }), u16(b, 20, true) === 1 ? '1 = PCM' : u16(b, 20, true)], [22, 2, t({ tr: 'Kanal', en: 'Channels' }), u16(b, 22, true)],
          [24, 4, t({ tr: 'Örnekleme hızı', en: 'Sample rate' }), fmt(u32(b, 24, true)) + ' Hz'], [28, 4, t({ tr: 'Saniyede byte', en: 'Bytes per second' }), fmt(u32(b, 28, true))],
          [32, 2, t({ tr: 'Örnek başına byte', en: 'Block align' }), u16(b, 32, true)], [34, 2, t({ tr: 'Bit derinliği', en: 'Bits per sample' }), u16(b, 34, true)]);
        if (asc(b, 36, 4) === 'data') { f.push([36, 4, t({ tr: 'Bölüm', en: 'Chunk' }), '"data"'], [40, 4, t({ tr: 'Ses verisi boyutu', en: 'Audio data size' }), fmt(u32(b, 40, true)) + ' byte']); f.push([44, Math.min(b.length - 44, 32), t({ tr: 'Ses örnekleri', en: 'Audio samples' }), t({ tr: '8 bit işaretsiz: 128 = sessizlik', en: '8-bit unsigned: 128 = silence' })]); }
      }
      return { type: 'WAV', desc: t({ tr: 'Sıkıştırılmamış ses (PCM)', en: 'Uncompressed audio (PCM)' }), fields: f };
    }
    if (b.length >= 8 && b[0] === 0x89 && asc(b, 1, 3) === 'PNG') {
      const f = [[0, 8, t({ tr: 'İmza', en: 'Signature' }), '89 "PNG" CR LF 1A LF']];
      let o = 8;
      while (o + 8 <= b.length && f.length < 14) {
        const len = u32(b, o, false), type = asc(b, o + 4, 4);
        f.push([o, 4, t({ tr: 'Bölüm uzunluğu', en: 'Chunk length' }), len + ' (' + BE + '!)'], [o + 4, 4, t({ tr: 'Bölüm türü', en: 'Chunk type' }), '"' + type + '"']);
        if (type === 'IHDR' && o + 21 <= b.length) {
          f.push([o + 8, 4, t({ tr: 'Genişlik', en: 'Width' }), u32(b, o + 8, false) + ' px'], [o + 12, 4, t({ tr: 'Yükseklik', en: 'Height' }), u32(b, o + 12, false) + ' px'],
            [o + 16, 1, t({ tr: 'Bit derinliği', en: 'Bit depth' }), b[o + 16]], [o + 17, 1, t({ tr: 'Renk türü', en: 'Color type' }), b[o + 17] + ({ 2: ' = RGB', 6: ' = RGBA', 0: ' = gri', 3: ' = palet' }[b[o + 17]] || '')], [o + 18, 3, t({ tr: 'Sıkıştırma/filtre/geçişli', en: 'Compression/filter/interlace' }), b[o + 18] + ' / ' + b[o + 19] + ' / ' + b[o + 20]]);
        } else if (len > 0 && o + 8 + len <= b.length) f.push([o + 8, Math.min(len, 64), type === 'IDAT' ? t({ tr: 'Sıkıştırılmış piksel verisi (zlib)', en: 'Compressed pixel data (zlib)' }) : t({ tr: 'Bölüm verisi', en: 'Chunk data' }), len + ' byte']);
        if (o + 12 + len <= b.length) f.push([o + 8 + len, 4, 'CRC', t({ tr: 'hata denetim kodu', en: 'checksum' })]);
        o += 12 + len;
        if (type === 'IEND') break;
      }
      return { type: 'PNG', desc: t({ tr: 'PNG görüntüsü (kayıpsız sıkıştırılmış)', en: 'PNG image (lossless compressed)' }), fields: f };
    }
    const SIGS = [[[0xff, 0xd8, 0xff], 'JPEG', { tr: 'JPEG fotoğraf', en: 'JPEG photo' }], [[0x25, 0x50, 0x44, 0x46], 'PDF', { tr: 'PDF belgesi', en: 'PDF document' }], [[0x50, 0x4b, 0x03, 0x04], 'ZIP', { tr: 'ZIP arşivi (DOCX/XLSX/PPTX/JAR/APK de olabilir)', en: 'ZIP archive (could also be DOCX/XLSX/PPTX/JAR/APK)' }],
      [[0x47, 0x49, 0x46, 0x38], 'GIF', { tr: 'GIF görüntüsü', en: 'GIF image' }], [[0x49, 0x44, 0x33], 'MP3', { tr: 'MP3 (ID3 etiketli)', en: 'MP3 (with ID3 tag)' }], [[0x4d, 0x5a], 'EXE', { tr: 'Windows programı', en: 'Windows executable' }],
      [[0x7f, 0x45, 0x4c, 0x46], 'ELF', { tr: 'Linux programı', en: 'Linux executable' }], [[0x1f, 0x8b], 'GZIP', { tr: 'gzip sıkıştırılmış dosya', en: 'gzip-compressed file' }], [[0xef, 0xbb, 0xbf], 'UTF-8 BOM', { tr: 'BOM ile başlayan UTF-8 metin', en: 'UTF-8 text with BOM' }]];
    for (const [sig, ty, d] of SIGS) if (sig.every((x, i) => b[i] === x)) return { type: ty, desc: t(d), fields: [[0, sig.length, t({ tr: 'İmza', en: 'Signature' }), sig.map(h2).join(' ')]] };
    // metin mi?
    const sample = b.slice(0, 512);
    let printable = true;
    try { new TextDecoder('utf-8', { fatal: true }).decode(sample.length === b.length ? sample : sample.slice(0, Math.max(0, sample.length - 4))); } catch (e) { printable = false; }
    if (printable && sample.every((x) => x >= 9 && x !== 11 && x !== 12 && (x < 14 || x > 31) && x !== 127)) {
      const f = [];
      const nl = []; sample.forEach((x, i) => { if (x === 10) nl.push(i); });
      nl.slice(0, 6).forEach((i) => f.push([i, 1, t({ tr: 'Satır sonu', en: 'Newline' }), '\\n (LF, 0x0A)' + (sample[i - 1] === 13 ? ' · CR LF (Windows)' : '')]));
      const multi = []; for (let i = 0; i < sample.length && multi.length < 6; i++) if (sample[i] >= 0xc0) { const n = sample[i] >= 0xf0 ? 4 : sample[i] >= 0xe0 ? 3 : 2; multi.push([i, n, t({ tr: 'UTF-8 çok byte’lı karakter', en: 'UTF-8 multi-byte character' }), '"' + new TextDecoder().decode(sample.slice(i, i + n)) + '"']); i += n - 1; }
      return { type: 'TEXT', desc: t({ tr: 'Metin dosyası (UTF-8)', en: 'Text file (UTF-8)' }), fields: f.concat(multi).sort((a, c) => a[0] - c[0]) };
    }
    return { type: '?', desc: t({ tr: 'Tanınmayan ikili dosya', en: 'Unrecognised binary file' }), fields: [] };
  }

  /* ---------- hex görüntüleyici ---------- */
  const dump = $('#hv-dump'), info = $('#hv-info'), fieldsBox = $('#hv-fields');
  let cur = null, P = null, owner = [];
  function show(bytes, name, total) {
    cur = bytes.slice(0, 512); P = parse(bytes);
    owner = new Array(cur.length).fill(-1);
    P.fields.forEach(([s, n], i) => { for (let k = s; k < s + n && k < cur.length; k++) owner[k] = i; });
    $('#hv-name').textContent = name + ' · ' + fmt(total) + ' byte';
    $('#hv-type').innerHTML = '<span class="badge">' + esc(P.type) + '</span> ' + esc(P.desc);
    let h = '<div class="hd-row hd-head"><span class="hd-off">offset</span><span class="hd-hex">' + Array.from({ length: 16 }, (_, i) => '<span>' + h2(i) + '</span>').join('') + '</span><span class="hd-asc">ASCII</span></div>';
    for (let r = 0; r < cur.length; r += 16) {
      let hx = '', as = '';
      for (let c = 0; c < 16; c++) {
        const o = r + c;
        if (o >= cur.length) { hx += '<span class="hb empty"></span>'; continue; }
        const v = cur[o], fi = owner[o], st = fi >= 0 ? ' style="--fc:' + FC[fi % FC.length] + '"' : '';
        hx += '<span class="hb' + (fi >= 0 ? ' f' : '') + (v === 0 ? ' z' : '') + '" data-o="' + o + '"' + st + '>' + h2(v) + '</span>';
        as += '<span class="ha' + (fi >= 0 ? ' f' : '') + '" data-o="' + o + '"' + st + '>' + (v >= 32 && v < 127 ? esc(String.fromCharCode(v)) : '.') + '</span>';
      }
      h += '<div class="hd-row"><span class="hd-off">' + pad(toBase(r, 16), 4) + '</span><span class="hd-hex">' + hx + '</span><span class="hd-asc">' + as + '</span></div>';
    }
    if (total > cur.length) h += '<div class="muted center" style="padding:.4rem">… ' + t({ tr: 've ' + fmt(total - cur.length) + ' byte daha', en: 'and ' + fmt(total - cur.length) + ' more bytes' }) + '</div>';
    dump.innerHTML = h;
    $$('[data-o]', dump).forEach((x) => x.addEventListener('mouseenter', () => hover(+x.dataset.o)));
    dump.addEventListener('mouseleave', () => hover(-1));
    fieldsBox.innerHTML = P.fields.length ? '<div class="table-wrap"><table class="compact"><thead><tr><th>Offset</th><th>' + t({ tr: 'Byte', en: 'Bytes' }) + '</th><th>' + t({ tr: 'Alan', en: 'Field' }) + '</th><th>' + t({ tr: 'Anlamı', en: 'Meaning' }) + '</th></tr></thead><tbody>' +
      P.fields.map(([s, n, l, v], i) => '<tr data-f="' + i + '"><td class="m"><span class="vdot" style="background:' + FC[i % FC.length] + '"></span> ' + s + '</td><td class="m hex">' + Array.from(cur.slice(s, s + Math.min(n, 8))).map(h2).join(' ') + (n > 8 ? ' …' : '') + '</td><td>' + esc(l) + '</td><td class="m">' + v + '</td></tr>').join('') + '</tbody></table></div>' : '';
    $$('#hv-fields tr[data-f]').forEach((tr) => { tr.addEventListener('mouseenter', () => hover(P.fields[+tr.dataset.f][0])); tr.addEventListener('mouseleave', () => hover(-1)); });
    info.innerHTML = t({ tr: 'Bir byte’ın üzerine gel.', en: 'Hover over a byte.' });
  }
  function hover(o) {
    const fi = o >= 0 ? owner[o] : -1;
    $$('[data-o]', dump).forEach((x) => { const xo = +x.dataset.o; x.classList.toggle('hl', fi >= 0 ? owner[xo] === fi : xo === o); x.classList.toggle('cur', xo === o); });
    $$('#hv-fields tr[data-f]').forEach((tr) => tr.classList.toggle('sel', +tr.dataset.f === fi));
    if (o < 0) return;
    const v = cur[o];
    info.innerHTML = 'offset <b class="mono">' + o + '</b> (0x' + toBase(o, 16) + '): <b class="hex mono">' + h2(v) + '</b> = ' + v + (v >= 32 && v < 127 ? " = '" + esc(String.fromCharCode(v)) + "'" : '') + (fi >= 0 ? ' · <b>' + esc(P.fields[fi][2]) + '</b>: ' + P.fields[fi][3] : '');
  }
  SAMPLES.forEach(([n, f], i) => {
    const b = el('button', { type: 'button', class: 'chip' + (i === 1 ? ' on' : ''), text: n });
    b.addEventListener('click', () => { $$('#hv-samples .chip').forEach((x) => x.classList.toggle('on', x === b)); const by = f(); show(by, n, by.length); });
    $('#hv-samples').append(b);
  });
  $('#hv-file').addEventListener('change', async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const buf = new Uint8Array(await file.slice(0, 4096).arrayBuffer());
    $$('#hv-samples .chip').forEach((x) => x.classList.remove('on'));
    show(buf, file.name, file.size);
  });
  { const by = bmp(); show(by, SAMPLES[1][0], by.length); }

  /* ---------- RLE ---------- */
  const rin = $('#rle-in');
  [['AAAAAAAABBBCCCCCCCCCCCCD', 'AAAAAAAABBB…'], ['WWWWWWWWWWBBWWWWWWWWWWWW', t({ tr: 'piksel satırı', en: 'pixel row' })], ['ABCDEFGH', 'ABCDEFGH'], ['Merhaba', 'Merhaba']].forEach(([v, l]) => {
    const b = el('button', { type: 'button', class: 'btn ghost sm mono', text: l });
    b.addEventListener('click', () => { rin.value = v; rle(); });
    $('#rle-presets').append(b);
  });
  function runs(s) { const out = []; for (const ch of s) { const last = out[out.length - 1]; if (last && last[1] === ch && last[0] < 255) last[0]++; else out.push([1, ch]); } return out; }
  function rle() {
    const s = rin.value, R = runs(s);
    $('#rle-runs').innerHTML = R.slice(0, 40).map(([n, c], i) => '<span class="run fade-up" style="--fc:' + FC[i % FC.length] + ';animation-delay:' + i * 30 + 'ms"><b>' + n + '</b>×<span class="mono">' + esc(c === ' ' ? '␣' : c) + '</span></span>').join('') + (R.length > 40 ? ' …' : '');
    const enc = R.map(([n, c]) => n + c).join('');
    const orig = new TextEncoder().encode(s).length, packed = R.length * 2;
    $('#rle-stats').innerHTML =
      '<div class="stat"><div class="stat-label">' + t({ tr: 'Orijinal', en: 'Original' }) + '</div><div class="stat-value">' + orig + ' B</div></div>' +
      '<div class="stat"><div class="stat-label">' + t({ tr: 'RLE (sayı + değer)', en: 'RLE (count + value)' }) + '</div><div class="stat-value hex">' + packed + ' B</div></div>' +
      '<div class="stat"><div class="stat-label">' + t({ tr: 'Yazılışı', en: 'Encoded' }) + '</div><div class="stat-value" style="font-size:.9rem">' + esc(enc.length > 40 ? enc.slice(0, 40) + '…' : enc) + '</div></div>' +
      '<div class="stat"><div class="stat-label">' + t({ tr: 'Oran', en: 'Ratio' }) + '</div><div class="stat-value ' + (packed < orig ? 'ok-text' : 'bad') + '">%' + (orig ? Math.round(100 * packed / orig) : 0) + '</div></div>';
    const m = $('#rle-msg');
    if (!s) { m.hidden = true; return; }
    m.hidden = false;
    m.className = 'msg ' + (packed < orig ? 'good' : 'bad');
    m.innerHTML = packed < orig
      ? t({ tr: 'Tekrar çok olduğu için veri küçüldü. Logolar, ekran görüntüleri ve çizimler gibi düz renkli alanı bol görüntüler böyle iyi sıkışır.', en: 'Lots of repetition, so the data shrank. Images with flat colors (logos, screenshots, drawings) compress like this.' })
      : t({ tr: 'Tekrar olmadığı için RLE veriyi <b>büyüttü</b>! Her sıkıştırma yöntemi her veride işe yaramaz.', en: 'With no repetition RLE made the data <b>bigger</b>! No compression method works on every input.' });
  }
  rin.addEventListener('input', rle);
  rle();

  /* ---------- alıştırma ---------- */
  const MAGIC = [['89 50 4E 47', 'PNG'], ['FF D8 FF', 'JPEG'], ['25 50 44 46', 'PDF'], ['50 4B 03 04', 'ZIP'], ['47 49 46 38', 'GIF'], ['42 4D', 'BMP'], ['4D 5A', 'EXE'], ['7F 45 4C 46', 'ELF']];
  const magicQ = () => {
    const [sig, ty] = pick(MAGIC);
    const chars = sig.split(' ').map((x) => parseInt(x, 16)).map((v) => (v >= 32 && v < 127 ? String.fromCharCode(v) : '.')).join('');
    return { q: t({ tr: 'Bir dosya <span class="hex mono">' + sig + '</span> ile başlıyor. Türü nedir? (ör. PNG)', en: 'A file starts with <span class="hex mono">' + sig + '</span>. What type is it? (e.g. PNG)' }), a: ty === 'JPEG' ? ['JPEG', 'JPG'] : ty === 'EXE' ? ['EXE', 'MZ'] : [ty], kind: 'hex', hint: t({ tr: 'Byte’ları ASCII’ye çevir: ', en: 'Convert the bytes to ASCII: ' }) + '<code>' + esc(chars) + '</code>', explain: sig + ' → "' + esc(chars) + '" → <b>' + ty + '</b>' };
  };
  const rleQ = () => {
    let s = ''; const k = rand(2, 4); for (let i = 0; i < k; i++) s += pick('ABWX').repeat(rand(1, 6));
    const R = runs(s).map(([n, c]) => n + c).join('');
    return { q: '<code>' + s + '</code> ' + t({ tr: 'verisinin RLE karşılığı nedir? (ör. 3A2B)', en: 'in RLE? (e.g. 3A2B)' }), a: R, kind: 'hex', hint: t({ tr: 'Art arda gelen aynı harfleri say.', en: 'Count runs of the same letter.' }), explain: '<b>' + R + '</b>' };
  };
  const leQ = () => {
    const v = rand(16, 4000), b = [v & 255, (v >> 8) & 255, 0, 0];
    return { q: t({ tr: 'Bir BMP başlığında genişlik alanı <span class="hex mono">' + b.map(h2).join(' ') + '</span> (little-endian). Genişlik kaç piksel?', en: 'A BMP width field reads <span class="hex mono">' + b.map(h2).join(' ') + '</span> (little-endian). How many pixels wide?' }), a: String(v), kind: 'dec', hint: t({ tr: 'Byte’ları ters çevir: 0x0000' + h2(b[1]) + h2(b[0]), en: 'Reverse the bytes: 0x0000' + h2(b[1]) + h2(b[0]) }), explain: '0x' + h2(b[1]) + h2(b[0]) + ' = ' + b[1] + ' × 256 + ' + b[0] + ' = <b>' + v + '</b>' };
  };
  NS.practice($('#practice'), [
    { label: t({ tr: 'Dosya imzası', en: 'File signature' }), fn: magicQ },
    { label: 'RLE', fn: rleQ },
    { label: t({ tr: 'Başlık okuma', en: 'Reading headers' }), fn: leQ },
  ]);
})();
