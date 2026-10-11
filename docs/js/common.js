/* ==========================================================================
   Sayı Sistemleri / Number Systems — ortak altyapı
   - Sayfa iskeleti (üst çubuk, bölüm listesi, içindekiler, bölüm sonu, footer)
   - Tema, dil geçişi, ilerleme takibi
   - Tekrar kullanılabilir bileşenler: stepper, bits, placeValue, practice, quiz
   - Kod renklendirme
   Tüm arayüz metinleri { tr, en } nesneleriyle verilir; NS.t() doğru dili seçer.
   ========================================================================== */
(function () {
  'use strict';

  const root = document.documentElement;
  const LANG = root.lang === 'en' ? 'en' : 'tr';
  const ROOT = LANG === 'en' ? '../' : '';
  const t = (o) => (o == null ? '' : typeof o === 'string' ? o : (o[LANG] != null ? o[LANG] : o.tr));

  const CHAPTERS = [
    { id: 'intro',    tr: 'index.html',              en: 'index.html',            title: { tr: 'Giriş', en: 'Introduction' } },
    { id: 'bases',    tr: 'taban-kavrami.html',      en: 'number-bases.html',     title: { tr: 'Taban Kavramı', en: 'Number Bases' } },
    { id: 'binary',   tr: 'binary.html',             en: 'binary.html',           title: { tr: 'İkili Sistem (Binary)', en: 'Binary' } },
    { id: 'hex',      tr: 'hexadecimal.html',        en: 'hexadecimal.html',      title: { tr: 'Onaltılık Sistem (Hex)', en: 'Hexadecimal' } },
    { id: 'bitbyte',  tr: 'bit-byte.html',           en: 'bits-bytes.html',       title: { tr: 'Bit ve Byte', en: 'Bits & Bytes' } },
    { id: 'negative', tr: 'negatif-sayilar.html',    en: 'negative-numbers.html', title: { tr: 'Negatif Sayılar ve Taşma', en: 'Negative Numbers & Overflow' } },
    { id: 'float',    tr: 'ondalikli-sayilar.html',  en: 'floating-point.html',   title: { tr: 'Ondalıklı Sayılar', en: 'Floating Point' } },
    { id: 'text',     tr: 'metin-kodlama.html',      en: 'text-encoding.html',    title: { tr: 'Metin: ASCII ve UTF-8', en: 'Text: ASCII & UTF-8' } },
    { id: 'colors',   tr: 'renkler.html',            en: 'colors.html',           title: { tr: 'Renkler ve Görüntüler', en: 'Colors & Images' } },
    { id: 'sound',    tr: 'ses.html',                en: 'sound.html',            title: { tr: 'Ses', en: 'Sound' } },
    { id: 'memory',   tr: 'memory.html',             en: 'memory.html',           title: { tr: 'Bellek (Memory)', en: 'Memory' } },
    { id: 'refs',     tr: 'referanslar.html',        en: 'references.html',       title: { tr: 'Değişkenler ve Referanslar', en: 'Variables & References' } },
    { id: 'files',    tr: 'dosyalar.html',           en: 'files.html',            title: { tr: 'Dosyalar', en: 'Files' } },
    { id: 'prog',     tr: 'programlama.html',        en: 'programming.html',      title: { tr: 'Kodda Sayılar ve Bitler', en: 'Numbers & Bits in Code' } },
    { id: 'practice', tr: 'pratik.html',             en: 'practice.html',         title: { tr: 'Karma Pratik', en: 'Mixed Practice' } },
  ];

  const UI = {
    menu: { tr: 'Bölümler', en: 'Chapters' },
    theme: { tr: 'Açık/koyu tema', en: 'Light/dark theme' },
    progress: { tr: 'İlerleme', en: 'Progress' },
    onThisPage: { tr: 'Bu sayfada', en: 'On this page' },
    chapter: { tr: 'Bölüm', en: 'Chapter' },
    prev: { tr: 'Önceki bölüm', en: 'Previous chapter' },
    next: { tr: 'Sonraki bölüm', en: 'Next chapter' },
    markDone: { tr: 'Bu bölümü tamamladım', en: 'Mark this chapter complete' },
    done: { tr: 'Tamamlandı ✓', en: 'Completed ✓' },
    undo: { tr: 'geri al', en: 'undo' },
    copy: { tr: 'Kopyala', en: 'Copy' },
    copied: { tr: 'Kopyalandı', en: 'Copied' },
    footer1: { tr: 'Sayı Sistemleri • Bilgisayarda sayılar nasıl saklanır?', en: 'Number Systems • How do computers store numbers?' },
    footer2: { tr: 'Bu kitaba katkıda bulunmak ister misin? Hata bulduysan ya da bir fikrin varsa', en: 'Want to contribute? Found a mistake or have an idea? Send a pull request to' },
    footer3: { tr: 'adresine pull request gönderebilirsin.', en: '' },
    interactive: { tr: 'Etkileşimli', en: 'Interactive' },
  };

  /* ---------- küçük yardımcılar ---------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  function el(tag, attrs, children) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'text') e.textContent = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    if (children) [].concat(children).forEach((c) => c != null && e.append(c.nodeType ? c : document.createTextNode(c)));
    return e;
  }
  const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const fmt = (n) => Number(n).toLocaleString(LANG === 'en' ? 'en-US' : 'tr-TR');
  const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const toBase = (n, b) => Number(n).toString(b).toUpperCase();
  const pad = (s, n, c) => String(s).padStart(n, c == null ? '0' : c);
  const sub = (b) => String(b).replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[d]);
  const baseClass = (b) => ({ 2: 'bin', 8: 'oct', 10: 'dec', 16: 'hex' }[b] || 'dec');
  const baseName = (b) => t({
    2: { tr: 'İkili (2)', en: 'Binary (2)' }, 8: { tr: 'Sekizli (8)', en: 'Octal (8)' },
    10: { tr: 'Onlu (10)', en: 'Decimal (10)' }, 16: { tr: 'Onaltılı (16)', en: 'Hex (16)' },
  }[b] || { tr: 'Taban ' + b, en: 'Base ' + b });
  /** "1011" gibi bir metni gruplara ayırır (sağdan). */
  const group = (s, n, sep) => { s = String(s); const out = []; for (let i = s.length; i > 0; i -= n) out.unshift(s.slice(Math.max(0, i - n), i)); return out.join(sep == null ? ' ' : sep); };
  /** Bir metnin verilen tabanda geçerli olup olmadığını kontrol eder; geçersiz ilk karakteri döndürür. */
  function invalidDigit(str, base) {
    const valid = DIGITS.slice(0, base);
    for (const c of str.toUpperCase()) if (!valid.includes(c)) return c;
    return null;
  }
  const digitValue = (c) => DIGITS.indexOf(String(c).toUpperCase());
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* gizli pencere vb. */ } },
  };
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function slug(s) {
    const map = { ç: 'c', ğ: 'g', ı: 'i', İ: 'i', ö: 'o', ş: 's', ü: 'u', Ç: 'c', Ğ: 'g', Ö: 'o', Ş: 's', Ü: 'u' };
    return s.replace(/[çğıİöşüÇĞÖŞÜ]/g, (c) => map[c]).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  }

  /* ---------- tema ---------- */
  function currentTheme() {
    return root.dataset.theme || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  }
  function toggleTheme() {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    store.set('ss-theme', next);
  }

  /* ---------- ilerleme ---------- */
  const progress = () => store.get('ss-progress', {});
  function setDone(id, v) { const p = progress(); if (v) p[id] = true; else delete p[id]; store.set('ss-progress', p); renderProgress(); }
  function renderProgress() {
    const p = progress();
    const n = CHAPTERS.filter((c) => p[c.id]).length;
    const bar = $('.progress-bar > span'); const txt = $('.progress-text');
    if (bar) bar.style.width = (100 * n / CHAPTERS.length) + '%';
    if (txt) txt.textContent = n + '/' + CHAPTERS.length;
    $$('.chapter-list a').forEach((a) => a.classList.toggle('done', !!p[a.dataset.id]));
    const btn = $('.done-btn');
    if (btn) {
      const id = document.body.dataset.chapter;
      btn.classList.toggle('is-done', !!p[id]);
      btn.innerHTML = p[id] ? esc(t(UI.done)) + ' <span class="undo">(' + esc(t(UI.undo)) + ')</span>' : esc(t(UI.markDone));
    }
  }

  /* ---------- sayfa iskeleti ---------- */
  function buildLayout() {
    const id = document.body.dataset.chapter;
    const idx = CHAPTERS.findIndex((c) => c.id === id);
    const ch = CHAPTERS[idx];
    const main = $('main');
    if (!main) return;

    const otherLang = LANG === 'tr' ? 'en' : 'tr';
    const langHref = ch ? (LANG === 'tr' ? 'en/' + ch.en : '../' + ch.tr) : (LANG === 'tr' ? 'en/index.html' : '../index.html');

    const top = el('header', { class: 'topbar' });
    top.innerHTML =
      '<button class="icon-btn menu-btn" aria-label="' + esc(t(UI.menu)) + '" aria-expanded="false" aria-controls="sidebar">' +
      '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>' +
      '<a class="brand" href="index.html"><span class="brand-mark">0x</span><span class="brand-text">' + (LANG === 'tr' ? 'sayı sistemleri' : 'number systems') + '</span></a>' +
      '<div class="top-spacer"></div>' +
      '<div class="progress" title="' + esc(t(UI.progress)) + '"><div class="progress-bar"><span></span></div><span class="progress-text"></span></div>' +
      '<div class="lang-switch" role="group" aria-label="Language">' +
      '<a href="' + (LANG === 'tr' ? '#' : langHref) + '" lang="tr" hreflang="tr"' + (LANG === 'tr' ? ' aria-current="true"' : '') + '>TR</a>' +
      '<a href="' + (LANG === 'en' ? '#' : langHref) + '" lang="en" hreflang="en"' + (LANG === 'en' ? ' aria-current="true"' : '') + '>EN</a></div>' +
      '<button class="icon-btn theme-btn" aria-label="' + esc(t(UI.theme)) + '" title="' + esc(t(UI.theme)) + '">' +
      '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 3a7 7 0 0 1 0 14z" fill="currentColor"/></svg></button>';
    void otherLang;

    const side = el('nav', { class: 'sidebar', id: 'sidebar', 'aria-label': t(UI.menu) });
    const list = el('ol', { class: 'chapter-list' });
    CHAPTERS.forEach((c, i) => {
      const a = el('a', { href: c[LANG], 'data-id': c.id, class: c.id === id ? 'active' : null, 'aria-current': c.id === id ? 'page' : null });
      a.innerHTML = '<span class="ch-num">' + pad(i, 2) + '</span><span class="ch-title">' + esc(t(c.title)) + '</span><span class="ch-check" aria-hidden="true">✓</span>';
      list.append(el('li', null, a));
    });
    side.append(el('div', { class: 'sidebar-label', text: t(UI.menu) }), list);

    const scrim = el('div', { class: 'scrim' });
    const layout = el('div', { class: 'layout' });
    main.parentNode.insertBefore(layout, main);
    layout.append(side, main);

    // içindekiler
    const heads = $$('h2', main).filter((h) => !h.closest('.widget, .quiz, .practice, .chapter-end'));
    heads.forEach((h) => { if (!h.id) h.id = slug(h.textContent); });
    if (heads.length > 2) {
      const toc = el('aside', { class: 'toc', 'aria-label': t(UI.onThisPage) });
      toc.append(el('div', { class: 'toc-label', text: t(UI.onThisPage) }));
      const ul = el('ul');
      heads.forEach((h) => ul.append(el('li', null, el('a', { href: '#' + h.id, text: h.textContent.replace(/\s+/g, ' ').trim() }))));
      toc.append(ul);
      layout.append(toc);
      if ('IntersectionObserver' in window) {
        const links = $$('a', toc);
        const io = new IntersectionObserver((entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) links.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id));
          });
        }, { rootMargin: '-80px 0px -70% 0px' });
        heads.forEach((h) => io.observe(h));
      }
    }

    // bölüm sonu
    if (ch) {
      const end = el('section', { class: 'chapter-end' });
      const doneBtn = el('button', { class: 'btn done-btn', type: 'button' });
      doneBtn.addEventListener('click', () => setDone(id, !progress()[id]));
      end.append(doneBtn);
      const nav = el('div', { class: 'chapter-nav' });
      const prev = CHAPTERS[idx - 1], next = CHAPTERS[idx + 1];
      nav.append(prev ? el('a', { class: 'cn prev', href: prev[LANG], html: '<small>← ' + esc(t(UI.prev)) + '</small><span>' + esc(t(prev.title)) + '</span>' }) : el('span'));
      nav.append(next ? el('a', { class: 'cn next', href: next[LANG], html: '<small>' + esc(t(UI.next)) + ' →</small><span>' + esc(t(next.title)) + '</span>' }) : el('span'));
      end.append(nav);
      main.append(end);
    }

    const foot = el('footer', { class: 'footer' });
    const repo = 'https://github.com/gusanmaz/number-storage-tutorial';
    foot.innerHTML = '<p>' + esc(t(UI.footer1)) + '</p><p>' + esc(t(UI.footer2)) +
      ' <a href="' + repo + '" target="_blank" rel="noopener noreferrer">github.com/gusanmaz/number-storage-tutorial</a> ' + esc(t(UI.footer3)) + '</p>';
    layout.after(foot);
    document.body.prepend(top, scrim);

    const menuBtn = $('.menu-btn', top);
    const closeMenu = () => { document.body.classList.remove('menu-open'); menuBtn.setAttribute('aria-expanded', 'false'); };
    menuBtn.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    scrim.addEventListener('click', closeMenu);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
    $('.theme-btn', top).addEventListener('click', toggleTheme);
    $$('.lang-switch a[aria-current]', top).forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));
    store.set('ss-lang', LANG);

    // bölüm numarası (hero)
    const eyebrow = $('.chapter-hero .eyebrow', main);
    if (eyebrow && ch && idx > 0 && !eyebrow.textContent.trim()) eyebrow.textContent = t(UI.chapter) + ' ' + idx;

    renderProgress();
  }

  /* ---------- kod renklendirme ---------- */
  const KW = {
    js: 'const let var function return if else for while do break continue new typeof instanceof of in class extends import from export default try catch finally throw async await null undefined true false this switch case',
    py: 'def return if elif else for while in not and or is None True False import from as class try except finally raise with lambda pass break continue global print len int str hex bin oct float list dict set tuple id range format bytes type',
    c: 'int char float double long short unsigned signed void return if else for while sizeof struct const static include printf malloc free NULL uint8_t int8_t uint16_t int16_t uint32_t int32_t',
  };
  KW.p5 = KW.js + ' fill stroke background color red green blue alpha brightness saturation hue setup draw createCanvas rect ellipse noStroke';
  function highlight(code, lang) {
    const kws = new Set((KW[lang] || KW.js).split(' '));
    const comment = lang === 'py' ? '#[^\\n]*' : '\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/';
    const re = new RegExp(
      '(' + comment + ')' +                                             // 1 yorum
      '|([fbr]?"(?:\\\\.|[^"\\\\\\n])*"|[fbr]?\'(?:\\\\.|[^\'\\\\\\n])*\'|`(?:\\\\.|[^`\\\\])*`)' + // 2 metin
      '|\\b(0[xX][0-9a-fA-F_]+n?|0[bB][01_]+n?|0[oO][0-7_]+n?|\\d[\\d_]*(?:\\.\\d+)?(?:[eE][+-]?\\d+)?n?)\\b' + // 3 sayı
      '|([A-Za-z_$][\\w$]*)(?=\\s*\\()' +                                 // 4 fonksiyon çağrısı
      '|([A-Za-z_$][\\w$]*)', 'g');                                       // 5 kelime
    let out = '', last = 0, m;
    while ((m = re.exec(code))) {
      out += esc(code.slice(last, m.index));
      const [tok, c, s, n, f, w] = m;
      if (c) out += '<span class="tk-c">' + esc(c) + '</span>';
      else if (s) out += '<span class="tk-s">' + esc(s) + '</span>';
      else if (n) {
        const cls = /^0[xX]/.test(n) ? 'tk-n hex-lit' : /^0[bB]/.test(n) ? 'tk-n bin-lit' : /^0[oO]/.test(n) ? 'tk-n oct-lit' : 'tk-n';
        out += '<span class="' + cls + '">' + esc(n) + '</span>';
      } else if (f) out += kws.has(f) ? '<span class="tk-k">' + esc(f) + '</span>' : '<span class="tk-f">' + esc(f) + '</span>';
      else if (w) out += kws.has(w) ? '<span class="tk-k">' + esc(w) + '</span>' : esc(w);
      else out += esc(tok);
      last = re.lastIndex;
    }
    return out + esc(code.slice(last));
  }
  function setupCode(ctx) {
    $$('pre.code', ctx).forEach((pre) => {
      if (pre.dataset.ready) return;
      pre.dataset.ready = '1';
      const lang = pre.dataset.lang || 'js';
      let src = pre.textContent.replace(/^\n/, '').replace(/\s+$/, '');
      // ortak girinti
      const ind = Math.min(...src.split('\n').filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
      if (ind > 0 && isFinite(ind)) src = src.split('\n').map((l) => l.slice(ind)).join('\n');
      pre.innerHTML = '<code>' + (lang === 'text' ? esc(src) : highlight(src, lang)) + '</code>';
      const wrap = el('figure', { class: 'code-wrap' });
      pre.parentNode.insertBefore(wrap, pre);
      const head = el('figcaption', { class: 'code-head' });
      const names = { js: 'JavaScript', py: 'Python', c: 'C', p5: 'p5.js', text: '' };
      head.append(el('span', { class: 'code-lang', text: pre.dataset.title || names[lang] || lang }));
      const copy = el('button', { class: 'copy-btn', type: 'button', text: t(UI.copy) });
      copy.addEventListener('click', () => {
        const done = () => { copy.textContent = t(UI.copied); setTimeout(() => (copy.textContent = t(UI.copy)), 1200); };
        if (navigator.clipboard) navigator.clipboard.writeText(src).then(done, () => {}); else done();
      });
      head.append(copy);
      wrap.append(head, pre);
    });
  }

  /* ---------- sekmeler (JS / Python vb.) ---------- */
  function setupTabs(ctx) {
    $$('.tabs', ctx).forEach((tabs) => {
      if (tabs.dataset.ready) return;
      tabs.dataset.ready = '1';
      const panels = $$(':scope > .tab-panel', tabs);
      const bar = el('div', { class: 'tab-bar', role: 'tablist' });
      const key = tabs.dataset.sync; // aynı anahtarlı sekmeler birlikte değişir (ör. dil seçimi)
      const select = (i, broadcast) => {
        panels.forEach((p, j) => { p.hidden = i !== j; });
        $$('button', bar).forEach((b, j) => { b.setAttribute('aria-selected', String(i === j)); b.tabIndex = i === j ? 0 : -1; });
        if (broadcast && key) {
          store.set('ss-tab-' + key, panels[i].dataset.label);
          $$('.tabs[data-sync="' + key + '"]').forEach((other) => { if (other !== tabs && other._select) { const k = $$(':scope > .tab-panel', other).findIndex((p) => p.dataset.label === panels[i].dataset.label); if (k >= 0) other._select(k, false); } });
        }
      };
      panels.forEach((p, i) => {
        const b = el('button', { type: 'button', role: 'tab', text: p.dataset.label });
        b.addEventListener('click', () => select(i, true));
        b.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            const k = (i + (e.key === 'ArrowRight' ? 1 : panels.length - 1)) % panels.length;
            select(k, true); $$('button', bar)[k].focus();
          }
        });
        bar.append(b);
      });
      tabs.prepend(bar);
      tabs._select = select;
      const saved = key && store.get('ss-tab-' + key, null);
      const start = Math.max(0, saved ? panels.findIndex((p) => p.dataset.label === saved) : 0);
      select(start, false);
    });
  }

  /* ---------- Stepper: adım adım animasyon kontrolü ---------- */
  /**
   * stepper(container, { count, render(i), interval })
   * render(i): i. adımı çizer. count dinamik değişebilir: api.reset(newCount)
   */
  function stepper(container, opts) {
    let count = opts.count, i = 0, timer = null;
    const interval = opts.interval || 1300;
    const bar = el('div', { class: 'stepper' });
    const mk = (cls, label, svg) => el('button', { type: 'button', class: 'icon-btn st-' + cls, 'aria-label': label, title: label, html: svg });
    const bFirst = mk('first', t({ tr: 'Başa dön', en: 'Restart' }), '<svg width="18" height="18" viewBox="0 0 18 18"><path d="M4 3v12M15 3 7 9l8 6z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>');
    const bPrev = mk('prev', t({ tr: 'Önceki adım', en: 'Previous step' }), '<svg width="18" height="18" viewBox="0 0 18 18"><path d="M12 3 5 9l7 6z" fill="currentColor"/></svg>');
    const bPlay = mk('play', t({ tr: 'Oynat', en: 'Play' }), '');
    const bNext = mk('next', t({ tr: 'Sonraki adım', en: 'Next step' }), '<svg width="18" height="18" viewBox="0 0 18 18"><path d="m6 3 7 6-7 6z" fill="currentColor"/></svg>');
    const label = el('span', { class: 'st-label', 'aria-live': 'polite' });
    const track = el('div', { class: 'st-track' }, el('span'));
    bar.append(bFirst, bPrev, bPlay, bNext, track, label);
    container.append(bar);
    const playIcon = '<svg width="18" height="18" viewBox="0 0 18 18"><path d="M5 3v12l10-6z" fill="currentColor"/></svg>';
    const pauseIcon = '<svg width="18" height="18" viewBox="0 0 18 18"><path d="M5 3h3v12H5zM10 3h3v12h-3z" fill="currentColor"/></svg>';
    function update() {
      opts.render(i);
      label.textContent = t({ tr: 'Adım', en: 'Step' }) + ' ' + (i + 1) + ' / ' + count;
      track.firstChild.style.width = (count > 1 ? (100 * i / (count - 1)) : 100) + '%';
      bPrev.disabled = bFirst.disabled = i === 0;
      bNext.disabled = i >= count - 1;
      bPlay.innerHTML = timer ? pauseIcon : playIcon;
      bPlay.setAttribute('aria-label', timer ? t({ tr: 'Duraklat', en: 'Pause' }) : t({ tr: 'Oynat', en: 'Play' }));
    }
    const stop = () => { clearInterval(timer); timer = null; update(); };
    function go(k) { i = Math.max(0, Math.min(count - 1, k)); update(); }
    bFirst.onclick = () => { stop(); go(0); };
    bPrev.onclick = () => { stop(); go(i - 1); };
    bNext.onclick = () => { stop(); go(i + 1); };
    bPlay.onclick = () => {
      if (timer) return stop();
      if (i >= count - 1) i = -1;
      timer = setInterval(() => { if (i >= count - 1) stop(); else go(i + 1); }, interval);
      go(i + 1);
    };
    bar.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { bNext.click(); e.preventDefault(); } if (e.key === 'ArrowLeft') { bPrev.click(); e.preventDefault(); } });
    go(0);
    return { go, get index() { return i; }, reset(n, at) { stop(); count = Math.max(1, n); go(at || 0); }, stop, last() { stop(); go(count - 1); } };
  }

  /* ---------- Bit satırı ---------- */
  /**
   * bits(container, { n, value | bits, weight(i)->label, group, onChange(bitsArr), cls(i), readonly, size })
   * Dizi gösterimi: bits[0] = en anlamlı bit (MSB).
   */
  function bits(container, o) {
    const n = o.n || 8;
    let arr = o.bits ? o.bits.slice() : Array.from({ length: n }, (_, i) => Math.floor((o.value || 0) / Math.pow(2, n - 1 - i)) % 2);
    const row = el('div', { class: 'bitrow' + (o.size ? ' bitrow-' + o.size : '') + (o.readonly ? ' readonly' : ''), role: 'group', 'aria-label': o.label || 'bits' });
    const btns = [];
    for (let i = 0; i < n; i++) {
      if ((o.gaps && o.gaps.includes(i)) || (o.group && i > 0 && (n - i) % o.group === 0)) row.append(el('span', { class: 'bit-gap', 'aria-hidden': 'true' }));
      const b = el('button', { type: 'button', class: 'bitbtn ' + (o.cls ? o.cls(i) : ''), 'aria-pressed': 'false' });
      b.innerHTML = '<span class="bv">0</span>' + (o.weight ? '<span class="bw">' + o.weight(i) + '</span>' : '');
      if (!o.readonly) b.addEventListener('click', () => { arr[i] = arr[i] ? 0 : 1; paint(); o.onChange && o.onChange(arr.slice(), i); });
      else b.tabIndex = -1;
      btns.push(b); row.append(b);
    }
    function paint(flash) {
      btns.forEach((b, i) => {
        b.classList.toggle('on', !!arr[i]);
        b.setAttribute('aria-pressed', String(!!arr[i]));
        b.firstChild.textContent = arr[i];
        b.setAttribute('aria-label', (o.weight ? o.weight(i).replace(/<[^>]+>/g, '') + ': ' : '') + arr[i]);
        if (flash && flash[i]) { b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash'); }
      });
    }
    container.append(row);
    paint();
    const value = () => arr.reduce((acc, b) => acc * 2 + b, 0);
    return {
      el: row, buttons: btns,
      get: () => arr.slice(), value,
      set(v, silent) {
        const old = arr.slice();
        arr = Array.isArray(v) ? v.slice() : Array.from({ length: n }, (_, i) => Math.floor(v / Math.pow(2, n - 1 - i)) % 2);
        paint(arr.map((b, i) => b !== old[i]));
        if (!silent && o.onChange) o.onChange(arr.slice(), -1);
      },
    };
  }

  /* ---------- Basamak değeri gezgini ---------- */
  function placeValue(container, o) {
    const bases = o.bases || [2, 8, 10, 16];
    let base = o.base || bases[0];
    const wrap = el('div', { class: 'pv' });
    const row = el('div', { class: 'field-row' });
    const inp = el('input', { class: 'input mono', value: o.value || '1011', 'aria-label': t({ tr: 'Sayı', en: 'Number' }), spellcheck: 'false', autocomplete: 'off', maxlength: '12' });
    row.append(el('label', { class: 'field grow' }, [el('span', { text: t({ tr: 'Sayı', en: 'Number' }) }), inp]));
    let sel = null;
    if (bases.length > 1) {
      sel = el('select', { class: 'input', 'aria-label': t({ tr: 'Taban', en: 'Base' }) });
      bases.forEach((b) => sel.append(el('option', { value: b, text: baseName(b), selected: b === base ? true : null })));
      row.append(el('label', { class: 'field' }, [el('span', { text: t({ tr: 'Taban', en: 'Base' }) }), sel]));
    }
    const grid = el('div', { class: 'pv-grid' });
    const sum = el('div', { class: 'pv-sum', 'aria-live': 'polite' });
    wrap.append(row, grid, sum);
    container.append(wrap);
    function render() {
      const s = inp.value.trim().toUpperCase().replace(/^0[XBO]/, '');
      if (!s) { grid.innerHTML = ''; sum.innerHTML = ''; return; }
      const bad = invalidDigit(s, base);
      if (bad) {
        grid.innerHTML = '';
        sum.innerHTML = '<span class="bad">' + esc(t({ tr: '"' + bad + '" rakamı taban ' + base + ' için geçersiz. Bu tabanda yalnızca ' + DIGITS.slice(0, base).split('').join(', ') + ' kullanılabilir.', en: 'The digit "' + bad + '" is not valid in base ' + base + '. Only ' + DIGITS.slice(0, base).split('').join(', ') + ' may be used.' })) + '</span>';
        return;
      }
      const cls = baseClass(base);
      let total = 0; const parts = [];
      grid.innerHTML = '';
      grid.style.setProperty('--cols', s.length);
      [...s].forEach((d, i) => {
        const k = s.length - 1 - i, pw = Math.pow(base, k), dv = digitValue(d), c = dv * pw;
        total += c;
        if (dv) parts.push(fmt(c));
        const col = el('div', { class: 'pv-col' + (dv ? '' : ' zero') });
        col.innerHTML =
          '<div class="pv-digit ' + cls + '">' + d + '</div>' +
          '<div class="pv-op">×</div>' +
          '<div class="pv-pow">' + base + '<sup>' + k + '</sup></div>' +
          '<div class="pv-pval">= ' + fmt(pw) + '</div>' +
          '<div class="pv-contrib">' + (d !== String(dv) ? '<small>' + d + '=' + dv + '</small> ' : '') + fmt(c) + '</div>';
        grid.append(col);
      });
      sum.innerHTML = (parts.length ? parts.join(' + ') : '0') + ' = <b class="dec">' + fmt(total) + '</b><sub class="muted">10</sub>';
      o.onChange && o.onChange(total, s, base);
    }
    inp.addEventListener('input', render);
    sel && sel.addEventListener('change', () => { base = +sel.value; render(); });
    render();
    return { set(v, b) { inp.value = v; if (b && sel) { sel.value = b; base = b; } render(); } };
  }

  /* ---------- Alıştırma (üretilen sorular) ---------- */
  /**
   * practice(container, generators, opts)
   * generator: () => { q: html, a: string|string[], kind: 'dec'|'bin'|'hex'|'oct'|'text', hint: html, explain: html }
   * generators: dizi ya da [{ label, fn }]
   */
  function normalize(v, kind) {
    let s = String(v).trim();
    if (kind === 'text') return s.replace(/\s+/g, ' ');
    if (kind === 'code') return s.replace(/^(["'`])(.*)\1$/, '$2').replace(/\s+/g, '');
    s = s.replace(/[\s_']/g, '');
    if (kind === 'dec') return s.replace(/[.,](?=\d{3}(\D|$))/g, '').replace(/^\+/, '').replace(/^(-?)0+(?=\d)/, '$1');
    s = s.toUpperCase();
    if (kind === 'color') return s.replace(/^#|^0X/, '');
    if (kind === 'bin') s = s.replace(/^0B/, '').replace(/₂$/, '');
    if (kind === 'hex') s = s.replace(/^#|^0X/, '').replace(/H$/, '');
    if (kind === 'oct') s = s.replace(/^0O/, '');
    if (kind === 'bits') return s.replace(/^0B/, ''); // baştaki sıfırlar önemli
    return s.replace(/^0+(?=.)/, '');
  }
  function practice(container, gens, opts) {
    opts = opts || {};
    const list = gens.map((g) => (typeof g === 'function' ? { fn: g } : g));
    let active = list.map(() => true);
    let cur = null, answered = false, ok = 0, bad = 0, streak = 0, best = 0;
    const box = el('div', { class: 'practice' });
    const head = el('div', { class: 'pr-head' });
    head.append(el('span', { class: 'badge', text: t({ tr: 'Alıştırma', en: 'Practice' }) }), el('strong', { text: opts.title || t({ tr: 'Kendini dene', en: 'Try it yourself' }) }));
    const score = el('div', { class: 'pr-score', 'aria-live': 'polite' });
    head.append(score);
    box.append(head);
    if (list.length > 1 && list.every((g) => g.label)) {
      const chips = el('div', { class: 'chips', role: 'group', 'aria-label': t({ tr: 'Soru türleri', en: 'Question types' }) });
      list.forEach((g, i) => {
        const c = el('button', { type: 'button', class: 'chip on', 'aria-pressed': 'true', text: g.label });
        c.addEventListener('click', () => {
          if (active[i] && active.filter(Boolean).length === 1) return;
          active[i] = !active[i]; c.classList.toggle('on', active[i]); c.setAttribute('aria-pressed', String(active[i]));
          next();
        });
        chips.append(c);
      });
      box.append(chips);
    }
    const q = el('div', { class: 'pr-q' });
    const form = el('form', { class: 'pr-form', autocomplete: 'off' });
    const inp = el('input', { class: 'input mono', 'aria-label': t({ tr: 'Cevabın', en: 'Your answer' }), placeholder: t({ tr: 'Cevabın…', en: 'Your answer…' }), spellcheck: 'false', autocapitalize: 'off' });
    const check = el('button', { class: 'btn primary', type: 'submit', text: t({ tr: 'Kontrol et', en: 'Check' }) });
    form.append(inp, check);
    const tools = el('div', { class: 'pr-tools' });
    const hintBtn = el('button', { type: 'button', class: 'btn ghost sm', text: t({ tr: 'İpucu', en: 'Hint' }) });
    const showBtn = el('button', { type: 'button', class: 'btn ghost sm', text: t({ tr: 'Çözümü göster', en: 'Show solution' }) });
    const nextBtn = el('button', { type: 'button', class: 'btn ghost sm', text: t({ tr: 'Yeni soru →', en: 'New question →' }) });
    tools.append(hintBtn, showBtn, nextBtn);
    const fb = el('div', { class: 'pr-feedback', 'aria-live': 'polite' });
    box.append(q, form, tools, fb);
    container.append(box);

    function paintScore() {
      score.innerHTML = '<span class="ok">✓ ' + ok + '</span><span class="no">✗ ' + bad + '</span><span title="' + esc(t({ tr: 'Seri (en iyi)', en: 'Streak (best)' })) + '">🔥 ' + streak + (best ? ' <small>(' + best + ')</small>' : '') + '</span>';
    }
    function next() {
      const pool = list.filter((_, i) => active[i]);
      let g, tries = 0;
      do { g = pick(pool).fn(); tries++; } while (cur && g.q === cur.q && tries < 5);
      cur = g; answered = false;
      q.innerHTML = cur.q;
      inp.value = ''; inp.disabled = false; check.disabled = false;
      inp.placeholder = cur.placeholder || t({ tr: 'Cevabın…', en: 'Your answer…' });
      fb.className = 'pr-feedback'; fb.innerHTML = '';
      hintBtn.disabled = !cur.hint;
      check.textContent = t({ tr: 'Kontrol et', en: 'Check' });
      setupCode(q);
    }
    function correct(v) {
      const answers = [].concat(cur.a);
      return answers.some((a) => normalize(a, cur.kind) === normalize(v, cur.kind));
    }
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (answered) { next(); inp.focus(); return; }
      if (!inp.value.trim()) { inp.focus(); return; }
      if (correct(inp.value)) {
        ok++; streak++; best = Math.max(best, streak); answered = true;
        fb.className = 'pr-feedback good';
        fb.innerHTML = '<strong>' + esc(pick(LANG === 'tr' ? ['Doğru!', 'Harika!', 'Aynen öyle!', 'Süper!'] : ['Correct!', 'Nice!', 'Exactly!', 'Great!'])) + '</strong> ' + (cur.explain || '') +
          '<div class="pr-next-hint">' + esc(t({ tr: 'Sonraki soru için Enter’a bas.', en: 'Press Enter for the next question.' })) + '</div>';
        inp.disabled = false; check.textContent = t({ tr: 'Sonraki →', en: 'Next →' });
      } else {
        bad++; streak = 0;
        fb.className = 'pr-feedback wrong';
        fb.innerHTML = '<strong>' + esc(t({ tr: 'Henüz değil.', en: 'Not quite.' })) + '</strong> ' + esc(t({ tr: 'Tekrar dene ya da ipucuna bak.', en: 'Try again or take a hint.' })) + (cur.wrongHint ? ' ' + cur.wrongHint(inp.value) : '');
        inp.select();
      }
      paintScore();
      setupCode(fb);
    });
    hintBtn.addEventListener('click', () => { if (!cur.hint) return; fb.className = 'pr-feedback hint'; fb.innerHTML = '<strong>' + esc(t({ tr: 'İpucu:', en: 'Hint:' })) + '</strong> ' + cur.hint; });
    showBtn.addEventListener('click', () => {
      if (!answered) { streak = 0; }
      answered = true;
      fb.className = 'pr-feedback reveal';
      fb.innerHTML = '<strong>' + esc(t({ tr: 'Cevap:', en: 'Answer:' })) + '</strong> <code>' + esc([].concat(cur.a)[0]) + '</code>' + (cur.explain ? '<div>' + cur.explain + '</div>' : '');
      check.textContent = t({ tr: 'Sonraki →', en: 'Next →' });
      paintScore(); setupCode(fb);
    });
    nextBtn.addEventListener('click', () => { next(); inp.focus(); });
    paintScore(); next();
    return { next };
  }

  /* ---------- Çoktan seçmeli test (HTML'den) ---------- */
  function setupQuizzes(ctx) {
    $$('.quiz', ctx).forEach((quiz) => {
      if (quiz.dataset.ready) return;
      quiz.dataset.ready = '1';
      const qs = $$('.quiz-q', quiz);
      const head = el('div', { class: 'quiz-head' });
      head.append(el('span', { class: 'badge', text: t({ tr: 'Test', en: 'Quiz' }) }), el('strong', { text: quiz.dataset.title || t({ tr: 'Kendini test et', en: 'Test yourself' }) }));
      const sc = el('div', { class: 'quiz-score', 'aria-live': 'polite' });
      head.append(sc);
      quiz.prepend(head);
      let answered = 0, right = 0;
      const paint = () => {
        sc.textContent = answered === qs.length
          ? t({ tr: 'Sonuç: ', en: 'Score: ' }) + right + ' / ' + qs.length + (right === qs.length ? ' 🎉' : '')
          : answered + ' / ' + qs.length;
      };
      qs.forEach((qq, qi) => {
        const correctIdx = +qq.dataset.correct;
        const ul = $('ul, ol', qq);
        const opts = $$('li', ul);
        const grid = el('div', { class: 'quiz-opts' });
        const exp = $('.quiz-explain', qq);
        if (exp) exp.hidden = true;
        const num = el('span', { class: 'quiz-num', text: (qi + 1) + '.' });
        const first = qq.firstElementChild; if (first) first.prepend(num);
        opts.forEach((li, i) => {
          const b = el('button', { type: 'button', class: 'quiz-opt', html: '<span class="qo-key">' + 'ABCDEF'[i] + '</span><span>' + li.innerHTML + '</span>' });
          b.addEventListener('click', () => {
            if (qq.dataset.done) return;
            qq.dataset.done = '1'; answered++;
            if (i === correctIdx) { right++; b.classList.add('correct'); qq.classList.add('was-right'); }
            else { b.classList.add('wrong'); grid.children[correctIdx].classList.add('correct'); qq.classList.add('was-wrong'); }
            $$('button', grid).forEach((x) => (x.disabled = true));
            if (exp) exp.hidden = false;
            paint();
            if (answered === qs.length) reset.hidden = false;
          });
          grid.append(b);
        });
        ul.replaceWith(grid);
      });
      const reset = el('button', { type: 'button', class: 'btn ghost sm quiz-reset', text: t({ tr: 'Testi sıfırla', en: 'Reset quiz' }), hidden: true });
      reset.addEventListener('click', () => {
        answered = 0; right = 0;
        qs.forEach((qq) => { delete qq.dataset.done; qq.classList.remove('was-right', 'was-wrong'); const e = $('.quiz-explain', qq); if (e) e.hidden = true; $$('.quiz-opt', qq).forEach((b) => { b.disabled = false; b.classList.remove('correct', 'wrong'); }); });
        reset.hidden = true; paint();
      });
      quiz.append(reset);
      paint();
    });
  }

  /* ---------- Widget başlığına "Etkileşimli" rozeti ---------- */
  function setupWidgets(ctx) {
    $$('.widget > .widget-title', ctx).forEach((h) => {
      if (h.dataset.ready) return;
      h.dataset.ready = '1';
      h.prepend(el('span', { class: 'badge', text: t(UI.interactive) }));
    });
  }

  /* ---------- Kod adım adım (C / Python izleyici) ---------- */
  /**
   * codeStepper(container, { lang, code, steps: [{ line, note(html), state(html) | render(el) }] , after(i, stateEl) })
   */
  function codeStepper(container, o) {
    const wrap = el('div', { class: 'cstep' });
    const codeBox = el('pre', { class: 'cstep-code' });
    const lines = o.code.replace(/^\n/, '').replace(/\s+$/, '').split('\n');
    codeBox.innerHTML = lines.map((l, i) => '<span class="cl" data-l="' + (i + 1) + '"><span class="cl-n">' + (i + 1) + '</span>' + (highlight(l, o.lang) || ' ') + '</span>').join('');
    const right = el('div', { class: 'cstep-right' });
    const state = el('div', { class: 'cstep-state' });
    const note = el('div', { class: 'cstep-note', 'aria-live': 'polite' });
    right.append(state, note);
    wrap.append(codeBox, right);
    container.append(wrap);
    const api = stepper(container, {
      count: o.steps.length,
      interval: o.interval || 2200,
      render(i) {
        const s = o.steps[i];
        $$('.cl', codeBox).forEach((c) => {
          const n = +c.dataset.l;
          c.classList.toggle('cur', [].concat(s.line).includes(n));
          c.classList.toggle('past', !![].concat(s.line).every((x) => n < x) && n <= Math.max(...[].concat(s.line)));
        });
        if (s.render) s.render(state); else state.innerHTML = s.state || '';
        note.innerHTML = s.note || '';
        o.after && o.after(i, state, note);
      },
    });
    return api;
  }

  /* ---------- dışa aç ---------- */
  window.NS = {
    LANG, ROOT, t, esc, el, $, $$, rand, pick, shuffle, fmt, toBase, pad, sub, group, baseClass, baseName,
    invalidDigit, digitValue, DIGITS, store, reduceMotion, CHAPTERS,
    stepper, bits, placeValue, practice, highlight, setupCode, setupTabs, setupQuizzes, codeStepper, normalize,
  };

  function init() {
    buildLayout();
    setupWidgets(document);
    setupCode(document);
    setupTabs(document);
    setupQuizzes(document);
    document.dispatchEvent(new Event('ns:ready'));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
