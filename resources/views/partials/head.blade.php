<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="csrf-token" content="{{ csrf_token() }}">
<title>BPK Kinerja 2026 - Dashboard Monitoring MKDI</title>
<meta name="theme-color" content="#ffffff">

<!-- Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">

<!-- Chart.js, ExcelJS, & Lucide Icons -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js"></script>
<script src="https://unpkg.com/lucide@latest"></script>

<!-- Custom Master Stylesheet -->
<link rel="stylesheet" href="{{ asset('css/mkdi.css') }}?v={{ @filemtime(public_path('css/mkdi.css')) }}">
<link rel="stylesheet" href="{{ asset('css/bukti.css') }}?v={{ @filemtime(public_path('css/bukti.css')) }}">

<!-- Tailwind CSS (preflight dimatikan supaya halaman lain yang pakai mkdi.css tidak berubah) -->
<script src="https://cdn.tailwindcss.com/3.4.17"></script>
<script>
  tailwind.config = {
    corePlugins: { preflight: false },
    theme: {
      extend: {
        fontFamily: {
          sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', 'Inter', '"Plus Jakarta Sans"', 'sans-serif'],
          mono: ['"SF Mono"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
        },
        colors: {
          apple: {
            bg: '#F5F5F7',
            card: '#FFFFFF',
            text: '#1D1D1F',
            sub: '#6E6E73',
            muted: '#86868B',
            border: '#E5E5EA',
            blue: '#0071E3',
            blueHover: '#0077ED',
          },
          pangan: {
            50: '#F0F7FF',
            100: '#E0EFFE',
            500: '#007AFF',
            600: '#0071E3',
            700: '#0071E3',
            800: '#005BB5',
            900: '#004488',
          }
        }
      }
    },
    plugins: [
      function ({ addVariant }) {
        // mini:  -> sidebar mode ciut (desktop saja)
        addVariant('mini', '@media (min-width: 769px) { .sb-collapsed & }');
        // act:   -> elemen yang diberi class .active oleh router.js
        addVariant('act', '&.active');
        // opened: -> elemen yang diberi class .open oleh router.js
        addVariant('opened', '&.open');
      }
    ]
  };
</script>
