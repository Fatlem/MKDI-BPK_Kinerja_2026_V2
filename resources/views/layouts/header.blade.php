<header class="top-header">
  <div style="display:flex;align-items:center;gap:12px;">
    <button class="mobile-hamburger" onclick="toggleSidebar(true)">
      <i data-lucide="menu" style="width:20px;height:20px;"></i>
    </button>

    <img src="{{ asset('images/logoheader.png') }}?v=1"
         alt="Kementerian Koordinator Bidang Pangan Republik Indonesia"
         class="header-brand-logo">
    <span class="header-brand-divider"></span>

    <div class="header-greeting">
      <h2 id="hdr-title" style="display:flex;align-items:center;gap:6px;">
        Selamat Datang, Administrator
        <i data-lucide="sparkles" style="width:18px;height:18px;color:#2563eb;"></i>
      </h2>
      <p id="hdr-sub">Pantau dan kelola data kinerja dengan mudah dan cepat.</p>
    </div>
  </div>

  <div class="header-actions">
    <div class="header-date-badge">
      <i data-lucide="calendar" style="width:16px;height:16px;"></i>
      <div>
        <span id="hdr-date" class="hdr-date-val">—</span>
        <span id="hdr-time" class="hdr-time-val">—</span>
      </div>
    </div>
    <div class="header-notif" title="Notifikasi">
      <i data-lucide="bell" style="width:18px;height:18px;"></i>
      <span class="notif-dot"></span>
    </div>
    <div id="hdr-avatar" class="header-avatar-btn">A</div>
  </div>
</header>