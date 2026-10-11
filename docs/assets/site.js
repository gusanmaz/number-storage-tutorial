/* ============================================================================
   Sıfırlar ve Birler — çekirdek
   - Başlık, içindekiler, bölüm sonu, okuma ilerlemesi
   - Bileşenler: lamps (bitler), knob (metin içi sayı), tryIt (alıştırma),
     quiz (test), steps (adım gezgini), kod renklendirme
   Tüm arayüz metinleri NS.t({ tr, en }) ile verilir.
   ========================================================================== */
(function () {
  'use strict';
  const root = document.documentElement;
  const LANG = root.lang === 'en' ? 'en' : 'tr';
  const t = (o) => (o == null ? '' : typeof o === 'string' ? o : o[LANG] != null ? o[LANG] : o.tr);

  const CHAPTERS = [
    { id: 'cover', tr: 'index.html', en: 'index.html', title: { tr: 'Kapak', en: 'Cover' } },
    { id: 'switches', tr: 'anahtarlar.html', en: 'switches.html', title: { tr: 'Bir anahtar, iki dünya', en: 'One switch, two worlds' }, desc: { tr: 'Bit nedir, neden iki durum, bir bit ne kadar bilgi taşır? Aynı desen neden farklı şeyler anlatır?', en: 'What is a bit, why two states, how much information is in a bit? Why does one pattern mean different things?' } },
    { id: 'counting', tr: 'sayma.html', en: 'counting.html', title: { tr: 'Saymanın gizli düzeni', en: 'The hidden order of counting' }, desc: { tr: 'Basamak değeri, patlayan noktalar, binary, terazi ile dönüşüm, sekizli ve onaltılı.', en: 'Place value, exploding dots, binary, converting with a balance, octal and hex.' } },
    { id: 'bytes', tr: 'byte.html', en: 'bytes.html', title: { tr: 'Byte’lar ve bilginin ölçüsü', en: 'Bytes and the measure of information' }, desc: { tr: '8 bit neden bir byte? Kaç bit gerekir? KB mı KiB mi? Bir terabayt ne kadar büyük?', en: 'Why is a byte 8 bits? How many bits do you need? KB or KiB? How big is a terabyte?' } },
    { id: 'negative', tr: 'negatif.html', en: 'negative.html', title: { tr: 'Saat kadranında eksi sayılar', en: 'Negative numbers on a clock face' }, desc: { tr: 'Geri sarılan sayaç, ikiye tümleyen, sayı çemberi ve sessiz taşmalar.', en: 'A rolling-back odometer, two’s complement, the number wheel and silent overflow.' } },
    { id: 'fractions', tr: 'kesir.html', en: 'fractions.html', title: { tr: 'Noktanın yeri: kesirli sayılar', en: 'Where the point goes: fractions' }, desc: { tr: 'Binary kesirler, sonsuz 0,1, oyuncak float ile sayı doğrusundaki boşluklar, IEEE 754.', en: 'Binary fractions, the infinite 0.1, gaps on the number line with a toy float, IEEE 754.' } },
    { id: 'text', tr: 'metin.html', en: 'text.html', title: { tr: 'Harflere numara vermek', en: 'Giving letters numbers' }, desc: { tr: 'Mors’tan ASCII’ye, kod sayfalarının kaosu, Unicode ve UTF-8, bozulan karakterler.', en: 'From Morse to ASCII, code-page chaos, Unicode and UTF-8, garbled characters.' } },
    { id: 'media', tr: 'medya.html', en: 'media.html', title: { tr: 'Renk, resim ve ses', en: 'Color, image and sound' }, desc: { tr: 'Üç ışıkla renk, #RRGGBB, piksellerin byte’ları, sesi örneklemek ve dinlemek.', en: 'Color from three lights, #RRGGBB, the bytes of pixels, sampling and hearing sound.' } },
    { id: 'memory', tr: 'bellek.html', en: 'memory.html', title: { tr: 'Bellek: uzun bir byte şeridi', en: 'Memory: one long strip of bytes' }, desc: { tr: 'Adresler, aynı byte’ları farklı okumak, byte sırası, değişkenler, diziler, pointer’lar, dosyalar.', en: 'Addresses, reading the same bytes differently, byte order, variables, arrays, pointers, files.' } },
    { id: 'code', tr: 'kod.html', en: 'code.html', title: { tr: 'Kodda bitler ve referanslar', en: 'Bits and references in code' }, desc: { tr: 'Python ve JavaScript’te sayı yazımı, bit işlemleri, maskeler, değer ve referans.', en: 'Number literals in Python and JavaScript, bitwise operations, masks, values and references.' } },
    { id: 'practice', tr: 'pratik.html', en: 'practice.html', title: { tr: 'Kendini sına', en: 'Test yourself' }, desc: { tr: 'Tüm bölümlerden sınırsız soru ve tek sayfalık özet.', en: 'Unlimited questions from every chapter and a one-page summary.' } },
  ];
  const UI = {
    contents: { tr: 'İçindekiler', en: 'Contents' }, close: { tr: 'Kapat', en: 'Close' },
    theme: { tr: 'Gece/gündüz', en: 'Night/day' }, chapter: { tr: 'Bölüm', en: 'Chapter' },
    site: { tr: 'Sıfırlar ve Birler', en: 'Zeros & Ones' },
    tagline: { tr: 'Bilgisayar veriyi nasıl saklar? Etkileşimli bir anlatı.', en: 'How do computers store data? An interactive essay.' },
    next: { tr: 'Sıradaki bölüm', en: 'Next chapter' }, prev: { tr: 'Önceki', en: 'Previous' },
    read: { tr: 'okundu', en: 'read' },
    contrib: { tr: 'Bir hata mı buldun? Katkıya açık:', en: 'Found a mistake? Contributions welcome:' },
  };

  /* ---------- yardımcılar ---------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  function el(tag, attrs, kids) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v; else if (k === 'text') e.textContent = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v);
    }
    if (kids) [].concat(kids).forEach((c) => c != null && e.append(c.nodeType ? c : document.createTextNode(c)));
    return e;
  }
  const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const locale = LANG === 'en' ? 'en-US' : 'tr-TR';
  const fmt = (n, d) => Number(n).toLocaleString(locale, d != null ? { maximumFractionDigits: d } : undefined);
  const pad = (s, n, c) => String(s).padStart(n, c == null ? '0' : c);
  const toBase = (n, b) => Number(n).toString(b).toUpperCase();
  const group = (s, n, sep) => { s = String(s); const o = []; for (let i = s.length; i > 0; i -= n) o.unshift(s.slice(Math.max(0, i - n), i)); return o.join(sep == null ? ' ' : sep); };
  const bitsOf = (v, n) => Array.from({ length: n }, (_, i) => Math.floor(v / Math.pow(2, n - 1 - i)) % 2);
  const valOf = (bits) => bits.reduce((a, b) => a * 2 + b, 0);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* gizli mod */ } },
  };
  const human = (b) => { const u = ['B', 'KiB', 'MiB', 'GiB', 'TiB']; let i = 0; while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; } return fmt(b, 2) + ' ' + u[i]; };

  /* ---------- iskelet ---------- */
  function chrome() {
    const id = document.body.dataset.chapter;
    const idx = CHAPTERS.findIndex((c) => c.id === id);
    const ch = CHAPTERS[idx];
    const otherHref = ch ? (LANG === 'tr' ? 'en/' + ch.en : '../' + ch.tr) : '#';
    const markBits = Array.from({ length: 4 }, (_, i) => ((Math.max(idx, 0) >> (3 - i)) & 1));

    const head = el('header', { class: 'head' });
    head.innerHTML =
      '<a class="brand" href="index.html" aria-label="' + esc(t(UI.site)) + '"><span class="brand-mark" title="' + esc(t(UI.chapter)) + ' ' + idx + ' = ' + markBits.join('') + '₂">' + markBits.map((b) => '<i class="' + (b ? 'on' : '') + '"></i>').join('') + '</span><span class="brand-text">' + esc(t(UI.site)) + '</span></a>' +
      '<div class="head-chapter">' + (ch && idx > 0 ? esc(t(UI.chapter)) + ' ' + idx + ' · ' + esc(t(ch.title)) : '') + '</div>' +
      '<div class="head-tools">' +
      '<span class="lang" role="group" aria-label="Language"><a href="' + (LANG === 'tr' ? '#' : otherHref) + '" lang="tr"' + (LANG === 'tr' ? ' aria-current="true"' : '') + '>TR</a><a href="' + (LANG === 'en' ? '#' : otherHref) + '" lang="en"' + (LANG === 'en' ? ' aria-current="true"' : '') + '>EN</a></span>' +
      '<button class="hbtn theme" type="button" aria-label="' + esc(t(UI.theme)) + '" title="' + esc(t(UI.theme)) + '"><svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><path d="M15.5 12.8A6.5 6.5 0 0 1 7.2 4.5a6.5 6.5 0 1 0 8.3 8.3z" fill="currentColor"/></svg></button>' +
      '<button class="hbtn menu" type="button" aria-expanded="false" aria-controls="toc"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><span class="lbl">' + esc(t(UI.contents)) + '</span></button>' +
      '</div><div class="readbar"></div>';
    document.body.prepend(head);

    const read = store.get('zo-read', {});
    const toc = el('nav', { class: 'toc', id: 'toc', 'aria-label': t(UI.contents) });
    toc.innerHTML = '<button class="hbtn menu toc-close" type="button">' + esc(t(UI.close)) + ' ✕</button><div class="toc-inner"><h2>' + esc(t(UI.site)) + '</h2><p class="toc-sub">' + esc(t(UI.tagline)) + '</p><ol>' +
      CHAPTERS.slice(1).map((c, i) => '<li><a href="' + c[LANG] + '"' + (c.id === id ? ' aria-current="page"' : '') + '><span class="toc-n">' + pad(i + 1, 2) + '</span><span class="toc-t">' + esc(t(c.title)) + (read[c.id] ? '<span class="toc-read">✓ ' + esc(t(UI.read)) + '</span>' : '') + '</span><span class="toc-d">' + esc(t(c.desc)) + '</span></a></li>').join('') + '</ol></div>';
    document.body.append(toc);
    const menuBtn = $('.head .menu');
    const setMenu = (open) => { toc.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', String(open)); document.body.style.overflow = open ? 'hidden' : ''; if (open) $('.toc-close').focus(); };
    menuBtn.addEventListener('click', () => setMenu(true));
    $('.toc-close').addEventListener('click', () => setMenu(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
    $('.head .theme').addEventListener('click', () => {
      const dark = root.dataset.theme !== 'dark';
      if (dark) root.dataset.theme = 'dark'; else delete root.dataset.theme;
      try { localStorage.setItem('zo-theme', dark ? 'dark' : 'light'); } catch (e) { /* */ }
    });
    $$('.lang a[aria-current]').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));

    // bölüm açılışındaki numara bitleri
    $$('.opener .kicker .bits').forEach((b) => { b.innerHTML = markBits.map((x) => '<i class="' + (x ? 'on' : '') + '"></i>').join(''); });

    // bölüm sonu
    const main = $('main');
    if (ch && idx > 0) {
      const next = CHAPTERS[idx + 1], prev = CHAPTERS[idx - 1];
      const end = el('section', { class: 'end' });
      end.innerHTML = (next ? '<a class="end-next" href="' + next[LANG] + '"><small>' + esc(t(UI.next)) + ' · ' + pad(idx + 1, 2) + '</small><span>' + esc(t(next.title)) + '</span><p>' + esc(t(next.desc)) + '</p></a>' : '') +
        (prev ? '<div class="end-prev">← ' + esc(t(UI.prev)) + ': <a href="' + prev[LANG] + '">' + esc(t(prev.title)) + '</a></div>' : '');
      main.append(end);
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((en) => { if (en.some((x) => x.isIntersecting)) { const r = store.get('zo-read', {}); r[id] = true; store.set('zo-read', r); io.disconnect(); } });
        io.observe(end);
      }
    }
    const foot = el('footer', { class: 'foot' });
    foot.innerHTML = '<span>' + esc(t(UI.site)) + ' — ' + esc(t(UI.tagline)) + '</span><span>' + esc(t(UI.contrib)) + ' <a href="https://github.com/gusanmaz/number-storage-tutorial" target="_blank" rel="noopener noreferrer">github.com/gusanmaz/number-storage-tutorial</a></span>';
    main.after(foot);

    // okuma çubuğu
    const bar = $('.readbar');
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      bar.style.width = (h > 0 ? (100 * scrollY / h) : 0) + '%';
      head.classList.toggle('scrolled', scrollY > 220);
    };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  /* ---------- ampuller ---------- */
  /**
   * lamps(container, { n, value | bits, weight(i) → string, group, gaps:[i], ro, size, cls(i), text: bool, onChange(bits, i) })
   * bits[0] = en soldaki (en anlamlı) bit.
   */
  function lamps(container, o) {
    const n = o.n || 8;
    let bits = o.bits ? o.bits.slice() : bitsOf(o.value || 0, n);
    const row = el('div', { class: 'lamps' + (o.size ? ' ' + o.size : ''), role: 'group', 'aria-label': o.label || 'bits' });
    const btns = [];
    for (let i = 0; i < n; i++) {
      if ((o.gaps && o.gaps.includes(i)) || (o.group && i > 0 && (n - i) % o.group === 0)) row.append(el('span', { class: 'gap', 'aria-hidden': 'true' }));
      const b = el('button', { type: 'button', class: 'lamp' + (o.ro ? ' ro' : '') + (o.cls ? ' ' + o.cls(i) : ''), 'aria-pressed': 'false' });
      b.innerHTML = '<span class="bulb"></span><span class="w">' + (o.weight ? o.weight(i) : '') + '</span>';
      if (o.ro) b.tabIndex = -1;
      else b.addEventListener('click', () => { bits[i] = bits[i] ? 0 : 1; paint(); o.onChange && o.onChange(bits.slice(), i); });
      btns.push(b); row.append(b);
    }
    function paint(changed) {
      btns.forEach((b, i) => {
        const on = !!bits[i];
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', String(on));
        b.firstChild.textContent = o.text === false ? '' : bits[i];
        b.setAttribute('aria-label', (o.weight ? String(o.weight(i)).replace(/<[^>]+>/g, '') + ': ' : '') + bits[i]);
        if (changed && changed[i]) { b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse'); }
      });
    }
    container.append(row);
    paint();
    return {
      el: row, buttons: btns,
      get: () => bits.slice(),
      value: () => valOf(bits),
      set(v, silent) {
        const old = bits.slice();
        bits = Array.isArray(v) ? v.slice() : bitsOf(v, n);
        paint(bits.map((b, i) => b !== old[i]));
        if (!silent && o.onChange) o.onChange(bits.slice(), -1);
      },
      relabel() { btns.forEach((b, i) => { b.lastChild.innerHTML = o.weight ? o.weight(i) : ''; }); },
    };
  }

  /* ---------- metin içi sürüklenebilir sayı ---------- */
  /** knob(span, { value, min, max, step, fmt(v), onChange(v) }) */
  function knob(span, o) {
    let v = o.value;
    const step = o.step || 1;
    span.classList.add('knob');
    span.setAttribute('role', 'spinbutton');
    span.tabIndex = 0;
    span.innerHTML = '';
    const dec = el('button', { type: 'button', tabindex: '-1', 'aria-hidden': 'true', text: '‹' });
    const val = el('span', { class: 'v' });
    const inc = el('button', { type: 'button', tabindex: '-1', 'aria-hidden': 'true', text: '›' });
    span.append(dec, val, inc);
    const show = () => { val.textContent = o.fmt ? o.fmt(v) : v; span.setAttribute('aria-valuenow', v); span.setAttribute('aria-valuemin', o.min); span.setAttribute('aria-valuemax', o.max); };
    const set = (nv, fire) => { nv = Math.max(o.min, Math.min(o.max, Math.round(nv / step) * step)); if (nv === v && !fire) return; v = nv; show(); o.onChange && o.onChange(v); };
    dec.addEventListener('click', () => set(v - step));
    inc.addEventListener('click', () => set(v + step));
    span.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { set(v + step); e.preventDefault(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { set(v - step); e.preventDefault(); }
    });
    let sx = null, sv = 0;
    const px = o.px || 14;
    span.addEventListener('pointerdown', (e) => { if (e.target.tagName === 'BUTTON') return; sx = e.clientX; sv = v; span.setPointerCapture(e.pointerId); span.classList.add('drag'); });
    span.addEventListener('pointermove', (e) => { if (sx == null) return; set(sv + Math.round((e.clientX - sx) / px) * step); });
    const up = () => { sx = null; span.classList.remove('drag'); };
    span.addEventListener('pointerup', up); span.addEventListener('pointercancel', up);
    show();
    return { get: () => v, set: (nv) => set(nv, true) };
  }
  /** Metindeki .out[data-o] alanlarını günceller (değişince parlar). */
  function out(rootEl, key, html) {
    $$('[data-o="' + key + '"]', rootEl || document).forEach((e) => {
      if (e.innerHTML === String(html)) return;
      e.innerHTML = html;
      e.classList.remove('flash'); void e.offsetWidth; e.classList.add('flash');
    });
  }

  /* ---------- adım gezgini ---------- */
  function steps(container, o) {
    let i = 0, count = o.count;
    const nav = el('div', { class: 'stepnav' });
    const prev = el('button', { type: 'button', class: 'btn sm ghost', text: '←' });
    const dots = el('div', { class: 'dots' });
    const next = el('button', { type: 'button', class: 'btn sm fill', text: o.nextLabel || t({ tr: 'Sonraki adım →', en: 'Next step →' }) });
    const restart = el('button', { type: 'button', class: 'btn sm ghost', text: t({ tr: 'Baştan', en: 'Restart' }) });
    nav.append(prev, dots, next, restart);
    container.append(nav);
    function go(k) {
      i = Math.max(0, Math.min(count - 1, k));
      o.render(i);
      dots.innerHTML = count <= 14 ? Array.from({ length: count }, (_, j) => '<i class="' + (j <= i ? 'on' : '') + '"></i>').join('') : (i + 1) + ' / ' + count;
      prev.disabled = i === 0; next.disabled = i >= count - 1; restart.hidden = i < count - 1;
    }
    prev.onclick = () => go(i - 1); next.onclick = () => go(i + 1); restart.onclick = () => go(0);
    go(0);
    return { go, reset(n) { count = Math.max(1, n); go(0); }, get i() { return i; } };
  }

  /* ---------- kod renklendirme ---------- */
  const KW = {
    js: 'const let var function return if else for while new typeof of in class import export try catch throw null undefined true false this',
    py: 'def return if elif else for while in not and or is None True False import from as class try except raise with lambda pass break continue print len int str hex bin oct float list dict range format bytes type id ord chr',
    c: 'int char float double long short unsigned signed void return if else for while sizeof struct const static include printf NULL uint8_t int8_t uint16_t int16_t uint32_t int32_t',
  };
  KW.p5 = KW.js + ' fill stroke background color red green blue alpha setup draw createCanvas rect ellipse loadPixels updatePixels pixels';
  function highlight(code, lang) {
    const kws = new Set((KW[lang] || KW.js).split(' '));
    const comment = lang === 'py' ? '#[^\\n]*' : '\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/';
    const re = new RegExp('(' + comment + ')|([fbr]?"(?:\\\\.|[^"\\\\\\n])*"|[fbr]?\'(?:\\\\.|[^\'\\\\\\n])*\'|`(?:\\\\.|[^`\\\\])*`)|\\b(0[xX][0-9a-fA-F_]+n?|0[bB][01_]+n?|0[oO][0-7_]+n?|\\d[\\d_]*(?:\\.\\d+)?(?:[eE][+-]?\\d+)?n?)\\b|([A-Za-z_$][\\w$]*)(?=\\s*\\()|([A-Za-z_$][\\w$]*)', 'g');
    let o = '', last = 0, m;
    while ((m = re.exec(code))) {
      o += esc(code.slice(last, m.index));
      const [tok, c, s, n, f, w] = m;
      if (c) o += '<span class="tk-c">' + esc(c) + '</span>';
      else if (s) o += '<span class="tk-s">' + esc(s) + '</span>';
      else if (n) o += '<span class="tk-n">' + esc(n) + '</span>';
      else if (f) o += kws.has(f) ? '<span class="tk-k">' + esc(f) + '</span>' : '<span class="tk-f">' + esc(f) + '</span>';
      else if (w) o += kws.has(w) ? '<span class="tk-k">' + esc(w) + '</span>' : esc(w);
      else o += esc(tok);
      last = re.lastIndex;
    }
    return o + esc(code.slice(last));
  }
  function clean(src) {
    src = src.replace(/^\n/, '').replace(/\s+$/, '');
    const ind = Math.min(...src.split('\n').filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
    return ind > 0 && isFinite(ind) ? src.split('\n').map((l) => l.slice(ind)).join('\n') : src;
  }
  const LNAME = { js: 'JavaScript', py: 'Python', c: 'C', p5: 'p5.js' };
  function setupCode(ctx) {
    $$('.code-tabs', ctx).forEach((box) => {
      if (box.dataset.ready) return; box.dataset.ready = '1';
      const pres = $$(':scope > pre', box);
      const bar = el('div', { class: 'tab-bar', role: 'tablist' });
      pres.forEach((p) => { p.innerHTML = highlight(clean(p.textContent), p.dataset.lang); });
      const sel = (k, bc) => {
        pres.forEach((p, j) => (p.hidden = j !== k));
        $$('button', bar).forEach((b, j) => b.setAttribute('aria-selected', String(j === k)));
        if (bc) { store.set('zo-lang', pres[k].dataset.lang); $$('.code-tabs').forEach((o) => o !== box && o._sel && o._sel(pres[k].dataset.lang)); }
      };
      pres.forEach((p, k) => bar.append(el('button', { type: 'button', role: 'tab', text: LNAME[p.dataset.lang] || p.dataset.lang, onclick: () => sel(k, true) })));
      box.prepend(bar);
      box._sel = (lang) => { const k = pres.findIndex((p) => p.dataset.lang === lang); if (k >= 0) sel(k, false); };
      const saved = store.get('zo-lang', null);
      const k0 = Math.max(0, pres.findIndex((p) => p.dataset.lang === saved));
      sel(k0, false);
    });
    $$('.code > pre', ctx).forEach((p) => {
      if (p.dataset.ready) return; p.dataset.ready = '1';
      const lang = p.parentNode.dataset.lang || 'js';
      p.innerHTML = highlight(clean(p.textContent), lang);
      p.parentNode.prepend(el('span', { class: 'lang-tag', text: LNAME[lang] || lang }));
    });
  }

  /* ---------- test ---------- */
  function setupQuizzes(ctx) {
    $$('.quiz', ctx).forEach((qz) => {
      if (qz.dataset.ready) return; qz.dataset.ready = '1';
      const qs = $$('.quiz-q', qz);
      let done = 0, right = 0;
      const sc = el('div', { class: 'quiz-score' });
      qs.forEach((q, qi) => {
        const ok = +q.dataset.ok;
        const list = $('ul, ol', q), why = $('.quiz-why', q);
        if (why) why.hidden = true;
        q.firstElementChild.insertAdjacentHTML('afterbegin', '<span class="num">' + (qi + 1) + '.</span>');
        const box = el('div', { class: 'quiz-opts' });
        $$('li', list).forEach((li, i) => {
          const b = el('button', { type: 'button', class: 'quiz-opt', html: '<span class="k">' + 'ABCDE'[i] + '</span><span>' + li.innerHTML + '</span>' });
          b.addEventListener('click', () => {
            if (q.dataset.done) return; q.dataset.done = '1'; done++;
            if (i === ok) { right++; b.classList.add('right'); } else { b.classList.add('wrong'); box.children[ok].classList.add('right'); }
            $$('button', box).forEach((x) => (x.disabled = true));
            if (why) why.hidden = false;
            sc.textContent = done === qs.length ? t({ tr: 'Sonuç: ', en: 'Score: ' }) + right + ' / ' + qs.length : done + ' / ' + qs.length;
          });
          box.append(b);
        });
        list.replaceWith(box);
      });
      sc.textContent = '0 / ' + qs.length;
      qz.append(sc);
    });
  }

  /* ---------- sıra sende (üretilen sorular) ---------- */
  function norm(v, kind) {
    let s = String(v).trim();
    if (kind === 'text') return s.replace(/\s+/g, ' ');
    if (kind === 'code') return s.replace(/^(["'`])(.*)\1$/, '$2').replace(/\s+/g, '');
    s = s.replace(/[\s_']/g, '');
    if (kind === 'dec') return s.replace(/[.,](?=\d{3}(\D|$))/g, '').replace(/^\+/, '').replace(/^(-?)0+(?=\d)/, '$1');
    s = s.toUpperCase();
    if (kind === 'color') return s.replace(/^#|^0X/, '');
    if (kind === 'bin') s = s.replace(/^0B/, '');
    if (kind === 'hex') s = s.replace(/^#|^0X/, '');
    if (kind === 'oct') s = s.replace(/^0O/, '');
    if (kind === 'bits') return s.replace(/^0B/, '');
    return s.replace(/^0+(?=.)/, '');
  }
  /** tryIt(container, [{label, fn}], {title}) — fn() → { q, a, kind, hint, explain } */
  function tryIt(container, gens, opts) {
    opts = opts || {};
    const list = gens.map((g) => (typeof g === 'function' ? { fn: g } : g));
    const active = list.map(() => true);
    let cur = null, solved = false, ok = 0, tries = 0;
    const box = el('div', { class: 'try' });
    box.innerHTML = '<div class="try-top"><span class="try-tag">' + esc(opts.title || t({ tr: 'Sıra sende', en: 'Your turn' })) + '</span><span class="try-score"></span></div>';
    if (list.length > 1 && list.every((g) => g.label)) {
      const tp = el('div', { class: 'try-topics' });
      list.forEach((g, i) => {
        const b = el('button', { type: 'button', 'aria-pressed': 'true', text: g.label });
        b.addEventListener('click', () => { if (active[i] && active.filter(Boolean).length === 1) return; active[i] = !active[i]; b.setAttribute('aria-pressed', String(active[i])); next(); });
        tp.append(b);
      });
      box.append(tp);
    }
    const q = el('div', { class: 'try-q' });
    const form = el('form', { class: 'try-row', autocomplete: 'off' });
    const inp = el('input', { class: 'inp', 'aria-label': t({ tr: 'Cevabın', en: 'Your answer' }), spellcheck: 'false', autocapitalize: 'off' });
    const go = el('button', { class: 'btn fill', type: 'submit', text: t({ tr: 'Kontrol', en: 'Check' }) });
    form.append(inp, go);
    const fb = el('div', { class: 'try-fb', 'aria-live': 'polite' });
    const links = el('div', { class: 'try-links' });
    const hint = el('button', { type: 'button', text: t({ tr: 'İpucu', en: 'Hint' }) });
    const show = el('button', { type: 'button', text: t({ tr: 'Çözümü göster', en: 'Show solution' }) });
    const nxt = el('button', { type: 'button', text: t({ tr: 'Başka soru', en: 'Another one' }) });
    links.append(hint, show, nxt);
    box.append(q, form, fb, links);
    container.append(box);
    const score = () => { $('.try-score', box).textContent = ok + ' / ' + tries; };
    function next() {
      const pool = list.filter((_, i) => active[i]);
      let g, k = 0; do { g = pick(pool).fn(); k++; } while (cur && g.q === cur.q && k < 6);
      cur = g; solved = false;
      q.innerHTML = cur.q; inp.value = ''; inp.placeholder = cur.ph || ''; fb.innerHTML = '';
      go.textContent = t({ tr: 'Kontrol', en: 'Check' });
      hint.hidden = !cur.hint;
    }
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (solved) { next(); inp.focus(); return; }
      if (!inp.value.trim()) return;
      tries++;
      if ([].concat(cur.a).some((a) => norm(a, cur.kind) === norm(inp.value, cur.kind))) {
        ok++; solved = true;
        fb.innerHTML = '<span class="good">' + esc(pick(LANG === 'tr' ? ['Doğru!', 'Evet!', 'Aynen.', 'Harika!'] : ['Correct!', 'Yes!', 'Exactly.', 'Nice!'])) + '</span> ' + (cur.explain || '');
        go.textContent = t({ tr: 'Sıradaki →', en: 'Next →' });
      } else {
        fb.innerHTML = '<span class="bad">' + esc(t({ tr: 'Henüz değil.', en: 'Not yet.' })) + '</span> ' + esc(t({ tr: 'Bir daha dene ya da ipucuna bak.', en: 'Try again or take a hint.' }));
        inp.select();
      }
      score();
    });
    hint.addEventListener('click', () => { fb.innerHTML = '<b>' + esc(t({ tr: 'İpucu:', en: 'Hint:' })) + '</b> ' + cur.hint; });
    show.addEventListener('click', () => { solved = true; fb.innerHTML = '<b>' + esc(t({ tr: 'Cevap:', en: 'Answer:' })) + '</b> <code>' + esc([].concat(cur.a)[0]) + '</code>' + (cur.explain ? ' — ' + cur.explain : ''); go.textContent = t({ tr: 'Sıradaki →', en: 'Next →' }); });
    nxt.addEventListener('click', () => { next(); inp.focus(); });
    score(); next();
    return { next };
  }

  window.NS = {
    LANG, t, esc, $, $$, el, rand, pick, shuffle, fmt, pad, toBase, group, bitsOf, valOf, store, human, CHAPTERS,
    lamps, knob, out, steps, highlight, setupCode, setupQuizzes, tryIt, norm,
  };
  function init() { chrome(); setupCode(document); setupQuizzes(document); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
