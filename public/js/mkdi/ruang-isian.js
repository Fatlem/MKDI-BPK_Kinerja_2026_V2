/* mkdi/ruang-isian.js - RUANG ISIAN, DETAIL, form tambah/edit (modal), simpan, dan filter */

if (!S.riOpen) S.riOpen = {};

// ── Penamaan rincian ──────────────────────────────────────────────────
function sumberBadge(r) {
  const l = sumberLabel(r);
  return l ? `<span class="sumber-badge sumber-${esc(r.Sumber || 'bpk')}">${esc(l)}</span>` : '';
}

function subLabel(total, idx) { return total > 1 ? 'Sub Temuan #' + (idx + 1) : 'Rincian Temuan'; }
function subCountLabel(n)     { return n > 1 ? n + ' Sub Temuan' : '1 Rincian Temuan'; }

function loadRuangIsian(picFilter) {
  document.getElementById('hdr-title').textContent = 'Ruang Isian';
  document.getElementById('hdr-sub').textContent   = isPicUser() ? 'Isi tindak lanjut untuk temuan yang ditugaskan kepada Anda' : 'Tambah atau ubah data tindak lanjut';
  setBody(loadingHtml());
  refreshIcons();

  apiFetch('/api/temuan')
    .then(rows => {
      S.allR = scopeRows(rows);
      S.riFilter = picFilter || '';
      renderRuangIsian(S.allR);
    })
    .catch(() => showToast('Gagal memuat data dari server', 'err'));
}

// ══════ Filter chip Sumber / Unit PIC / Kata Kunci (Filter Tahun Dihapus) ══════
function riFilterChips(prefix, handler, picOpts) {
  const optSumber = Object.keys(SUMBER_LABEL).map(k => `<option value="${esc(k)}" ${S.riSumber === k ? 'selected' : ''}>${esc(SUMBER_LABEL[k])}</option>`).join('');
  return `
    <div class="flt-chip">
      <i data-lucide="search" class="flt-ico icon-plain"></i>
      <input type="text" id="${prefix}-flt-q" value="${esc(S.riQ || '')}" placeholder="Cari sumber / temuan..." class="flt-search-input" onkeyup="if(event.key==='Enter') ${handler}()">
    </div>
    <label class="flt-chip">
      <i data-lucide="shield" class="flt-ico icon-plain"></i><span class="flt-lbl">Sumber:</span>
      <select id="${prefix}-flt-sumber" onchange="${handler}()"><option value="">Semua Sumber</option>${optSumber}</select>
    </label>
    <label class="flt-chip flt-chip-pic">
      <i data-lucide="building-2" class="flt-ico icon-plain"></i><span class="flt-lbl">Unit PIC:</span>
      <select id="${prefix}-flt-pic" onchange="${handler}()" ${isPicUser() ? 'disabled' : ''}><option value="">Semua PIC</option>${picOpts}</select>
    </label>`;
}

function riApplyFilters(rows) {
  const q = (S.riQ || '').toLowerCase().trim();
  return (rows || []).filter(r => {
    const matchPic    = !S.riFilter || hasPic(splitPics(r.PIC), S.riFilter);
    const matchSumber = !S.riSumber || (r.Sumber || 'bpk') === S.riSumber;
    
    // Pencarian Teks pada Sumber & Uraian Temuan
    const txtSumber   = String(r.SumberLabel || r.Sumber || '').toLowerCase();
    const txtTemuan   = String(r.Temuan || '').toLowerCase();
    const txtSub      = String(r.SubTemuan || '').toLowerCase();
    const matchQ      = !q || txtSumber.includes(q) || txtTemuan.includes(q) || txtSub.includes(q);

    return matchPic && matchSumber && matchQ;
  });
}

function riReadFilters(prefix) {
  const v = id => (document.getElementById(`${prefix}-flt-${id}`) || {}).value || '';
  S.riFilter = v('pic');
  S.riSumber = v('sumber');
  S.riQ      = v('q');
}

