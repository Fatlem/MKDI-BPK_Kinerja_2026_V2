{{--
  SIDEBAR — Tailwind CSS
  Class lama (sidebar, nav-item, nav-parent, nav-sub-wrap, nav-subitem) TETAP ADA
  hanya sebagai "pengait" untuk JS (router.js, auth.js, sidebar.js). Tampilannya 100% Tailwind.
  Varian custom (lihat head.blade.php): mini: = sidebar ciut | act: = .active | opened: = .open
--}}
<aside id="sidebar"
  class="sidebar fixed inset-y-0 left-0 z-[100] flex w-[var(--sidebar-w)] flex-col border-r border-black/[0.06] bg-[#FAFAFC]/95 backdrop-blur-xl transition-[transform,width] duration-300
         max-[768px]:w-[min(272px,85vw)] max-[768px]:-translate-x-full max-[768px]:overflow-y-auto max-[768px]:[&.open]:translate-x-0 max-[768px]:[&.open]:shadow-2xl">

  {{-- Tombol ciut / perluas (desktop) --}}
  <button type="button" id="sb-edge-toggle" onclick="toggleSidebarCollapse()" title="Ciutkan / perluas menu" aria-label="Ciutkan atau perluas menu"
    class="absolute -right-[13px] top-6 flex size-[26px] cursor-pointer items-center justify-center rounded-full border border-black/[0.08] bg-white text-[#6E6E73] shadow-[0_2px_6px_rgba(0,0,0,0.06)] transition-all hover:text-[#1D1D1F] max-[768px]:hidden">
    <i data-lucide="chevron-left" class="size-3.5 transition-transform mini:rotate-180"></i>
  </button>

  {{-- Brand --}}
  <div class="border-b border-black/[0.05] px-5 py-3.5 mini:flex mini:justify-center mini:px-0">
    <div class="mini:hidden">
      <img src="{{ asset('images/logoheader.png') }}?v=1"
          alt="Kementerian Koordinator Bidang Pangan Republik Indonesia"
          class="block h-auto w-full max-w-[190px]">
      <div class="mt-2 flex items-center gap-1.5">
        <span class="rounded bg-[#0071E3]/10 px-1.5 py-0.5 text-[10px] font-bold tracking-tight text-[#0071E3]">e-TLHP</span>
        <span class="truncate text-[10.5px] font-medium text-[#6E6E73]">Inspektorat Kemenko Pangan</span>
      </div>
    </div>
    <img src="{{ asset('images/logo.png') }}?v=1"
        alt="e-TLHP Kemenko Pangan"
        class="hidden size-[34px] object-contain mini:block">
  </div>

  {{-- Menu --}}
  <nav class="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 mini:px-2">
    <div id="nav-section-main" class="space-y-1">
      {{-- Dashboard --}}
      <div id="nav-dashboard" onclick="navigate('dashboard')" title="Dashboard"
        class="nav-item active flex cursor-pointer items-center gap-3 whitespace-nowrap rounded-[10px] px-3 py-2 text-[13px] font-medium text-[#6E6E73] transition-all hover:bg-black/[0.04] hover:text-[#1D1D1F] act:bg-[#0071E3] act:font-medium act:text-white act:shadow-[0_1px_3px_rgba(0,113,227,0.25)] mini:justify-center mini:px-0 mini:py-2.5">
        <i data-lucide="layout-grid" class="size-[17px] shrink-0"></i>
        <span class="mini:hidden">Dashboard</span>
      </div>

      {{-- Daftar Temuan --}}
      <div id="nav-ruang-isian" onclick="if(window.S){S.activeLhaNo=null;} navigate('ruang-isian')" title="Daftar Temuan"
        class="nav-item flex cursor-pointer items-center gap-3 whitespace-nowrap rounded-[10px] px-3 py-2 text-[13px] font-medium text-[#6E6E73] transition-all hover:bg-black/[0.04] hover:text-[#1D1D1F] act:bg-[#0071E3] act:font-medium act:text-white act:shadow-[0_1px_3px_rgba(0,113,227,0.25)] mini:justify-center mini:px-0 mini:py-2.5">
        <i data-lucide="list-filter" class="size-[17px] shrink-0"></i>
        <span class="mini:hidden">Daftar Temuan</span>
      </div>

      {{-- Rekap --}}
      <div id="nav-rekap" onclick="navigate('rekap')" title="Rekap & Laporan"
        class="nav-item flex cursor-pointer items-center gap-3 whitespace-nowrap rounded-[10px] px-3 py-2 text-[13px] font-medium text-[#6E6E73] transition-all hover:bg-black/[0.04] hover:text-[#1D1D1F] act:bg-[#0071E3] act:font-medium act:text-white act:shadow-[0_1px_3px_rgba(0,113,227,0.25)] mini:justify-center mini:px-0 mini:py-2.5">
        <i data-lucide="file-spreadsheet" class="size-[17px] shrink-0"></i>
        <span class="mini:hidden">Rekap</span>
      </div>
    </div>
  </nav>

  {{-- Footer --}}
  <div class="border-t border-black/[0.06] p-3 mini:px-2">
    <div title="Akun"
      class="mb-1 flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 mini:justify-center mini:px-0">
      <div id="sb-av" class="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E5E5EA] text-xs font-semibold text-[#1D1D1F]">A</div>
      <div class="min-w-0 flex-1 mini:hidden">
        <div id="sb-uname" class="truncate text-[12.5px] font-semibold text-[#1D1D1F]">Administrator</div>
        <div id="sb-urole" class="text-[10px] font-medium text-[#86868B]">Administrator</div>
      </div>
    </div>

    <div onclick="doLogout()" title="Keluar"
      class="nav-logout flex cursor-pointer items-center gap-3 whitespace-nowrap rounded-[10px] px-3 py-2 text-[13px] font-medium text-[#6E6E73] transition-colors hover:bg-black/[0.04] hover:text-[#D70015] mini:justify-center mini:px-0 mini:py-2">
      <i data-lucide="log-out" class="size-[16px] shrink-0"></i>
      <span class="mini:hidden">Keluar</span>
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
