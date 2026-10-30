/* dashboard.js - halaman DASHBOARD (statistik, bar chart, donut, daftar PIC, filter) */

// ═══ IKON & SINGKATAN PIC ══════════════════════════════════════════════

// Icon SVG per PIC (by index, matching Figma prototype)
const PIC_ICONS = [
  // 0: MKDI - building-2
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 12h4"/><path d="M10 8h4"/><path d="M14 21v-3a2 2 0 0 0-4 0v3"/><path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/></svg>`,
  // 1: HK - scale
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M19 8 22 16a5 5 0 0 1-6 0"/><path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1"/><path d="M5 8 8 16a5 5 0 0 1-6 0"/><path d="M7 21h10"/></svg>`,
  // 2: SDMO - users
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg>`,
  // 3: UHM - globe
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
  // 4: KBMN - wallet
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>`,
  // 5: D1 - cpu
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20v2"/><path d="M12 2v2"/><path d="M17 20v2"/><path d="M17 2v2"/><path d="M2 12h2"/><path d="M2 17h2"/><path d="M2 7h2"/><path d="M20 12h2"/><path d="M20 17h2"/><path d="M20 7h2"/><path d="M7 20v2"/><path d="M7 2v2"/><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="8" y="8" width="8" height="8" rx="1"/></svg>`,
  // 6: D2 - sprout
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/><path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/><path d="M5 21h14"/></svg>`,
  // 7: D3 - shield
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>`,
  // 8: D4 - anchor
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6v16"/><path d="m19 13 2-1a9 9 0 0 1-18 0l2 1"/><path d="M9 11h6"/><circle cx="12" cy="4" r="2"/></svg>`,
  // 9: SABK - git-commit-horizontal
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><line x1="3" x2="9" y1="12" y2="12"/><line x1="15" x2="21" y1="12" y2="12"/></svg>`,
  // 10: Inspektorat - eye
   `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 11 2 2 4-4"/><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
];

function _picIconSvg(i) {
  return PIC_ICONS[i % PIC_ICONS.length] || PIC_ICONS[0];
}

// Mapping nama PIC (lowercase substring) → singkatan untuk bar chart label
const PIC_LABEL_MAP = [
  { key: 'manajemen kinerja',   label: 'MKDI'  },
  { key: 'hukum',               label: 'HK'    },
  { key: 'sumber daya manusia', label: 'SDMO'  },
  { key: 'umum',                label: 'UHM'   },
  { key: 'keuangan',            label: 'KBMN'  },
  { key: 'tata niaga',          label: 'D1'    },
  { key: 'usaha pangan',        label: 'D2'    },
  { key: 'keterjangkauan',      label: 'D3'    },
  { key: 'maritim',             label: 'D4'    },
  { key: 'konektivitas',        label: 'SABK'  },
  { key: 'inspektorat',         label: 'Itjen'   },
];

function _picShortLabel(p) {
  const nama = String(p.nama || p.username || '').trim();
  const low  = nama.toLowerCase();
  for (const m of PIC_LABEL_MAP) {
    if (low.includes(m.key)) return m.label;
  }
  // PIC baru: satu kata -> 5 huruf pertama, banyak kata -> singkatan huruf awal
  const words = nama.split(/\s+/).filter(Boolean);
  if (!words.length) return '-';
  if (words.length === 1) return words[0].substring(0, 5).toUpperCase();
  const skip = new Set(['dan', 'bidang', 'atau', 'di', 'ke', 'yang', 'untuk']);
  const ac = words.filter(w => !skip.has(w.toLowerCase())).map(w => w[0]).join('').toUpperCase();
  return (ac || words[0]).substring(0, 5);
}

// ═══ FILTER: Sumber / Tahun / Unit PIC ═════════════════════════════════

// ── Filter dashboard: Sumber / Tahun / Unit PIC (satu-satunya filter tahun di dashboard) ──
if (!S.dbF) S.dbF = { sumber: '', tahun: '', pic: '', jenis: '', status: '', q: '' };

// Jenis audit & status/pencarian khusus tabel (status & kata kunci tidak ikut mengubah grafik)
const JENIS_AUDIT_SHORT = { kinerja: 'Kinerja', keuangan: 'Keuangan', kepatuhan: 'Kepatuhan', khusus: 'Khusus' };
const JENIS_AUDIT_CLS = {
  kinerja:   'bg-blue-50 text-blue-700',
  keuangan:  'bg-emerald-50 text-emerald-700',
  kepatuhan: 'bg-violet-50 text-violet-700',
  khusus:    'bg-rose-50 text-rose-700'
};

function dbFilteredRows(rows) {
  const f = S.dbF;
  return (rows || []).filter(r =>
    (!f.sumber || (r.Sumber || 'bpk') === f.sumber) &&
    (!f.tahun  || String(r.Tahun || '') === f.tahun) &&
    (!f.jenis  || (r.JenisAudit || '') === f.jenis) &&
    (!f.pic    || hasPic(splitPics(r.PIC), f.pic))
  );
}

