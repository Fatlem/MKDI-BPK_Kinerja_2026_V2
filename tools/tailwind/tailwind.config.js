/** Konfigurasi Tailwind 3.4.17 — SAMA dengan konfigurasi CDN lama di head.blade.php. */
module.exports = {
  content: ['./resources/views/**/*.php', './public/js/**/*.js'],
  corePlugins: { preflight: false }, // preflight dimatikan supaya css/mkdi.css tidak berubah
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', 'Inter', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"SF Mono"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        apple: { bg: '#F5F5F7', card: '#FFFFFF', text: '#1D1D1F', sub: '#6E6E73', muted: '#86868B', border: '#E5E5EA', blue: '#0071E3', blueHover: '#0077ED' },
        pangan: { 50: '#F0F7FF', 100: '#E0EFFE', 500: '#007AFF', 600: '#0071E3', 700: '#0071E3', 800: '#005BB5', 900: '#004488' },
      },
    },
  },
  plugins: [
    function ({ addVariant }) {
      addVariant('mini', '@media (min-width: 769px) { .sb-collapsed & }'); // sidebar ciut (desktop)
      addVariant('act', '&.active');    // elemen berclass .active (router.js)
      addVariant('opened', '&.open');   // elemen berclass .open (router.js)
    },
  ],
};
