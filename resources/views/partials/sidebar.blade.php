{{--
  SIDEBAR — Tailwind CSS
  Class lama (sidebar, nav-item, nav-parent, nav-sub-wrap, nav-subitem) TETAP ADA
  hanya sebagai "pengait" untuk JS (router.js, auth.js, sidebar.js). Tampilannya 100% Tailwind.
  Varian custom (lihat head.blade.php): mini: = sidebar ciut | act: = .active | opened: = .open
--}}
<aside id="sidebar"
  class="sidebar fixed inset-y-0 left-0 z-[100] flex w-[var(--sidebar-w)] flex-col border-r border-slate-200 bg-gradient-to-b from-white to-[#f3f6fd] transition-[transform,width] duration-300
         max-[768px]:w-[min(280px,85vw)] max-[768px]:-translate-x-full max-[768px]:overflow-y-auto max-[768px]:[&.open]:translate-x-0 max-[768px]:[&.open]:shadow-2xl">

  {{-- Tombol ciut / perluas (desktop) --}}
  <button type="button" id="sb-edge-toggle" onclick="toggleSidebarCollapse()" title="Ciutkan / perluas menu" aria-label="Ciutkan atau perluas menu"
    class="absolute -right-[22px] top-1/2 flex h-[84px] w-[22px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-r-[14px] border border-l-0 border-slate-200 bg-white text-slate-500 shadow-[4px_0_12px_rgba(15,23,42,.06)] transition-colors hover:bg-[#f3f6fd] hover:text-blue-900 max-[768px]:hidden">
    <i data-lucide="chevron-left" class="size-4 transition-transform mini:rotate-180"></i>
  </button>

  {{-- Brand: logo Kemenko Pangan (lengkap saat lebar, lambang saja saat sidebar ciut) --}}
  <div class="flex min-h-[76px] items-center border-b border-slate-100 px-[18px] py-4 mini:justify-center mini:px-0">
    <img src="{{ asset('images/logoheader.png') }}?v=1"
        alt="Kementerian Koordinator Bidang Pangan Republik Indonesia"
        class="block h-auto w-full max-w-[214px] mini:hidden">
    <img src="{{ asset('images/logo.png') }}?v=1"
        alt="Kemenko Pangan"
        class="hidden size-[42px] object-contain mini:block">
