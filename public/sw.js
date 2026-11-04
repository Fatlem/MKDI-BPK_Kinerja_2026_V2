/* ═══════════════════════════════════════════════════════════════
   sw.js — Service Worker e-TLHP
   Strategi:
   • /api/*            → SELALU jaringan, tidak pernah di-cache (data & sesi sensitif)
   • Navigasi (HTML)   → jaringan dulu; offline → /offline.html
   • Aset statis       → stale-while-revalidate (URL sudah ber-?v=filemtime)
   • Google Fonts      → stale-while-revalidate
   Naikkan VERSION bila daftar PRECACHE berubah.
   ═══════════════════════════════════════════════════════════════ */
const VERSION = 'v2';
const STATIC_CACHE = `etlhp-static-${VERSION}`;
const FONT_CACHE = `etlhp-fonts-${VERSION}`;
const PRECACHE = ['/offline.html', '/manifest.webmanifest', '/icons/icon-192.png', '/images/logo.png', '/images/logoheader.png'];
const STATIC_RE = /^\/(css|js|libs|images|icons|build)\//;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keep = [STATIC_CACHE, FONT_CACHE];
    for (const k of await caches.keys()) if (k.startsWith('etlhp-') && !keep.includes(k)) await caches.delete(k);
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
    await self.clients.claim();
  })());
});

// Halaman meminta pembaruan diterapkan setelah pengguna menekan "Muat ulang".
self.addEventListener('message', (e) => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

async function staleWhileRevalidate(cacheName, req) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  const net = fetch(req).then((res) => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; }).catch(() => hit);
  return hit || net;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin) {
    if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
      e.respondWith(staleWhileRevalidate(FONT_CACHE, req));
    }
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    e.respondWith(fetch(req).catch(() => new Response(
      JSON.stringify({ success: false, offline: true, message: 'Anda sedang offline. Periksa koneksi internet.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )));
    return;
  }

  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        return (await e.preloadResponse) || (await fetch(req));
      } catch (_) {
        return (await caches.match('/offline.html')) || Response.error();
      }
    })());
    return;
  }

  if (STATIC_RE.test(url.pathname) || url.pathname === '/favicon.ico') {
    e.respondWith(staleWhileRevalidate(STATIC_CACHE, req));
  }
});
