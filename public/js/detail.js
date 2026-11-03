/* detail.js - halaman RUANG ISIAN > Detail (Kriteria, Sebab, Rekomendasi)
   Isi file (urut): LIHAT -> TAMBAH & UBAH.  Memakai fungsi bersama dari ruang-isian.js. */

// ═══ DETAIL: LIHAT ═════════════════════════════════════════════════════

// ══════════════════ HALAMAN DETAIL ═══════════════════════════════
const DET_FIELDS = ['Kondisi', 'Kriteria', 'Sebab', 'Akibat', 'Rekomendasi'].map(key => ({ key, label: CATS[key].label }));

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
    .catch(err => { console.error('[e-TLHP] gagal memuat/merender data:', err); showToast('Gagal memuat data dari server', 'err'); });
}

function renderDetail() {
  const picOpts = allPicOptions().map(p => `<option value="${esc(p.username)}" ${S.riFilter === p.username ? 'selected' : ''}>${esc(p.nama)}</option>`).join('');
  const st = S.riStatus || 'all';
  const chipCls = key => (st === key)
    ? 'ri-status-chip px-3 py-1.5 text-xs font-semibold rounded-md transition-all bg-white text-slate-900 shadow-sm'
    : 'ri-status-chip px-3 py-1.5 text-xs font-medium rounded-md transition-all text-slate-600 hover:text-slate-900';

  setBody(`
    <div class="bg-white rounded-t-xl border border-slate-200/80 p-4 flex flex-col gap-3">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 bg-slate-100 rounded-lg p-1 w-fit">
          <button type="button" onclick="riSetStatusTab('all','det','filterDetail')" data-status="all" class="${chipCls('all')}">Semua Status</button>
          <button type="button" onclick="riSetStatusTab('on_progress','det','filterDetail')" data-status="on_progress" class="${chipCls('on_progress')}">On Progress</button>
          <button type="button" onclick="riSetStatusTab('selesai','det','filterDetail')" data-status="selesai" class="${chipCls('selesai')}">Selesai</button>
          <button type="button" onclick="riSetStatusTab('belum_tl','det','filterDetail')" data-status="belum_tl" class="${chipCls('belum_tl')}">Belum TL</button>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <div class="relative flex-1 sm:w-64">
            <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
            <input type="text" id="det-flt-q" value="${esc(S.riQ || '')}" oninput="filterDetail()" placeholder="Cari kode LHP, temuan, kriteria..."
              class="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all">
          </div>

          ${isPicUser() ? '' : `
          <button type="button" onclick="openDetAdd('', '', 'Kriteria')" class="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            <span>Tambah Detail</span>
          </button>`}
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
        <div class="flex items-center gap-1.5 text-xs font-medium text-slate-400 mr-1">
          <i data-lucide="sliders-horizontal" class="w-3.5 h-3.5"></i>
          <span>Filter:</span>
        </div>
        ${riFilterChips('det', 'filterDetail', picOpts)}
        <span class="text-xs font-semibold text-slate-500 ml-2" id="det-count"></span>
        <button type="button" onclick="riResetFilters('det','filterDetail')" class="h-8 px-2.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors flex items-center gap-1 ml-auto" title="Reset Filter">
          <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
          <span>Reset</span>
        </button>
      </div>
    </div>

    <div id="det-list"></div>
  `);

  renderDetailList();
}

function filterDetail() {
  riReadFilters('det');
  renderDetailList();
}

function detCard(f, r, canAdmin) {
  const add = canAdmin
    ? `<button type="button" class="cat-add" title="Tambah ${f.label}" aria-label="Tambah ${f.label}" onclick="openDetAdd('', '${esc(r._row)}', '${f.key}')"><i data-lucide="plus"></i></button>`
    : '';
  return catCard(f.key, catText(r[f.key]), { aside: add });
}

