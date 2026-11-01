/* ruang-isian.js - halaman RUANG ISIAN > Temuan / Sub Temuan
   Isi file (urut):
     1. Bersama   : label, filter, kartu rincian, tabel   (juga dipakai detail.js)
     2. Temuan    : LIHAT  ->  TAMBAH & UBAH  ->  HAPUS
   Halaman Detail ada di detail.js, unggah bukti di bukti.js. */

// ═══ BERSAMA: state & label ════════════════════════════════════════════

if (!S.riOpen) S.riOpen = {};
if (!S.riStatus) S.riStatus = 'all';   // 'all' | 'on_progress' | 'selesai' | 'belum_tl'
if (!S.riJenis)  S.riJenis  = '';
if (!S.riTahun)  S.riTahun  = '';
if (!S.activeLhaNo) S.activeLhaNo = null;

// ── Penamaan rincian ──────────────────────────────────────────────────
function sumberBadge(r) {
  const l = sumberLabel(r);
  return l ? `<span class="sumber-badge sumber-${esc(r.Sumber || 'bpk')}">${esc(l)}</span>` : '';
}

function subLabel(total, idx) { return total > 1 ? 'Sub Temuan #' + (idx + 1) : 'Rincian Temuan'; }
function subCountLabel(n)     { return n > 1 ? n + ' Sub Temuan' : '1 Rincian Temuan'; }

// Potong teks panjang untuk label/dropdown (dipakai detail.js & bukti.js)
function riShort(text, max) {
  const t = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
  max = max || 60;
  return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t;
}

// Hitung status agregat dokumen LHP/LHA (sama seperti Archive.zip: Selesai / On Progress / Belum TL)
function groupStatusKey(items) {
  let selesai = 0, proses = 0, belum = 0;
  (items || []).forEach(r => {
    const lbl = statusOf(r).lbl;
    if (lbl === 'Selesai') selesai++;
    else if (lbl === 'Proses' || Number(r.BuktiCount) > 0 || String(r.RencanaAksi || '').trim()) proses++;
    else belum++;
  });
  const total = (items || []).length || 1;
  const pct = Math.round((selesai / total) * 100);
  if (selesai === total && total > 0) return { key: 'selesai', label: 'Selesai', selesai, total, pct };
  if (selesai > 0 || proses > 0)     return { key: 'on_progress', label: 'On Progress', selesai, total, pct };
  return { key: 'belum_tl', label: 'Belum TL', selesai, total, pct };
}

// ═══ BERSAMA: filter (Status / Sumber / Jenis Audit / Tahun / Unit PIC / Cari) ═══

function riFilterChips(prefix, handler, picOpts) {
  const optSumber = Object.keys(SUMBER_LABEL).map(k => `<option value="${esc(k)}" ${S.riSumber === k ? 'selected' : ''}>${esc(SUMBER_LABEL[k])}</option>`).join('');
  const optJenis  = Object.keys(JENIS_AUDIT_LABEL).map(k => `<option value="${esc(k)}" ${S.riJenis === k ? 'selected' : ''}>${esc(JENIS_AUDIT_LABEL[k])}</option>`).join('');
  const optTahun  = tahunOptions(S.allR).map(y => `<option value="${esc(y)}" ${S.riTahun === y ? 'selected' : ''}>${esc(y)}</option>`).join('');
  const selCls    = 'h-8 px-2.5 text-xs bg-[#F5F5F7] border border-transparent rounded-[8px] focus:bg-white focus:border-[#0071E3] focus:outline-none text-[#1D1D1F] font-medium';
  return `
    <select id="${prefix}-flt-sumber" onchange="${handler}()" class="${selCls}">
      <option value="">Semua Sumber</option>${optSumber}
    </select>
    <select id="${prefix}-flt-jenis" onchange="${handler}()" class="${selCls}">
      <option value="">Semua Jenis Audit</option>${optJenis}
    </select>
    <select id="${prefix}-flt-tahun" onchange="${handler}()" class="${selCls}">
      <option value="">Semua Tahun</option>${optTahun}
    </select>
    <select id="${prefix}-flt-pic" onchange="${handler}()" ${isPicUser() ? 'disabled' : ''} class="${selCls} max-w-[200px] truncate">
      <option value="">Semua Unit Kerja</option>${picOpts}
    </select>`;
}

function riApplyFilters(rows) {
  const q = (S.riQ || '').toLowerCase().trim();
  const baseFiltered = (rows || []).filter(r => {
    const matchPic    = !S.riFilter || hasPic(splitPics(r.PIC), S.riFilter);
    const matchSumber = !S.riSumber || (r.Sumber || 'bpk') === S.riSumber;
    const matchJenis  = !S.riJenis  || (r.JenisAudit || 'kinerja') === S.riJenis;
    const matchTahun  = !S.riTahun  || String(r.Tahun || '') === S.riTahun;

    const txtNo       = String(r.No || '').toLowerCase();
    const txtSumber   = String(r.SumberLabel || r.Sumber || '').toLowerCase();
    const txtTemuan   = String(r.Temuan || '').toLowerCase();
    const txtSub      = String(r.SubTemuan || '').toLowerCase();
    const txtKondisi  = String(r.Kondisi || '').toLowerCase();
    const txtKriteria = String(r.Kriteria || '').toLowerCase();
    const txtRekom    = String(r.Rekomendasi || '').toLowerCase();
    const matchQ      = !q || txtNo.includes(q) || txtSumber.includes(q) || txtTemuan.includes(q) || txtSub.includes(q) || txtKondisi.includes(q) || txtKriteria.includes(q) || txtRekom.includes(q);

    return matchPic && matchSumber && matchJenis && matchTahun && matchQ;
  });

  if (!S.riStatus || S.riStatus === 'all') return baseFiltered;

  // Filter status berdasarkan agregat dokumen (atau per baris)
  const byNo = {};
  baseFiltered.forEach(r => {
    const k = String(r.No || '0');
    if (!byNo[k]) byNo[k] = [];
    byNo[k].push(r);
  });
  return baseFiltered.filter(r => {
    const k = String(r.No || '0');
    const st = groupStatusKey(byNo[k] || [r]);
    return st.key === S.riStatus;
  });
}

function riReadFilters(prefix) {
  const v = id => (document.getElementById(`${prefix}-flt-${id}`) || {}).value || '';
  S.riFilter = v('pic');
  S.riSumber = v('sumber');
  S.riJenis  = v('jenis');
  S.riTahun  = v('tahun');
  const qEl  = document.getElementById(`${prefix}-flt-q`);
  if (qEl) S.riQ = qEl.value || '';
}

function riSetStatusTab(status, prefix, handlerFn) {
  S.riStatus = status || 'all';
  document.querySelectorAll('.ri-status-chip').forEach(btn => {
    const active = btn.dataset.status === S.riStatus;
    btn.className = active
      ? 'ri-status-chip px-3 py-1 text-xs font-semibold rounded-[7px] transition-all bg-white text-[#1D1D1F] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
      : 'ri-status-chip px-3 py-1 text-xs font-medium rounded-[7px] transition-all text-[#6E6E73] hover:text-[#1D1D1F]';
  });
  if (typeof window[handlerFn] === 'function') window[handlerFn]();
}

function riResetFilters(prefix, handlerFn) {
  S.riStatus = 'all';
  S.riFilter = isPicUser() ? (S.riFilter || '') : '';
  S.riSumber = '';
  S.riJenis  = '';
  S.riTahun  = '';
  S.riQ      = '';
  ['sumber', 'jenis', 'tahun', 'q'].forEach(k => {
    const el = document.getElementById(`${prefix}-flt-${k}`);
    if (el) el.value = '';
  });
  if (!isPicUser()) {
    const picEl = document.getElementById(`${prefix}-flt-pic`);
    if (picEl) picEl.value = '';
  }
  riSetStatusTab('all', prefix, handlerFn);
}

// ═══ BERSAMA: kartu rincian (Kriteria, Sebab, Rekomendasi, Rencana Aksi, Output, Jadwal) ═══

// ══════════════════ TAMPILAN RINCIAN ═══════════════════
const RI_CARDS = [
  { key: 'Kondisi',     title: 'Kondisi',      icon: 'search',         cls: 'blue'   },
  { key: 'Kriteria',    title: 'Kriteria',     icon: 'target',         cls: 'blue'   },
  { key: 'Sebab',       title: 'Sebab',        icon: 'lightbulb',      cls: 'green'  },
  { key: 'Akibat',      title: 'Akibat',       icon: 'alert-triangle', cls: 'orange' },
  { key: 'Rekomendasi', title: 'Rekomendasi',  icon: 'clipboard-list', cls: 'purple' },
  { key: 'RencanaAksi', title: 'Rencana Aksi', icon: 'file-text',      cls: 'orange' }
];

function parseList(text) {
  const t = String(text == null ? '' : text).replace(/\r/g, '').trim();
  if (!t || t === '-') return { items: [], numbered: false };

  const items = [];
  let cur = null;
  let numbered = false;
  t.split('\n').forEach(line => {
    const m = line.match(/^\s*(\d{1,2})\s*[.)]\s+(.*)$/);
    if (m) {
      numbered = true;
      cur = { text: m[2].trim() };
      items.push(cur);
    } else if (line.trim()) {
      if (cur) cur.text += ' ' + line.trim();
      else { cur = { text: line.trim() }; items.push(cur); }
    }
  });

  if (!numbered) return { items: [t], numbered: false };
  return { items: items.map(i => i.text), numbered: true };
}

function parseOutputSections(text) {
  const t = String(cleanOutput(text) || '').replace(/\r/g, '').trim();
  if (!t || t === '-') return [];

  const secs = [];
  let cur = null;
  t.split('\n').forEach(line => {
    const m = line.match(/^\s*([a-zA-Z])\s*[.)]\s+(.+)$/);
    if (m) {
      cur = { letter: m[1].toLowerCase(), head: m[2].trim(), body: [] };
      secs.push(cur);
    } else {
      if (!cur) { cur = { letter: '', head: '', body: [] }; secs.push(cur); }
      cur.body.push(line);
    }
  });
  return secs.map(s => ({ letter: s.letter, head: s.head, list: parseList(s.body.join('\n')) }));
}

function riListHtml(p, mode) {
  if (!p.items.length) return '';
  if (!p.numbered) return `<div class="ri-para">${esc(p.items[0])}</div>`;
  const cls = mode === 'cols' ? ' ri-cols' : (mode === 'plain' ? ' ri-plain' : '');
  return `<ol class="ri-list${cls}">${p.items.map((t, i) => `
    <li><span class="ri-num">${i + 1}${mode === 'plain' ? '.' : ''}</span><span class="ri-txt">${esc(t)}</span></li>`).join('')}
  </ol>`;
}

function riCard(cls, icon, title, bodyHtml) {
  return `
    <div class="ri-card ri-${cls}">
      <div class="ri-card-head"><i data-lucide="${icon}" class="icon-plain"></i><span>${title}</span></div>
      <div class="ri-card-body">${bodyHtml || '<div class="ri-empty">Belum diisi</div>'}</div>
    </div>`;
}

function riOutputCard(secs) {
  let body = '';
  secs.forEach(sec => {
    const cap = sec.head ? `<div class="ri-caption">${sec.letter ? esc(sec.letter) + '. ' : ''}${esc(sec.head)}</div>` : '';
    body += `<div class="ri-out-block">${cap}${riListHtml(sec.list, 'cols')}</div>`;
  });
  return `<div class="ri-wide">${riCard('sky', 'calendar-check', 'Output', body)}</div>`;
}

function riJadwalCard(text) {
  return `<div class="ri-wide">${riCard('purple', 'calendar-days', 'Jadwal', riListHtml(parseList(text), ''))}</div>`;
}

function riSubHtml(sub, idx, canAdmin, total, opts) {
  opts = opts || {};
  const st = statusOf(sub);
  const isPic = isPicUser();

  const editLbl = isPic
    ? (String(sub.RencanaAksi || '').trim() ? 'Ubah' : 'Isi Renaksi')
    : 'Edit';
  const buttons = opts.readOnly ? '' : `
    <button type="button" class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#0071E3] hover:bg-[#0071E3]/10 rounded-md transition-colors" onclick="openModal('${esc(jsq(sub.PIC))}',${sub._row})">${editLbl}</button>`;

  const delBtn = (opts.readOnly || !isAdminUser()) ? '' : `
    <button type="button" class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#D70015] hover:bg-[#FFF2F2] rounded-md transition-colors" onclick="openDelete(${sub._row}, ${sub.isSubRow ? 'false' : 'true'}, ${Math.max((total || 1) - 1, 0)})">Hapus</button>`;

  const statusBadge = st.lbl === 'Selesai'
    ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#0071E3]/10 text-[#0071E3]"><span class="w-1.5 h-1.5 rounded-full bg-[#0071E3]"></span>Selesai</span>`
    : st.lbl === 'Proses'
      ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F5F5F7] text-[#1D1D1F]"><span class="w-1.5 h-1.5 rounded-full bg-[#86868B]"></span>Proses</span>`
      : `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F5F5F7] text-[#86868B]"><span class="w-1.5 h-1.5 rounded-full bg-[#D2D2D7]"></span>Belum</span>`;

  return `
    <div class="bg-white rounded-2xl border border-black/[0.06] overflow-hidden mb-3 last:mb-0">
      <div class="px-5 py-3 border-b border-black/[0.05] flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs font-semibold text-[#1D1D1F]">Rincian #${idx + 1}</span>
          ${sub.SubTemuan ? `<span class="text-xs text-[#6E6E73]">· ${esc(riShort(sub.SubTemuan, 75))}</span>` : ''}
          ${statusBadge}
        </div>
        <div class="flex flex-wrap items-center gap-1">
          ${buttons}${delBtn}
        </div>
      </div>
      <div class="p-5">
        ${riSubBodyHtml(sub, opts)}
      </div>
    </div>`;
}

