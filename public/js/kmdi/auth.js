function doLogin() {
  const uEl = document.getElementById('lg-user');
  const pEl = document.getElementById('lg-pass');
  const err = document.getElementById('login-err');
  const btn = document.getElementById('btn-login');
  if (!uEl || !pEl || !btn) return;

  const u = uEl.value.trim();
  const p = pEl.value;

  if (err) err.style.display = 'none';
  if (!u || !p) {
    if (err) {
      err.textContent = 'Username dan password wajib diisi.';
      err.style.display = 'block';
    }
    return;
  }

  btn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width:18px;height:18px;"></i> Signing in...';
  btn.disabled = true;
  refreshIcons();

  apiFetch('/api/auth/login', 'POST', { username: u, password: p })
    .then(res => {
      btn.innerHTML = '<i data-lucide="log-in" style="width:18px;height:18px;"></i> Sign In';
      btn.disabled = false;
      refreshIcons();

      if (res && res.success) {
        S.user = res.user;
        enterApp();
      } else {
        if (err) {
          err.textContent = (res && res.message) ? res.message : 'Login gagal. Periksa kembali akun Anda.';
          err.style.display = 'block';
        }
      }
    })
    .catch(e => {
      btn.innerHTML = '<i data-lucide="log-in" style="width:18px;height:18px;"></i> Sign In';
      btn.disabled = false;
      refreshIcons();
      if (err) {
        err.textContent = 'Error koneksi server: ' + e.message;
        err.style.display = 'block';
      }
    });
}

function doLogout() {
  apiFetch('/api/auth/logout', 'POST').finally(() => {
    S.user = null;
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('login-view').style.display = 'flex';
    document.getElementById('lg-user').value = '';
    document.getElementById('lg-pass').value = '';
  });
}

function enterApp() {
  document.getElementById('login-view').style.display = 'none';
  document.getElementById('app-container').style.display = 'block';
  applyResponsiveMode();

  const initial = (S.user.nama || S.user.username || '?').charAt(0).toUpperCase();
  document.getElementById('sb-av').textContent      = initial;
  document.getElementById('sb-uname').textContent   = S.user.nama || S.user.username;
  document.getElementById('sb-urole').textContent   = isAdminUser() ? 'ADMINISTRATOR' : 'PIC UNIT';
  document.getElementById('hdr-avatar').textContent = initial;

  apiFetch('/api/pic')
    .then(list => {
      S.picList = list || [];
      navigate('dashboard');
    })
    .catch(e => {
      // Jangan biarkan halaman menggantung kalau /api/pic gagal
      S.picList = [];
      showToast('Gagal memuat daftar PIC: ' + e.message, 'err');
      navigate('dashboard');
    });
}

// ── PILIH ATAU KETIK PENGGUNA (halaman login) ───────────────────────
// Daftar cadangan: dipakai kalau /api/users/list tidak bisa diakses sebelum login (401)
const LOGIN_USERS_FALLBACK = [
  { username: 'admin',     nama: 'Administrator',                                              role: 'admin' },
  { username: 'Biro MKDI', nama: 'Biro Manajemen Kinerja Data dan Informasi',                  role: 'pic' },
  { username: 'Biro HKS',  nama: 'Biro Hukum dan Kerjasama',                                   role: 'pic' },
  { username: 'Biro SDMO', nama: 'Biro Sumber Daya Manusia dan Organisasi',                    role: 'pic' },
  { username: 'Biro UHM',  nama: 'Biro Umum dan Hubungan Masyarakat',                          role: 'pic' },
  { username: 'Biro KBMN', nama: 'Biro Keuangan dan BMN',                                      role: 'pic' },
  { username: 'Deputi 1',  nama: 'Deputi Bidang Koordinasi Tata Niaga dan Distribusi Pangan',  role: 'pic' },
  { username: 'Deputi 2',  nama: 'Deputi Bidang Koordinasi Usaha Pangan dan Pertanian',        role: 'pic' },
  { username: 'Deputi 3',  nama: 'Deputi Bidang Koordinasi Keterjangkauan dan Keamanan Pangan', role: 'pic' },
  { username: 'Deputi 4',  nama: 'Deputi Bidang Koordinasi Sumber Daya Maritim',               role: 'pic' },
];
let _loginUsers = LOGIN_USERS_FALLBACK.slice();
let _comboIdx = -1;
let _comboItems = [];

function loadLoginUsers() {
  apiFetch('/api/users/list').then(list => {
    if (Array.isArray(list) && list.length) {
      _loginUsers = list.map(u => ({ username: u.username, nama: u.nama || u.username, role: u.role }));
    }
  }).catch(() => {});
}