function detRowHtml(r, idx, canAdmin, total) {
  return `
    <div class="ri-sub">
      <div class="ri-sub-head">
        <div class="ri-sub-title">
          <div class="ri-sub-titletext">
            <strong>${subLabel(total || 1, idx)}${r.SubTemuan ? ' - ' + esc(r.SubTemuan) : ''}</strong>
            <div class="ri-sub-meta" style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;">
              <span title="${esc(groupPicNames([r]).join(', ') || '-')}"><i data-lucide="users" class="icon-plain"></i> ${esc(groupPicShort([r]).join(', ') || '-')}</span>
              ${dlLive(getDeadlineInfo(r), { start: r.TanggalInput })}
            </div>
          </div>
        </div>
        ${canAdmin ? `<div class="ri-sub-actions">
          <button class="btn-action-sec ri-btn" onclick="openDetEdit('${esc(r._row)}')"><i data-lucide="edit-3" style="width:13px;" class="icon-plain"></i> Ubah</button>
        </div>` : ''}
      </div>
      ${financialStripHtml(r.NilaiTemuan, r.NilaiRealisasi, r.Selisih)}
      <div class="det-grid">
        ${DET_FIELDS.map(f => detCard(f, r, canAdmin)).join('')}
      </div>
    </div>`;
}

