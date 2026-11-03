/* ═══════════════════════════════════════════════════════════════
   deadline.js — Countdown batas waktu tindak lanjut (real-time)

   Dibangun DI ATAS getDeadlineInfo() di core.js (aturan 60 hari kalender);
   logika lama tidak diubah. Batas waktu = akhir hari tenggat (23:59:59 WIB).

   API:
     dlLive(info, opts)   -> pill ringkas untuk tabel/daftar   ("8 hr 14:03:22")
     dlPanel(info, opts)  -> panel besar (hari/jam/menit/detik + bar progres)
     dlNearest(list)      -> {info,start,done,label} tenggat aktif terdekat
   opts: { start: TanggalInput, done: boolean (paksa status tuntas) }

   Satu ticker 1 detik untuk seluruh halaman; berhenti saat tab tersembunyi.
   ═══════════════════════════════════════════════════════════════ */
const DL = { TZ: '+07:00', WARN_DAYS: 14, URGENT_DAYS: 3, SPAN_DAYS: 60, DAY: 86400000 };

const DL_ICON = {
  timer: '<circle cx="12" cy="14" r="8"/><path d="M10 2h4M12 14l3-3"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
  check: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
};
const dlSvg = (k) =>
  `<svg class="dl-ico dl-ico-${k}" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${DL_ICON[k]}</svg>`;

const dlPad = (n) => String(n).padStart(2, '0');

/** Akhir hari tenggat (WIB) dalam ms. */
function dlDueMs(info) {
  const ymd = info.deadlineDate.toISOString().slice(0, 10);
  return Date.parse(`${ymd}T23:59:59${DL.TZ}`);
}

/** Awal masa 60 hari (00:00 WIB tanggal input); fallback: due - 60 hari. */
function dlStartMs(raw, dueMs) {
  const ymd = raw ? String(raw).slice(0, 10) : '';
  const t = /^\d{4}-\d{2}-\d{2}$/.test(ymd) ? Date.parse(`${ymd}T00:00:00${DL.TZ}`) : NaN;
  return isNaN(t) ? dueMs - DL.SPAN_DAYS * DL.DAY : t;
}