function riSubBodyHtml(sub, opts) {
  opts = opts || {};
  const secs = parseOutputSections(sub.Output);
  const pics = groupPicShort([sub]).join(', ') || '-';
  const picsFull = groupPicNames([sub]).join(', ') || '-';
  const hasRenaksi = !!String(sub.RencanaAksi || '').trim();
  const finStrip = financialStripHtml(sub.NilaiTemuan, sub.NilaiRealisasi, sub.Selisih);

  const unsurGrid = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
      <div class="bg-[#F5F5F7] p-3.5 rounded-xl">
        <span class="text-[11px] font-medium text-[#86868B] block mb-1">Kondisi</span>
        <div class="text-xs text-[#1D1D1F] leading-relaxed whitespace-pre-line">${riListHtml(parseList(sub.Kondisi || sub.Temuan), '') || '<span class="text-[#86868B]">—</span>'}</div>
      </div>
      <div class="bg-[#F5F5F7] p-3.5 rounded-xl">
        <span class="text-[11px] font-medium text-[#86868B] block mb-1">Kriteria</span>
        <div class="text-xs text-[#1D1D1F] leading-relaxed whitespace-pre-line">${riListHtml(parseList(sub.Kriteria), '') || '<span class="text-[#86868B]">—</span>'}</div>
      </div>
      <div class="bg-[#F5F5F7] p-3.5 rounded-xl">
        <span class="text-[11px] font-medium text-[#86868B] block mb-1">Sebab</span>
        <div class="text-xs text-[#1D1D1F] leading-relaxed whitespace-pre-line">${riListHtml(parseList(sub.Sebab), '') || '<span class="text-[#86868B]">—</span>'}</div>
      </div>
      <div class="bg-[#F5F5F7] p-3.5 rounded-xl">
        <span class="text-[11px] font-medium text-[#86868B] block mb-1">Akibat</span>
        <div class="text-xs text-[#1D1D1F] leading-relaxed whitespace-pre-line">${riListHtml(parseList(sub.Akibat), '') || '<span class="text-[#86868B]">—</span>'}</div>
      </div>
    </div>`;

  const rekomSection = `
    <div class="bg-[#F5F5F7] rounded-xl p-4 mb-3 space-y-3">
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div>
          <span class="text-[11px] font-medium text-[#86868B] block mb-0.5">Rekomendasi</span>
          <div class="text-xs font-medium text-[#1D1D1F] leading-relaxed whitespace-pre-line">${riListHtml(parseList(sub.Rekomendasi), '') || '<span class="text-[#86868B]">—</span>'}</div>
        </div>
        <span class="text-[11px] text-[#6E6E73] shrink-0" title="${esc(picsFull)}">${esc(pics)}</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-black/[0.06]">
        <div class="sm:col-span-2">
          <span class="text-[11px] font-medium text-[#86868B] block mb-0.5">Rencana Aksi</span>
          <div class="text-xs ${hasRenaksi ? 'text-[#1D1D1F]' : 'text-[#86868B]'} leading-relaxed whitespace-pre-line">${hasRenaksi ? esc(sub.RencanaAksi) : 'Belum diisi'}</div>
        </div>
        <div>
          <span class="text-[11px] font-medium text-[#86868B] block mb-0.5">Target Waktu</span>
          <p class="text-xs font-medium text-[#1D1D1F]">${esc(sub.JadwalPelaksanaan || '—')}</p>
        </div>
      </div>

      ${finStrip}
    </div>`;

  return `
    ${unsurGrid}
    ${rekomSection}
    ${secs.length ? riOutputCard(secs) : ''}`;
}

// ═══ BERSAMA: tabel temuan & chip PIC (Archive.zip 7-Column Institutional Layout) ═══

const RI_PIC_MAX = 2;
const RI_ICON_USERS = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="icon-plain"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';

function riPicChips(pics) {
  if (!pics.length) return '<span class="text-xs text-[#86868B]">—</span>';
  const shown = pics.slice(0, RI_PIC_MAX).map(n => `<span class="text-xs text-[#1D1D1F] leading-snug line-clamp-1" title="${esc(n)}">${esc(picShort(n))}</span>`).join('');
  const rest = pics.slice(RI_PIC_MAX);
  const more = rest.length
    ? `<button type="button" class="text-[11px] text-[#0071E3] hover:underline font-medium text-left mt-0.5 inline-flex items-center" aria-label="${rest.length} PIC lainnya" title="${esc(rest.join(', '))}" data-pics="${esc(pics.join('|'))}" onclick="picMoreToggle(event,this)">+${rest.length} lainnya</button>`
    : '';
  return `<div class="flex flex-col gap-0.5 max-w-[190px]">${shown}${more}</div>`;
}

function picMoreClose() {
  const el = document.getElementById('pic-pop');
  if (el) el.remove();
}

function picMoreToggle(ev, btn) {
  ev.stopPropagation();
  const open = document.getElementById('pic-pop');
  if (open) { const same = open._btn === btn; picMoreClose(); if (same) return; }
  const names = String(btn.dataset.pics || '').split('|').filter(Boolean);
  const pop = document.createElement('div');
  pop.id = 'pic-pop';
  pop._btn = btn;
  pop.onclick = e => e.stopPropagation();
  pop.innerHTML = `<div class="pic-pop-title">Unit Kerja (${names.length})</div>` +
    names.map(n => `<div class="pic-pop-item"><b>${esc(picShort(n))}</b><span>${esc(n)}</span></div>`).join('');
  document.body.appendChild(pop);
  const r = btn.getBoundingClientRect();
  const w = pop.offsetWidth, h = pop.offsetHeight;
  let left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8);
  let top = r.bottom + 6;
  if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6);
  pop.style.left = left + 'px';
  pop.style.top = top + 'px';
}

document.addEventListener('click', picMoreClose);
window.addEventListener('scroll', picMoreClose, true);
window.addEventListener('resize', picMoreClose);

function riTableHtml(groups, cfg) {
  const isMainRI = cfg.prefix === 't';
  const cols = 6;

  const body = Object.keys(groups).map(noKey => {
    const items = groups[noKey];
    const parent = items[0];
    const temuanItems = items.filter(r => !r.isSubRow && !r.ParentId);
    const subItems    = items.filter(r => r.isSubRow || r.ParentId);
    const tCount      = temuanItems.length;
    const sCount      = subItems.length;
    const totalCount  = items.length;

    const key = cfg.prefix + ':' + noKey;
    const open = !!S.riOpen[key];
    const agg = groupStatusKey(items);
    const dl  = getDeadlineInfo({
      TanggalInput: parent.TanggalInput,
      DeadlineDate: parent.DeadlineDate,
      TLStatus: agg.key === 'selesai' ? 'terverifikasi' : (agg.key === 'on_progress' ? 'menunggu' : 'belum')
    });

    const isBpk = (parent.Sumber || 'bpk') === 'bpk';
    const sumberLbl = isBpk ? 'BPK RI' : 'Inspektorat';

    let deadlineHtml = '';
    if (agg.key === 'selesai') {
      deadlineHtml = `<div class="text-xs text-[#1D1D1F]">${esc(dl.deadlineFormatted)}</div><span class="text-[11px] text-[#86868B]">Selesai</span>`;
    } else if (dl.isOverdue) {
      deadlineHtml = `<div class="text-xs font-medium text-[#D70015]">${esc(dl.deadlineFormatted)}</div><span class="text-[11px] text-[#D70015]">${esc(dl.statusBadgeText)}</span>`;
    } else {
      deadlineHtml = `<div class="text-xs text-[#1D1D1F]">${esc(dl.deadlineFormatted)}</div><span class="text-[11px] text-[#86868B]">${esc(dl.statusBadgeText)}</span>`;
    }

    const rowClick = isMainRI ? `showLhaDetail('${esc(jsq(noKey))}')` : `togTblRow(this)`;

    return `
      <tr data-key="${esc(key)}" onclick="${rowClick}"
        class="hover:bg-[#F5F5F7]/70 transition-colors group cursor-pointer align-top ${open ? 'bg-[#F5F5F7]/60' : ''}">
        <td class="px-5 py-3.5 align-top min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="font-mono text-xs font-semibold text-[#1D1D1F] group-hover:text-[#0071E3] transition-colors whitespace-nowrap">${esc(parent.No) || '-'}</span>
            ${dokumenBadge(parent)}
          </div>
          <div class="text-[11px] text-[#86868B] mt-0.5 flex items-center gap-1.5 truncate">
            <span>${esc(parent.Tahun || new Date().getFullYear())}</span>
            ${parent.NoLha ? `<span class="font-mono text-[#0071E3] font-semibold" title="${esc(parent.NoLha)}">· ${esc(parent.NoLha)}</span>` : ''}
          </div>
        </td>
        <td class="px-4 py-3.5 max-w-sm">
          <div class="font-medium text-[#1D1D1F] line-clamp-2 leading-snug text-[13px]" title="${esc(parent.Temuan || '')}">${esc(parent.Temuan) || '—'}</div>
          <div class="flex items-center gap-1.5 text-[11px] text-[#86868B] mt-1">
            <span class="inline-flex items-center font-medium text-[#1D1D1F] bg-[#F5F5F7] px-2 py-0.5 rounded-md">${tCount} Temuan</span>
            ${sCount > 0 ? `<span class="inline-flex items-center font-medium text-[#0071E3] bg-[#0071E3]/10 px-2 py-0.5 rounded-md">${sCount} Sub Temuan</span>` : ''}
            <span>· ${totalCount} total</span>
          </div>
        </td>
        <td class="px-4 py-3.5 whitespace-nowrap">
          <div class="text-xs font-medium text-[#1D1D1F]">${sumberLbl}</div>
          <div class="text-[11px] text-[#86868B] mt-0.5">${esc(jenisAuditLabel(parent) || 'Audit Kinerja')}</div>
        </td>
        <td class="px-4 py-3.5">
          ${riPicChips(groupPicNames(items))}
        </td>
        <td class="px-4 py-3.5 whitespace-nowrap">
          ${deadlineHtml}
        </td>
        <td class="px-5 py-3.5 whitespace-nowrap">
          <div class="flex items-center justify-end gap-3.5">
            <div class="w-24 shrink-0 min-w-[96px]">
              <div class="flex items-center justify-between text-[11px] mb-1 gap-2">
                <span class="text-[#86868B] shrink-0 font-medium">${agg.selesai}/${agg.total}</span>
                <span class="font-semibold text-[#1D1D1F] shrink-0">${agg.pct}%</span>
              </div>
              <div class="w-full bg-[#F5F5F7] rounded-full h-1.5 overflow-hidden">
                <div class="bg-[#0071E3] h-1.5 rounded-full transition-all duration-300" style="width:${agg.pct}%"></div>
              </div>
            </div>
            ${isMainRI ? `
              <span class="inline-flex items-center gap-0.5 text-xs font-medium text-[#0071E3] group-hover:translate-x-0.5 transition-transform shrink-0">
                <span>Buka</span>
                <i data-lucide="chevron-right" class="w-4 h-4"></i>
              </span>
            ` : (cfg.canAdmin ? cfg.action(noKey, items) : '')}
          </div>
        </td>
      </tr>
      ${!isMainRI ? `
      <tr style="display:${open ? 'table-row' : 'none'};">
        <td colspan="${cols}" class="border-b border-black/[0.06] bg-[#F5F5F7] p-4 max-[768px]:p-3">${cfg.inner(items)}</td>
      </tr>` : ''}`;
  }).join('');

  return `
    <div class="bg-white rounded-b-2xl border border-t-0 border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[840px] table-fixed">
          <thead>
            <tr class="border-b border-black/[0.06] text-[11px] text-[#86868B] font-medium">
              <th class="py-3 px-5 font-medium w-[16%]">Dokumen</th>
              <th class="py-3 px-4 font-medium w-[32%]">Temuan</th>
              <th class="py-3 px-4 font-medium w-[11%]">Audit</th>
              <th class="py-3 px-4 font-medium w-[14%]">Unit Kerja</th>
              <th class="py-3 px-4 font-medium w-[12%]">Batas Waktu</th>
              <th class="py-3 px-5 text-right font-medium w-[15%]">Progres</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-black/[0.05] text-sm">${body}</tbody>
        </table>
      </div>
    </div>`;
}

function togTblRow(tr) {
  const detail = tr.nextElementSibling;
  if (!detail) return;
  const open = detail.style.display === 'none';
  detail.style.display = open ? 'table-row' : 'none';
  tr.classList.toggle('bg-[#F5F5F7]', open);
  const chev = tr.querySelector('.rk-chev');
  if (chev) chev.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
  const key = tr.dataset ? tr.dataset.key : '';
  if (key) S.riOpen[key] = open;
}

// ═══ BERSAMA: muat ulang halaman ═══════════════════════════════════════

function refreshCurrentPage() {
  if (S.page === 'ruang-isian' || S.page === 'ruang-isian-detail') loadRuangIsian(S.riFilter || '');
  else if (S.page === 'rekap') loadRekap();
  else loadDashboard();
}

// ═══ DAFTAR TEMUAN & WORKSPACE PENGISIAN KOMPONEN TEMUAN ═══════════════

function loadRuangIsian(picFilter) {
  const hdrTitle = document.getElementById('hdr-title');
  if (hdrTitle) hdrTitle.textContent = 'Daftar Temuan';
  const hdrSub = document.getElementById('hdr-sub');
  if (hdrSub) hdrSub.textContent = '';

  setBody(loadingHtml());
  refreshIcons();

  apiFetch('/api/temuan')
    .then(rows => {
      S.allR = scopeRows(rows);
      if (picFilter !== undefined) S.riFilter = picFilter || '';
      renderRuangIsian(S.allR);
      if (S.activeLhaNo) {
        const stillExists = S.allR.some(r => String(r.No) === String(S.activeLhaNo));
        if (stillExists) showLhaDetail(S.activeLhaNo);
        else S.activeLhaNo = null;
      }
    })
    .catch(() => showToast('Gagal memuat data dari server', 'err'));
}

function renderRuangIsian() {
  const picOpts = allPicOptions().map(p => `<option value="${esc(p.username)}" ${S.riFilter === p.username ? 'selected' : ''}>${esc(p.nama)}</option>`).join('');
  const st = S.riStatus || 'all';
  const chipCls = key => (st === key)
    ? 'ri-status-chip px-3 py-1 text-xs font-semibold rounded-[7px] transition-all bg-white text-[#1D1D1F] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
    : 'ri-status-chip px-3 py-1 text-xs font-medium rounded-[7px] transition-all text-[#6E6E73] hover:text-[#1D1D1F]';

  setBody(`
    <div id="ri-master-section">
      <!-- Clean Apple Segmented Toolbar -->
      <div class="bg-white rounded-t-2xl border border-black/[0.06] p-4 flex flex-col gap-3">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div class="flex items-center gap-0.5 overflow-x-auto bg-[#F5F5F7] rounded-[9px] p-1 w-fit">
            <button type="button" onclick="riSetStatusTab('all','ri','filterRuangIsian')" data-status="all" class="${chipCls('all')}">Semua</button>
            <button type="button" onclick="riSetStatusTab('on_progress','ri','filterRuangIsian')" data-status="on_progress" class="${chipCls('on_progress')}">Proses</button>
            <button type="button" onclick="riSetStatusTab('selesai','ri','filterRuangIsian')" data-status="selesai" class="${chipCls('selesai')}">Selesai</button>
            <button type="button" onclick="riSetStatusTab('belum_tl','ri','filterRuangIsian')" data-status="belum_tl" class="${chipCls('belum_tl')}">Belum</button>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <div class="relative flex-1 sm:w-60">
              <i data-lucide="search" class="w-3.5 h-3.5 text-[#86868B] absolute left-3 top-1/2 -translate-y-1/2"></i>
              <input type="text" id="ri-flt-q" value="${esc(S.riQ || '')}" oninput="filterRuangIsian()" placeholder="Cari temuan..."
                class="w-full h-8 pl-8 pr-3 text-xs bg-[#F5F5F7] border border-transparent rounded-[8px] focus:bg-white focus:outline-none focus:border-[#0071E3] text-[#1D1D1F] transition-all">
            </div>

            ${isPicUser() ? '' : `
            <button type="button" onclick="openModal()" class="h-8 flex items-center gap-1.5 px-3.5 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium rounded-[8px] transition-all">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              <span>Temuan Baru</span>
            </button>`}
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 pt-2.5 border-t border-black/[0.05]">
          ${riFilterChips('ri', 'filterRuangIsian', picOpts)}
          <span class="text-xs text-[#86868B] ml-1" id="ri-count"></span>
          <button type="button" onclick="riResetFilters('ri','filterRuangIsian')" class="h-8 px-2.5 text-xs text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] rounded-[8px] transition-colors ml-auto">
            Reset
          </button>
        </div>
      </div>

      <div id="entry-list"></div>
    </div>

    <div id="lha-detail-section" class="hidden animate-slideIn"></div>
  `);

  renderEntryList();
}

function filterRuangIsian() {
  riReadFilters('ri');
  renderEntryList();
}

function renderEntryList() {
  const filteredRows = riApplyFilters(S.allR);
  const list = document.getElementById('entry-list');
  const canAdmin = !isPicUser();
  if (!list) return;

  if (!filteredRows.length) {
    list.innerHTML = `
      <div class="bg-white rounded-b-2xl border border-t-0 border-black/[0.06] py-16 px-4 text-center">
        <p class="text-sm font-medium text-[#1D1D1F]">Tidak ada temuan</p>
        <p class="text-xs text-[#86868B] mt-1">Sesuaikan filter atau kata pencarian</p>
      </div>`;
    const cnt = document.getElementById('ri-count');
    if (cnt) cnt.textContent = '0 temuan';
    refreshIcons();
    return;
  }

  const groups = {};
  filteredRows.forEach(r => {
    const k = String(r.No || '0');
    if (!groups[k]) groups[k] = [];
    groups[k].push(r);
  });

  let totalT = 0, totalS = 0;
  filteredRows.forEach(r => (r.isSubRow || r.ParentId) ? totalS++ : totalT++);
  const cnt = document.getElementById('ri-count');
  if (cnt) cnt.textContent = `${Object.keys(groups).length} Dokumen LHP · ${totalT} Temuan${totalS > 0 ? ` · ${totalS} Sub Temuan` : ''}`;

  list.innerHTML = riTableHtml(groups, {
    prefix: 't',
    canAdmin,
    action: (noKey, items) => `<button class="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg bg-[#F5F5F7] px-2.5 py-1 text-xs font-medium text-[#1D1D1F] hover:bg-[#E5E5EA]" onclick="event.stopPropagation(); openAddSubModal(${items[items.length - 1]._row})">
        + Sub Temuan
      </button>`,
    inner: items => items.map((sub, idx) => riSubHtml(sub, idx, canAdmin, items.length)).join('')
  });
  refreshIcons();
}

// ═══ WORKSPACE KOMPONEN TEMUAN (MINIMALIST APPLE UI) ═══════════════════

function closeLhaDetail() {
  S.activeLhaNo = null;
  S.activeItemRowId = null;
  const master = document.getElementById('ri-master-section');
  const detail = document.getElementById('lha-detail-section');
  if (detail) {
    detail.classList.add('hidden');
    detail.innerHTML = '';
  }
  if (master) master.classList.remove('hidden');
}

function showLhaDetail(noKey) {
  const items = (S.allR || []).filter(r => String(r.No || '0') === String(noKey));
  if (!items.length) return;
  S.activeLhaNo = noKey;

  const master = document.getElementById('ri-master-section');
  const detail = document.getElementById('lha-detail-section');
  if (!detail) return;
  if (master) master.classList.add('hidden');
  detail.classList.remove('hidden');

  const parent = items[0];
  const temuanItems = items.filter(r => !r.isSubRow && !r.ParentId);
  const subItems    = items.filter(r => r.isSubRow || r.ParentId);
  const tCount      = temuanItems.length || 1;
  const sCount      = subItems.length;
  const totalItems  = items.length;

  const agg = groupStatusKey(items);
  const dl  = getDeadlineInfo({
    TanggalInput: parent.TanggalInput,
    DeadlineDate: parent.DeadlineDate,
    TLStatus: agg.key === 'selesai' ? 'terverifikasi' : (agg.key === 'on_progress' ? 'menunggu' : 'belum')
  });
  const isBpk = (parent.Sumber || 'bpk') === 'bpk';
  const sumberText = isBpk ? 'BPK RI' : 'Inspektorat';
  const canAdmin = !isPicUser();

  const hierarchicalTableHtml = renderHierarchicalTable(items, canAdmin);

  detail.innerHTML = `
    <div id="lha-hierarchy-view" class="space-y-4">
      <!-- Minimalist Top Navigation -->
      <div class="flex items-center justify-between gap-3">
        <button type="button" onclick="closeLhaDetail()" class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0071E3] hover:underline cursor-pointer">
          <i data-lucide="chevron-left" class="w-4 h-4"></i>
          <span>Daftar Dokumen LHP</span>
        </button>

        <div class="flex items-center gap-2">
          <span class="text-xs text-[#6E6E73] font-medium px-2.5 py-1 bg-white rounded-lg border border-black/[0.06] shadow-xs">
            ${agg.selesai}/${agg.total} Selesai (${agg.pct}%)
          </span>
          ${canAdmin ? `
          <button type="button" onclick="openModal('', null, '${esc(jsq(noKey))}')" class="h-8 flex items-center gap-1.5 px-3 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium rounded-lg transition-colors shadow-xs cursor-pointer">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            <span>Tambah Temuan</span>
          </button>` : ''}
        </div>
      </div>

      <!-- Clean Document Header Card -->
      <div class="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-6">
        <div class="flex flex-wrap items-center gap-2 text-xs text-[#6E6E73] mb-2">
          <span class="font-mono font-bold text-[#1D1D1F] text-sm">${esc(parent.No)}</span>
          ${dokumenBadge(parent)}
          <span>·</span>
          <span class="font-medium text-[#1D1D1F]">${sumberText}</span>
          <span>·</span>
          <span>${esc(parent.Tahun || new Date().getFullYear())}</span>
          <span>·</span>
          <span class="${dl.isOverdue && agg.key !== 'selesai' ? 'text-[#D70015] font-semibold' : 'text-[#6E6E73]'}">Batas waktu ${esc(dl.deadlineFormatted)} (${esc(dl.statusBadgeText)})</span>
        </div>
        <h2 class="text-base font-semibold text-[#1D1D1F] leading-snug">${esc(parent.Temuan || '-')}</h2>

        <!-- Progress and Metrics Strip -->
        <div class="mt-4 pt-4 border-t border-black/[0.05] flex flex-wrap items-center justify-between gap-4">
          <div class="flex flex-wrap items-center gap-2.5">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F5F5F7] rounded-lg text-xs font-medium text-[#1D1D1F]">
              <i data-lucide="file-text" class="w-3.5 h-3.5 text-[#0071E3]"></i>
              <b>${tCount}</b> Temuan Pokok
            </span>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F5F5F7] rounded-lg text-xs font-medium text-[#1D1D1F]">
              <i data-lucide="layers" class="w-3.5 h-3.5 text-[#0071E3]"></i>
              <b>${sCount}</b> Sub Temuan
            </span>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F5F5F7] rounded-lg text-xs font-medium text-[#6E6E73]">
              Total <b>${totalItems}</b> Item Tindak Lanjut
            </span>
          </div>

          <div class="flex items-center gap-3 w-48">
            <div class="w-full">
              <div class="flex justify-between text-[11px] mb-1">
                <span class="text-[#86868B]">${agg.selesai}/${agg.total} Item</span>
                <span class="font-semibold text-[#1D1D1F]">${agg.pct}%</span>
              </div>
              <div class="w-full bg-[#F5F5F7] rounded-full h-2 overflow-hidden">
                <div class="bg-[#0071E3] h-2 rounded-full transition-all duration-300" style="width:${agg.pct}%"></div>
              </div>
            </div>
          </div>
        </div>

        <div id="lha-top-batl-banner" class="mt-3"></div>
      </div>

      <!-- Hierarchical Table Section -->
      ${hierarchicalTableHtml}
    </div>

    <!-- Focused Item Workspace View -->
    <div id="lha-item-workspace-view" class="hidden space-y-4"></div>
  `;

  refreshIcons();
  loadLhaDetailEvidence(parent._row, true);

  if (S.activeItemRowId && items.some(x => String(x._row) === String(S.activeItemRowId))) {
    openItemWorkspace(S.activeItemRowId);
  }
}

function renderHierarchicalTable(items, canAdmin) {
  let temuanList = items.filter(r => !r.isSubRow && !r.ParentId);
  if (!temuanList.length) temuanList = [items[0]];

  const rowsHtml = temuanList.map(tItem => {
    const childSubs = items.filter(sub => {
      if (!sub.isSubRow && !sub.ParentId) return false;
      if (sub.ParentId && (String(sub.ParentId) === String(tItem.Id) || String(sub.ParentId) === String(tItem._row))) return true;
      if (temuanList.length === 1 && String(sub._row) !== String(tItem._row)) return true;
      return false;
    });

    const st = statusOf(tItem);
    const isTuntas = st.lbl === 'Selesai';
    const statusPill = isTuntas
      ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0071E3]/10 text-[#0071E3]"><span class="w-1.5 h-1.5 rounded-full bg-[#0071E3]"></span>Selesai</span>`
      : st.lbl === 'Proses'
        ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F5F5F7] text-[#1D1D1F]"><span class="w-1.5 h-1.5 rounded-full bg-[#86868B]"></span>Proses</span>`
        : `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F5F5F7] text-[#86868B]"><span class="w-1.5 h-1.5 rounded-full bg-[#D2D2D7]"></span>Belum</span>`;

    const subBadgeHtml = childSubs.length > 0
      ? `<button type="button" onclick="event.stopPropagation(); toggleSubHierarchy(${tItem._row})" class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#0071E3]/10 hover:bg-[#0071E3]/20 text-[#0071E3] transition-colors cursor-pointer">
          <i data-lucide="layers" class="w-3.5 h-3.5"></i>
          <span>${childSubs.length} Sub Temuan</span>
          <i data-lucide="chevron-down" id="sub-arrow-${tItem._row}" class="w-3.5 h-3.5 transition-transform duration-200"></i>
        </button>`
      : `<span class="text-xs text-[#86868B] italic">—</span>`;

    const finText = Number(tItem.NilaiTemuan) > 0
      ? `<div class="font-medium text-[#1D1D1F]">Rp ${formatRupiahNumber(tItem.NilaiTemuan)}</div>`
      : `<span class="text-[#86868B]">—</span>`;

    const childRowsHtml = childSubs.map(sub => {
      const subSt = statusOf(sub);
      const subIsTuntas = subSt.lbl === 'Selesai';
      const subStatusPill = subIsTuntas
        ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0071E3]/10 text-[#0071E3]"><span class="w-1.5 h-1.5 rounded-full bg-[#0071E3]"></span>Selesai</span>`
        : subSt.lbl === 'Proses'
          ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F5F5F7] text-[#1D1D1F]"><span class="w-1.5 h-1.5 rounded-full bg-[#86868B]"></span>Proses</span>`
          : `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F5F5F7] text-[#86868B]"><span class="w-1.5 h-1.5 rounded-full bg-[#D2D2D7]"></span>Belum</span>`;

      const subFinText = Number(sub.NilaiTemuan) > 0
        ? `<span class="font-medium text-[#1D1D1F]">Rp ${formatRupiahNumber(sub.NilaiTemuan)}</span>`
        : `<span class="text-[#86868B]">—</span>`;

      return `
        <tr class="hover:bg-[#F0F2F5]/70 transition-colors">
          <td class="py-2.5 px-3 whitespace-nowrap">
            <span class="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-[#6E6E73]/10 text-[#1D1D1F]">${esc(sub.KodeSubTemuan || sub.Kode || 'ST-001')}</span>
          </td>
          <td class="py-2.5 px-3">
            <div class="font-medium text-[#1D1D1F] line-clamp-2 leading-relaxed text-xs" title="${esc(sub.SubTemuan || sub.Temuan || '')}">${esc(sub.SubTemuan || sub.Temuan || '—')}</div>
          </td>
          <td class="py-2.5 px-3 whitespace-nowrap text-xs text-[#1D1D1F]">
            ${esc(sub.JenisAuditLabel || jenisAuditLabel(sub) || 'Audit Kinerja')}
          </td>
          <td class="py-2.5 px-3">
            ${riPicChips(groupPicNames([sub]))}
          </td>
          <td class="py-2.5 px-3 whitespace-nowrap text-xs">
            ${subFinText}
          </td>
          <td class="py-2.5 px-3 whitespace-nowrap">
            ${subStatusPill}
          </td>
          <td class="py-2.5 px-3 whitespace-nowrap text-right">
            <div class="inline-flex items-center justify-end gap-1.5">
              <button type="button" onclick="openItemWorkspace(${sub._row})" class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-[#0071E3] text-white hover:bg-[#0077ED] transition-colors shadow-xs cursor-pointer">
                <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                <span>Lihat Detail</span>
              </button>
              ${canAdmin ? `
              <button type="button" onclick="openModal('${esc(jsq(sub.PIC))}', ${sub._row})" class="px-2 py-1 text-xs font-medium text-[#0071E3] hover:bg-[#0071E3]/10 rounded-lg transition-colors cursor-pointer">
                Edit
              </button>` : ''}
              ${isAdminUser() ? `
              <button type="button" onclick="openDelete(${sub._row}, false, 0)" class="px-2 py-1 text-xs font-medium text-[#D70015] hover:bg-[#FFF2F2] rounded-lg transition-colors cursor-pointer">
                Hapus
              </button>` : ''}
            </div>
          </td>
        </tr>`;
    }).join('');

    return `
      <!-- Row Temuan Pokok -->
      <tr class="hover:bg-[#F5F5F7]/80 transition-colors">
        <td class="py-3.5 px-4 whitespace-nowrap">
          <span class="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-[#0071E3]/10 text-[#0071E3]">${esc(tItem.KodeTemuan || tItem.Kode || 'T-001')}</span>
        </td>
        <td class="py-3.5 px-4">
          <div class="font-medium text-[#1D1D1F] line-clamp-2 leading-relaxed text-xs" title="${esc(tItem.Temuan || '')}">${esc(tItem.Temuan || '—')}</div>
        </td>
        <td class="py-3.5 px-3 whitespace-nowrap">
          ${subBadgeHtml}
        </td>
        <td class="py-3.5 px-3 whitespace-nowrap text-xs text-[#1D1D1F]">
          ${esc(tItem.JenisAuditLabel || jenisAuditLabel(tItem) || 'Audit Kinerja')}
        </td>
        <td class="py-3.5 px-3">
          ${riPicChips(groupPicNames([tItem]))}
        </td>
        <td class="py-3.5 px-3 whitespace-nowrap text-xs">
          ${finText}
        </td>
        <td class="py-3.5 px-3 whitespace-nowrap">
          ${statusPill}
        </td>
        <td class="py-3.5 px-4 whitespace-nowrap text-right">
          <div class="inline-flex items-center justify-end gap-1.5">
            <button type="button" onclick="openItemWorkspace(${tItem._row})" class="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg bg-[#0071E3] text-white hover:bg-[#0077ED] transition-colors shadow-xs cursor-pointer">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
              <span>Lihat Detail</span>
            </button>
            ${canAdmin ? `
            <button type="button" title="Tambah Sub Temuan" onclick="openAddSubModal(${tItem._row})" class="px-2 py-1 text-xs font-medium text-[#1D1D1F] hover:bg-[#F5F5F7] border border-black/[0.08] rounded-lg transition-colors cursor-pointer">
              + Sub
            </button>
            <button type="button" onclick="openModal('${esc(jsq(tItem.PIC))}', ${tItem._row})" class="px-2 py-1 text-xs font-medium text-[#0071E3] hover:bg-[#0071E3]/10 rounded-lg transition-colors cursor-pointer">
              Edit
            </button>` : ''}
            ${isAdminUser() ? `
            <button type="button" onclick="openDelete(${tItem._row}, false, ${childSubs.length})" class="px-2 py-1 text-xs font-medium text-[#D70015] hover:bg-[#FFF2F2] rounded-lg transition-colors cursor-pointer">
              Hapus
            </button>` : ''}
          </div>
        </td>
      </tr>

      ${childSubs.length > 0 ? `
      <!-- Accordion Sub Temuan -->
      <tr id="subs-wrap-${tItem._row}" class="hidden bg-[#FBFBFC]">
        <td colspan="8" class="p-0 border-b border-black/[0.06]">
          <div class="py-3.5 px-6 pl-10 border-l-4 border-[#0071E3]/40 bg-[#F8F9FA]/80 space-y-2.5">
            <div class="flex items-center justify-between text-xs font-semibold text-[#6E6E73]">
              <span class="flex items-center gap-1.5">
                <i data-lucide="corner-down-right" class="w-3.5 h-3.5 text-[#0071E3]"></i>
                <span>Sub Temuan dari ${esc(tItem.KodeTemuan || tItem.Kode || 'T-001')} (${childSubs.length} sub)</span>
              </span>
              ${canAdmin ? `
              <button type="button" onclick="openAddSubModal(${tItem._row})" class="inline-flex items-center gap-1 text-xs font-medium text-[#0071E3] hover:underline cursor-pointer">
                <i data-lucide="plus" class="w-3 h-3"></i>
                <span>Tambah Sub Temuan</span>
              </button>` : ''}
            </div>
            <div class="overflow-x-auto bg-white rounded-xl border border-black/[0.06] shadow-xs">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="border-b border-black/[0.06] bg-[#F5F5F7] text-[11px] text-[#86868B] font-medium">
                    <th class="py-2.5 px-3 w-[11%]">Kode Sub</th>
                    <th class="py-2.5 px-3 w-[33%]">Uraian Sub Temuan</th>
                    <th class="py-2.5 px-3 w-[14%]">Audit</th>
                    <th class="py-2.5 px-3 w-[14%]">Unit Kerja</th>
                    <th class="py-2.5 px-3 w-[12%]">Nilai Finansial</th>
                    <th class="py-2.5 px-3 w-[8%]">Status</th>
                    <th class="py-2.5 px-3 text-right w-[12%]">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-black/[0.04]">
                  ${childRowsHtml}
                </tbody>
              </table>
            </div>
          </div>
        </td>
      </tr>` : ''}
    `;
  }).join('');

  return `
    <div class="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
      <div class="px-6 py-4 border-b border-black/[0.05] flex items-center justify-between">
        <div>
          <h3 class="text-sm font-semibold text-[#1D1D1F]">Daftar Hirarki Temuan &amp; Sub Temuan</h3>
          <p class="text-xs text-[#86868B] mt-0.5">Tinjau daftar temuan dan sub temuan di bawah ini, lalu klik "Lihat Detail" untuk membuka workspace tindak lanjut</p>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs table-fixed min-w-[940px]">
          <thead>
            <tr class="border-b border-black/[0.06] bg-[#F5F5F7]/80 text-[11px] text-[#86868B] font-medium">
              <th class="py-3 px-4 w-[11%]">Kode</th>
              <th class="py-3 px-4 w-[28%]">Temuan / Pokok Masalah</th>
              <th class="py-3 px-3 w-[14%]">Sub Temuan</th>
              <th class="py-3 px-3 w-[12%]">Audit</th>
              <th class="py-3 px-3 w-[13%]">Unit Kerja</th>
              <th class="py-3 px-3 w-[10%]">Nilai Finansial</th>
              <th class="py-3 px-3 w-[7%]">Status</th>
              <th class="py-3 px-4 text-right w-[11%]">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-black/[0.05]">
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    </div>`;
}

