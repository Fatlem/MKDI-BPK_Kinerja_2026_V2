(function () {
  'use strict';

  var ROUTES = {
    'dashboard':   '/dashboard',
    'ruang-isian': '/ruang-isian',
    'rekap':       '/rekap-laporan'
  };

  var originalNavigate = window.navigate;
  if (typeof originalNavigate !== 'function') {
    console.warn('[router] navigate() tidak ditemukan di window, router dinonaktifkan.');
    return;
  }

  function normPath(p) {
    return (p.replace(/\/+$/, '') || '/').toLowerCase();
  }

  function pageFromPath() {
    var path = normPath(location.pathname);
    var keys = Object.keys(ROUTES);
    for (var i = 0; i < keys.length; i++) {
      if (ROUTES[keys[i]] === path) return keys[i];
    }
    return null;
  }

  function appVisible() {
    var el = document.getElementById('app-container');
    return !!el && el.style.display !== 'none';
  }

  var first = true;

  function navigate(page) {
    if (first) {
      var urlPage = pageFromPath();
      if (urlPage) page = urlPage;
    }

    var result = originalNavigate.apply(this, arguments.length ? [page].concat([].slice.call(arguments, 1)) : [page]);

    var target = ROUTES[page];
    if (target && normPath(location.pathname) !== target) {
      if (first) history.replaceState({ page: page }, '', target);
      else       history.pushState({ page: page }, '', target);
    }
    first = false;
    return result;
  }

  window.addEventListener('popstate', function () {
    if (!appVisible()) return;                
    originalNavigate(pageFromPath() || 'dashboard');
  });

  var originalLogout = window.doLogout;
  if (typeof originalLogout === 'function') {
    window.doLogout = function () {
      var r = originalLogout.apply(this, arguments);
      first = true;
      history.replaceState({}, '', '/');
      return r;
    };
  }

  window.navigate = navigate;
})();