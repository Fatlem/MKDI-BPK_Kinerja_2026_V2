/* mkdi/rekap.js - REKAP & LAPORAN (tampilan seperti Ruang Isian, hanya lihat) + ekspor Excel */

// Kelompok temuan yang sedang ditampilkan di Rekap (diisi oleh renderRekap)
let _rkGroups = [];

function loadRekap() {
  document.getElementById('hdr-title').textContent = 'Rekap & Laporan';
  document.getElementById('hdr-sub').textContent   = 'Tinjauan lengkap data tindak lanjut BPK RI (hanya lihat)';
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

function rkBarColor(pct) { return pct >= 100 ? '#10b981' : '#2563eb'; }

// Ringkasan progres di atas daftar (mengikuti filter yang sedang aktif)
function rkSummaryHtml(rows) {
  if (!rows.length) return '';
  const s = rkStats(rows);
  const tile = (n, lbl, bg, fg) => `
    <div class="min-w-[88px] rounded-xl ${bg} px-4 py-2.5 text-center">
      <div class="text-xl font-extrabold leading-none ${fg}">${n}</div>
      <div class="mt-1 text-[11px] font-semibold ${fg} opacity-80">${lbl}</div>
    </div>`;
  return `
    <div class="mb-4 grid grid-cols-[1fr_auto] items-center gap-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm max-[900px]:grid-cols-1 max-[900px]:gap-4">
      <div class="min-w-0">
        <div class="mb-2.5 flex items-baseline justify-between">
          <span class="text-[13px] font-bold text-slate-800">Progres Keseluruhan</span>
          <span class="text-lg font-extrabold" style="color:${rkBarColor(s.pct)};">${s.pct}%</span>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-slate-200">
          <div class="h-full rounded-full transition-[width] duration-500" style="width:${s.pct}%;background:${rkBarColor(s.pct)};"></div>
        </div>
        <p class="mt-2 text-xs text-slate-500">${s.selesai} dari ${s.total} rincian selesai</p>
      </div>
      <div class="flex gap-2.5 max-[900px]:[&>div]:flex-1">
        ${tile(s.selesai, 'Selesai', 'bg-emerald-50', 'text-emerald-700')}
        ${tile(s.proses, 'Proses', 'bg-amber-50', 'text-amber-700')}
        ${tile(s.belum, 'Belum', 'bg-slate-100', 'text-slate-600')}
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
  return `<span class="rk-chev" style="display:flex;align-items:center;color:#94a3b8;flex-shrink:0;transition:transform .2s;transform:rotate(${open ? 180 : 0}deg);"><i data-lucide="chevron-down" style="width:18px;height:18px;"></i></span>`;
}

// Satu sub temuan: judulnya diklik -> isiannya keluar
function rekapSubHtml(sub, idx, total) {
  const key = 'rs:' + sub._row;
  const open = !!S.riOpen[key];
  const st = statusOf(sub);
  const picsFull = groupPicNames([sub]).join(', ') || '-';
  const pics = groupPicShort([sub]).join(', ') || '-';

  return `
    <div class="ri-sub">
      <div data-key="${esc(key)}" onclick="togRekapSub(this)" class="flex cursor-pointer items-center gap-3">
        <div class="min-w-0 flex-1">
          <strong class="break-words text-sm font-semibold text-slate-900">${subLabel(total, idx)}${sub.SubTemuan ? ' - ' + esc(sub.SubTemuan) : ''}</strong>
          <div class="mt-1 flex items-start gap-1.5 text-[11.5px] text-slate-500">
            <i data-lucide="users" class="mt-px size-3.5 shrink-0"></i>
            <span class="break-words" title="${esc(picsFull)}">${esc(pics)}</span>
          </div>
        </div>
        <span class="status-pill ${st.cls} shrink-0"><i data-lucide="${st.icon}" style="width:12px;"></i> ${st.lbl.toUpperCase()}</span>
        ${rkChevron(open)}
      </div>
      <div style="display:${open ? 'block' : 'none'};margin-top:14px;">
        ${riSubBodyHtml(sub)}
      </div>
    </div>`;
}

// Satu kartu temuan (hanya lihat: tanpa tombol Tambah / Ubah / Hapus)
//  - klik uraian temuan  -> keluar daftar sub temuan
//  - klik sub temuan     -> keluar isiannya
//  - temuan dengan 1 rincian (tanpa sub temuan) -> langsung menampilkan isiannya
function rekapEntryHtml(g) {
  const items = g.items;
  const parent = items[0];
  const s = rkStats(items);
  const open = !!S.riOpen['r:' + g.noKey];

  const inner = items.length > 1
    ? items.map((sub, idx) => rekapSubHtml(sub, idx, items.length)).join('')
    : riSubHtml(items[0], 0, false, 1, { readOnly: true });

  // PIC ditampilkan sebagai chip singkat (sisanya jadi ikon "lainnya")
  const pics = groupPicNames(items);
  const chips = riPicChips(pics);

  return `
    <div class="mb-3.5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md">
      <div data-key="r:${esc(g.noKey)}" onclick="togRekapEntry(this)" class="flex cursor-pointer items-start gap-4 p-5 max-[768px]:p-4">
        <div class="min-w-0 flex-1">
          <div class="mb-2 flex flex-wrap items-center gap-2">
            <span class="whitespace-nowrap rounded-md bg-blue-50 px-2.5 py-1 text-[11.5px] font-bold tracking-wide text-blue-600">${esc(parent.No) || '-'}</span>
            <span class="whitespace-nowrap rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">${subCountLabel(items.length)}</span>
          </div>

          <h3 class="whitespace-pre-line break-words text-[15px] font-semibold leading-snug text-slate-900">${esc(parent.Temuan) || '—'}</h3>

          <div class="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span class="mr-0.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">PIC</span>
            ${chips}
          </div>

          <div class="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span class="whitespace-nowrap text-xs font-bold" style="color:${rkBarColor(s.pct)};">Progres ${s.pct}%</span>
            <div class="h-1.5 min-w-[90px] max-w-[260px] flex-1 overflow-hidden rounded-full bg-slate-200">
              <div class="h-full rounded-full" style="width:${s.pct}%;background:${rkBarColor(s.pct)};"></div>
            </div>
            <span class="text-[11.5px] text-slate-500">${s.selesai} dari ${s.total} selesai</span>
          </div>
        </div>
        ${rkChevron(open)}
      </div>

      <div class="border-t border-slate-200 bg-slate-50 p-4 max-[768px]:p-3" style="display:${open ? 'block' : 'none'};">
        ${inner}
      </div>
    </div>`;
}

function renderRekap(rows) {
  const picOpts = allPicOptions().map(p => `<option value="${esc(p.username)}">${esc(p.nama)}</option>`).join('');

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

  const fieldCls = 'h-11 w-full rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-700 shadow-sm outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';

  setBody(`
    <div class="mb-5 flex flex-wrap items-center gap-3">
      <div class="relative w-60 max-[768px]:w-full">
        <i data-lucide="filter" class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"></i>
        <select id="flt-pic" onchange="filterRekap()" class="${fieldCls} cursor-pointer appearance-none pl-10 pr-9">
          <option value="">Semua PIC</option>${picOpts}
        </select>
        <i data-lucide="chevron-down" class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"></i>
      </div>

      <div class="relative w-72 max-[768px]:w-full">
        <i data-lucide="search" class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"></i>
        <input id="flt-q" oninput="filterRekap()" placeholder="Cari data temuan..." class="${fieldCls} pl-10 pr-3.5">
      </div>

      <span id="flt-count" class="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"></span>

      <button id="rk-export-btn" onclick="exportExcel()"
        class="ml-auto inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700 max-[768px]:ml-0 max-[768px]:w-full max-[768px]:justify-center">
        <i data-lucide="download" class="size-4"></i> Ekspor Excel
      </button>
    </div>

    <div id="rk-summary"></div>

    <p class="mb-3.5 flex items-center gap-1.5 px-1 text-xs text-slate-500">
      <i data-lucide="info" class="size-3.5 shrink-0"></i>
      Klik uraian temuan untuk melihat sub temuan, lalu klik sub temuan untuk melihat isiannya.
    </p>
    <div id="rekap-list"></div>
  `);

  filterRekap();
}

function filterRekap() {
  const pfEl = document.getElementById('flt-pic');
  const qEl  = document.getElementById('flt-q');
  const list = document.getElementById('rekap-list');
  if (!list) return;

  const pf = pfEl ? pfEl.value : '';
  const q  = qEl ? (qEl.value || '').toLowerCase().trim() : '';
  const visible = _rkGroups.filter(g => (!pf || hasPic(g.picTokens, pf)) && (!q || g.q.includes(q)));

  const flat = [];
  visible.forEach(g => g.items.forEach(i => flat.push(i)));
  document.getElementById('rk-summary').innerHTML = rkSummaryHtml(flat);

  if (!visible.length) {
    list.innerHTML = `
      <div class="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
        <div class="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <i data-lucide="folder-open" class="size-7"></i>
        </div>
        <h4 class="text-sm font-bold text-slate-800">${_rkGroups.length ? 'Tidak Ada Data yang Cocok' : 'Belum Ada Data'}</h4>
        <p class="mt-1 text-xs text-slate-500">${_rkGroups.length ? 'Ubah filter PIC atau kata pencarian.' : 'Data tindak lanjut belum diisi.'}</p>
      </div>`;
  } else {
    list.innerHTML = visible.map(rekapEntryHtml).join('');
  }

  document.getElementById('flt-count').textContent = (!pf && !q)
    ? `${visible.length} Temuan Utama`
    : `${visible.length} Data Ditemukan`;
  refreshIcons();
}

// ══════════════════ EXPORT TO EXCEL ══════════════════════════════
// Format disamakan dengan file BPK_KINERJA.xlsx (Kak Bashar):
// Calibri, judul 16 bold, header 14 bold, freeze di A6, merge kolom No & Temuan,
// kolom K = status (tanpa border).
async function exportExcel() {
  if (!S.allR.length) {
    showToast('Tidak ada data untuk diekspor', 'inf');
    return;
  }
  const btn = document.getElementById('rk-export-btn');
  const orig = btn ? btn.innerHTML : null;
  if (btn) {
    btn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width:16px"></i> Menyiapkan...';
    btn.disabled = true;
    refreshIcons();
  }

  try {
    const NC = 10;
    const thin = { style: 'thin', color: { argb: 'FF000000' } };
    const border = { top: thin, left: thin, bottom: thin, right: thin };
    const FONT = 'Calibri';

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('BPK Kinerja');
    
    const WIDTHS = [5, 33, 27, 21, 23, 26, 11, 27, 20, 18, 11];
    ws.columns = WIDTHS.map(w => ({ width: w }));

    [
      'TINDAKLANJUT HASIL PEMERIKSAAN BPK',
      'ATAS SINKRONISASI SISTEM INFORMASI PANGAN TAHUN 2024 S.D SEPTEMBER 2025',
      'DAN KESIAPAN PEMERINTAH MELAKSANAKAN PROGRAM KETAHANAN PANGAN POKOK TERTENTU/STRATEGIS PERIODE 2025-2029'
    ].forEach((t, i) => {
      ws.mergeCells(i + 1, 1, i + 1, NC);
      const c = ws.getCell(i + 1, 1);
      c.value = t;
      c.font = { name: FONT, bold: true, size: 16 };
      c.alignment = { horizontal: 'center' };
    });

    const hr = ws.getRow(5);
    ['No', 'Temuan', 'Sub Temuan', 'Kriteria', 'Sebab', 'Rekomendasi', 'PIC', 'Rencana Aksi', 'Jadwal Pelaksanaan', 'Output'].forEach((h, i) => {
      const c = hr.getCell(i + 1);
      c.value = h;
      c.font = { name: FONT, bold: true, size: 14 };
      c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      c.border = border;
    });

    // Gaya per kolom (sama dengan file Kak Bashar)
    const COL_STYLE = [
      { size: 14, bold: false, h: 'center' }, // A No
      { size: 14, bold: true,  h: 'left'   }, // B Temuan
      { size: 12, bold: false, h: 'left'   }, // C Sub Temuan
      { size: 14, bold: true,  h: 'left'   }, // D Kriteria
      { size: 12, bold: false, h: 'left'   }, // E Sebab
      { size: 12, bold: false, h: 'left'   }, // F Rekomendasi
      { size: 12, bold: false, h: 'center' }, // G PIC
      { size: 12, bold: false, h: 'left'   }, // H Rencana Aksi
      { size: 12, bold: false, h: 'left'   }, // I Jadwal
      { size: 12, bold: false, h: 'left'   }, // J Output
    ];

    // ── Gabungkan baris: No + Sub Temuan yang sama => 1 baris saja ─────
    // Kriteria, Sebab, Rekomendasi, PIC, Rencana Aksi, Jadwal, Output
    // yang baru TIDAK menambah baris, tapi digabung dalam 1 sel dengan penomoran "1. ... 2. ..."
    const NUM_RE = /^\s*(?:\d+|[a-zA-Z])[.)]\s/;
    const joinNumbered = (vals, unique) => {
      let list = vals.map(v => String(v == null ? '' : v).trim()).filter(Boolean);
      if (unique) list = list.filter((v, i) => list.indexOf(v) === i);
      if (list.length <= 1) return list[0] || '';
      const sep = list.some(v => v.includes('\n')) ? '\n\n' : '\n';
      return list.map((v, i) => (NUM_RE.test(v) ? v : `${i + 1}. ${v}`)).join(sep);
    };

    const noOrder = [], byNo = {};
    S.allR.forEach(r => {
      const no = String(r.No == null ? '' : r.No).trim();
      if (!byNo[no]) { byNo[no] = []; noOrder.push(no); }
      byNo[no].push(r);
    });

    const sheetRows = []; // 1 entri = 1 baris Excel
    noOrder.forEach(no => {
      const subs = {}, subOrder = [];
      byNo[no].forEach(r => {
        const k = String(r.SubTemuan || '').trim();
        if (!subs[k]) { subs[k] = []; subOrder.push(k); }
        subs[k].push(r);
      });
      subOrder.forEach(k => sheetRows.push({ no, items: subs[k] }));
    });

    // Estimasi tinggi baris supaya teks panjang tidak terpotong
    const estHeight = (text, colIdx, size, bold) => {
      const cpl = Math.max(1, Math.floor(WIDTHS[colIdx] * (11 / size) * (bold ? 0.8 : 0.9)));
      const lines = String(text || '').split('\n')
        .reduce((n, l) => n + Math.max(1, Math.ceil(l.length / cpl)), 0);
      return lines * size * 1.3 + 6;
    };

    const DS = 6;
    const rowHeights = [];
    sheetRows.forEach((g, i) => {
      const it = g.items;
      const first = it[0];
      const noVal = (g.no !== '' && !isNaN(Number(g.no))) ? Number(g.no) : g.no;
      const vals = [
        noVal,
        it.map(x => x.Temuan).find(v => String(v || '').trim()) || '',
        it.map(x => x.SubTemuan).find(v => String(v || '').trim()) || '',
        joinNumbered(it.map(x => x.Kriteria)),
        joinNumbered(it.map(x => x.Sebab)),
        joinNumbered(it.map(x => x.Rekomendasi)),
        groupPicNames(it).join(',\n'),
        joinNumbered(it.map(x => x.RencanaAksi)),
        joinNumbered(it.map(x => x.JadwalPelaksanaan)),
        joinNumbered(it.map(x => cleanOutput(x.Output)))
      ];

      const row = ws.getRow(DS + i);
      let h = 20;
      const multiNo = byNo[g.no].length > 1 && sheetRows.filter(x => x.no === g.no).length > 1;
      vals.forEach((val, j) => {
        const c = row.getCell(j + 1);
        const st = COL_STYLE[j];
        c.value = val;
        c.font = { name: FONT, size: st.size, bold: st.bold };
        c.alignment = { horizontal: st.h, vertical: 'middle', wrapText: true };
        c.border = border;
        // kolom A & B yang akan di-merge lintas baris dihitung terpisah di bawah
        if (multiNo && j < 2) return;
        h = Math.max(h, estHeight(val, j, st.size, st.bold));
      });
      rowHeights.push(h);

      // Kolom K: status (di luar tabel, tanpa border) seperti file Kak Bashar
      const sts = it.map(x => statusOf(x).lbl);
      const k = row.getCell(11);
      k.value = sts.every(s => s === 'Selesai') ? 'Selesai' : (sts.every(s => s === 'Belum') ? 'Belum' : 'Proses');
      k.font = { name: FONT, size: 11 };
      k.alignment = { vertical: 'middle', wrapText: true };
    });

    // Merge No & Temuan untuk No yang punya lebih dari 1 baris (Sub Temuan berbeda)
    let gs = 0;
    for (let i = 1; i <= sheetRows.length; i++) {
      if (i === sheetRows.length || sheetRows[i].no !== sheetRows[gs].no) {
        if (i - gs > 1) {
          ws.mergeCells(DS + gs, 1, DS + i - 1, 1);
          ws.mergeCells(DS + gs, 2, DS + i - 1, 2);
          // pastikan total tinggi cukup untuk teks Temuan yang di-merge
          const need = estHeight(ws.getCell(DS + gs, 2).value, 1, COL_STYLE[1].size, true);
          let sum = 0;
          for (let x = gs; x < i; x++) sum += rowHeights[x];
          if (need > sum) rowHeights[i - 1] += (need - sum);
        }
        gs = i;
      }
    }
    rowHeights.forEach((h, i) => { ws.getRow(DS + i).height = Math.min(409, Math.max(20, h)); });

    ws.views = [{ state: 'frozen', ySplit: 5 }];

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const now = new Date();
    const fname = `BPK_Kinerja_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.xlsx`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('File Excel berhasil diunduh!', 'ok');
  } catch (e) {
    showToast('Gagal ekspor Excel: ' + e.message, 'err');
  } finally {
    if (btn) {
      btn.innerHTML = orig;
      btn.disabled = false;
      refreshIcons();
    }
  }
}