function openItemWorkspace(rowId) {
  const sub = (S.allR || []).find(x => String(x._row) === String(rowId));
  if (!sub) { showToast('Data temuan tidak ditemukan', 'err'); return; }
  S.activeItemRowId = rowId;

  const isSub = sub.isSubRow || !!sub.ParentId;
  const parentTemuan = isSub ? (S.allR || []).find(x => String(x._row) === String(sub.ParentId) || String(x.Id) === String(sub.ParentId)) : null;

  const hView = document.getElementById('lha-hierarchy-view');
  const wView = document.getElementById('lha-item-workspace-view');
  if (!wView) return;

  const st = statusOf(sub);
  const pics = groupPicShort([sub]).join(', ') || '-';
  const picsFull = groupPicNames([sub]).join(', ') || '-';
  const hasRenaksi = !!String(sub.RencanaAksi || '').trim();
  const isTuntas = st.lbl === 'Selesai';
  const isFin = (Number(sub.NilaiTemuan) || 0) > 0;
  const sisaNominal = Number(sub.Selisih ?? sub.NilaiTemuan) || 0;
  const canEditRenaksi = !isAuditorUser() && sub.TLStatus !== 'batl';
  const showRenaksiFormInitial = canEditRenaksi && !hasRenaksi;
  const canAdmin = !isPicUser();
  const todayStr = typeof bkToday === 'function' ? bkToday() : new Date().toISOString().split('T')[0];

  const itemBadge = isTuntas
    ? `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#0071E3]/10 text-[#0071E3]"><span class="w-1.5 h-1.5 rounded-full bg-[#0071E3]"></span>Selesai</span>`
    : st.lbl === 'Proses'
      ? `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F5F5F7] text-[#1D1D1F]"><span class="w-1.5 h-1.5 rounded-full bg-[#86868B]"></span>Proses</span>`
      : `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F5F5F7] text-[#86868B]"><span class="w-1.5 h-1.5 rounded-full bg-[#D2D2D7]"></span>Belum TL</span>`;

  const itemKode = isSub ? (sub.KodeSubTemuan || sub.Kode || 'ST-001') : (sub.KodeTemuan || sub.Kode || 'T-001');
  const itemTitle = isSub ? (sub.SubTemuan || sub.Temuan || '-') : (sub.Temuan || '-');

  wView.innerHTML = `
    <!-- Top Workspace Navigation & Breadcrumbs -->
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <button type="button" onclick="closeItemWorkspace()" class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0071E3] hover:underline cursor-pointer">
        <i data-lucide="arrow-left" class="w-4 h-4"></i>
        <span>Kembali ke Tabel Temuan</span>
      </button>

      <div class="flex items-center gap-2 text-xs text-[#86868B]">
        <span class="font-mono font-medium">${esc(sub.No)}</span>
        <span>›</span>
        ${isSub && parentTemuan ? `<span class="font-mono font-medium text-[#1D1D1F]">${esc(parentTemuan.KodeTemuan || 'T-001')}</span><span>›</span>` : ''}
        <span class="font-mono font-bold text-[#0071E3]">${esc(itemKode)}</span>
      </div>
    </div>

    <!-- Focused Item Header Card -->
    <div class="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-6">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div class="flex flex-wrap items-center gap-2">
          <span class="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-[#0071E3]/10 text-[#0071E3]">${esc(itemKode)}</span>
          ${isSub ? `<span class="text-xs font-medium px-2 py-0.5 rounded-md bg-[#6E6E73]/10 text-[#1D1D1F]">Sub Temuan${parentTemuan ? ' dari ' + esc(parentTemuan.KodeTemuan || 'T-001') : ''}</span>` : `<span class="text-xs font-medium px-2 py-0.5 rounded-md bg-[#0071E3]/10 text-[#0071E3]">Temuan Pokok</span>`}
          ${itemBadge}
        </div>
        <div class="flex items-center gap-2">
          ${canAdmin ? `
          <button type="button" onclick="openModal('${esc(jsq(sub.PIC))}', ${sub._row})" class="px-3 py-1 text-xs font-medium text-[#0071E3] hover:bg-[#0071E3]/10 rounded-lg transition-colors cursor-pointer">
            Edit
          </button>` : ''}
          ${isAdminUser() ? `
          <button type="button" onclick="openDelete(${sub._row}, false, 0)" class="px-2.5 py-1 text-xs font-medium text-[#D70015] hover:bg-[#FFF2F2] rounded-lg transition-colors cursor-pointer">
            Hapus
          </button>` : ''}
        </div>
      </div>

      <h2 class="text-base font-semibold text-[#1D1D1F] leading-snug">${esc(itemTitle)}</h2>

      <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#86868B]">
        <span>Jenis Audit: <strong class="text-[#1D1D1F] font-medium">${esc(sub.JenisAuditLabel || jenisAuditLabel(sub) || 'Audit Kinerja')}</strong></span>
        <span>·</span>
        <span>Unit Kerja (PIC): <strong class="text-[#1D1D1F] font-medium" title="${esc(picsFull)}">${esc(pics)}</strong></span>
        ${isFin ? `<span>·</span><span>Nilai Temuan: <strong class="text-[#1D1D1F] font-semibold">Rp ${formatRupiahNumber(sub.NilaiTemuan)}</strong></span>` : ''}
      </div>
    </div>

    <!-- Workspace Detail Sections -->
    <div class="space-y-4">
      <!-- 1. Pokok Temuan (4 Unsur) & Rekomendasi -->
      <div class="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-6 space-y-4">
        <h3 class="text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider text-[#86868B]">Pokok Temuan &amp; Rekomendasi</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="bg-[#F5F5F7] p-4 rounded-xl">
            <span class="text-[11px] font-medium text-[#86868B] block mb-1">Kondisi</span>
            <div class="text-xs text-[#1D1D1F] leading-relaxed whitespace-pre-line">${riListHtml(parseList(sub.Kondisi || sub.Temuan), '') || '<span class="text-[#86868B]">—</span>'}</div>
          </div>
          <div class="bg-[#F5F5F7] p-4 rounded-xl">
            <span class="text-[11px] font-medium text-[#86868B] block mb-1">Kriteria</span>
            <div class="text-xs text-[#1D1D1F] leading-relaxed whitespace-pre-line">${riListHtml(parseList(sub.Kriteria), '') || '<span class="text-[#86868B]">—</span>'}</div>
          </div>
          <div class="bg-[#F5F5F7] p-4 rounded-xl">
            <span class="text-[11px] font-medium text-[#86868B] block mb-1">Sebab</span>
            <div class="text-xs text-[#1D1D1F] leading-relaxed whitespace-pre-line">${riListHtml(parseList(sub.Sebab), '') || '<span class="text-[#86868B]">—</span>'}</div>
          </div>
          <div class="bg-[#F5F5F7] p-4 rounded-xl">
            <span class="text-[11px] font-medium text-[#86868B] block mb-1">Akibat</span>
            <div class="text-xs text-[#1D1D1F] leading-relaxed whitespace-pre-line">${riListHtml(parseList(sub.Akibat), '') || '<span class="text-[#86868B]">—</span>'}</div>
          </div>
        </div>

        <div class="bg-[#F5F5F7] rounded-xl p-4">
          <span class="text-[11px] font-medium text-[#86868B] block mb-1">Rekomendasi</span>
          <div class="text-xs font-medium text-[#1D1D1F] leading-relaxed whitespace-pre-line">${riListHtml(parseList(sub.Rekomendasi), '') || '<span class="text-[#86868B]">—</span>'}</div>
          ${financialStripHtml(sub.NilaiTemuan, sub.NilaiRealisasi, sub.Selisih)}
        </div>
      </div>

      <!-- 2. Rencana Aksi (Inline) -->
      <div class="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-6">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider text-[#86868B]">Rencana Aksi Unit Kerja</h3>
          ${(canEditRenaksi && hasRenaksi) ? `
          <button type="button" onclick="toggleInlineRenaksi(${sub._row})" class="text-xs font-medium text-[#0071E3] hover:underline cursor-pointer">
            Ubah
          </button>` : ''}
        </div>

        <div id="inl-renaksi-view-${sub._row}" class="${showRenaksiFormInitial ? 'hidden' : ''} grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#F5F5F7] rounded-xl p-4">
          <div class="sm:col-span-2">
            <span class="text-[11px] font-medium text-[#86868B] block mb-0.5">Uraian</span>
            <p class="text-xs ${hasRenaksi ? 'text-[#1D1D1F]' : 'text-[#86868B]'} leading-relaxed whitespace-pre-line">${hasRenaksi ? esc(sub.RencanaAksi) : 'Belum diisi'}</p>
          </div>
          <div>
            <span class="text-[11px] font-medium text-[#86868B] block mb-0.5">Target Waktu</span>
            <p class="text-xs font-medium text-[#1D1D1F]">${esc(sub.JadwalPelaksanaan || '—')}</p>
          </div>
        </div>

        ${canEditRenaksi ? `
        <form id="inl-renaksi-form-${sub._row}" onsubmit="saveInlineRenaksi(event, ${sub._row})" class="${showRenaksiFormInitial ? '' : 'hidden'} bg-[#F5F5F7] rounded-xl p-4 space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="md:col-span-2">
              <label class="block text-[11px] font-medium text-[#6E6E73] mb-1">Rencana Aksi</label>
              <textarea id="inl-ra-text-${sub._row}" rows="2" required placeholder="Langkah tindak lanjut unit kerja..."
                class="w-full px-3 py-2 text-xs bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:border-[#0071E3] text-[#1D1D1F]">${esc(sub.RencanaAksi || '')}</textarea>
            </div>
            <div class="flex flex-col justify-between">
              <div>
                <label class="block text-[11px] font-medium text-[#6E6E73] mb-1">Target Waktu</label>
                <input type="text" id="inl-ra-jadwal-${sub._row}" required value="${esc(sub.JadwalPelaksanaan || '')}" placeholder="Contoh: Triwulan II 2026"
                  class="w-full h-8 px-3 text-xs bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:border-[#0071E3] text-[#1D1D1F]">
              </div>
              <div class="flex items-center justify-end gap-2 mt-2">
                ${hasRenaksi ? `<button type="button" onclick="toggleInlineRenaksi(${sub._row})" class="h-8 px-3 text-xs font-medium text-[#6E6E73] hover:text-[#1D1D1F] cursor-pointer">Batal</button>` : ''}
                <button type="submit" id="inl-ra-btn-${sub._row}" class="h-8 px-4 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer">
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </form>` : ''}
      </div>

      <!-- 3. Bukti Tindak Lanjut & Evaluasi -->
      <div class="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-6">
        <h3 class="text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider text-[#86868B] mb-3">Bukti Tindak Lanjut &amp; Telaah Auditor</h3>

        <div id="lha-ev-list-${sub._row}">
          <div class="text-xs text-[#86868B] py-3 text-center bg-[#F5F5F7] rounded-xl">Memuat...</div>
        </div>

        ${(!isAuditorUser() && !isTuntas && sub.TLStatus !== 'batl') ? `
        <div class="mt-4 pt-4 border-t border-black/[0.05]">
          <span class="text-xs font-semibold text-[#1D1D1F] block mb-2">Unggah Bukti Tindak Lanjut Baru</span>
          <form onsubmit="submitInlineBukti(event, ${sub._row}, ${isFin ? 1 : 0}, ${sisaNominal})" class="bg-[#F5F5F7] p-4 rounded-xl space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label class="block text-[11px] font-medium text-[#6E6E73] mb-1">Tanggal</label>
                <input type="date" id="inl-tgl-${sub._row}" value="${todayStr}" required
                  class="w-full h-8 px-2.5 text-xs bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:border-[#0071E3] text-[#1D1D1F]">
              </div>
              <div class="md:col-span-3">
                <label class="block text-[11px] font-medium text-[#6E6E73] mb-1">Uraian Progres</label>
                <input type="text" id="inl-uraian-${sub._row}" required placeholder="Uraikan progres penyelesaian..."
                  class="w-full h-8 px-3 text-xs bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:border-[#0071E3] text-[#1D1D1F]">
              </div>
            </div>

            ${isFin ? `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-medium text-[#6E6E73] mb-1">Nomor NTPN (16 Karakter)</label>
                <input type="text" id="inl-ntpn-${sub._row}" maxlength="16" ${sisaNominal > 0 ? 'required' : ''} placeholder="A1B2C3D4E5F6G7H8"
                  class="w-full h-8 px-2.5 text-xs font-mono uppercase bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:border-[#0071E3] text-[#1D1D1F]">
              </div>
              <div>
                <label class="block text-[11px] font-medium text-[#6E6E73] mb-1">Nominal Setoran (Rp)</label>
                <input type="text" id="inl-nominal-${sub._row}" inputmode="numeric" value="${sisaNominal > 0 ? formatRupiahNumber(sisaNominal) : ''}" oninput="formatRupiahInput(this)" ${sisaNominal > 0 ? 'required' : ''} placeholder="0"
                  class="w-full h-8 px-2.5 text-xs font-medium bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:border-[#0071E3] text-[#1D1D1F]">
              </div>
            </div>` : ''}

            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <input type="file" id="inl-file-${sub._row}" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx" required
                class="block flex-1 text-xs text-[#6E6E73] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-white file:text-[#1D1D1F] hover:file:bg-[#E5E5EA] cursor-pointer">
              <button type="submit" id="inl-btn-${sub._row}" class="h-8 px-4 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium rounded-lg transition-colors shrink-0 cursor-pointer">
                Unggah Bukti
              </button>
            </div>
          </form>
        </div>` : ''}
      </div>
    </div>
  `;

  if (hView) hView.classList.add('hidden');
  wView.classList.remove('hidden');
  refreshIcons();
  loadLhaDetailEvidence(sub._row, true);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeItemWorkspace() {
  S.activeItemRowId = null;
  const hView = document.getElementById('lha-hierarchy-view');
  const wView = document.getElementById('lha-item-workspace-view');
  if (wView) wView.classList.add('hidden');
  if (hView) hView.classList.remove('hidden');
  refreshIcons();
}

function toggleSubHierarchy(parentRowId) {
  const wrap = document.getElementById('subs-wrap-' + parentRowId);
  const arrow = document.getElementById('sub-arrow-' + parentRowId);
  if (!wrap) return;
  const isHidden = wrap.classList.contains('hidden');
  wrap.classList.toggle('hidden', !isHidden);
  if (arrow) arrow.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
}

function toggleInlineRenaksi(rowId) {
  const viewEl = document.getElementById('inl-renaksi-view-' + rowId);
  const formEl = document.getElementById('inl-renaksi-form-' + rowId);
  if (!viewEl || !formEl) return;
  const isHidden = formEl.classList.contains('hidden');
  formEl.classList.toggle('hidden', !isHidden);
  viewEl.classList.toggle('hidden', isHidden);
}

async function saveInlineRenaksi(ev, rowId) {
  ev.preventDefault();
  const r = (S.allR || []).find(x => String(x._row) === String(rowId));
  if (!r) { showToast('Data temuan tidak ditemukan', 'err'); return; }

  const raTextEl = document.getElementById('inl-ra-text-' + rowId);
  const jadwalEl = document.getElementById('inl-ra-jadwal-' + rowId);
  const btn      = document.getElementById('inl-ra-btn-' + rowId);

  const rencanaAksi = (raTextEl ? raTextEl.value : '').trim();
  const jadwal      = (jadwalEl ? jadwalEl.value : '').trim();
  if (!rencanaAksi) { showToast('Uraian Rencana Aksi wajib diisi', 'err'); return; }
  if (!jadwal)      { showToast('Target Waktu wajib diisi', 'err'); return; }

  const payload = {
    No:                r.No || '',
    Sumber:            r.Sumber || 'bpk',
    PIC:               r.PIC || '',
    Temuan:            r.Temuan || '',
    SubTemuan:         r.SubTemuan || '',
    Kondisi:           r.Kondisi || '',
    Kriteria:          r.Kriteria || '',
    Sebab:             r.Sebab || '',
    Akibat:            r.Akibat || '',
    Rekomendasi:       r.Rekomendasi || '',
    NilaiTemuan:       r.NilaiTemuan || 0,
    RencanaAksi:       rencanaAksi,
    JadwalPelaksanaan: jadwal,
    Output:            r.Output || ''
  };
  if (r.JenisAudit) payload.JenisAudit = r.JenisAudit;
  if (r.KodeTemuan) payload.KodeTemuan = r.KodeTemuan;
  if (r.KodeSubTemuan) payload.KodeSubTemuan = r.KodeSubTemuan;
  if (r.Kode) payload.Kode = r.Kode;

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Menyimpan...';
  }

  try {
    const res = await apiFetch('/api/temuan/' + rowId, 'PUT', payload);
    if (!res || !res.success) throw new Error((res && res.message) ? res.message : 'Gagal menyimpan Rencana Aksi');
    showToast('Rencana Aksi disimpan', 'ok');
    refreshCurrentPage();
  } catch (e) {
    showToast('Error: ' + e.message, 'err');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Simpan';
    }
  }
}