function renderRuangIsian(rows) {
  const picOpts = allPicOptions().map(p => `<option value="${esc(p.username)}" ${S.riFilter === p.username ? 'selected' : ''}>${esc(p.nama)}</option>`).join('');

  setBody(`
    <div class="hero-banner">
      <h2 class="hero-title">Ruang Isian Tindak Lanjut</h2>
      <p class="hero-sub">${isPicUser() ? 'Isi Rencana Aksi, Jadwal Pelaksanaan, dan Output untuk temuan yang ditugaskan kepada Anda' : 'Kelola temuan hasil audit (Inspektorat / BPK RI), verifikasi bukti tindak lanjut, dan terbitkan BATL'}</p>
    </div>

    <div class="toolbar-wrap">
      ${isPicUser() ? '' : '<button class="btn-action-pri" onclick="openModal()"><i data-lucide="plus" style="width:16px;"></i> Tambah Temuan Baru</button>'}
      ${riFilterChips('ri', 'filterRuangIsian', picOpts)}
      <span style="margin-left:auto;font-size:12px;color:var(--text-muted);" id="ri-count"></span>
    </div>

    <div id="entry-list"></div>
  `);

  renderEntryList();
}

function filterRuangIsian() {
  riReadFilters('ri');
  renderEntryList();
}

