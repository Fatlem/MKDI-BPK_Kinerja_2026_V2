const S = { 
  user: null, 
  page: 'dashboard', 
  riFilter: '', 
  allR: [], 
  picList: [], 
  csrf: '' 
};

let chartBar = null, chartDonut = null;

const PIC_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#be185d', '#65a30d'];
function picColor(i) { return PIC_COLORS[i % PIC_COLORS.length]; }

async function apiFetch(url, method = 'GET', data = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': S.csrf },
    credentials: 'same-origin',
  };
  if (data) opts.body = JSON.stringify(data);
  const res = await fetch(url, opts);

  // Sesi habis saat sedang memakai aplikasi -> kembali ke halaman login
  if (res.status === 401 && S.user && !url.includes('/auth/')) {
    S.user = null;
    showLogin();
    showToast('Sesi berakhir. Silakan login kembali.', 'err');
  }

  const ct  = res.headers.get('content-type');
  if (!ct || !ct.includes('application/json')) {
    throw new Error('Server error ' + res.status + '. Periksa log Laravel.');
  }
  const json = await res.json();
  if (res.status >= 500) {
    const msg = (json && json.message) ? String(json.message).slice(0, 220) : ('Server error ' + res.status);
    throw new Error(msg);
  }
  return json;
}

function startClock() {
  const days   = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  
  function tick() {
    const now = new Date();
    const d = document.getElementById('hdr-date');
    const t = document.getElementById('hdr-time');
    if (d) d.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    if (t) t.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;
  }
  tick(); 
  setInterval(tick, 20000);
}

function togglePassVis() {
  const inp  = document.getElementById('lg-pass');
  const icon = document.getElementById('pass-eye-icon');
  if (!inp || !icon) return;
  const show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  icon.setAttribute('data-lucide', show ? 'eye-off' : 'eye');
  refreshIcons();
}

// ── RESPONSIVE MODE ──────────────────────────────────────────────
function applyResponsiveMode() {
  const isMobile = window.innerWidth <= 768;
  document.body.classList.toggle('is-mobile', isMobile);
  if (!isMobile) {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sb-overlay')?.classList.remove('show');
  }
}
window.addEventListener('resize', applyResponsiveMode);

function refreshIcons() {
  setTimeout(() => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }, 50);
}

function setBody(html) {
  document.getElementById('page-body').innerHTML = html;
}

function loadingHtml() {
  return '<div style="text-align:center;padding:80px;color:var(--text-muted)"><i data-lucide="loader-2" class="spin" style="width:32px;height:32px;margin-bottom:12px;"></i><div style="font-weight:600">Memuat Data...</div></div>';
}

function esc(s) {
  return (s == null ? '' : String(s)).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[c]));
}