async function loadLhaDetailEvidence(rowId, isFirstRow) {
  const box = document.getElementById('lha-ev-list-' + rowId);
  if (!box) return;
  try {
    const res = await apiFetch('/api/bukti?temuan_id=' + encodeURIComponent(rowId));
    if (!res || !res.success) throw new Error('Gagal memuat bukti');

    if (isFirstRow) {
      renderTopBatlBanner(rowId, res);
    }

    const list = res.data || [];
    const locked = !!res.batl;
    const staff = isStaffUser();

    if (!list.length) {
      box.innerHTML = `<div class="text-xs text-[#86868B] py-3 px-4 bg-[#F5F5F7] rounded-xl">Belum ada bukti yang diunggah.</div>`;
      return;
    }

    const rowsHtml = list.map(b => {
      const id = Number(b.id);
      const canDel = !locked && (isAdminUser() || (isPicUser() && b.status !== 'terverifikasi'));
      const canDecide = staff && !locked && (b.status === 'menunggu' || b.status === 'pending');

      const stBadge = b.status === 'terverifikasi'
        ? '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#0071E3]/10 text-[#0071E3]">Disetujui</span>'
        : b.status === 'ditolak'
          ? '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FFF2F2] text-[#D70015]">Revisi</span>'
          : b.status === 'pending'
            ? '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F5F5F7] text-[#6E6E73]">Pending</span>'
            : '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F5F5F7] text-[#1D1D1F]">Menunggu</span>';

      return `
        <tr class="hover:bg-[#F5F5F7]/50 transition-colors">
          <td class="py-2.5 px-3 text-[#6E6E73] whitespace-nowrap align-top">${esc(bkDate(b.tanggalMulai))}</td>
          <td class="py-2.5 px-3 text-[#1D1D1F] align-top">
            <div class="whitespace-pre-line">${esc(b.uraian)}</div>
            ${b.catatan ? `<div class="mt-1 text-[11px] text-[#6E6E73]">Catatan: ${esc(b.catatan)}</div>` : ''}
          </td>
          <td class="py-2.5 px-3 align-top">
            ${b.fileUrl ? `
              <a href="${esc(b.fileUrl)}" target="_blank" rel="noopener" class="inline-flex items-center gap-1 text-[#0071E3] hover:underline font-medium">
                <i data-lucide="paperclip" class="w-3 h-3"></i>
                <span class="truncate max-w-[160px]">${esc(b.fileName || 'Berkas')}</span>
              </a>` : '<span class="text-[#86868B]">—</span>'}
            ${(b.ntpn || b.nominalSetoran != null) ? `
              <div class="mt-0.5 text-[11px] text-[#6E6E73]">
                ${b.ntpn ? `<span class="font-mono">${esc(b.ntpn)}</span>` : ''}
                ${b.nominalSetoran != null ? `<span class="ml-1">· Rp ${Number(b.nominalSetoran).toLocaleString('id-ID')}</span>` : ''}
              </div>` : ''}
          </td>
          <td class="py-2.5 px-3 align-top whitespace-nowrap">${stBadge}</td>
          <td class="py-2.5 px-3 text-right align-top whitespace-nowrap">
            ${canDel ? `
              <button type="button" onclick="deleteInlineBukti(${id}, ${rowId})" class="text-[#86868B] hover:text-[#D70015] p-1 rounded" title="Hapus">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>` : ''}
          </td>
        </tr>
        ${canDecide ? `
        <tr class="bg-[#F5F5F7]/70">
          <td colspan="5" class="px-3 py-2">
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <input type="text" id="inl-eval-note-${id}" value="${esc(b.catatan || '')}" placeholder="Catatan review auditor..."
                class="flex-1 h-7 px-2.5 text-xs bg-white border border-black/[0.08] rounded-md focus:outline-none focus:border-[#0071E3] text-[#1D1D1F]">
              <div class="flex items-center gap-1.5 shrink-0">
                <button type="button" onclick="evalInlineBukti(${id}, 'terverifikasi', ${rowId})" class="px-3 py-1 rounded-md text-xs font-medium bg-[#0071E3] text-white hover:bg-[#0077ED] transition-colors">
                  Setujui
                </button>
                ${b.status === 'menunggu' ? `
                <button type="button" onclick="evalInlineBukti(${id}, 'pending', ${rowId})" class="px-2.5 py-1 rounded-md text-xs font-medium bg-white text-[#6E6E73] hover:text-[#1D1D1F] border border-black/[0.08] transition-colors">
                  Pending
                </button>` : ''}
                <button type="button" onclick="evalInlineBukti(${id}, 'ditolak', ${rowId})" class="px-2.5 py-1 rounded-md text-xs font-medium bg-white text-[#D70015] hover:bg-[#FFF2F2] border border-black/[0.08] transition-colors">
                  Revisi
                </button>
              </div>
            </div>
          </td>
        </tr>` : ''}`;
    }).join('');

    box.innerHTML = `
      <div class="overflow-x-auto bg-white rounded-xl border border-black/[0.06] mb-2">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="border-b border-black/[0.05] text-[11px] text-[#86868B]">
              <th class="py-2 px-3 w-28 font-medium">Tanggal</th>
              <th class="py-2 px-3 font-medium">Uraian</th>
              <th class="py-2 px-3 w-48 font-medium">Berkas</th>
              <th class="py-2 px-3 w-28 font-medium">Status</th>
              <th class="py-2 px-3 w-10 text-right font-medium"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-black/[0.04]">${rowsHtml}</tbody>
        </table>
      </div>`;
    refreshIcons();
  } catch (e) {
    box.innerHTML = '<div class="text-xs text-[#D70015] py-2">Gagal memuat bukti.</div>';
  }
}

