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
];

function _picShortLabel(p) {
  const nama = String(p.nama || p.username || '').toLowerCase();
  for (const m of PIC_LABEL_MAP) {
    if (nama.includes(m.key)) return m.label;
  }
  // fallback: first word uppercase, max 6 chars
  const words = (p.username || p.nama || '').split(' ');
  return words[0].substring(0, 6).toUpperCase();
}

function renderDashboard(d) {
  if (!d) return;
  const isPic = isPicUser();
  let picGrid = d.picStats || [];
  if (isPic) picGrid = picGrid.filter(p => p.username === S.user.username);

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

  // CSS doughnut — build conic-gradient from status data
  const { selesai, proses, belum } = d.status;
  const totalStatus = selesai + proses + belum || 1;
  const pctSelesai  = (selesai / totalStatus) * 360;
  const pctProses   = (proses  / totalStatus) * 360;
  const progressPct = Math.round((selesai / totalStatus) * 100);
  const conicGrad   = `conic-gradient(
    #0f172a 0deg ${pctSelesai}deg,
    #1e3a8a ${pctSelesai}deg ${pctSelesai + pctProses}deg,
    #e2e8f0 ${pctSelesai + pctProses}deg 360deg
  )`;

  // PIC cards HTML
  const picCardsHtml = picGrid.length
    ? picGrid.map((p, i) => {
        const progressPctCard = p.progress || 0;
        const progressColor   = progressPctCard >= 100 ? '#16a34a' : progressPctCard > 0 ? '#2563eb' : '#cbd5e1';
        const progressTextColor = progressPctCard >= 100 ? 'color:#16a34a;' : 'color:#dc2626;';
        return `
          <div class="db-pic-card" onclick="navigate('ruang-isian','${esc(jsq(p.username))}')">
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
          <select class="select-custom" style="padding:6px 10px;font-size:14px;">
            <option>Tahun 2026</option>
          </select>
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
          <div id="db-donut-ring" style="width:180px;height:180px;border-radius:50%;background:${conicGrad};display:flex;align-items:center;justify-content:center;position:relative;cursor:pointer;transition:transform 0.2s,background 0.3s;">
            <div style="width:122px;height:122px;border-radius:50%;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;">
              <span id="db-donut-pct" style="font-size:26px;font-weight:800;color:#0f172a;line-height:1;transition:color 0.2s;">${progressPct}%</span>
              <span id="db-donut-lbl" style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">Progress Selesai</span>
            </div>
          </div>
        </div>
        <!-- Legend — pushed to bottom -->
        <div style="margin-top:auto;border-top:1px solid #f1f5f9;padding-top:12px;display:flex;flex-direction:column;gap:6px;">
          <div class="db-legend-row" data-status="selesai" data-val="${selesai}" data-pct="${Math.round((selesai/totalStatus)*100)}"
               style="display:flex;align-items:center;justify-content:space-between;font-size:12px;font-weight:600;padding:4px 6px;border-radius:6px;cursor:pointer;transition:background 0.15s;">
            <span style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:50%;background:#0f172a;display:inline-block;"></span><span style="color:#334155;">Selesai</span></span>
            <b style="color:#0f172a;">${selesai}</b>
          </div>
          <div class="db-legend-row" data-status="proses" data-val="${proses}" data-pct="${Math.round((proses/totalStatus)*100)}"
               style="display:flex;align-items:center;justify-content:space-between;font-size:12px;font-weight:600;padding:4px 6px;border-radius:6px;cursor:pointer;transition:background 0.15s;">
            <span style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:50%;background:#1e3a8a;display:inline-block;"></span><span style="color:#334155;">Proses</span></span>
            <b style="color:#0f172a;">${proses}</b>
          </div>
          <div class="db-legend-row" data-status="belum" data-val="${belum}" data-pct="${Math.round((belum/totalStatus)*100)}"
               style="display:flex;align-items:center;justify-content:space-between;font-size:12px;font-weight:600;padding:4px 6px;border-radius:6px;cursor:pointer;transition:background 0.15s;">
            <span style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:50%;background:#cbd5e1;display:inline-block;"></span><span style="color:#334155;">Belum</span></span>
            <b style="color:#0f172a;">${belum}</b>
          </div>
        </div>
      </div>

    </div>

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

  // ── Donut legend hover: ubah warna ring + update center text ──
  const donutPctEl  = document.getElementById('db-donut-pct');
  const donutLblEl  = document.getElementById('db-donut-lbl');
  const donutRing   = document.getElementById('db-donut-ring');

  // Warna solid per status untuk highlight
  const statusColors = {
    selesai: '#0f172a',  // navy
    proses:  '#2563eb',  // biru
    belum:   '#cbd5e1',  // abu
  };
  const statusLabels = { selesai: 'Selesai', proses: 'Proses', belum: 'Belum' };

  if (donutPctEl && donutLblEl && donutRing) {
    document.querySelectorAll('.db-legend-row').forEach(row => {
      const status = row.dataset.status;
      const val    = row.dataset.val;
      const color  = statusColors[status] || '#334155';

      row.addEventListener('mouseenter', () => {
        row.style.background = '#f1f5f9';
        // Ring berubah jadi solid satu warna sesuai status
        donutRing.style.background = `conic-gradient(${color} 0deg 360deg)`;
        donutRing.style.transform  = 'scale(1.06)';
        // Center text update
        donutPctEl.style.color     = color;
        donutPctEl.textContent     = val;
        donutLblEl.textContent     = statusLabels[status] || status;
      });
      row.addEventListener('mouseleave', () => {
        row.style.background       = '';
        // Kembalikan ke conic-gradient asli berdasarkan data
        donutRing.style.background = conicGrad;
        donutRing.style.transform  = '';
        donutPctEl.style.color     = '#0f172a';
        donutPctEl.textContent     = progressPct + '%';
        donutLblEl.textContent     = 'Progress Selesai';
      });
    });

    // Hover langsung di ring → scale saja, tidak ubah warna
    donutRing.addEventListener('mouseenter', () => {
      if (!document.querySelector('.db-legend-row:hover')) {
        donutRing.style.transform = 'scale(1.04)';
      }
    });
    donutRing.addEventListener('mouseleave', () => {
      if (!document.querySelector('.db-legend-row:hover')) {
        donutRing.style.transform = '';
      }
    });
  }
}
