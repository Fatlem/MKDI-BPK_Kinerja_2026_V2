if (!S.riOpen) S.riOpen = {};

function loadRuangIsian(picFilter) {
  document.getElementById('hdr-title').textContent = 'Ruang Isian';
  document.getElementById('hdr-sub').textContent   = isPicUser() ? 'Isi tindak lanjut untuk temuan yang ditugaskan kepada Anda' : 'Tambah, ubah, atau hapus data tindak lanjut';
  setBody(loadingHtml());
  refreshIcons();

  apiFetch('/api/temuan')
    .then(rows => {
      S.allR = scopeRows(rows);
      S.riFilter = picFilter || '';
      renderRuangIsian(S.allR);
    })
    .catch(() => showToast('Gagal memuat data dari server', 'err'));
}

function renderRuangIsian(rows) {
  const selesai = rows.filter(r => statusOf(r).lbl === 'Selesai').length;
  const progress = rows.length ? Math.round((selesai / rows.length) * 100) : 0;
  const picOpts = allPicOptions().map(p => `<option value="${esc(p.username)}" ${S.riFilter === p.username ? 'selected' : ''}>${esc(p.nama)}</option>`).join('');

  setBody(`
    <div class="hero-banner">
      <h2 class="hero-title">Ruang Isian Tindak Lanjut</h2>
      <p class="hero-sub">${isPicUser() ? 'Isi Rencana Aksi, Jadwal Pelaksanaan, dan Output untuk temuan yang ditugaskan kepada Anda' : 'Kelola administrasi dan dokumen tindak lanjut hasil pemeriksaan BPK RI'}</p>
    </div>

    <div class="toolbar-wrap">
      ${isPicUser() ? '' : '<button class="btn-action-pri" onclick="openModal()"><i data-lucide="plus" style="width:16px;"></i> Tambah Temuan Baru</button>'}
      <select class="select-custom" id="ri-flt-pic" style="width:260px;" onchange="filterRuangIsian()" ${isPicUser() ? 'disabled' : ''}>
        <option value="">Semua PIC</option>
        ${picOpts}
      </select>
      <span style="margin-left:auto;font-size:12px;color:var(--text-muted);" id="ri-count"></span>
    </div>

    <div id="entry-list"></div>
  `);

  renderEntryList();
}

function filterRuangIsian() {
  S.riFilter = document.getElementById('ri-flt-pic').value;
  renderEntryList();
}

// ══════════════════ TAMPILAN RINCIAN (DESAIN BARU) ═══════════════
const RI_CARDS = [
  { key: 'Kriteria',    title: 'Kriteria',     icon: 'target',         cls: 'blue'   },
  { key: 'Sebab',       title: 'Sebab',        icon: 'lightbulb',      cls: 'green'  },
  { key: 'Rekomendasi', title: 'Rekomendasi',  icon: 'clipboard-list', cls: 'purple' },
  { key: 'RencanaAksi', title: 'Rencana Aksi', icon: 'file-text',      cls: 'orange' }
];

// Pecah teks bernomor ("1. ... 2. ...") menjadi daftar item.
// Kalau teks tidak bernomor, tampil sebagai satu paragraf utuh.
function parseList(text) {
  const t = String(text == null ? '' : text).replace(/\r/g, '').trim();
  if (!t || t === '-') return { items: [], numbered: false };

  const items = [];
  let cur = null;
  let numbered = false;
  t.split('\n').forEach(line => {
    const m = line.match(/^\s*(\d{1,2})\s*[.)]\s+(.*)$/);
    if (m) {
      numbered = true;
      cur = { text: m[2].trim() };
      items.push(cur);
    } else if (line.trim()) {
      if (cur) cur.text += ' ' + line.trim();
      else { cur = { text: line.trim() }; items.push(cur); }
    }
  });

  if (!numbered) return { items: [t], numbered: false };
  return { items: items.map(i => i.text), numbered: true };
}

// Pecah Output menjadi bagian berhuruf ("a. ...", "b. ...") yang masing-masing berisi daftar bernomor
function parseOutputSections(text) {
  const t = String(cleanOutput(text) || '').replace(/\r/g, '').trim();
  if (!t || t === '-') return [];

  const secs = [];
  let cur = null;
  t.split('\n').forEach(line => {
    const m = line.match(/^\s*([a-zA-Z])\s*[.)]\s+(.+)$/);
    if (m) {
      cur = { letter: m[1].toLowerCase(), head: m[2].trim(), body: [] };
      secs.push(cur);
    } else {
      if (!cur) { cur = { letter: '', head: '', body: [] }; secs.push(cur); }
      cur.body.push(line);
    }
  });
  return secs.map(s => ({ letter: s.letter, head: s.head, list: parseList(s.body.join('\n')) }));
}

