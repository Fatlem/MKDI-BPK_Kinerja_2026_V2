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

function renderDashboard(d) {
  if (!d) return;
  const isPic = isPicUser();
  let picGrid = d.picStats || [];
  if (isPic) picGrid = picGrid.filter(p => p.username === S.user.username);

  const statCards = [
    { label: 'TOTAL TEMUAN', value: d.totalTemuan || 0, icon: 'search', cls: 'blue' },
    { label: 'TOTAL TINDAK LANJUT', value: d.totalTindakLanjut || 0, icon: 'file-text', cls: 'purple' },
    { label: 'PIC SUDAH MENGISI', value: `${d.picMengisi || 0}/${d.totalPic || 0}`, icon: 'user-check', cls: 'green' },
    { label: 'PROGRESS KESELURUHAN', value: `${d.progressKeseluruhan || 0}%`, icon: 'trending-up', cls: 'orange' },
  ];

  setBody(`
    <div class="stat-grid">
      ${statCards.map(c => `
        <div class="stat-card">
          <div class="stat-card-header">
            <div class="stat-icon-wrap ${c.cls}"><i data-lucide="${c.icon}"></i></div>
            <span class="stat-trend up">↗ 0%</span>
          </div>
          <div class="stat-value">${c.value}</div>
          <div class="stat-label">${c.label}</div>
        </div>
      `).join('')}
    </div>

    <div class="chart-grid">
      <div class="chart-card">
        <div class="chart-card-header">
          <div class="chart-card-title"><i data-lucide="bar-chart-2"></i> Jumlah Tindak Lanjut per PIC</div>
          <select class="select-custom" style="padding:4px 8px;font-size:11.5px;">
            <option>Tahun 2026</option>
          </select>
        </div>
        <div style="height:210px;position:relative"><canvas id="chart-bar"></canvas></div>
      </div>

      <div class="chart-card">
        <div class="chart-card-header">
          <div class="chart-card-title"><i data-lucide="pie-chart"></i> Status Tindak Lanjut</div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;height:210px;">
          <div style="width:55%;height:100%;position:relative;"><canvas id="chart-donut"></canvas></div>
          <div style="width:45%;display:flex;flex-direction:column;gap:10px;font-size:12px;">
            <div style="display:flex;justify-content:space-between;padding-bottom:6px;border-bottom:1px solid #f1f5f9;">
              <span style="display:flex;align-items:center;gap:6px;"><span style="width:8px;height:8px;border-radius:50%;background:#10b981;"></span> Selesai</span>
              <b>${d.status.selesai}</b>
            </div>
            <div style="display:flex;justify-content:space-between;padding-bottom:6px;border-bottom:1px solid #f1f5f9;">
              <span style="display:flex;align-items:center;gap:6px;"><span style="width:8px;height:8px;border-radius:50%;background:#f59e0b;"></span> Proses</span>
              <b>${d.status.proses}</b>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="display:flex;align-items:center;gap:6px;"><span style="width:8px;height:8px;border-radius:50%;background:#cbd5e1;"></span> Belum</span>
              <b>${d.status.belum}</b>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
      <h3 style="font-size:14.5px;font-weight:800;display:flex;align-items:center;gap:6px;">
        <i data-lucide="users" style="width:18px;color:#2563eb;"></i> ${isPic ? 'Informasi PIC Anda' : 'Daftar Progress PIC'}
      </h3>
      <a href="#" style="font-size:12px;color:#2563eb;font-weight:700;" onclick="navigate('rekap'); return false;">Lihat Semua &gt;</a>
    </div>

    <div class="pic-grid" id="pic-grid"></div>
  `);

  const grid = document.getElementById('pic-grid');
  grid.innerHTML = picGrid.map((p, i) => {
    const clr = picColor(i);
    const init = (p.nama || p.username || '?').charAt(0).toUpperCase();
    return `
      <div class="pic-card" style="border-left-color:${clr}" onclick="navigate('ruang-isian','${esc(jsq(p.username))}')">
        <div class="pic-card-top">
          <div class="pic-avatar" style="background:${clr}">${init}</div>
          <div>
            <div class="pic-name" title="${esc(p.nama)}">${esc(p.nama)}</div>
            <div class="pic-username">@${esc(p.username)}</div>
          </div>
          <i data-lucide="chevron-right" class="pic-chevron"></i>
        </div>
        <div class="pic-footer">
          <span class="pic-tl-label"><i data-lucide="file-text"></i> Tindak Lanjut</span>
          <span class="pic-progress-val" style="color:${clr}">${p.progress}%</span>
        </div>
      </div>`;
  }).join('') || '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">Belum ada data PIC</div>';

  refreshIcons();

  if (document.getElementById('chart-bar')) {
    const bctx = document.getElementById('chart-bar').getContext('2d');
    if (chartBar) chartBar.destroy();
    chartBar = new Chart(bctx, {
      type: 'bar',
      data: {
        labels: (d.picStats || []).map(p => p.nama.length > 14 ? p.nama.substring(0, 12) + '...' : p.nama),
        datasets: [{
          label: 'Tindak Lanjut',
          data: (d.picStats || []).map(p => p.jumlah),
          backgroundColor: '#2563eb',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { font: { size: 9.5 }, maxRotation: 20 } },
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  }

  if (document.getElementById('chart-donut')) {
    const dctx = document.getElementById('chart-donut').getContext('2d');
    if (chartDonut) chartDonut.destroy();
    chartDonut = new Chart(dctx, {
      type: 'doughnut',
      data: {
        labels: ['Selesai', 'Proses', 'Belum'],
        datasets: [{
          data: [d.status.selesai, d.status.proses, d.status.belum || (d.totalTindakLanjut === 0 ? 1 : 0)],
          backgroundColor: ['#10b981', '#f59e0b', '#e2e8f0']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: { legend: { display: false } }
      }
    });
  }
}