</div>

  {{-- Menu --}}
  <nav class="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3.5 mini:px-2.5">
    <div id="nav-section-main" class="group/sec">

      <div onclick="toggleNavSection('nav-section-main')"
        class="mb-1 flex cursor-pointer select-none items-center justify-between rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 transition-colors hover:text-blue-900
               mini:pointer-events-none mini:mx-3.5 mini:mb-3 mini:h-px mini:bg-slate-200 mini:p-0">
        <span class="mini:hidden">Menu Utama</span>
        <i data-lucide="chevron-down" class="size-4 transition-transform group-[.collapsed]/sec:-rotate-90 mini:hidden"></i>
      </div>

      <div class="group-[.collapsed]/sec:hidden mini:!block">

        {{-- Dashboard --}}
        <div id="nav-dashboard" onclick="navigate('dashboard')" title="Dashboard"
          class="nav-item active mb-[3px] flex cursor-pointer items-center gap-3.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-slate-600 transition-colors hover:bg-[#edf2fc] hover:text-blue-900 act:bg-[#e3eaf8] act:font-semibold act:text-blue-900 mini:justify-center mini:px-0 mini:py-[11px]">
          <i data-lucide="home" class="size-5 shrink-0"></i>
          <span class="mini:hidden">Dashboard</span>
        </div>

        {{-- Ruang Isian (dropdown) --}}
        <div id="nav-ruang-isian" onclick="toggleNavGroup('ruang-isian')" title="Ruang Isian"
          class="nav-item nav-parent group/p mb-[3px] flex cursor-pointer items-center gap-3.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-slate-600 transition-colors hover:bg-[#edf2fc] hover:text-blue-900 act:bg-[#e3eaf8] act:font-semibold act:text-blue-900 mini:justify-center mini:px-0 mini:py-[11px]">
          <i data-lucide="file-edit" class="size-5 shrink-0"></i>
          <span class="mini:hidden">Ruang Isian</span>
          <i data-lucide="chevron-down" class="ml-auto size-4 transition-transform group-[.open]/p:rotate-180 mini:hidden"></i>
        </div>
        <div id="nav-sub-ruang-isian" class="nav-sub-wrap max-h-0 overflow-hidden transition-[max-height] duration-300 opened:max-h-36 mini:hidden">
          <div id="nav-ri-temuan" onclick="navigate('ruang-isian')"
            class="nav-subitem group/s mb-[3px] ml-[18px] flex cursor-pointer items-center gap-3 rounded-[10px] border-l-[1.5px] border-slate-200 py-[9px] pl-[22px] pr-3.5 text-[13px] font-medium text-slate-500 transition-colors hover:bg-[#edf2fc] hover:text-blue-900 act:border-blue-600 act:bg-[#eaf0fc] act:font-semibold act:text-blue-900">
            <span class="size-1.5 shrink-0 rounded-full bg-slate-300 group-[.active]/s:bg-blue-600"></span>
            <span>Temuan / Sub Temuan</span>
          </div>
          <div id="nav-ri-detail" onclick="navigate('ruang-isian-detail')"
            class="nav-subitem group/s mb-[3px] ml-[18px] flex cursor-pointer items-center gap-3 rounded-[10px] border-l-[1.5px] border-slate-200 py-[9px] pl-[22px] pr-3.5 text-[13px] font-medium text-slate-500 transition-colors hover:bg-[#edf2fc] hover:text-blue-900 act:border-blue-600 act:bg-[#eaf0fc] act:font-semibold act:text-blue-900">
            <span class="size-1.5 shrink-0 rounded-full bg-slate-300 group-[.active]/s:bg-blue-600"></span>
            <span>Detail</span>
          </div>
        </div>

        {{-- Rekap --}}
        <div id="nav-rekap" onclick="navigate('rekap')" title="Rekap & Laporan"
          class="nav-item mb-[3px] flex cursor-pointer items-center gap-3.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-slate-600 transition-colors hover:bg-[#edf2fc] hover:text-blue-900 act:bg-[#e3eaf8] act:font-semibold act:text-blue-900 mini:justify-center mini:px-0 mini:py-[11px]">
          <i data-lucide="bar-chart-3" class="size-5 shrink-0"></i>
          <span class="mini:hidden">Rekap &amp; Laporan</span>
        </div>
      </div>
    </div>
  </nav>

  {{-- Footer --}}
  <div class="border-t border-slate-200 p-3 mini:px-2.5">
    <div title="Akun"
      class="mb-1.5 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 mini:justify-center mini:border-transparent mini:bg-transparent mini:px-0 mini:py-2">
      <div id="sb-av" class="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-extrabold text-white">A</div>
      <div class="min-w-0 flex-1 mini:hidden">
        <div id="sb-uname" class="truncate text-[12.5px] font-bold text-slate-900">Administrator</div>
        <div id="sb-urole" class="text-[9.5px] font-bold uppercase text-slate-500">ADMINISTRATOR</div>
      </div>
    </div>

    <div onclick="doLogout()" title="Log Out"
      class="nav-logout flex cursor-pointer items-center gap-3.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 mini:justify-center mini:px-0 mini:py-[11px]">
      <i data-lucide="log-out" class="size-5 shrink-0"></i>
      <span class="mini:hidden">Log Out</span>
    </div>
  </div>
</aside>

{{-- Skrip sidebar (mode ciut + menu bisa dilipat). Dimuat lewat @stack('scripts') di app.blade.php,
     jadi jalan SETELAH router.js (membungkus toggleNavGroup). --}}
@push('scripts')
<script>
  // Sidebar: mode ciut (desktop) + section menu bisa dilipat.
  // Harus dimuat SETELAH router.js (membungkus toggleNavGroup).
  (function () {
    'use strict';

    var KEY = 'bpk_sidebar_collapsed';
    var layout = document.querySelector('.app-layout');
    if (!layout) return;

    function isDesktop() { return window.innerWidth > 768; }
    function isCollapsed() { return layout.classList.contains('sb-collapsed'); }

    function setCollapsed(state) {
      layout.classList.toggle('sb-collapsed', !!state);
      try { localStorage.setItem(KEY, state ? '1' : '0'); } catch (e) {}
    }

    window.toggleSidebarCollapse = function () {
      if (!isDesktop()) return;
      setCollapsed(!isCollapsed());
    };

    window.toggleNavSection = function (id) {
      if (isCollapsed() && isDesktop()) return;
      var el = document.getElementById(id);
      if (el) el.classList.toggle('collapsed');
    };

    // Saat ciut, klik "Ruang Isian" -> perluas dulu lalu buka submenu.
    var origToggleGroup = window.toggleNavGroup;
    if (typeof origToggleGroup === 'function') {
      window.toggleNavGroup = function (name) {
        if (isCollapsed() && isDesktop()) {
          setCollapsed(false);
          var sub = document.getElementById('nav-sub-' + name);
          if (sub && sub.classList.contains('open')) return; // sudah terbuka, biarkan
        }
        return origToggleGroup.apply(this, arguments);
      };
    }

    try { if (localStorage.getItem(KEY) === '1' && isDesktop()) setCollapsed(true); } catch (e) {}
  })();
</script>
@endpush