function isUserComboOpen() {
  const l = document.getElementById('user-combo-list');
  return !!l && l.style.display !== 'none';
}

function renderUserCombo() {
  const input = document.getElementById('lg-user');
  const list  = document.getElementById('user-combo-list');
  if (!input || !list) return;

  const q = _picNormKey(input.value);
  const exact = _loginUsers.some(u => _picNormKey(u.username) === q);   // sudah terpilih -> tampilkan semua
  _comboItems = (!q || exact)
    ? _loginUsers.slice()
    : _loginUsers.filter(u => _picNormKey(u.username).includes(q) || _picNormKey(u.nama).includes(q));

  list.innerHTML = _comboItems.map((u, i) => {
    const admin = roleOf(u) === 'admin';
    return `
      <div class="combo-item${i === _comboIdx ? ' active' : ''}" role="option" data-user="${esc(u.username)}">
        <div class="combo-avatar">${esc((u.username || '?').charAt(0).toUpperCase())}</div>
        <div class="combo-text">
          <div class="cu-name">${esc(u.username)}</div>
          <div class="cu-sub">${esc(u.nama || '')}</div>
        </div>
        <span class="cu-badge${admin ? ' admin' : ''}">${admin ? 'Admin' : 'PIC'}</span>
      </div>`;
  }).join('') || '<div class="combo-empty">Tidak ada di daftar. Anda tetap bisa mengetik manual.</div>';
}

function openUserCombo() {
  const list = document.getElementById('user-combo-list');
  const wrap = document.getElementById('user-combo');
  if (!list) return;
  renderUserCombo();
  list.style.display = 'block';
  wrap?.classList.add('open');
}

function closeUserCombo() {
  const list = document.getElementById('user-combo-list');
  const wrap = document.getElementById('user-combo');
  if (list) list.style.display = 'none';
  wrap?.classList.remove('open');
  _comboIdx = -1;
}

function toggleUserCombo() {
  if (isUserComboOpen()) { closeUserCombo(); return; }
  document.getElementById('lg-user')?.focus();
  _comboIdx = -1;
  openUserCombo();
}

function pickUser(username) {
  const input = document.getElementById('lg-user');
  if (input) input.value = username;
  closeUserCombo();
  const err = document.getElementById('login-err');
  if (err) err.style.display = 'none';
  document.getElementById('lg-pass')?.focus();
}

function initUserCombo() {
  const input = document.getElementById('lg-user');
  const list  = document.getElementById('user-combo-list');
  if (!input || !list) return;

  input.addEventListener('focus', () => { _comboIdx = -1; openUserCombo(); });
  input.addEventListener('click', () => { if (!isUserComboOpen()) { _comboIdx = -1; openUserCombo(); } });
  input.addEventListener('input', () => { _comboIdx = -1; openUserCombo(); });

  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isUserComboOpen()) openUserCombo();
      if (!_comboItems.length) return;
      _comboIdx = e.key === 'ArrowDown'
        ? Math.min(_comboIdx + 1, _comboItems.length - 1)
        : Math.max(_comboIdx - 1, 0);
      renderUserCombo();
      list.children[_comboIdx]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && isUserComboOpen() && _comboIdx >= 0 && _comboItems[_comboIdx]) {
      e.preventDefault();
      e.stopImmediatePropagation();          // jangan langsung login, cukup pilih user
      pickUser(_comboItems[_comboIdx].username);
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      closeUserCombo();
    }
  });

  // pilih dengan klik (mousedown supaya terjadi sebelum input kehilangan fokus)
  list.addEventListener('mousedown', e => {
    const it = e.target.closest('.combo-item');
    if (!it) return;
    e.preventDefault();
    pickUser(it.dataset.user);
  });

  document.addEventListener('mousedown', e => {
    const wrap = document.getElementById('user-combo');
    if (wrap && !wrap.contains(e.target)) closeUserCombo();
  });
}

// ══════════════════ NAVIGASI ═════════════════════════════════════
function toggleSidebar(open) {
  document.getElementById('sidebar')?.classList.toggle('open', open);
  document.getElementById('sb-overlay')?.classList.toggle('show', open);
}

function setActiveNav(id) {
  document.querySelectorAll('.nav-item').forEach(e => e.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}

function navigate(page, arg) {
  toggleSidebar(false);
  S.page = page;

  if (page === 'dashboard') {
    setActiveNav('nav-dashboard');
    loadDashboard();
  } else if (page === 'ruang-isian') {
    setActiveNav('nav-ruang-isian');
    loadRuangIsian(arg || '');
  } else if (page === 'rekap') {
    setActiveNav('nav-rekap');
    loadRekap();
  }
}
