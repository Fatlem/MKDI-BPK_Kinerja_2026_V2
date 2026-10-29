<!DOCTYPE html>
<html lang="id">
<head>
  @include('partials.head')

  <link rel="icon" type="image/png" href="{{ asset('images/logo.png') }}?v=1">
  <link rel="apple-touch-icon" href="{{ asset('images/logo.png') }}?v=1">
</head>
<body>

  @include('auth.login')

  <div id="app-container" style="display:none;">
    <div class="app-layout group/sb [--sidebar-w:260px] min-[769px]:[&.sb-collapsed]:[--sidebar-w:78px]">
      <div id="sb-overlay" class="sidebar-overlay" onclick="toggleSidebar(false)"></div>

      @include('partials.sidebar')

      <div class="main-wrapper transition-[margin-left] duration-300">
        @include('partials.header')

        <div id="page-body" class="page-content"></div>

        @include('partials.footer')
      </div>
    </div>
  </div>

  <x-modals.form-temuan />
  <x-modals.detail />
  <x-modals.bukti />
  <x-modals.confirm-delete />
  <div id="toast" class="toast-msg"></div>

  @include('partials.scripts')
  @stack('scripts') {{-- skrip kecil dari partial (mis. sidebar), dimuat setelah semua file JS --}}
</body>
</html>
