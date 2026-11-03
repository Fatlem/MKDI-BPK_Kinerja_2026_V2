/* ═══════════════════════════════════════════════════════════════
   categories.js — satu sumber kebenaran untuk 7 kategori uraian temuan
   Kondisi · Kriteria · Sebab · Akibat · Rekomendasi · Rencana Aksi · Output

   Warna/ikon didefinisikan di sini + css/app-ui.css (token --cat-*).
   Warna TIDAK pernah menjadi satu-satunya pembeda: selalu ada ikon + label.
   Bergantung pada core.js (esc) dan ruang-isian.js (parseList, riListHtml) —
   dipanggil saat render, jadi urutan muat aman.
   ═══════════════════════════════════════════════════════════════ */
const CATS = {
  Kondisi:     { cls: 'cat-kondisi',     label: 'Kondisi',      icon: 'search' },
  Kriteria:    { cls: 'cat-kriteria',    label: 'Kriteria',     icon: 'scale' },
  Sebab:       { cls: 'cat-sebab',       label: 'Sebab',        icon: 'lightbulb' },
  Akibat:      { cls: 'cat-akibat',      label: 'Akibat',       icon: 'triangle-alert' },
  Rekomendasi: { cls: 'cat-rekomendasi', label: 'Rekomendasi',  icon: 'clipboard-check' },
  RencanaAksi: { cls: 'cat-rencana',     label: 'Rencana Aksi', icon: 'list-checks' },
  Output:      { cls: 'cat-output',      label: 'Output',       icon: 'package-check' },
};

const CAT_EMPTY = '<span class="cat-empty">Belum diisi</span>';

/** Badge kecil (ikon + label) — untuk dipakai di baris/daftar. */
function catTag(key) {
  const c = CATS[key];
  return `<span class="cat-tag ${c.cls}"><i data-lucide="${c.icon}"></i>${c.label}</span>`;
}

/** Isi teks kategori (daftar bernomor / paragraf), fallback "Belum diisi". */
function catText(text) {
  return riListHtml(parseList(text), '') || CAT_EMPTY;
}

/**
 * Kartu kategori.
 * opts: { title (ganti label), aside (HTML di kanan header), foot (HTML di bawah isi), wide }
 */
function catCard(key, bodyHtml, opts = {}) {
  const c = CATS[key];
  return `
    <section class="cat-card ${c.cls}${opts.wide ? ' cat-card--wide' : ''}">
      <header class="cat-head">
        <i data-lucide="${c.icon}"></i>
        <h4>${opts.title || c.label}</h4>
        ${opts.aside ? `<span class="cat-aside">${opts.aside}</span>` : ''}
      </header>
      <div class="cat-body">${bodyHtml || CAT_EMPTY}${opts.foot || ''}</div>
    </section>`;
}

/** Isi kartu Output (bagian a./b./c. dengan caption). */
function catOutputBody(secs) {
  return secs.map((sec) => {
    const cap = sec.head ? `<div class="ri-caption">${sec.letter ? esc(sec.letter) + '. ' : ''}${esc(sec.head)}</div>` : '';
    return `<div class="ri-out-block">${cap}${riListHtml(sec.list, 'cols')}</div>`;
  }).join('');
}

/** Isi kartu Rencana Aksi: uraian + target waktu. */
function catRenaksiBody(sub) {
  const has = !!String(sub.RencanaAksi || '').trim();
  return `<div class="cat-split">
    <div class="cat-pre ${has ? '' : 'is-empty'}">${has ? esc(sub.RencanaAksi) : 'Belum diisi'}</div>
    <div class="cat-meta"><span>Target waktu</span><strong>${esc(sub.JadwalPelaksanaan || '—')}</strong></div>
  </div>`;
}