/** Hitung semua nilai tampilan dari (due, start, done, now) — dipakai render & ticker. */
function dlCompute(dueMs, startMs, done, now) {
  const rem = dueMs - now;
  const abs = Math.abs(rem);
  const d = Math.floor(abs / DL.DAY);
  const h = Math.floor((abs % DL.DAY) / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  const s = Math.floor((abs % 60000) / 1000);
  let state = 'ok';
  if (done) state = 'done';
  else if (rem < 0) state = 'over';
  else if (rem <= DL.URGENT_DAYS * DL.DAY) state = 'urgent';
  else if (rem <= DL.WARN_DAYS * DL.DAY) state = 'warn';

  const clock = `${dlPad(h)}:${dlPad(m)}:${dlPad(s)}`;
  const core = d > 0 ? `${d} hr ${clock}` : clock;
  const text = state === 'done' ? 'Tuntas' : state === 'over' ? `Lewat ${core}` : core;
  const chip = state === 'done' ? 'Tuntas'
    : state === 'over' ? (d > 0 ? `Lewat ${d} hari` : 'Baru terlewat')
    : (d > 0 ? `Sisa ${d} hari` : 'Sisa < 1 hari');
  const span = Math.max(dueMs - startMs, DL.DAY);
  const pct = state === 'done' ? 100 : Math.min(100, Math.max(0, Math.round(((now - startMs) / span) * 100)));
  const dayNo = Math.min(DL.SPAN_DAYS, Math.max(1, Math.floor((now - startMs) / DL.DAY) + 1));
  const aria = state === 'done' ? 'Tindak lanjut tuntas'
    : state === 'over' ? `Terlambat ${d} hari ${h} jam ${m} menit`
    : `Sisa waktu ${d} hari ${h} jam ${m} menit`;
  return { state, d, h, m, s, text, chip, pct, dayNo, aria };
}

function dlIconFor(state) { return state === 'done' ? 'check' : state === 'over' ? 'alert' : 'timer'; }

/** Pill ringkas. */
function dlLive(info, opts = {}) {
  const due = dlDueMs(info);
  const done = opts.done != null ? !!opts.done : !!info.isTuntas;
  const c = dlCompute(due, dlStartMs(opts.start, due), done, Date.now());
  return `<span class="dl dl--${c.state}" role="timer" aria-label="${c.aria}" data-dl-due="${due}" data-dl-done="${done ? 1 : 0}">`
    + `${dlSvg(dlIconFor(c.state))}<span class="dl-txt" data-dl-txt>${c.text}</span></span>`;
}

/** Panel besar. */
function dlPanel(info, opts = {}) {
  const due = dlDueMs(info);
  const start = dlStartMs(opts.start, due);
  const done = opts.done != null ? !!opts.done : !!info.isTuntas;
  const c = dlCompute(due, start, done, Date.now());
  const dueLbl = new Date(due).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
  const tile = (k, v, l) => `<div class="dl-tile"><b data-dl-${k}>${dlPad(v)}</b><span>${l}</span></div>`;
  const tiles = done ? '' : `<div class="dl-tiles">${tile('d', c.d, 'hari')}${tile('h', c.h, 'jam')}${tile('m', c.m, 'menit')}${tile('s', c.s, 'detik')}</div>`;
  return `<div class="dl-panel dl--${c.state}" role="timer" aria-label="${c.aria}" data-dl-due="${due}" data-dl-start="${start}" data-dl-done="${done ? 1 : 0}">`
    + `<div class="dl-panel-head"><span class="dl-panel-title">${dlSvg(dlIconFor(c.state))}Batas waktu tindak lanjut</span><span class="dl-chip" data-dl-chip>${c.chip}</span></div>`
    + tiles
    + `<div class="dl-bar" aria-hidden="true"><i data-dl-bar style="width:${c.pct}%"></i></div>`
    + `<div class="dl-foot"><span data-dl-day>${done ? 'Selesai dalam batas waktu' : `Hari ke-${c.dayNo} dari ${DL.SPAN_DAYS}`}</span><span>${dueLbl} · 23:59 WIB</span></div></div>`;
}

/** Tenggat aktif terdekat (belum tuntas). Jika semua sudah lewat → yang paling lama terlambat. */
function dlNearest(list) {
  const act = list.filter((x) => !x.done);
  if (!act.length) return null;
  const now = Date.now();
  const upcoming = act.filter((x) => dlDueMs(x.info) >= now).sort((a, b) => dlDueMs(a.info) - dlDueMs(b.info));
  return upcoming[0] || act.sort((a, b) => dlDueMs(a.info) - dlDueMs(b.info))[0];
}

/* ── Ticker tunggal ── */
function dlApply(el, now) {
  if (el.dataset.dlDone === '1') return;
  const due = Number(el.dataset.dlDue);
  const c = dlCompute(due, Number(el.dataset.dlStart) || due - DL.SPAN_DAYS * DL.DAY, false, now);
  const prev = el.dataset.dlState;
  if (prev !== c.state) {
    el.className = el.className.replace(/\bdl--\w+/, `dl--${c.state}`);
    el.dataset.dlState = c.state;
    const ico = el.querySelector('.dl-ico');
    if (ico) ico.outerHTML = dlSvg(dlIconFor(c.state));
  }
  const q = (k) => el.querySelector(`[data-dl-${k}]`);
  const txt = q('txt'); if (txt) txt.textContent = c.text;
  const set = (k, v) => { const n = q(k); if (n) n.textContent = dlPad(v); };
  set('d', c.d); set('h', c.h); set('m', c.m); set('s', c.s);
  const chip = q('chip'); if (chip) chip.textContent = c.chip;
  const bar = q('bar'); if (bar) bar.style.width = c.pct + '%';
  const day = q('day'); if (day) day.textContent = `Hari ke-${c.dayNo} dari ${DL.SPAN_DAYS}`;
  if (c.s === 0 || !el.getAttribute('aria-label')) el.setAttribute('aria-label', c.aria); // lisan: cukup per menit
}

function dlTick() {
  if (document.hidden) return;
  const now = Date.now();
  document.querySelectorAll('[data-dl-due]').forEach((el) => dlApply(el, now));
}
setInterval(dlTick, 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) dlTick(); });
