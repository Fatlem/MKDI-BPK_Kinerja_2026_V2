<!DOCTYPE html>
<html lang="id">
<head>
  @include('layouts.head')
</head>
<body>

  @include('auth.login')

  <div id="app-container" style="display:none;">
    <div class="app-layout">
      <div id="sb-overlay" class="sidebar-overlay" onclick="toggleSidebar(false)"></div>

      @include('layouts.sidebar')

      <div class="main-wrapper">
        @include('layouts.header')

        <div id="page-body" class="page-content"></div>

        <footer class="app-footer">BPK Kinerja 2026 &copy; 2026 Badan Pemeriksa Keuangan RI</footer>
      </div>
    </div>
  </div>

  <x-modals.form-temuan />
  <x-modals.confirm-delete />
  <div id="toast" class="toast-msg"></div>

  <script src="{{ asset('js/kmdi/core.js') }}"></script>
  <script src="{{ asset('js/kmdi/auth.js') }}"></script>
  <script src="{{ asset('js/kmdi/dashboard.js') }}"></script>
  <script src="{{ asset('js/kmdi/ruang-isian.js') }}"></script>
  <script src="{{ asset('js/kmdi/rekap.js') }}"></script>
</body>
</html>