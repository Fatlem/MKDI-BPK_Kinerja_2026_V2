// Kelompok temuan yang sedang ditampilkan di Rekap (diisi oleh renderRekap)
let _rkGroups = [];

function loadRekap() {
  const hdrTitle = document.getElementById('hdr-title');
  if (hdrTitle) hdrTitle.textContent = 'Rekap';
  const hdrSub = document.getElementById('hdr-sub');
  if (hdrSub) hdrSub.textContent = '';
  setBody(loadingHtml());
  refreshIcons();

  apiFetch('/api/temuan')
    .then(rows => {
      S.allR = scopeRows(rows);
      renderRekap(S.allR);
    })
    .catch(() => showToast('Gagal memuat data dari server', 'err'));
}

// Hitung progres dari sekumpulan baris: Selesai / Proses / Belum
function rkStats(rows) {
  const s = { total: rows.length, selesai: 0, proses: 0, belum: 0, pct: 0 };
  rows.forEach(r => {
    const l = statusOf(r).lbl;
    if (l === 'Selesai') s.selesai++;
    else if (l === 'Proses') s.proses++;
    else s.belum++;
  });
  s.pct = s.total ? Math.round((s.selesai / s.total) * 100) : 0;
  return s;
}

function rkBarColor() { return '#0071E3'; }

// Ringkasan progres di atas daftar (mengikuti filter yang sedang aktif)
function rkSummaryHtml(rows) {
  if (!rows.length) return '';
  const s = rkStats(rows);
  const tile = (n, lbl, accent) => `
    <div class="min-w-[84px] rounded-xl bg-[#F5F5F7] px-3.5 py-2.5 text-center">
      <div class="text-lg font-semibold leading-none ${accent ? 'text-[#0071E3]' : 'text-[#1D1D1F]'}">${n}</div>
      <div class="mt-1 text-[11px] font-medium text-[#86868B]">${lbl}</div>
    </div>`;
  return `
    <div class="mb-4 grid grid-cols-[1fr_auto] items-center gap-6 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] max-[900px]:grid-cols-1 max-[900px]:gap-4">
      <div class="min-w-0">
        <div class="mb-2 flex items-baseline justify-between">
          <span class="text-xs font-medium text-[#6E6E73]">Penyelesaian (${s.selesai}/${s.total})</span>
          <span class="text-base font-semibold text-[#1D1D1F]">${s.pct}%</span>
        </div>
        <div class="h-1.5 overflow-hidden rounded-full bg-[#F5F5F7]">
          <div class="h-full rounded-full bg-[#0071E3] transition-[width] duration-500" style="width:${s.pct}%;"></div>
        </div>
      </div>
      <div class="flex gap-2 max-[900px]:[&>div]:flex-1">
        ${tile(s.selesai, 'Selesai', true)}
        ${tile(s.proses, 'Proses', false)}
        ${tile(s.belum, 'Belum', false)}
      </div>
    </div>`;
}

// Buka/tutup isi satu temuan (menampilkan daftar sub temuan) - hanya lihat
function togRekapEntry(headerEl) {
  const block = headerEl.nextElementSibling;
  if (!block) return;
  const open = block.style.display === 'none';
  block.style.display = open ? 'block' : 'none';
  const chev = headerEl.querySelector('.rk-chev');
  if (chev) chev.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
  const key = headerEl.dataset ? headerEl.dataset.key : '';
  if (key) S.riOpen[key] = open;
}

// Buka/tutup isian satu sub temuan (Kriteria, Sebab, Rekomendasi, dst)
function togRekapSub(headEl) {
  const body = headEl.nextElementSibling;
  if (!body) return;
  const open = body.style.display === 'none';
  body.style.display = open ? 'block' : 'none';
  const chev = headEl.querySelector('.rk-chev');
  if (chev) chev.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
  const key = headEl.dataset ? headEl.dataset.key : '';
  if (key) S.riOpen[key] = open;
}

function rkChevron(open) {
  return `<span class="rk-chev" style="display:flex;align-items:center;color:#86868B;flex-shrink:0;transition:transform .2s;transform:rotate(${open ? 180 : 0}deg);"><i data-lucide="chevron-down" style="width:16px;height:16px;"></i></span>`;
}

