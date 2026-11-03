/* ═══════════════════════════════════════════════════════════════
   pwa.js — registrasi service worker, tombol instal, status offline, notifikasi pembaruan
   Mandiri (tidak bergantung pada fungsi lain, kecuali showToast bila ada).
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  var deferredPrompt = null;

  function toast(msg, type) { if (typeof showToast === 'function') showToast(msg, type || 'inf'); }

  /* ── Tombol instal (sidebar) ── */
  function installBtn() { return document.getElementById('pwa-install'); }
  function showInstall(show) { var b = installBtn(); if (b) b.classList.toggle('hidden', !show); }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    if (!isStandalone) showInstall(true);
  });
  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    showInstall(false);
    toast('e-TLHP berhasil dipasang', 'ok');
  });

  window.installPwa = function () {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function () { deferredPrompt = null; showInstall(false); });
    } else if (isIOS) {
      toast('Ketuk ikon Bagikan, lalu pilih "Tambah ke Layar Utama".', 'inf');
    }
  };

  // iOS Safari tidak punya beforeinstallprompt: tampilkan tombol sebagai petunjuk.
  document.addEventListener('DOMContentLoaded', function () { if (isIOS && !isStandalone) showInstall(true); });

  /* ── Status online/offline ── */
  function syncNet() {
    document.body.classList.toggle('is-offline', !navigator.onLine);
  }
  window.addEventListener('online', function () { syncNet(); toast('Koneksi kembali tersambung', 'ok'); });
  window.addEventListener('offline', function () { syncNet(); toast('Anda sedang offline', 'err'); });
  document.addEventListener('DOMContentLoaded', syncNet);

  /* ── Service worker + notifikasi pembaruan ── */
  if (!('serviceWorker' in navigator)) return;

  function promptUpdate(worker) {
    if (document.getElementById('pwa-toast')) return;
    var t = document.createElement('div');
    t.id = 'pwa-toast';
    t.className = 'pwa-toast';
    t.setAttribute('role', 'status');
    t.innerHTML = '<span>Versi baru e-TLHP tersedia.</span><button type="button" data-act="reload">Muat ulang</button><button type="button" class="ghost" data-act="later">Nanti</button>';
    t.addEventListener('click', function (ev) {
      var act = ev.target && ev.target.getAttribute('data-act');
      if (act === 'reload') worker.postMessage('SKIP_WAITING');
      if (act) t.remove();
    });
    document.body.appendChild(t);
  }

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(function (reg) {
      if (reg.waiting && navigator.serviceWorker.controller) promptUpdate(reg.waiting);
      reg.addEventListener('updatefound', function () {
        var nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', function () {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) promptUpdate(nw);
        });
      });
    }).catch(function (err) { console.warn('Service worker gagal didaftarkan:', err); });

    // Muat ulang hanya saat PEMBARUAN diterapkan, bukan pada instalasi pertama (clients.claim).
    var hadController = !!navigator.serviceWorker.controller;
    var reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!hadController) { hadController = true; return; }
      if (reloaded) return; reloaded = true; location.reload();
    });
  });
})();
