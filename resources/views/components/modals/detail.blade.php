{{-- Modal Tambah / Ubah Detail (Kriteria, Sebab, Rekomendasi). JS: public/js/detail.js --}}
<div id="det-bg" class="modal-backdrop" onclick="closeDetModalBg(event)">
  <div class="modal-window" style="max-width:600px;">
    <div class="modal-header-area">
      <div>
        <div id="det-title" class="modal-title-text">Tambah Detail</div>
        <div id="det-sub" style="font-size:12px;color:var(--text-muted)"></div>
      </div>
      <button class="modal-close-btn" onclick="closeDetModal()"><i data-lucide="x" style="width:18px;height:18px;" class="icon-plain"></i></button>
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
          <label>Tambahkan ke Rincian</label>
          <div id="det-rincian" class="pic-check-list"></div>
          <div class="field-hint">Isian akan ditulis ke rincian yang dicentang.</div>
        </div>
        <div class="form-field">
          <label>Isi Baru</label>
          <textarea id="det-text" placeholder="Tulis isi baru. Satu butir per baris jika lebih dari satu."></textarea>
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
      <button id="det-save" class="btn-action-pri" onclick="saveDetail()"><i data-lucide="save" style="width:16px;height:16px;" class="icon-plain"></i> Simpan</button>
    </div>
  </div>
</div>
