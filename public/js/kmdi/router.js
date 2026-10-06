(function () {
  'use strict';

  var DETAIL = 'ruang-isian-detail';

  var ROUTES = {
    'dashboard':   '/dashboard',
    'ruang-isian': '/ruang-isian',
    'ruang-isian-detail': '/ruang-isian/detail',
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

  function setGroup(name, open) {
    var sub = document.getElementById('nav-sub-' + name);
    var parent = document.getElementById('nav-' + name);
    if (sub) sub.classList.toggle('open', open);
    if (parent) parent.classList.toggle('open', open);
  }

  window.toggleNavGroup = function (name) {
    var sub = document.getElementById('nav-sub-' + name);
    if (!sub) return;
    setGroup(name, !sub.classList.contains('open'));
  };

  function syncNav(page) {
    var inRI = (page === 'ruang-isian' || page === DETAIL);
    var items = document.querySelectorAll('#sidebar .nav-item');
    for (var i = 0; i < items.length; i++) items[i].classList.remove('active');

    var el = document.getElementById(inRI ? 'nav-ruang-isian' : 'nav-' + page);
    if (el) el.classList.add('active');

    var t = document.getElementById('nav-ri-temuan');
    var k = document.getElementById('nav-ri-detail');
    if (t) t.classList.toggle('active', page === 'ruang-isian');
    if (k) k.classList.toggle('active', page === DETAIL);

    setGroup('ruang-isian', inRI);
  }

  function render(page, args) {
    var result;
    if (page === DETAIL && typeof window.loadDetail === 'function') {
      S.page = DETAIL;
      if (typeof window.toggleSidebar === 'function') window.toggleSidebar(false);
      window.loadDetail();
    } else {
      result = originalNavigate.apply(window, args || [page]);
    }
    syncNav(page);
    return result;
  }

  var first = true;

  function navigate(page) {
    if (first) {
      var urlPage = pageFromPath();
      if (urlPage) page = urlPage;
    }

    var args = arguments.length ? [page].concat([].slice.call(arguments, 1)) : [page];
    var result = render(page, args);

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
    render(pageFromPath() || 'dashboard');
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