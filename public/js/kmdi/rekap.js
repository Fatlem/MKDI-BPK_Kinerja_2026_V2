function loadRekap() {
  document.getElementById('hdr-title').textContent = 'Rekap & Laporan';
  document.getElementById('hdr-sub').textContent   = 'Tinjauan lengkap data tindak lanjut BPK RI';
  setBody(loadingHtml());
  refreshIcons();

  apiFetch('/api/temuan')
    .then(rows => {
      S.allR = scopeRows(rows);
      renderRekap(S.allR);
    })
    .catch(() => showToast('Gagal memuat data dari server', 'err'));
}

function renderRekap(rows) {
  const picOpts = allPicOptions().map(p => `<option value="${esc(p.username)}">${esc(p.nama)}</option>`).join('');

  setBody(`
    <div class="toolbar-wrap">
      <select class="select-custom" id="flt-pic" style="width:240px;" onchange="filterRekap()"><option value="">Semua PIC</option>${picOpts}</select>
      <input class="input-search" id="flt-q" placeholder="Cari data temuan..." oninput="filterRekap()" style="width:240px">
      <span style="font-size:12px;color:var(--text-muted)" id="flt-count"></span>
      <button class="btn-action-sec" style="margin-left:auto" onclick="exportExcel()"><i data-lucide="download" style="width:16px"></i> Ekspor Excel</button>
    </div>

    <div class="entry-card" style="padding:16px;overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#f8fafc;text-align:left;color:#64748b;font-size:11px;font-weight:800;border-bottom:1px solid #e2e8f0;">
            <th style="padding:10px;">NO</th>
            <th style="padding:10px;">PIC</th>
            <th style="padding:10px;">TEMUAN</th>
            <th style="padding:10px;">RINCIAN</th>
            <th style="padding:10px;text-align:right;">AKSI</th>
          </tr>
        </thead>
        <tbody id="rekap-rows"></tbody>
      </table>
    </div>
  `);

  const cont = document.getElementById('rekap-rows');
  if (!rows.length) {
    cont.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted)">Belum ada data</td></tr>';
    refreshIcons();
    return;
  }

  const groups = {};
  rows.forEach(r => {
    const k = String(r.No || '0');
    if (!groups[k]) groups[k] = [];
    groups[k].push(r);
  });

  cont.innerHTML = Object.keys(groups).map(noKey => {
    const items = groups[noKey];
    const parent = items[0];
    const picTokens = groupPicTokens(items);
    const picNames = picTokens.map(picNama);

    return `
      <tr class="rrow" data-pic="${esc(picTokens.join(PIC_SEP))}" data-q="${esc(parent.Temuan).toLowerCase()}" style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:12px 10px;font-weight:800;color:#2563eb;">${esc(parent.No) || '-'}</td>
        <td style="padding:12px 10px;font-weight:700;">${esc(picNames.join(', ')) || '-'}</td>
        <td style="padding:12px 10px;">${esc(parent.Temuan) || '—'}</td>
        <td style="padding:12px 10px;">${items.length} Detail</td>
        <td style="padding:12px 10px;text-align:right;">
          ${isPicUser() ? '' : `<button class="btn-action-sec" style="padding:4px 8px;" onclick="openAddSubModal(${items[items.length - 1]._row})">
            <i data-lucide="plus" style="width:14px;"></i> Sub
          </button>`}
        </td>
      </tr>`;
  }).join('');

  document.getElementById('flt-count').textContent = `${Object.keys(groups).length} Temuan Utama`;
  refreshIcons();
}

function filterRekap() {
  const pf = document.getElementById('flt-pic').value;
  const q  = (document.getElementById('flt-q').value || '').toLowerCase();
  let v = 0;

  document.querySelectorAll('.rrow').forEach(r => {
    const mp = !pf || hasPic(splitPics(r.dataset.pic), pf);
    const mq = !q || r.dataset.q.includes(q);
    r.style.display = (mp && mq) ? '' : 'none';
    if (mp && mq) v++;
  });
  document.getElementById('flt-count').textContent = v + ' Data Ditemukan';
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
  const btn = document.querySelector('.toolbar-wrap .btn-action-sec');
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

    const sheetRows = [];
    noOrder.forEach(no => {
      const subs = {}, subOrder = [];
      byNo[no].forEach(r => {
        const k = String(r.SubTemuan || '').trim();
        if (!subs[k]) { subs[k] = []; subOrder.push(k); }
        subs[k].push(r);
      });
      subOrder.forEach(k => sheetRows.push({ no, items: subs[k] }));
    });

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
        if (multiNo && j < 2) return;
        h = Math.max(h, estHeight(val, j, st.size, st.bold));
      });
      rowHeights.push(h);

      const sts = it.map(x => statusOf(x).lbl);
      const k = row.getCell(11);
      k.value = sts.every(s => s === 'Selesai') ? 'Selesai' : (sts.every(s => s === 'Belum') ? 'Belum' : 'Proses');
      k.font = { name: FONT, size: 11 };
      k.alignment = { vertical: 'middle', wrapText: true };
    });

    let gs = 0;
    for (let i = 1; i <= sheetRows.length; i++) {
      if (i === sheetRows.length || sheetRows[i].no !== sheetRows[gs].no) {
        if (i - gs > 1) {
          ws.mergeCells(DS + gs, 1, DS + i - 1, 1);
          ws.mergeCells(DS + gs, 2, DS + i - 1, 2);
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
