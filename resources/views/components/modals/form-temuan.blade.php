<div id="modal-bg" class="modal-backdrop" onclick="closeModalBg(event)">
  <div class="modal-window">
    <div class="modal-header-area">
      <div>
        <div id="modal-title" class="modal-title-text">Tambah Tindak Lanjut</div>
        <div id="modal-sub" style="font-size:12px;color:var(--text-muted)">Isi data temuan hasil audit</div>
      </div>
      <button class="modal-close-btn" onclick="closeModal()"><i data-lucide="x" style="width:18px;height:18px;"></i></button>
    </div>

    <div class="modal-body-area">
      <input type="hidden" id="m-row">
      <input type="hidden" id="m-parent-row">
      <input type="hidden" id="m-is-sub">

      <div id="m-role-note" class="role-note" style="display:none;">
        Data temuan (sumber, jenis audit, PIC, kriteria, sebab, akibat, rekomendasi) diisi oleh auditor (Inspektorat) dan tidak dapat diubah. Silakan isi <b>Rencana Aksi</b>, <b>Jadwal Pelaksanaan</b>, dan <b>Output</b>.
      </div>

      <div class="form-field" id="m-sumber-wrap">
        <label>Sumber Audit</label>
        <select id="m-sumber" onchange="onSumberChange()" style="font-weight:700;">
          <option value="inspektorat">Inspektorat</option>
          <option value="bpk">BPK RI</option>
        </select>
        <div class="field-hint">Menentukan kode temuan: BPK RI = LHP-BPK-xxx, Inspektorat = LHP-INS-xxx.</div>
      </div>

      <div class="form-field" id="m-jenis-wrap">
        <label>Jenis Audit <span style="color:#e11d48;">*</span></label>
        <select id="m-jenis" onchange="onJenisChange()">
          <option value="">Pilih jenis audit...</option>
          <option value="kinerja">Audit Kinerja (3E: Ekonomis, Efisiensi, Efektivitas)</option>
          <option value="keuangan">Audit Keuangan</option>
          <option value="kepatuhan">Audit Kepatuhan</option>
          <option value="khusus">Audit Khusus / Investigatif</option>
        </select>
        <div class="field-hint">Isi rincian temuan sama untuk semua jenis (kriteria, sebab, akibat, rekomendasi). Audit Keuangan ditambah nominal kerugian.</div>
      </div>

      <div class="form-field">
        <label>No. Dokumen (Surat LHP)</label>
        <input id="m-no" type="text" placeholder="Dibuat otomatis" readonly>
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
        <label>Uraian Temuan Utama</label>
        <textarea id="m-temuan" placeholder="Uraikan temuan pemeriksaan MKDI..."></textarea>
      </div>

      <div class="form-field">
        <label>Sub Temuan</label>
        <textarea id="m-subtemuan" placeholder="Uraikan sub temuan tindak lanjut..."></textarea>
      </div>

      <div class="form-field"><label>Kriteria</label><textarea id="m-kriteria" placeholder="Peraturan / SOP yang menjadi dasar (boleh lebih dari satu baris)"></textarea></div>
      <div class="form-field"><label>Sebab</label><textarea id="m-sebab" placeholder="Akar penyebab terjadinya temuan"></textarea></div>
      <div class="form-field"><label>Akibat</label><textarea id="m-akibat" placeholder="Dampak yang ditimbulkan (mis. pemborosan, kerugian negara)"></textarea></div>
      <div class="form-field"><label>Rekomendasi</label><textarea id="m-rekomendasi" placeholder="Rekomendasi auditor (boleh lebih dari satu baris)"></textarea></div>

      <div class="form-field" id="m-nominal-wrap" style="display:none;">
        <label>Nominal Kerugian (Rp) <span style="color:#e11d48;">*</span></label>
        <input id="m-nominal" type="text" inputmode="decimal" autocomplete="off" placeholder="mis. 1.500.000 (isi 0 bila tidak ada kerugian)">
        <div class="field-hint">Khusus Audit Keuangan.</div>
      </div>

      <div class="form-field" id="m-deadline-wrap">
        <label>Deadline Tindak Lanjut</label>
        <input id="m-deadline" type="date">
        <div class="field-hint">Batas waktu Satker menyelesaikan tindak lanjut. Tampil di Dashboard.</div>
      </div>

      <!-- Kolom ini diisi oleh akun PIC. Disembunyikan untuk admin. -->
      <div id="m-pic-fields">
        <div class="form-field"><label>Rencana Aksi</label><textarea id="m-rencanaaksi" placeholder="Rencana aksi unit kerja"></textarea></div>

        <div class="form-field"><label>Jadwal Pelaksanaan</label><textarea id="m-jadwal" placeholder="mis. Triwulan II 2026 (boleh lebih dari satu baris, tekan Enter)"></textarea></div>
        <div class="form-field"><label>Output / Hasil</label><textarea id="m-output" placeholder="Dokumen bukti atau hasil (boleh lebih dari satu baris, tekan Enter)"></textarea></div>
      </div>
    </div>

    <div class="modal-footer-area">
      <button class="btn-action-sec" onclick="closeModal()">Batal</button>
      <button class="btn-action-pri" onclick="saveTemuan()"><i data-lucide="save" style="width:16px;height:16px;"></i> Simpan Data</button>
    </div>
  </div>
</div>