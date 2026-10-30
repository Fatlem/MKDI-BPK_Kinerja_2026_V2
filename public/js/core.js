const S = { 
  user: null, 
  page: 'dashboard', 
  riFilter: '', 
  allR: [], 
  picList: [], 
  csrf: '' 
};

let chartBar = null, chartDonut = null;

const PIC_COLORS = ['#334155', '#475569', '#64748b', '#94a3b8', '#1e293b', '#374151', '#0f172a', '#52525b'];
function picColor(i) { return PIC_COLORS[i % PIC_COLORS.length]; }

async function apiFetch(url, method = 'GET', data = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': S.csrf },
    credentials: 'same-origin',
  };
  if (data) opts.body = JSON.stringify(data);
  const res = await fetch(url, opts);

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

  // Tambahan: PIC yang muncul di data temuan otomatis masuk daftar PIC
  if (method === 'GET' && url.split('?')[0] === '/api/temuan' && Array.isArray(json)) {
    syncPicList(json);
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
const PIC_EXTRA = [];  // D4 & SABK now in DB via seeder

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

// ── Nama PIC singkat (untuk tampilan tabel/chip supaya tidak numpuk) ───────────
// Tambah / ubah singkatan di sini. Kunci = nama lengkap huruf kecil.
// PIC yang tidak ada di daftar ini disingkat otomatis (Biro/Deputi + inisial kata).
const PIC_SHORT = {
  'biro manajemen kinerja data dan informasi':                    'Biro MKDI',
  'biro hukum dan kerjasama':                                     'Biro HK',
  'biro sumber daya manusia dan organisasi':                      'Biro SDMO',
  'biro umum dan hubungan masyarakat':                            'Biro UHM',
  'biro keuangan dan bmn':                                        'Biro KBMN',
  'deputi bidang koordinasi tata niaga dan distribusi pangan':    'Deputi TNDP',
  'deputi bidang koordinasi usaha pangan dan pertanian':          'Deputi UPP',
  'deputi bidang koordinasi keterjangkauan dan keamanan pangan':  'Deputi KKP',
  'deputi bidang koordinasi sumber daya maritim':                 'Deputi SDM',
  'staf ahli bidang konektivitas':                                'Sahli Konektivitas',
  'inspektorat':                                                   'Itjen',
};

function picShort(nama) {
  const n = String(nama == null ? '' : nama).trim().replace(/\s+/g, ' ');
  if (!n) return n;
  const hit = PIC_SHORT[n.toLowerCase()];
  if (hit) return hit;
  if (n.length <= 16) return n;
  const m = n.match(/^(Biro|Deputi|Staf Ahli|Asisten Deputi|Sekretariat|Pusat)\b\s*(?:Bidang\s+)?(?:Koordinasi\s+)?(.*)$/i);
  if (!m || !m[2]) return n;
  const words = m[2].split(' ').filter(w => !/^(dan|&|serta|atau|dalam|untuk|pada|di)$/i.test(w));
  if (words.length < 2) return n;
  return m[1] + ' ' + words.map(w => (/^[A-Z0-9]{2,5}$/.test(w) ? w : w[0].toUpperCase())).join('');
}
function groupPicShort(items) { return groupPicNames(items).map(picShort); }

// Masukkan PIC yang ada di data temuan tapi belum ada di daftar PIC (misalnya yang diketik manual)
function syncPicList(rows) {
  if (!Array.isArray(S.picList)) S.picList = [];
  (rows || []).forEach(r => {
    splitPics(r.PIC).forEach(token => {
      const k = _picNormKey(token);
      const known = allPicOptions().some(p => _picNormKey(p.username) === k || _picNormKey(p.nama) === k);
      if (!known) S.picList.push({ username: token, nama: token });
    });
  });
}

const ADMIN_ONLY_FIELDS = ['m-no', 'm-temuan', 'm-subtemuan', 'm-kriteria', 'm-sebab', 'm-akibat', 'm-rekomendasi'];

function roleOf(u) { return String((u && u.role) || '').trim().toLowerCase(); }
function isPicUser() { return roleOf(S.user) === 'pic'; }
function isAdminUser() { return roleOf(S.user) === 'admin'; }
function isAuditorUser() { return roleOf(S.user) === 'auditor'; }
// Sisi Inspektorat (admin atau auditor) = lawan dari akun PIC/biro
function isStaffUser() { return isAdminUser() || isAuditorUser(); }

// Sumber audit temuan
const SUMBER_LABEL = { bpk: 'BPK RI', inspektorat: 'Inspektorat' };
function sumberLabel(r) { return (r && (r.SumberLabel || SUMBER_LABEL[r.Sumber])) || ''; }

// Status tindak lanjut (alur kerja biro -> auditor), dikirim server di r.TLStatus
const TL_STATUS = {
  belum:         { cls: 'bk-st-kosong',        icon: 'minus-circle',   lbl: 'Belum Ada Bukti' },
  menunggu:      { cls: 'bk-st-menunggu',      icon: 'clock',          lbl: 'Menunggu Verifikasi' },
  pending:       { cls: 'bk-st-pending',       icon: 'pause-circle',   lbl: 'Pending (Ditahan Auditor)' },
  ditolak:       { cls: 'bk-st-ditolak',       icon: 'alert-triangle', lbl: 'Ditolak - Perlu Perbaikan' },
  terverifikasi: { cls: 'bk-st-terverifikasi', icon: 'badge-check',    lbl: 'Terverifikasi - Menunggu BATL' },
  batl:          { cls: 'bk-st-batl',          icon: 'file-check-2',   lbl: 'Selesai - BATL Terbit' }
};
function tlPill(key) {
  const t = TL_STATUS[key] || TL_STATUS.belum;
  return `<span class="bk-pill ${t.cls}"><i data-lucide="${t.icon}"></i> ${t.lbl}</span>`;
}

function isMyRow(r) {
  const u = S.user || {};
  const mine = new Set([_picNormKey(u.username), _picNormKey(u.nama), picKeyOf(u.username), picKeyOf(u.nama)].filter(Boolean));
  return splitPics(r.PIC).some(t => mine.has(_picNormKey(t)) || mine.has(picKeyOf(t)));
}

function scopeRows(rows) { return isPicUser() ? (rows || []).filter(isMyRow) : (rows || []); }

// Daftar tahun untuk filter/ekspor: semua tahun yang ada di data + tahun berjalan
// (jadi tahun baru otomatis muncul), diurutkan dari yang terbaru.
function tahunOptions(rows) {
  const set = new Set((rows || []).map(r => String(r.Tahun || '')).filter(Boolean));
  set.add(String(new Date().getFullYear()));
  return Array.from(set).sort((a, b) => Number(b) - Number(a));
}

function _picNormKey(s) { return String(s || '').trim().toLowerCase(); }

// ── Format tampilan: tanggal (Y-m-d) & rupiah ─────────────────────────
function fmtTanggal(ymd) {
  const m = String(ymd || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtRupiah(n) {
  if (n == null || n === '') return '';
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}
// Selisih hari dari hari ini ke tanggal Y-m-d (negatif = sudah lewat)
function daysUntil(ymd) {
  const m = String(ymd || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const t = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.round((t - now.getTime()) / 86400000);
}

const STATUS_TAG_RE = /\s*\[(selesai|proses|belum)\]/gi;

function cleanOutput(s) {
  return String(s == null ? '' : s).replace(STATUS_TAG_RE, '').trim();
}

function statusOf(r) {
  const out = String(r.Output || '').trim().toLowerCase();
  const rec = String(r.RencanaAksi || '').trim();
  const jad = String(r.JadwalPelaksanaan || '').trim();

  // Alur kerja: selesai hanya jika auditor sudah menerbitkan BATL
  if (r.TLStatus === 'batl')
    return { cls: 'pill-ok',   lbl: 'Selesai', icon: 'check-circle' };
  // Sudah ada bukti yang dikirim (menunggu / pending / ditolak / terverifikasi) = dalam proses
  if (r.TLStatus && r.TLStatus !== 'belum')
    return { cls: 'pill-prog', lbl: 'Proses',  icon: 'clock' };

  // Data lama (sebelum ada alur bukti & BATL) yang masih memakai tag [Selesai]/[Proses]/[Belum]
  if (out.includes('[selesai]')) return { cls: 'pill-ok',    lbl: 'Selesai', icon: 'check-circle' };
  if (out.includes('[proses]'))  return { cls: 'pill-prog',  lbl: 'Proses',  icon: 'clock' };
  if (out.includes('[belum]'))   return { cls: 'pill-empty', lbl: 'Belum',   icon: 'minus-circle' };

  if (rec !== '' || jad !== '' || out !== '') return { cls: 'pill-prog', lbl: 'Proses', icon: 'clock' };
  return { cls: 'pill-empty', lbl: 'Belum', icon: 'minus-circle' };
}

window.addEventListener('DOMContentLoaded', () => {
  S.csrf = document.querySelector('meta[name="csrf-token"]')?.content ?? '';
  initUserCombo();  
  refreshIcons();
  loadLoginUsers();
  restoreSession();        
  applyResponsiveMode();
  startClock();

  const btnConf = document.getElementById('btn-conf-ok');
  if (btnConf) {
    btnConf.addEventListener('click', executeDelete);
  }
});