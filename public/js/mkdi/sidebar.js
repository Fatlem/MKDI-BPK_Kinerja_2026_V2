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