// Satu sub temuan: judulnya diklik -> isiannya keluar
function rekapSubHtml(sub, idx, total) {
  const key = 'rs:' + sub._row;
  const open = !!S.riOpen[key];
  const st = statusOf(sub);
  const picsFull = groupPicNames([sub]).join(', ') || '-';
  const pics = groupPicShort([sub]).join(', ') || '-';

  const stBadge = st.lbl === 'Selesai'
    ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#0071E3]/10 text-[#0071E3] shrink-0"><span class="w-1.5 h-1.5 rounded-full bg-[#0071E3]"></span>Selesai</span>`
    : st.lbl === 'Proses'
      ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F5F5F7] text-[#1D1D1F] shrink-0"><span class="w-1.5 h-1.5 rounded-full bg-[#86868B]"></span>Proses</span>`
      : `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F5F5F7] text-[#86868B] shrink-0"><span class="w-1.5 h-1.5 rounded-full bg-[#D2D2D7]"></span>Belum</span>`;

  return `
    <div class="bg-white rounded-xl border border-black/[0.06] p-4 mb-2.5 last:mb-0">
      <div data-key="${esc(key)}" onclick="togRekapSub(this)" class="flex cursor-pointer items-center gap-3">
        <div class="min-w-0 flex-1">
          <div class="break-words text-xs font-semibold text-[#1D1D1F]">${subLabel(total, idx)}${sub.SubTemuan ? ' · ' + esc(sub.SubTemuan) : ''}</div>
          <div class="mt-0.5 text-[11px] text-[#86868B]" title="${esc(picsFull)}">${esc(pics)}</div>
        </div>
        ${stBadge}
        ${rkChevron(open)}
      </div>
      <div style="display:${open ? 'block' : 'none'};margin-top:14px;">
        ${riSubBodyHtml(sub)}
      </div>
    </div>`;
}

// Satu kartu temuan (hanya lihat)
function rekapEntryHtml(g) {
  const items = g.items;
  const parent = items[0];
  const s = rkStats(items);
  const open = !!S.riOpen['r:' + g.noKey];

  const inner = items.length > 1
    ? items.map((sub, idx) => rekapSubHtml(sub, idx, items.length)).join('')
    : riSubHtml(items[0], 0, false, 1, { readOnly: true });

  const pics = groupPicShort(items).join(', ') || '—';

  return `
    <div class="mb-3 overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition hover:border-black/[0.12]">
      <div data-key="r:${esc(g.noKey)}" onclick="togRekapEntry(this)" class="flex cursor-pointer items-start gap-4 p-5 max-[768px]:p-4">
        <div class="min-w-0 flex-1">
          <div class="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-[#6E6E73]">
            <span class="font-mono font-semibold text-[#1D1D1F]">${esc(parent.No) || '-'}</span>
            ${dokumenBadge(parent)}
            <span>·</span>
            <span>${esc(jenisAuditLabel(parent) || 'Audit Kinerja')}</span>
            <span>·</span>
            <span>${items.length} rincian</span>
          </div>

          <h3 class="whitespace-pre-line break-words text-sm font-semibold leading-snug text-[#1D1D1F]">${esc(parent.Temuan) || '—'}</h3>

          <div class="mt-2 flex flex-wrap items-center justify-between gap-3">
            <span class="text-xs text-[#86868B]">${esc(pics)}</span>

            <div class="flex items-center gap-2.5">
              <div class="h-1.5 w-24 overflow-hidden rounded-full bg-[#F5F5F7]">
                <div class="h-full rounded-full bg-[#0071E3]" style="width:${s.pct}%;"></div>
              </div>
              <span class="text-xs font-medium text-[#1D1D1F]">${s.pct}%</span>
            </div>
          </div>
        </div>
        ${rkChevron(open)}
      </div>

      <div class="border-t border-black/[0.05] bg-[#F5F5F7] p-4 max-[768px]:p-3" style="display:${open ? 'block' : 'none'};">
        ${inner}
      </div>
    </div>`;
}

