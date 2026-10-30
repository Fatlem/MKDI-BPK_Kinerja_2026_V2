/* ruang-isian.js - halaman RUANG ISIAN > Temuan / Sub Temuan
   Isi file (urut):
     1. Bersama   : label, filter, kartu rincian, tabel   (juga dipakai detail.js)
     2. Temuan    : LIHAT  ->  TAMBAH & UBAH  ->  HAPUS
   Halaman Detail ada di detail.js, unggah bukti di bukti.js. */

// ═══ BERSAMA: state & label ════════════════════════════════════════════

if (!S.riOpen) S.riOpen = {};

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

// ═══ BERSAMA: filter (Sumber / Unit PIC / cari) ════════════════════════

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

  // Tombol Hapus: hanya admin. Baris utama (bukan sub) = menghapus seluruh temuan beserta sub temuannya.
  const delBtn = (opts.readOnly || !isAdminUser()) ? '' : `
          <button class="btn-action-sec ri-btn ri-btn-del" onclick="openDelete(${sub._row}, ${sub.isSubRow ? 'false' : 'true'}, ${Math.max((total || 1) - 1, 0)})"><i data-lucide="trash-2" style="width:13px;" class="icon-plain"></i> Hapus</button>`;

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
          </span>${tlPill(sub.TLStatus || 'belum')}${buktiBtn}${buttons}${delBtn}
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

// ═══ BERSAMA: tabel temuan & chip PIC ══════════════════════════════════

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
          <span class="rounded-md bg-blue-50 px-2.5 py-1 text-[12px] font-bold tracking-wide text-blue-600">${esc(parent.No) || '-'}</span>
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

// ═══ BERSAMA: muat ulang halaman ═══════════════════════════════════════

function refreshCurrentPage() {
  if (S.page === 'ruang-isian') loadRuangIsian(S.riFilter || '');
  else if (S.page === 'ruang-isian-detail') loadDetail(S.riFilter || '');
  else if (S.page === 'rekap') loadRekap();
  else loadDashboard();
}

// ═══ TEMUAN: LIHAT ═════════════════════════════════════════════════════

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
  const jenisEl = document.getElementById('m-jenis');
  if (jenisEl) jenisEl.value = '';

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
      if (jenisEl) jenisEl.value = r.JenisAudit || '';
    }
  } else {
    setSumberField('inspektorat', false);
    onSumberChange();
  }

  // Jenis audit: hanya sisi auditor/admin, dan hanya pada temuan induk (sub temuan mengikuti induk)
  const jw = document.getElementById('m-jenis-wrap');
  if (jw) jw.style.display = (isPicUser() || (r && r.isSubRow)) ? 'none' : '';
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
  const jwSub = document.getElementById('m-jenis-wrap');
  if (jwSub) jwSub.style.display = 'none';          // sub temuan mengikuti jenis audit induknya

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
    Kondisi: keep('Kondisi'),
    Kriteria: keep('Kriteria'),
    Sebab: keep('Sebab'),
    Akibat: keep('Akibat'),
    Rekomendasi: keep('Rekomendasi'),
    RencanaAksi: document.getElementById('m-rencanaaksi').value.trim(),
    JadwalPelaksanaan: document.getElementById('m-jadwal').value.trim(),
    Output: raw,
    isSubAdd: isSub,
    parentRow: document.getElementById('m-parent-row').value,
  };

  const jenisSel = document.getElementById('m-jenis');
  if (jenisSel && !isPicUser() && !isSub && !(origRow && origRow.isSubRow)) fd.JenisAudit = jenisSel.value;

  if (isPicUser()) {
    const rowId = document.getElementById('m-row').value;
    const orig = rowId ? S.allR.find(x => String(x._row) === String(rowId)) : null;
    if (!orig) { showToast('Akun PIC hanya dapat mengisi temuan yang ditugaskan kepadanya', 'err'); return; }
    ['No', 'Temuan', 'SubTemuan', 'Kondisi', 'Kriteria', 'Sebab', 'Akibat', 'Rekomendasi', 'PIC'].forEach(k => { fd[k] = orig[k] == null ? '' : orig[k]; });
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