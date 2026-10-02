<div id="login-view" class="login-page-wrapper">

  <div class="bg-glow bg-glow-top-right"></div>
  <div class="bg-glow bg-glow-bottom-left"></div>

  <div class="login-main-container">
    <div class="login-card-box">

      <div class="login-left-panel">
        <div class="login-logo-area">
          <div class="login-logo-icon">
            <i data-lucide="clipboard-check" style="width:22px;height:22px;"></i>
          </div>
          <div class="login-logo-text">
            <h3>BPK Kinerja 2026</h3>
            <p>Dashboard Monitoring</p>
          </div>
        </div>

        <h1 class="login-heading">Selamat Datang!</h1>
        <p class="login-subheading">Silakan masuk ke akun Anda untuk melanjutkan ke sistem monitoring kinerja MKDI.</p>

        <div id="login-err" class="login-err"></div>

        <form id="form-login" onsubmit="event.preventDefault(); doLogin();">
          <div class="form-group">
            <label class="form-label" for="lg-user">Pengguna / User</label>
            <div id="user-combo" class="input-wrapper combo-wrapper">
              <span class="input-icon-left"><i data-lucide="user-check" style="width:16px;height:16px;"></i></span>
              <input id="lg-user" type="text" class="input-control" placeholder="Ketik atau pilih pengguna..." autocomplete="off" required>
              <button id="user-combo-btn" class="input-icon-right" type="button" onclick="toggleUserCombo()" tabindex="-1" title="Pilih pengguna">
                <i data-lucide="chevron-down" style="width:16px;height:16px;"></i>
              </button>
              <div id="user-combo-list" class="combo-list" style="display:none;" role="listbox"></div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="lg-pass">Password</label>
            <div class="input-wrapper">
              <span class="input-icon-left"><i data-lucide="lock" style="width:16px;height:16px;"></i></span>
              <input id="lg-pass" type="password" class="input-control" placeholder="Masukkan password" autocomplete="current-password" required>
              <button id="pass-eye-btn" class="input-icon-right" type="button" onclick="togglePassVis()" title="Toggle Password">
                <i id="pass-eye-icon" data-lucide="eye" style="width:16px;height:16px;"></i>
              </button>
            </div>
          </div>

          <div class="login-options">
            <label class="checkbox-label">
              <input type="checkbox" id="remember-me" checked>
              <span>Ingat saya</span>
            </label>
            <a href="#" class="forgot-link" onclick="alert('Silakan hubungi Administrator.'); return false;">Lupa password?</a>
          </div>

          <button id="btn-login" class="btn-login-submit" type="button" onclick="doLogin()">
            <i data-lucide="log-in" style="width:18px;height:18px;"></i>
            <span>Sign In</span>
          </button>
        </form>

        <div class="login-divider">atau</div>

        <div class="login-security">
          <i data-lucide="shield-check" style="width:15px;height:15px;color:#10b981;"></i>
          <span>Sistem resmi MKDI</span>
        </div>
      </div>

      <!-- Right Panel -->
      <div class="login-right-panel">
        <div class="rp-bg-overlay"></div>

        <div class="rp-bpk-badge">
          <div class="rp-bpk-emblem">
            <i data-lucide="landmark" style="width:20px;height:20px;color:#38bdf8;"></i>
          </div>
          <div class="rp-bpk-text">
            <h4>MKDI</h4>
            <p>Manajemen Kinerja, Data, dan Informasi</p>
          </div>
        </div>

        <div class="rp-headline">
          <h1>Monitoring Kinerja<br><span>Lebih Mudah &amp; Terarah</span></h1>
          <p>Sistem Pemantauan dan Tindak Lanjut Hasil Pemeriksaan MKDI Kementerian Koordinator Bidang Pangan.</p>
        </div>

        <div class="rp-features">
          <div class="rp-feature">
            <div class="rp-feature-icon"><i data-lucide="radio" style="width:18px;height:18px;"></i></div>
            <div class="rp-feature-text">
              <h5>Transparan</h5>
              <p>Data real-time dan akurat</p>
            </div>
          </div>
          <div class="rp-feature">
            <div class="rp-feature-icon"><i data-lucide="git-merge" style="width:18px;height:18px;"></i></div>
            <div class="rp-feature-text">
              <h5>Terintegrasi</h5>
              <p>Semua data dalam satu sistem</p>
            </div>
          </div>
          <div class="rp-feature">
            <div class="rp-feature-icon"><i data-lucide="zap" style="width:18px;height:18px;"></i></div>
            <div class="rp-feature-text">
              <h5>Efisien</h5>
              <p>Mempercepat tindak lanjut</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</div>
