/* kmdi/bukti.js - Formulir Unggah Bukti Tindak Lanjut (eviden) per rincian temuan.
 *
 * File ini berdiri sendiri: tidak mengubah fungsi lama. Semua nama diawali "bk"/"Bukti"
 * supaya tidak bentrok dengan core.js, ruang-isian.js, rekap.js, dll.
 * Dipanggil dari tombol "Bukti" di riSubHtml() (ruang-isian.js) lewat openBukti(rowId).
 * Memakai: S, esc, showToast, refreshIcons, isPicUser, isAdminUser, isStaffUser, isAuditorUser, tlPill, subLabel, refreshCurrentPage, apiFetch.
 */

const BK_MAX_BYTES = 10 * 1024 * 1024;                       // 10 MB per berkas
const BK_EXT       = ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx', 'xls', 'xlsx'];

const BK_STATUS = {
  menunggu:      { cls: 'bk-st-menunggu',      icon: 'clock',          lbl: 'Menunggu Verifikasi Auditor' },
  pending:       { cls: 'bk-st-pending',       icon: 'pause-circle',   lbl: 'Pending (Ditahan Auditor)' },
  terverifikasi: { cls: 'bk-st-terverifikasi', icon: 'badge-check',    lbl: 'Terverifikasi Auditor' },
  ditolak:       { cls: 'bk-st-ditolak',       icon: 'alert-triangle', lbl: 'Ditolak - Perlu Perbaikan' },
  batl:          { cls: 'bk-st-batl',          icon: 'file-check-2',   lbl: 'Selesai - BATL Terbit' },
  kosong:        { cls: 'bk-st-kosong',        icon: 'minus-circle',   lbl: 'Belum Ada Bukti' }
};

let _bk = { rowId: null, list: [], busy: false, dirty: false, batl: null, canBatl: false, tl: 'belum' };

// ── Util kecil ─────────────────────────────────────────────────────
function bkToday() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

function bkDate(ymd) {                       // 2026-10-26 -> 26/10/2026
  const m = String(ymd || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? m[3] + '/' + m[2] + '/' + m[1] : '-';
}

function bkSize(n) {
  n = Number(n) || 0;
  if (n >= 1048576) return (n / 1048576).toFixed(1) + ' MB';
  if (n >= 1024)    return Math.round(n / 1024) + ' KB';
  return n + ' B';
}

function bkExt(name) {
  const m = String(name || '').toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
}

function bkPill(key) {
  const s = BK_STATUS[key] || BK_STATUS.kosong;
  return `<span class="bk-pill ${s.cls}"><i data-lucide="${s.icon}"></i> ${s.lbl}</span>`;
}

// Kirim FormData (multipart). apiFetch() di core.js selalu JSON, jadi upload punya helper sendiri.
async function bkUpload(url, formData) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'X-CSRF-TOKEN': S.csrf },   // Content-Type diisi browser (boundary)
    body: formData,
    credentials: 'same-origin'
  });

  if (res.status === 401 && S.user) {
    S.user = null;
    showLogin();
    showToast('Sesi berakhir. Silakan login kembali.', 'err');
  }
  if (res.status === 413) {
    throw new Error('Ukuran berkas melebihi batas server (post_max_size / upload_max_filesize).');
  }
  const ct = res.headers.get('content-type');
  if (!ct || !ct.includes('application/json')) {
    throw new Error('Server error ' + res.status + '. Periksa log Laravel.');
  }
  return res.json();
}