// mode: '' (bulat berwarna) | 'cols' (2 kolom) | 'plain' (nomor biasa)
function riListHtml(p, mode) {
  if (!p.items.length) return '';
  if (!p.numbered) return `<div class="ri-para">${esc(p.items[0])}</div>`;
  const cls = mode === 'cols' ? ' ri-cols' : (mode === 'plain' ? ' ri-plain' : '');
  return `<ol class="ri-list${cls}">${p.items.map((t, i) => `
    <li><span class="ri-num">${i + 1}${mode === 'plain' ? '.' : ''}</span><span class="ri-txt">${esc(t)}</span></li>`).join('')}
  </ol>`;
}

function riCard(cls, icon, title, bodyHtml) {
  return `
    <div class="ri-card ri-${cls}">
      <div class="ri-card-head"><i data-lucide="${icon}"></i><span>${title}</span></div>
      <div class="ri-card-body">${bodyHtml || '<div class="ri-empty">Belum diisi</div>'}</div>
    </div>`;
}

function riOutputCard(secs) {
  let body = '';
  secs.forEach(sec => {
    const cap = sec.head ? `<div class="ri-caption">${sec.letter ? esc(sec.letter) + '. ' : ''}${esc(sec.head)}</div>` : '';
    body += `<div class="ri-out-block">${cap}${riListHtml(sec.list, 'cols')}</div>`;
  });
  return `<div class="ri-wide">${riCard('sky', 'calendar-check', 'Output', body)}</div>`;
}

function riJadwalCard(text) {
  return `<div class="ri-wide">${riCard('purple', 'calendar-days', 'Jadwal', riListHtml(parseList(text), ''))}</div>`;
}

function riSubHtml(sub, idx, canAdmin) {
  const st = statusOf(sub);
  const pics = groupPicNames([sub]).join(', ') || '-';
  const secs = parseOutputSections(sub.Output);

  return `
    <div class="ri-sub">
      <div class="ri-sub-head">
        <div class="ri-sub-title">
          <div class="ri-sub-titletext">
            <strong>Sub Temuan #${idx + 1}${sub.SubTemuan ? ' - ' + esc(sub.SubTemuan) : ''}</strong>
            <div class="ri-sub-meta">
              <span><i data-lucide="users"></i> ${esc(pics)}</span>
            </div>
          </div>
        </div>
        <div class="ri-sub-actions">
          <span class="status-pill ${st.cls}">
            <i data-lucide="${st.icon}" style="width:12px;"></i> ${st.lbl.toUpperCase()}
          </span>
          <button class="btn-action-sec ri-btn" onclick="openModal('${esc(jsq(sub.PIC))}',${sub._row})"><i data-lucide="edit-3" style="width:13px;"></i> Ubah</button>
          ${canAdmin ? `<button class="btn-action-sec ri-btn ri-btn-del" onclick="confirmDel(${sub._row})"><i data-lucide="trash-2" style="width:13px;"></i></button>` : ''}
        </div>
      </div>

      <div class="ri-grid">
        ${RI_CARDS.map(c => riCard(c.cls, c.icon, c.title, riListHtml(parseList(sub[c.key]), ''))).join('')}
      </div>

      ${riOutputCard(secs)}
      ${riJadwalCard(sub.JadwalPelaksanaan)}
    </div>`;
}

function renderEntryList() {
  const rows = S.riFilter ? S.allR.filter(r => hasPic(splitPics(r.PIC), S.riFilter)) : S.allR;
  const list = document.getElementById('entry-list');
  const canAdmin = !isPicUser();
  
  if (!rows.length) {
    list.innerHTML = `
      <div style="text-align:center;padding:60px;background:#fff;border-radius:var(--r-xl);border:1.5px dashed var(--border-color);">
        <i data-lucide="folder-open" style="width:40px;height:40px;color:var(--text-muted);margin-bottom:8px;"></i>
        <h4 style="font-weight:700">Belum Ada Data</h4>
        <p style="font-size:12px;color:var(--text-muted)">Klik tombol "+ Tambah Temuan Baru" untuk membuat data baru.</p>
      </div>`;
    const cnt = document.getElementById('ri-count');
    if (cnt) cnt.textContent = '';
    refreshIcons();
    return;
  }

  const groups = {};
  rows.forEach(r => {
    const k = String(r.No || '0');
    if (!groups[k]) groups[k] = [];
    groups[k].push(r);
  });

  document.getElementById('ri-count').textContent = `${Object.keys(groups).length} Temuan Utama (${rows.length} Sub Temuan)`;
  
  let html = '';
  Object.keys(groups).forEach(noKey => {
    const items = groups[noKey];
    const parent = items[0];

    html += `
      <div class="entry-card">
        <div class="entry-card-header" data-key="t:${esc(noKey)}" onclick="togEntry(this)">
          <div class="entry-badge-no">${esc(parent.No) || '-'}</div>
          <div style="flex:1;">
            <div class="entry-title-text" style="font-weight:700;font-size:14px;color:#0f172a;">${esc(parent.Temuan) || '—'}</div>
            <div style="font-size:11.5px;color:#64748b;margin-top:2px;">PIC: <strong>${esc(groupPicNames(items).join(', ') || '-')}</strong> (${items.length} Sub Temuan)</div>
          </div>
          ${canAdmin ? `<button class="btn-action-sec" style="padding:6px 12px;font-size:12px;" onclick="event.stopPropagation(); openAddSubModal(${items[items.length - 1]._row})">
            <i data-lucide="plus-circle" style="width:14px;"></i> Tambah Sub Temuan
          </button>` : ''}
        </div>

        <div class="sub-item-block" style="display:${S.riOpen['t:' + noKey] ? 'block' : 'none'};">
          ${items.map((sub, idx) => riSubHtml(sub, idx, canAdmin)).join('')}
        </div>
      </div>`;
  });

  list.innerHTML = html;
  refreshIcons();
}

