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

  document.getElementById('ri-count').textContent = `${Object.keys(groups).length} Temuan Utama (${rows.length} Rincian)`;
  
  let html = '';
  Object.keys(groups).forEach(noKey => {
    const items = groups[noKey];
    const parent = items[0];

    html += `
      <div class="entry-card">
        <div class="entry-card-header" onclick="togEntry(this)">
          <div class="entry-badge-no">${esc(parent.No) || '-'}</div>
          <div style="flex:1;">
            <div class="entry-title-text" style="font-weight:700;font-size:14px;color:#0f172a;">${esc(parent.Temuan) || '—'}</div>
            <div style="font-size:11.5px;color:#64748b;margin-top:2px;">PIC: <strong>${esc(groupPicNames(items).join(', ') || '-')}</strong> (${items.length} Rincian Sub-Tindak Lanjut)</div>
          </div>
          ${canAdmin ? `<button class="btn-action-sec" style="padding:6px 12px;font-size:12px;" onclick="event.stopPropagation(); openAddSubModal(${items[items.length - 1]._row})">
            <i data-lucide="plus-circle" style="width:14px;"></i> Tambah Sub
          </button>` : ''}
        </div>

        <div class="sub-item-block" style="display:none;">
          ${items.map((sub, idx) => {
            const st = statusOf(sub);
            return `
              <div style="background:#fff;padding:14px;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:10px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                  <strong style="font-size:13px;">Rincian #${idx + 1}${sub.SubTemuan ? ' - ' + esc(sub.SubTemuan) : ''}</strong>
                  <div style="display:flex;gap:6px;align-items:center;">
                    <span class="status-pill ${st.cls}">
                      <i data-lucide="${st.icon}" style="width:12px;"></i> ${st.lbl.toUpperCase()}
                    </span>
                    <button class="btn-action-sec" style="padding:4px 8px;" onclick="openModal('${esc(jsq(sub.PIC))}',${sub._row})"><i data-lucide="edit-3" style="width:13px;"></i></button>
                    ${canAdmin ? `<button class="btn-action-sec" style="padding:4px 8px;color:#ef4444;" onclick="confirmDel(${sub._row})"><i data-lucide="trash-2" style="width:13px;"></i></button>` : ''}
                  </div>
                </div>
                <div class="sub-grid">
                  <div><b>KRITERIA:</b> ${esc(sub.Kriteria) || '-'}</div>
                  <div><b>SEBAB:</b> ${esc(sub.Sebab) || '-'}</div>
                  <div><b>REKOMENDASI:</b> ${esc(sub.Rekomendasi) || '-'}</div>
                  <div><b>RENCANA AKSI:</b> ${esc(sub.RencanaAksi) || '-'}</div>
                  <div><b>JADWAL:</b> ${esc(sub.JadwalPelaksanaan) || '-'}</div>
                  <div><b>OUTPUT:</b> ${esc(cleanOutput(sub.Output)) || '-'}</div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>`;
  });

  list.innerHTML = html;
  refreshIcons();
}

function togEntry(headerEl) {
  const subBlock = headerEl.nextElementSibling;
  if (subBlock) {
    subBlock.style.display = subBlock.style.display === 'none' ? 'block' : 'none';
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
  document.getElementById('modal-sub').textContent   = row ? 'Perbarui rincian data tindak lanjut' : 'Lengkapi isian data temuan BPK berikut';

  const temuanInp = document.getElementById('m-temuan');
  temuanInp.readOnly = false;
  temuanInp.style.background = '#f8fafc';

  ['m-no', 'm-temuan', 'm-subtemuan', 'm-kriteria', 'm-sebab', 'm-rekomendasi', 'm-rencanaaksi', 'm-jadwal', 'm-output'].forEach(id => {
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
      document.getElementById('m-kriteria').value     = r.Kriteria || '';
      document.getElementById('m-sebab').value        = r.Sebab || '';
      document.getElementById('m-rekomendasi').value  = r.Rekomendasi || '';
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

  document.getElementById('modal-title').textContent = 'Tambah Sub/Detail Tindak Lanjut';
  document.getElementById('modal-sub').textContent   = 'Menambahkan rincian untuk Temuan No. ' + r.No;

  document.getElementById('m-no').value = r.No || '';
  const temuanInp = document.getElementById('m-temuan');
  temuanInp.value = r.Temuan || '';
  temuanInp.readOnly = true;
  temuanInp.style.background = '#eef2ff';

  renderPicChecklist(splitPics(r.PIC));
  applyModalRole();
  document.getElementById('m-status-select').value = 'proses';

  ['m-subtemuan', 'm-kriteria', 'm-sebab', 'm-rekomendasi', 'm-rencanaaksi', 'm-jadwal', 'm-output'].forEach(id => {
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

  if (sel === 'selesai') raw = raw ? raw + ' [Selesai]' : 'Selesai [Selesai]';
  else if (sel === 'proses') raw = raw ? raw + ' [Proses]' : '[Proses]';
  else raw = raw ? raw + ' [Belum]' : '[Belum]';

  const fd = {
    No: document.getElementById('m-no').value,
    PIC: getSelectedPics().join(PIC_SEP),
    Temuan: document.getElementById('m-temuan').value.trim(),
    SubTemuan: document.getElementById('m-subtemuan').value.trim(),
    Kriteria: document.getElementById('m-kriteria').value.trim(),
    Sebab: document.getElementById('m-sebab').value.trim(),
    Rekomendasi: document.getElementById('m-rekomendasi').value.trim(),
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