// ══════════════════ TAMPILAN RINCIAN ═══════════════════
const RI_CARDS = [
  { key: 'Kriteria',    title: 'Kriteria',     icon: 'target',         cls: 'blue'   },
  { key: 'Sebab',       title: 'Sebab',        icon: 'lightbulb',      cls: 'green'  },
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

// Tombol Hapus ditiadakan
function riSubHtml(sub, idx, canAdmin, total, opts) {
  opts = opts || {};
  const st = statusOf(sub);
  const picsFull = groupPicNames([sub]).join(', ') || '-';
  const pics = groupPicShort([sub]).join(', ') || '-';

  const buktiBtn = typeof openBukti === 'function'
    ? `<button class="btn-action-sec ri-btn ri-btn-bukti" onclick="openBukti(${sub._row})"><i data-lucide="paperclip" style="width:13px;" class="icon-plain"></i> Bukti${sub.BuktiCount ? ` <span class="bk-count">${sub.BuktiCount}</span>` : ''}</button>`
    : '';

  const buttons = opts.readOnly ? '' : `
          <button class="btn-action-sec ri-btn" onclick="openModal('${esc(jsq(sub.PIC))}',${sub._row})"><i data-lucide="edit-3" style="width:13px;" class="icon-plain"></i> Ubah</button>`;

  return `
    <div class="ri-sub">
      <div class="ri-sub-head">
        <div class="ri-sub-title">
          <div class="ri-sub-titletext">
            <strong>${subLabel(total || 1, idx)}${sub.SubTemuan ? ' - ' + esc(sub.SubTemuan) : ''}</strong>
            <div class="ri-sub-meta">
              <span title="${esc(picsFull)}"><i data-lucide="users" class="icon-plain"></i> ${esc(pics)}</span>
            </div>
          </div>
        </div>
        <div class="ri-sub-actions">
          <span class="status-pill ${st.cls}">
            <i data-lucide="${st.icon}" style="width:12px;" class="icon-plain"></i> ${st.lbl.toUpperCase()}
          </span>${tlPill(sub.TLStatus || 'belum')}${buktiBtn}${buttons}
        </div>
      </div>

      ${riSubBodyHtml(sub)}
    </div>`;
}

function riSubBodyHtml(sub) {
  const secs = parseOutputSections(sub.Output);
  return `
      <div class="ri-grid">
        ${RI_CARDS.map(c => riCard(c.cls, c.icon, c.title, riListHtml(parseList(sub[c.key]), ''))).join('')}
      </div>

      ${riOutputCard(secs)}
      ${riJadwalCard(sub.JadwalPelaksanaan)}`;
}

// ══════════════════ TABEL TEMUAN ═══════════════════
const RI_PIC_MAX = 3;
const RI_ICON_USERS = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="icon-plain"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';

function riPicChips(pics) {
  if (!pics.length) return '<span class="text-[11px] text-slate-400">-</span>';
  const cls = 'inline-flex items-center whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600';
  const shown = pics.slice(0, RI_PIC_MAX).map(n => `<span class="${cls}" title="${esc(n)}">${esc(picShort(n))}</span>`).join('');
  const rest = pics.slice(RI_PIC_MAX);
  const more = rest.length
    ? `<button type="button" class="pic-more" aria-label="${rest.length} PIC lainnya" title="${esc(rest.join(', '))}" data-pics="${esc(pics.join('|'))}" onclick="picMoreToggle(event,this)">${RI_ICON_USERS}<span>+${rest.length}</span></button>`
    : '';
  return `<div class="flex flex-wrap items-center gap-1.5">${shown}${more}</div>`;
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
  pop.innerHTML = `<div class="pic-pop-title">Semua PIC (${names.length})</div>` +
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
  const showAct = !!cfg.canAdmin;
  const cols = showAct ? 6 : 5;
  const th = 'px-3 py-3 text-left';

  const body = Object.keys(groups).map(noKey => {
    const items = groups[noKey];
    const parent = items[0];
    const key = cfg.prefix + ':' + noKey;
    const open = !!S.riOpen[key];

    return `
      <tr data-key="${esc(key)}" onclick="togTblRow(this)"
        class="cursor-pointer align-top transition-colors hover:bg-slate-50 ${open ? 'bg-slate-50' : ''}">
        <td class="border-b border-slate-100 py-4 pl-4 pr-1">
          <span class="rk-chev flex items-center text-slate-400" style="transition:transform .2s;transform:rotate(${open ? 180 : 0}deg);">
            <i data-lucide="chevron-down" style="width:18px;height:18px;" class="icon-plain"></i>
          </span>
        </td>
        <td class="whitespace-nowrap border-b border-slate-100 px-3 py-4">
          <span class="rounded-md bg-slate-100 px-2.5 py-1 text-[12px] font-bold tracking-wide text-slate-700">${esc(parent.No) || '-'}</span>
        </td>
        <td class="whitespace-nowrap border-b border-slate-100 px-3 py-4">${sumberBadge(parent) || '<span class="text-slate-400">-</span>'}</td>
        <td class="border-b border-slate-100 px-3 py-4">
          <div class="whitespace-pre-line break-words text-[13.5px] font-semibold leading-snug text-slate-900">${esc(parent.Temuan) || '—'}</div>
          <div class="mt-1 text-[11.5px] text-slate-500">${subCountLabel(items.length)}</div>
        </td>
        <td class="border-b border-slate-100 px-3 py-4">${riPicChips(groupPicNames(items))}</td>
        ${showAct ? `<td class="whitespace-nowrap border-b border-slate-100 px-4 py-4 text-right">${cfg.action(noKey, items)}</td>` : ''}
      </tr>
      <tr style="display:${open ? 'table-row' : 'none'};">
        <td colspan="${cols}" class="border-b border-slate-200 bg-slate-50 p-4 max-[768px]:p-3">${cfg.inner(items)}</td>
      </tr>`;
  }).join('');

  return `
    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[820px] border-collapse">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th class="w-10 py-3 pl-4 pr-1"></th>
              <th class="${th} w-[150px]">Nomor</th>
              <th class="${th} w-[110px]">Sumber</th>
              <th class="${th}">Temuan</th>
              <th class="${th} w-[300px]">PIC</th>
              ${showAct ? '<th class="w-[190px] px-4 py-3 text-right">Aksi</th>' : ''}
            </tr>
          </thead>
          <tbody class="[&>tr:last-child>td]:border-b-0">${body}</tbody>
        </table>
      </div>
    </div>`;
}

function togTblRow(tr) {
  const detail = tr.nextElementSibling;
  if (!detail) return;
  const open = detail.style.display === 'none';
  detail.style.display = open ? 'table-row' : 'none';
  tr.classList.toggle('bg-slate-50', open);
  const chev = tr.querySelector('.rk-chev');
  if (chev) chev.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
  const key = tr.dataset ? tr.dataset.key : '';
  if (key) S.riOpen[key] = open;
}

function renderEntryList() {
  const filteredRows = riApplyFilters(S.allR);
  const list = document.getElementById('entry-list');
  const canAdmin = !isPicUser();
  
  if (!filteredRows.length) {
    list.innerHTML = `
      <div style="text-align:center;padding:60px;background:#fff;border-radius:var(--r-xl);border:1.5px dashed var(--border-color);">
        <i data-lucide="folder-open" style="width:40px;height:40px;color:var(--text-muted);margin-bottom:8px;" class="icon-plain"></i>
        <h4 style="font-weight:700">Data Tidak Ditemukan</h4>
        <p style="font-size:12px;color:var(--text-muted)">Coba ubah kata kunci pencarian atau filter sumber.</p>
      </div>`;
    const cnt = document.getElementById('ri-count');
    if (cnt) cnt.textContent = '';
    refreshIcons();
    return;
  }

  const groups = {};
  filteredRows.forEach(r => {
    const k = String(r.No || '0');
    if (!groups[k]) groups[k] = [];
    groups[k].push(r);
  });

  document.getElementById('ri-count').textContent = `${Object.keys(groups).length} Temuan Utama (${filteredRows.length} Rincian)`;
  
  list.innerHTML = riTableHtml(groups, {
    prefix: 't',
    canAdmin,
    action: (noKey, items) => `<button class="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400" onclick="event.stopPropagation(); openAddSubModal(${items[items.length - 1]._row})">
        <i data-lucide="plus-circle" style="width:14px;height:14px;" class="icon-plain"></i> Tambah Sub Temuan
      </button>`,
    inner: items => items.map((sub, idx) => riSubHtml(sub, idx, canAdmin, items.length)).join('')
  });
  refreshIcons();
}

// ══════════════════ HALAMAN DETAIL ═══════════════════════════════
const DET_FIELDS = [
  { key: 'Kriteria',    label: 'Kriteria',    icon: 'target',         cls: 'blue'   },
  { key: 'Sebab',       label: 'Sebab',        icon: 'lightbulb',      cls: 'green'  },
  { key: 'Rekomendasi', label: 'Rekomendasi', icon: 'clipboard-list', cls: 'purple' }
];

function loadDetail(picFilter) {
  document.getElementById('hdr-title').textContent = 'Detail';
  document.getElementById('hdr-sub').textContent   = isPicUser() ? 'Kriteria, sebab, dan rekomendasi dari temuan yang ditugaskan kepada Anda' : 'Isi dan kelola kriteria, sebab, dan rekomendasi tiap temuan';
  setBody(loadingHtml());
  refreshIcons();

  apiFetch('/api/temuan')
    .then(rows => {
      S.allR = scopeRows(rows);
      S.riFilter = picFilter || '';
      renderDetail();
    })
    .catch(() => showToast('Gagal memuat data dari server', 'err'));
}

function renderDetail() {
  const picOpts = allPicOptions().map(p => `<option value="${esc(p.username)}" ${S.riFilter === p.username ? 'selected' : ''}>${esc(p.nama)}</option>`).join('');

  setBody(`
    <div class="hero-banner">
      <h2 class="hero-title">Detail Temuan</h2>
      <p class="hero-sub">${isPicUser() ? 'Lihat kriteria, sebab, dan rekomendasi dari temuan yang ditugaskan kepada Anda' : 'Tambah atau ubah kriteria, sebab, dan rekomendasi untuk setiap rincian temuan'}</p>
    </div>

    <div class="toolbar-wrap">
      ${isPicUser() ? '' : '<button class="btn-action-pri" onclick="openDetAdd(\'\', \'\', \'Kriteria\')"><i data-lucide="plus" style="width:16px;"></i> Tambah Detail</button>'}
      ${riFilterChips('det', 'filterDetail', picOpts)}
      <span style="margin-left:auto;font-size:12px;color:var(--text-muted);" id="det-count"></span>
    </div>

    <div id="det-list"></div>
  `);

  renderDetailList();
}

function filterDetail() {
  riReadFilters('det');
  renderDetailList();
}

function detCard(f, r, canAdmin) {
  const body = riListHtml(parseList(r[f.key]), '') || '<div class="ri-empty">Belum diisi</div>';
  const add = canAdmin
    ? `<button class="ri-card-add" title="Tambah ${f.label}" onclick="openDetAdd('', '${esc(r._row)}', '${f.key}')"><i data-lucide="plus" style="width:14px;height:14px;" class="icon-plain"></i></button>`
    : '';
  return `
    <div class="ri-card ri-${f.cls}">
      <div class="ri-card-head"><i data-lucide="${f.icon}" class="icon-plain"></i><span>${f.label}</span>${add}</div>
      <div class="ri-card-body">${body}</div>
    </div>`;
}

function detRowHtml(r, idx, canAdmin, total) {
  return `
    <div class="ri-sub">
      <div class="ri-sub-head">
        <div class="ri-sub-title">
          <div class="ri-sub-titletext">
            <strong>${subLabel(total || 1, idx)}${r.SubTemuan ? ' - ' + esc(r.SubTemuan) : ''}</strong>
            <div class="ri-sub-meta"><span title="${esc(groupPicNames([r]).join(', ') || '-')}"><i data-lucide="users" class="icon-plain"></i> ${esc(groupPicShort([r]).join(', ') || '-')}</span></div>
          </div>
        </div>
        ${canAdmin ? `<div class="ri-sub-actions">
          <button class="btn-action-sec ri-btn" onclick="openDetEdit('${esc(r._row)}')"><i data-lucide="edit-3" style="width:13px;" class="icon-plain"></i> Ubah</button>
        </div>` : ''}
      </div>
      <div class="det-grid">
        ${DET_FIELDS.map(f => detCard(f, r, canAdmin)).join('')}
      </div>
    </div>`;
}

function renderDetailList() {
  const rows = riApplyFilters(S.allR);
  const list = document.getElementById('det-list');
  const cnt  = document.getElementById('det-count');
  const canAdmin = !isPicUser();
  if (!list) return;

  if (!rows.length) {
    list.innerHTML = `
      <div style="text-align:center;padding:60px;background:#fff;border-radius:var(--r-xl);border:1.5px dashed var(--border-color);">
        <i data-lucide="file-text" style="width:40px;height:40px;color:var(--text-muted);margin-bottom:8px;" class="icon-plain"></i>
        <h4 style="font-weight:700">Data Tidak Ditemukan</h4>
        <p style="font-size:12px;color:var(--text-muted)">Coba sesuaikan pencarian atau tambahkan temuan baru.</p>
      </div>`;
    if (cnt) cnt.textContent = '';
    refreshIcons();
    return;
  }

  const groups = {};
  rows.forEach(r => {
    const k = String(r.No || '0');
    if (!groups[k]) groups[k] = [];
    groups[k].push(r);
  });
  if (cnt) cnt.textContent = `${Object.keys(groups).length} Temuan (${rows.length} Rincian)`;

  list.innerHTML = riTableHtml(groups, {
    prefix: 'd',
    canAdmin,
    action: (noKey) => `<button class="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400" onclick="event.stopPropagation(); openDetAdd('${esc(noKey)}', '', 'Kriteria')">
        <i data-lucide="plus-circle" style="width:14px;height:14px;" class="icon-plain"></i> Tambah Detail
      </button>`,
    inner: items => items.map((r, idx) => detRowHtml(r, idx, canAdmin, items.length)).join('')
  });
  refreshIcons();
}

// ── Modal Detail ──────────────────────────
function ensureDetModal() {
  if (document.getElementById('det-bg')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div id="det-bg" class="modal-backdrop" onclick="closeDetModalBg(event)">
      <div class="modal-window" style="max-width:600px;">
        <div class="modal-header-area">
          <div>
            <div id="det-title" class="modal-title-text">Tambah Detail</div>
            <div id="det-sub" style="font-size:12px;color:var(--text-muted)"></div>
          </div>
          <button class="modal-close-btn" onclick="closeDetModal()"><i data-lucide="x" style="width:18px;height:18px;" class="icon-plain"></i></button>
        </div>

        <div class="modal-body-area">
          <div id="det-add-sec">
            <div class="form-field">
              <label>Jenis</label>
              <select id="det-field">
                <option value="Kriteria">Kriteria</option>
                <option value="Sebab">Sebab</option>
                <option value="Rekomendasi">Rekomendasi</option>
              </select>
            </div>
            <div class="form-field" id="det-temuan-wrap">
              <label>Temuan</label>
              <select id="det-temuan" onchange="renderDetRincian()"></select>
            </div>
            <div class="form-field">
              <label>Tambahkan ke Rincian</label>
              <div id="det-rincian" class="pic-check-list"></div>
              <div class="field-hint">Isian akan ditulis ke rincian yang dicentang.</div>
            </div>
            <div class="form-field">
              <label>Isi Baru</label>
              <textarea id="det-text" placeholder="Tulis isi baru. Satu butir per baris jika lebih dari satu."></textarea>
            </div>
          </div>

          <div id="det-edit-sec" style="display:none;">
            <div class="form-field"><label>Kriteria</label><textarea id="det-e-Kriteria" placeholder="Kriteria/dasar aturan"></textarea></div>
            <div class="form-field"><label>Sebab</label><textarea id="det-e-Sebab" placeholder="Penyebab temuan"></textarea></div>
            <div class="form-field"><label>Rekomendasi</label><textarea id="det-e-Rekomendasi" placeholder="Rekomendasi"></textarea></div>
          </div>
        </div>

        <div class="modal-footer-area">
          <button class="btn-action-sec" onclick="closeDetModal()">Batal</button>
          <button id="det-save" class="btn-action-pri" onclick="saveDetail()"><i data-lucide="save" style="width:16px;height:16px;" class="icon-plain"></i> Simpan</button>
        </div>
      </div>
    </div>`);
}

function renderDetRincian(preset) {
  let rows = preset;
  if (!rows) {
    const no = document.getElementById('det-temuan').value;
    rows = S.allR.filter(r => String(r.No) === String(no));
  }
  document.getElementById('det-rincian').innerHTML = rows.map(r => {
    const grp = S.allR.filter(x => String(x.No) === String(r.No));
    const label = subLabel(grp.length, Math.max(0, grp.indexOf(r)));
    return `
    <label class="pic-check-item">
      <input type="checkbox" value="${esc(r._row)}" checked>
      <span>${label}${r.SubTemuan ? ' - ' + esc(riShort(r.SubTemuan, 60)) : ''} &middot; ${esc(groupPicNames([r]).join(', ') || '-')}</span>
    </label>`;
  }).join('');
}

function openDetAdd(no, rowId, field) {
  if (isPicUser()) return;
  ensureDetModal();
  _det = { mode: 'add', rowId: null };

  _detPreset = null;
  if (rowId) {
    const r = S.allR.find(x => String(x._row) === String(rowId));
    if (r) _detPreset = [r];
  } else if (no) {
    _detPreset = S.allR.filter(r => String(r.No) === String(no));
  }

  document.getElementById('det-title').textContent = 'Tambah Detail';
  document.getElementById('det-add-sec').style.display = '';
  document.getElementById('det-edit-sec').style.display = 'none';
  document.getElementById('det-field').value = field || 'Kriteria';
  document.getElementById('det-text').value = '';

  const wrap = document.getElementById('det-temuan-wrap');
  if (_detPreset && _detPreset.length) {
    wrap.style.display = 'none';
    document.getElementById('det-sub').textContent = 'Pilih jenis isian, lalu tulis isinya';
    renderDetRincian(_detPreset);
  } else {
    wrap.style.display = '';
    document.getElementById('det-sub').textContent = 'Pilih temuan dan jenis isian, lalu tulis isinya';
    const seen = {};
    const nos = [];
    S.allR.forEach(r => {
      const k = String(r.No);
      if (!seen[k]) { seen[k] = r; nos.push(k); }
    });
    document.getElementById('det-temuan').innerHTML = nos.map(k =>
      `<option value="${esc(k)}">Temuan ${esc(k)} - ${esc(riShort(seen[k].Temuan, 80))}</option>`).join('');
    renderDetRincian();
  }

  document.getElementById('det-bg').classList.add('open');
  refreshIcons();
}

function openDetEdit(rowId) {
  if (isPicUser()) return;
  const r = S.allR.find(x => String(x._row) === String(rowId));
  if (!r) return;
  ensureDetModal();
  _det = { mode: 'edit', rowId: rowId };

  document.getElementById('det-title').textContent = 'Ubah Detail';
  document.getElementById('det-sub').textContent = 'Temuan ' + (r.No || '-') + (r.SubTemuan ? ' - ' + riShort(r.SubTemuan, 70) : '');
  document.getElementById('det-add-sec').style.display = 'none';
  document.getElementById('det-edit-sec').style.display = '';
  DET_FIELDS.forEach(f => { document.getElementById('det-e-' + f.key).value = r[f.key] == null ? '' : r[f.key]; });

  document.getElementById('det-bg').classList.add('open');
  refreshIcons();
}

function closeDetModal() {
  const bg = document.getElementById('det-bg');
  if (bg) bg.classList.remove('open');
}
function closeDetModalBg(e) {
  if (e.target === document.getElementById('det-bg')) closeDetModal();
}

async function saveDetail() {
  const btn = document.getElementById('det-save');
  const btnHtml = '<i data-lucide="save" style="width:16px;height:16px;" class="icon-plain"></i> Simpan';
  const setBusy = busy => {
    btn.disabled = busy;
    btn.innerHTML = busy ? '<i data-lucide="loader-2" class="spin" style="width:16px;"></i> Menyimpan...' : btnHtml;
    refreshIcons();
  };

  if (_det.mode === 'edit') {
    const r = S.allR.find(x => String(x._row) === String(_det.rowId));
    if (!r) { showToast('Data tidak ditemukan', 'err'); return; }
    const over = {};
    DET_FIELDS.forEach(f => { over[f.key] = document.getElementById('det-e-' + f.key).value.trim(); });

    setBusy(true);
    try {
      const resp = await apiFetch('/api/temuan/' + r._row, 'PUT', rowToPayload(r, over));
      if (!resp || !resp.success) throw new Error((resp && resp.message) ? resp.message : 'Gagal menyimpan detail');
      S.riOpen['d:' + r.No] = true;
      closeDetModal();
      showToast('Detail berhasil diperbarui', 'ok');
      refreshCurrentPage();
    } catch (e) {
      showToast('Error: ' + e.message, 'err');
    }
    setBusy(false);
    return;
  }

  const field = document.getElementById('det-field').value;
  const items = parseNewItems(document.getElementById('det-text').value);
  if (!items.length) { showToast('Tulis isi yang akan ditambahkan', 'err'); return; }

  const ids = Array.from(document.querySelectorAll('#det-rincian input[type="checkbox"]:checked')).map(i => String(i.value));
  if (!ids.length) { showToast('Pilih minimal 1 rincian', 'err'); return; }
  const rows = S.allR.filter(r => ids.includes(String(r._row)));

  setBusy(true);
  let ok = 0;
  let failed = null;
  for (const r of rows) {
    const res = appendItems(r[field], items);
    if (!res.added) continue;
    try {
      const over = {};
      over[field] = res.text;
      const resp = await apiFetch('/api/temuan/' + r._row, 'PUT', rowToPayload(r, over));
      if (!resp || !resp.success) throw new Error((resp && resp.message) ? resp.message : 'Gagal menyimpan detail');
      S.riOpen['d:' + r.No] = true;
      ok++;
    } catch (e) {
      failed = e;
      break;
    }
  }
  setBusy(false);

  if (failed) {
    showToast('Error: ' + failed.message, 'err');
    if (ok) refreshCurrentPage();
    return;
  }
  closeDetModal();
  if (ok) {
    showToast(field + ' ditambahkan ke ' + ok + ' rincian', 'ok');
    refreshCurrentPage();
  } else {
    showToast('Isi tersebut sudah ada di rincian yang dipilih', 'inf');
  }
}

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

function applyModalRole() {
  const pic = isPicUser();
  ADMIN_ONLY_FIELDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (!pic && id === 'm-temuan') { el.classList.remove('field-locked'); return; }
    el.readOnly = pic;
    el.classList.toggle('field-locked', pic);
  });

  const noEl = document.getElementById('m-no');
  if (noEl) noEl.readOnly = true;
  const sw = document.getElementById('m-sumber-wrap');
  if (sw) sw.style.display = pic ? 'none' : '';

  const list = document.getElementById('m-pic');
  if (list) {
    list.classList.toggle('field-locked', pic);
    list.querySelectorAll('input[type="checkbox"]').forEach(i => { i.disabled = pic; });
  }
  const manual = document.querySelector('.pic-manual');
  if (manual) manual.style.display = pic ? 'none' : '';
  const note = document.getElementById('m-role-note');
  if (note) note.style.display = pic ? 'block' : 'none';

  const picFields = document.getElementById('m-pic-fields');
  if (picFields) picFields.style.display = pic ? '' : 'none';

  if (pic) {
    document.getElementById('modal-title').textContent = 'Isi Tindak Lanjut';
    document.getElementById('modal-sub').textContent   = 'Anda mengisi Rencana Aksi, Jadwal Pelaksanaan, dan Output';
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
    .then(n => { no.value = n; })
    .catch(() => { no.value = ''; showToast('Gagal mengambil kode temuan', 'err'); });
}

function openModal(pic, row) {
  document.getElementById('m-row').value = '';
  document.getElementById('m-parent-row').value = '';
  document.getElementById('m-is-sub').value = 'false';

  document.getElementById('modal-title').textContent = row ? 'Edit Tindak Lanjut' : 'Tambah Temuan Baru';
  document.getElementById('modal-sub').textContent   = row ? 'Perbarui data tindak lanjut' : 'Lengkapi isian data temuan hasil audit berikut';

  const temuanInp = document.getElementById('m-temuan');
  temuanInp.readOnly = false;
  temuanInp.style.background = '#f8fafc';

  ['m-no', 'm-temuan', 'm-subtemuan', 'm-rencanaaksi', 'm-jadwal', 'm-output'].forEach(id => {
    document.getElementById(id).value = '';
  });

  const r = row ? S.allR.find(x => String(x._row) === String(row)) : null;
  renderPicChecklist(r ? splitPics(r.PIC) : (pic ? splitPics(pic) : []));
  applyModalRole();
  document.getElementById('modal-bg').classList.add('open');

  if (row) {
    document.getElementById('m-row').value = row;
    if (r) {
      document.getElementById('m-no').value           = r.No || '';
      document.getElementById('m-temuan').value       = r.Temuan || '';
      document.getElementById('m-subtemuan').value    = r.SubTemuan || '';
      document.getElementById('m-rencanaaksi').value  = r.RencanaAksi || '';
      document.getElementById('m-jadwal').value       = r.JadwalPelaksanaan || '';
      document.getElementById('m-output').value       = cleanOutput(r.Output);
      setSumberField(r.Sumber || 'bpk', true);
    }
  } else {
    setSumberField('inspektorat', false);
    onSumberChange();
  }
}

function openAddSubModal(row) {
  const r = S.allR.find(x => String(x._row) === String(row));
  if (!r) return;

  document.getElementById('m-row').value = '';
  document.getElementById('m-parent-row').value = row;
  document.getElementById('m-is-sub').value = 'true';

  document.getElementById('modal-title').textContent = 'Tambah Sub Temuan';
  document.getElementById('modal-sub').textContent   = 'Menambahkan sub temuan untuk Temuan No. ' + r.No;

  document.getElementById('m-no').value = r.No || '';
  setSumberField(r.Sumber || 'bpk', true);
  const temuanInp = document.getElementById('m-temuan');
  temuanInp.value = r.Temuan || '';
  temuanInp.readOnly = true;
  temuanInp.style.background = '#eef2ff';

  renderPicChecklist(splitPics(r.PIC));
  applyModalRole();

  ['m-subtemuan', 'm-rencanaaksi', 'm-jadwal', 'm-output'].forEach(id => {
    document.getElementById(id).value = '';
  });

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

  const fd = {
    No: document.getElementById('m-no').value,
    Sumber: (document.getElementById('m-sumber') || {}).value || 'bpk',
    PIC: getSelectedPics().join(PIC_SEP),
    Temuan: document.getElementById('m-temuan').value.trim(),
    SubTemuan: document.getElementById('m-subtemuan').value.trim(),
    Kriteria: keep('Kriteria'),
    Sebab: keep('Sebab'),
    Rekomendasi: keep('Rekomendasi'),
    RencanaAksi: document.getElementById('m-rencanaaksi').value.trim(),
    JadwalPelaksanaan: document.getElementById('m-jadwal').value.trim(),
    Output: raw,
    isSubAdd: isSub,
    parentRow: document.getElementById('m-parent-row').value,
  };

  if (isPicUser()) {
    const rowId = document.getElementById('m-row').value;
    const orig = rowId ? S.allR.find(x => String(x._row) === String(rowId)) : null;
    if (!orig) { showToast('Akun PIC hanya dapat mengisi temuan yang ditugaskan kepadanya', 'err'); return; }
    ['No', 'Temuan', 'SubTemuan', 'Kriteria', 'Sebab', 'Rekomendasi', 'PIC'].forEach(k => { fd[k] = orig[k] == null ? '' : orig[k]; });
    fd.isSubAdd = false;
    fd.parentRow = '';
  }

  if (!fd.Temuan) { showToast('Uraian Temuan wajib diisi', 'err'); return; }
  if (!fd.PIC) { showToast('Pilih minimal 1 PIC', 'err'); return; }

  const row = document.getElementById('m-row').value;
  const btn = document.querySelector('.modal-footer-area .btn-action-pri');

  if (btn) {
    btn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width:16px;"></i> Menyimpan...';
    btn.disabled = true;
    refreshIcons();
  }

  const url = row ? '/api/temuan/' + row : '/api/temuan';
  const method = row ? 'PUT' : 'POST';

  apiFetch(url, method, fd)
    .then(res => {
      if (btn) {
        btn.innerHTML = '<i data-lucide="save" style="width:16px"></i> Simpan Data';
        btn.disabled = false;
      }
      if (res && res.success) {
        if (fd.No) S.riOpen['t:' + fd.No] = true;
        closeModal();
        showToast('Data berhasil disimpan!', 'ok');
        refreshCurrentPage();
      } else {
        showToast((res && res.message) ? res.message : 'Gagal menyimpan data', 'err');
      }
    })
    .catch(e => {
      if (btn) {
        btn.innerHTML = '<i data-lucide="save" style="width:16px"></i> Simpan Data';
        btn.disabled = false;
      }
      showToast('Error: ' + e.message, 'err');
    });
}

function refreshCurrentPage() {
  if (S.page === 'ruang-isian') loadRuangIsian(S.riFilter || '');
  else if (S.page === 'ruang-isian-detail') loadDetail(S.riFilter || '');
  else if (S.page === 'rekap') loadRekap();
  else loadDashboard();
}