function renderDetailList() {
  const rows = riApplyFilters(S.allR);
  const list = document.getElementById('det-list');
  const cnt  = document.getElementById('det-count');
  const canAdmin = !isPicUser();
  if (!list) return;

  if (!rows.length) {
    list.innerHTML = `
      <div style="text-align:center;padding:60px;background:#fff;border-radius:var(--r-xl);border:1.5px dashed var(--border-color);">
        <i data-lucide="file-text" style="width:40px;height:40px;color:var(--text-muted);margin-bottom:8px;" class="icon-plain"></i>
        <h4 style="font-weight:700">Data Tidak Ditemukan</h4>
        <p style="font-size:12px;color:var(--text-muted)">Coba sesuaikan pencarian atau tambahkan temuan baru.</p>
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
  if (cnt) cnt.textContent = `${Object.keys(groups).length} Temuan (${rows.length} Rincian)`;

  list.innerHTML = riTableHtml(groups, {
    prefix: 'd',
    canAdmin,
    action: (noKey) => `<button class="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400" onclick="event.stopPropagation(); openDetAdd('${esc(noKey)}', '', 'Kriteria')">
        <i data-lucide="plus-circle" style="width:14px;height:14px;" class="icon-plain"></i> Tambah Detail
      </button>`,
    inner: items => items.map((r, idx) => detRowHtml(r, idx, canAdmin, items.length)).join('')
  });
  refreshIcons();
}

// ═══ DETAIL: TAMBAH & UBAH ═════════════════════════════════════════════

// ── State modal ───────────────────────────
let _det = { mode: 'add', rowId: null };   // mode modal: 'add' | 'edit'
let _detPreset = null;                     // rincian yang sudah ditentukan saat modal dibuka

// ── Helper simpan ─────────────────────────

// Payload PUT /api/temuan/{id}. Backend menimpa SEMUA kolom (yang tidak dikirim jadi NULL),
// jadi semua field rincian harus ikut dikirim, lalu field yang diubah ditimpa lewat `over`.
function rowToPayload(r, over) {
  const p = {
    SubTemuan:         r.SubTemuan         == null ? '' : r.SubTemuan,
    Kondisi:           r.Kondisi           == null ? '' : r.Kondisi,
    Kriteria:          r.Kriteria          == null ? '' : r.Kriteria,
    Sebab:             r.Sebab             == null ? '' : r.Sebab,
    Akibat:            r.Akibat            == null ? '' : r.Akibat,
    Rekomendasi:       r.Rekomendasi       == null ? '' : r.Rekomendasi,
    NilaiTemuan:       r.NilaiTemuan       == null ? 0  : r.NilaiTemuan,
    PIC:               r.PIC               == null ? '' : r.PIC,
    RencanaAksi:       r.RencanaAksi       == null ? '' : r.RencanaAksi,
    JadwalPelaksanaan: r.JadwalPelaksanaan == null ? '' : r.JadwalPelaksanaan,
    Output:            r.Output            == null ? '' : r.Output
  };
  // Sub temuan mewarisi teks Temuan dari induk saat ditampilkan; jangan disalin ke baris sub.
  if (!r.isSubRow) p.Temuan = r.Temuan == null ? '' : r.Temuan;
  return Object.assign(p, over || {});
}

// Teks isian baru -> daftar butir. Satu butir per baris; penomoran/bullet di awal baris dibuang.
function parseNewItems(text) {
  return String(text == null ? '' : text)
    .replace(/\r/g, '')
    .split('\n')
    .map(line => line.replace(/^\s*(?:\d{1,2}\s*[.)]|[-*•])\s+/, '').trim())
    .filter(Boolean);
}

// Tambahkan butir baru ke isian yang sudah ada, nomori ulang "1. ...\n2. ...".
// Butir yang sudah ada (abaikan huruf besar/kecil & spasi) dilewati. Return { text, added }.
function appendItems(existing, items) {
  const norm = s => String(s).replace(/\s+/g, ' ').trim().toLowerCase();
  const list = parseList(existing).items.slice();
  const seen = new Set(list.map(norm));
  let added = 0;
  (items || []).forEach(it => {
    const k = norm(it);
    if (!k || seen.has(k)) return;
    seen.add(k);
    list.push(String(it).trim());
    added++;
  });
  return { text: list.map((t, i) => (i + 1) + '. ' + t).join('\n'), added: added };
}

// ── Modal Detail ──────────────────────────
// Modal detail sekarang ada di resources/views/components/modals/detail.blade.php
function ensureDetModal() { /* HTML sudah ada di halaman */ }

function renderDetRincian(preset) {
  let rows = preset;
  if (!rows) {
    const no = document.getElementById('det-temuan').value;
    rows = S.allR.filter(r => String(r.No) === String(no));
  }
  document.getElementById('det-rincian').innerHTML = rows.map(r => {
    const grp = S.allR.filter(x => String(x.No) === String(r.No));
    const label = subLabel(grp.length, Math.max(0, grp.indexOf(r)));
    return `
    <label class="pic-check-item">
      <input type="checkbox" value="${esc(r._row)}" checked>
      <span>${label}${r.SubTemuan ? ' - ' + esc(riShort(r.SubTemuan, 60)) : ''} &middot; ${esc(groupPicNames([r]).join(', ') || '-')}</span>
    </label>`;
  }).join('');
}

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
  const nilEl = document.getElementById('det-e-NilaiTemuan');
  if (nilEl) nilEl.value = formatRupiahNumber(r.NilaiTemuan || 0);

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
  const btnHtml = '<i data-lucide="save" style="width:16px;height:16px;" class="icon-plain"></i> Simpan';
  const setBusy = busy => {
    btn.disabled = busy;
    btn.innerHTML = busy ? '<i data-lucide="loader-2" class="spin" style="width:16px;"></i> Menyimpan...' : btnHtml;
    refreshIcons();
  };

  if (_det.mode === 'edit') {
    const r = S.allR.find(x => String(x._row) === String(_det.rowId));
    if (!r) { showToast('Data tidak ditemukan', 'err'); return; }
    const over = {};
    DET_FIELDS.forEach(f => { over[f.key] = document.getElementById('det-e-' + f.key).value.trim(); });
    const nilEl = document.getElementById('det-e-NilaiTemuan');
    if (nilEl) over.NilaiTemuan = parseRupiahValue(nilEl.value);

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

  const field = document.getElementById('det-field').value;
  const items = parseNewItems(document.getElementById('det-text').value);
  if (!items.length) { showToast('Tulis isi yang akan ditambahkan', 'err'); return; }

  const ids = Array.from(document.querySelectorAll('#det-rincian input[type="checkbox"]:checked')).map(i => String(i.value));
  if (!ids.length) { showToast('Pilih minimal 1 rincian', 'err'); return; }
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
    showToast(field + ' ditambahkan ke ' + ok + ' rincian', 'ok');
    refreshCurrentPage();
  } else {
    showToast('Isi tersebut sudah ada di rincian yang dipilih', 'inf');
  }
}