<header class="top-header">
  <div style="display:flex;align-items:center;gap:12px;">
    <button type="button" class="mobile-hamburger" onclick="toggleSidebar(true)" aria-label="Buka menu">
      <i data-lucide="menu" style="width:18px;height:18px;"></i>
    </button>

    <div class="header-greeting">
      <h2 id="hdr-title">Dashboard</h2>
      <p id="hdr-sub" style="display:none;"></p>
    </div>
  </div>

  <div class="header-actions">
    <span class="net-pill" role="status"><i data-lucide="wifi-off"></i>Offline</span>
    <div class="header-date-badge">
      <span id="hdr-date" class="hdr-date-val">—</span>
      <span class="hdr-sep" style="color:#D2D2D7;" aria-hidden="true">·</span>
      <span id="hdr-time" class="hdr-time-val">—</span>
    </div>
    <div id="hdr-avatar" class="header-avatar-btn">A</div>
  </div>
</header>