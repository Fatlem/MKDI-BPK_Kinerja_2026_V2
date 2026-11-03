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

function dbFilterBarHtml(summaryText) {
  const f = S.dbF;
  const optSumber = Object.keys(SUMBER_LABEL).map(k => `<option value="${esc(k)}" ${f.sumber === k ? 'selected' : ''}>${esc(SUMBER_LABEL[k])}</option>`).join('');
  const optJenis  = Object.keys(JENIS_AUDIT_LABEL).map(k => `<option value="${esc(k)}" ${f.jenis === k ? 'selected' : ''}>${esc(JENIS_AUDIT_LABEL[k])}</option>`).join('');
  const optTahun  = tahunOptions(S.allR).map(y => `<option value="${esc(y)}" ${f.tahun === y ? 'selected' : ''}>${esc(y)}</option>`).join('');
  const optPic    = allPicOptions().map(p => `<option value="${esc(p.username)}" ${f.pic === p.username ? 'selected' : ''}>${esc(p.nama)}</option>`).join('');
  const selCls    = 'h-8 px-2.5 text-xs bg-[#F5F5F7] border border-transparent rounded-[8px] focus:bg-white focus:border-[#0071E3] focus:outline-none text-[#1D1D1F] font-medium transition-colors';
  return `
    <div class="mb-4 bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.02)] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
      <div class="ri-filters flex flex-wrap items-center gap-2">
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
        <button type="button" onclick="dbResetFilter()" class="h-8 px-2.5 text-xs text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] rounded-[8px] transition-colors">
          Reset
        </button>
      </div>
      ${summaryText ? `<span class="text-xs text-[#86868B]">${summaryText}</span>` : ''}
    </div>`;
}

// Navigasi langsung dari Dashboard ke Detail Komponen Temuan tertentu
function openTemuanFromDashboard(noKey) {
  if (!noKey) return;
  S.activeLhaNo = String(noKey);
  navigate('ruang-isian');
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
    .catch(err => { console.error('[e-TLHP] gagal memuat/merender data:', err); showToast('Gagal memuat data dari server', 'err'); });
}

