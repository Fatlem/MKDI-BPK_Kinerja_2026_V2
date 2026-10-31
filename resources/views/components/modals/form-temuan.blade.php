<div id="modal-bg" class="modal-backdrop" onclick="closeModalBg(event)">
  <div class="modal-window bg-white rounded-2xl shadow-2xl border border-black/[0.08] overflow-hidden flex flex-col" style="max-width:740px;max-height:92vh;">
    <!-- Apple Sheet Header -->
    <div class="px-6 py-4 bg-white border-b border-black/[0.06] flex items-center justify-between sticky top-0 z-10">
      <div>
        <h3 id="modal-title" class="font-semibold text-[#1D1D1F] text-base leading-snug">Temuan Baru</h3>
        <p id="modal-sub" class="hidden text-xs text-[#86868B]"></p>
      </div>
      <button type="button" class="text-[#86868B] hover:text-[#1D1D1F] p-1.5 rounded-full hover:bg-[#F5F5F7] transition-colors" onclick="closeModal()">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
    </div>

    <div class="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
      <input type="hidden" id="m-row">
      <input type="hidden" id="m-parent-row">
      <input type="hidden" id="m-is-sub">

      {{-- Konteks Temuan & Rekomendasi (Satker/Auditee) --}}
      <div id="m-pic-ctx" style="display:none;" class="bg-[#F5F5F7] p-4 rounded-xl text-xs space-y-2.5">
        <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-black/[0.06]">
          <div class="flex items-center gap-2">
            <span id="m-ctx-no" class="font-mono font-semibold text-xs text-[#1D1D1F]"></span>
            <span id="m-ctx-meta" class="text-xs text-[#6E6E73]"></span>
          </div>
          <span id="m-ctx-deadline" class="text-xs font-medium"></span>
        </div>
        <div>
          <span class="text-[11px] font-medium text-[#86868B] block mb-0.5">Kondisi</span>
          <div id="m-ctx-temuan" class="text-xs text-[#1D1D1F] leading-relaxed"></div>
        </div>
        <div class="bg-white rounded-lg p-3 border border-black/[0.05]">
          <span class="text-[11px] font-medium text-[#86868B] block mb-0.5">Rekomendasi</span>
          <div id="m-ctx-rekomendasi" class="text-xs font-medium text-[#1D1D1F] leading-relaxed whitespace-pre-line"></div>
          <div id="m-ctx-nilai" style="display:none;" class="mt-2 pt-2 border-t border-black/[0.06] text-xs text-[#0071E3] font-medium"></div>
        </div>
      </div>

      <div id="m-role-note" class="hidden" style="display:none;"></div>

      {{-- Form Auditor / Admin --}}
      <div id="m-auditor-fields" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#F5F5F7] p-3.5 rounded-xl">
          <div class="form-field" id="m-sumber-wrap" style="margin-bottom:0;">
            <label class="block text-xs font-medium text-[#6E6E73] mb-1">Sumber Audit</label>
            <select id="m-sumber" onchange="onSumberChange()" class="w-full h-9 px-3 text-xs font-medium bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:border-[#0071E3] text-[#1D1D1F]">
              <option value="inspektorat">Inspektorat</option>
              <option value="bpk">BPK RI</option>
            </select>
          </div>

          <div class="form-field" id="m-jenis-wrap" style="margin-bottom:0;">
            <label class="block text-xs font-medium text-[#6E6E73] mb-1">Jenis Audit</label>
            <select id="m-jenis" class="w-full h-9 px-3 text-xs font-medium bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:border-[#0071E3] text-[#1D1D1F]">
              <option value="kinerja">Audit Kinerja (3E)</option>
              <option value="keuangan">Audit Keuangan</option>
              <option value="kepatuhan">Audit Kepatuhan</option>
              <option value="khusus">Audit Khusus / Investigatif</option>
            </select>
          </div>

          <div class="form-field" style="margin-bottom:0;">
            <label class="block text-xs font-medium text-[#6E6E73] mb-1">Kode Dokumen</label>
            <input id="m-no" type="text" placeholder="Otomatis" readonly class="w-full h-9 px-3 text-xs font-mono font-semibold bg-white/60 border border-black/[0.06] rounded-lg text-[#1D1D1F]">
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="form-field" style="margin-bottom:0;">
            <label class="block text-xs font-medium text-[#1D1D1F] mb-1">Temuan Utama <span class="text-[#D70015]">*</span></label>
            <textarea id="m-temuan" rows="2" placeholder="Pokok temuan pemeriksaan..." class="w-full px-3 py-2 text-xs bg-[#F5F5F7] focus:bg-white border border-transparent rounded-xl focus:outline-none focus:border-[#0071E3] text-[#1D1D1F] transition-colors"></textarea>
          </div>

          <div class="form-field" style="margin-bottom:0;">
            <label class="block text-xs font-medium text-[#1D1D1F] mb-1">Sub Temuan (Opsional)</label>
            <textarea id="m-subtemuan" rows="2" placeholder="Rincian sub temuan..." class="w-full px-3 py-2 text-xs bg-[#F5F5F7] focus:bg-white border border-transparent rounded-xl focus:outline-none focus:border-[#0071E3] text-[#1D1D1F] transition-colors"></textarea>
          </div>
        </div>

        {{-- 4 Unsur Pokok Temuan --}}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="bg-[#F5F5F7] p-3.5 rounded-xl">
            <label class="block text-xs font-semibold text-[#1D1D1F] mb-1.5">Kondisi</label>
            <textarea id="m-kondisi" rows="3" placeholder="Fakta atau kondisi riil yang ditemukan..."
              class="w-full px-3 py-2 text-xs bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:border-[#0071E3] text-[#1D1D1F]"></textarea>
          </div>

          <div class="bg-[#F5F5F7] p-3.5 rounded-xl">
            <label class="block text-xs font-semibold text-[#1D1D1F] mb-1.5">Kriteria</label>
            <textarea id="m-kriteria" rows="3" placeholder="Regulasi, ketentuan, atau standar acuan..."
              class="w-full px-3 py-2 text-xs bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:border-[#0071E3] text-[#1D1D1F]"></textarea>
          </div>

          <div class="bg-[#F5F5F7] p-3.5 rounded-xl">
            <label class="block text-xs font-semibold text-[#1D1D1F] mb-1.5">Sebab</label>
            <textarea id="m-sebab" rows="3" placeholder="Akar penyebab terjadinya kondisi..."
              class="w-full px-3 py-2 text-xs bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:border-[#0071E3] text-[#1D1D1F]"></textarea>
          </div>

          <div class="bg-[#F5F5F7] p-3.5 rounded-xl">
            <label class="block text-xs font-semibold text-[#1D1D1F] mb-1.5">Akibat</label>
            <textarea id="m-akibat" rows="3" placeholder="Dampak atau risiko yang ditimbulkan..."
              class="w-full px-3 py-2 text-xs bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:border-[#0071E3] text-[#1D1D1F]"></textarea>
          </div>
        </div>

        <div class="form-field" style="margin-bottom:0;">
          <label class="block text-xs font-medium text-[#1D1D1F] mb-1">Rekomendasi</label>
          <textarea id="m-rekomendasi" rows="3" placeholder="Arahan tindakan korektif atau pemulihan..."
            class="w-full px-3 py-2 text-xs bg-[#F5F5F7] focus:bg-white border border-transparent rounded-xl focus:outline-none focus:border-[#0071E3] text-[#1D1D1F] transition-colors"></textarea>
        </div>

        <div class="bg-[#F5F5F7] p-3.5 rounded-xl">
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-xs font-medium text-[#1D1D1F]">Target Setoran Kas Negara (Opsional)</label>
            <span id="m-nilai-preview" class="text-[11px] text-[#86868B]">Rp 0 (Non-finansial)</span>
          </div>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#86868B]">Rp</span>
            <input id="m-nilai-temuan" type="text" inputmode="numeric" value="0" placeholder="0"
              oninput="formatRupiahInput(this, 'm-nilai-preview')"
              class="w-full h-9 pl-9 pr-3 text-xs font-semibold bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:border-[#0071E3] text-[#1D1D1F]">
          </div>
        </div>

        <div class="form-field" style="margin-bottom:0;">
          <label class="block text-xs font-medium text-[#1D1D1F] mb-1.5">Unit Kerja Penanggung Jawab <span class="text-[#D70015]">*</span></label>
          <div id="m-pic" class="pic-check-list"></div>
          <div class="pic-manual">
            <input id="m-pic-manual" type="text" placeholder="Tambah unit kerja lain..." onkeydown="if(event.key==='Enter'){event.preventDefault();addManualPic();}">
            <button type="button" class="btn-action-sec" onclick="addManualPic()"><i data-lucide="plus" style="width:14px;height:14px;"></i> Tambah</button>
          </div>
        </div>
      </div>

      {{-- Rencana Aksi & Jadwal Pelaksanaan (Satker / PIC) --}}
      <div id="m-pic-fields" class="space-y-4">
        <div class="form-field" style="margin-bottom:0;">
          <label class="block text-xs font-medium text-[#1D1D1F] mb-1.5">Rencana Aksi <span class="text-[#D70015]">*</span></label>
          <textarea id="m-rencanaaksi" rows="3" placeholder="Langkah tindak lanjut unit kerja..."
            class="w-full px-3 py-2 text-xs bg-[#F5F5F7] focus:bg-white border border-transparent rounded-xl focus:outline-none focus:border-[#0071E3] text-[#1D1D1F] transition-colors"></textarea>
        </div>

        <div class="form-field" style="margin-bottom:0;">
          <label class="block text-xs font-medium text-[#1D1D1F] mb-1.5">Target Waktu <span class="text-[#D70015]">*</span></label>
          <textarea id="m-jadwal" rows="2" placeholder="Contoh: Triwulan II 2026 atau 60 Hari Kalender"
            class="w-full px-3 py-2 text-xs bg-[#F5F5F7] focus:bg-white border border-transparent rounded-xl focus:outline-none focus:border-[#0071E3] text-[#1D1D1F] transition-colors"></textarea>
        </div>

        <div class="form-field" style="margin-bottom:0;">
          <label class="block text-xs font-medium text-[#1D1D1F] mb-1.5">Output / Capaian (Opsional)</label>
          <textarea id="m-output" rows="2" placeholder="Ringkasan capaian tindak lanjut..."
            class="w-full px-3 py-2 text-xs bg-[#F5F5F7] focus:bg-white border border-transparent rounded-xl focus:outline-none focus:border-[#0071E3] text-[#1D1D1F] transition-colors"></textarea>
        </div>
      </div>
    </div>

    <div class="modal-footer-area px-6 py-4 bg-[#FAFAFC] border-t border-black/[0.06] flex items-center justify-end gap-2.5 sticky bottom-0">
      <button type="button" class="px-4 py-2 rounded-lg text-xs font-medium text-[#6E6E73] hover:bg-[#F5F5F7] transition-colors" onclick="closeModal()">Batal</button>
      <button type="button" class="px-5 py-2 rounded-lg text-xs font-medium text-white bg-[#0071E3] hover:bg-[#0077ED] transition-all flex items-center gap-1.5" onclick="saveTemuan()">
        <span id="m-save-lbl">Simpan</span>
      </button>
    </div>
  </div>
</div>