// ── Modal (dibuat sekali lewat JS, sama seperti modal Detail) ──────
function ensureBuktiModal() {
  if (document.getElementById('bk-bg')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div id="bk-bg" class="modal-backdrop" onclick="closeBuktiBg(event)">
      <div class="modal-window bk-window">
        <div class="modal-header-area">
          <div class="bk-head">
            <div class="bk-head-icon"><i data-lucide="cloud-upload" style="width:20px;height:20px;"></i></div>
            <div class="bk-head-text">
              <div class="bk-title">Formulir Unggah Bukti Tindak Lanjut</div>
              <div class="bk-sub">Lengkapi rentang waktu pelaksanaan, uraian capaian aktual, serta dokumen bukti dukung resmi</div>
            </div>
          </div>
          <div class="bk-head-right">
            <span id="bk-status" class="bk-status-slot"></span>
            <button class="modal-close-btn" onclick="closeBukti()"><i data-lucide="x" style="width:18px;height:18px;"></i></button>
          </div>
        </div>

        <div class="modal-body-area">
          <div id="bk-status-m" class="bk-status-slot-mobile"></div>
          <div id="bk-ctx" class="bk-ctx"></div>
          <div id="bk-batl"></div>

          <div id="bk-form">
          <div class="bk-card">
            <div class="bk-label"><i data-lucide="calendar-days"></i> Rentang Tanggal Tindak Lanjut <span class="bk-req">*</span></div>
            <div class="bk-grid-2">
              <div class="bk-field">
                <label for="bk-mulai">Tanggal Mulai Tindak Lanjut <span class="bk-req">*</span></label>
                <input id="bk-mulai" type="date">
              </div>
              <div class="bk-field">
                <label for="bk-selesai">Tanggal Selesai Tindak Lanjut <span class="bk-req">*</span></label>
                <input id="bk-selesai" type="date">
              </div>
            </div>
          </div>

          <div class="bk-block">
            <div class="bk-label"><i data-lucide="pencil-line"></i> Uraian Progres / Tindak Lanjut Aktual <span class="bk-req">*</span></div>
            <textarea id="bk-uraian" class="bk-textarea" maxlength="5000" placeholder="Jelaskan secara rinci tindakan nyata atau dokumen penyelesaian yang telah dilaksanakan oleh Unit Kerja..."></textarea>
          </div>

          <div class="bk-block">
            <div class="bk-label"><i data-lucide="paperclip"></i> Unggah Berkas Bukti Dukung (Eviden)</div>
            <div id="bk-drop" class="bk-drop">
              <input id="bk-file" type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx" onchange="bkPickFile(this)">
              <div class="bk-drop-info">
                <div>
                  <strong class="bk-info-title"><i data-lucide="file-check-2"></i> Format File Spesifik:</strong>
                  <div class="bk-chips">
                    <span class="bk-chip bk-chip-pdf">PDF (.pdf)</span>
                    <span class="bk-chip bk-chip-img">Gambar (.png, .jpg, .jpeg)</span>
                    <span class="bk-chip bk-chip-word">Word (.doc, .docx)</span>
                    <span class="bk-chip bk-chip-excel">Excel (.xls, .xlsx)</span>
                  </div>
                </div>
                <div>
                  <strong class="bk-info-title"><i data-lucide="hard-drive"></i> Kapasitas &amp; Ketentuan Unggah:</strong>
                  <div>Ukuran maksimal <strong>10 MB</strong> per file (Maks. 1 file setiap pengiriman progres).</div>
                </div>
              </div>
            </div>
          </div>

          <div class="bk-actions">
            <button type="button" class="bk-btn" onclick="bkReset()">Reset Form</button>
            <button type="button" id="bk-submit" class="bk-btn bk-btn-pri" onclick="bkSubmit()"></button>
          </div>
          </div>

          <div class="bk-history-title"><i data-lucide="history"></i> Riwayat Pengiriman Bukti</div>
          <div id="bk-list"></div>
        </div>
      </div>
    </div>`);

  // Drag & drop berkas ke kotak unggah
  const drop = document.getElementById('bk-drop');
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('bk-over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('bk-over'); }));
  drop.addEventListener('drop', e => {
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (!f) return;
    const dt = new DataTransfer();
    dt.items.add(f);                                   // hanya 1 berkas
    const inp = document.getElementById('bk-file');
    inp.files = dt.files;
    bkPickFile(inp);
  });
}

function bkSubmitLabel(busy) {
  const btn = document.getElementById('bk-submit');
  if (!btn) return;
  btn.disabled = !!busy;
  btn.innerHTML = busy
    ? '<i data-lucide="loader-2" class="spin" style="width:16px;height:16px;"></i> Mengirim...'
    : '<i data-lucide="send" style="width:16px;height:16px;"></i> Kirim Bukti Tindak Lanjut';
  refreshIcons();
}

function bkRowLabel(r) {
  const grp = S.allR.filter(x => String(x.No) === String(r.No));
  const idx = Math.max(0, grp.findIndex(x => String(x._row) === String(r._row)));
  return 'Temuan No. ' + (r.No || '-') + ' · ' + subLabel(grp.length || 1, idx) + (r.SubTemuan ? ' - ' + riShort(r.SubTemuan, 90) : '');
}

// ── Buka / tutup ───────────────────────────────────────────────────
function openBukti(rowId) {
  const r = (S.allR || []).find(x => String(x._row) === String(rowId));
  if (!r) { showToast('Data temuan tidak ditemukan', 'err'); return; }

  ensureBuktiModal();
  _bk = { rowId: r._row, list: [], busy: false, dirty: false, no: r.No, batl: null, canBatl: false, tl: 'belum' };

  document.getElementById('bk-ctx').textContent = bkRowLabel(r);
  bkReset();
  bkSetStatus(null);
  bkSubmitLabel(false);
  bkRenderBatl();
  document.getElementById('bk-list').innerHTML = '<div class="bk-empty">Memuat riwayat...</div>';

  document.getElementById('bk-bg').classList.add('open');
  refreshIcons();
  bkLoad();
}

function closeBukti() {
  const bg = document.getElementById('bk-bg');
  if (bg) bg.classList.remove('open');
  if (_bk.dirty) {                       // jumlah bukti di halaman belakang ikut diperbarui
    if (_bk.no) S.riOpen['t:' + _bk.no] = true;
    if (_bk.no) S.riOpen['d:' + _bk.no] = true;
    _bk.dirty = false;
    refreshCurrentPage();
  }
}
function closeBuktiBg(e) {
  if (e.target === document.getElementById('bk-bg')) closeBukti();
}

// ── Form ───────────────────────────────────────────────────────────
function bkReset() {
  const t = bkToday();
  document.getElementById('bk-mulai').value   = t;
  document.getElementById('bk-selesai').value = t;
  document.getElementById('bk-uraian').value  = '';
  document.getElementById('bk-file').value    = '';
}

function bkPickFile(inp) {
  const f = inp.files && inp.files[0];
  if (!f) return;
  if (!BK_EXT.includes(bkExt(f.name))) {
    inp.value = '';
    showToast('Format berkas tidak didukung. Gunakan PDF, gambar, Word, atau Excel.', 'err');
    return;
  }
  if (f.size > BK_MAX_BYTES) {
    inp.value = '';
    showToast('Ukuran berkas maksimal 10 MB (berkas Anda ' + bkSize(f.size) + ').', 'err');
  }
}

async function bkSubmit() {
  if (_bk.busy) return;

  const mulai   = document.getElementById('bk-mulai').value;
  const selesai = document.getElementById('bk-selesai').value;
  const uraian  = document.getElementById('bk-uraian').value.trim();
  const inp     = document.getElementById('bk-file');
  const file    = inp.files && inp.files[0];

  if (!mulai || !selesai) { showToast('Tanggal mulai dan selesai wajib diisi', 'err'); return; }
  if (selesai < mulai)    { showToast('Tanggal selesai tidak boleh lebih awal dari tanggal mulai', 'err'); return; }
  if (!uraian)            { showToast('Uraian progres wajib diisi', 'err'); return; }
  if (file && (!BK_EXT.includes(bkExt(file.name)) || file.size > BK_MAX_BYTES)) {
    showToast('Berkas tidak valid (format atau ukuran)', 'err');
    return;
  }

  const fd = new FormData();
  fd.append('temuan_id', _bk.rowId);
  fd.append('tanggal_mulai', mulai);
  fd.append('tanggal_selesai', selesai);
  fd.append('uraian', uraian);
  if (file) fd.append('file', file);

  _bk.busy = true;
  bkSubmitLabel(true);
  try {
    const res = await bkUpload('/api/bukti', fd);
    if (!res || !res.success) throw new Error((res && res.message) ? res.message : 'Gagal mengirim bukti');
    showToast('Bukti tindak lanjut berhasil dikirim', 'ok');
    _bk.dirty = true;
    bkReset();
    await bkLoad();
  } catch (e) {
    showToast('Error: ' + e.message, 'err');
  }
  _bk.busy = false;
  bkSubmitLabel(false);
}

// ── Riwayat ────────────────────────────────────────────────────────
function bkSetStatus(key) {
  const html = bkPill(key || 'kosong');
  const a = document.getElementById('bk-status');
  const b = document.getElementById('bk-status-m');
  if (a) a.innerHTML = html;
  if (b) b.innerHTML = html;
}

async function bkLoad() {
  const id = _bk.rowId;
  try {
    const res = await apiFetch('/api/bukti?temuan_id=' + encodeURIComponent(id));
    if (id !== _bk.rowId) return;                          // modal sudah pindah ke rincian lain
    if (!res || !res.success) throw new Error((res && res.message) ? res.message : 'Gagal memuat riwayat');
    _bk.list    = res.data || [];
    _bk.batl    = res.batl || null;
    _bk.canBatl = !!res.canBatl;
    _bk.tl      = res.tlStatus || 'belum';
    bkSetStatus(_bk.tl === 'belum' ? null : _bk.tl);
    bkRenderBatl();
    bkRenderList();
  } catch (e) {
    document.getElementById('bk-list').innerHTML = '<div class="bk-empty">Gagal memuat riwayat bukti.</div>';
    showToast('Error: ' + e.message, 'err');
  }
  bkSubmitLabel(_bk.busy);
}

function bkItemHtml(b) {
  const staff  = isStaffUser();
  const locked = !!_bk.batl;                              // BATL terbit = riwayat dikunci
  const canDel = !locked && (isAdminUser() || (isPicUser() && b.status !== 'terverifikasi'));
  const id     = Number(b.id);

  const file = b.fileUrl
    ? `<i data-lucide="paperclip"></i><a href="${esc(b.fileUrl)}" target="_blank" rel="noopener">${esc(b.fileName || 'Berkas')}</a><span class="bk-item-nofile">(${esc(bkSize(b.fileSize))})</span>`
    : `<i data-lucide="paperclip"></i><span class="bk-item-nofile">Tanpa berkas</span>`;

  let note = '';
  if (b.catatan) {
    const noteCls = b.status === 'terverifikasi' ? 'bk-note-ok' : (b.status === 'pending' ? 'bk-note-pending' : '');
    note = `<div class="bk-note ${noteCls}"><strong>Catatan Auditor:</strong> ${esc(b.catatan)}</div>`;
  }
  const verifiedMeta = b.diverifikasiOleh
    ? ` · Diverifikasi ${esc(b.diverifikasiOleh)}${b.diverifikasiPada ? ' (' + esc(b.diverifikasiPada) + ')' : ''}` : '';

  // Auditor dapat memutuskan (acc / pending / tolak) selama bukti masih menunggu atau ditahan
  const canDecide = staff && !locked && (b.status === 'menunggu' || b.status === 'pending');

  let actions = '';
  if (canDecide) {
    actions += `<button class="bk-btn bk-btn-sm bk-btn-ok" onclick="bkVerif(${id}, 'terverifikasi')"><i data-lucide="check" style="width:13px;height:13px;"></i> Acc</button>`;
    if (b.status === 'menunggu') {
      actions += `<button class="bk-btn bk-btn-sm bk-btn-hold" onclick="bkToggle('bk-pen-${id}')"><i data-lucide="pause" style="width:13px;height:13px;"></i> Pending</button>`;
    }
    actions += `<button class="bk-btn bk-btn-sm bk-btn-bad" onclick="bkToggle('bk-rej-${id}')"><i data-lucide="x" style="width:13px;height:13px;"></i> Tolak</button>`;
  }
  if (canDel) {
    actions += `<button class="bk-btn bk-btn-sm bk-btn-bad" onclick="bkToggle('bk-del-${id}')"><i data-lucide="trash-2" style="width:13px;height:13px;"></i> Hapus</button>`;
  }

  const penBox = (canDecide && b.status === 'menunggu') ? `
      <div id="bk-pen-${id}" class="bk-inline">
        <textarea id="bk-pen-txt-${id}" class="bk-textarea" placeholder="Alasan ditahan / klarifikasi yang dibutuhkan (wajib)"></textarea>
        <div class="bk-actions">
          <button class="bk-btn bk-btn-sm" onclick="bkToggle('bk-pen-${id}')">Batal</button>
          <button class="bk-btn bk-btn-sm bk-btn-hold" onclick="bkVerif(${id}, 'pending')">Tandai Pending</button>
        </div>
      </div>` : '';

  const rejBox = canDecide ? `
      <div id="bk-rej-${id}" class="bk-inline">
        <textarea id="bk-rej-txt-${id}" class="bk-textarea" placeholder="Alasan penolakan / perbaikan yang diminta (wajib)"></textarea>
        <div class="bk-actions">
          <button class="bk-btn bk-btn-sm" onclick="bkToggle('bk-rej-${id}')">Batal</button>
          <button class="bk-btn bk-btn-sm bk-btn-bad" onclick="bkVerif(${id}, 'ditolak')">Kirim Penolakan</button>
        </div>
      </div>` : '';

  const delBox = canDel ? `
      <div id="bk-del-${id}" class="bk-inline">
        <div class="bk-note">Hapus pengiriman bukti ini beserta berkasnya secara permanen?</div>
        <div class="bk-actions">
          <button class="bk-btn bk-btn-sm" onclick="bkToggle('bk-del-${id}')">Batal</button>
          <button class="bk-btn bk-btn-sm bk-btn-bad" onclick="bkDelete(${id})">Ya, Hapus</button>
        </div>
      </div>` : '';

  return `
    <div class="bk-item">
      <div class="bk-item-head">
        <div class="bk-item-period"><i data-lucide="calendar-days"></i> ${bkDate(b.tanggalMulai)} &ndash; ${bkDate(b.tanggalSelesai)}</div>
        ${bkPill(b.status)}
      </div>
      <div class="bk-item-text">${esc(b.uraian)}</div>
      <div class="bk-item-file">${file}</div>
      <div class="bk-item-meta">Dikirim oleh ${esc(b.diunggahOleh || '-')} · ${esc(b.dibuat || '')}${verifiedMeta}</div>
      ${note}
      ${actions ? `<div class="bk-item-actions">${actions}</div>` : ''}
      ${penBox}${rejBox}${delBox}
    </div>`;
}

// ── Panel BATL (Berita Acara Tindak Lanjut) + visibilitas form unggah ─
function bkRenderBatl() {
  const box  = document.getElementById('bk-batl');
  const form = document.getElementById('bk-form');
  if (!box) return;

  const staff = isStaffUser();
  // Form unggah: hanya biro (PIC) / admin, dan tertutup setelah BATL terbit
  if (form) form.style.display = (isAuditorUser() || _bk.batl) ? 'none' : '';

  // Biro melihat posisi proses temuan ini (progres)
  const prog = `<div class="bk-progress"><span>Status tindak lanjut:</span> ${tlPill(_bk.tl)}</div>`;

  if (_bk.batl) {
    const b = _bk.batl;
    const file = b.fileUrl
      ? `<a href="${esc(b.fileUrl)}" target="_blank" rel="noopener"><i data-lucide="paperclip" style="width:13px;height:13px;"></i> ${esc(b.fileName || 'Berkas BATL')}</a> <span class="bk-item-nofile">(${esc(bkSize(b.fileSize))})</span>`
      : '<span class="bk-item-nofile">Tanpa berkas</span>';
    box.innerHTML = prog + `
      <div class="bk-batl bk-batl-done">
        <div class="bk-batl-head"><i data-lucide="file-check-2"></i> Berita Acara Tindak Lanjut (BATL)</div>
        <div class="bk-batl-grid">
          <div><span>Nomor BATL</span><strong>${esc(b.nomor)}</strong></div>
          <div><span>Tanggal</span><strong>${bkDate(b.tanggal)}</strong></div>
          <div><span>Diterbitkan oleh</span><strong>${esc(b.diterbitkanOleh || '-')}</strong></div>
        </div>
        ${b.catatan ? `<div class="bk-note bk-note-ok"><strong>Catatan:</strong> ${esc(b.catatan)}</div>` : ''}
        <div class="bk-item-file" style="margin-top:8px;">${file}</div>
        ${staff ? `<div class="bk-item-actions"><button class="bk-btn bk-btn-sm bk-btn-bad" onclick="bkToggle('bk-batl-cancel')"><i data-lucide="undo-2" style="width:13px;height:13px;"></i> Batalkan BATL</button></div>
        <div id="bk-batl-cancel" class="bk-inline">
          <div class="bk-note">Batalkan BATL? Temuan kembali berstatus proses dan biro dapat mengirim bukti lagi.</div>
          <div class="bk-actions">
            <button class="bk-btn bk-btn-sm" onclick="bkToggle('bk-batl-cancel')">Tidak</button>
            <button class="bk-btn bk-btn-sm bk-btn-bad" onclick="bkBatlCancel(${Number(b.id)})">Ya, Batalkan</button>
          </div>
        </div>` : ''}
      </div>`;
    refreshIcons();
    return;
  }

  if (staff && _bk.canBatl) {
    box.innerHTML = prog + `
      <div class="bk-batl">
        <div class="bk-batl-head"><i data-lucide="file-signature"></i> Terbitkan BATL</div>
        <div class="bk-sub" style="margin-bottom:12px;">Bukti sudah terverifikasi. Terbitkan Berita Acara Tindak Lanjut untuk menyelesaikan temuan ini.</div>
        <div class="bk-grid-2">
          <div class="bk-field"><label for="bk-batl-nomor">Nomor BATL <span class="bk-req">*</span></label><input id="bk-batl-nomor" type="text" maxlength="120" placeholder="mis. BATL/001/2026"></div>
          <div class="bk-field"><label for="bk-batl-tgl">Tanggal BATL <span class="bk-req">*</span></label><input id="bk-batl-tgl" type="date" value="${bkToday()}"></div>
        </div>
        <div class="bk-block"><div class="bk-label">Catatan (opsional)</div><textarea id="bk-batl-cat" class="bk-textarea" maxlength="5000" placeholder="Catatan penyelesaian tindak lanjut"></textarea></div>
        <div class="bk-block"><div class="bk-label"><i data-lucide="paperclip"></i> Berkas BATL (opsional, PDF/gambar/Word, maks 10 MB)</div><input id="bk-batl-file" type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"></div>
        <div class="bk-actions"><button type="button" id="bk-batl-submit" class="bk-btn bk-btn-pri" onclick="bkBatlSubmit()"><i data-lucide="stamp" style="width:16px;height:16px;"></i> Terbitkan BATL</button></div>
      </div>`;
    refreshIcons();
    return;
  }

  box.innerHTML = prog;
  refreshIcons();
}

async function bkBatlSubmit() {
  if (_bk.busy) return;
  const nomor = document.getElementById('bk-batl-nomor').value.trim();
  const tgl   = document.getElementById('bk-batl-tgl').value;
  const cat   = document.getElementById('bk-batl-cat').value.trim();
  const inp   = document.getElementById('bk-batl-file');
  const file  = inp.files && inp.files[0];

  if (!nomor) { showToast('Nomor BATL wajib diisi', 'err'); return; }
  if (!tgl)   { showToast('Tanggal BATL wajib diisi', 'err'); return; }
  if (file && (!['pdf','png','jpg','jpeg','doc','docx'].includes(bkExt(file.name)) || file.size > BK_MAX_BYTES)) {
    showToast('Berkas BATL tidak valid (PDF/gambar/Word, maks 10 MB)', 'err'); return;
  }

  const fd = new FormData();
  fd.append('temuan_id', _bk.rowId);
  fd.append('nomor', nomor);
  fd.append('tanggal', tgl);
  if (cat) fd.append('catatan', cat);
  if (file) fd.append('file', file);

  const btn = document.getElementById('bk-batl-submit');
  _bk.busy = true; if (btn) btn.disabled = true;
  try {
    const res = await bkUpload('/api/batl', fd);
    if (!res || !res.success) throw new Error((res && res.message) ? res.message : 'Gagal menerbitkan BATL');
    showToast('BATL berhasil diterbitkan. Temuan selesai.', 'ok');
    _bk.dirty = true;
    await bkLoad();
  } catch (e) {
    showToast('Error: ' + e.message, 'err');
    if (btn) btn.disabled = false;
  }
  _bk.busy = false;
}

async function bkBatlCancel(id) {
  try {
    const res = await apiFetch('/api/batl/' + id, 'DELETE');
    if (!res || !res.success) throw new Error((res && res.message) ? res.message : 'Gagal membatalkan BATL');
    showToast('BATL dibatalkan', 'ok');
    _bk.dirty = true;
    await bkLoad();
  } catch (e) {
    showToast('Error: ' + e.message, 'err');
  }
}

function bkRenderList() {
  const box = document.getElementById('bk-list');
  if (!box) return;
  box.innerHTML = _bk.list.length
    ? _bk.list.map(bkItemHtml).join('')
    : '<div class="bk-empty">Belum ada bukti yang dikirim untuk rincian ini.</div>';
  refreshIcons();
}

function bkToggle(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('bk-show');
}

// ── Verifikasi (auditor) & hapus ─────────────────────────────────────
async function bkVerif(id, status) {
  let catatan = '';
  if (status === 'ditolak' || status === 'pending') {
    const prefix = status === 'ditolak' ? 'bk-rej-txt-' : 'bk-pen-txt-';
    catatan = ((document.getElementById(prefix + id) || {}).value || '').trim();
    if (!catatan) { showToast('Catatan wajib diisi jika bukti ' + (status === 'ditolak' ? 'ditolak' : 'ditahan (pending)'), 'err'); return; }
  }
  try {
    const res = await apiFetch('/api/bukti/' + id + '/verifikasi', 'PUT', { status: status, catatan: catatan });
    if (!res || !res.success) throw new Error((res && res.message) ? res.message : 'Gagal memperbarui status');
    showToast(status === 'terverifikasi' ? 'Bukti di-acc (terverifikasi)' : (status === 'pending' ? 'Bukti ditandai pending' : 'Bukti ditolak, biro diminta mengunggah ulang'), 'ok');
    _bk.dirty = true;
    bkLoad();
  } catch (e) {
    showToast('Error: ' + e.message, 'err');
  }
}

async function bkDelete(id) {
  try {
    const res = await apiFetch('/api/bukti/' + id, 'DELETE');
    if (!res || !res.success) throw new Error((res && res.message) ? res.message : 'Gagal menghapus bukti');
    showToast('Bukti berhasil dihapus', 'ok');
    _bk.dirty = true;
    bkLoad();
  } catch (e) {
    showToast('Error: ' + e.message, 'err');
  }
}

// Esc menutup modal bukti
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const bg = document.getElementById('bk-bg');
  if (bg && bg.classList.contains('open')) closeBukti();
});
