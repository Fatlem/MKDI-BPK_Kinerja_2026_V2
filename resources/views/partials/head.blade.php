<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="csrf-token" content="{{ csrf_token() }}">
<title>e-TLHP — Inspektorat Kementerian Koordinator Bidang Pangan RI</title>
<meta name="theme-color" content="#ffffff">
<meta name="description" content="Pemantauan tindak lanjut hasil pemeriksaan BPK RI dan pengawasan internal — Inspektorat Kemenko Pangan.">

<!-- PWA -->
<link rel="manifest" href="{{ asset('manifest.webmanifest') }}">
<link rel="icon" href="{{ asset('favicon.ico') }}" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="{{ asset('icons/favicon-32.png') }}">
<link rel="apple-touch-icon" href="{{ asset('icons/apple-touch-icon.png') }}">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="e-TLHP">
<meta name="apple-mobile-web-app-status-bar-style" content="default">

<!-- Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">

<!-- Pustaka (versi di-pin & di-host sendiri; ExcelJS dimuat lazy saat ekspor) -->
<script src="{{ asset('libs/chart-4.4.0.umd.js') }}"></script>
<script src="{{ asset('libs/lucide-0.468.0.min.js') }}"></script>

<!-- Custom Master Stylesheet -->
<link rel="stylesheet" href="{{ asset('css/mkdi.css') }}?v={{ @filemtime(public_path('css/mkdi.css')) }}">
<link rel="stylesheet" href="{{ asset('css/bukti.css') }}?v={{ @filemtime(public_path('css/bukti.css')) }}">

<!-- Tailwind CSS: hasil build statis (preflight dimatikan). Sumber & cara build: tools/tailwind/README.md -->
<link rel="stylesheet" href="{{ asset('css/tailwind.css') }}?v={{ @filemtime(public_path('css/tailwind.css')) }}">
<!-- Lapisan UI baru (kategori, countdown, responsif, PWA) — HARUS terakhir -->
<link rel="stylesheet" href="{{ asset('css/app-ui.css') }}?v={{ @filemtime(public_path('css/app-ui.css')) }}">