function jsq(s) {
  return (s == null ? '' : String(s)).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function showToast(msg, type = 'inf') {
  const t = document.getElementById('toast');
  if (!t) return;
  const icons = { ok: 'check-circle-2', err: 'alert-circle', inf: 'info' };
  t.innerHTML = `<i data-lucide="${icons[type] || 'info'}" style="width:18px;"></i> <span>${esc(msg)}</span>`;
  t.className = 'toast-msg show';
  refreshIcons();
  
  setTimeout(() => {
    t.className = 'toast-msg';
  }, 3200);
}

const PIC_SEP = ', ';
const PIC_EXTRA = [
  { username: 'Deputi 4',                      nama: 'Deputi Bidang Koordinasi Sumber Daya Maritim' },
  { username: 'Staf Ahli Bidang Konektivitas', nama: 'Staf Ahli Bidang Konektivitas' },
];

function splitPics(s) {
  return String(s == null ? '' : s).split(/\s*[,;\n]\s*/).map(x => x.trim()).filter(Boolean);
}

function allPicOptions() {
  const have = new Set();
  (S.picList || []).forEach(p => { have.add(_picNormKey(p.username)); have.add(_picNormKey(p.nama)); });
  return (S.picList || []).concat(PIC_EXTRA.filter(e => !have.has(_picNormKey(e.username)) && !have.has(_picNormKey(e.nama))));
}

function picKeyOf(token) {
  const t = _picNormKey(token);
  const p = allPicOptions().find(x => _picNormKey(x.username) === t || _picNormKey(x.nama) === t);
  return p ? _picNormKey(p.username) : t;
}

function picNama(token) {
  const k = picKeyOf(token);
  const p = allPicOptions().find(x => _picNormKey(x.username) === k);
  return p ? p.nama : token;
}

function hasPic(tokens, key) {
  const k = picKeyOf(key);
  return tokens.some(t => picKeyOf(t) === k);
}

function groupPicTokens(items) {
  const seen = {}, out = [];
  items.forEach(i => splitPics(i.PIC).forEach(t => {
    const k = picKeyOf(t);
    if (!seen[k]) { seen[k] = 1; out.push(t); }
  }));
  return out;
}
function groupPicNames(items) { return groupPicTokens(items).map(picNama); }

// ── HAK AKSES ──────────────────────────────────────────────────────────
// Admin (Inspektorat) : mengisi kolom A–G  (No, Temuan, Sub Temuan, Kriteria, Sebab, Rekomendasi, PIC)
// PIC (akun masing2)  : hanya mengisi kolom H–J (Rencana Aksi, Jadwal Pelaksanaan, Output) + status
const ADMIN_ONLY_FIELDS = ['m-no', 'm-temuan', 'm-subtemuan', 'm-kriteria', 'm-sebab', 'm-rekomendasi'];

function roleOf(u) { return String((u && u.role) || '').trim().toLowerCase(); }
function isPicUser() { return roleOf(S.user) === 'pic'; }
function isAdminUser() { return roleOf(S.user) === 'admin'; }

// Apakah baris ini ditugaskan ke user yang sedang login? (cocokkan username / nama PIC)
function isMyRow(r) {
  const u = S.user || {};
  const mine = new Set([_picNormKey(u.username), _picNormKey(u.nama), picKeyOf(u.username), picKeyOf(u.nama)].filter(Boolean));
  return splitPics(r.PIC).some(t => mine.has(_picNormKey(t)) || mine.has(picKeyOf(t)));
}

// Akun PIC hanya melihat temuan yang ditugaskan kepadanya
function scopeRows(rows) { return isPicUser() ? (rows || []).filter(isMyRow) : (rows || []); }

// Normalisasi kunci PIC (huruf kecil, tanpa spasi tepi)
function _picNormKey(s) { return String(s || '').trim().toLowerCase(); }

// ══════════════════ HELPER STATUS TEMUAN ════════════════════════
// Tag status ([Selesai] / [Proses] / [Belum]) disimpan di dalam kolom Output.
// Regex ini dipakai untuk membuang tag saat ditampilkan / diedit / diekspor.
const STATUS_TAG_RE = /\s*\[(selesai|proses|belum)\]/gi;

function cleanOutput(s) {
  return String(s == null ? '' : s).replace(STATUS_TAG_RE, '').trim();
}

function statusOf(r) {
  const out = String(r.Output || '').trim().toLowerCase();
  const rec = String(r.RencanaAksi || '').trim();
  const jad = String(r.JadwalPelaksanaan || '').trim();

  // 1) Tag eksplisit dari dropdown status selalu menang
  if (out.includes('[selesai]')) return { cls: 'pill-ok',    lbl: 'Selesai', icon: 'check-circle' };
  if (out.includes('[proses]'))  return { cls: 'pill-prog',  lbl: 'Proses',  icon: 'clock' };
  if (out.includes('[belum]'))   return { cls: 'pill-empty', lbl: 'Belum',   icon: 'minus-circle' };

  // 2) Data lama / hasil import tanpa tag: tebak dari isi kolom
  if (out !== '')                return { cls: 'pill-ok',    lbl: 'Selesai', icon: 'check-circle' };
  if (rec !== '' || jad !== '')  return { cls: 'pill-prog',  lbl: 'Proses',  icon: 'clock' };
  return { cls: 'pill-empty', lbl: 'Belum', icon: 'minus-circle' };
}

window.addEventListener('DOMContentLoaded', () => {
  S.csrf = document.querySelector('meta[name="csrf-token"]')?.content ?? '';
  initUserCombo();  
  refreshIcons();
  loadLoginUsers();
  restoreSession();          // cek sesi server: kalau masih login, langsung masuk ke halaman URL saat ini
  applyResponsiveMode();
  startClock();

  // Enter di form login ditangani oleh <form onsubmit>, jadi tidak perlu listener keydown di sini.

  const btnConf = document.getElementById('btn-conf-ok');
  if (btnConf) {
    btnConf.addEventListener('click', executeDelete);
  }
});