function dbApplyFilter() {
  const v = id => (document.getElementById('db-flt-' + id) || {}).value || '';
  S.dbF = { sumber: v('sumber'), tahun: v('tahun'), pic: v('pic'), jenis: v('jenis'), status: v('status'), q: S.dbF.q || '' };
  calculateAndRenderDashboard(S.allR || []);
}

// Kata kunci: hanya menyegarkan tabel (fokus ketikan tidak hilang)
function dbSearch() {
  S.dbF.q = (document.getElementById('db-flt-q') || {}).value || '';
  const box = document.getElementById('db-table-body');
  if (box) { box.innerHTML = dbTableHtml(); dbSyncCount(); refreshIcons(); }
}

function dbSyncCount() {
  const c = document.getElementById('db-table-count');
  if (c) c.textContent = S._dbCountText || '';
}

// Klik kartu PIC = saring tabel untuk PIC tersebut (klik lagi = batalkan)
function dbPickPic(username) {
  if (!isPicUser()) S.dbF.pic = (S.dbF.pic === username) ? '' : username;
  calculateAndRenderDashboard(S.allR || []);
  const sec = document.getElementById('db-table-sec');
  if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function dbFilterBarHtml() {
  const f = S.dbF;
  const optSumber = Object.keys(SUMBER_LABEL).map(k => `<option value="${esc(k)}" ${f.sumber === k ? 'selected' : ''}>${esc(SUMBER_LABEL[k])}</option>`).join('');
  const optTahun  = tahunOptions(S.allR).map(y => `<option value="${esc(y)}" ${f.tahun === y ? 'selected' : ''}>${esc(y)}</option>`).join('');
  const optPic    = allPicOptions().map(p => `<option value="${esc(p.username)}" ${f.pic === p.username ? 'selected' : ''}>${esc(p.nama)}</option>`).join('');
  const optJenis  = Object.keys(JENIS_AUDIT_SHORT).map(k => `<option value="${k}" ${f.jenis === k ? 'selected' : ''}>${JENIS_AUDIT_SHORT[k]}</option>`).join('');
  const optStatus = ['Selesai', 'Proses', 'Belum'].map(k => `<option value="${k}" ${f.status === k ? 'selected' : ''}>${k}</option>`).join('');
  return `
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-bottom:24px;">
      <label class="flt-chip">
        <i data-lucide="shield" class="flt-ico flt-violet"></i><span class="flt-lbl">Sumber:</span>
        <select id="db-flt-sumber" onchange="dbApplyFilter()"><option value="">Semua Sumber</option>${optSumber}</select>
      </label>
      <label class="flt-chip">
        <i data-lucide="calendar" class="flt-ico flt-green"></i><span class="flt-lbl">Tahun:</span>
        <select id="db-flt-tahun" onchange="dbApplyFilter()"><option value="">Semua Tahun</option>${optTahun}</select>
      </label>
      <label class="flt-chip">
        <i data-lucide="tag" class="flt-ico flt-violet"></i><span class="flt-lbl">Jenis Audit:</span>
        <select id="db-flt-jenis" onchange="dbApplyFilter()"><option value="">Semua Jenis</option>${optJenis}</select>
      </label>
      <label class="flt-chip flt-chip-pic">
        <i data-lucide="building-2" class="flt-ico flt-orange"></i><span class="flt-lbl">Unit PIC:</span>
        <select id="db-flt-pic" onchange="dbApplyFilter()" ${isPicUser() ? 'disabled' : ''}><option value="">Semua PIC</option>${optPic}</select>
      </label>
      <label class="flt-chip">
        <i data-lucide="activity" class="flt-ico flt-green"></i><span class="flt-lbl">Status:</span>
        <select id="db-flt-status" onchange="dbApplyFilter()"><option value="">Semua Status</option>${optStatus}</select>
      </label>
    </div>`;
}

// ═══ TABEL TEMUAN DI DASHBOARD ═════════════════════════════════════════
// Kolom: No. Dokumen | Uraian Kegiatan & Pelaksanaan | Sumber | Jenis Audit | PIC | Deadline | Status Kelengkapan
// Ruang Isian & Detail digabung ke sini: baris dapat dibuka untuk melihat/ubah rincian (kriteria, sebab,
// akibat, rekomendasi, renaksi, output), unggah bukti, dan terbitkan BATL.

function dbJenisBadge(r) {
  const k = r && r.JenisAudit;
  if (!k) return '<span class="text-slate-400">-</span>';
  return `<span class="inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${JENIS_AUDIT_CLS[k] || 'bg-slate-100 text-slate-600'}" title="${esc(r.JenisAuditLabel || '')}">${esc(JENIS_AUDIT_SHORT[k] || k)}</span>`;
}

// Ringkasan satu temuan induk beserta sub temuannya
function dbGroupInfo(items) {
  const total = items.length;
  let selesai = 0, proses = 0, tuntas = 0;
  items.forEach(r => {
    const lbl = statusOf(r).lbl;
    if (lbl === 'Selesai') selesai++; else if (lbl === 'Proses') proses++;
    if (r.TLStatus === 'terverifikasi' || r.TLStatus === 'batl' || lbl === 'Selesai') tuntas++;
  });
  const status = selesai === total ? 'Selesai' : ((proses > 0 || selesai > 0) ? 'Proses' : 'Belum');
  const allTuntas = tuntas === total;

  // Deadline terdekat dari rincian yang belum tuntas (bila semua tuntas: deadline paling akhir)
  const dated = items.filter(r => r.Deadline);
  const pending = dated.filter(r => !(r.TLStatus === 'terverifikasi' || r.TLStatus === 'batl'));
  const pool = (pending.length ? pending : dated).map(r => r.Deadline).sort();
  const deadline = pool.length ? pool[0] : '';
  return { total, tuntas, status, allTuntas, deadline, pct: total ? Math.round((tuntas / total) * 100) : 0 };
}

function dbDeadlineHtml(g) {
  if (!g.deadline) return '<span class="text-slate-400">-</span>';
  const d = daysUntil(g.deadline);
  let note = '';
  if (g.allTuntas)      note = '<div class="mt-0.5 text-[11px] font-semibold text-emerald-600">Tuntas</div>';
  else if (d < 0)       note = `<div class="mt-0.5 text-[11px] font-bold text-red-600">Terlambat ${Math.abs(d)} hari</div>`;
  else if (d === 0)     note = '<div class="mt-0.5 text-[11px] font-bold text-amber-600">Hari ini</div>';
  else if (d <= 7)      note = `<div class="mt-0.5 text-[11px] font-bold text-amber-600">H-${d}</div>`;
  return `<div class="text-[12.5px] font-semibold text-slate-800">${esc(fmtTanggal(g.deadline))}</div>${note}`;
}

function dbStatusHtml(g) {
  const st = g.status === 'Selesai' ? { cls: 'pill-ok', icon: 'check-circle' }
           : g.status === 'Proses'  ? { cls: 'pill-prog', icon: 'clock' }
           :                          { cls: 'pill-empty', icon: 'minus-circle' };
  const bar = g.pct >= 100 ? '#16a34a' : g.pct > 0 ? '#2563eb' : '#cbd5e1';
  return `
    <span class="status-pill ${st.cls}"><i data-lucide="${st.icon}" style="width:12px;" class="icon-plain"></i> ${g.status.toUpperCase()}</span>
    <div class="mt-2 h-1.5 w-full min-w-[110px] overflow-hidden rounded-full bg-slate-100"><div style="width:${g.pct}%;height:100%;background:${bar};border-radius:999px;"></div></div>
    <div class="mt-1 text-[11px] text-slate-500">${g.tuntas}/${g.total} rincian tuntas</div>`;
}

function dbTableHtml() {
  const f = S.dbF;
  const q = String(f.q || '').toLowerCase().trim();
  const canAdd = !isPicUser();

  const rows = scopeRows(dbFilteredRows(S.allR || []));
  const groups = {};
  rows.forEach(r => {
    const k = String(r.No || '0');
    (groups[k] = groups[k] || []).push(r);
  });

  S._dbCountText = '0 Temuan';
  const keys = Object.keys(groups).filter(k => {
    const items = groups[k];
    if (f.status && dbGroupInfo(items).status !== f.status) return false;
    if (!q) return true;
    const hay = [k, items[0].SumberLabel, items[0].JenisAuditLabel, items[0].Temuan]
      .concat(items.map(r => r.SubTemuan), items.map(r => r.RencanaAksi), items.map(r => groupPicNames([r]).join(' '))).join(' ').toLowerCase();
    return hay.includes(q);
  });

  S._dbCountText = `${keys.length} Temuan (${keys.reduce((a, k) => a + groups[k].length, 0)} rincian)`;

  if (!keys.length) {
    return `
      <div style="text-align:center;padding:48px 16px;background:#fff;border-radius:16px;border:1.5px dashed var(--border-color);">
        <i data-lucide="folder-open" style="width:38px;height:38px;color:var(--text-muted);margin-bottom:8px;" class="icon-plain"></i>
        <h4 style="font-weight:700">Data Tidak Ditemukan</h4>
        <p style="font-size:12px;color:var(--text-muted)">${canAdd ? 'Ubah filter / kata kunci, atau tambahkan temuan baru.' : 'Belum ada temuan yang ditugaskan kepada Anda, atau ubah filter.'}</p>
      </div>`;
  }

  const th = 'px-3 py-3 text-left';
  const body = keys.map(noKey => {
    const items = groups[noKey];
    const parent = items[0];
    const g = dbGroupInfo(items);
    const key = 't:' + noKey;
    const open = !!S.riOpen[key];
    const rencana = (items.find(r => String(r.RencanaAksi || '').trim()) || {}).RencanaAksi;
    const pelaksanaan = rencana
      ? `<span class="font-semibold text-slate-600">Pelaksanaan:</span> ${esc(riShort(String(rencana).replace(/^\s*\d{1,2}\s*[.)]\s*/, ''), 120))}`
      : '<span class="italic text-slate-400">Belum ada rencana aksi</span>';

    return `
      <tr data-key="${esc(key)}" onclick="togTblRow(this)"
        class="cursor-pointer align-top transition-colors hover:bg-slate-50 ${open ? 'bg-slate-50' : ''}">
        <td class="border-b border-slate-100 py-4 pl-4 pr-1">
          <span class="rk-chev flex items-center text-slate-400" style="transition:transform .2s;transform:rotate(${open ? 180 : 0}deg);">
            <i data-lucide="chevron-down" style="width:18px;height:18px;" class="icon-plain"></i>
          </span>
        </td>
        <td class="whitespace-nowrap border-b border-slate-100 px-3 py-4">
          <span class="rounded-md bg-blue-50 px-2.5 py-1 text-[12px] font-bold tracking-wide text-blue-600">${esc(parent.No) || '-'}</span>
        </td>
        <td class="border-b border-slate-100 px-3 py-4">
          <div class="whitespace-pre-line break-words text-[13.5px] font-semibold leading-snug text-slate-900" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${esc(parent.Temuan) || '—'}</div>
          <div class="mt-1 text-[11.5px] leading-snug text-slate-500">${pelaksanaan}</div>
          <div class="mt-1 text-[11px] text-slate-400">${subCountLabel(items.length)}</div>
        </td>
        <td class="whitespace-nowrap border-b border-slate-100 px-3 py-4">${sumberBadge(parent) || '<span class="text-slate-400">-</span>'}</td>
        <td class="whitespace-nowrap border-b border-slate-100 px-3 py-4">${dbJenisBadge(parent)}</td>
        <td class="border-b border-slate-100 px-3 py-4">${riPicChips(groupPicNames(items))}</td>
        <td class="whitespace-nowrap border-b border-slate-100 px-3 py-4">${dbDeadlineHtml(g)}</td>
        <td class="border-b border-slate-100 px-3 py-4">${dbStatusHtml(g)}</td>
        ${canAdd ? `<td class="whitespace-nowrap border-b border-slate-100 px-4 py-4 text-right">
          <button class="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400" onclick="event.stopPropagation(); openAddSubModal(${items[items.length - 1]._row})">
            <i data-lucide="plus-circle" style="width:14px;height:14px;" class="icon-plain"></i> Sub Temuan
          </button></td>` : ''}
      </tr>
      <tr style="display:${open ? 'table-row' : 'none'};">
        <td colspan="${canAdd ? 9 : 8}" class="border-b border-slate-200 bg-slate-50 p-4 max-[768px]:p-3">${items.map((sub, idx) => riSubHtml(sub, idx, true, items.length)).join('')}</td>
      </tr>`;
  }).join('');

  return `
    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[1040px] border-collapse">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th class="w-10 py-3 pl-4 pr-1"></th>
              <th class="${th} w-[140px]">No. Dokumen</th>
              <th class="${th}">Uraian Kegiatan &amp; Pelaksanaan</th>
              <th class="${th} w-[110px]">Sumber</th>
              <th class="${th} w-[110px]">Jenis Audit</th>
              <th class="${th} w-[220px]">PIC</th>
              <th class="${th} w-[130px]">Deadline</th>
              <th class="${th} w-[170px]">Status Kelengkapan</th>
              ${canAdd ? '<th class="w-[130px] px-4 py-3 text-right">Aksi</th>' : ''}
            </tr>
          </thead>
          <tbody class="[&>tr:last-child>td]:border-b-0">${body}</tbody>
        </table>
      </div>
    </div>`;
}

function dbTableSectionHtml() {
  const canAdd = !isPicUser();
  return `
    <div id="db-table-sec" style="background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;padding:24px;box-shadow:0 1px 4px rgba(0,0,0,0.05);margin-bottom:28px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:18px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="padding:8px;background:#eff6ff;color:#2563eb;border-radius:8px;display:flex;align-items:center;">
            <i data-lucide="list-checks" style="width:18px;height:18px;"></i>
          </div>
          <div>
            <div style="font-size:16px;font-weight:800;color:#0f172a;">Daftar Temuan &amp; Tindak Lanjut</div>
            <div style="font-size:12px;color:#64748b;" id="db-table-count"></div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <div class="flt-chip">
            <i data-lucide="search" class="flt-ico icon-plain"></i>
            <input type="text" id="db-flt-q" value="${esc(S.dbF.q || '')}" placeholder="Cari no. dokumen / uraian..." class="flt-search-input" oninput="dbSearch()">
          </div>
          ${canAdd ? '<button class="btn-action-pri" onclick="openModal()"><i data-lucide="plus" style="width:16px;"></i> Tambah Temuan Baru</button>' : ''}
        </div>
      </div>
      <div id="db-table-body">${dbTableHtml()}</div>
    </div>`;
}

// ═══ HALAMAN DASHBOARD ═════════════════════════════════════════════════

const centerTextPlugin = {
  id: 'centerText',
  afterDraw(chart) {
    if (chart.config.type !== 'doughnut') return;
    const { ctx, chartArea: { width, height, left, top } } = chart;
    ctx.save();
    const data  = chart.data.datasets[0].data;
    const total = data.reduce((a, b) => a + b, 0);
    const pct   = total > 0 ? Math.round((data[0] / total) * 100) : 0;
    const cx = left + width / 2, cy = top + height / 2;
    
    ctx.textAlign = 'center'; 
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0f172a';
    ctx.font = '800 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(pct + '%', cx, cy - 6);
    
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Progress Selesai', cx, cy + 12);
    ctx.restore();
  }
};
if (typeof Chart !== 'undefined') {
  Chart.register(centerTextPlugin);
}

function loadDashboard() {
  const nama = S.user?.nama || S.user?.username || 'Administrator';
  
  const hdrTitle = document.getElementById('hdr-title');
  if (hdrTitle) {
    hdrTitle.innerHTML = `Selamat Datang, ${esc(nama)} <i data-lucide="sparkles" style="width:18px;height:18px;color:#FFCC00;display:inline-block;vertical-align:middle;margin-left:4px;"></i>`;
  }
  
  document.getElementById('hdr-sub').textContent = 'Pantau dan kelola data kinerja dengan mudah dan cepat.';
  setBody(loadingHtml());
  refreshIcons();

  apiFetch('/api/temuan')
    .then(rows => {
      S.allR = rows || [];
      calculateAndRenderDashboard(rows || []);
    })
    .catch(() => showToast('Gagal memuat data dari server', 'err'));
}

function calculateAndRenderDashboard(rows) {
  rows = dbFilteredRows(rows);
  const picList = S.picList || [];
  const uniqueNos = new Set();
  let totalSelesai = 0, totalProses = 0, totalBelum = 0;
  
  const picStatsMap = {};
  picList.forEach(p => {
    picStatsMap[_picNormKey(p.username)] = { username: p.username, nama: p.nama, jumlah: 0, selesai: 0, progress: 0 };
  });

  rows.forEach(r => {
    if (r.No) uniqueNos.add(String(r.No).trim());
    const st = statusOf(r);
    if (st.lbl === 'Selesai') totalSelesai++;
    else if (st.lbl === 'Proses') totalProses++;
    else totalBelum++;

    const keys = new Set();
    splitPics(r.PIC).forEach(t => keys.add(picKeyOf(t)));
    keys.forEach(k => {
      if (picStatsMap[k]) {
        picStatsMap[k].jumlah++;
        if (st.lbl === 'Selesai') picStatsMap[k].selesai++;
      }
    });
  });

  const total = rows.length;
  const totalTemuan = uniqueNos.size;
  let picMengisiCount = 0;

  const picStatsArray = Object.keys(picStatsMap).map(k => {
    const item = picStatsMap[k];
    if (item.jumlah > 0) picMengisiCount++;
    item.progress = item.jumlah > 0 ? Math.round((item.selesai / item.jumlah) * 100) : 0;
    return item;
  });

  renderDashboard({
    totalTemuan,
    totalTindakLanjut: total,
    picMengisi: picMengisiCount,
    totalPic: picList.length,
    progressKeseluruhan: total > 0 ? Math.round((totalSelesai / total) * 100) : 0,
    status: { selesai: totalSelesai, proses: totalProses, belum: totalBelum },
    picStats: picStatsArray,
  });
}

function renderDashboard(d) {
  if (!d) return;
  const isPic = isPicUser();
  let picGrid = d.picStats || [];
  if (isPic) picGrid = picGrid.filter(p => picKeyOf(p.username) === picKeyOf(S.user.username) || picKeyOf(p.username) === picKeyOf(S.user.nama));

  const picMengisiPct = d.totalPic > 0 ? Math.round((d.picMengisi / d.totalPic) * 100) : 0;

  const statCards = [
    { label: 'TOTAL TEMUAN',        value: d.totalTemuan || 0,                        icon: 'search',      badge: d.totalTemuan > 0 ? d.totalTemuan : null,      badgeUp: true  },
    { label: 'TOTAL TINDAK LANJUT', value: d.totalTindakLanjut || 0,                  icon: 'file-check-2',badge: `${d.progressKeseluruhan || 0}%`,               badgeUp: (d.progressKeseluruhan || 0) > 0 },
    { label: 'PIC SUDAH MENGISI',   value: `${d.picMengisi || 0}/${d.totalPic || 0}`, icon: 'users',       badge: `${picMengisiPct}%`,                            badgeUp: picMengisiPct > 0 },
    { label: 'PROGRESS KESELURUHAN',value: `${d.progressKeseluruhan || 0}%`,          icon: 'trending-up', badge: `${d.progressKeseluruhan || 0}%`,               badgeUp: (d.progressKeseluruhan || 0) > 0 },
  ];

  // Bar chart rows — use all picStats (not filtered by isPic)
  const barStats = d.picStats || [];
  const barMax   = barStats.reduce((m, p) => Math.max(m, p.jumlah), 0) || 1;

  // Bar rows start at width:0 — JS will animate them after DOM insert
  const barRows = barStats.map((p, bi) => {
    const targetPct = Math.round((p.jumlah / barMax) * 100);
    const label     = _picShortLabel(p);
    const hasVal    = p.jumlah > 0;
    return `
      <div class="db-bar-row" data-pct="${targetPct}" data-nama="${esc(p.nama)}" data-jumlah="${p.jumlah}"
           style="display:flex;align-items:center;gap:10px;font-size:12px;border-radius:8px;padding:4px 6px;cursor:default;position:relative;transition:background 0.15s;">
        <span style="width:44px;font-weight:700;color:#334155;flex-shrink:0;">${esc(label)}</span>
        <div style="flex:1;background:#f1f5f9;border-radius:999px;height:14px;overflow:hidden;position:relative;">
          <div class="db-bar-fill" style="width:0%;height:100%;border-radius:999px;background:${hasVal ? '#2563eb' : '#cbd5e1'};transition:width 0.55s cubic-bezier(.4,0,.2,1);"></div>
        </div>
        <span style="width:20px;text-align:right;font-weight:${hasVal ? '700' : '600'};color:${hasVal ? '#1e293b' : '#94a3b8'};flex-shrink:0;">${p.jumlah}</span>
        <div class="db-bar-tooltip" style="display:none;position:absolute;left:54px;top:-38px;background:#0f172a;color:#fff;font-size:11px;font-weight:600;padding:5px 10px;border-radius:8px;white-space:nowrap;pointer-events:none;z-index:20;box-shadow:0 4px 12px rgba(0,0,0,0.25);">
          ${esc(p.nama)}: <b>${p.jumlah}</b> tindak lanjut
          <div style="position:absolute;bottom:-5px;left:16px;width:10px;height:10px;background:#0f172a;transform:rotate(45deg);border-radius:2px;"></div>
        </div>
      </div>`;
  }).join('');

   // Donut interaktif (SVG) — satu sumber warna untuk donut, legenda, dan tooltip
  const { selesai, proses, belum } = d.status;
  const totalStatus = selesai + proses + belum || 1;
  const progressPct = Math.round((selesai / totalStatus) * 100);
  // Warna angka tengah menyesuaikan persen: 100% hijau, 1–99% oranye, 0% merah, tanpa data abu-abu
  const progressColor = (selesai + proses + belum) === 0 ? '#94a3b8'
                      : progressPct >= 100 ? '#10b981'
                      : progressPct > 0    ? '#f59e0b'
                      : '#ff1744';
  const DONUT = [
    { key: 'selesai', label: 'Selesai', value: selesai, color: '#10b981' },
    { key: 'proses',  label: 'Proses',  value: proses,  color: '#f59e0b' },
    { key: 'belum',   label: 'Belum',   value: belum,   color: '#ff1744' },
  ];
  const _donutR = 75, _donutC = 2 * Math.PI * _donutR;
  const _donutOn = DONUT.filter(x => x.value > 0);
  const _donutGap = _donutOn.length > 1 ? 3 : 0;   // celah putih antar segmen
  let _donutAcc = 0;
  const donutSegs = _donutOn.length
    ? DONUT.map(x => {
        if (!x.value) return '';
        const len  = (x.value / totalStatus) * _donutC;
        const dash = Math.max(len - _donutGap, 0.5);
        const el = `<circle class="db-donut-seg" data-status="${x.key}" cx="90" cy="90" r="${_donutR}" fill="none"
            stroke="${x.color}" stroke-width="28" stroke-dasharray="${dash} ${_donutC - dash}"
            stroke-dashoffset="${-_donutAcc}" transform="rotate(-90 90 90)"/>`;
        _donutAcc += len;
        return el;
      }).join('')
    : `<circle cx="90" cy="90" r="${_donutR}" fill="none" stroke="#e2e8f0" stroke-width="28"/>`;


  // PIC cards HTML
  const picCardsHtml = picGrid.length
    ? picGrid.map((p, i) => {
        const progressPctCard = p.progress || 0;
        const progressColor   = progressPctCard >= 100 ? '#16a34a' : progressPctCard > 0 ? '#2563eb' : '#cbd5e1';
        const progressTextColor = progressPctCard >= 100 ? 'color:#16a34a;' : 'color:#dc2626;';
        return `
          <div class="db-pic-card" onclick="dbPickPic('${esc(jsq(p.username))}')">
            <div class="db-pic-card-body">
              <div class="db-pic-icon-wrap">${_picIconSvg(i)}</div>
              <h4 class="db-pic-name">${esc(p.nama)}</h4>
            </div>
            <div class="db-pic-card-footer">
              <span class="db-pic-tl-lbl">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#94a3b8;flex-shrink:0;"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                Tindak Lanjut
              </span>
              <span style="font-size:12px;font-weight:700;${progressTextColor}">${progressPctCard}%</span>
            </div>
            <div class="db-pic-bar-track">
              <div class="db-pic-bar-fill" style="width:${progressPctCard}%;background:${progressColor};"></div>
            </div>
          </div>`;
      }).join('')
    : `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">Belum ada data PIC</div>`;

  setBody(`
    <!-- Stat Cards -->
    <div class="stat-grid" style="margin-bottom:24px;">
      ${statCards.map(c => `
        <div class="db-stat-card">
          <div class="db-stat-card-header">
            <div class="db-stat-icon-wrap"><i data-lucide="${c.icon}"></i></div>
            ${c.badge != null ? `
            <span class="db-stat-badge ${c.badgeUp ? 'up' : 'neutral'}">
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>
              ${c.badge}
            </span>` : ''}
          </div>
          <div class="db-stat-val">${c.value}</div>
          <div class="db-stat-lbl">${c.label}</div>
        </div>
      `).join('')}
    </div>

    <!-- Charts Row -->
    <div class="chart-grid" style="margin-bottom:28px;">

      <!-- Bar Chart (Horizontal) -->
      <div class="chart-card">
        <div class="chart-card-header">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="padding:8px;background:#eff6ff;color:#2563eb;border-radius:8px;display:flex;align-items:center;">
              <i data-lucide="bar-chart-2" style="width:18px;height:18px;"></i>
            </div>
            <div>
              <div style="font-size:16px;font-weight:800;color:#0f172a;">Jumlah Tindak Lanjut per PIC</div>
              <div style="font-size:12px;color:#64748b;">Distribusi penyelesaian berdasarkan unit kerja</div>
            </div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;padding-top:4px;">
          ${barRows || '<div style="color:#94a3b8;font-size:12px;text-align:center;padding:20px 0;">Belum ada data</div>'}
        </div>
      </div>

      <!-- Donut Chart (CSS) -->
      <div class="chart-card" style="display:flex;flex-direction:column;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
          <div style="padding:8px;background:#eff6ff;color:#2563eb;border-radius:8px;display:flex;align-items:center;">
            <i data-lucide="pie-chart" style="width:18px;height:18px;"></i>
          </div>
          <div>
            <div style="font-size:16px;font-weight:800;color:#0f172a;">Status Tindak Lanjut</div>
            <div style="font-size:12px;color:#64748b;">Persentase keseluruhan status</div>
          </div>
        </div>

        <!-- Donut visual -->
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px 0 12px;">
          <div id="db-donut-ring" style="width:260px;max-width:100%;aspect-ratio:1/1;position:relative;">
            <svg id="db-donut-svg" class="db-donut-svg" viewBox="0 0 180 180" style="display:block;width:100%;height:100%;overflow:visible;">${donutSegs}</svg>
            <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;">
              <span id="db-donut-pct" style="font-size:38px;font-weight:800;color:${progressColor};line-height:1;transition:color 0.2s;">${progressPct}%</span>
              <span id="db-donut-lbl" style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-top:6px;">Progress Selesai</span>
            </div>
          </div>
         </div>

        <!-- Legend — pushed to bottom -->
        <div style="margin-top:auto;border-top:1px solid #f1f5f9;padding-top:12px;display:flex;flex-direction:column;gap:6px;">
          <div class="db-legend-row" data-status="selesai" data-val="${selesai}" data-pct="${Math.round((selesai/totalStatus)*100)}"
               style="display:flex;align-items:center;justify-content:space-between;font-size:12px;font-weight:600;padding:4px 6px;border-radius:6px;cursor:pointer;transition:background 0.15s;">
            <span style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:50%;background:${DONUT[0].color};display:inline-block;"></span><span style="color:#334155;">Selesai</span></span>
            <b style="color:#0f172a;">${selesai}</b>
          </div>
          <div class="db-legend-row" data-status="proses" data-val="${proses}" data-pct="${Math.round((proses/totalStatus)*100)}"
               style="display:flex;align-items:center;justify-content:space-between;font-size:12px;font-weight:600;padding:4px 6px;border-radius:6px;cursor:pointer;transition:background 0.15s;">
            <span style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:50%;background:${DONUT[1].color};display:inline-block;"></span><span style="color:#334155;">Proses</span></span>
            <b style="color:#0f172a;">${proses}</b>
          </div>
          <div class="db-legend-row" data-status="belum" data-val="${belum}" data-pct="${Math.round((belum/totalStatus)*100)}"
               style="display:flex;align-items:center;justify-content:space-between;font-size:12px;font-weight:600;padding:4px 6px;border-radius:6px;cursor:pointer;transition:background 0.15s;">
            <span style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:50%;background:${DONUT[2].color};display:inline-block;"></span><span style="color:#334155;">Belum</span></span>
            <b style="color:#0f172a;">${belum}</b>
          </div>
        </div>
      </div>

    </div>

    <!-- Filter: Sumber / Tahun / Unit PIC -->
    ${dbFilterBarHtml()}

    <!-- Tabel Temuan & Tindak Lanjut (gabungan Ruang Isian + Detail) -->
    ${dbTableSectionHtml()}

    <!-- PIC Section Header -->
    <div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;padding:24px;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="padding:8px;background:#eff6ff;color:#2563eb;border-radius:8px;display:flex;align-items:center;">
            <i data-lucide="layers" style="width:18px;height:18px;"></i>
          </div>
          <div>
            <div style="font-size:16px;font-weight:800;color:#0f172a;">${isPic ? 'Informasi PIC Anda' : 'Daftar Progress PIC'}</div>
            <div style="font-size:12px;color:#64748b;">Monitoring kinerja penanggung jawab unit</div>
          </div>
        </div>
        <a href="#" style="font-size:12px;color:#2563eb;font-weight:700;display:flex;align-items:center;gap:4px;" onclick="navigate('rekap'); return false;">
          Lihat Semua
          <i data-lucide="chevron-right" style="width:14px;height:14px;"></i>
        </a>
      </div>
      <!-- PIC Cards Grid -->
      <div class="db-pic-grid">${picCardsHtml}</div>
    </div>
  `);

  dbSyncCount();
  refreshIcons();

  // ── Animate bar fills from 0 → target width ──────────────────
  requestAnimationFrame(() => {
    document.querySelectorAll('.db-bar-row').forEach(row => {
      const fill = row.querySelector('.db-bar-fill');
      const pct  = row.dataset.pct || 0;
      if (fill) {
        requestAnimationFrame(() => { fill.style.width = pct + '%'; });
      }

      // Hover: highlight row background + show tooltip
      const tip = row.querySelector('.db-bar-tooltip');
      row.addEventListener('mouseenter', () => {
        row.style.background = '#f8fafc';
        if (tip) tip.style.display = 'block';
      });
      row.addEventListener('mouseleave', () => {
        row.style.background = '';
        if (tip) tip.style.display = 'none';
      });
    });
  });

   // ── Donut interaktif: hover segmen / legenda → highlight, tooltip, teks tengah ──
  const donutSvgEl = document.getElementById('db-donut-svg');
  const donutPctEl = document.getElementById('db-donut-pct');
  const donutLblEl = document.getElementById('db-donut-lbl');

  if (donutSvgEl && donutPctEl && donutLblEl) {
    let tip = document.getElementById('db-donut-tip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'db-donut-tip';
      tip.style.cssText = 'position:fixed;display:none;z-index:9999;pointer-events:none;background:rgba(15,23,42,.92);color:#fff;font-size:12px;padding:8px 12px;border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,.25);';
      document.body.appendChild(tip);
    }
    const info = {};
    DONUT.forEach(x => { info[x.key] = x; });

    function setDonutActive(key) {
      const x = key ? info[key] : null;
      donutSvgEl.classList.toggle('has-hover', !!x);
      donutSvgEl.querySelectorAll('.db-donut-seg').forEach(sg => sg.classList.toggle('active', sg.dataset.status === key));
      document.querySelectorAll('.db-legend-row').forEach(r => { r.style.background = r.dataset.status === key ? '#f1f5f9' : ''; });
      donutPctEl.style.color   = x ? x.color : progressColor;
      donutPctEl.textContent   = x ? x.value : progressPct + '%';
      donutLblEl.textContent   = x ? x.label : 'Progress Selesai';
    }

    function showDonutTip(key, e) {
      const x = info[key];
      if (!x) return;
      const pct = Math.round((x.value / totalStatus) * 100);
      tip.innerHTML =
        `<div style="font-weight:700;margin-bottom:4px;">${x.label}</div>` +
        `<div style="display:flex;align-items:center;gap:6px;">` +
        `<span style="width:10px;height:10px;background:${x.color};border:1px solid #fff;display:inline-block;"></span>` +
        `<b>${x.value}</b><span style="opacity:.7;">(${pct}%)</span></div>`;
      tip.style.left = (e.clientX + 14) + 'px';
      tip.style.top  = (e.clientY + 14) + 'px';
      tip.style.display = 'block';
    }

    donutSvgEl.querySelectorAll('.db-donut-seg').forEach(sg => {
      const key = sg.dataset.status;
      sg.addEventListener('mouseenter', e => { setDonutActive(key); showDonutTip(key, e); });
      sg.addEventListener('mousemove',  e => showDonutTip(key, e));
      sg.addEventListener('mouseleave', () => { setDonutActive(null); tip.style.display = 'none'; });
    });

    document.querySelectorAll('.db-legend-row').forEach(row => {
      row.addEventListener('mouseenter', () => setDonutActive(row.dataset.status));
      row.addEventListener('mouseleave', () => setDonutActive(null));
    });
  }
}