function calculateAndRenderDashboard(rows) {
  rows = dbFilteredRows(rows);
  const picList = S.picList || [];
  const uniqueNos = new Set();
  const lhaNos = new Set();
  const docGroups = {};

  let totalSelesai = 0, totalProses = 0, totalBelum = 0;
  let totalSubTemuan = 0, totalRenaksi = 0;
  let totalBukti = 0, menungguReview = 0;
  let stage1BelumRenaksi = 0, stage2MenungguBukti = 0, stage3ReviewAuditor = 0, stage4Selesai = 0;
  let targetTotal = 0, realisasiTotal = 0, selisihTotal = 0;

  const picStatsMap = {};
  picList.forEach(p => {
    picStatsMap[_picNormKey(p.username)] = {
      username: p.username,
      nama: p.nama,
      jumlah: 0,
      selesai: 0,
      proses: 0,
      belum: 0,
      progress: 0
    };
  });

  rows.forEach(r => {
    const noKey = String(r.No || '').trim();
    if (noKey) {
      uniqueNos.add(noKey);
      if (r.StatusDokumen === 'lha') lhaNos.add(noKey);
      if (!docGroups[noKey]) docGroups[noKey] = [];
      docGroups[noKey].push(r);
    }
    if (r.isSubRow || String(r.SubTemuan || '').trim()) totalSubTemuan++;

    const hasRenaksi = !!String(r.RencanaAksi || '').trim();
    const bCount     = Number(r.BuktiCount) || 0;
    const tlSt       = r.TLStatus || 'belum';
    if (hasRenaksi) totalRenaksi++;
    totalBukti += bCount;
    if (tlSt === 'menunggu' || tlSt === 'pending') menungguReview++;

    const st = statusOf(r);
    if (st.lbl === 'Selesai') {
      totalSelesai++;
      stage4Selesai++;
    } else if (st.lbl === 'Proses') {
      totalProses++;
      if (bCount > 0 || tlSt === 'menunggu' || tlSt === 'pending' || tlSt === 'ditolak') {
        stage3ReviewAuditor++;
      } else {
        stage2MenungguBukti++;
      }
    } else {
      totalBelum++;
      if (hasRenaksi) stage2MenungguBukti++;
      else stage1BelumRenaksi++;
    }

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
        else if (st.lbl === 'Proses' || hasRenaksi || bCount > 0) picStatsMap[k].proses++;
        else picStatsMap[k].belum++;
      }
    });
  });

  // Hitung metrik dokumen induk (Sumber Audit & SLA 60 Hari)
  let bpkDocs = 0, insDocs = 0;
  let slaOnTrack = 0, slaWarning = 0, slaOverdue = 0, slaDone = 0;
  let daysSum = 0, activeDocsCount = 0;
  const docSummaries = [];

  Object.keys(docGroups).forEach(noKey => {
    const items = docGroups[noKey];
    const parent = items[0];
    const isBpk = (parent.Sumber || 'bpk') === 'bpk';
    if (isBpk) bpkDocs++;
    else insDocs++;

    let dSelesai = 0, dRenaksi = 0, dBukti = 0;
    items.forEach(it => {
      if (statusOf(it).lbl === 'Selesai') dSelesai++;
      if (String(it.RencanaAksi || '').trim()) dRenaksi++;
      dBukti += (Number(it.BuktiCount) || 0);
    });
    const dTotal = items.length || 1;
    const dPct = Math.round((dSelesai / dTotal) * 100);
    const isDocDone = dSelesai === dTotal && dTotal > 0;

    const dl = getDeadlineInfo({
      TanggalInput: parent.TanggalInput,
      DeadlineDate: parent.DeadlineDate,
      TLStatus: isDocDone ? 'terverifikasi' : (dRenaksi > 0 || dBukti > 0 ? 'menunggu' : 'belum')
    });

    if (isDocDone || parent.StatusDokumen === 'lha') {
      slaDone++;
      slaOnTrack++;
    } else if (dl.isOverdue) {
      slaOverdue++;
    } else {
      slaOnTrack++;
      if (dl.daysRemaining <= 14) slaWarning++;
      daysSum += Math.max(0, dl.daysRemaining);
      activeDocsCount++;
    }

    // Tentukan tahap dokumen saat ini
    let stageLabel = 'Belum Renaksi';
    let stageTone  = 'muted';
    if (parent.StatusDokumen === 'lha') {
      stageLabel = 'LHA Resmi';
      stageTone  = 'blue';
    } else if (isDocDone) {
      stageLabel = 'Siap BATL';
      stageTone  = 'blue';
    } else if (dBukti > 0) {
      stageLabel = 'Review Bukti';
      stageTone  = 'dark';
    } else if (dRenaksi > 0) {
      stageLabel = 'Menunggu Bukti';
      stageTone  = 'dark';
    }

    docSummaries.push({
      noKey,
      parent,
      items,
      tCount: items.filter(r => !r.isSubRow && !r.ParentId).length || 1,
      sCount: items.filter(r => r.isSubRow || r.ParentId).length,
      total: dTotal,
      selesai: dSelesai,
      renaksi: dRenaksi,
      bukti: dBukti,
      pct: dPct,
      isDone: isDocDone,
      dl,
      stageLabel,
      stageTone
    });
  });

  // Urutkan daftar dokumen prioritas: yang belum selesai dulu, lalu sisa hari paling sedikit
  docSummaries.sort((a, b) => {
    if (a.isDone !== b.isDone) return a.isDone ? 1 : -1;
    return (a.dl.daysRemaining || 0) - (b.dl.daysRemaining || 0);
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
    renaksiPct: total > 0 ? Math.round((totalRenaksi / total) * 100) : 0,
    belumRenaksi: Math.max(0, total - totalRenaksi),
    totalBukti,
    menungguReview,
    picMengisi: picMengisiCount,
    totalPic: picList.length,
    progressKeseluruhan: total > 0 ? Math.round((totalSelesai / total) * 100) : 0,
    status: { selesai: totalSelesai, proses: totalProses, belum: totalBelum },
    stages: {
      belumRenaksi: stage1BelumRenaksi,
      menungguBukti: stage2MenungguBukti,
      reviewAuditor: stage3ReviewAuditor,
      selesai: stage4Selesai
    },
    sumberCount: { bpk: bpkDocs, inspektorat: insDocs },
    sla: {
      onTrack: slaOnTrack,
      warning: slaWarning,
      overdue: slaOverdue,
      done: slaDone,
      avgDaysLeft: activeDocsCount > 0 ? Math.round(daysSum / activeDocsCount) : null
    },
    financial: {
      target: targetTotal,
      realisasi: realisasiTotal,
      selisih: selisihTotal,
      pct: targetTotal > 0 ? Math.min(100, Math.round((realisasiTotal / targetTotal) * 100)) : 0
    },
    picStats: picStatsArray,
    docSummaries
  });
}