function renderTopBatlBanner(rowId, res) {
  const slot = document.getElementById('lha-top-batl-banner');
  if (!slot) return;
  const b = res.batl;
  const p = res.progress || { total: 1, tuntas: 0, semuaTuntas: false };

  if (b) {
    const canSignAuditee = !b.ttdAuditeePada && (isPicUser() || isAdminUser() || isAuditorUser());
    slot.innerHTML = `
      <div class="mt-4 pt-4 border-t border-black/[0.06] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div class="flex flex-wrap items-center gap-2 text-xs">
            <span class="font-semibold text-[#1D1D1F]">${b.signedBoth ? `LHA Resmi (${esc(res.noLha || 'LHA')})` : 'BATL Terbit'}</span>
            <span class="font-mono text-[#6E6E73]">· ${esc(b.nomor)}</span>
          </div>
          <div class="text-[11px] text-[#86868B] mt-0.5 flex flex-wrap items-center gap-x-3">
            <span>Auditor: ${b.ttdAuditorPada ? esc(b.ttdAuditorOleh || 'Disepakati') : 'Menunggu'}</span>
            <span>·</span>
            <span>Auditee: ${b.ttdAuditeePada ? esc(b.ttdAuditeeOleh || 'Disepakati') : 'Menunggu tanda tangan'}</span>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2 shrink-0">
          ${b.fileUrl ? `
            <a href="${esc(b.fileUrl)}" target="_blank" rel="noopener" class="px-3 py-1.5 text-xs font-medium text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#E5E5EA] rounded-lg">
              Berkas BATL
            </a>` : ''}
          ${canSignAuditee ? `
            <button type="button" onclick="signBatlFromDetail(${Number(b.id)})" class="px-3.5 py-1.5 text-xs font-medium text-white bg-[#0071E3] hover:bg-[#0077ED] rounded-lg">
              Tanda Tangani &amp; Terbitkan LHA
            </button>` : ''}
          ${isStaffUser() ? `
            <button type="button" onclick="cancelBatlFromDetail(${Number(b.id)})" class="px-2.5 py-1.5 text-xs font-medium text-[#D70015] hover:bg-[#FFF2F2] rounded-lg">
              Batalkan
            </button>` : ''}
        </div>
      </div>`;
    refreshIcons();
    return;
  }

  if (p.semuaTuntas && isStaffUser()) {
    const todayIso = new Date().toISOString().slice(0, 10);
    slot.innerHTML = `
      <div class="mt-4 pt-4 border-t border-black/[0.06]">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="text-xs text-[#1D1D1F]">
            <span class="font-semibold">Seluruh rekomendasi selesai (${p.tuntas}/${p.total}).</span>
            <span class="text-[#6E6E73] ml-1">Terbitkan BATL untuk menutup LHP menjadi LHA.</span>
          </div>
          <button type="button" onclick="toggleInlineBatlForm(${rowId})" class="shrink-0 px-3.5 py-1.5 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium rounded-lg">
            Terbitkan BATL
          </button>
        </div>

        <form id="inl-batl-form-${rowId}" class="hidden mt-3 p-3.5 bg-[#F5F5F7] rounded-xl grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end" onsubmit="submitInlineBatl(event, ${rowId})">
          <div class="md:col-span-3">
            <label class="block text-[11px] font-medium text-[#6E6E73] mb-1">Nomor BATL</label>
            <input type="text" id="inl-batl-no-${rowId}" required placeholder="BATL-01/ITJEN/2026"
              class="w-full h-8 px-2.5 text-xs bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:border-[#0071E3] font-mono">
          </div>
          <div class="md:col-span-2">
            <label class="block text-[11px] font-medium text-[#6E6E73] mb-1">Tanggal</label>
            <input type="date" id="inl-batl-tgl-${rowId}" value="${todayIso}" required
              class="w-full h-8 px-2.5 text-xs bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:border-[#0071E3]">
          </div>
          <div class="md:col-span-3">
            <label class="block text-[11px] font-medium text-[#6E6E73] mb-1">Catatan</label>
            <input type="text" id="inl-batl-note-${rowId}" placeholder="Opsional"
              class="w-full h-8 px-2.5 text-xs bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:border-[#0071E3]">
          </div>
          <div class="md:col-span-2">
            <label class="block text-[11px] font-medium text-[#6E6E73] mb-1">Berkas</label>
            <input type="file" id="inl-batl-file-${rowId}" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              class="w-full text-[11px] text-[#6E6E73] file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:font-medium file:bg-white file:text-[#1D1D1F]">
          </div>
          <div class="md:col-span-2">
            <button type="submit" id="inl-batl-btn-${rowId}" class="w-full h-8 px-3 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium rounded-lg">
              Simpan &amp; TTD
            </button>
          </div>
        </form>
      </div>`;
    refreshIcons();
  } else {
    slot.innerHTML = '';
  }
}

