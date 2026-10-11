/* Bölüm 2 — Saymak */
(function () {
  const { t, $, $$, el, esc, fmt, pad, toBase, group, lamps, knob, out, steps, tryIt } = NS;
  const D = '0123456789ABCDEF';
  const sub = (b) => '<span class="sub">' + b + '</span>';

  /* ---------- Şekil 1: patlayan noktalar ---------- */
  let base = 10, cnt = [0, 0, 0, 0, 0, 0], busy = false;
  const machine = $('#dots'), dout = $('#dots-out');
  const nBoxes = () => (base <= 3 ? 6 : 5);
  function total() { return cnt.reduce((a, c, k) => a + c * Math.pow(base, k), 0); }
  function setTotal(n) { cnt = [0, 0, 0, 0, 0, 0]; let k = 0; while (n > 0 && k < 6) { cnt[k] = k === nBoxes() - 1 ? n : n % base; n = k === nBoxes() - 1 ? 0 : Math.floor(n / base); k++; } }
  function drawDots(boom, fresh) {
    const n = nBoxes();
    let h = '';
    for (let k = n - 1; k >= 0; k--) {
      const c = cnt[k], pv = Math.pow(base, k);
      const cols = Math.ceil(Math.sqrt(Math.max(base, 4)));
      h += '<div class="dbox' + (boom === k ? ' boom' : '') + (fresh === k ? ' fresh' : '') + '"><div class="dbox-h">' + base + '<sup>' + k + '</sup> = ' + fmt(pv) + '</div>' +
        '<div class="dbox-dots" style="grid-template-columns:repeat(' + cols + ',1fr)">' + Array.from({ length: Math.min(c, 40) }, (_, i) => '<i class="' + (fresh === k && i === c - 1 ? 'pop' : '') + '"></i>').join('') + (c > 40 ? '<b>+' + (c - 40) + '</b>' : '') + '</div>' +
        '<div class="dbox-d">' + (c < 16 ? D[c] : c) + '</div></div>';
    }
    machine.innerHTML = h;
    const digits = cnt.slice(0, n).reverse().join(',').replace(/^(0,)+(?=\d)/, '').split(',').map((c) => (+c < 16 ? D[+c] : '(' + c + ')')).join('');
    dout.innerHTML = t({ tr: 'Yazılışı: ', en: 'Written: ' }) + '<b class="' + (base === 2 ? 'b' : base === 16 ? 'h' : 'd') + '">' + digits + '</b>' + sub(base) + ' &nbsp;=&nbsp; <b class="d">' + fmt(total()) + '</b> ' + t({ tr: 'nokta', en: 'dots' });
  }
  function addDot(then) {
    cnt[0]++;
    drawDots(null, 0);
    let k = 0;
    const chain = () => {
      if (cnt[k] >= base && k < nBoxes() - 1) {
        drawDots(k);
        setTimeout(() => { cnt[k] -= base; cnt[k + 1]++; drawDots(null, k + 1); k++; setTimeout(chain, 260); }, 320);
      } else then && then();
    };
    setTimeout(chain, 120);
  }
  function addMany(n) {
    if (busy) return; busy = true; ctlState();
    const go = (i) => { if (i >= n) { busy = false; ctlState(); return; } addDot(() => setTimeout(() => go(i + 1), 60)); };
    go(0);
  }
  const ctl = $('#dots-ctl');
  const b1 = el('button', { class: 'btn fill', type: 'button', text: t({ tr: '+1 nokta', en: '+1 dot' }), onclick: () => addMany(1) });
  const b5 = el('button', { class: 'btn', type: 'button', text: t({ tr: '+5 nokta', en: '+5 dots' }), onclick: () => addMany(5) });
  const bR = el('button', { class: 'btn ghost', type: 'button', text: t({ tr: 'Boşalt', en: 'Empty' }), onclick: () => { if (busy) return; cnt = [0, 0, 0, 0, 0, 0]; drawDots(); } });
  const loadIn = el('input', { class: 'inp', type: 'number', min: 0, max: 99999, value: 13, style: 'width:6.5rem', 'aria-label': t({ tr: 'yüklenecek sayı', en: 'number to load' }) });
  const bL = el('button', { class: 'btn ghost', type: 'button', text: t({ tr: 'Bu kadar nokta koy', en: 'Load this many' }), onclick: () => { if (busy) return; setTotal(Math.max(0, Math.min(99999, +loadIn.value || 0))); drawDots(); } });
  ctl.append(b1, b5, bR, loadIn, bL);
  function ctlState() { [b1, b5, bR, bL].forEach((b) => (b.disabled = busy)); }
  knob($('#k-base'), { value: 10, min: 2, max: 16, onChange: (v) => { const T = total(); base = v; setTotal(T); drawDots(); } });
  drawDots();

  /* ---------- Şekil 2: ikili sayaç + dalga diyagramı ---------- */
  let ci = 0, timer = null;
  const CL = lamps($('#cnt-lamps'), { n: 4, value: 0, ro: true, weight: (i) => String(2 ** (3 - i)), label: 'counter' });
  function wave() {
    const W = 640, rowH = 34, H = rowH * 4 + 26, x0 = 46, w = (W - x0 - 10) / 16;
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="svgfig" style="width:100%;max-width:700px;margin-top:1rem">';
    s += '<rect x="' + (x0 + ci * w) + '" y="0" width="' + w + '" height="' + (rowH * 4) + '" fill="var(--on)" opacity=".15"/>';
    for (let r = 0; r < 4; r++) {
      const bit = 3 - r, y0 = r * rowH + 6, yH = y0 + 4, yL = y0 + rowH - 12;
      s += '<text x="' + (x0 - 10) + '" y="' + (y0 + rowH / 2) + '" text-anchor="end" font-family="var(--mono)" font-size="12" fill="var(--ink-3)">' + 2 ** bit + '</text>';
      let d = '';
      for (let i = 0; i < 16; i++) { const v = (i >> bit) & 1, y = v ? yH : yL; d += (i ? 'L' : 'M') + (x0 + i * w) + ' ' + y + 'L' + (x0 + (i + 1) * w) + ' ' + y; }
      s += '<path d="' + d + '" fill="none" stroke="var(--on-deep)" stroke-width="2"/>';
    }
    for (let i = 0; i < 16; i++) s += '<text x="' + (x0 + (i + 0.5) * w) + '" y="' + (H - 6) + '" text-anchor="middle" font-family="var(--mono)" font-size="11" fill="' + (i === ci ? 'var(--ink)' : 'var(--ink-3)') + '" font-weight="' + (i === ci ? 700 : 400) + '">' + i + '</text>';
    $('#cnt-wave').innerHTML = s + '</svg>';
  }
  function drawCnt() { CL.set(ci, true); $('#cnt-out').innerHTML = '<b class="b">' + pad(ci.toString(2), 4) + '</b>' + sub(2) + ' = <b class="d">' + ci + '</b>'; wave(); }
  const playB = el('button', { class: 'btn fill', type: 'button' });
  const setPlay = () => { playB.textContent = timer ? t({ tr: '⏸ Durdur', en: '⏸ Pause' }) : t({ tr: '▶ Say', en: '▶ Count' }); };
  playB.onclick = () => { if (timer) { clearInterval(timer); timer = null; } else timer = setInterval(() => { ci = (ci + 1) % 16; drawCnt(); }, 650); setPlay(); };
  $('#cnt-ctl').append(el('button', { class: 'btn', type: 'button', text: '−1', onclick: () => { ci = (ci + 15) % 16; drawCnt(); } }), playB, el('button', { class: 'btn', type: 'button', text: '+1', onclick: () => { ci = (ci + 1) % 16; drawCnt(); } }));
  setPlay(); drawCnt();

  /* ---------- Şekil 3: terazi ---------- */
  let target = 42;
  const W8 = [128, 64, 32, 16, 8, 4, 2, 1], used = W8.map(() => 0);
  const wbox = $('#scale-w');
  W8.forEach((w, i) => wbox.append(el('button', { type: 'button', class: 'wt', 'data-i': i, 'aria-pressed': 'false', html: '<b>' + w + '</b>', onclick: () => { used[i] ^= 1; drawScale(); } })));
  wbox.append(el('button', { class: 'btn ghost sm', type: 'button', text: t({ tr: 'Kefeyi boşalt', en: 'Clear pan' }), onclick: () => { used.fill(0); drawScale(); } }));
  function drawScale() {
    const placed = W8.reduce((a, w, i) => a + w * used[i], 0), diff = placed - target;
    const ang = Math.max(-13, Math.min(13, diff / 8));
    const W = 560, cx = 280, top = 70, arm = 190;
    const rad = ang * Math.PI / 180, lx = cx - arm * Math.cos(rad), ly = top - arm * Math.sin(rad), rx = cx + arm * Math.cos(rad), ry = top + arm * Math.sin(rad);
    let s = '<svg viewBox="0 0 ' + W + ' 250" class="svgfig" style="width:100%;max-width:600px">';
    s += '<path d="M' + cx + ' ' + top + ' L' + (cx - 34) + ' 232 H' + (cx + 34) + ' Z" fill="var(--rule-2)"/><rect x="' + (cx - 70) + '" y="230" width="140" height="10" rx="4" fill="var(--ink-3)"/>';
    s += '<line x1="' + lx + '" y1="' + ly + '" x2="' + rx + '" y2="' + ry + '" stroke="var(--ink)" stroke-width="6" stroke-linecap="round"/><circle cx="' + cx + '" cy="' + top + '" r="8" fill="var(--ink)"/>';
    const pan = (x, y) => '<line x1="' + x + '" y1="' + y + '" x2="' + (x - 46) + '" y2="' + (y + 70) + '" stroke="var(--ink-3)" stroke-width="1.5"/><line x1="' + x + '" y1="' + y + '" x2="' + (x + 46) + '" y2="' + (y + 70) + '" stroke="var(--ink-3)" stroke-width="1.5"/><path d="M' + (x - 58) + ' ' + (y + 70) + ' Q' + x + ' ' + (y + 96) + ' ' + (x + 58) + ' ' + (y + 70) + ' Z" fill="var(--card)" stroke="var(--ink)" stroke-width="2"/>';
    s += pan(lx, ly) + pan(rx, ry);
    s += '<rect x="' + (lx - 34) + '" y="' + (ly + 26) + '" width="68" height="44" rx="6" fill="var(--dec)"/><text x="' + lx + '" y="' + (ly + 54) + '" text-anchor="middle" font-family="var(--mono)" font-size="18" font-weight="700" fill="#fff">' + target + '</text>';
    const ws = W8.filter((_, i) => used[i]);
    ws.slice(0, 8).forEach((w, j) => { const col = j % 4, row = Math.floor(j / 4), bx = rx - 50 + col * 25, by = ry + 50 - row * 20; s += '<rect x="' + bx + '" y="' + by + '" width="23" height="18" rx="3" fill="var(--on)" stroke="var(--on-deep)"/><text x="' + (bx + 11.5) + '" y="' + (by + 13) + '" text-anchor="middle" font-family="var(--mono)" font-size="9.5" font-weight="700" fill="#ffffff">' + w + '</text>'; });
    s += '</svg>';
    $('#scale').innerHTML = s;
    $$('.wt', wbox).forEach((b, i) => { b.classList.toggle('on', !!used[i]); b.setAttribute('aria-pressed', String(!!used[i])); });
    const tell = $('#scale-tell');
    if (diff === 0) tell.innerHTML = '<span class="good">' + t({ tr: 'Denge!', en: 'Balanced!' }) + '</span> ' + (ws.join(' + ') || '0') + ' = ' + target + ' &nbsp;→&nbsp; <b class="b">' + used.join('') + '</b>' + sub(2);
    else tell.innerHTML = t({ tr: 'Kefede ', en: 'On the pan: ' }) + '<b>' + placed + '</b> · ' + (diff < 0 ? t({ tr: (-diff) + ' eksik', en: (-diff) + ' short' }) : t({ tr: diff + ' fazla', en: diff + ' too much' }));
  }
  const tk = knob($('#k-target'), { value: 42, min: 0, max: 255, px: 6, onChange: (v) => { target = v; drawScale(); } });
  wbox.append(el('button', { class: 'btn ghost sm', type: 'button', text: t({ tr: 'Rastgele hedef', en: 'Random target' }), onclick: () => { used.fill(0); tk.set(NS.rand(1, 255)); } }));
  drawScale();

  /* ---------- Şekil 4: tekrarlı bölme ---------- */
  let dn = 25, db = 2, rows = [];
  const ladder = $('#div-ladder'), dres = $('#div-res'), dtell = $('#div-tell');
  function divCompute() { rows = []; let x = dn; while (x > 0) { rows.push([x, Math.floor(x / db), x % db]); x = Math.floor(x / db); } if (!rows.length) rows.push([0, 0, 0]); }
  function divRender(i) {
    const shown = Math.min(i, rows.length);
    ladder.innerHTML = rows.slice(0, shown).map((r, j) => '<div class="lr' + (j === shown - 1 && i <= rows.length ? ' cur' : '') + '"><span>' + fmt(r[0]) + ' ÷ ' + db + '</span><span>= ' + fmt(r[1]) + '</span><span>' + t({ tr: 'kalan', en: 'remainder' }) + ' <b>' + D[r[2]] + '</b></span></div>').join('') || '<div class="lr muted" style="display:block;text-align:center">' + esc(t({ tr: '“Sonraki adım” ile ilk bölmeyi yap.', en: 'Press “Next step” for the first division.' })) + '</div>';
    dres.innerHTML = rows.map((r, j) => '<span class="cell' + (j < shown ? ' on' : ' ghost') + (j === shown - 1 && i <= rows.length ? ' hl' : '') + '">' + (j < shown ? D[r[2]] : '?') + '<small>' + db + '<sup>' + j + '</sup></small></span>').reverse().join('');
    if (i === 0) dtell.innerHTML = t({ tr: 'Sonuç ' + rows.length + ' basamaklı olacak.', en: 'The result will have ' + rows.length + ' digit(s).' });
    else if (i <= rows.length) { const r = rows[i - 1]; dtell.innerHTML = t({ tr: 'Kalan <b>' + D[r[2]] + '</b> → sağdan ' + i + '. basamak. ' + (r[1] ? 'Bölümle (' + r[1] + ') devam.' : 'Bölüm 0, dur.'), en: 'Remainder <b>' + D[r[2]] + '</b> → digit ' + i + ' from the right. ' + (r[1] ? 'Continue with the quotient (' + r[1] + ').' : 'Quotient is 0, stop.') }); }
    else dtell.innerHTML = '<span class="good">' + fmt(dn) + ' = ' + toBase(dn, db) + '<span class="sub">' + db + '</span></span>';
  }
  divCompute();
  const dst = steps($('#div-steps'), { count: rows.length + 2, render: divRender });
  const reDiv = () => { divCompute(); dst.reset(rows.length + 2); };
  knob($('#k-dn'), { value: 25, min: 0, max: 999, px: 6, onChange: (v) => { dn = v; reDiv(); } });
  knob($('#k-db'), { value: 2, min: 2, max: 16, onChange: (v) => { db = v; reDiv(); } });

  /* ---------- Şekil 5: her taban ---------- */
  let bn = 2024, bb = 7;
  function drawBase() {
    const s = toBase(bn, bb);
    out(null, 'bconv', esc(s) + '<span class="sub">' + bb + '</span>');
    const cols = [...s].map((d, i) => { const k = s.length - 1 - i, v = D.indexOf(d), pv = Math.pow(bb, k); return '<div class="pvc' + (v ? '' : ' z') + '"><div class="pvd">' + d + '</div><div class="pvx">× ' + bb + '<sup>' + k + '</sup></div><div class="pvx">= ' + fmt(pv) + '</div><div class="pvs">' + fmt(v * pv) + '</div></div>'; }).join('');
    const sum = [...s].map((d, i) => D.indexOf(d) * Math.pow(bb, s.length - 1 - i)).filter(Boolean).map((x) => fmt(x)).join(' + ');
    $('#pv').innerHTML = '<div class="pvrow">' + cols + '</div><div class="readout">' + (sum || '0') + ' = <b class="d">' + fmt(bn) + '</b></div>';
  }
  knob($('#k-bn'), { value: 2024, min: 0, max: 9999, px: 3, onChange: (v) => { bn = v; drawBase(); } });
  knob($('#k-bb'), { value: 7, min: 2, max: 16, onChange: (v) => { bb = v; drawBase(); } });
  drawBase();

  /* ---------- Şekil 6: gruplama ---------- */
  let gsize = 4, gbits = NS.bitsOf(0xBEEF, 16);
  const seg = el('div', { class: 'seg', role: 'group' });
  [[4, { tr: '4’erli → onaltılık', en: 'groups of 4 → hex' }], [3, { tr: '3’erli → sekizlik', en: 'groups of 3 → octal' }]].forEach(([k, l]) => seg.append(el('button', { type: 'button', 'aria-pressed': String(k === gsize), text: t(l), onclick: (e) => { gsize = k; $$('button', seg).forEach((b) => b.setAttribute('aria-pressed', String(b === e.target))); drawGroup(); } })));
  $('#grp-mode').append(seg);
  function drawGroup() {
    const n = gbits.length, padN = (gsize - (n % gsize)) % gsize, full = Array(padN).fill(null).concat(gbits);
    const box = $('#grp'); box.innerHTML = '';
    for (let g = 0; g < full.length; g += gsize) {
      const part = full.slice(g, g + gsize), v = part.reduce((a, b) => a * 2 + (b || 0), 0);
      const gd = el('div', { class: 'grp-g' });
      const row = el('div', { class: 'grp-l' });
      part.forEach((b, j) => {
        if (b === null) { row.append(el('span', { class: 'grp-pad', text: '0' })); return; }
        const idx = g + j - padN;
        row.append(el('button', { type: 'button', class: 'mlamp' + (b ? ' on' : ''), 'aria-pressed': String(!!b), 'aria-label': 'bit ' + (n - 1 - idx), text: b, onclick: () => { gbits[idx] ^= 1; drawGroup(); } }));
      });
      gd.append(row, el('div', { class: 'grp-br' }), el('div', { class: 'grp-d ' + (gsize === 4 ? 'h' : 'b'), text: D[v] }));
      box.append(gd);
    }
    const val = NS.valOf(gbits);
    $('#grp-out').innerHTML = '<b class="b">' + group(gbits.join(''), 4) + '</b>' + sub(2) + ' = <b class="' + (gsize === 4 ? 'h' : 'b') + '">' + toBase(val, gsize === 4 ? 16 : 8) + '</b>' + sub(gsize === 4 ? 16 : 8) + ' = <b class="d">' + fmt(val) + '</b>' + sub(10);
  }
  drawGroup();

  /* onaltılık rakam tablosu */
  $('#hexchart').innerHTML = Array.from({ length: 16 }, (_, v) => '<div class="hc"><b class="h">' + D[v] + '</b><span class="hc-l">' + pad(v.toString(2), 4).split('').map((b) => '<i class="' + (b === '1' ? 'on' : '') + '"></i>').join('') + '</span><small>' + v + '</small></div>').join('');

  /* ---------- sayma matematiği: bütün desenler ---------- */
  const D36 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const sup = (x) => '<sup>' + x + '</sup>';
  let EB = 3, EN = 2;
  function drawEnum() {
    const total = EB ** EN, show = total <= 256 ? total : 64;
    $('#enum-title').innerHTML = Array(EN).fill(EB).join(' × ') + ' = ' + EB + sup(EN) + ' = <b class="d">' + fmt(total) + '</b> ' + t({ tr: 'desen', en: 'patterns' });
    let h = '';
    for (let v = 0; v < show; v++) {
      const s2 = pad(v.toString(EB), EN), lead = s2.match(/^0*/)[0].length;
      h += '<span class="en-c' + (v === total - 1 ? ' max' : '') + '"><b><i>' + s2.slice(0, Math.min(lead, EN - 1)) + '</i>' + s2.slice(Math.min(lead, EN - 1)) + '</b><small>' + v + '</small></span>';
    }
    if (show < total) { const v = total - 1, s2 = pad(v.toString(EB), EN); h += '<span class="en-dots">… ' + fmt(total - show - 1) + ' ' + t({ tr: 'tane daha', en: 'more' }) + ' …</span><span class="en-c max"><b>' + s2 + '</b><small>' + fmt(v) + '</small></span>'; }
    $('#enum').innerHTML = h;
    const top = pad((total - 1).toString(EB), EN);
    $('#enum-tell').innerHTML = t({ tr: 'En büyük: <b class="b">' + top + '</b>' + sub(EB) + ' = ' + EB + sup(EN) + ' − 1 = <b>' + fmt(total - 1) + '</b>. Bir eklersen: 1' + '0'.repeat(EN) + sub(EB) + ' = ' + fmt(total) + '.', en: 'Largest: <b class="b">' + top + '</b>' + sub(EB) + ' = ' + EB + sup(EN) + ' − 1 = <b>' + fmt(total - 1) + '</b>. Add one: 1' + '0'.repeat(EN) + sub(EB) + ' = ' + fmt(total) + '.' });
  }
  knob($('#k-eb'), { value: EB, min: 2, max: 10, px: 18, onChange: (v) => { EB = v; drawEnum(); } });
  knob($('#k-en'), { value: EN, min: 1, max: 4, px: 24, onChange: (v) => { EN = v; drawEnum(); } });
  drawEnum();

  /* en büyük n bitlik sayı */
  const bigGroup = (x) => group(x.toString(), 3, NS.LANG === 'en' ? ',' : '.');
  const drawMax = (n) => { const m = 2n ** BigInt(n) - 1n; out(null, 'mn', n); out(null, 'mx', bigGroup(m)); out(null, 'mxb', n <= 24 ? '<span class="b">' + '1'.repeat(n) + '</span>' + sub(2) : t({ tr: n + ' tane 1', en: n + ' ones' })); };
  knob($('#k-mn'), { value: 8, min: 1, max: 64, px: 8, onChange: drawMax });
  drawMax(8);

  /* kaç basamak? */
  function drawDigits(N) {
    const rows = [[2, 'b'], [8, 'b'], [10, 'd'], [16, 'h']].map(([b, cls]) => { const s2 = N.toString(b).toUpperCase(); return [b, cls, s2]; });
    const mx = rows[0][2].length;
    $('#digits').innerHTML = rows.map(([b, cls, s2]) => '<div class="dg-r"><span class="dg-b">' + t({ tr: 'taban ', en: 'base ' }) + b + '</span><span class="dg-bar"><i style="width:' + (100 * s2.length / mx) + '%"></i></span><span class="dg-n"><b>' + s2.length + '</b></span><span class="dg-s ' + cls + '">' + s2 + '</span></div>').join('') +
      '<div class="dg-f">⌊log' + sub(2) + ' ' + fmt(N) + '⌋ + 1 = ⌊' + fmt(Math.log2(N), 2) + '⌋ + 1 = <b>' + (Math.floor(Math.log2(N)) + 1) + '</b> bit · ' + t({ tr: 'oran ', en: 'ratio ' }) + fmt(rows[0][2].length / rows[2][2].length, 2) + '</div>';
  }
  knob($('#k-dg'), { value: 1000, min: 1, max: 1000000, px: 0.5, fmt: (v) => fmt(v), onChange: drawDigits });
  drawDigits(1000);

  /* 2^n tahmini */
  const SUPN = (x) => String(x).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
  const drawPw = (n) => { const ex = 2n ** BigInt(n), a = 2 ** (n % 10), k = Math.floor(n / 10); out(null, 'pw', '= ' + bigGroup(ex) + (k ? ' ≈ ' + a + ' × 10' + SUPN(3 * k) : '')); };
  knob($('#k-pw'), { value: 37, min: 0, max: 64, px: 8, onChange: drawPw });
  drawPw(37);
  const P2 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 20, 24, 30, 32, 40, 64];
  const P2N = { 8: { tr: 'byte', en: 'byte' }, 10: 'Ki', 16: { tr: '2 byte', en: '2 bytes' }, 20: 'Mi', 24: { tr: 'renk', en: 'colors' }, 30: 'Gi', 32: 'IPv4', 40: 'Ti', 64: '64 bit' };
  $('#pow2').innerHTML = P2.map((k) => '<span><i>2' + sup(k) + '</i><b>' + bigGroup(2n ** BigInt(k)) + '</b>' + (P2N[k] ? '<small>' + esc(t(P2N[k])) + '</small>' : '') + '</span>').join('');

  /* Horner */
  let HB = 2;
  const hin = $('#hn-in');
  const hnSteps = steps($('#hn-steps'), { count: 1, render: drawHn });
  function hDigits() { const s2 = hin.value.trim().toUpperCase().replace(/[\s_]/g, ''); if (!s2) return null; const d = [...s2].map((c) => D36.indexOf(c)); return d.every((x) => x >= 0 && x < HB) ? d : null; }
  function resetHn() { const d = hDigits(); hin.classList.toggle('bad', !d); hnSteps.reset(d ? d.length + 1 : 1); }
  function drawHn(k) {
    const d = hDigits();
    if (!d) { $('#horner').innerHTML = ''; $('#hn-tell').innerHTML = '<span class="bad">' + t({ tr: 'Taban ' + HB + '’de geçerli rakamlar: 0–' + D36[HB - 1], en: 'Valid digits in base ' + HB + ': 0–' + D36[HB - 1] }) + '</span>'; return; }
    let acc = 0n, h = '<div class="hn-digits">' + d.map((x, i) => '<span class="' + (i < k ? 'used' : '') + (i === k - 1 ? ' cur' : '') + '">' + D36[x] + '</span>').join('') + sub(HB) + '</div>';
    for (let i = 0; i < k && i < d.length; i++) {
      const prev = acc; acc = acc * BigInt(HB) + BigInt(d[i]);
      h += '<div class="hn-r' + (i === k - 1 ? ' cur' : '') + '"><span class="mono">' + bigGroup(prev) + ' × ' + HB + ' + <b class="b">' + D36[d[i]] + (d[i] > 9 ? '(' + d[i] + ')' : '') + '</b></span><span>=</span><b class="mono">' + bigGroup(acc) + '</b></div>';
    }
    $('#horner').innerHTML = h;
    $('#hn-tell').innerHTML = k === 0 ? t({ tr: 'Toplam 0 ile başla; soldan sağa her rakamda “× ' + HB + ' + rakam”.', en: 'Start with a total of 0; for each digit left to right do “× ' + HB + ' + digit”.' }) : k > d.length ? '' : k === d.length ? '<span class="good">' + t({ tr: 'Sonuç: ', en: 'Result: ' }) + bigGroup(acc) + '</span>' : '';
  }
  hin.addEventListener('input', resetHn);
  knob($('#k-hb'), { value: HB, min: 2, max: 16, px: 14, onChange: (v) => { HB = v; resetHn(); } });
  resetHn();

  /* evrensel çevirici */
  let CF = 16, CT = 2;
  const log2i = (b) => { const k = Math.log2(b); return Number.isInteger(k) ? k : 0; };
  function drawConv() {
    const raw = $('#cv-in').value.trim().toUpperCase().replace(/[\s_]/g, ''), dg = [...raw].map((c) => D36.indexOf(c));
    const ok = raw && dg.every((x) => x >= 0 && x < CF);
    $('#cv-in').classList.toggle('bad', !ok);
    if (!ok) { $('#conv').innerHTML = '<p class="tell bad">' + t({ tr: 'Taban ' + CF + '’de geçerli rakamlar: 0–' + D36[CF - 1], en: 'Valid digits in base ' + CF + ': 0–' + D36[CF - 1] }) + '</p>'; return; }
    let v = 0n; dg.forEach((x) => { v = v * BigInt(CF) + BigInt(x); });
    const res = v.toString(CT).toUpperCase(), a = log2i(CF), c = log2i(CT);
    let route;
    if (CF === CT) route = '<p class="tell">' + t({ tr: 'Aynı taban.', en: 'Same base.' }) + '</p>';
    else if (a && c) {
      const bin = v.toString(2), w = Math.ceil(bin.length / c) * c, pb = bin.padStart(w, '0');
      const groups = []; for (let i = 0; i < w; i += c) groups.push(pb.slice(i, i + c));
      route = (a > 1 ? '<div class="cv-step"><span class="cv-l">' + t({ tr: 'her rakamı ' + a + ' bite aç', en: 'expand each digit to ' + a + ' bits' }) + '</span><div class="cv-g">' + dg.map((x) => '<span><b>' + D36[x] + '</b><i>' + pad(x.toString(2), a) + '</i></span>').join('') + '</div></div>' : '') +
        (c > 1 ? '<div class="cv-step"><span class="cv-l">' + t({ tr: 'sağdan ' + c + '’li grupla', en: 'regroup in ' + c + 's from the right' }) + '</span><div class="cv-g">' + groups.map((g) => '<span><i>' + g + '</i><b>' + D36[parseInt(g, 2)] + '</b></span>').join('') + '</div></div>' : '') +
        '<p class="tell">' + t({ tr: 'İki taban da 2’nin kuvveti (2' + sup(a) + ' ve 2' + sup(c) + '): hiç çarpma ya da bölme gerekmedi.', en: 'Both bases are powers of 2 (2' + sup(a) + ' and 2' + sup(c) + '): no multiplication or division needed.' }) + '</p>';
    } else {
      const divs = []; let x = v; while (x > 0n && divs.length < 10) { divs.push(bigGroup(x) + ' ÷ ' + CT + ' → ' + t({ tr: 'kalan ', en: 'rem ' }) + D36[Number(x % BigInt(CT))]); x /= BigInt(CT); }
      route = '<div class="cv-step"><span class="cv-l">1 · Horner → ' + t({ tr: 'onlu', en: 'decimal' }) + '</span><div class="mono">' + raw + sub(CF) + ' = <b class="d">' + bigGroup(v) + '</b></div></div>' +
        (CT === 10 ? '' : '<div class="cv-step"><span class="cv-l">2 · ' + t({ tr: CT + '’ye tekrarlı bölme', en: 'repeated division by ' + CT }) + '</span><div class="cv-div">' + divs.map((d) => '<span>' + d + '</span>').join('') + (x > 0n ? '<span>…</span>' : '') + '</div></div>');
    }
    $('#conv').innerHTML = '<div class="cv-res"><b class="mono">' + raw + '</b>' + sub(CF) + ' = <b class="mono cv-out">' + res + '</b>' + sub(CT) + ' <span class="muted">(' + bigGroup(v) + sub(10) + ')</span></div>' + route;
  }
  $('#cv-in').addEventListener('input', drawConv);
  knob($('#k-cf'), { value: CF, min: 2, max: 36, px: 8, onChange: (v) => { CF = v; drawConv(); } });
  knob($('#k-ct'), { value: CT, min: 2, max: 36, px: 8, onChange: (v) => { CT = v; drawConv(); } });
  drawConv();

  /* alıştırma üreteçleri */
  const { rand, pick } = NS;
  function patQ() { const b = pick([2, 3, 4, 5, 8, 10, 16]), n = rand(2, b > 8 ? 3 : 5); return { q: t({ tr: 'Taban ' + b + '’de ' + n + ' basamakla kaç farklı sayı yazılabilir?', en: 'How many different numbers can ' + n + ' digits write in base ' + b + '?' }), a: String(b ** n), kind: 'dec', hint: 'bⁿ', explain: b + sup(n) + ' = <b>' + fmt(b ** n) + '</b>' }; }
  function maxQ() { const b = pick([2, 3, 5, 8, 16]), n = rand(2, 4); return { q: t({ tr: 'Taban ' + b + '’de ' + n + ' basamaklı en büyük sayının onlu değeri?', en: 'Decimal value of the largest ' + n + '-digit number in base ' + b + '?' }), a: String(b ** n - 1), kind: 'dec', hint: 'bⁿ − 1', explain: D36[b - 1].repeat(n) + sub(b) + ' = ' + b + sup(n) + ' − 1 = <b>' + fmt(b ** n - 1) + '</b>' }; }
  function digQ() { const b = pick([2, 8, 16]), N = rand(50, 70000); return { q: t({ tr: fmt(N) + ' sayısı taban ' + b + '’de kaç basamaktır?', en: 'How many digits does ' + fmt(N) + ' have in base ' + b + '?' }), a: String(N.toString(b).length), kind: 'dec', hint: t({ tr: b + 'ⁿ > N olan en küçük n.', en: 'The smallest n with ' + b + 'ⁿ > N.' }), explain: N.toString(b).toUpperCase() + sub(b) + ' → <b>' + N.toString(b).length + '</b>' }; }
  function b4Q() { const v = rand(20, 255), to4 = Math.random() < 0.6; return to4 ? { q: '<span class="b">' + v.toString(2) + '</span>' + sub(2) + ' → ' + t({ tr: 'taban 4?', en: 'base 4?' }), a: v.toString(4), kind: 'dec', hint: t({ tr: 'Sağdan ikişerli grupla: 00=0, 01=1, 10=2, 11=3.', en: 'Group in twos from the right: 00=0, 01=1, 10=2, 11=3.' }), explain: '<b>' + v.toString(4) + '</b>' + sub(4) } : { q: '<span class="b">' + v.toString(8) + '</span>' + sub(8) + ' → hex?', a: v.toString(16).toUpperCase(), kind: 'hex', hint: t({ tr: 'Önce ikiliye aç (3’lü), sonra 4’lü grupla.', en: 'Expand to binary (3s), then regroup in 4s.' }), explain: v.toString(2) + sub(2) + ' → <b class="h">' + v.toString(16).toUpperCase() + '</b>' }; }
  function pw2Q() { const n = pick([11, 12, 13, 14, 15, 16, 20, 24]); return { q: '2' + sup(n) + ' = ?', a: String(2 ** n), kind: 'dec', hint: '2¹⁰ = 1024', explain: '<b>' + fmt(2 ** n) + '</b>' }; }

  tryIt($('#try'), [
    { label: t({ tr: 'İkili → onlu', en: 'Binary → decimal' }), fn: GEN.binToDec },
    { label: t({ tr: 'Onlu → ikili', en: 'Decimal → binary' }), fn: GEN.decToBin },
    { label: t({ tr: 'Hex ↔ ikili', en: 'Hex ↔ binary' }), fn: () => (Math.random() < 0.5 ? GEN.hexToBin() : GEN.binToHex()) },
    { label: t({ tr: 'Hex → onlu', en: 'Hex → decimal' }), fn: GEN.hexToDec },
    { label: t({ tr: 'Sekizli', en: 'Octal' }), fn: () => (Math.random() < 0.5 ? GEN.octToDec() : GEN.binToOct()) },
    { label: t({ tr: 'Desen sayısı', en: 'Pattern count' }), fn: patQ },
    { label: t({ tr: 'En büyük sayı', en: 'Largest number' }), fn: maxQ },
    { label: t({ tr: 'Basamak sayısı', en: 'Digit count' }), fn: digQ },
    { label: t({ tr: 'Taban 4 / 8↔16', en: 'Base 4 / 8↔16' }), fn: b4Q },
    { label: t({ tr: '2’nin kuvvetleri', en: 'Powers of 2' }), fn: pw2Q },
  ]);
})();
