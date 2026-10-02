<aside id="sidebar" class="sidebar">
  <div class="sidebar-header">
    <div class="sidebar-logo">
      <i data-lucide="clipboard-check" style="width:22px;height:22px;"></i>
    </div>
    <div>
      <div class="sidebar-brand-name">BPK Kinerja 2026</div>
      <div class="sidebar-brand-sub">Dashboard Monitoring</div>
    </div>
  </div>

  <ul class="sidebar-nav">
    <div class="nav-section-title">Menu Utama</div>
    <li id="nav-dashboard" class="nav-item active" onclick="navigate('dashboard')">
      <i data-lucide="layout-dashboard"></i> <span>Dashboard</span>
    </li>
    <li id="nav-ruang-isian" class="nav-item" onclick="navigate('ruang-isian')">
      <i data-lucide="file-edit"></i> <span>Ruang Isian</span>
    </li>
    <li id="nav-rekap" class="nav-item" onclick="navigate('rekap')">
      <i data-lucide="bar-chart-3"></i> <span>Rekap &amp; Laporan</span>
    </li>
  </ul>

  <div class="sidebar-illustration-card">
    <div class="sb-card-icon-wrap">
      <i data-lucide="building-2" style="width:20px;height:20px;"></i>
    </div>
    <div class="sidebar-motto">
      <strong>Bersama Mewujudkan</strong>
      Kinerja yang Lebih Baik
    </div>
  </div>

  <div class="sidebar-footer">
    <div class="user-profile-card">
      <div id="sb-av" class="user-avatar">A</div>
      <div class="user-info">
        <div id="sb-uname" class="user-name">Administrator</div>
        <div id="sb-urole" class="user-role">ADMINISTRATOR</div>
      </div>
      <button class="btn-logout" onclick="doLogout()" title="Keluar">
        <i data-lucide="log-out" style="width:18px;height:18px;"></i>
      </button>
    </div>
    <div class="sidebar-copyright">BPK Kinerja 2026 &copy; 2026</div>
  </div>
</aside>