function toggleInlineBatlForm(rowId) {
  const f = document.getElementById('inl-batl-form-' + rowId);
  if (f) f.classList.toggle('hidden');
}

async function submitInlineBatl(ev, rowId) {
  ev.preventDefault();
  const noEl   = document.getElementById('inl-batl-no-' + rowId);
  const tglEl  = document.getElementById('inl-batl-tgl-' + rowId);
  const noteEl = document.getElementById('inl-batl-note-' + rowId);
  const fileEl = document.getElementById('inl-batl-file-' + rowId);
  const btn    = document.getElementById('inl-batl-btn-' + rowId);

  const nomor   = ((noEl || {}).value || '').trim();
  const tanggal = (tglEl || {}).value || '';
  const catatan = ((noteEl || {}).value || '').trim();
  const file    = fileEl && fileEl.files && fileEl.files[0];

  if (!nomor)   { showToast('Nomor BATL wajib diisi', 'err'); return; }
  if (!tanggal) { showToast('Tanggal BATL wajib diisi', 'err'); return; }

  const fd = new FormData();
  fd.append('temuan_id', rowId);
  fd.append('nomor', nomor);
  fd.append('tanggal', tanggal);
  if (catatan) fd.append('catatan', catatan);
  if (file)    fd.append('file', file);

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-3.5 h-3.5 spin"></i> <span>Memproses...</span>';
    refreshIcons();
  }

  try {
    const res = await bkUpload('/api/batl', fd);
    if (!res || !res.success) throw new Error((res && res.message) ? res.message : 'Gagal menerbitkan BATL');
    showToast(res.message || 'BATL diterbitkan & ditandatangani Auditor!', 'ok');
    refreshCurrentPage();
  } catch (e) {
    showToast('Error: ' + e.message, 'err');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="pen-tool" class="w-3.5 h-3.5"></i> <span>Terbitkan &amp; TTD</span>';
      refreshIcons();
    }
  }
}

