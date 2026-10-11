/* Giriş sayfası: "bir sayı, dört yazılış" + yol haritası durumu */
(function () {
  const { t, $, el, esc, fmt, toBase, pad, group, invalidDigit, store } = NS;

  const inp = $('#fb-input'), sel = $('#fb-base'), out = $('#fb-out'), msg = $('#fb-msg'), foot = $('#fb-foot'), bitsBox = $('#fb-bits');
  const samples = [['42', 10], ['255', 10], ['2024', 10], ['1010', 2], ['FF', 16], ['777', 8]];
  samples.forEach(([v, b]) => {
    const btn = el('button', { type: 'button', class: 'btn ghost sm mono', text: v + NS.sub(b) });
    btn.addEventListener('click', () => { inp.value = v; sel.value = b; render(); });
    $('#fb-samples').append(btn);
  });

  function render() {
    const base = +sel.value;
    const raw = inp.value.trim().toUpperCase().replace(/^0[XBO]/, '').replace(/[\s_]/g, '');
    const bad = raw ? invalidDigit(raw, base) : null;
    msg.hidden = !bad && raw.length > 0 ? true : !bad;
    if (bad) {
      msg.hidden = false;
      msg.textContent = t({ tr: '"' + bad + '" taban ' + base + ' için geçerli bir rakam değil.', en: '"' + bad + '" is not a valid digit in base ' + base + '.' });
      inp.classList.add('invalid');
      return;
    }
    inp.classList.remove('invalid');
    if (!raw) { out.innerHTML = ''; bitsBox.innerHTML = ''; foot.textContent = ''; return; }
    const n = parseInt(raw, base);
    if (!Number.isSafeInteger(n)) {
      msg.hidden = false; msg.textContent = t({ tr: 'Sayı çok büyük.', en: 'Number too large.' }); return;
    }
    const rows = [[2, 'bin', t({ tr: 'İkili', en: 'Binary' }), '0b'], [8, 'oct', t({ tr: 'Sekizli', en: 'Octal' }), '0o'], [10, 'dec', t({ tr: 'Onlu', en: 'Decimal' }), ''], [16, 'hex', t({ tr: 'Onaltılı', en: 'Hex' }), '0x']];
    out.innerHTML = rows.map(([b, c, name, pre]) => {
      let v = toBase(n, b);
      if (b === 2) v = group(v, 4);
      if (b === 10) v = fmt(n);
      return '<div class="stat ' + c + (b === base ? ' src' : '') + '"><div class="stat-label">' + esc(name) + ' (' + b + ')</div>' +
        '<div class="stat-value ' + c + '">' + esc(v) + '</div><div class="muted mono" style="font-size:.75rem">' + (pre ? pre + toBase(n, b) : '&nbsp;') + '</div></div>';
    }).join('');
    // bit ışıkları
    const bits = toBase(n, 2);
    const shown = bits.length <= 32 ? pad(bits, Math.max(8, Math.ceil(bits.length / 8) * 8)) : bits;
    bitsBox.innerHTML = '';
    if (bits.length <= 32) {
      NS.bits(bitsBox, { n: shown.length, bits: [...shown].map(Number), readonly: true, group: 4, size: shown.length > 16 ? 'xs' : 'sm', label: 'bits' });
    }
    const bytes = Math.max(1, Math.ceil(bits.length / 8));
    foot.innerHTML = t({
      tr: 'Bu sayıyı saklamak için en az <b>' + bits.length + ' bit</b> gerekir (bilgisayar bunu genellikle ' + bytes + ' byte = ' + bytes * 8 + ' bitlik bir kutuya koyar). Hex’teki her rakam tam 4 bit’e karşılık gelir: ' + toBase(n, 16).length + ' hex rakamı × 4 = ' + toBase(n, 16).length * 4 + ' bit.',
      en: 'Storing this number needs at least <b>' + bits.length + ' bits</b> (a computer usually puts it in a ' + bytes + '-byte = ' + bytes * 8 + '-bit box). Each hex digit is exactly 4 bits: ' + toBase(n, 16).length + ' hex digits × 4 = ' + toBase(n, 16).length * 4 + ' bits.',
    });
  }
  inp.addEventListener('input', render);
  sel.addEventListener('change', render);
  render();

  // yol haritası: tamamlanan bölümleri işaretle
  const p = store.get('ss-progress', {});
  document.querySelectorAll('#roadmap .card').forEach((c) => {
    if (p[c.dataset.id]) { c.classList.add('done'); c.querySelector('.card-num').textContent += ' ✓'; }
  });
})();
