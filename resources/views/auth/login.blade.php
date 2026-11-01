<div id="login-view" class="login-page-wrapper">

  {{-- Ambient Background Architectural Illustration (matching Screenshot 1 outer backdrop) --}}
  <div class="landing-outer-bg" id="landing-outer-bg" aria-hidden="true">
    <img src="{{ asset('images/city-urban.png') }}?v=1" alt="" class="landing-bg-img-left">
    <img src="{{ asset('images/city-urban.png') }}?v=1" alt="" class="landing-bg-img-right">
    <div class="landing-outer-fade"></div>
  </div>

  <div class="login-main-container">

    {{-- =======================================================================
         STAGE 1: LANDING PAGE (Screenshot 1 Style using city-urban.png)
         ======================================================================= --}}
    <div id="landing-stage" class="landing-frame-outer">
      <div class="landing-card">
        {{-- Top Navigation Bar --}}
        <header class="landing-navbar">
          <div class="flex items-center gap-3">
            <img src="{{ asset('images/logoheader.png') }}?v=1"
                 alt="Kementerian Koordinator Bidang Pangan Republik Indonesia"
                 class="h-9 w-auto object-contain">
            <div class="hidden sm:flex items-center gap-2 pl-3 border-l border-black/[0.08]">
              <span class="landing-portal-badge">e-TLHP</span>
            </div>
          </div>

          <nav class="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-[0.08em] text-[#4A5568]">
            <a href="#" onclick="setLandingTab('portal'); return false;" id="lnd-tab-portal" class="text-[#0077CC] transition-colors">Portal</a>
            <a href="#" onclick="setLandingTab('probis'); return false;" id="lnd-tab-probis" class="hover:text-[#0077CC] transition-colors">Alur Tindak Lanjut</a>
            <a href="#" onclick="setLandingTab('sla'); return false;" id="lnd-tab-sla" class="hover:text-[#0077CC] transition-colors">Ketentuan &amp; SLA</a>
          </nav>

          <div class="flex items-center gap-4">
            <button type="button" onclick="showAuthStage()" class="text-[11px] font-bold uppercase tracking-[0.08em] text-[#0077CC] hover:text-[#005A9E] px-2 py-1">
              Log In
            </button>
            <button type="button" onclick="showAuthStage()" class="landing-btn-outline">
              Portal Masuk
            </button>
          </div>
        </header>

        {{-- Hero Content (Left Text + Right Isometric City Illustration) --}}
        <div class="landing-hero-grid">
          <div class="landing-hero-left">
            <p class="landing-eyebrow">Inspektorat Kemenko Pangan RI</p>
            <h1 class="landing-headline">
              Mulai Pemantauan<br>Portal e-TLHP Sekarang
            </h1>
            <p class="landing-desc" id="landing-dynamic-desc">
              Kelola seluruh tindak lanjut hasil pemeriksaan BPK RI dan pengawasan internal secara terpadu — mulai dari penyusunan rencana aksi unit kerja, pengunggahan bukti dukung, hingga penerbitan LHA resmi.
            </p>

            {{-- Dynamic Info Box when user clicks Alur Tindak Lanjut / Ketentuan & SLA --}}
            <div id="landing-info-probis" class="hidden mb-6 rounded-xl bg-[#F5F8FB] border border-[#E2E8F0] p-4 text-xs text-[#4A5568] space-y-1.5">
              <div class="font-bold text-[#1D1D1F]">3 Tahap Siklus Tindak Lanjut (e-TLHP):</div>
              <div>1. <b>Perumusan Temuan (LHP)</b> — Auditor mencatat 4 unsur temuan &amp; rekomendasi.</div>
              <div>2. <b>Rencana Aksi &amp; Bukti</b> — Satker mengisi Renaksi, bukti dukung, &amp; NTPN setoran kas.</div>
              <div>3. <b>Verifikasi &amp; BATL</b> — Kesepakatan bersama menutup LHP menjadi <b>LHA Resmi</b>.</div>
            </div>

            <div id="landing-info-sla" class="hidden mb-6 rounded-xl bg-[#F5F8FB] border border-[#E2E8F0] p-4 text-xs text-[#4A5568] space-y-1.5">
              <div class="font-bold text-[#1D1D1F]">Kepatuhan Batas Waktu 60 Hari (UU No. 15 Tahun 2004):</div>
              <div>Setiap pejabat/unit kerja wajib menindaklanjuti rekomendasi laporan hasil pemeriksaan selambat-lambatnya <b>60 hari kalender</b> sejak laporan diterima.</div>
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <button type="button" onclick="showAuthStage()" class="landing-cta-btn">
                Masuk ke Portal e-TLHP
              </button>
            </div>

            {{-- Subtle architectural silhouette bars at bottom-left (matching Screenshot 1) --}}
            <div class="landing-decor-pillars" aria-hidden="true">
              <div class="pillar p1"></div>
              <div class="pillar p2"></div>
              <div class="pillar p3"></div>
            </div>
          </div>

          <div class="landing-hero-right">
            <img src="{{ asset('images/city-urban.png') }}?v=1"
                 alt="Ilustrasi Portal e-TLHP Inspektorat Kemenko Pangan"
                 class="landing-city-img">
          </div>
        </div>
      </div>
    </div>

    {{-- =======================================================================
         STAGE 2: LOGIN PAGE (Screenshot 2 Style using login-page.jpg)
         ======================================================================= --}}
    <div id="auth-stage" class="auth-split-card" style="display:none;">
      {{-- Left Panel: Brand + Isometric Illustration (login-page.jpg) --}}
      <div class="auth-left-illustration">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <img src="{{ asset('images/logo.png') }}?v=1" alt="Kemenko Pangan" class="h-8 w-8 object-contain">
            <div>
              <div class="text-sm font-extrabold tracking-wider text-[#005A87] leading-none">e-TLHP</div>
              <div class="text-[10px] font-medium text-[#64748B] mt-0.5">Inspektorat Kemenko Pangan</div>
            </div>
          </div>
          <button type="button" onclick="showLandingStage()" class="inline-flex items-center gap-1 text-xs font-medium text-[#64748B] hover:text-[#005A87] transition-colors">
            <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
            <span>Beranda</span>
          </button>
        </div>

        <div class="auth-ill-wrap">
          <img src="{{ asset('images/login-page.jpg') }}?v=1"
               alt="Otentikasi e-TLHP Inspektorat"
               class="auth-ill-img">
        </div>

        <div class="text-[11px] text-[#64748B] flex items-center justify-between">
          <span>Sistem Elektronik Tindak Lanjut Hasil Pemeriksaan</span>
          <span class="font-semibold text-[#005A87]">BPK RI &amp; APIP</span>
        </div>
      </div>

      {{-- Right Panel: Clean Login Form (matching Screenshot 2) --}}
      <div class="auth-right-form">
        <div class="auth-form-inner">
          <div class="mb-5">
            <img src="{{ asset('images/logoheader.png') }}?v=1"
                 alt="Kementerian Koordinator Bidang Pangan Republik Indonesia"
                 class="h-9 w-auto object-contain mb-4">
            <h1 class="auth-heading">Selamat Datang di e-TLHP !!</h1>
            <p class="auth-subheading">Platform Pemantauan Tindak Lanjut Hasil Pemeriksaan Inspektorat Kementerian Koordinator Bidang Pangan</p>
          </div>

          {{-- Role Filter Underline Tabs (matching "Email | Phone" in Screenshot 2) --}}
          <div class="auth-role-tabs">
            <button type="button" onclick="setLoginRoleTab('all')" id="lrt-all" class="auth-role-tab active">Semua Akun</button>
            <button type="button" onclick="setLoginRoleTab('staff')" id="lrt-staff" class="auth-role-tab">Auditor / Admin</button>
            <button type="button" onclick="setLoginRoleTab('pic')" id="lrt-pic" class="auth-role-tab">Unit Kerja</button>
          </div>

          <div id="login-err" class="login-err"></div>

          <form id="form-login" method="post" action="#" onsubmit="event.preventDefault(); doLogin();">
            <div class="form-group">
              <label class="form-label" for="lg-user">Akun Pengguna / Unit Kerja</label>
              <div id="user-combo" class="input-wrapper combo-wrapper">
                <input id="lg-user" name="username" type="text" class="input-control auth-input" placeholder="Pilih atau ketik akun pengguna..." autocomplete="username" required>
                <button id="user-combo-btn" class="input-icon-right" type="button" onclick="toggleUserCombo()" tabindex="-1" title="Pilih pengguna">
                  <i data-lucide="chevron-down" style="width:16px;height:16px;"></i>
                </button>
                <div id="user-combo-list" class="combo-list" style="display:none;" role="listbox"></div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="lg-pass">Kata Sandi</label>
              <div class="input-wrapper">
                <input id="lg-pass" name="password" type="password" class="input-control auth-input" placeholder="••••••••••••••••" autocomplete="current-password" required>
                <button id="pass-eye-btn" class="input-icon-right" type="button" onclick="togglePassVis()" tabindex="-1" title="Tampilkan Kata Sandi">
                  <i id="pass-eye-icon" data-lucide="eye" style="width:16px;height:16px;"></i>
                </button>
              </div>
            </div>

            <div class="login-options">
              <label class="checkbox-label">
                <input type="checkbox" id="remember-me" checked>
                <span>Tetap masuk</span>
              </label>
              <a href="#" class="forgot-link" onclick="alert('Silakan hubungi Administrator Inspektorat Kementerian Koordinator Bidang Pangan.'); return false;">Lupa kata sandi?</a>
            </div>

            <div class="auth-helper-line">
              Ingin melihat panduan singkat? <a href="#" onclick="showLandingStage(); return false;">Kembali ke Beranda</a>.
            </div>

            <button id="btn-login" class="btn-login-submit" type="submit">
              <span>Sign in</span>
            </button>
          </form>
        </div>
      </div>
    </div>

  </div>

  @include('partials.footer')
</div>