async function cancelBatlFromDetail(batlId) {
  try {
    const res = await apiFetch('/api/batl/' + batlId, 'DELETE');
    if (!res || !res.success) throw new Error((res && res.message) ? res.message : 'Gagal membatalkan BATL');
    showToast('BATL dibatalkan & status dikembalikan ke LHP', 'ok');
    refreshCurrentPage();
  } catch (e) {
    showToast('Error: ' + e.message, 'err');
  }
}

async function signBatlFromDetail(batlId) {
  try {
    const res = await apiFetch('/api/batl/' + batlId + '/sign', 'POST', {});
    if (!res || !res.success) throw new Error((res && res.message) ? res.message : 'Gagal menandatangani BATL');
    showToast(res.message || 'Kesepakatan BATL ditandatangani & LHP resmi menjadi LHA!', 'ok');
    refreshCurrentPage();
  } catch (e) {
    showToast('Error: ' + e.message, 'err');
  }
}

async function submitInlineBukti(ev, rowId, isFin, sisaNominal) {
  ev.preventDefault();
  const tglEl  = document.getElementById('inl-tgl-' + rowId);
  const urEl   = document.getElementById('inl-uraian-' + rowId);
  const fileEl = document.getElementById('inl-file-' + rowId);
  const ntpnEl = document.getElementById('inl-ntpn-' + rowId);
  const nomEl  = document.getElementById('inl-nominal-' + rowId);
  const btn    = document.getElementById('inl-btn-' + rowId);

  const tgl    = (tglEl || {}).value || '';
  const uraian = ((urEl || {}).value || '').trim();
  const file   = fileEl && fileEl.files && fileEl.files[0];

  if (!tgl)    { showToast('Tanggal dokumen wajib diisi', 'err'); return; }
  if (!uraian) { showToast('Uraian progres tindak lanjut wajib diisi', 'err'); return; }
  if (!file)   { showToast('Berkas bukti dukung (eviden) wajib dipilih', 'err'); return; }

  const ntpn    = ntpnEl ? ntpnEl.value.trim().toUpperCase() : '';
  const nominal = nomEl  ? nomEl.value.trim() : '';
  if (isFin && sisaNominal > 0 && !ntpn) {
    showToast('Rekomendasi finansial wajib mencantumkan Nomor NTPN 16 karakter', 'err');
    return;
  }
  if (ntpn && !/^[A-Z0-9]{16}$/.test(ntpn)) {
    showToast('Nomor NTPN harus 16 karakter huruf/angka', 'err');
    return;
  }

  const fd = new FormData();
  fd.append('temuan_id', rowId);
  fd.append('tanggal_mulai', tgl);
  fd.append('tanggal_selesai', tgl);
  fd.append('uraian', uraian);
  if (ntpn)    fd.append('ntpn', ntpn);
  if (nominal) fd.append('nominal_setoran', nominal);
  fd.append('file', file);

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-3.5 h-3.5 spin"></i> <span>Mengunggah...</span>';
    refreshIcons();
  }

  try {
    const res = await bkUpload('/api/bukti', fd);
    if (!res || !res.success) throw new Error((res && res.message) ? res.message : 'Gagal mengunggah bukti');
    showToast('Bukti tindak lanjut berhasil disimpan!', 'ok');
    refreshCurrentPage();
  } catch (e) {
    showToast('Error: ' + e.message, 'err');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="upload-cloud" class="w-3.5 h-3.5"></i> <span>Simpan Bukti Tindak Lanjut</span>';
      refreshIcons();
    }
  }
}

async function evalInlineBukti(buktiId, status, rowId) {
  const noteEl = document.getElementById('inl-eval-note-' + buktiId);
  const catatan = noteEl ? noteEl.value.trim() : '';
  if ((status === 'ditolak' || status === 'pending') && !catatan) {
    showToast('Catatan evaluasi auditor wajib diisi saat Revisi atau Pending', 'err');
    if (noteEl) noteEl.focus();
    return;
  }
  try {
    const res = await apiFetch('/api/bukti/' + buktiId + '/verifikasi', 'PUT', { status, catatan });
    if (!res || !res.success) throw new Error((res && res.message) ? res.message : 'Gagal menyimpan evaluasi');
    showToast('Evaluasi bukti tindak lanjut berhasil disimpan', 'ok');
    refreshCurrentPage();
  } catch (e) {
    showToast('Error: ' + e.message, 'err');
  }
}

async function deleteInlineBukti(buktiId, rowId) {
  try {
    const res = await apiFetch('/api/bukti/' + buktiId, 'DELETE');
    if (!res || !res.success) throw new Error((res && res.message) ? res.message : 'Gagal menghapus bukti');
    showToast('Bukti tindak lanjut dihapus', 'ok');
    refreshCurrentPage();
  } catch (e) {
    showToast('Error: ' + e.message, 'err');
  }
}

// ═══ TEMUAN: TAMBAH & UBAH ═════════════════════════════════════════════

// ══════════════════ MODAL & CRUD API ═════════════════════════════
function renderPicChecklist(selected) {
  const box = document.getElementById('m-pic');
  if (!box) return;
  const manual = document.getElementById('m-pic-manual');
  if (manual) manual.value = '';
  const opts = allPicOptions().slice();
  const selKeys = new Set((selected || []).map(picKeyOf));
  (selected || []).forEach(t => {
    const k = picKeyOf(t);
    if (!opts.some(o => _picNormKey(o.username) === k)) opts.push({ username: t, nama: t });
  });
  box.innerHTML = opts.map(p => `
    <label class="pic-check-item">
      <input type="checkbox" value="${esc(p.username)}" ${selKeys.has(_picNormKey(p.username)) ? 'checked' : ''}>
      <span>${esc(p.nama)}</span>
    </label>`).join('');
}

function addManualPic() {
  const inp = document.getElementById('m-pic-manual');
  const box = document.getElementById('m-pic');
  if (!inp || !box) return;

  splitPics(inp.value).forEach(name => {
    const k = picKeyOf(name);
    const exist = Array.from(box.querySelectorAll('input[type="checkbox"]')).find(i => picKeyOf(i.value) === k);
    if (exist) {
      exist.checked = true;
    } else {
      box.insertAdjacentHTML('beforeend', `
        <label class="pic-check-item">
          <input type="checkbox" value="${esc(name)}" checked>
          <span>${esc(name)}</span>
        </label>`);
    }
  });

  inp.value = '';
  box.scrollTop = box.scrollHeight;
  inp.focus();
}

function applyModalRole(r) {
  const pic = isPicUser();
  const auditorFields = document.getElementById('m-auditor-fields');
  const picCtx        = document.getElementById('m-pic-ctx');
  const picFields     = document.getElementById('m-pic-fields');
  const note          = document.getElementById('m-role-note');
  const saveLbl       = document.getElementById('m-save-lbl');

  // Prinsip Less-Click Archive.zip:
  // - Saat PIC (Satker) membuka modal, sembunyikan seluruh field Auditor dan tampilkan
  //   Banner Konteks Rekomendasi + 2 input utama (Rencana Aksi & Target Jadwal).
  // - Saat Auditor membuka modal, tampilkan 1-Stop Form (4 Unsur + Rekomendasi + Target Finansial + PIC).
  if (auditorFields) auditorFields.style.display = pic ? 'none' : '';
  if (picCtx)        picCtx.style.display        = (pic && r) ? 'block' : 'none';
  if (note)          note.style.display          = pic ? 'block' : 'none';
  if (picFields)     picFields.style.display     = pic ? '' : 'none';

  const noEl = document.getElementById('m-no');
  if (noEl) noEl.readOnly = true;

  if (pic) {
    document.getElementById('modal-title').textContent = 'Rencana Aksi Unit Kerja (Renaksi)';
    document.getElementById('modal-sub').textContent   = 'Penetapan strategi implementasi dan target jadwal penyelesaian tindak lanjut';
    if (saveLbl) saveLbl.textContent = 'Simpan Rencana Aksi';

    if (r) {
      const dl = getDeadlineInfo(r);
      const noElCtx = document.getElementById('m-ctx-no');
      const metaEl  = document.getElementById('m-ctx-meta');
      const dlEl    = document.getElementById('m-ctx-deadline');
      const temEl   = document.getElementById('m-ctx-temuan');
      const rekEl   = document.getElementById('m-ctx-rekomendasi');
      const nilEl   = document.getElementById('m-ctx-nilai');

      if (noElCtx) noElCtx.textContent = r.No || '-';
      if (metaEl)  metaEl.textContent  = [sumberLabel(r), jenisAuditLabel(r), 'PIC: ' + (groupPicShort([r]).join(', ') || '-')].filter(Boolean).join(' · ');
      if (dlEl) {
        dlEl.textContent = 'Jatuh Tempo: ' + dl.deadlineFormatted + ' (' + dl.statusBadgeText + ')';
        dlEl.style.color = dl.isOverdue ? '#be123c' : '#047857';
      }
      if (temEl) temEl.textContent = r.Kondisi || r.SubTemuan || r.Temuan || '-';
      if (rekEl) rekEl.textContent = r.Rekomendasi || 'Belum ada rincian rekomendasi spesifik dari auditor.';
      if (nilEl) {
        if ((Number(r.NilaiTemuan) || 0) > 0) {
          nilEl.style.display = 'block';
          nilEl.innerHTML = `Target Penyetoran Kas Negara: Rp ${Number(r.NilaiTemuan).toLocaleString('id-ID')} &middot; Sisa Kewajiban: Rp ${Number(r.Selisih ?? r.NilaiTemuan).toLocaleString('id-ID')}`;
        } else {
          nilEl.style.display = 'none';
        }
      }
    }
  } else {
    if (saveLbl) saveLbl.textContent = 'Simpan Data';
  }
}

function getSelectedPics() {
  return Array.from(document.querySelectorAll('#m-pic input[type="checkbox"]:checked')).map(i => i.value);
}

function setSumberField(val, locked) {
  const sel = document.getElementById('m-sumber');
  if (!sel) return;
  sel.value = val;
  sel.disabled = !!locked;
}

function onSumberChange() {
  const sel = document.getElementById('m-sumber');
  const no  = document.getElementById('m-no');
  if (!sel || !no || document.getElementById('m-row').value || document.getElementById('m-is-sub').value === 'true') return;
  no.value = '...';
  apiFetch('/api/temuan/next-no?sumber=' + encodeURIComponent(sel.value))
    .then(n => {
      no.value = n;
      autoGenerateKodeInput();
    })
    .catch(() => { no.value = ''; showToast('Gagal mengambil kode temuan', 'err'); });
}

function autoGenerateKodeInput() {
  const isSub = document.getElementById('m-is-sub').value === 'true';
  const kodeInp = document.getElementById('m-kode');
  if (!kodeInp) return;

  if (isSub) {
    const parentRow = document.getElementById('m-parent-row').value;
    kodeInp.value = '...';
    apiFetch('/api/temuan/next-kode-sub?parent_id=' + encodeURIComponent(parentRow))
      .then(k => { kodeInp.value = k || 'ST-001'; })
      .catch(() => { kodeInp.value = 'ST-001'; });
  } else {
    const docNo = document.getElementById('m-no').value;
    kodeInp.value = '...';
    apiFetch('/api/temuan/next-kode-temuan?no=' + encodeURIComponent(docNo))
      .then(k => { kodeInp.value = k || 'T-001'; })
      .catch(() => { kodeInp.value = 'T-001'; });
  }
}

