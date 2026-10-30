/* notifikasi.js - lonceng notifikasi di header.
   Alur "Biro" (diagram): Satker menerima notifikasi temuan baru lalu hasil verifikasi bukti;
   auditor menerima notifikasi bukti baru yang menunggu verifikasi.
   Data dari GET /api/notifikasi. Status "sudah dibaca" disimpan di browser (per akun). */

const NOTIF_POLL_MS = 60000;
let _notif = { list: [], timer: null, open: false, seenAtOpen: '' };

const NOTIF_TYPE = {
  temuan_baru: { icon: 'inbox',          cls: 'n-blue'   },
  bukti_baru:  { icon: 'file-up',        cls: 'n-blue'   },
  acc:         { icon: 'badge-check',    cls: 'n-green'  },
  pending:     { icon: 'pause-circle',   cls: 'n-amber'  },
  ditolak:     { icon: 'alert-triangle', cls: 'n-red'    },
  batl:        { icon: 'file-check-2',   cls: 'n-purple' }
};

function _notifKey() { return 'etlhp_notif_seen_' + String((S.user && S.user.username) || ''); }
function _notifSeen() { try { return localStorage.getItem(_notifKey()) || ''; } catch (e) { return ''; } }
function _notifSetSeen(iso) { try { localStorage.setItem(_notifKey(), iso); } catch (e) {} }
function _notifUnread() { const seen = _notifSeen(); return _notif.list.filter(n => !seen || n.waktu > seen); }

function _notifAgo(iso) {
  const t = new Date(iso).getTime();
  if (!t) return '';
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return 'Baru saja';
  if (m < 60) return m + ' menit lalu';
  const h = Math.floor(m / 60);
  if (h < 24) return h + ' jam lalu';
  const d = Math.floor(h / 24);
  if (d < 30) return d + ' hari lalu';
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function renderNotifBadge() {
  const b = document.getElementById('notif-badge');
  if (!b) return;
  const n = _notifUnread().length;
  b.style.display = n > 0 ? 'flex' : 'none';
  b.textContent = n > 99 ? '99+' : String(n);
}

function renderNotifList() {
  const box = document.getElementById('notif-list');
  if (!box) return;
  if (!_notif.list.length) {
    box.innerHTML = '<div class="notif-empty">Belum ada notifikasi.</div>';
    return;
  }
  const seen = _notif.open ? _notif.seenAtOpen : _notifSeen();
  box.innerHTML = _notif.list.map(n => {
    const t = NOTIF_TYPE[n.tipe] || NOTIF_TYPE.temuan_baru;
    const unread = !seen || n.waktu > seen;
    return `
      <div class="notif-item ${unread ? 'unread' : ''}" onclick="notifOpenItem(${Number(n.row)})">
        <div class="notif-ico ${t.cls}"><i data-lucide="${t.icon}"></i></div>
        <div class="notif-body">
          <div class="notif-title">${esc(n.judul)}</div>
          <div class="notif-msg">${esc(n.pesan)}</div>
          <div class="notif-time">${esc(_notifAgo(n.waktu))}</div>
        </div>
      </div>`;
  }).join('');
  refreshIcons();
}

async function loadNotif() {
  if (!S.user) return;
  try {
    const res = await apiFetch('/api/notifikasi');
    _notif.list = (res && res.success && Array.isArray(res.data)) ? res.data : [];
  } catch (e) {
    return;                                   // gagal diam-diam; coba lagi pada polling berikutnya
  }
  renderNotifBadge();
  if (_notif.open) renderNotifList();
}

function _notifMarkSeenNow() {
  if (!_notif.list.length) return;
  const newest = _notif.list.reduce((m, n) => (n.waktu > m ? n.waktu : m), '');
  if (newest > _notifSeen()) _notifSetSeen(newest);
  renderNotifBadge();
}

function closeNotif() {
  const p = document.getElementById('notif-panel');
  if (p) p.style.display = 'none';
  if (_notif.open) { _notif.open = false; _notifMarkSeenNow(); }
}

function toggleNotif(ev) {
  if (ev) ev.stopPropagation();
  const p = document.getElementById('notif-panel');
  if (!p) return;
  if (_notif.open) { closeNotif(); return; }
  _notif.open = true;
  _notif.seenAtOpen = _notifSeen();           // item yang belum dibaca tetap disorot selama panel terbuka
  p.style.display = 'block';
  renderNotifList();
  loadNotif();
}

function notifMarkAllRead() {
  _notifMarkSeenNow();
  _notif.seenAtOpen = _notifSeen();
  renderNotifList();
}

async function notifOpenItem(rowId) {
  closeNotif();
  if (typeof openBukti !== 'function') return;
  if (!(S.allR || []).some(r => String(r._row) === String(rowId))) {
    try { S.allR = (await apiFetch('/api/temuan')) || []; } catch (e) { showToast('Gagal memuat data temuan', 'err'); return; }
  }
  if (S.page !== 'dashboard' && typeof navigate === 'function') navigate('dashboard');
  openBukti(rowId);
}

function startNotif() {
  stopNotif();
  loadNotif();
  _notif.timer = setInterval(loadNotif, NOTIF_POLL_MS);
}

function stopNotif() {
  if (_notif.timer) clearInterval(_notif.timer);
  _notif = { list: [], timer: null, open: false, seenAtOpen: '' };
  const p = document.getElementById('notif-panel'); if (p) p.style.display = 'none';
  renderNotifBadge();
}

// Klik di luar panel = tutup
document.addEventListener('click', e => {
  if (_notif.open && !e.target.closest('.notif-wrap')) closeNotif();
});

// Mulai saat masuk aplikasi, berhenti saat logout (tanpa mengubah auth.js)
(function () {
  const _enter = window.enterApp;
  if (typeof _enter === 'function') {
    window.enterApp = function () { const r = _enter.apply(this, arguments); startNotif(); return r; };
  }
  const _out = window.doLogout;
  if (typeof _out === 'function') {
    window.doLogout = function () { stopNotif(); return _out.apply(this, arguments); };
  }
})();