function renderDashboard(d) {
  if (!d) return;
  const { selesai, proses, belum } = d.status;
  const totalStatus = selesai + proses + belum || 1;
  const progressPct = Math.round((selesai / totalStatus) * 100);
  const lhpCount    = Math.max(0, (d.totalTemuan || 0) - (d.totalLha || 0));
  const fin         = d.financial || { target: 0, realisasi: 0, selisih: 0, pct: 0 };

  // 1. Urutkan Unit Kerja berdasarkan beban terbanyak -> paling sedikit (piramida bersih)
  const sortedPics = (d.picStats || []).slice().sort((a, b) => {
    if (b.jumlah !== a.jumlah) return b.jumlah - a.jumlah;
    return b.selesai - a.selesai;
  });
  const barMax = sortedPics.reduce((m, p) => Math.max(m, p.jumlah), 0) || 1;

  // Stacked Horizontal Bar: panjang total proporsional terhadap beban (barMax),
  // isi di dalamnya terbagi menjadi Selesai (#0071E3), Proses (#86868B), Belum (#D2D2D7)
  const barRows = sortedPics.map((p) => {
    const label       = _picShortLabel(p);
    const hasVal      = p.jumlah > 0;
    const wTotalPct   = hasVal ? Math.max(6, Math.round((p.jumlah / barMax) * 100)) : 0;
    const pSelesaiPct = hasVal ? Math.round((p.selesai / p.jumlah) * 100) : 0;
    const pProsesPct  = hasVal ? Math.round((p.proses / p.jumlah) * 100) : 0;
    const pBelumPct   = hasVal ? Math.max(0, 100 - pSelesaiPct - pProsesPct) : 0;

    return `
      <div class="db-bar-row group" data-pct="${wTotalPct}"
           onclick="if(window.S){S.activeLhaNo=null;} navigate('ruang-isian','${esc(jsq(p.username))}')"
           style="display:flex;align-items:center;gap:10px;font-size:12px;border-radius:8px;padding:4.5px 8px;cursor:pointer;position:relative;transition:background 0.15s;">
        <span style="width:46px;font-weight:600;color:${hasVal ? '#1D1D1F' : '#86868B'};flex-shrink:0;" class="group-hover:text-[#0071E3] transition-colors">${esc(label)}</span>
        <div style="flex:1;background:#F5F5F7;border-radius:999px;height:10px;overflow:hidden;position:relative;">
          ${hasVal ? `
          <div class="db-bar-fill" style="width:0%;height:100%;border-radius:999px;overflow:hidden;display:flex;transition:width 0.55s cubic-bezier(.4,0,.2,1);">
            ${pSelesaiPct > 0 ? `<div style="width:${pSelesaiPct}%;height:100%;background:#0071E3;"></div>` : ''}
            ${pProsesPct > 0 ? `<div style="width:${pProsesPct}%;height:100%;background:#86868B;"></div>` : ''}
            ${pBelumPct > 0 ? `<div style="width:${pBelumPct}%;height:100%;background:#D2D2D7;"></div>` : ''}
          </div>` : ''}
        </div>
        <div style="width:74px;text-align:right;flex-shrink:0;" class="flex items-center justify-end gap-1.5">
          <span style="font-weight:${hasVal ? '600' : '400'};color:${hasVal ? '#1D1D1F' : '#86868B'};">${p.jumlah}</span>
          <span class="text-[10.5px] text-[#86868B]">(${p.selesai}/${p.jumlah})</span>
        </div>
        <div class="db-bar-tooltip" style="display:none;position:absolute;left:54px;top:-34px;background:rgba(29,29,31,0.94);color:#fff;font-size:11px;font-weight:500;padding:4px 10px;border-radius:8px;white-space:nowrap;pointer-events:none;z-index:20;box-shadow:0 4px 12px rgba(0,0,0,0.16);">
          ${esc(p.nama)} · <b>${p.jumlah} rincian</b> (${p.selesai} selesai, ${p.proses} proses, ${p.belum} belum)
        </div>
      </div>`;
  }).join('');

  // 2. Donut SVG + 4-Stage Pipeline Breakdown
  const progressColor = '#1D1D1F';
  const DONUT = [
    { key: 'selesai', label: 'Selesai', value: selesai, color: '#0071E3' },
    { key: 'proses',  label: 'Proses',  value: proses,  color: '#86868B' },
    { key: 'belum',   label: 'Belum',   value: belum,   color: '#E5E5EA' },
  ];
  const _donutR = 62, _donutC = 2 * Math.PI * _donutR;
  const _donutOn = DONUT.filter(x => x.value > 0);
  const _donutGap = _donutOn.length > 1 ? 2.5 : 0;
  let _donutAcc = 0;
  const donutSegs = _donutOn.length
    ? DONUT.map(x => {
        if (!x.value) return '';
        const len  = (x.value / totalStatus) * _donutC;
        const dash = Math.max(len - _donutGap, 0.5);
        const el = `<circle class="db-donut-seg" data-status="${x.key}" cx="80" cy="80" r="${_donutR}" fill="none"
            stroke="${x.color}" stroke-width="18" stroke-dasharray="${dash} ${_donutC - dash}"
            stroke-dashoffset="${-_donutAcc}" transform="rotate(-90 80 80)"/>`;
        _donutAcc += len;
        return el;
      }).join('')
    : `<circle cx="80" cy="80" r="${_donutR}" fill="none" stroke="#E5E5EA" stroke-width="18"/>`;

  const stg = d.stages || { belumRenaksi: 0, menungguBukti: 0, reviewAuditor: 0, selesai: 0 };
  const pipelineRows = [
    { label: '1. Belum Isi Renaksi',      actor: 'Satker',  val: stg.belumRenaksi,  color: '#D2D2D7' },
    { label: '2. Menunggu Unggah Bukti',  actor: 'Satker',  val: stg.menungguBukti, color: '#86868B' },
    { label: '3. Review Bukti Auditor',   actor: 'Auditor', val: stg.reviewAuditor, color: '#1D1D1F' },
    { label: '4. Disetujui / Tuntas',     actor: 'Selesai', val: stg.selesai,       color: '#0071E3' },
  ].map(s => {
    const pct = Math.round((s.val / totalStatus) * 100);
    return `
      <div class="py-1.5">
        <div class="flex items-center justify-between text-xs mb-1">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full shrink-0" style="background:${s.color};"></span>
            <span class="text-[#1D1D1F] font-medium">${s.label}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[11px] text-[#86868B]">${s.actor}</span>
            <span class="font-semibold text-[#1D1D1F] w-5 text-right">${s.val}</span>
          </div>
        </div>
        <div class="w-full bg-[#F5F5F7] rounded-full h-1 overflow-hidden">
          <div class="h-1 rounded-full transition-all duration-500" style="width:${pct}%;background:${s.color};"></div>
        </div>
      </div>`;
  }).join('');

  // 3. Tabel Pantauan Prioritas & Batas Waktu 60 Hari (Bawah)
  const priorityDocs = (d.docSummaries || []).slice(0, 6);
  const priorityRowsHtml = priorityDocs.length
    ? priorityDocs.map(doc => {
        const p = doc.parent;
        const pics = groupPicShort(doc.items).join(', ') || '—';
        const dlText = dlLive(doc.dl, { start: p.TanggalInput, done: doc.isDone });

        const stagePill = doc.stageTone === 'blue'
          ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#0071E3]/10 text-[#0071E3]"><span class="w-1.5 h-1.5 rounded-full bg-[#0071E3]"></span>${doc.stageLabel}</span>`
          : doc.stageTone === 'dark'
            ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F5F5F7] text-[#1D1D1F]"><span class="w-1.5 h-1.5 rounded-full bg-[#86868B]"></span>${doc.stageLabel}</span>`
            : `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F5F5F7] text-[#86868B]"><span class="w-1.5 h-1.5 rounded-full bg-[#D2D2D7]"></span>${doc.stageLabel}</span>`;

        return `
          <tr onclick="openTemuanFromDashboard('${esc(jsq(doc.noKey))}')" class="hover:bg-[#F5F5F7]/70 transition-colors cursor-pointer group">
            <td class="py-3 px-4 align-top">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="font-mono text-xs font-semibold text-[#1D1D1F] group-hover:text-[#0071E3] transition-colors whitespace-nowrap">${esc(doc.noKey)}</span>
                ${dokumenBadge(p)}
              </div>
              ${p.NoLha ? `<div class="font-mono text-[11px] text-[#0071E3] font-semibold mt-0.5 truncate" title="${esc(p.NoLha)}">${esc(p.NoLha)}</div>` : ''}
              <div class="text-[11px] text-[#86868B] mt-0.5 truncate" title="${(p.Sumber || 'bpk') === 'bpk' ? 'BPK RI' : 'Inspektorat'} · ${esc(jenisAuditLabel(p) || 'Audit Kinerja')}">
                ${(p.Sumber || 'bpk') === 'bpk' ? 'BPK RI' : 'Inspektorat'} · ${esc(jenisAuditLabel(p) || 'Audit Kinerja')}
              </div>
            </td>
            <td class="py-3 px-4">
              <div class="text-xs font-semibold text-[#1D1D1F] line-clamp-2 leading-relaxed" title="${esc(p.Temuan || '')}">${esc(p.Temuan || '—')}</div>
              <div class="text-[11px] text-[#86868B] mt-1">${doc.tCount} temuan${doc.sCount > 0 ? ` · ${doc.sCount} sub temuan` : ''} · ${doc.total} item · ${doc.renaksi}/${doc.total} Renaksi · ${doc.bukti} bukti</div>
            </td>
            <td class="py-3 px-4">
              <div class="text-xs text-[#475569] line-clamp-2 leading-snug" title="${esc(pics)}">${esc(pics)}</div>
            </td>
            <td class="py-3 px-4 whitespace-nowrap">${stagePill}</td>
            <td class="py-3 px-4 whitespace-nowrap">
              ${dlText}
              <div class="text-[11px] text-[#86868B]">${esc(doc.dl.deadlineFormatted)}</div>
            </td>
            <td class="py-3 px-4 whitespace-nowrap text-right">
              <div class="inline-flex items-center gap-3">
                <div class="w-20 shrink-0 min-w-[80px]">
                  <div class="flex items-center justify-between text-[11px] mb-1 gap-2">
                    <span class="text-[#86868B] shrink-0 font-medium">${doc.selesai}/${doc.total}</span>
                    <span class="font-semibold text-[#1D1D1F] shrink-0">${doc.pct}%</span>
                  </div>
                  <div class="w-full bg-[#F5F5F7] rounded-full h-1.5 overflow-hidden">
                    <div class="bg-[#0071E3] h-1.5 rounded-full" style="width:${doc.pct}%"></div>
                  </div>
                </div>
                <span class="inline-flex items-center gap-0.5 text-xs font-medium text-[#0071E3] group-hover:translate-x-0.5 transition-transform shrink-0">
                  <span>Buka</span>
                  <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                </span>
              </div>
            </td>
          </tr>`;
      }).join('')
    : `<tr><td colspan="6" class="py-10 text-center text-xs text-[#86868B]">Belum ada dokumen temuan</td></tr>`;

  // SLA Card helper
  const slaHasOverdue = d.sla.overdue > 0;
  const slaNearest = dlNearest((d.docSummaries || []).map(doc => ({ info: doc.dl, start: doc.parent.TanggalInput, done: doc.isDone, label: doc.noKey })));
  const slaNearestHtml = slaNearest
    ? `<div class="mt-3 flex items-center justify-between gap-2 text-[11px]"><span class="truncate text-[#6E6E73]" title="${esc(slaNearest.label)}">Terdekat · ${esc(slaNearest.label)}</span>${dlLive(slaNearest.info, { start: slaNearest.start, done: false })}</div>`
    : '';
  const slaSubText = fin.target > 0
    ? `Kas: Rp ${formatIDR(fin.realisasi)} / Rp ${formatIDR(fin.target)}`
    : (d.sla.avgDaysLeft !== null ? `Rata-rata sisa ${d.sla.avgDaysLeft} hari kerja` : 'Seluruh dokumen tuntas');

  setBody(`
    ${dbFilterBarHtml(`${d.totalTemuan} dokumen · ${d.totalTindakLanjut} rekomendasi`)}

    <!-- 4 Informative Apple BAN Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <!-- BAN 1: Dokumen Audit -->
      <div class="bg-white rounded-2xl p-5 border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="inline-flex items-center gap-1.5 text-xs font-medium text-[#6E6E73]"><i data-lucide="file-text" class="size-3.5 shrink-0"></i>Dokumen Audit</span>
          <span class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#F5F5F7] text-[#1D1D1F]">${lhpCount} LHP · ${d.totalLha || 0} LHA</span>
        </div>
        <div class="mt-3">
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-semibold text-[#1D1D1F] tracking-tight">${d.totalTemuan || 0}</span>
            <span class="text-xs text-[#86868B]">dokumen</span>
          </div>
          <div class="mt-3 pt-2.5 border-t border-black/[0.05] flex items-center justify-between text-xs text-[#6E6E73]">
            <span>BPK RI: <b class="text-[#1D1D1F]">${d.sumberCount.bpk}</b></span>
            <span>Inspektorat: <b class="text-[#1D1D1F]">${d.sumberCount.inspektorat}</b></span>
          </div>
        </div>
      </div>

      <!-- BAN 2: Kesiapan Rencana Aksi (Renaksi) -->
      <div class="bg-white rounded-2xl p-5 border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="inline-flex items-center gap-1.5 text-xs font-medium text-[#6E6E73]"><i data-lucide="list-checks" class="size-3.5 shrink-0"></i>Kesiapan Renaksi</span>
          <span class="text-xs font-semibold text-[#1D1D1F]">${d.totalRenaksi}/${d.totalTindakLanjut || 0}</span>
        </div>
        <div class="mt-3">
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-semibold text-[#1D1D1F] tracking-tight">${d.renaksiPct}%</span>
            <span class="text-xs text-[#86868B]">tersusun</span>
          </div>
          <div class="w-full bg-[#F5F5F7] rounded-full h-1.5 overflow-hidden mt-2.5">
            <div class="bg-[#1D1D1F] h-1.5 rounded-full transition-all duration-500" style="width:${d.renaksiPct}%"></div>
          </div>
          <div class="mt-2 text-[11px] text-[#86868B] flex items-center justify-between">
            <span>${d.belumRenaksi > 0 ? `${d.belumRenaksi} belum diisi Satker` : 'Semua Renaksi terisi'}</span>
            <span>${d.picMengisi}/${d.totalPic} Unit</span>
          </div>
        </div>
      </div>

      <!-- BAN 3: Penyelesaian & Verifikasi Bukti -->
      <div class="bg-white rounded-2xl p-5 border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="inline-flex items-center gap-1.5 text-xs font-medium text-[#6E6E73]"><i data-lucide="shield-check" class="size-3.5 shrink-0"></i>Penyelesaian</span>
          <span class="text-xs font-semibold text-[#0071E3]">${selesai}/${d.totalTindakLanjut || 0}</span>
        </div>
        <div class="mt-3">
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-semibold text-[#0071E3] tracking-tight">${d.progressKeseluruhan || 0}%</span>
            <span class="text-xs text-[#86868B]">selesai</span>
          </div>
          <div class="w-full bg-[#F5F5F7] rounded-full h-1.5 overflow-hidden mt-2.5">
            <div class="bg-[#0071E3] h-1.5 rounded-full transition-all duration-700" style="width:${d.progressKeseluruhan || 0}%"></div>
          </div>
          <div class="mt-2 text-[11px] text-[#86868B] flex items-center justify-between">
            <span>${d.totalBukti} berkas bukti</span>
            <span>${d.menungguReview > 0 ? `${d.menungguReview} menunggu review` : `${proses} dalam proses`}</span>
          </div>
        </div>
      </div>

      <!-- BAN 4: Kepatuhan Batas Waktu 60 Hari (SLA) & Kas -->
      <div class="bg-white rounded-2xl p-5 border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="inline-flex items-center gap-1.5 text-xs font-medium text-[#6E6E73]"><i data-lucide="timer" class="size-3.5 shrink-0"></i>Batas Waktu (60 Hari)</span>
          <span class="text-[11px] font-medium px-2 py-0.5 rounded-full ${slaHasOverdue ? 'bg-[#FFF2F2] text-[#D70015]' : 'bg-[#F5F5F7] text-[#6E6E73]'}">${slaHasOverdue ? `${d.sla.overdue} Terlambat` : 'Sesuai SLA'}</span>
        </div>
        <div class="mt-3">
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-semibold ${slaHasOverdue ? 'text-[#D70015]' : 'text-[#1D1D1F]'} tracking-tight">${d.sla.onTrack}/${d.totalTemuan || 0}</span>
            <span class="text-xs text-[#86868B]">dalam tenggang</span>
          </div>
          ${slaNearestHtml}
          <div class="mt-3 pt-2.5 border-t border-black/[0.05] text-[11px] text-[#6E6E73] truncate">
            ${esc(slaSubText)}
          </div>
        </div>
      </div>
    </div>

    <!-- Middle Bento Section: 4-Stage Pipeline + Sorted Stacked Unit Bar -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
      <!-- Left: Donut + 4-Stage Probis Pipeline -->
      <div class="lg:col-span-2 bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-5 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-[13px] font-semibold text-[#1D1D1F]">Tahapan Tindak Lanjut</h3>
            <span class="text-[11px] text-[#86868B]">${d.totalTindakLanjut || 0} rekomendasi</span>
          </div>

          <div class="flex items-center gap-5 py-2">
            <div id="db-donut-ring" style="width:136px;flex-shrink:0;aspect-ratio:1/1;position:relative;">
              <svg id="db-donut-svg" class="db-donut-svg" viewBox="0 0 160 160" style="display:block;width:100%;height:100%;overflow:visible;">${donutSegs}</svg>
              <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;">
                <span id="db-donut-pct" style="font-size:22px;font-weight:600;color:${progressColor};line-height:1;letter-spacing:-0.03em;transition:color 0.2s;">${progressPct}%</span>
                <span id="db-donut-lbl" style="font-size:10px;font-weight:500;color:#86868B;margin-top:3px;">Selesai</span>
              </div>
            </div>

            <div class="flex-1 space-y-1.5">
              ${DONUT.map(item => `
              <div class="db-legend-row flex items-center justify-between text-xs px-2 py-1 rounded-md cursor-pointer transition-colors"
                   data-status="${item.key}" data-val="${item.value}" data-pct="${Math.round((item.value/totalStatus)*100)}">
                <span class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full inline-block" style="background:${item.color};"></span>
                  <span class="text-[#6E6E73]">${item.label}</span>
                </span>
                <span class="font-semibold text-[#1D1D1F]">${item.value}</span>
              </div>`).join('')}
            </div>
          </div>
        </div>

        <div class="mt-3 pt-3 border-t border-black/[0.06] space-y-1">
          <div class="text-[11px] font-medium text-[#86868B] mb-1">Rincian Posisi Proses Bisnis</div>
          ${pipelineRows}
        </div>
      </div>

      <!-- Right: Beban & Progres Unit Kerja (Sorted Stacked Bar) -->
      <div class="lg:col-span-3 bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-5 flex flex-col justify-between">
        <div>
          <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h3 class="text-[13px] font-semibold text-[#1D1D1F]">Beban &amp; Progres Unit Kerja</h3>
              <p class="text-[11px] text-[#86868B]">Diurutkan berdasarkan jumlah rekomendasi · Klik unit untuk membuka</p>
            </div>
            <div class="flex items-center gap-3 text-[11px] text-[#6E6E73]">
              <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#0071E3]"></span>Selesai</span>
              <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#86868B]"></span>Proses</span>
              <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#D2D2D7]"></span>Belum</span>
            </div>
          </div>

          <div class="flex flex-col gap-1.5 pt-1">
            ${barRows || '<div class="text-[#86868B] text-xs text-center py-8">Belum ada data</div>'}
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Section: Pantauan Prioritas & Batas Waktu 60 Hari -->
    <div class="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
      <div class="px-5 py-4 border-b border-black/[0.05] flex items-center justify-between">
        <div>
          <h3 class="text-[13px] font-semibold text-[#1D1D1F]">Pantauan Prioritas &amp; Batas Waktu 60 Hari</h3>
          <p class="text-[11px] text-[#86868B]">Klik baris temuan untuk langsung mengisi Rencana Aksi, Bukti, atau Evaluasi</p>
        </div>
        <button type="button" onclick="if(window.S){S.activeLhaNo=null;} navigate('ruang-isian')" class="text-xs font-medium text-[#0071E3] hover:underline flex items-center gap-0.5">
          <span>Semua Temuan</span>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="rt-cards rt-dash w-full text-left border-collapse min-w-[960px] table-fixed">
          <thead>
            <tr class="border-b border-black/[0.05] text-[11px] text-[#86868B]">
              <th class="py-2.5 px-4 font-medium w-[14%]">Dokumen</th>
              <th class="py-2.5 px-4 font-medium w-[27%]">Temuan Utama</th>
              <th class="py-2.5 px-4 font-medium w-[15%]">Unit Kerja</th>
              <th class="py-2.5 px-4 font-medium w-[12%]">Tahap Saat Ini</th>
              <th class="py-2.5 px-4 font-medium w-[18%]">Tenggat 60 Hari</th>
              <th class="py-2.5 px-4 text-right font-medium w-[14%]">Progres</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-black/[0.04]">${priorityRowsHtml}</tbody>
        </table>
      </div>
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

      const tip = row.querySelector('.db-bar-tooltip');
      row.addEventListener('mouseenter', () => {
        row.style.background = '#F5F5F7';
        if (tip) tip.style.display = 'block';
      });
      row.addEventListener('mouseleave', () => {
        row.style.background = '';
        if (tip) tip.style.display = 'none';
      });
    });
  });

  // ── Donut interaktif: hover segmen / legenda ──
  const donutSvgEl = document.getElementById('db-donut-svg');
  const donutPctEl = document.getElementById('db-donut-pct');
  const donutLblEl = document.getElementById('db-donut-lbl');

  if (donutSvgEl && donutPctEl && donutLblEl) {
    let tip = document.getElementById('db-donut-tip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'db-donut-tip';
      tip.style.cssText = 'position:fixed;display:none;z-index:9999;pointer-events:none;background:rgba(29,29,31,.94);color:#fff;font-size:12px;padding:8px 12px;border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,.22);';
      document.body.appendChild(tip);
    }
    const info = {};
    DONUT.forEach(x => { info[x.key] = x; });

    function setDonutActive(key) {
      const x = key ? info[key] : null;
      donutSvgEl.classList.toggle('has-hover', !!x);
      donutSvgEl.querySelectorAll('.db-donut-seg').forEach(sg => sg.classList.toggle('active', sg.dataset.status === key));
      document.querySelectorAll('.db-legend-row').forEach(r => { r.style.background = r.dataset.status === key ? '#F5F5F7' : ''; });
      donutPctEl.style.color   = x ? x.color : progressColor;
      donutPctEl.textContent   = x ? x.value : progressPct + '%';
      donutLblEl.textContent   = x ? x.label : 'Selesai';
    }

    function showDonutTip(key, e) {
      const x = info[key];
      if (!x) return;
      const pct = Math.round((x.value / totalStatus) * 100);
      tip.innerHTML =
        `<div style="font-weight:600;margin-bottom:3px;">${x.label}</div>` +
        `<div style="display:flex;align-items:center;gap:6px;">` +
        `<span style="width:8px;height:8px;border-radius:99px;background:${x.color};display:inline-block;"></span>` +
        `<b>${x.value}</b><span style="opacity:.75;">(${pct}%)</span></div>`;
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
