{{-- Modal Unggah Bukti Tindak Lanjut. JS: public/js/bukti.js --}}
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
      <div id="bk-fin"></div>
      <div id="bk-batl"></div>

      <div id="bk-form">
      <div class="bk-card">
        <div class="bk-label" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;">
          <span style="display:inline-flex;align-items:center;gap:6px;"><i data-lucide="calendar-days"></i> Tanggal Dokumen / Pelaksanaan Tindak Lanjut <span class="bk-req">*</span></span>
          <span id="bk-deadline" style="font-size:11.5px;font-weight:600;color:#475569;"></span>
        </div>
        <div class="bk-grid-2">
          <div class="bk-field">
            <label for="bk-mulai">Tanggal Mulai / Tanggal Dokumen <span class="bk-req">*</span></label>
            <input id="bk-mulai" type="date" onchange="const s=document.getElementById('bk-selesai');if(s&&(!s.value||s.value<this.value))s.value=this.value;">
          </div>
          <div class="bk-field">
            <label for="bk-selesai">Tanggal Selesai Realisasi <span class="bk-req">*</span></label>
            <input id="bk-selesai" type="date">
          </div>
        </div>
      </div>

      <div class="bk-block">
        <div class="bk-label"><i data-lucide="pencil-line"></i> Uraian Progres / Capaian Tindak Lanjut Aktual <span class="bk-req">*</span></div>
        <textarea id="bk-uraian" class="bk-textarea" maxlength="5000" placeholder="Jelaskan secara rinci tindakan nyata atau dokumen penyelesaian yang telah dilaksanakan oleh Unit Kerja (otomatis memperbarui Output tindak lanjut)..."></textarea>
      </div>

      <div class="bk-block" id="bk-setoran-block">
        <div class="bk-label"><i data-lucide="landmark"></i> Validasi Setoran Kas Negara <span id="bk-setoran-hint" class="bk-opt">(isi bila tindak lanjut bersifat finansial)</span></div>
        <div class="bk-grid-2">
          <div class="bk-field">
            <label for="bk-ntpn">NTPN (16 karakter) <span id="bk-ntpn-req" class="bk-req" style="display:none;">*</span></label>
            <input id="bk-ntpn" type="text" maxlength="16" autocomplete="off" placeholder="mis. A1B2C3D4E5F6G7H8" style="text-transform:uppercase;font-family:monospace;font-weight:700;">
          </div>
          <div class="bk-field">
            <label for="bk-nominal">Nominal Setoran / Realisasi (Rp) <span id="bk-nominal-req" class="bk-req" style="display:none;">*</span></label>
            <input id="bk-nominal" type="text" inputmode="numeric" autocomplete="off" placeholder="mis. 1.500.000" oninput="formatRupiahInput(this)">
          </div>
        </div>
      </div>

      <div class="bk-block">
        <div class="bk-label"><i data-lucide="paperclip"></i> Unggah Berkas Bukti Dukung (Eviden) <span class="bk-req">*</span></div>
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
</div>
