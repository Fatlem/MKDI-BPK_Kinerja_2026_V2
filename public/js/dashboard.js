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

// ── Filter dashboard: Sumber / Jenis Audit / Tahun / Unit PIC ──
if (!S.dbF) S.dbF = { sumber: '', jenis: '', tahun: '', pic: '' };

function dbFilteredRows(rows) {
  const f = S.dbF;
  return (rows || []).filter(r =>
    (!f.sumber || (r.Sumber || 'bpk') === f.sumber) &&
    (!f.jenis  || (r.JenisAudit || 'kinerja') === f.jenis) &&
    (!f.tahun  || String(r.Tahun || '') === f.tahun) &&
    (!f.pic    || hasPic(splitPics(r.PIC), f.pic))
  );
}

function dbApplyFilter() {
  const v = id => (document.getElementById('db-flt-' + id) || {}).value || '';
  S.dbF = { sumber: v('sumber'), jenis: v('jenis'), tahun: v('tahun'), pic: v('pic') };
  calculateAndRenderDashboard(S.allR || []);
}

function dbResetFilter() {
  S.dbF = { sumber: '', jenis: '', tahun: '', pic: '' };
  calculateAndRenderDashboard(S.allR || []);
}

function dbFilterBarHtml() {
  const f = S.dbF;
  const optSumber = Object.keys(SUMBER_LABEL).map(k => `<option value="${esc(k)}" ${f.sumber === k ? 'selected' : ''}>${esc(SUMBER_LABEL[k])}</option>`).join('');
  const optJenis  = Object.keys(JENIS_AUDIT_LABEL).map(k => `<option value="${esc(k)}" ${f.jenis === k ? 'selected' : ''}>${esc(JENIS_AUDIT_LABEL[k])}</option>`).join('');
  const optTahun  = tahunOptions(S.allR).map(y => `<option value="${esc(y)}" ${f.tahun === y ? 'selected' : ''}>${esc(y)}</option>`).join('');
  const optPic    = allPicOptions().map(p => `<option value="${esc(p.username)}" ${f.pic === p.username ? 'selected' : ''}>${esc(p.nama)}</option>`).join('');
  const selCls    = 'h-8 px-3 text-xs bg-white border border-black/[0.08] rounded-[9px] focus:border-[#0071E3] focus:outline-none text-[#1D1D1F] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)]';
  return `
    <div class="mb-5 flex flex-wrap items-center gap-2">
      <select id="db-flt-sumber" onchange="dbApplyFilter()" class="${selCls}">
        <option value="">Semua Sumber</option>${optSumber}
      </select>
      <select id="db-flt-jenis" onchange="dbApplyFilter()" class="${selCls}">
        <option value="">Semua Jenis Audit</option>${optJenis}
      </select>
      <select id="db-flt-tahun" onchange="dbApplyFilter()" class="${selCls}">
        <option value="">Semua Tahun</option>${optTahun}
      </select>
      <select id="db-flt-pic" onchange="dbApplyFilter()" ${isPicUser() ? 'disabled' : ''} class="${selCls} max-w-[220px] truncate">
        <option value="">Semua Unit Kerja</option>${optPic}
      </select>
      <button type="button" onclick="dbResetFilter()" class="h-8 px-3 text-xs text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.04] rounded-[9px] transition-colors flex items-center gap-1" title="Reset">
        <span>Reset</span>
      </button>
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
    ctx.fillStyle = '#1D1D1F';
    ctx.font = '700 22px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(pct + '%', cx, cy - 6);
    
    ctx.fillStyle = '#86868B';
    ctx.font = '500 10px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('Selesai', cx, cy + 12);
    ctx.restore();
  }
};
if (typeof Chart !== 'undefined') {
  Chart.register(centerTextPlugin);
}

function loadDashboard() {
  const hdrTitle = document.getElementById('hdr-title');
  if (hdrTitle) hdrTitle.textContent = 'Dashboard';
  const hdrSub = document.getElementById('hdr-sub');
  if (hdrSub) hdrSub.textContent = '';

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
  const lhaNos = new Set();
  let totalSelesai = 0, totalProses = 0, totalBelum = 0;
  let totalSubTemuan = 0, totalRenaksi = 0;
  let targetTotal = 0, realisasiTotal = 0, selisihTotal = 0;
  
  const picStatsMap = {};
  picList.forEach(p => {
    picStatsMap[_picNormKey(p.username)] = { username: p.username, nama: p.nama, jumlah: 0, selesai: 0, progress: 0 };
  });

  rows.forEach(r => {
    if (r.No) {
      uniqueNos.add(String(r.No).trim());
      if (r.StatusDokumen === 'lha') lhaNos.add(String(r.No).trim());
    }
    if (r.isSubRow || String(r.SubTemuan || '').trim()) totalSubTemuan++;
    if (String(r.RencanaAksi || '').trim()) totalRenaksi++;

    const st = statusOf(r);
    if (st.lbl === 'Selesai') totalSelesai++;
    else if (st.lbl === 'Proses') totalProses++;
    else totalBelum++;

    const nt = Number(r.NilaiTemuan) || 0;
    const nr = Number(r.NilaiRealisasi) || 0;
    const ns = r.Selisih != null ? Number(r.Selisih) : Math.max(0, nt - nr);
    targetTotal    += nt;
    realisasiTotal += nr;
    selisihTotal   += ns;

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
    totalSubTemuan,
    totalLha: lhaNos.size,
    totalTindakLanjut: total,
    totalRenaksi,
    picMengisi: picMengisiCount,
    totalPic: picList.length,
    progressKeseluruhan: total > 0 ? Math.round((totalSelesai / total) * 100) : 0,
    status: { selesai: totalSelesai, proses: totalProses, belum: totalBelum },
    financial: {
      target: targetTotal,
      realisasi: realisasiTotal,
      selisih: selisihTotal,
      pct: targetTotal > 0 ? Math.min(100, Math.round((realisasiTotal / targetTotal) * 100)) : 0
    },
    picStats: picStatsArray,
  });
}

function renderDashboard(d) {
  if (!d) return;
  const isPic = isPicUser();
  let picGrid = d.picStats || [];
  if (isPic) picGrid = picGrid.filter(p => picKeyOf(p.username) === picKeyOf(S.user.username) || picKeyOf(p.username) === picKeyOf(S.user.nama));

  // Bar chart rows — use all picStats (not filtered by isPic)
  const barStats = d.picStats || [];
  const barMax   = barStats.reduce((m, p) => Math.max(m, p.jumlah), 0) || 1;

  // Bar rows start at width:0 — JS will animate them after DOM insert
  const barRows = barStats.map((p) => {
    const targetPct = Math.round((p.jumlah / barMax) * 100);
    const label     = _picShortLabel(p);
    const hasVal    = p.jumlah > 0;
    return `
      <div class="db-bar-row" data-pct="${targetPct}" data-nama="${esc(p.nama)}" data-jumlah="${p.jumlah}"
           style="display:flex;align-items:center;gap:10px;font-size:12px;border-radius:8px;padding:4px 6px;cursor:default;position:relative;transition:background 0.15s;">
        <span style="width:48px;font-weight:600;color:#6E6E73;flex-shrink:0;">${esc(label)}</span>
        <div style="flex:1;background:#F5F5F7;border-radius:999px;height:10px;overflow:hidden;position:relative;">
          <div class="db-bar-fill" style="width:0%;height:100%;border-radius:999px;background:${hasVal ? '#0071E3' : '#E5E5EA'};transition:width 0.55s cubic-bezier(.4,0,.2,1);"></div>
        </div>
        <span style="width:24px;text-align:right;font-weight:${hasVal ? '600' : '500'};color:${hasVal ? '#1D1D1F' : '#86868B'};flex-shrink:0;">${p.jumlah}</span>
        <div class="db-bar-tooltip" style="display:none;position:absolute;left:54px;top:-36px;background:rgba(29,29,31,0.92);color:#fff;font-size:11px;font-weight:500;padding:4px 10px;border-radius:8px;white-space:nowrap;pointer-events:none;z-index:20;box-shadow:0 4px 12px rgba(0,0,0,0.16);">
          ${esc(p.nama)}: <b>${p.jumlah}</b> (${p.selesai} selesai)
        </div>
      </div>`;
  }).join('');

  // Donut interaktif (SVG) — Palet Apple UI Kit (Blue, Gray, Light Gray)
  const { selesai, proses, belum } = d.status;
  const totalStatus = selesai + proses + belum || 1;
  const progressPct = Math.round((selesai / totalStatus) * 100);
  const progressColor = '#1D1D1F';
  const DONUT = [
    { key: 'selesai', label: 'Selesai', value: selesai, color: '#0071E3' },
    { key: 'proses',  label: 'Proses',  value: proses,  color: '#86868B' },
    { key: 'belum',   label: 'Belum',   value: belum,   color: '#E5E5EA' },
  ];
  const _donutR = 70, _donutC = 2 * Math.PI * _donutR;
  const _donutOn = DONUT.filter(x => x.value > 0);
  const _donutGap = _donutOn.length > 1 ? 2.5 : 0;
  let _donutAcc = 0;
  const donutSegs = _donutOn.length
    ? DONUT.map(x => {
        if (!x.value) return '';
        const len  = (x.value / totalStatus) * _donutC;
        const dash = Math.max(len - _donutGap, 0.5);
        const el = `<circle class="db-donut-seg" data-status="${x.key}" cx="90" cy="90" r="${_donutR}" fill="none"
            stroke="${x.color}" stroke-width="20" stroke-dasharray="${dash} ${_donutC - dash}"
            stroke-dashoffset="${-_donutAcc}" transform="rotate(-90 90 90)"/>`;
        _donutAcc += len;
        return el;
      }).join('')
    : `<circle cx="90" cy="90" r="${_donutR}" fill="none" stroke="#E5E5EA" stroke-width="20"/>`;

  // PIC cards HTML
  const picCardsHtml = picGrid.length
    ? picGrid.map((p, i) => {
        const progressPctCard = p.progress || 0;
        const progressBarClr  = progressPctCard > 0 ? '#0071E3' : '#E5E5EA';
        const progressTextClr = progressPctCard > 0 ? 'color:#0071E3;' : 'color:#86868B;';
        return `
          <div class="db-pic-card" onclick="if(window.S){S.activeLhaNo=null;} navigate('ruang-isian','${esc(jsq(p.username))}')">
            <div class="db-pic-card-body">
              <div class="db-pic-icon-wrap" style="background:#F5F5F7;color:#6E6E73;">${_picIconSvg(i)}</div>
              <h4 class="db-pic-name" style="color:#1D1D1F;font-weight:600;font-size:12.5px;">${esc(p.nama)}</h4>
            </div>
            <div class="db-pic-card-footer" style="border-top:1px solid rgba(0,0,0,0.05);">
              <span class="db-pic-tl-lbl" style="color:#86868B;">${p.selesai}/${p.jumlah} selesai</span>
              <span style="font-size:11.5px;font-weight:600;${progressTextClr}">${progressPctCard}%</span>
            </div>
            <div class="db-pic-bar-track" style="background:#F5F5F7;height:4px;">
              <div class="db-pic-bar-fill" style="width:${progressPctCard}%;background:${progressBarClr};"></div>
            </div>
          </div>`;
      }).join('')
    : `<div style="grid-column:1/-1;text-align:center;padding:36px;color:#86868B;">Belum ada data unit kerja</div>`;

  const fin = d.financial || { target: 0, realisasi: 0, selisih: 0, pct: 0 };
  const lhpCount = Math.max(0, (d.totalTemuan || 0) - (d.totalLha || 0));

  setBody(`
    ${dbFilterBarHtml()}

    <!-- 4 Minimalist Apple KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      <div class="bg-white rounded-2xl p-5 border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
        <span class="text-xs font-medium text-[#6E6E73]">Temuan</span>
        <div class="mt-2">
          <div class="text-3xl font-semibold text-[#1D1D1F] tracking-tight">${d.totalTemuan || 0}</div>
          <div class="mt-2 text-xs text-[#86868B]">${lhpCount} LHP · ${d.totalLha || 0} LHA</div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
        <span class="text-xs font-medium text-[#6E6E73]">Rekomendasi</span>
        <div class="mt-2">
          <div class="text-3xl font-semibold text-[#1D1D1F] tracking-tight">${d.totalTindakLanjut || 0}</div>
          <div class="mt-2 text-xs text-[#86868B]">${d.totalRenaksi || 0} Rencana Aksi · ${d.picMengisi || 0}/${d.totalPic || 0} Unit</div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-[#6E6E73]">Penyelesaian</span>
          <span class="text-xs font-medium text-[#0071E3]">${selesai}/${d.totalTindakLanjut || 0}</span>
        </div>
        <div class="mt-2">
          <div class="text-3xl font-semibold text-[#0071E3] tracking-tight">${d.progressKeseluruhan || 0}%</div>
          <div class="w-full bg-[#F5F5F7] rounded-full h-1.5 overflow-hidden mt-2.5">
            <div class="bg-[#0071E3] h-1.5 rounded-full transition-all duration-700" style="width:${d.progressKeseluruhan || 0}%"></div>
          </div>
          <div class="mt-1.5 text-[11px] text-[#86868B]">${proses} proses · ${belum} belum</div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-[#6E6E73]">Pemulihan Kas</span>
          <span class="text-xs font-medium text-[#6E6E73]">${fin.pct || 0}%</span>
        </div>
        <div class="mt-2">
          <div class="text-2xl font-semibold text-[#1D1D1F] tracking-tight truncate" title="Rp ${Number(fin.realisasi || 0).toLocaleString('id-ID')}">Rp ${formatIDR(fin.realisasi || 0)}</div>
          <div class="w-full bg-[#F5F5F7] rounded-full h-1.5 overflow-hidden mt-2.5">
            <div class="bg-[#0071E3] h-1.5 rounded-full transition-all duration-500" style="width:${fin.pct || 0}%"></div>
          </div>
          <div class="mt-1.5 text-[11px] text-[#86868B] truncate">Target Rp ${formatIDR(fin.target || 0)}</div>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-5">
      <div class="lg:col-span-2 bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-5 flex flex-col">
        <h3 class="text-[13px] font-semibold text-[#1D1D1F] mb-2">Status Tindak Lanjut</h3>
        <div class="flex-1 flex flex-col items-center justify-center py-2">
          <div id="db-donut-ring" style="width:196px;max-width:100%;aspect-ratio:1/1;position:relative;">
            <svg id="db-donut-svg" class="db-donut-svg" viewBox="0 0 180 180" style="display:block;width:100%;height:100%;overflow:visible;">${donutSegs}</svg>
            <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;">
              <span id="db-donut-pct" style="font-size:28px;font-weight:600;color:${progressColor};line-height:1;letter-spacing:-0.03em;transition:color 0.2s;">${progressPct}%</span>
              <span id="db-donut-lbl" style="font-size:11px;font-weight:500;color:#86868B;margin-top:4px;">Selesai</span>
            </div>
          </div>
        </div>
        <div class="mt-auto border-t border-black/[0.05] pt-3 flex flex-col gap-1">
          ${DONUT.map(item => `
          <div class="db-legend-row flex items-center justify-between text-xs px-2 py-1 rounded-md cursor-pointer transition-colors"
               data-status="${item.key}" data-val="${item.value}" data-pct="${Math.round((item.value/totalStatus)*100)}">
            <span class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full inline-block" style="background:${item.color};"></span>
              <span class="text-[#6E6E73]">${item.label}</span>
            </span>
            <span class="font-medium text-[#1D1D1F]">${item.value}</span>
          </div>`).join('')}
        </div>
      </div>

      <div class="lg:col-span-3 bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-[13px] font-semibold text-[#1D1D1F]">Distribusi Unit Kerja</h3>
          <button type="button" onclick="if(window.S){S.activeLhaNo=null;} navigate('ruang-isian')" class="text-xs font-medium text-[#0071E3] hover:underline flex items-center gap-0.5">
            <span>Daftar Temuan</span>
            <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
          </button>
        </div>
        <div class="flex flex-col gap-2 pt-1">
          ${barRows || '<div class="text-[#86868B] text-xs text-center py-8">Belum ada data</div>'}
        </div>
      </div>
    </div>

    <!-- Unit Kerja Grid -->
    <div class="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-[13px] font-semibold text-[#1D1D1F]">${isPic ? 'Unit Kerja Anda' : 'Unit Kerja'}</h3>
        <a href="#" class="text-xs text-[#0071E3] hover:underline font-medium flex items-center gap-0.5" onclick="navigate('rekap'); return false;">
          <span>Rekap</span>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
        </a>
      </div>
      <div class="db-pic-grid">${picCardsHtml}</div>
    </div>
  `);

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