function togEntry(headerEl) {
  const subBlock = headerEl.nextElementSibling;
  if (!subBlock) return;
  const open = subBlock.style.display === 'none';
  subBlock.style.display = open ? 'block' : 'none';
  const key = headerEl.dataset ? headerEl.dataset.key : '';
  if (key) S.riOpen[key] = open;
}


// ══════════════════ HALAMAN DETAIL ═══════════════════════════════
// Kriteria, Sebab, dan Rekomendasi diisi di halaman ini (bukan di form Temuan/Sub Temuan).
// Semuanya ditulis ke baris temuan yang sama di tabel temuan.
const DET_FIELDS = [
  { key: 'Kriteria',    label: 'Kriteria',    icon: 'target',         cls: 'blue'   },
  { key: 'Sebab',       label: 'Sebab',       icon: 'lightbulb',      cls: 'green'  },
  { key: 'Rekomendasi', label: 'Rekomendasi', icon: 'clipboard-list', cls: 'purple' }
];
let _det = { mode: 'add', rowId: null };
let _detPreset = null;

function riShort(s, n) {
  const t = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1).trim() + '…' : t;
}

function riNormK(s) {
  return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().toLowerCase();
}

// Butir baru dari teks isian: bernomor -> ambil butirnya, kalau tidak -> satu butir per baris
function parseNewItems(text) {
  const t = String(text == null ? '' : text).replace(/\r/g, '').trim();
  if (!t) return [];
  const p = parseList(t);
  if (p.numbered) return p.items;
  return t.split('\n').map(x => x.trim()).filter(Boolean);
}

// Tambahkan butir baru sebagai nomor berikutnya. Teks lama tidak diubah, butir yang sudah ada dilewati.
function appendItems(oldText, newItems) {
  let old = String(oldText == null ? '' : oldText).replace(/\r/g, '').trim();
  if (old === '-') old = '';
  const p = parseList(old);
  const have = new Set(p.items.map(t => riNormK(t)));
  let out = old;
  let n = p.items.length;
  if (old && !p.numbered) out = '1. ' + old;
  let added = 0;
  newItems.forEach(it => {
    const k = riNormK(it);
    if (!k || have.has(k)) return;
    have.add(k);
    n += 1;
    added += 1;
    out += (out ? '\n\n' : '') + n + '. ' + it;
  });
  return { text: out, added };
}

// Susun data kirim dari satu baris, dengan beberapa kolom diganti
function rowToPayload(r, override) {
  const v = x => (x == null ? '' : x);
  return Object.assign({
    No: v(r.No), PIC: v(r.PIC), Temuan: v(r.Temuan), SubTemuan: v(r.SubTemuan),
    Kriteria: v(r.Kriteria), Sebab: v(r.Sebab), Rekomendasi: v(r.Rekomendasi),
    RencanaAksi: v(r.RencanaAksi), JadwalPelaksanaan: v(r.JadwalPelaksanaan),
    Output: v(r.Output), isSubAdd: false, parentRow: ''
  }, override || {});
}

function loadDetail(picFilter) {
  document.getElementById('hdr-title').textContent = 'Detail';
  document.getElementById('hdr-sub').textContent   = isPicUser() ? 'Kriteria, sebab, dan rekomendasi dari temuan yang ditugaskan kepada Anda' : 'Isi dan kelola kriteria, sebab, dan rekomendasi tiap temuan';
  setBody(loadingHtml());
  refreshIcons();

  apiFetch('/api/temuan')
    .then(rows => {
      S.allR = scopeRows(rows);
      S.riFilter = picFilter || '';
      renderDetail();
    })
    .catch(() => showToast('Gagal memuat data dari server', 'err'));
}

function renderDetail() {
  const picOpts = allPicOptions().map(p => `<option value="${esc(p.username)}" ${S.riFilter === p.username ? 'selected' : ''}>${esc(p.nama)}</option>`).join('');

  setBody(`
    <div class="hero-banner">
      <h2 class="hero-title">Detail Temuan</h2>
      <p class="hero-sub">${isPicUser() ? 'Lihat kriteria, sebab, dan rekomendasi dari temuan yang ditugaskan kepada Anda' : 'Tambah atau ubah kriteria, sebab, dan rekomendasi untuk setiap sub temuan'}</p>
    </div>

    <div class="toolbar-wrap">
      ${isPicUser() ? '' : '<button class="btn-action-pri" onclick="openDetAdd(\'\', \'\', \'Kriteria\')"><i data-lucide="plus" style="width:16px;"></i> Tambah Detail</button>'}
      <select class="select-custom" id="det-flt-pic" style="width:260px;" onchange="filterDetail()" ${isPicUser() ? 'disabled' : ''}>
        <option value="">Semua PIC</option>
        ${picOpts}
      </select>
      <span style="margin-left:auto;font-size:12px;color:var(--text-muted);" id="det-count"></span>
    </div>

    <div id="det-list"></div>
  `);

  renderDetailList();
}

