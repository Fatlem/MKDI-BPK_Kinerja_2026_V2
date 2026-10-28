<!DOCTYPE html>
<html lang="id">
<head>
  @include('layouts.head')

  <link rel="icon" type="image/png" href="{{ asset('images/logo.png') }}?v=1">
  <link rel="apple-touch-icon" href="{{ asset('images/logo.png') }}?v=1">
</head>
<body>

  @include('auth.login')

  <div id="app-container" style="display:none;">
    <div class="app-layout group/sb [--sidebar-w:260px] min-[769px]:[&.sb-collapsed]:[--sidebar-w:78px]">
      <div id="sb-overlay" class="sidebar-overlay" onclick="toggleSidebar(false)"></div>

      @include('layouts.sidebar')

      <div class="main-wrapper transition-[margin-left] duration-300">
        @include('layouts.header')

        <div id="page-body" class="page-content"></div>

        <footer class="app-footer">BPK &copy; 2026 Badan Pemeriksa Kinerja RI</footer>
      </div>
    </div>
  </div>

  <x-modals.form-temuan />
  <x-modals.confirm-delete />
  <div id="toast" class="toast-msg"></div>

  @include('layouts.scripts')
</body>
</html>