function renderRekap(rows) {
  const picOpts = allPicOptions().map(p => `<option value="${esc(p.username)}">${esc(p.nama)}</option>`).join('');
  const tahunOpts = tahunOptions(rows).map(y => `<option value="${esc(y)}">${esc(y)}</option>`).join('');

  // kelompokkan per nomor temuan
  const groups = {};
  rows.forEach(r => {
    const k = String(r.No || '0');
    if (!groups[k]) groups[k] = [];
    groups[k].push(r);
  });
  _rkGroups = Object.keys(groups).map(noKey => {
    const items = groups[noKey];
    const picTokens = groupPicTokens(items);
    const q = [noKey]
      .concat(items.map(i => (i.Temuan || '') + ' ' + (i.SubTemuan || '')))
      .concat(picTokens.map(picNama))
      .join(' ').toLowerCase();
    return { noKey, items, picTokens, q };
  });

  const fieldCls = 'h-8 rounded-[8px] border border-transparent bg-[#F5F5F7] text-xs font-medium text-[#1D1D1F] outline-none transition placeholder:text-[#86868B] focus:bg-white focus:border-[#0071E3]';

  setBody(`
    <div class="mb-4 flex flex-wrap items-center gap-2.5 bg-white p-3.5 rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <select id="flt-pic" onchange="filterRekap()" class="${fieldCls} px-3 max-w-[220px] truncate">
        <option value="">Semua Unit Kerja</option>${picOpts}
      </select>

      <select id="flt-tahun" onchange="filterRekap()" class="${fieldCls} px-3">
        <option value="">Semua Tahun</option>${tahunOpts}
      </select>

      <div class="relative w-60 max-[768px]:w-full">
        <i data-lucide="search" class="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#86868B]"></i>
        <input id="flt-q" oninput="filterRekap()" placeholder="Cari temuan..." class="${fieldCls} w-full pl-8 pr-3">
      </div>

      <span id="flt-count" class="text-xs text-[#86868B] ml-1"></span>

      <button id="rk-export-btn" onclick="exportExcel()"
        class="ml-auto inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[8px] bg-[#F5F5F7] hover:bg-[#E5E5EA] px-3 text-xs font-medium text-[#1D1D1F] transition max-[768px]:ml-0">
        <i data-lucide="download" class="size-3.5"></i> Ekspor Excel
      </button>
    </div>

    <div id="rk-summary"></div>

    <div id="rekap-list"></div>
  `);

  filterRekap();
}

// Tahun yang dipilih di toolbar Rekap ('' = semua tahun)
function rkSelectedTahun() {
  const el = document.getElementById('flt-tahun');
  return el ? el.value : '';
}

function filterRekap() {
  const pfEl = document.getElementById('flt-pic');
  const qEl  = document.getElementById('flt-q');
  const list = document.getElementById('rekap-list');
  if (!list) return;

  const pf = pfEl ? pfEl.value : '';
  const tf = rkSelectedTahun();
  const q  = qEl ? (qEl.value || '').toLowerCase().trim() : '';
  const visible = _rkGroups.filter(g =>
    (!pf || hasPic(g.picTokens, pf)) &&
    (!tf || g.items.some(i => String(i.Tahun || '') === tf)) &&
    (!q || g.q.includes(q)));

  const flat = [];
  visible.forEach(g => g.items.forEach(i => flat.push(i)));
  document.getElementById('rk-summary').innerHTML = rkSummaryHtml(flat);

  if (!visible.length) {
    list.innerHTML = `
      <div class="rounded-2xl border border-black/[0.06] bg-white px-6 py-14 text-center">
        <h4 class="text-sm font-medium text-[#1D1D1F]">${_rkGroups.length ? 'Tidak ada data yang cocok' : 'Belum ada data'}</h4>
        <p class="mt-1 text-xs text-[#86868B]">${_rkGroups.length ? 'Sesuaikan filter atau kata pencarian.' : 'Data tindak lanjut belum diisi.'}</p>
      </div>`;
  } else {
    list.innerHTML = visible.map(rekapEntryHtml).join('');
  }

  document.getElementById('flt-count').textContent = `${visible.length} temuan`;
  refreshIcons();
}
