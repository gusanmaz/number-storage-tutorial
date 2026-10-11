/* Bölüm — Değişkenler ve referanslar: isimler → nesneler, oklarla adım adım izleyici */
(function () {
  const { t, $, $$, el, esc } = NS;

  /* durum: { frames: [{ name, vars: [[isim, nesneId | {val}]] }], objs: [[id, tür, içerik]] , out } */
  const ADDR = { o1: '0x7f3a10', o2: '0x7f3a48', o3: '0x7f3a80', o4: '0x7f3ab8', o5: '0x7f3af0', o6: '0x7f3b28', f: '0x7f3c00' };
  function renderState(box, s) {
    const reach = new Set();
    const walk = (id) => { if (reach.has(id)) return; reach.add(id); const o = s.objs.find((x) => x[0] === id); if (o && Array.isArray(o[2])) o[2].forEach((it) => it && it.ref && walk(it.ref)); };
    s.frames.forEach((f) => f.vars.forEach(([, r]) => typeof r === 'string' && walk(r)));
    let h = '<div class="rv"><svg class="rv-svg" aria-hidden="true"><defs><marker id="rv-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--accent)"/></marker></defs></svg>';
    h += '<div class="rv-col"><div class="rv-h">' + t({ tr: 'İsimler', en: 'Names' }) + '</div>';
    s.frames.forEach((f) => {
      h += '<div class="rv-frame' + (f.fn ? ' fn' : '') + '"><div class="rv-fname">' + esc(f.name) + '</div>';
      if (!f.vars.length) h += '<div class="muted" style="font-size:.8rem">—</div>';
      f.vars.forEach(([n, r]) => {
        h += typeof r === 'string'
          ? '<div class="rv-var" data-ref="' + r + '"><span>' + esc(n) + '</span><i class="rv-dot"></i></div>'
          : '<div class="rv-var prim"><span>' + esc(n) + '</span><b>' + esc(r.val) + '</b></div>';
      });
      h += '</div>';
    });
    h += '</div><div class="rv-col heap"><div class="rv-h">' + t({ tr: 'Nesneler (bellek)', en: 'Objects (memory)' }) + '</div>';
    s.objs.forEach(([id, kind, v]) => {
      const dead = !reach.has(id);
      let body;
      if (Array.isArray(v)) body = '<div class="rv-list">' + (v.length ? v.map((it, i) => '<span class="rv-slot"' + (it && it.ref ? ' data-ref="' + it.ref + '"' : '') + '><small>' + i + '</small>' + (it && it.ref ? '<i class="rv-dot"></i>' : esc(String(it))) + '</span>').join('') : '<span class="muted">[ ]</span>') + '</div>';
      else body = '<div class="rv-val">' + esc(String(v)) + '</div>';
      h += '<div class="rv-obj' + (dead ? ' dead' : '') + (s.flash === id ? ' flash' : '') + '" data-id="' + id + '"><div class="rv-otop"><span>' + kind + '</span><span class="mono">' + (ADDR[id] || '') + '</span></div>' + body + '</div>';
    });
    h += '</div></div>' + (s.out ? '<div class="out-line">' + esc(s.out) + '</div>' : '');
    box.innerHTML = h;
    requestAnimationFrame(() => arrows(box));
  }
  function arrows(box) {
    const rv = $('.rv', box); if (!rv) return;
    const svg = $('.rv-svg', rv), R = rv.getBoundingClientRect();
    svg.setAttribute('width', R.width); svg.setAttribute('height', R.height);
    let p = '';
    $$('[data-ref]', rv).forEach((src) => {
      const dot = $('.rv-dot', src), tgt = $('.rv-obj[data-id="' + src.dataset.ref + '"]', rv);
      if (!dot || !tgt) return;
      const a = dot.getBoundingClientRect(), b = tgt.getBoundingClientRect();
      const x1 = a.left + a.width / 2 - R.left, y1 = a.top + a.height / 2 - R.top;
      const inHeap = src.closest('.heap');
      let x2, y2;
      if (inHeap) {
        // yığın içi oklar sağ kenardan dolaşır
        const col = src.closest('.heap').getBoundingClientRect();
        const xr = col.right - R.left - 30, edge = xr + 26;
        x2 = b.right - R.left; y2 = b.top + 16 - R.top;
        p += '<path d="M' + x1 + ' ' + y1 + ' L' + x1 + ' ' + (y1 + 10) + ' C' + x1 + ' ' + (y1 + 22) + ' ' + edge + ' ' + (y1 + 22) + ' ' + edge + ' ' + (y1 + 40) + ' L' + edge + ' ' + (y2 - 14 * Math.sign(y2 - y1 - 40 || 1)) + ' C' + edge + ' ' + y2 + ' ' + (x2 + 14) + ' ' + y2 + ' ' + x2 + ' ' + y2 + '" marker-end="url(#rv-ah)" stroke-opacity=".75"/>';
      }
      else { x2 = b.left - R.left; y2 = b.top + b.height / 2 - R.top; const dx = Math.max(30, (x2 - x1) / 2); p += '<path d="M' + x1 + ' ' + y1 + ' C' + (x1 + dx) + ' ' + y1 + ' ' + (x2 - dx) + ' ' + y2 + ' ' + x2 + ' ' + y2 + '" marker-end="url(#rv-ah)"/>'; }
    });
    svg.insertAdjacentHTML('beforeend', '<g fill="none" stroke="var(--accent)" stroke-width="2">' + p + '</g>');
  }
  const ask = (q, opts, correct, why) => '<div class="mq" data-correct="' + correct + '"><div class="mq-q">🤔 ' + q + '</div><div class="mq-opts">' + opts.map((o, i) => '<button type="button" class="btn sm" data-i="' + i + '">' + esc(o) + '</button>').join('') + '</div><div class="mq-why" hidden>' + why + '</div></div>';
  const wireAsk = (noteEl) => {
    const mq = $('.mq', noteEl); if (!mq) return;
    $$('button', mq).forEach((b) => b.addEventListener('click', () => {
      const ok = +b.dataset.i === +mq.dataset.correct;
      $$('button', mq).forEach((x) => { x.disabled = true; if (+x.dataset.i === +mq.dataset.correct) x.classList.add('on'); });
      b.classList.add(ok ? 'on' : 'bad-btn');
      const w = $('.mq-why', mq); w.hidden = false; w.innerHTML = (ok ? '✓ ' : '✗ ') + w.innerHTML;
    }));
  };

  const G = (vars) => [{ name: t({ tr: 'genel (global)', en: 'global' }), vars }];
  const SC = [
    {
      label: t({ tr: 'Sayılar (değiştirilemez)', en: 'Numbers (immutable)' }), lang: 'py',
      code: 'a = 10\nb = a\na = a + 5\nprint(a, b)',
      steps: [
        { line: 1, s: { frames: G([['a', 'o1']]), objs: [['o1', 'int', 10]] }, note: t({ tr: 'Bellekte değeri 10 olan bir <code>int</code> nesnesi oluştu ve <code>a</code> ismi ona bağlandı.', en: 'An <code>int</code> object with value 10 is created and the name <code>a</code> is bound to it.' }) },
        { line: 2, s: { frames: G([['a', 'o1'], ['b', 'o1']]), objs: [['o1', 'int', 10]] }, note: t({ tr: '<code>b = a</code> yeni bir 10 oluşturmaz: <code>b</code> de <em>aynı</em> nesneye bağlanır.', en: '<code>b = a</code> creates no new 10: <code>b</code> is bound to the <em>same</em> object.' }) + ask(t({ tr: '<code>a = a + 5</code> çalışınca <code>b</code> ne olur?', en: 'After <code>a = a + 5</code>, what is <code>b</code>?' }), ['10', '15'], 0, t({ tr: 'int değiştirilemez: a + 5 yeni bir nesne (15) üretir, sadece <code>a</code> etiketi taşınır.', en: 'ints are immutable: a + 5 makes a new object (15); only the label <code>a</code> moves.' })) },
        { line: 3, s: { frames: G([['a', 'o2'], ['b', 'o1']]), objs: [['o1', 'int', 10], ['o2', 'int', 15]], flash: 'o2' }, note: t({ tr: '10 nesnesi değişmedi. 15 için <strong>yeni</strong> bir nesne oluştu ve <code>a</code> oraya taşındı. <code>b</code> hâlâ 10’u gösteriyor.', en: 'The 10 object did not change. A <strong>new</strong> object 15 was created and <code>a</code> moved there. <code>b</code> still points to 10.' }) },
        { line: 4, s: { frames: G([['a', 'o2'], ['b', 'o1']]), objs: [['o1', 'int', 10], ['o2', 'int', 15]], out: '15 10' }, note: t({ tr: 'Değiştirilemez nesneleri paylaşmak her zaman güvenlidir.', en: 'Sharing immutable objects is always safe.' }) },
      ],
    },
    {
      label: t({ tr: 'Liste (değiştirilebilir)', en: 'List (mutable)' }), lang: 'py',
      code: 'l1 = [1, 2, 3]\nl2 = l1\nl2.append(4)\nprint(l1)\nl3 = l1.copy()\nl3.append(5)\nprint(l1, l3)',
      steps: [
        { line: 1, s: { frames: G([['l1', 'o1']]), objs: [['o1', 'list', [1, 2, 3]]] }, note: t({ tr: 'Bir liste nesnesi oluştu; <code>l1</code> ona bağlı.', en: 'A list object is created; <code>l1</code> is bound to it.' }) },
        { line: 2, s: { frames: G([['l1', 'o1'], ['l2', 'o1']]), objs: [['o1', 'list', [1, 2, 3]]] }, note: t({ tr: '<code>l2 = l1</code>: kopya yok, aynı listeye ikinci bir isim.', en: '<code>l2 = l1</code>: no copy, just a second name for the same list.' }) + ask(t({ tr: '<code>l2.append(4)</code> sonrasında <code>l1</code> ne olur?', en: 'After <code>l2.append(4)</code>, what is <code>l1</code>?' }), ['[1, 2, 3]', '[1, 2, 3, 4]'], 1, t({ tr: 'Tek bir liste var ve append onu yerinde değiştirir.', en: 'There is only one list and append changes it in place.' })) },
        { line: 3, s: { frames: G([['l1', 'o1'], ['l2', 'o1']]), objs: [['o1', 'list', [1, 2, 3, 4]]], flash: 'o1' }, note: t({ tr: 'Liste <strong>yerinde</strong> değişti. İki isim de aynı nesneyi gösterdiği için ikisi de değişikliği görür.', en: 'The list changed <strong>in place</strong>. Both names see the change because they point to the same object.' }) },
        { line: 4, s: { frames: G([['l1', 'o1'], ['l2', 'o1']]), objs: [['o1', 'list', [1, 2, 3, 4]]], out: '[1, 2, 3, 4]' }, note: t({ tr: '<code>l1</code>’e hiç dokunmadığımız hâlde 4 eklenmiş görünüyor.', en: 'We never touched <code>l1</code>, yet it has the 4.' }) },
        { line: 5, s: { frames: G([['l1', 'o1'], ['l2', 'o1'], ['l3', 'o2']]), objs: [['o1', 'list', [1, 2, 3, 4]], ['o2', 'list', [1, 2, 3, 4]]], flash: 'o2' }, note: t({ tr: '<code>copy()</code> <strong>yeni</strong> bir liste nesnesi oluşturur.', en: '<code>copy()</code> creates a <strong>new</strong> list object.' }) },
        { line: 6, s: { frames: G([['l1', 'o1'], ['l2', 'o1'], ['l3', 'o2']]), objs: [['o1', 'list', [1, 2, 3, 4]], ['o2', 'list', [1, 2, 3, 4, 5]]], flash: 'o2' }, note: t({ tr: 'Sadece kopya değişti.', en: 'Only the copy changed.' }) },
        { line: 7, s: { frames: G([['l1', 'o1'], ['l2', 'o1'], ['l3', 'o2']]), objs: [['o1', 'list', [1, 2, 3, 4]], ['o2', 'list', [1, 2, 3, 4, 5]]], out: '[1, 2, 3, 4] [1, 2, 3, 4, 5]' }, note: t({ tr: 'Gerçek bağımsızlık için kopya gerekir.', en: 'Real independence requires a copy.' }) },
      ],
    },
    {
      label: t({ tr: 'Fonksiyon parametresi', en: 'Function argument' }), lang: 'py',
      code: 'def ekle(lst):\n    lst.append(99)\n    lst = [0]\n\nsayilar = [1, 2]\nekle(sayilar)\nprint(sayilar)',
      steps: [
        { line: 1, s: { frames: G([['ekle', 'f']]), objs: [['f', 'function', 'ekle(lst)']] }, note: t({ tr: 'Fonksiyon da bir nesnedir; <code>ekle</code> ismi ona bağlanır. Gövde henüz çalışmadı.', en: 'A function is an object too; the name <code>ekle</code> is bound to it. The body has not run yet.' }) },
        { line: 5, s: { frames: G([['ekle', 'f'], ['sayilar', 'o1']]), objs: [['f', 'function', 'ekle(lst)'], ['o1', 'list', [1, 2]]] }, note: t({ tr: 'Liste oluştu ve <code>sayilar</code> ona bağlandı.', en: 'The list is created and bound to <code>sayilar</code>.' }) },
        { line: [6, 1], s: { frames: G([['ekle', 'f'], ['sayilar', 'o1']]).concat([{ name: 'ekle()', fn: true, vars: [['lst', 'o1']] }]), objs: [['f', 'function', 'ekle(lst)'], ['o1', 'list', [1, 2]]] }, note: t({ tr: 'Fonksiyon çağrıldı ve yeni bir çerçeve (frame) açıldı. Parametre <code>lst</code>, <strong>aynı listeye</strong> bağlandı; liste kopyalanmadı.', en: 'The function is called and a new frame opens. The parameter <code>lst</code> is bound to <strong>the same list</strong>; nothing was copied.' }) },
        { line: 2, s: { frames: G([['ekle', 'f'], ['sayilar', 'o1']]).concat([{ name: 'ekle()', fn: true, vars: [['lst', 'o1']] }]), objs: [['f', 'function', 'ekle(lst)'], ['o1', 'list', [1, 2, 99]]], flash: 'o1' }, note: t({ tr: 'Liste yerinde değişti; bu değişiklik dışarıdan da görülür.', en: 'The list changed in place; the caller will see it.' }) + ask(t({ tr: '<code>lst = [0]</code> satırından sonra dışarıdaki <code>sayilar</code> ne olur?', en: 'After <code>lst = [0]</code>, what is the outer <code>sayilar</code>?' }), ['[0]', '[1, 2, 99]'], 1, t({ tr: 'Atama sadece <code>lst</code> etiketini yeni listeye taşır; <code>sayilar</code> etkilenmez.', en: 'Assignment only moves the <code>lst</code> label to a new list; <code>sayilar</code> is unaffected.' })) },
        { line: 3, s: { frames: G([['ekle', 'f'], ['sayilar', 'o1']]).concat([{ name: 'ekle()', fn: true, vars: [['lst', 'o2']] }]), objs: [['f', 'function', 'ekle(lst)'], ['o1', 'list', [1, 2, 99]], ['o2', 'list', [0]]], flash: 'o2' }, note: t({ tr: 'Yeni bir liste oluştu ve yalnızca yerel <code>lst</code> ismi oraya taşındı.', en: 'A new list is created and only the local name <code>lst</code> moves to it.' }) },
        { line: 6, s: { frames: G([['ekle', 'f'], ['sayilar', 'o1']]), objs: [['f', 'function', 'ekle(lst)'], ['o1', 'list', [1, 2, 99]], ['o2', 'list', [0]]] }, note: t({ tr: 'Fonksiyon bitti, çerçevesi silindi. <code>[0]</code> listesini artık kimse göstermiyor: çöp toplayıcı onu silecek.', en: 'The function returned and its frame is gone. Nobody points to <code>[0]</code> anymore: the garbage collector will free it.' }) },
        { line: 7, s: { frames: G([['ekle', 'f'], ['sayilar', 'o1']]), objs: [['f', 'function', 'ekle(lst)'], ['o1', 'list', [1, 2, 99]]], out: '[1, 2, 99]' }, note: t({ tr: 'Ders: fonksiyon parametresi üzerinde <em>yerinde değişiklik</em> dışarıyı etkiler, <em>yeniden atama</em> etkilemez.', en: 'Lesson: <em>mutating</em> a parameter affects the caller; <em>reassigning</em> it does not.' }) },
      ],
    },
    {
      label: t({ tr: 'JS: ilkel ve nesne', en: 'JS: primitive vs object' }), lang: 'js',
      code: 'let a = 10;\nlet b = a;\na = 20;\nconst o1 = { puan: 5 };\nconst o2 = o1;\no2.puan = 9;\nconsole.log(b, o1.puan);',
      steps: [
        { line: 1, s: { frames: G([['a', { val: '10' }]]), objs: [] }, note: t({ tr: 'JavaScript’te ilkel değerleri (sayı, metin, boolean) değişkenin içinde duran değerler gibi düşünebilirsin.', en: 'In JavaScript you can think of primitives (number, string, boolean) as values stored right in the variable.' }) },
        { line: 2, s: { frames: G([['a', { val: '10' }], ['b', { val: '10' }]]), objs: [] }, note: t({ tr: 'Değer kopyalandı: iki bağımsız 10.', en: 'The value is copied: two independent 10s.' }) },
        { line: 3, s: { frames: G([['a', { val: '20' }], ['b', { val: '10' }]]), objs: [] }, note: t({ tr: '<code>b</code> etkilenmedi.', en: '<code>b</code> is unaffected.' }) },
        { line: 4, s: { frames: G([['a', { val: '20' }], ['b', { val: '10' }], ['o1', 'o1']]), objs: [['o1', 'Object', ['puan: 5']]] }, note: t({ tr: 'Nesneler bellekte ayrı durur; değişken onun <strong>referansını</strong> tutar.', en: 'Objects live separately in memory; the variable holds a <strong>reference</strong>.' }) },
        { line: 5, s: { frames: G([['a', { val: '20' }], ['b', { val: '10' }], ['o1', 'o1'], ['o2', 'o1']]), objs: [['o1', 'Object', ['puan: 5']]] }, note: t({ tr: 'Referans kopyalandı, nesne değil.', en: 'The reference was copied, not the object.' }) + ask(t({ tr: '<code>o2.puan = 9</code> sonrasında <code>o1.puan</code> kaç olur?', en: 'After <code>o2.puan = 9</code>, what is <code>o1.puan</code>?' }), ['5', '9'], 1, t({ tr: 'Tek bir nesne var.', en: 'There is only one object.' })) },
        { line: 6, s: { frames: G([['a', { val: '20' }], ['b', { val: '10' }], ['o1', 'o1'], ['o2', 'o1']]), objs: [['o1', 'Object', ['puan: 9']]], flash: 'o1' }, note: t({ tr: '<code>const</code> olmasına rağmen nesne değişti: const sadece ismin yeniden bağlanmasını engeller.', en: 'Even though it is <code>const</code>, the object changed: const only prevents rebinding the name.' }) },
        { line: 7, s: { frames: G([['a', { val: '20' }], ['b', { val: '10' }], ['o1', 'o1'], ['o2', 'o1']]), objs: [['o1', 'Object', ['puan: 9']]], out: '10 9' }, note: '' },
      ],
    },
    {
      label: t({ tr: '== ve is', en: '== vs is' }), lang: 'py',
      code: 'a = [1, 2]\nb = [1, 2]\nc = a\nprint(a == b, a is b, a is c)',
      steps: [
        { line: 1, s: { frames: G([['a', 'o1']]), objs: [['o1', 'list', [1, 2]]] }, note: '' },
        { line: 2, s: { frames: G([['a', 'o1'], ['b', 'o2']]), objs: [['o1', 'list', [1, 2]], ['o2', 'list', [1, 2]]] }, note: t({ tr: 'İçeriği aynı ama <strong>ayrı</strong> bir liste. Adreslere bak!', en: 'Same contents but a <strong>separate</strong> list. Look at the addresses!' }) },
        { line: 3, s: { frames: G([['a', 'o1'], ['b', 'o2'], ['c', 'o1']]), objs: [['o1', 'list', [1, 2]], ['o2', 'list', [1, 2]]] }, note: ask(t({ tr: '<code>a is b</code> sonucu?', en: 'What is <code>a is b</code>?' }), ['True', 'False'], 1, t({ tr: '<code>is</code> aynı nesne mi diye sorar; a ve b farklı nesneler.', en: '<code>is</code> asks “same object?”; a and b are different objects.' })) },
        { line: 4, s: { frames: G([['a', 'o1'], ['b', 'o2'], ['c', 'o1']]), objs: [['o1', 'list', [1, 2]], ['o2', 'list', [1, 2]]], out: 'True False True' }, note: t({ tr: '<code>==</code> içerik, <code>is</code> kimlik (adres) karşılaştırır.', en: '<code>==</code> compares contents, <code>is</code> compares identity (address).' }) },
      ],
    },
    {
      label: t({ tr: 'Sığ kopya tuzağı', en: 'Shallow copy trap' }), lang: 'py',
      code: 'a = [[1, 2], [3]]\nb = a.copy()\nb.append([4])\nb[0].append(9)\nprint(a)',
      steps: [
        { line: 1, s: { frames: G([['a', 'o1']]), objs: [['o1', 'list', [{ ref: 'o2' }, { ref: 'o3' }]], ['o2', 'list', [1, 2]], ['o3', 'list', [3]]] }, note: t({ tr: 'Liste içinde liste: dış listenin elemanları da birer <strong>referanstır</strong>.', en: 'A list of lists: the outer list’s items are <strong>references</strong> too.' }) },
        { line: 2, s: { frames: G([['a', 'o1'], ['b', 'o4']]), objs: [['o1', 'list', [{ ref: 'o2' }, { ref: 'o3' }]], ['o4', 'list', [{ ref: 'o2' }, { ref: 'o3' }]], ['o2', 'list', [1, 2]], ['o3', 'list', [3]]], flash: 'o4' }, note: t({ tr: '<code>copy()</code> sadece <strong>dış</strong> listeyi kopyalar. Yeni liste aynı iç listeleri gösterir. Buna <em>sığ kopya</em> denir.', en: '<code>copy()</code> copies only the <strong>outer</strong> list. The new list points to the same inner lists. This is a <em>shallow copy</em>.' }) },
        { line: 3, s: { frames: G([['a', 'o1'], ['b', 'o4']]), objs: [['o1', 'list', [{ ref: 'o2' }, { ref: 'o3' }]], ['o4', 'list', [{ ref: 'o2' }, { ref: 'o3' }, { ref: 'o5' }]], ['o2', 'list', [1, 2]], ['o3', 'list', [3]], ['o5', 'list', [4]]], flash: 'o4' }, note: t({ tr: '<code>b</code>’ye eleman eklemek <code>a</code>’yı etkilemez; dış listeler farklı.', en: 'Appending to <code>b</code> does not affect <code>a</code>; the outer lists differ.' }) + ask(t({ tr: '<code>b[0].append(9)</code> <code>a</code>’yı etkiler mi?', en: 'Does <code>b[0].append(9)</code> affect <code>a</code>?' }), [t({ tr: 'Evet', en: 'Yes' }), t({ tr: 'Hayır', en: 'No' })], 0, t({ tr: '<code>b[0]</code> ve <code>a[0]</code> aynı iç listeyi gösteriyor.', en: '<code>b[0]</code> and <code>a[0]</code> point to the same inner list.' })) },
        { line: 4, s: { frames: G([['a', 'o1'], ['b', 'o4']]), objs: [['o1', 'list', [{ ref: 'o2' }, { ref: 'o3' }]], ['o4', 'list', [{ ref: 'o2' }, { ref: 'o3' }, { ref: 'o5' }]], ['o2', 'list', [1, 2, 9]], ['o3', 'list', [3]], ['o5', 'list', [4]]], flash: 'o2' }, note: t({ tr: 'Paylaşılan iç liste değişti.', en: 'The shared inner list changed.' }) },
        { line: 5, s: { frames: G([['a', 'o1'], ['b', 'o4']]), objs: [['o1', 'list', [{ ref: 'o2' }, { ref: 'o3' }]], ['o4', 'list', [{ ref: 'o2' }, { ref: 'o3' }, { ref: 'o5' }]], ['o2', 'list', [1, 2, 9]], ['o3', 'list', [3]], ['o5', 'list', [4]]], out: '[[1, 2, 9], [3]]' }, note: t({ tr: 'Tamamen bağımsız kopya için <code>copy.deepcopy(a)</code> (Python) ya da <code>structuredClone(a)</code> (JS) kullan.', en: 'For a fully independent copy use <code>copy.deepcopy(a)</code> (Python) or <code>structuredClone(a)</code> (JS).' }) },
      ],
    },
  ];

  // İngilizce sürümde koddaki Türkçe isimleri çevir
  if (NS.LANG === 'en') {
    const MAP = [[/\bekle\b/g, 'add'], [/\bsayilar\b/g, 'nums'], [/\bpuan\b/g, 'score']];
    const tr = (v) => (typeof v === 'string' ? MAP.reduce((acc, [re, w]) => acc.replace(re, w), v) : Array.isArray(v) ? v.map(tr) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, tr(x)])) : v);
    SC.forEach((sc) => { sc.code = tr(sc.code); sc.steps = tr(sc.steps); });
  }

  let current = null;
  function mount(i) {
    const box = $('#viz-box');
    box.innerHTML = '';
    const sc = SC[i];
    current = NS.codeStepper(box, {
      lang: sc.lang, code: sc.code, interval: 2600,
      steps: sc.steps.map((st) => ({ line: st.line, note: st.note, render: (el2) => renderState(el2, st.s) })),
      after: (_, stateEl, noteEl) => wireAsk(noteEl),
    });
  }
  SC.forEach((sc, i) => {
    const c = el('button', { type: 'button', class: 'chip' + (i === 0 ? ' on' : ''), 'aria-pressed': String(i === 0), text: sc.label });
    c.addEventListener('click', () => { $$('#viz-chips .chip').forEach((x) => { x.classList.toggle('on', x === c); x.setAttribute('aria-pressed', String(x === c)); }); mount(i); });
    $('#viz-chips').append(c);
  });
  mount(0);
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => arrows($('#viz-box .cstep-state')), 120); });
  void current;
})();
