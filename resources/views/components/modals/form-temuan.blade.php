<div id="modal-bg" class="modal-backdrop" onclick="closeModalBg(event)">
  <div class="modal-window">
    <div class="modal-header-area">
      <div>
        <div id="modal-title" class="modal-title-text">Tambah Tindak Lanjut</div>
        <div id="modal-sub" style="font-size:12px;color:var(--text-muted)">Isi data tindak lanjut hasil pemeriksaan MKDI</div>
      </div>
      <button class="modal-close-btn" onclick="closeModal()"><i data-lucide="x" style="width:18px;height:18px;"></i></button>
    </div>

    <div class="modal-body-area">
      <input type="hidden" id="m-row">
      <input type="hidden" id="m-parent-row">
      <input type="hidden" id="m-is-sub">

      <div id="m-role-note" class="role-note" style="display:none;">
        Kolom No sampai PIC diisi oleh admin (Inspektorat) dan tidak dapat diubah. Silakan isi <b>Rencana Aksi</b>, <b>Jadwal Pelaksanaan</b>, dan <b>Output</b>.
      </div>

      <div class="form-field">
        <label>No Temuan</label>
        <input id="m-no" type="text" placeholder="Contoh: 1">
      </div>

      <div class="form-field">
        <label>PIC (Penanggung Jawab)</label>
        <div id="m-pic" class="pic-check-list"></div>
        <div class="pic-manual">
          <input id="m-pic-manual" type="text" placeholder="Ketik PIC lain (bisa lebih dari satu, pisahkan koma)" onkeydown="if(event.key==='Enter'){event.preventDefault();addManualPic();}">
          <button type="button" class="btn-action-sec" onclick="addManualPic()"><i data-lucide="plus" style="width:14px;height:14px;"></i> Tambah</button>
        </div>
        <div class="field-hint">Centang lebih dari satu jika PIC-nya banyak, atau ketik manual jika tidak ada di daftar.</div>
      </div>

      <div class="form-field">
        <label>Status Progress</label>
        <select id="m-status-select" style="font-weight:700;">
          <option value="proses">🟡 Dalam Proses</option>
          <option value="selesai">🟢 Selesai</option>
          <option value="belum">🔴 Belum Ditindaklanjuti</option>
        </select>
      </div>

      <div class="form-field">
        <label>Uraian Temuan Utama</label>
        <textarea id="m-temuan" placeholder="Uraikan temuan pemeriksaan MKDI..."></textarea>
      </div>

      <div class="form-field">
        <label>Sub Temuan</label>
        <textarea id="m-subtemuan" placeholder="Uraikan sub temuan tindak lanjut..."></textarea>
      </div>

      <div class="form-field"><label>Rencana Aksi</label><textarea id="m-rencanaaksi" placeholder="Rencana aksi unit kerja"></textarea></div>

      <div class="form-field"><label>Jadwal Pelaksanaan</label><textarea id="m-jadwal" placeholder="mis. Triwulan II 2026 (boleh lebih dari satu baris, tekan Enter)"></textarea></div>
      <div class="form-field"><label>Output / Hasil</label><textarea id="m-output" placeholder="Dokumen bukti atau hasil (boleh lebih dari satu baris, tekan Enter)"></textarea></div>
    </div>

    <div class="modal-footer-area">
      <button class="btn-action-sec" onclick="closeModal()">Batal</button>
      <button class="btn-action-pri" onclick="saveTemuan()"><i data-lucide="save" style="width:16px;height:16px;"></i> Simpan Data</button>
    </div>
  </div>
</div>