function filterDetail() {
  S.riFilter = document.getElementById('det-flt-pic').value;
  renderDetailList();
}

function detCard(f, r, canAdmin) {
  const body = riListHtml(parseList(r[f.key]), '') || '<div class="ri-empty">Belum diisi</div>';
  const add = canAdmin
    ? `<button class="ri-card-add" title="Tambah ${f.label}" onclick="openDetAdd('', '${esc(r._row)}', '${f.key}')"><i data-lucide="plus" style="width:14px;height:14px;"></i></button>`
    : '';
  return `
    <div class="ri-card ri-${f.cls}">
      <div class="ri-card-head"><i data-lucide="${f.icon}"></i><span>${f.label}</span>${add}</div>
      <div class="ri-card-body">${body}</div>
    </div>`;
}

function detRowHtml(r, idx, canAdmin) {
  return `
    <div class="ri-sub">
      <div class="ri-sub-head">
        <div class="ri-sub-title">
          <div class="ri-sub-titletext">
            <strong>Sub Temuan #${idx + 1}${r.SubTemuan ? ' - ' + esc(r.SubTemuan) : ''}</strong>
            <div class="ri-sub-meta"><span><i data-lucide="users"></i> ${esc(groupPicNames([r]).join(', ') || '-')}</span></div>
          </div>
        </div>
        ${canAdmin ? `<div class="ri-sub-actions">
          <button class="btn-action-sec ri-btn" onclick="openDetEdit('${esc(r._row)}')"><i data-lucide="edit-3" style="width:13px;"></i> Ubah</button>
          <button class="btn-action-sec ri-btn ri-btn-del" onclick="confirmDel(${r._row})"><i data-lucide="trash-2" style="width:13px;"></i></button>
        </div>` : ''}
      </div>
      <div class="det-grid">
        ${DET_FIELDS.map(f => detCard(f, r, canAdmin)).join('')}
      </div>
    </div>`;
}

function renderDetailList() {
  const rows = S.riFilter ? S.allR.filter(r => hasPic(splitPics(r.PIC), S.riFilter)) : S.allR;
  const list = document.getElementById('det-list');
  const cnt  = document.getElementById('det-count');
  const canAdmin = !isPicUser();
  if (!list) return;

  if (!rows.length) {
    list.innerHTML = `
      <div style="text-align:center;padding:60px;background:#fff;border-radius:var(--r-xl);border:1.5px dashed var(--border-color);">
        <i data-lucide="file-text" style="width:40px;height:40px;color:var(--text-muted);margin-bottom:8px;"></i>
        <h4 style="font-weight:700">Belum Ada Data</h4>
        <p style="font-size:12px;color:var(--text-muted)">Tambahkan temuan di halaman Temuan / Sub Temuan terlebih dahulu.</p>
      </div>`;
    if (cnt) cnt.textContent = '';
    refreshIcons();
    return;
  }

  const groups = {};
  rows.forEach(r => {
    const k = String(r.No || '0');
    if (!groups[k]) groups[k] = [];
    groups[k].push(r);
  });
  if (cnt) cnt.textContent = `${Object.keys(groups).length} Temuan (${rows.length} Sub Temuan)`;

  let html = '';
  Object.keys(groups).forEach(noKey => {
    const items = groups[noKey];
    const parent = items[0];

    html += `
      <div class="entry-card">
        <div class="entry-card-header" data-key="d:${esc(noKey)}" onclick="togEntry(this)">
          <div class="entry-badge-no">${esc(parent.No) || '-'}</div>
          <div style="flex:1;min-width:0;">
            <div class="entry-title-text" style="font-weight:700;font-size:14px;color:#0f172a;">${esc(parent.Temuan) || '—'}</div>
            <div style="font-size:11.5px;color:#64748b;margin-top:2px;">PIC: <strong>${esc(groupPicNames(items).join(', ') || '-')}</strong> (${items.length} Sub Temuan)</div>
          </div>
          ${canAdmin ? `<button class="btn-action-sec" style="padding:6px 12px;font-size:12px;" onclick="event.stopPropagation(); openDetAdd('${esc(noKey)}', '', 'Kriteria')">
            <i data-lucide="plus-circle" style="width:14px;"></i> Tambah Detail
          </button>` : ''}
        </div>

        <div class="sub-item-block" style="display:${S.riOpen['d:' + noKey] ? 'block' : 'none'};">
          ${items.map((r, idx) => detRowHtml(r, idx, canAdmin)).join('')}
        </div>
      </div>`;
  });

  list.innerHTML = html;
  refreshIcons();
}