function openModal(pic, row, parentDocNo) {
  document.getElementById('m-row').value = '';
  document.getElementById('m-parent-row').value = '';
  document.getElementById('m-is-sub').value = 'false';

  document.getElementById('modal-title').textContent = row ? 'Edit Temuan & Rekomendasi' : 'Tambah Temuan Baru';
  document.getElementById('modal-sub').textContent   = row ? 'Perbarui pokok temuan, rekomendasi, PIC, dan target finansial' : 'Formulir pokok temuan pemeriksaan standar BPK-RI & APIP';

  const parentBanner = document.getElementById('m-parent-banner');
  if (parentBanner) parentBanner.style.display = 'none';

  const kodeLabel = document.getElementById('m-kode-label');
  if (kodeLabel) kodeLabel.textContent = 'Kode Temuan';
  const judulLabel = document.getElementById('m-judul-label');
  if (judulLabel) judulLabel.innerHTML = 'Judul / Pokok Temuan <span class="text-[#D70015]">*</span>';

  const temuanInp = document.getElementById('m-temuan');
  temuanInp.readOnly = false;
  temuanInp.style.background = '#f8fafc';

  ['m-no', 'm-kode', 'm-temuan', 'm-subtemuan', 'm-kondisi', 'm-kriteria', 'm-sebab', 'm-akibat', 'm-rekomendasi', 'm-rencanaaksi', 'm-jadwal', 'm-output'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const nilaiEl = document.getElementById('m-nilai-temuan');
  if (nilaiEl) {
    nilaiEl.value = '0';
    formatRupiahInput(nilaiEl, 'm-nilai-preview');
  }
  const jenisEl = document.getElementById('m-jenis');
  if (jenisEl) jenisEl.value = 'kinerja';

  const r = row ? S.allR.find(x => String(x._row) === String(row)) : null;
  renderPicChecklist(r ? splitPics(r.PIC) : (pic ? splitPics(pic) : []));
  applyModalRole(r);
  document.getElementById('modal-bg').classList.add('open');

  if (row) {
    document.getElementById('m-row').value = row;
    if (r) {
      document.getElementById('m-no').value = r.No || '';
      const kodeInp = document.getElementById('m-kode');
      if (kodeInp) {
        kodeInp.value = r.isSubRow ? (r.KodeSubTemuan || r.Kode || 'ST-001') : (r.KodeTemuan || r.Kode || 'T-001');
      }
      if (r.isSubRow) {
        document.getElementById('m-is-sub').value = 'true';
        document.getElementById('m-parent-row').value = r.ParentId || '';
        if (kodeLabel) kodeLabel.textContent = 'Kode Sub Temuan';
        if (judulLabel) judulLabel.innerHTML = 'Judul / Uraian Sub Temuan <span class="text-[#D70015]">*</span>';
      }
      document.getElementById('m-temuan').value       = r.isSubRow ? (r.SubTemuan || r.Temuan || '') : (r.Temuan || '');
      document.getElementById('m-subtemuan').value    = r.SubTemuan || '';
      if (document.getElementById('m-kondisi'))     document.getElementById('m-kondisi').value     = r.Kondisi || '';
      if (document.getElementById('m-kriteria'))    document.getElementById('m-kriteria').value    = r.Kriteria || '';
      if (document.getElementById('m-sebab'))       document.getElementById('m-sebab').value       = r.Sebab || '';
      if (document.getElementById('m-akibat'))      document.getElementById('m-akibat').value      = r.Akibat || '';
      if (document.getElementById('m-rekomendasi')) document.getElementById('m-rekomendasi').value = r.Rekomendasi || '';
      if (nilaiEl) {
        nilaiEl.value = formatRupiahNumber(r.NilaiTemuan || 0);
        formatRupiahInput(nilaiEl, 'm-nilai-preview');
      }
      document.getElementById('m-rencanaaksi').value  = r.RencanaAksi || '';
      document.getElementById('m-jadwal').value       = r.JadwalPelaksanaan || '';
      document.getElementById('m-output').value       = cleanOutput(r.Output);
      setSumberField(r.Sumber || 'bpk', true);
      if (jenisEl) jenisEl.value = r.JenisAudit || 'kinerja';
    }
  } else {
    setSumberField('inspektorat', false);
    if (parentDocNo) {
      document.getElementById('m-no').value = parentDocNo;
      const existDoc = S.allR.find(x => String(x.No) === String(parentDocNo));
      if (existDoc) setSumberField(existDoc.Sumber || 'bpk', true);
      autoGenerateKodeInput();
    } else {
      onSumberChange();
    }
  }

  const jw = document.getElementById('m-jenis-wrap');
  if (jw) jw.style.display = isPicUser() ? 'none' : '';
  refreshIcons();
}

function openAddSubModal(row) {
  const parent = S.allR.find(x => String(x._row) === String(row));
  if (!parent) return;

  document.getElementById('m-row').value = '';
  document.getElementById('m-parent-row').value = row;
  document.getElementById('m-is-sub').value = 'true';

  document.getElementById('modal-title').textContent = 'Tambah Sub Temuan Baru';
  document.getElementById('modal-sub').textContent   = 'Rincian sub temuan untuk ' + (parent.KodeTemuan || 'T-001') + ' (' + parent.No + ')';

  const parentBanner = document.getElementById('m-parent-banner');
  if (parentBanner) {
    parentBanner.style.display = 'flex';
    const b1 = document.getElementById('m-parent-kode-badge');
    const b2 = document.getElementById('m-parent-title-text');
    if (b1) b1.textContent = parent.KodeTemuan || 'T-001';
    if (b2) b2.textContent = parent.Temuan || '';
  }

  const kodeLabel = document.getElementById('m-kode-label');
  if (kodeLabel) kodeLabel.textContent = 'Kode Sub Temuan';
  const judulLabel = document.getElementById('m-judul-label');
  if (judulLabel) judulLabel.innerHTML = 'Judul / Uraian Sub Temuan <span class="text-[#D70015]">*</span>';

  document.getElementById('m-no').value = parent.No || '';
  setSumberField(parent.Sumber || 'bpk', true);

  const jenisEl = document.getElementById('m-jenis');
  if (jenisEl) jenisEl.value = parent.JenisAudit || 'kinerja';

  const temuanInp = document.getElementById('m-temuan');
  temuanInp.readOnly = false;
  temuanInp.style.background = '#f8fafc';

  ['m-temuan', 'm-subtemuan', 'm-kondisi', 'm-kriteria', 'm-sebab', 'm-akibat', 'm-rekomendasi', 'm-rencanaaksi', 'm-jadwal', 'm-output'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const nilaiEl = document.getElementById('m-nilai-temuan');
  if (nilaiEl) {
    nilaiEl.value = '0';
    formatRupiahInput(nilaiEl, 'm-nilai-preview');
  }

  // Pre-check parent's PICs, tapi fleksibel dapat diubah/ditambah PIC berbeda
  renderPicChecklist(splitPics(parent.PIC));
  applyModalRole(null);

  const jw = document.getElementById('m-jenis-wrap');
  if (jw) jw.style.display = isPicUser() ? 'none' : '';

  autoGenerateKodeInput();

  document.getElementById('modal-bg').classList.add('open');
  refreshIcons();
}

function closeModal() { document.getElementById('modal-bg').classList.remove('open'); }
function closeModalBg(e) { if (e.target === document.getElementById('modal-bg')) closeModal(); }

function saveTemuan() {
  const isSub = document.getElementById('m-is-sub').value === 'true';
  let raw     = cleanOutput(document.getElementById('m-output').value);

  const origRow = document.getElementById('m-row').value ? S.allR.find(x => String(x._row) === String(document.getElementById('m-row').value)) : null;
  const keep = k => (origRow && origRow[k] != null ? origRow[k] : '');

  const oldTag = origRow ? (String(origRow.Output || '').match(STATUS_TAG_RE) || []).pop() : '';
  if (oldTag) raw = (raw ? raw + ' ' : '') + oldTag.trim();

  const kondisiVal     = (document.getElementById('m-kondisi')     || {}).value ? document.getElementById('m-kondisi').value.trim()     : keep('Kondisi');
  const kriteriaVal    = (document.getElementById('m-kriteria')    || {}).value ? document.getElementById('m-kriteria').value.trim()    : keep('Kriteria');
  const sebabVal       = (document.getElementById('m-sebab')       || {}).value ? document.getElementById('m-sebab').value.trim()       : keep('Sebab');
  const akibatVal      = (document.getElementById('m-akibat')      || {}).value ? document.getElementById('m-akibat').value.trim()      : keep('Akibat');
  const rekomendasiVal = (document.getElementById('m-rekomendasi') || {}).value ? document.getElementById('m-rekomendasi').value.trim() : keep('Rekomendasi');
  const nilaiTemuanVal = document.getElementById('m-nilai-temuan')
    ? parseRupiahValue(document.getElementById('m-nilai-temuan').value)
    : (origRow ? (origRow.NilaiTemuan || 0) : 0);

  let judulTemuan = document.getElementById('m-temuan').value.trim();
  if (!judulTemuan && kondisiVal) {
    judulTemuan = kondisiVal;
  }

  const kodeVal = (document.getElementById('m-kode') || {}).value ? document.getElementById('m-kode').value.trim() : '';

  const fd = {
    No: document.getElementById('m-no').value.trim(),
    Kode: kodeVal,
    KodeTemuan: !isSub ? kodeVal : (origRow ? origRow.KodeTemuan : ''),
    KodeSubTemuan: isSub ? kodeVal : '',
    Sumber: (document.getElementById('m-sumber') || {}).value || 'bpk',
    JenisAudit: (document.getElementById('m-jenis') || {}).value || 'kinerja',
    PIC: getSelectedPics().join(PIC_SEP),
    Temuan: !isSub ? judulTemuan : (origRow ? origRow.Temuan : ''),
    SubTemuan: isSub ? judulTemuan : '',
    Kondisi: kondisiVal,
    Kriteria: kriteriaVal,
    Sebab: sebabVal,
    Akibat: akibatVal,
    Rekomendasi: rekomendasiVal,
    NilaiTemuan: nilaiTemuanVal,
    RencanaAksi: isPicUser() ? document.getElementById('m-rencanaaksi').value.trim() : (document.getElementById('m-rencanaaksi').value.trim() || keep('RencanaAksi')),
    JadwalPelaksanaan: isPicUser() ? document.getElementById('m-jadwal').value.trim() : (document.getElementById('m-jadwal').value.trim() || keep('JadwalPelaksanaan')),
    Output: isPicUser() ? raw : (raw || keep('Output')),
    isSubAdd: isSub,
    parentRow: document.getElementById('m-parent-row').value,
  };

  const jenisSel = document.getElementById('m-jenis');
  if (jenisSel && !isPicUser()) fd.JenisAudit = jenisSel.value;

  if (isPicUser()) {
    const rowId = document.getElementById('m-row').value;
    const orig = rowId ? S.allR.find(x => String(x._row) === String(rowId)) : null;
    if (!orig) { showToast('Akun PIC hanya dapat mengisi temuan yang ditugaskan kepadanya', 'err'); return; }
    ['No', 'Temuan', 'SubTemuan', 'Kondisi', 'Kriteria', 'Sebab', 'Akibat', 'Rekomendasi', 'NilaiTemuan', 'PIC', 'KodeTemuan', 'KodeSubTemuan'].forEach(k => { fd[k] = orig[k] == null ? '' : orig[k]; });
    fd.isSubAdd = false;
    fd.parentRow = '';
    if (!fd.RencanaAksi) { showToast('Uraian Rencana Aksi (Renaksi) wajib diisi', 'err'); return; }
    if (!fd.JadwalPelaksanaan) { showToast('Target Jadwal Pelaksanaan wajib diisi', 'err'); return; }
  } else {
    if (!judulTemuan) { showToast('Judul / Uraian Temuan atau Kondisi wajib diisi', 'err'); return; }
    if (!fd.PIC) { showToast('Pilih minimal 1 PIC penanggung jawab', 'err'); return; }
  }

  const row = document.getElementById('m-row').value;
  const btn = document.querySelector('.modal-footer-area .btn-action-pri');

  if (btn) {
    btn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width:16px;"></i> Menyimpan...';
    btn.disabled = true;
    refreshIcons();
  }

  const apiCall = row
    ? apiFetch('/api/temuan/' + row, 'PUT', fd)
    : apiFetch('/api/temuan', 'POST', fd);

  apiCall
    .then(res => {
      if (res && res.success) {
        if (fd.No) S.riOpen['t:' + fd.No] = true;
        closeModal();
        showToast(row ? 'Temuan berhasil diperbarui' : 'Temuan baru berhasil disimpan', 'ok');
        refreshCurrentPage();
      } else {
        showToast((res && res.message) ? res.message : 'Gagal menyimpan data', 'err');
      }
    })
    .catch(e => showToast('Error: ' + e.message, 'err'))
    .finally(() => {
      if (btn) {
        btn.innerHTML = '<span id="m-save-lbl">Simpan</span>';
        btn.disabled = false;
      }
    });
}

// ═══ TEMUAN: HAPUS ═════════════════════════════════════════════════════

// Tombol Hapus dipasang di riSubHtml (khusus admin). Hanya admin yang boleh menghapus (dicek juga di server). executeDelete juga dipasang di
// core.js pada tombol "Ya, Hapus", sebelumnya fungsi ini belum ada sehingga memunculkan error di console.
let _delRow = null;

function openDelete(row, isParent, subCount) {
  if (!isAdminUser()) return;
  _delRow = row;
  const t = document.getElementById('conf-title');
  const p = document.getElementById('conf-text');
  if (t && p) {
    if (isParent) {
      t.textContent = 'Hapus Temuan Ini?';
      p.textContent = subCount > 0
        ? 'Temuan beserta ' + subCount + ' sub temuan di dalamnya, termasuk bukti tindak lanjut, akan dihapus permanen.'
        : 'Temuan beserta bukti tindak lanjutnya akan dihapus permanen.';
    } else {
      t.textContent = 'Hapus Sub Temuan Ini?';
      p.textContent = 'Sub temuan beserta bukti tindak lanjutnya akan dihapus permanen.';
    }
  }
  document.getElementById('conf-bg')?.classList.add('open');
  refreshIcons();
}

function closeConf() {
  _delRow = null;
  document.getElementById('conf-bg')?.classList.remove('open');
}

function executeDelete() {
  if (!_delRow) return;
  const id = _delRow;
  const btn = document.getElementById('btn-conf-ok');
  if (btn) btn.disabled = true;
  apiFetch('/api/temuan/' + id, 'DELETE')
    .then(res => {
      if (res && res.success) {
        closeConf();
        showToast('Data berhasil dihapus', 'ok');
        refreshCurrentPage();
      } else {
        showToast((res && res.message) ? res.message : 'Gagal menghapus data', 'err');
      }
    })
    .catch(e => showToast('Error: ' + e.message, 'err'))
    .finally(() => { if (btn) btn.disabled = false; });
}