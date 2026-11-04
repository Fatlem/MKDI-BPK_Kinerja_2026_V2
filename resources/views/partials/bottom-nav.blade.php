{{--
  BILAH NAVIGASI BAWAH (mobile ≤768px; disembunyikan di desktop lewat css/app-ui.css)
  Tidak punya logika navigasi sendiri: tombol hanya mengklik item sidebar yang sama
  (#nav-*), jadi perilaku router.js/auth.js tidak berubah. Status aktif disinkronkan
  dari kelas .active pada item sidebar. Akun / Pasang Aplikasi / Keluar ada di menu avatar header (mobile).
--}}
<nav id="bottom-nav" class="bottom-nav" aria-label="Navigasi utama">
  <button type="button" data-nav="nav-dashboard"><i data-lucide="layout-grid"></i><span>Dashboard</span></button>
  <button type="button" data-nav="nav-ruang-isian"><i data-lucide="list-filter"></i><span>Temuan</span></button>
  <button type="button" data-nav="nav-rekap"><i data-lucide="file-spreadsheet"></i><span>Rekap</span></button>
</nav>

{{-- Menu akun (mobile): dibuka dengan mengetuk avatar di header --}}
<div id="acct-pop" class="acct-pop" role="menu" aria-label="Akun" hidden>
  <div class="acct-pop-head"><b data-acct="name">—</b><span data-acct="role"></span></div>
  <button type="button" role="menuitem" data-acct="install" hidden><i data-lucide="download"></i>Pasang Aplikasi</button>
  <button type="button" role="menuitem" data-acct="logout" class="is-danger"><i data-lucide="log-out"></i>Keluar</button>
</div>

@push('scripts')
<script>
(function () {
  var bn = document.getElementById('bottom-nav');
  if (!bn) return;
  var btns = [].slice.call(bn.querySelectorAll('[data-nav]'));

  bn.addEventListener('click', function (e) {
    var b = e.target.closest('[data-nav]');
    if (!b) return;
    var item = document.getElementById(b.dataset.nav);
    if (item) item.click();
  });

  function sync() {
    btns.forEach(function (b) {
      var t = document.getElementById(b.dataset.nav);
      var visible = !!t && getComputedStyle(t).display !== 'none';
      b.hidden = !visible;                      // mengikuti pembatasan peran pada sidebar
      var on = visible && t.classList.contains('active');
      b.classList.toggle('active', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
  }

  var host = document.getElementById('sidebar');
  if (host) new MutationObserver(sync).observe(host, { subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
  sync();

  /* ── Menu akun pada avatar (hanya layar ≤768px) ── */
  var pop = document.getElementById('acct-pop');
  var avatar = document.getElementById('hdr-avatar');
  var mq = window.matchMedia('(max-width: 768px)');
  function txt(id) { var e = document.getElementById(id); return e ? e.textContent.trim() : ''; }
  function closePop() { pop.hidden = true; if (avatar) avatar.setAttribute('aria-expanded', 'false'); }
  function openPop() {
    pop.querySelector('[data-acct=name]').textContent = txt('sb-uname') || 'Akun';
    pop.querySelector('[data-acct=role]').textContent = txt('sb-urole');
    var inst = document.getElementById('pwa-install');
    pop.querySelector('[data-acct=install]').hidden = !(inst && !inst.classList.contains('hidden'));
    pop.hidden = false;
    if (avatar) avatar.setAttribute('aria-expanded', 'true');
  }
  if (avatar && pop) {
    avatar.setAttribute('role', 'button'); avatar.setAttribute('tabindex', '0');
    avatar.setAttribute('aria-label', 'Menu akun'); avatar.setAttribute('aria-haspopup', 'menu'); avatar.setAttribute('aria-expanded', 'false');
    var toggle = function (e) { if (!mq.matches) return; e.stopPropagation(); pop.hidden ? openPop() : closePop(); };
    avatar.addEventListener('click', toggle);
    avatar.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(e); } });
    pop.addEventListener('click', function (e) {
      var b = e.target.closest('[data-acct]'); if (!b) return;
      closePop();
      if (b.dataset.acct === 'logout') doLogout();
      if (b.dataset.acct === 'install') installPwa();
    });
    document.addEventListener('click', function (e) { if (!pop.hidden && !pop.contains(e.target)) closePop(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) { closePop(); avatar.focus(); } });
  }

  if (typeof refreshIcons === 'function') refreshIcons();
})();
</script>
@endpush