// ── Modal Detail (dibuat sekali lewat JS) ──────────────────────────
function ensureDetModal() {
  if (document.getElementById('det-bg')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div id="det-bg" class="modal-backdrop" onclick="closeDetModalBg(event)">
      <div class="modal-window" style="max-width:600px;">
        <div class="modal-header-area">
          <div>
            <div id="det-title" class="modal-title-text">Tambah Detail</div>
            <div id="det-sub" style="font-size:12px;color:var(--text-muted)"></div>
          </div>
          <button class="modal-close-btn" onclick="closeDetModal()"><i data-lucide="x" style="width:18px;height:18px;"></i></button>
        </div>

        <div class="modal-body-area">
          <div id="det-add-sec">
            <div class="form-field">
              <label>Jenis</label>
              <select id="det-field">
                <option value="Kriteria">Kriteria</option>
                <option value="Sebab">Sebab</option>
                <option value="Rekomendasi">Rekomendasi</option>
              </select>
            </div>
            <div class="form-field" id="det-temuan-wrap">
              <label>Temuan</label>
              <select id="det-temuan" onchange="renderDetRincian()"></select>
            </div>
            <div class="form-field">
              <label>Tambahkan ke Sub Temuan</label>
              <div id="det-rincian" class="pic-check-list"></div>
              <div class="field-hint">Isian akan ditulis ke sub temuan yang dicentang.</div>
            </div>
            <div class="form-field">
              <label>Isi Baru</label>
              <textarea id="det-text" placeholder="Tulis isi baru. Satu butir per baris jika lebih dari satu."></textarea>
              <div class="field-hint">Ditambahkan sebagai nomor berikutnya. Isi yang sudah ada tidak diubah.</div>
            </div>
          </div>

          <div id="det-edit-sec" style="display:none;">
            <div class="form-field"><label>Kriteria</label><textarea id="det-e-Kriteria" placeholder="Kriteria/dasar aturan"></textarea></div>
            <div class="form-field"><label>Sebab</label><textarea id="det-e-Sebab" placeholder="Penyebab temuan"></textarea></div>
            <div class="form-field"><label>Rekomendasi</label><textarea id="det-e-Rekomendasi" placeholder="Rekomendasi"></textarea></div>
          </div>
        </div>

        <div class="modal-footer-area">
          <button class="btn-action-sec" onclick="closeDetModal()">Batal</button>
          <button id="det-save" class="btn-action-pri" onclick="saveDetail()"><i data-lucide="save" style="width:16px;height:16px;"></i> Simpan</button>
        </div>
      </div>
    </div>`);
}

function renderDetRincian(preset) {
  let rows = preset;
  if (!rows) {
    const no = document.getElementById('det-temuan').value;
    rows = S.allR.filter(r => String(r.No) === String(no));
  }
  document.getElementById('det-rincian').innerHTML = rows.map(r => {
    const idxIn = S.allR.filter(x => String(x.No) === String(r.No)).indexOf(r) + 1;
    return `
    <label class="pic-check-item">
      <input type="checkbox" value="${esc(r._row)}" checked>
      <span>Sub Temuan #${idxIn}${r.SubTemuan ? ' - ' + esc(riShort(r.SubTemuan, 60)) : ''} &middot; ${esc(groupPicNames([r]).join(', ') || '-')}</span>
    </label>`;
  }).join('');
}

// no: nomor temuan (tambah ke semua rincian temuan itu) | rowId: satu rincian | keduanya kosong: pilih sendiri
function openDetAdd(no, rowId, field) {
  if (isPicUser()) return;
  ensureDetModal();
  _det = { mode: 'add', rowId: null };

  _detPreset = null;
  if (rowId) {
    const r = S.allR.find(x => String(x._row) === String(rowId));
    if (r) _detPreset = [r];
  } else if (no) {
    _detPreset = S.allR.filter(r => String(r.No) === String(no));
  }

  document.getElementById('det-title').textContent = 'Tambah Detail';
  document.getElementById('det-add-sec').style.display = '';
  document.getElementById('det-edit-sec').style.display = 'none';
  document.getElementById('det-field').value = field || 'Kriteria';
  document.getElementById('det-text').value = '';

  const wrap = document.getElementById('det-temuan-wrap');
  if (_detPreset && _detPreset.length) {
    wrap.style.display = 'none';
    document.getElementById('det-sub').textContent = 'Pilih jenis isian, lalu tulis isinya';
    renderDetRincian(_detPreset);
  } else {
    wrap.style.display = '';
    document.getElementById('det-sub').textContent = 'Pilih temuan dan jenis isian, lalu tulis isinya';
    const seen = {};
    const nos = [];
    S.allR.forEach(r => {
      const k = String(r.No);
      if (!seen[k]) { seen[k] = r; nos.push(k); }
    });
    document.getElementById('det-temuan').innerHTML = nos.map(k =>
      `<option value="${esc(k)}">Temuan ${esc(k)} - ${esc(riShort(seen[k].Temuan, 80))}</option>`).join('');
    renderDetRincian();
  }

  document.getElementById('det-bg').classList.add('open');
  refreshIcons();
}

function openDetEdit(rowId) {
  if (isPicUser()) return;
  const r = S.allR.find(x => String(x._row) === String(rowId));
  if (!r) return;
  ensureDetModal();
  _det = { mode: 'edit', rowId: rowId };

  document.getElementById('det-title').textContent = 'Ubah Detail';
  document.getElementById('det-sub').textContent = 'Temuan ' + (r.No || '-') + (r.SubTemuan ? ' - ' + riShort(r.SubTemuan, 70) : '');
  document.getElementById('det-add-sec').style.display = 'none';
  document.getElementById('det-edit-sec').style.display = '';
  DET_FIELDS.forEach(f => { document.getElementById('det-e-' + f.key).value = r[f.key] == null ? '' : r[f.key]; });

  document.getElementById('det-bg').classList.add('open');
  refreshIcons();
}

function closeDetModal() {
  const bg = document.getElementById('det-bg');
  if (bg) bg.classList.remove('open');
}
function closeDetModalBg(e) {
  if (e.target === document.getElementById('det-bg')) closeDetModal();
}

async function saveDetail() {
  const btn = document.getElementById('det-save');
  const btnHtml = '<i data-lucide="save" style="width:16px;height:16px;"></i> Simpan';
  const setBusy = busy => {
    btn.disabled = busy;
    btn.innerHTML = busy ? '<i data-lucide="loader-2" class="spin" style="width:16px;"></i> Menyimpan...' : btnHtml;
    refreshIcons();
  };

  // ── Mode ubah: ganti isi tiga kolom untuk satu rincian ──
  if (_det.mode === 'edit') {
    const r = S.allR.find(x => String(x._row) === String(_det.rowId));
    if (!r) { showToast('Data tidak ditemukan', 'err'); return; }
    const over = {};
    DET_FIELDS.forEach(f => { over[f.key] = document.getElementById('det-e-' + f.key).value.trim(); });

    setBusy(true);
    try {
      const resp = await apiFetch('/api/temuan/' + r._row, 'PUT', rowToPayload(r, over));
      if (!resp || !resp.success) throw new Error((resp && resp.message) ? resp.message : 'Gagal menyimpan detail');
      S.riOpen['d:' + r.No] = true;
      closeDetModal();
      showToast('Detail berhasil diperbarui', 'ok');
      refreshCurrentPage();
    } catch (e) {
      showToast('Error: ' + e.message, 'err');
    }
    setBusy(false);
    return;
  }

  // ── Mode tambah: tambahkan butir baru ke jenis yang dipilih ──
  const field = document.getElementById('det-field').value;
  const items = parseNewItems(document.getElementById('det-text').value);
  if (!items.length) { showToast('Tulis isi yang akan ditambahkan', 'err'); return; }

  const ids = Array.from(document.querySelectorAll('#det-rincian input[type="checkbox"]:checked')).map(i => String(i.value));
  if (!ids.length) { showToast('Pilih minimal 1 sub temuan', 'err'); return; }
  const rows = S.allR.filter(r => ids.includes(String(r._row)));

  setBusy(true);
  let ok = 0;
  let failed = null;
  for (const r of rows) {
    const res = appendItems(r[field], items);
    if (!res.added) continue;
    try {
      const over = {};
      over[field] = res.text;
      const resp = await apiFetch('/api/temuan/' + r._row, 'PUT', rowToPayload(r, over));
      if (!resp || !resp.success) throw new Error((resp && resp.message) ? resp.message : 'Gagal menyimpan detail');
      S.riOpen['d:' + r.No] = true;
      ok++;
    } catch (e) {
      failed = e;
      break;
    }
  }
  setBusy(false);

  if (failed) {
    showToast('Error: ' + failed.message, 'err');
    if (ok) refreshCurrentPage();
    return;
  }
  closeDetModal();
  if (ok) {
    showToast(field + ' ditambahkan ke ' + ok + ' sub temuan', 'ok');
    refreshCurrentPage();
  } else {
    showToast('Isi tersebut sudah ada di sub temuan yang dipilih', 'inf');
  }
}


// ══════════════════ MODAL & CRUD API ═════════════════════════════
// Daftar centang PIC (bisa pilih lebih dari satu)
function renderPicChecklist(selected) {
  const box = document.getElementById('m-pic');
  if (!box) return;
  const manual = document.getElementById('m-pic-manual');
  if (manual) manual.value = '';
  const opts = allPicOptions().slice();
  const selKeys = new Set((selected || []).map(picKeyOf));
  // PIC lama yang tidak ada di daftar tetap ditampilkan supaya tidak hilang saat edit
  (selected || []).forEach(t => {
    const k = picKeyOf(t);
    if (!opts.some(o => _picNormKey(o.username) === k)) opts.push({ username: t, nama: t });
  });
  box.innerHTML = opts.map(p => `
    <label class="pic-check-item">
      <input type="checkbox" value="${esc(p.username)}" ${selKeys.has(_picNormKey(p.username)) ? 'checked' : ''}>
      <span>${esc(p.nama)}</span>
    </label>`).join('');
}

// Tambah PIC yang diketik manual (boleh beberapa, pisahkan dengan koma)
function addManualPic() {
  const inp = document.getElementById('m-pic-manual');
  const box = document.getElementById('m-pic');
  if (!inp || !box) return;

  splitPics(inp.value).forEach(name => {
    const k = picKeyOf(name);
    const exist = Array.from(box.querySelectorAll('input[type="checkbox"]')).find(i => picKeyOf(i.value) === k);
    if (exist) {
      exist.checked = true;
    } else {
      box.insertAdjacentHTML('beforeend', `
        <label class="pic-check-item">
          <input type="checkbox" value="${esc(name)}" checked>
          <span>${esc(name)}</span>
        </label>`);
    }
  });

  inp.value = '';
  box.scrollTop = box.scrollHeight;
  inp.focus();
}

// Kunci kolom milik admin (A–G) kalau yang login adalah PIC
function applyModalRole() {
  const pic = isPicUser();
  ADMIN_ONLY_FIELDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (!pic && id === 'm-temuan') { el.classList.remove('field-locked'); return; } // diatur oleh pemanggil
    el.readOnly = pic;
    el.classList.toggle('field-locked', pic);
  });

  const list = document.getElementById('m-pic');
  if (list) {
    list.classList.toggle('field-locked', pic);
    list.querySelectorAll('input[type="checkbox"]').forEach(i => { i.disabled = pic; });
  }
  const manual = document.querySelector('.pic-manual');
  if (manual) manual.style.display = pic ? 'none' : '';
  const note = document.getElementById('m-role-note');
  if (note) note.style.display = pic ? 'block' : 'none';

  if (pic) {
    document.getElementById('modal-title').textContent = 'Isi Tindak Lanjut';
    document.getElementById('modal-sub').textContent   = 'Anda mengisi Rencana Aksi, Jadwal Pelaksanaan, dan Output';
  }
}

function getSelectedPics() {
  return Array.from(document.querySelectorAll('#m-pic input[type="checkbox"]:checked')).map(i => i.value);
}

function openModal(pic, row) {
  document.getElementById('m-row').value = '';
  document.getElementById('m-parent-row').value = '';
  document.getElementById('m-is-sub').value = 'false';

  document.getElementById('modal-title').textContent = row ? 'Edit Tindak Lanjut' : 'Tambah Temuan Baru';
  document.getElementById('modal-sub').textContent   = row ? 'Perbarui data sub temuan tindak lanjut' : 'Lengkapi isian data temuan BPK berikut';

  const temuanInp = document.getElementById('m-temuan');
  temuanInp.readOnly = false;
  temuanInp.style.background = '#f8fafc';

  ['m-no', 'm-temuan', 'm-subtemuan', 'm-rencanaaksi', 'm-jadwal', 'm-output'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('m-status-select').value = 'proses';

  const r = row ? S.allR.find(x => String(x._row) === String(row)) : null;
  renderPicChecklist(r ? splitPics(r.PIC) : (pic ? splitPics(pic) : []));
  applyModalRole();
  document.getElementById('modal-bg').classList.add('open');

  if (row) {
    document.getElementById('m-row').value = row;
    if (r) {
      document.getElementById('m-no').value           = r.No || '';
      document.getElementById('m-temuan').value       = r.Temuan || '';
      document.getElementById('m-subtemuan').value    = r.SubTemuan || '';
      document.getElementById('m-rencanaaksi').value  = r.RencanaAksi || '';
      document.getElementById('m-jadwal').value       = r.JadwalPelaksanaan || '';
      document.getElementById('m-output').value       = cleanOutput(r.Output);

      const st = statusOf(r);
      document.getElementById('m-status-select').value = st.lbl === 'Selesai' ? 'selesai' : (st.lbl === 'Proses' ? 'proses' : 'belum');
    }
  } else {
    document.getElementById('m-no').value = '...';
    apiFetch('/api/temuan/next-no').then(n => {
      document.getElementById('m-no').value = n;
    });
  }
}

function openAddSubModal(row) {
  const r = S.allR.find(x => String(x._row) === String(row));
  if (!r) return;

  document.getElementById('m-row').value = '';
  document.getElementById('m-parent-row').value = row;
  document.getElementById('m-is-sub').value = 'true';

  document.getElementById('modal-title').textContent = 'Tambah Sub Temuan';
  document.getElementById('modal-sub').textContent   = 'Menambahkan sub temuan untuk Temuan No. ' + r.No;

  document.getElementById('m-no').value = r.No || '';
  const temuanInp = document.getElementById('m-temuan');
  temuanInp.value = r.Temuan || '';
  temuanInp.readOnly = true;
  temuanInp.style.background = '#eef2ff';

  renderPicChecklist(splitPics(r.PIC));
  applyModalRole();
  document.getElementById('m-status-select').value = 'proses';

  ['m-subtemuan', 'm-rencanaaksi', 'm-jadwal', 'm-output'].forEach(id => {
    document.getElementById(id).value = '';
  });

  document.getElementById('modal-bg').classList.add('open');
  refreshIcons();
}

function closeModal() { document.getElementById('modal-bg').classList.remove('open'); }
function closeModalBg(e) { if (e.target === document.getElementById('modal-bg')) closeModal(); }

function saveTemuan() {
  const isSub = document.getElementById('m-is-sub').value === 'true';
  const sel   = document.getElementById('m-status-select').value;
  let raw     = cleanOutput(document.getElementById('m-output').value);

  // Kriteria, Sebab, Rekomendasi diisi di halaman Detail: saat ubah, nilai lama dipertahankan
  const origRow = document.getElementById('m-row').value ? S.allR.find(x => String(x._row) === String(document.getElementById('m-row').value)) : null;
  const keep = k => (origRow && origRow[k] != null ? origRow[k] : '');

  if (sel === 'selesai') raw = raw ? raw + ' [Selesai]' : 'Selesai [Selesai]';
  else if (sel === 'proses') raw = raw ? raw + ' [Proses]' : '[Proses]';
  else raw = raw ? raw + ' [Belum]' : '[Belum]';

  const fd = {
    No: document.getElementById('m-no').value,
    PIC: getSelectedPics().join(PIC_SEP),
    Temuan: document.getElementById('m-temuan').value.trim(),
    SubTemuan: document.getElementById('m-subtemuan').value.trim(),
    Kriteria: keep('Kriteria'),
    Sebab: keep('Sebab'),
    Rekomendasi: keep('Rekomendasi'),
    RencanaAksi: document.getElementById('m-rencanaaksi').value.trim(),
    JadwalPelaksanaan: document.getElementById('m-jadwal').value.trim(),
    Output: raw,
    isSubAdd: isSub,
    parentRow: document.getElementById('m-parent-row').value,
  };

  if (isPicUser()) {
    // Akun PIC: kolom A–G selalu diambil dari data asli, hanya H–J + status yang boleh berubah
    const rowId = document.getElementById('m-row').value;
    const orig = rowId ? S.allR.find(x => String(x._row) === String(rowId)) : null;
    if (!orig) { showToast('Akun PIC hanya dapat mengisi temuan yang ditugaskan kepadanya', 'err'); return; }
    ['No', 'Temuan', 'SubTemuan', 'Kriteria', 'Sebab', 'Rekomendasi', 'PIC'].forEach(k => { fd[k] = orig[k] == null ? '' : orig[k]; });
    fd.isSubAdd = false;
    fd.parentRow = '';
  }

  if (!fd.Temuan) { showToast('Uraian Temuan wajib diisi', 'err'); return; }
  if (!fd.PIC) { showToast('Pilih minimal 1 PIC', 'err'); return; }

  const row = document.getElementById('m-row').value;
  const btn = document.querySelector('.modal-footer-area .btn-action-pri');

  if (btn) {
    btn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width:16px;"></i> Menyimpan...';
    btn.disabled = true;
    refreshIcons();
  }

  const url = row ? '/api/temuan/' + row : '/api/temuan';
  const method = row ? 'PUT' : 'POST';

  apiFetch(url, method, fd)
    .then(res => {
      if (btn) {
        btn.innerHTML = '<i data-lucide="save" style="width:16px"></i> Simpan Data';
        btn.disabled = false;
      }
      if (res && res.success) {
        if (fd.No) S.riOpen['t:' + fd.No] = true;
        closeModal();
        showToast('Data berhasil disimpan!', 'ok');
        refreshCurrentPage();
      } else {
        showToast((res && res.message) ? res.message : 'Gagal menyimpan data', 'err');
      }
    })
    .catch(e => {
      if (btn) {
        btn.innerHTML = '<i data-lucide="save" style="width:16px"></i> Simpan Data';
        btn.disabled = false;
      }
      showToast('Error: ' + e.message, 'err');
    });
}

function refreshCurrentPage() {
  if (S.page === 'ruang-isian') loadRuangIsian(S.riFilter || '');
  else if (S.page === 'ruang-isian-detail') loadDetail(S.riFilter || '');
  else if (S.page === 'rekap') loadRekap();
  else loadDashboard();
}

// ══════════════════ DELETE HANDLING ══════════════════════════════
let _delRow = null;

function confirmDel(row) {
  _delRow = row;
  document.getElementById('conf-bg').classList.add('open');
}

function closeConf() {
  document.getElementById('conf-bg').classList.remove('open');
  _delRow = null;
}

function executeDelete() {
  if (!_delRow) return;
  const row = _delRow;
  closeConf();

  apiFetch('/api/temuan/' + row, 'DELETE')
    .then(res => {
      if (res && res.success) {
        showToast('Data berhasil dihapus', 'ok');
        refreshCurrentPage();
      } else {
        showToast((res && res.message) ? res.message : 'Gagal menghapus data', 'err');
      }
    })
    .catch(e => showToast('Error: ' + e.message, 'err'));
}