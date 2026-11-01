# Audit Log & Catatan Development — Portal e-TLHP Kemenko Pangan

Dokumen ini merupakan **Audit Log Development** yang mencatat seluruh perubahan skema database, logika bisnis backend, endpoint API, serta antarmuka pengguna (*frontend*) dalam rangka menyelaraskan sistem **Portal e-TLHP** dengan *Workflow & Metodologi Audit* ([WORKFLOW.md](WORKFLOW.md)).

---

## Ringkasan Sesi Development
- **Tanggal**: 30 Oktober 2026
- **Tujuan**: Menyelaraskan aplikasi secara penuh dengan siklus 4 Fase Audit (Pra-Pelaksanaan, 4 Unsur Temuan, Tindak Lanjut & Eviden NTPN/Setoran, serta Penutupan LHP menjadi LHA melalui Tanda Tangan Kesepakatan Auditor & Auditee).

---

## Rincian Perubahan Berdasarkan Komponen

### 1. Skema Database (Migration)
- **File (Kolaborasi `33b52fb` + Penutupan LHP &rarr; LHA)**:
  - [database/migrations/2026_10_30_000002_add_setoran_to_bukti_tindak_lanjut_table.php](database/migrations/2026_10_30_000002_add_setoran_to_bukti_tindak_lanjut_table.php) (`ntpn`, `nominal_setoran`)
  - [database/migrations/2026_10_30_000003_add_kondisi_akibat_jenis_audit_to_temuan.php](database/migrations/2026_10_30_000003_add_kondisi_akibat_jenis_audit_to_temuan.php) (`jenis_audit`, `kondisi`, `akibat`)
  - [database/migrations/2026_10_30_000004_add_lha_status_and_batl_signatures.php](database/migrations/2026_10_30_000004_add_lha_status_and_batl_signatures.php) (`status_dokumen`, `no_lha`, `ttd_auditor_*`, `ttd_auditee_*`)
- **Perubahan Tabel `temuan`**:
  - `jenis_audit` (`string(40)`, default `'kinerja'`): Menyimpan klasifikasi 4 jenis audit pada Fase 1 (`kinerja`, `keuangan`, `kepatuhan`, `khusus`).
  - `akibat` (`text`, nullable): Menyimpan unsur ke-4 dari temuan audit pada Fase 2 (Kondisi, Kriteria, Sebab, **Akibat**).
  - `status_dokumen` (`string(32)`, default `'lhp_sementara'`): Menandai apakah temuan masih berstatus **LHP (Temuan Sementara)** (`lhp_sementara`) atau telah resmi ditutup dan berubah menjadi **LHA** (`lha`).
  - `no_lha` (`string(80)`, nullable): Menyimpan kode resmi LHA (`LHA-BPK-xxx` / `LHA-INS-xxx`) yang diterbitkan otomatis saat LHP ditutup.
- **Perubahan Tabel `bukti_tindak_lanjut`**:
  - `ntpn` (`string(32)`, nullable): Menyimpan Nomor Transaksi Penerimaan Negara untuk tindak lanjut finansial (Fase 4 - Langkah D3).
  - `nominal_setoran` (`unsignedBigInteger`, nullable): Menyimpan nominal setoran ke kas negara dalam Rupiah (Fase 4 - Langkah D3).
- **Perubahan Tabel `batl`**:
  - `ttd_auditor_oleh` (`string(120)`, nullable) & `ttd_auditor_pada` (`timestamp`, nullable): Mencatat identitas dan waktu tanda tangan kesepakatan dari pihak **Auditor**.
  - `ttd_auditee_oleh` (`string(120)`, nullable) & `ttd_auditee_pada` (`timestamp`, nullable): Mencatat identitas dan waktu tanda tangan kesepakatan dari pihak **Auditee (Satker PIC)**.

---

### 2. Model & Logika Domain (Backend Models)
- **[app/Models/Temuan.php](app/Models/Temuan.php)**:
  - Menambahkan konstanta `JENIS_AUDIT_LABEL`, `DOKUMEN_LHP_SEMENTARA`, dan `DOKUMEN_LHA`.
  - Menambahkan method `rootTemuan()` untuk mengambil baris induk dari suatu sub-temuan.
  - Menambahkan method `rekomendasiProgress()` untuk menghitung total rekomendasi/sub-temuan pada satu Temuan Induk dan memvalidasi apakah **100% seluruh rekomendasi telah tuntas (`terverifikasi` / `batl`)** sesuai Fase 4 - Langkah D7.
  - Menambahkan method `syncStatusLha()` yang secara otomatis mengubah `status_dokumen` dari `lhp_sementara` menjadi `lha` beserta menerbitkan kode `no_lha` (`LHA-...`) ketika seluruh rekomendasi tuntas dan BATL telah ditandatangani oleh kedua pihak (Auditor & Auditee), serta mengembalikannya ke `lhp_sementara` apabila BATL dibatalkan.
- **[app/Models/BuktiTindakLanjut.php](app/Models/BuktiTindakLanjut.php)**:
  - Menambahkan `ntpn` dan `nominal_setoran` ke `$fillable` dan `$casts`.
- **[app/Models/Batl.php](app/Models/Batl.php)**:
  - Menambahkan atribut tanda tangan kedua pihak (`ttd_auditor_oleh`, `ttd_auditor_pada`, `ttd_auditee_oleh`, `ttd_auditee_pada`) serta helper `isSignedBoth()`.

---

### 3. Controller & Endpoint API
- **[routes/web.php](routes/web.php)**:
  - Menambahkan endpoint `POST /api/batl/{id}/sign` (`BatlController::sign`) untuk pengesahan tanda tangan kesepakatan penutupan LHP menjadi LHA.
- **[app/Http/Controllers/TemuanController.php](app/Http/Controllers/TemuanController.php)**:
  - Memperbarui `index()` agar mengirimkan `Akibat`, `JenisAudit`, `JenisAuditLabel`, `StatusDokumen`, `NoLha`, dan status tanda tangan BATL ke frontend.
  - Memperbarui `store()` dan `update()` untuk menyimpan `jenis_audit` dan `akibat`, serta memanggil `syncStatusLha()` saat sub-temuan ditambah/dihapus.
- **[app/Http/Controllers/BuktiController.php](app/Http/Controllers/BuktiController.php)**:
  - Memperbarui `index()` untuk mengembalikan progres ketuntasan rekomendasi (`progress: { total, tuntas, semuaTuntas }`), `statusDokumen`, dan `noLha`.
  - Memperbarui `store()` untuk memvalidasi dan menyimpan input opsional `ntpn` (alfanumerik) dan `nominal_setoran` (angka >= 0).
  - Memperbarui `bisaTerbitBatl()` agar memastikan 100% seluruh rekomendasi pada temuan induk telah tuntas sebelum mengizinkan penerbitan BATL.
- **[app/Http/Controllers/BatlController.php](app/Http/Controllers/BatlController.php)**:
  - Memperbarui `store()` untuk mengecek ketuntasan 100% rekomendasi, mencatat tanda tangan Auditor secara otomatis, mendukung opsi pengesahan sekaligus jika dokumen fisik sudah ditandatangani kedua pihak, dan memicu `syncStatusLha()`.
  - Menambahkan `sign()` agar pihak Auditee (Satker PIC) atau Admin dapat menandatangani kesepakatan penutupan LHP sehingga otomatis mengubah status data dari **LHP (Temuan Sementara)** menjadi **LHA Resmi**.
  - Memperbarui `destroy()` agar pembatalan BATL turut mengembalikan status dokumen menjadi `lhp_sementara`.

---

### 4. Antarmuka Pengguna (Blade Modals & JavaScript)
- **[resources/views/components/modals/form-temuan.blade.php](resources/views/components/modals/form-temuan.blade.php)**:
  - Menambahkan pilihan dropdown **Jenis Audit (Fase 1)** (Audit Kinerja, Audit Keuangan, Audit Kepatuhan, Audit Khusus/Investigatif) dan keterangan status LHP &rarr; LHA.
- **[resources/views/components/modals/detail.blade.php](resources/views/components/modals/detail.blade.php)**:
  - Menambahkan opsi dan kolom edit untuk unsur ke-4 temuan: **Akibat (Dampak / Kerugian)**.
- **[resources/views/components/modals/bukti.blade.php](resources/views/components/modals/bukti.blade.php)**:
  - Menambahkan blok input **Validasi Setoran Kas Negara (NTPN & Nominal Setoran Rp)** pada form unggah bukti tindak lanjut.
- **[public/js/core.js](public/js/core.js)**:
  - Menambahkan helper `jenisAuditLabel()`, `jenisAuditBadge()`, dan `dokumenBadge()` untuk menampilkan *badge* pembeda antara **`LHP (Temuan Sementara)`** dan **`LHA Resmi (LHA-...)`**.
- **[public/js/ruang-isian.js](public/js/ruang-isian.js)**, **[public/js/detail.js](public/js/detail.js)**, & **[public/js/rekap.js](public/js/rekap.js)**:
  - Menampilkan kartu **Akibat**, *badge* **Jenis Audit**, serta *badge* **Status Dokumen (LHP Sementara vs LHA Resmi)** pada tabel Ruang Isian dan kartu Rekap Laporan.
- **[public/js/bukti.js](public/js/bukti.js)**:
  - Mengirim dan menampilkan data **NTPN** & **Nominal Setoran (Rp)** pada riwayat bukti.
  - Menampilkan indikator **Ketuntasan Rekomendasi Temuan (`X/Y Tuntas`)**.
  - Menampilkan status **Tanda Tangan Auditor** dan **Tanda Tangan Auditee (Satker)** pada panel BATL, beserta tombol **"Tanda Tangani Kesepakatan Auditee & Tutup LHP Menjadi LHA"**.

---

## 5. Sesi Development Lanjutan (31 Oktober 2026): Adopsi Probis & Prinsip "Less-Click" UX (`Archive.zip`)

### A. Latar Belakang & Tujuan
Mengadopsi proses bisnis (*probis*) dan efisiensi interaksi antara **Auditor** dan **Auditee (Satker PIC)** dari prototipe `Archive.zip` dengan menerapkan prinsip **Less-Click UX** agar pengisian form dan verifikasi tidak memerlukan perpindahan banyak halaman/modal.

### B. Perubahan Skema Database & Backend Probis
1. **Migrasi Kewajiban & Realisasi Finansial ([database/migrations/2026_10_31_000005_add_financial_probis_columns_to_temuan_table.php](database/migrations/2026_10_31_000005_add_financial_probis_columns_to_temuan_table.php))**:
   - Menambahkan 3 kolom pada tabel `temuan`:
     - `nilai_temuan` (`decimal(18, 2)`, default `0`): Target nominal penyetoran ke kas negara (Rp 0 untuk rekomendasi administratif/non-finansial).
     - `nilai_realisasi` (`decimal(18, 2)`, default `0`): Akumulasi realisasi setoran kas negara dari bukti tindak lanjut ber-NTPN.
     - `selisih` (`decimal(18, 2)`, default `0`): Sisa kewajiban penyetoran (`max(0, nilai_temuan - nilai_realisasi)`).
2. **Kalkulasi Otomatis Realisasi Finansial ([app/Models/Temuan.php](app/Models/Temuan.php))**:
   - Menambahkan `Temuan::syncFinancialRealisasi()` yang menghitung akumulasi `nominal_setoran` dari seluruh bukti tindak lanjut yang valid (tidak ditolak) serta menyinkronkan `nilai_realisasi` dan `selisih`.
   - Sesuai probis `Archive.zip`, apabila status rekomendasi telah tuntas (`terverifikasi` / `batl`) dan memiliki `nilai_temuan > 0` tanpa rincian setoran terpisah, kewajiban finansial diselesaikan (`nilai_realisasi = nilai_temuan`, `selisih = 0`).
3. **Batas Waktu Kepatuhan 60 Hari Kalender (UU No. 15/2004 Pasal 20) & Sinkronisasi Output Otomatis ([app/Http/Controllers/TemuanController.php](app/Http/Controllers/TemuanController.php) & [app/Http/Controllers/BuktiController.php](app/Http/Controllers/BuktiController.php))**:
   - Mengirimkan `TanggalInput` dan `DeadlineDate` (`created_at + 60 hari kalender`), serta `NilaiTemuan`, `NilaiRealisasi`, dan `Selisih` pada endpoint `/api/temuan` dan `/api/bukti`.
   - Saat Satker mengunggah bukti tindak lanjut di `BuktiController::store`, uraian progres (`uraian`) secara otomatis menyinkronkan kolom `output` pada `Temuan` sehingga Satker **tidak perlu bekerja dua kali** (mengunggah bukti lalu membuka modal lain hanya untuk menyalin teks ke kolom Output).

### C. Penerapan Prinsip "Less-Click" UX Antara Auditor dan Auditee
1. **1-Stop Form untuk Auditor ([resources/views/components/modals/form-temuan.blade.php](resources/views/components/modals/form-temuan.blade.php) & [public/js/ruang-isian.js](public/js/ruang-isian.js))**:
   - Sebelumnya, Auditor harus membuat Temuan di halaman *Temuan*, lalu berpindah menu ke halaman *Detail* untuk mengisi Kondisi, Kriteria, Sebab, Akibat, dan Rekomendasi (5–7 klik).
   - Kini dalam **1 Modal Terpadu**, Auditor langsung merumuskan:
     - Metadata LHP Induk (`Sumber Audit`, `Jenis Audit`, `Kode Temuan`, `Uraian Temuan`, `Sub Temuan`)
     - **Grid 2x2 — 4 Unsur Pokok Temuan** (`1. Kondisi`, `2. Kriteria`, `3. Sebab`, `4. Akibat`)
     - **Rekomendasi Audit**, **Target Nominal Penyetoran (Rp)** (dengan auto-format ribuan Rupiah & indikator otomatis non-finansial bila diisi 0), serta **PIC Unit Penanggung Jawab**.
2. **Clean Renaksi Modal & Banner Pengingat untuk Auditee/Satker ([resources/views/components/modals/form-temuan.blade.php](resources/views/components/modals/form-temuan.blade.php) & [public/js/ruang-isian.js](public/js/ruang-isian.js))**:
   - Saat akun **PIC (Satker)** membuka modal pengisian (`+ Buat Renaksi` / `Ubah Renaksi`), seluruh field milik Auditor disembunyikan dan digantikan oleh **Banner Konteks Temuan & Rekomendasi Audit** (beserta info Jatuh Tempo 60 Hari & Target Penyetoran Kas Negara).
   - Satker langsung fokus mengisi **Uraian Rencana Aksi (Renaksi)** dan **Target Jadwal Pelaksanaan**.
   - Pada kartu rincian yang belum memiliki Renaksi, tampil **Banner Pengingat Kuning ("Rencana Aksi Belum Disusun")** dengan tombol 1-klik **`+ Buat Renaksi`**.
3. **Evaluasi Sebaris 1-Klik (*Inline 1-Click Review*) & Auto-Prefill Sisa Setoran di Modal Bukti ([resources/views/components/modals/bukti.blade.php](resources/views/components/modals/bukti.blade.php) & [public/js/bukti.js](public/js/bukti.js))**:
   - Menampilkan strip **Kewajiban Pemulihan Kas Negara (Target, Realisasi, Sisa Kewajiban)** dan **Batas Waktu 60 Hari** di bagian atas modal Bukti.
   - Kolom **Nominal Setoran (Rp)** otomatis terisi (*auto-prefill*) dengan nominal **Sisa Kewajiban (`Selisih`)** untuk rekomendasi finansial.
   - Bagi **Auditor**, evaluasi bukti yang berstatus `menunggu`/`pending` tidak lagi memerlukan klik buka-tutup akordeon: tersedia **1 baris kolom input catatan evaluasi** beserta tombol langsung **`Setujui (Tuntas)`**, **`Pending`**, dan **`Revisi / Tolak`** dalam 1 klik.
4. **KPI Pemulihan Keuangan Negara di Dashboard ([public/js/dashboard.js](public/js/dashboard.js))**:
   - Menambahkan kartu ringkasan **Realisasi Pemulihan Kas Negara** (Total Realisasi Setor vs Target Penyetoran, Sisa Kewajiban, `% Setor`, serta jumlah dokumen **LHP Sementara** vs **LHA Resmi**).

---

## 6. Sesi Development Lanjutan (1 November 2026): Implementasi Penuh UI & UX Institusional (`Archive.zip`)

### A. Identitas Visual & Konfigurasi Tema ([resources/views/partials/head.blade.php](resources/views/partials/head.blade.php) & [public/css/mkdi.css](public/css/mkdi.css))
- Mengadopsi palet warna institusional **Kemenko Pangan Clean Slate & Emerald** (`#047857` emerald-700, `#0F172A` slate-900, `#F8FAFC` slate-50) serta tipografi `Plus Jakarta Sans` + `JetBrains Mono` (`font-mono`).
- Menambahkan konfigurasi `tailwind.config` (`colors.pangan`, `fontFamily.mono`) dan reset border standar agar seluruh utilitas `border-*` dan `divide-*` Tailwind CSS bekerja konsisten di seluruh komponen.
- Menambahkan animasi transisi `.animate-slideIn` dan `.custom-scrollbar` sesuai `Archive.zip`.

### B. Dashboard Eksekutif 5-Kolom Asimetris ([public/js/dashboard.js](public/js/dashboard.js))
- **Filter Eksekutif Terpadu**: Filter cepat berdasarkan `Sumber Audit`, `Jenis Audit`, `Tahun`, dan `Unit Kerja PIC` beserta tombol `Reset`.
- **Asymmetric 5-Column KPI Grid**:
  1. **Total Temuan** (dilengkapi jumlah Rincian/Sub, `LHP Sementara`, dan `LHA Resmi`).
  2. **Rekomendasi** (dilengkapi indikator jumlah `Rencana Aksi ditetapkan` dan `PIC Mengisi`).
  3. **Tingkat Penyelesaian Tindak Lanjut (`Utama` — Kartu Dominan 2 Kolom)** dengan persentase penyelesaian besar, *badge* `Selesai` & `On Progress`, serta *progress bar* emerald penuh (`Target Penyelesaian: 100%`).
  4. **Pemulihan Dana (Kas Negara)** dengan nominal `Rp Realisasi`, `Target`, *progress bar* amber, `% Setor`, dan `Sisa Kewajiban`.
- **2-Column Executive Charts**:
  - **Status Rekomendasi (2 Kolom)**: Donut interaktif (`Selesai` emerald, `On Progress` amber, `Belum TL` slate) dengan legenda di bagian bawah.
  - **Sebaran Temuan per Unit PIC (3 Kolom)**: Grafik batang horizontal dengan *tooltip* interaktif (`X rekomendasi, Y selesai`).

### C. Ruang Isian: Segmented Status Filter, Tabel Master 7 Kolom & Slide-In Executive Detail Panel ([public/js/ruang-isian.js](public/js/ruang-isian.js) & [public/js/detail.js](public/js/detail.js))
1. **Segmented Status Filter Tabs & Multi-Filter Bar**:
   - Tab status 1-klik (`Semua Status`, `On Progress`, `Selesai`, `Belum TL`) yang terintegrasi dengan kolom pencarian instan, filter `Sumber Audit`, `Jenis Audit`, `Tahun`, `Unit Kerja PIC`, tombol `Reset`, dan tombol `+ Tambah Temuan`.
2. **Tabel Master Institusional 7 Kolom**:
   - `No. Dokumen LHP / LHA` (kode *monospace* + tahun + *badge* LHP/LHA)
   - `Uraian Kegiatan & Pelaksana` (uraian pokok + jumlah rincian/rekomendasi)
   - `Sumber & Jenis Audit` (*badge* `BPK RI` / `Inspektorat` + klasifikasi 4 jenis audit)
   - `PIC / Unit Kerja` (tampilan bertumpuk rapi + tombol popover `+N unit kerja lainnya`)
   - `Batas Waktu` (tanggal jatuh tempo 60 hari + indikator `Selesai` / `Lewat X hari` / `Sisa X hari`)
   - `Status` (*dot badge* `Selesai`, `On Progress`, `Belum TL`)
   - `Kelengkapan` (`X/Y Tuntas`, `%`, *progress bar* emerald, dan tombol `Detail ->`).
3. **Slide-In Executive Document Detail Panel (`showLhaDetail` / `closeLhaDetail`)**:
   - Klik pada baris tabel atau tombol `Detail ->` membuka panel **Detail Dokumen LHP/LHA** bergaya `Archive.zip` tanpa memuat ulang halaman:
     - **Breadcrumb & Header Eksekutif**: Tombol `<- Tabel Dokumen`, kode dokumen, *badge* sumber/jenis/tahun/status, batas waktu 60 hari, serta indikator penyelesaian dokumen.
     - **Top Banner BATL & Kesepakatan LHA**: Menampilkan status Berita Acara Tindak Lanjut (BATL) dan menyediakan tombol 1-klik **`Terbitkan BATL Sekarang`** (bagi Auditor saat seluruh rekomendasi tuntas) atau **`Tanda Tangani Kesepakatan Auditee -> Terbitkan LHA`** (bagi Satker/Admin untuk menutup LHP menjadi LHA Resmi).
     - **Grid 2x2 — 4 Unsur Pokok Temuan Pemeriksaan**: Menampilkan `1. Kondisi (Fakta Riil)`, `2. Kriteria (Standar / Aturan)`, `3. Sebab (Akar Masalah)`, dan `4. Akibat (Dampak / Kerugian)` secara berdampingan.
     - **Strip 2 Kolom Rencana Aksi (Renaksi) & Target Pelaksanaan**: Dilengkapi tombol 1-klik `+ Buat Renaksi` / `Ubah` serta *callout banner* pengingat berwarna amber jika Renaksi belum disusun.
     - **Tabel Log Capaian / Riwayat Bukti Tindak Lanjut**: Menampilkan riwayat dokumen bukti dukung, nomor NTPN & nominal setoran, catatan auditor, serta **Baris Evaluasi Cepat Auditor 1-Klik (`Setujui (Tuntas)`, `Pending`, `Revisi`)** langsung di dalam tabel detail.
     - **Inline Form Bukti Tindak Lanjut**: Memungkinkan Satker (PIC) mengunggah bukti tindak lanjut, mengisi tanggal dokumen, uraian capaian aktual, serta NTPN & nominal setoran **langsung di dalam panel detail dokumen** tanpa harus membuka modal terpisah.

---

## 7. Sesi Development Lanjutan (1 November 2026): Penyederhanaan Navigasi "Daftar Temuan" & Ruang Kerja Terpadu 3 Komponen (Zero-Detour UX)

### A. Latar Belakang & Tujuan UX
- Sebelumnya, menu sidebar **"Ruang Isian"** memecah alur kerja menjadi dua submenu terpisah (`Temuan / Sub Temuan` dan `Detail`), ditambah adanya tombol-tombol modal berlapis (`Modal Bukti & BATL`, `Panel BATL`, modal Renaksi terpisah) yang membuat alur pengisian terasa memutar-mutar bagi Auditor maupun Satker (Auditee).
- Sesuai arahan pengguna, menu tersebut diganti langsung menjadi satu menu tunggal **`Daftar Temuan`** yang menampilkan **Tabel Temuan**, di mana Auditor dan Satker cukup memilih salah satu baris temuan (`Buka & Isi ->` / `Buka & Kelola ->`) untuk langsung mengakses dan mengisi seluruh komponen di dalamnya pada satu halaman terpadu.

### B. Perubahan Navigasi & Routing ([resources/views/partials/sidebar.blade.php](resources/views/partials/sidebar.blade.php), [public/js/router.js](public/js/router.js), [routes/web.php](routes/web.php), [public/js/dashboard.js](public/js/dashboard.js))
1. **Sidebar Menu Tunggal (`Daftar Temuan`)**:
   - Menghapus dropdown `Ruang Isian` beserta dua submenunya (`Temuan / Sub Temuan` dan `Detail`).
   - Menggantinya dengan tombol navigasi langsung **`Daftar Temuan`** yang langsung membuka Tabel Temuan (`S.activeLhaNo = null; navigate('ruang-isian')`).
2. **Penyatuan Route & Deep-Link**:
   - Menyatukan route `/temuan`, `/ruang-isian`, dan `/ruang-isian/detail` agar semuanya mengarah ke halaman terpadu `Daftar Temuan` (`ruang-isian`), sehingga tidak ada lagi halaman yang terpisah atau membingungkan.
   - Memperbarui pintasan dari **Dashboard** (klik kartu PIC dan tombol `Buka Tabel Temuan`) agar langsung mengarahkan pengguna ke **Daftar Temuan**.

### C. Ruang Kerja Terpadu 3 Komponen di Dalam Temuan ([public/js/ruang-isian.js](public/js/ruang-isian.js))
- **Alur Cepat 3 Langkah di Atas Tabel Temuan**: Menampilkan panduan singkat di atas tabel (`1. Pilih Temuan di Tabel` -> `2. Satker Isi Renaksi & Upload Bukti` -> `3. Auditor Evaluasi & Terbitkan BATL/LHA`).
- **Tombol Aksi Kontekstual Sesuai Peran**:
  - Bagi **Satker (PIC)**: Tombol pada setiap baris tabel bertuliskan **`Buka & Isi ->`**.
  - Bagi **Auditor / Admin**: Tombol pada setiap baris tabel bertuliskan **`Buka & Kelola ->`**.
- **3 Komponen Berurutan di Dalam Temuan Terpilih (`showLhaDetail`) — Tanpa Modal Berlapis**:
  1. **Komponen 1 — Pokok Temuan (4 Unsur) & Rekomendasi Audit (Domain Auditor)**:
     - Menampilkan 4 Unsur Temuan (`Kondisi`, `Kriteria`, `Sebab`, `Akibat`) dan kotak **Rekomendasi Resmi Auditor** beserta ringkasan **Kewajiban Setor Kas Negara (Target, Realisasi, Sisa Kewajiban)**.
     - Dilengkapi tombol `Edit Temuan / Rekomendasi` dan `+ Tambah Rincian / Sub Temuan` khusus bagi Auditor/Admin.
  2. **Komponen 2 — Rencana Aksi Unit Kerja (Renaksi) & Target Pelaksanaan (Domain Satker — Inline Form)**:
     - Satker dapat langsung mengisi atau memperbarui **Rencana Aksi Tindak Lanjut**, **Target Tanggal Penyelesaian**, dan **Output / Capaian Awal** melalui form *inline* langsung di tempat (`toggleInlineRenaksi` & `saveInlineRenaksi`) tanpa membuka modal *pop-up*.
  3. **Komponen 3 — Bukti Tindak Lanjut (Eviden) & Evaluasi Auditor (Kolaborasi Satker & Auditor — Inline)**:
     - **Satker**: Mengunggah berkas eviden, tanggal dokumen, uraian capaian, serta **Nomor NTPN (16 karakter)** & **Nominal Setoran (Rp)** (otomatis terisi sisa kewajiban) langsung pada form *inline* di bawah tabel bukti.
     - **Auditor**: Mengevaluasi setiap bukti yang masuk dengan **1-klik langsung di baris tabel** (`Setujui (Tuntas)`, `Pending`, `Revisi`) menggunakan endpoint `PUT /api/bukti/{id}/verifikasi`.
- **Banner Penerbitan BATL & Kesepakatan LHA Inline (`renderTopBatlBanner`)**:
  - Ketika seluruh rekomendasi pada temuan telah **100% Tuntas**, Auditor dapat langsung mengisi Nomor BATL, Tanggal, Catatan, dan Berkas BATL melalui **form inline** di bagian atas halaman (`submitInlineBatl`) untuk menerbitkan BATL sekaligus membubuhkan tanda tangan Auditor.
  - Selanjutnya, Satker (Auditee) cukup menekan 1 tombol **`Tanda Tangani Kesepakatan Auditee -> Terbitkan LHA`** (`signBatlFromDetail`) di banner yang sama untuk menutup LHP menjadi **LHA Resmi**.

---

## 8. Sesi Development Lanjutan (1 November 2026): Transformasi Desain Apple UI Kit (Minimalist, Clean, & Anti-AI Slop)

### A. Prinsip Desain & Palet Warna Apple HIG
Sesuai arahan pengguna untuk menghadirkan antarmuka yang bersih, minimalis, modern, mudah digunakan, serta bebas dari elemen *AI slop* (warna neon/pelangi, *banner* instruksional bertele-tele, teks penjelasan berlapis, dan ikon dekoratif yang tidak perlu):
- **Palet Warna Apple Design System** ([resources/views/partials/head.blade.php](resources/views/partials/head.blade.php), [public/css/mkdi.css](public/css/mkdi.css)):
  - **Canvas / Background**: Apple System Grouped Background (`#F5F5F7`)
  - **Surface / Card**: Pure White (`#FFFFFF`) dengan *hairline border* halus (`border-black/[0.06]` / `#E5E5EA`) dan *ambient shadow* lembut (`0 1px 3px rgba(0,0,0,0.02)`)
  - **Tipografi & Hierarki Teks**: Apple SF Pro (`-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter`) dengan warna `#1D1D1F` (utama), `#6E6E73` (sekunder), dan `#86868B` (tersier/label)
  - **Aksen Tunggal**: Apple System Blue (`#0071E3`, hover `#0077ED`, *tint* `#0071E3/10`), menggantikan warna *emerald/amber/purple/indigo* yang mencolok.

### B. Pembersihan Konten & Komponen (Anti-AI Slop)
1. **Sidebar & Frosted Glass Header** ([resources/views/partials/sidebar.blade.php](resources/views/partials/sidebar.blade.php), [resources/views/partials/header.blade.php](resources/views/partials/header.blade.php)):
   - Sidebar menggunakan latar *translucent* terang (`#FAFAFC/95`), menghapus teks *header* grup menu yang redundan, dan menggunakan *pill* aktif `#0071E3` serta avatar monokrom `#E5E5EA`.
   - Topbar disederhanakan menjadi *frosted-glass toolbar* setinggi `56px` (`backdrop-filter: saturate(180%) blur(20px)`), menghapus ikon *sparkles* kuning-biru, subjudul panjang, dan tombol lonceng notifikasi dekoratif.
2. **Dashboard Bento & Analitik Proses Bisnis** ([public/js/dashboard.js](public/js/dashboard.js)):
   - **4 BAN (*Big Number*) Cards Kontekstual**:
     1. `Dokumen Audit` (total dokumen, proporsi `LHP` vs `LHA`, serta rincian `BPK RI` vs `Inspektorat`).
     2. `Kesiapan Renaksi` (persentase dan rasio Rencana Aksi yang sudah disusun Satker vs belum diisi, serta jumlah unit kerja aktif).
     3. `Penyelesaian` (persentase rekomendasi tuntas, total berkas bukti terunggah, dan jumlah bukti yang menunggu review Auditor).
     4. `Batas Waktu (60 Hari)` (jumlah dokumen yang masih dalam tenggang SLA 60 hari vs terlambat, rata-rata sisa hari kerja, atau realisasi kas negara bila ada temuan finansial).
   - **Tahapan Tindak Lanjut (*Donut + 4-Stage Pipeline*)**: Memadukan grafik *Donut* dengan rincian posisi proses bisnis (`1. Belum Isi Renaksi`, `2. Menunggu Unggah Bukti`, `3. Review Bukti Auditor`, `4. Disetujui / Tuntas`) untuk mendeteksi *bottleneck* antara Satker dan Auditor.
   - **Beban & Progres Unit Kerja (*Sorted Stacked Bar*)**: Mengurutkan unit kerja dari jumlah rekomendasi terbanyak ke paling sedikit membentuk piramida rapi, menggunakan *3-Color Stacked Bar* (`#0071E3` Selesai, `#86868B` Proses, `#D2D2D7` Belum) yang tidak lagi menipu mata saat progres masih 0%.
   - **Tabel Pantauan Prioritas & Batas Waktu 60 Hari**: Menggantikan duplikasi 11 kartu Unit Kerja di bawah dengan tabel pantauan dokumen prioritas lengkap dengan tahapan saat ini, sisa hari SLA 60 hari, dan tombol 1-klik `Buka ›` (`openTemuanFromDashboard`) yang langsung membuka ruang kerja temuan terkait.
3. **Daftar Temuan & Workspace Komponen** ([public/js/ruang-isian.js](public/js/ruang-isian.js), [public/js/core.js](public/js/core.js)):
   - Menghapus *banner* instruksional hijau `Alur Cepat` di atas tabel.
   - Mengubah tab status menjadi **Apple Segmented Control** (`bg-[#F5F5F7] p-1 rounded-[9px]`) dengan *pill* aktif putih.
   - Menyederhanakan tabel menjadi 6 kolom bersih (`Dokumen`, `Temuan`, `Audit`, `Unit Kerja`, `Batas Waktu`, `Progres`) dengan aksi `Buka ›`.
   - Di halaman detail temuan (`showLhaDetail`), menghapus seluruh judul seksi panjang (`Komponen 1 — ...`), keterangan dalam kurung (`1. Kondisi (Fakta Riil)` menjadi `Kondisi`), dan *banner* peringatan kuning, digantikan dengan tata letak kartu putih dan *tile* `#F5F5F7` yang ringkas.
4. **Rekap & Modal Formulir** ([public/js/rekap.js](public/js/rekap.js), [resources/views/components/modals/form-temuan.blade.php](resources/views/components/modals/form-temuan.blade.php), [resources/views/components/modals/confirm-delete.blade.php](resources/views/components/modals/confirm-delete.blade.php)):
   - Menghapus ikon filter warna-warni, kalimat petunjuk klik di atas daftar Rekap, serta *hint* panjang di setiap kolom modal formulir.
5. **Halaman Login Bergaya Apple ID / iCloud** ([resources/views/auth/login.blade.php](resources/views/auth/login.blade.php), [public/css/mkdi.css](public/css/mkdi.css), [public/js/auth.js](public/js/auth.js)):
   - Menghapus latar gelap navy bergaya *cyber*, foto gedung *stock* Unsplash, ikon neon cyan (`#38bdf8`), daftar promosi generik (*Transparan, Terintegrasi, Efisien*), serta garis pemisah `"atau"` yang tidak memiliki tombol alternatif di bawahnya.
   - Menggantinya dengan **Centered Single-Column Frosted Card** (`max-width: 420px`, `border-radius: 26px`, `rgba(255,255,255,0.92)`, `backdrop-filter: saturate(180%) blur(24px)`) di atas kanvas terang Apple (`#F5F5F7` → `#FFFFFF`).
   - Memperbarui input form menjadi *recessed well* `#F5F5F7` dengan *focus ring* Apple Blue (`#0071E3`), tombol masuk `#0071E3` tanpa bayangan neon, serta *dropdown combobox* pengguna dengan avatar monokrom `#E5E5EA` dan *pill* peran minimalis.

---

## 9. Sesi Development Lanjutan (1 November 2026): Portal Landing Page (`city-urban.png`), Split Login Page (`login-page.jpg`), & Rebranding Resmi e-TLHP Inspektorat Kemenko Pangan

### A. Rebranding Nama Aplikasi (`e-TLHP`) & Footer Resmi Instansi
- Mengganti penamaan aplikasi dari `"MKDI"` (yang sebelumnya merujuk pada satu biro) menjadi nama resmi aplikasi: **`e-TLHP` (Sistem Elektronik Tindak Lanjut Hasil Pemeriksaan) — Inspektorat Kementerian Koordinator Bidang Pangan Republik Indonesia** pada:
  - Judul halaman ([resources/views/partials/head.blade.php](resources/views/partials/head.blade.php))
  - Identitas *brand* di Sidebar ([resources/views/partials/sidebar.blade.php](resources/views/partials/sidebar.blade.php))
  - Footer aplikasi resmi di dalam dashboard/workspace ([resources/views/partials/footer.blade.php](resources/views/partials/footer.blade.php)) dan di halaman portal/login ([resources/views/auth/login.blade.php](resources/views/auth/login.blade.php)).

### B. Portal Landing Page & Split Login Page ([resources/views/auth/login.blade.php](resources/views/auth/login.blade.php), [public/css/mkdi.css](public/css/mkdi.css), [public/js/auth.js](public/js/auth.js))
1. **Stage 1 — Portal Landing Page (`#landing-stage` menggunakan `public/images/city-urban.png`)**:
   - Mengadopsi tata letak referensi *Citizen Portal*: bingkai kaca berlapis (*double glass frame*) di atas latar belakang arsitektur isometrik dengan *top navigation bar* (`logoheader.png`, *badge* `[e-TLHP]`, menu interaktif `PORTAL`, `ALUR TINDAK LANJUT`, `KETENTUAN & SLA`, serta tombol `LOG IN` & `PORTAL MASUK`).
   - Kolom kiri menampilkan *headline* **`Mulai Pemantauan Portal e-TLHP Sekarang`**, deskripsi sistem Inspektorat Kemenko Pangan, dan tombol CTA utama **`Masuk ke Portal e-TLHP`** (`showAuthStage()`), sedangkan kolom kanan menampilkan ilustrasi isometrik 3D [`public/images/city-urban.png`](public/images/city-urban.png).
2. **Stage 2 — Split Login Page (`#auth-stage` menggunakan `public/images/login-page.jpg`)**:
   - Mengadopsi tata letak referensi *2-Column Split Login*:
     - **Panel Kiri (`#F4F8FA`)**: Menampilkan identitas `e-TLHP · Inspektorat Kemenko Pangan`, tombol `<- Beranda` (`showLandingStage()`), serta ilustrasi otentikasi isometrik [`public/images/login-page.jpg`](public/images/login-page.jpg).
     - **Panel Kanan (`#FFFFFF`)**: Menampilkan sapaan **`Selamat Datang di e-TLHP !!`**, subjudul resmi Inspektorat Kementerian Koordinator Bidang Pangan, *underline filter tabs* (`Semua Akun`, `Auditor / Admin`, `Unit Kerja` via `setLoginRoleTab`) untuk memfilter pilihan akun pada *combobox*, kolom input akun & kata sandi, opsi `Tetap masuk` & `Lupa kata sandi?`, tautan kembali ke beranda, serta tombol `Sign in` berwarna biru tua institusional (`#005A87`).

### C. Restorasi Layout Landing Page & Penyeragaman Style Footer ([resources/views/auth/login.blade.php](resources/views/auth/login.blade.php), [public/css/mkdi.css](public/css/mkdi.css), [resources/views/partials/footer.blade.php](resources/views/partials/footer.blade.php))
- Merapikan kotak biru pada teks **`e-TLHP`** di navbar atas (`.landing-portal-badge`) dengan bingkai 4 sisi lengkap (`border: 1.75px solid #0077CC; border-radius: 6px; padding: 3px 10px; background: rgba(0, 119, 204, 0.04)`) sehingga tidak terpotong garis atasnya.
- Menyeragamkan footer halaman landing/login dengan style footer saat sudah login: meng-include langsung `resources/views/partials/footer.blade.php` (`.app-footer`) yang memuat teks resmi:
  > **`e-TLHP © 2026 Inspektorat Kementerian Koordinator Bidang Pangan RI`**
  dengan styling minimalis, centered, teks abu-abu elegan, dan garis pemisah halus di bagian bawah layar.

### D. Redirection Pasca-Login ke Dashboard & Optimasi Kolom Temuan ([public/js/auth.js](public/js/auth.js), [public/js/router.js](public/js/router.js), [public/js/dashboard.js](public/js/dashboard.js), [public/js/core.js](public/js/core.js))
- **Redirect Otomatis ke Dashboard**: Mengatur `doLogin()` agar memanggil `resetRouterToDashboard()` sehingga setelah user berhasil login, state routing dan URL selalu diarahkan langsung ke halaman `/dashboard` tanpa terintersepsi path sebelumnya.
- **Hierarki Kolom Tabel Prioritas & Batas Waktu 60 Hari**:
  - Menerapkan `table-fixed` dengan pembagian lebar kolom: **Temuan Utama diberikan porsi terbesar (41%)**, sedangkan Unit Kerja dipadatkan ke 17%.
  - Menghapus `whitespace-nowrap` pada kolom Unit Kerja serta membatasi maksimal 2 baris (`line-clamp-2`) dengan tooltip nama lengkap agar tidak melebar berlebihan saat banyak satker terlibat.
  - Memperluas keterbacaan judul Temuan (`line-clamp-2 leading-relaxed font-semibold`) agar teks temuan tidak terpotong menjadi satu kata.
- **Perbaikan Kalkulasi Hari SLA**: Memperbaiki `getDeadlineInfo` di `core.js` dengan menyertakan alias `daysRemaining: diffDays` sehingga teks tenggat menampilkan hitungan sisa hari yang presisi (`Sisa X hari`) dan tidak lagi bertuliskan `Sisa undefined hari`.

---

## 10. Sesi Development Lanjutan (1 November 2026): Pembaruan Probis & Struktur Data 3-Level (LHP -> Temuan -> Sub Temuan) Sesuai Standar Pemeriksaan

### A. Rekonstruksi Proses Bisnis (Probis) & Hirarki Data
Memperbaiki alur dan relasi data pemeriksaan menjadi 3 level hierarkis terpisah:
1. **Level 1 — Dokumen LHP (Laporan Hasil Pemeriksaan)**:
   - Dokumen induk resmi (misal `LHP-BPK-001`, `LHP-INS-001`). Memiliki sumber audit, nomor LHP, tahun, dan batas waktu 60 hari kalender.
2. **Level 2 — Temuan Pokok**:
   - Pokok permasalahan temuan (misal `T-001`, `T-002`). Memiliki 4 unsur temuan (`Kondisi`, `Kriteria`, `Sebab`, `Akibat`), Rekomendasi resmi, PIC (unit kerja penanggung jawab), Rencana Aksi, dan Bukti Tindak Lanjut.
3. **Level 3 — Sub Temuan (Opsional)**:
   - Rincian turunan di bawah temuan pokok (misal `ST-001`, `ST-002`). Memiliki 4 unsur mandiri, Rekomendasi mandiri, Rencana Aksi mandiri, Bukti Tindak Lanjut mandiri, **Nilai Finansial mandiri**, **Jenis Audit mandiri** (contoh: temuan induk adalah Audit Kinerja, namun sub temuan berupa temuan finansial dengan Jenis Audit Keuangan), dan **PIC yang dapat disesuaikan** (default mewarisi PIC induk namun dapat diubah jika penanggung jawab berbeda).
4. **Kalkulasi Progres Agregat**:
   - Jika 1 LHP memiliki 1 Temuan dan 2 Sub Temuan, total item tindak lanjut dihitung sebanyak **3 item**.
   - Pada tabel utama LHP ditampilkan keterangan: `1 Temuan · 2 Sub Temuan · 3 total`, dan progress bar menghitung penyelesaian agregat dari total 3 item tersebut (`X/3 (pct%)`).

### B. Database Migration, Model, & Controller API
1. **Database Migration** ([database/migrations/2026_11_01_000001_add_kode_temuan_and_kode_sub_temuan_to_temuan.php](database/migrations/2026_11_01_000001_add_kode_temuan_and_kode_sub_temuan_to_temuan.php)):
   - Menambahkan kolom `kode_temuan` (misal `T-001`) dan `kode_sub_temuan` (misal `ST-001`) ke tabel `temuan`.
   - Dilengkapi *backfill logic* otomatis untuk baris data yang sudah ada sebelumnya.
2. **Model Temuan** ([app/Models/Temuan.php](app/Models/Temuan.php)):
   - Menambahkan `kode_temuan` dan `kode_sub_temuan` ke dalam array `$fillable`.
3. **Controller & Endpoint Penomoran Otomatis** ([app/Http/Controllers/TemuanController.php](app/Http/Controllers/TemuanController.php), [routes/web.php](routes/web.php)):
   - Menambahkan endpoint `GET /api/temuan/next-kode-temuan?no=LHP-001` untuk menghasilkan kode temuan otomatis berikutnya (`T-001`, `T-002`, dst.) per dokumen LHP.
   - Menambahkan endpoint `GET /api/temuan/next-kode-sub?parent_id=X` untuk menghasilkan kode sub temuan otomatis berikutnya (`ST-001`, `ST-002`, dst.) per temuan induk.
   - Memperbarui `index()` untuk mengembalikan relasi `parent`, `KodeTemuan`, `KodeSubTemuan`, `Kode`, jenis audit mandiri, dan PIC mandiri.
   - Memperbarui `store()` dan `update()` untuk mendukung penyimpanan kode yang dapat diedit secara fleksibel (*editable & automatic*), PIC mandiri, nilai finansial mandiri, dan jenis audit mandiri.

### C. Antarmuka Hirarkis Apple Design & Workspace Mandiri ([public/js/ruang-isian.js](public/js/ruang-isian.js), [resources/views/components/modals/form-temuan.blade.php](resources/views/components/modals/form-temuan.blade.php))
1. **Tabel Hirarki LHP Bersih (Bukan Kartu Bertumpuk)**:
   - Saat membuka dokumen LHP (`showLhaDetail`), seluruh temuan ditampilkan dalam **tabel terstruktur yang rapi**.
   - Jika suatu temuan memiliki sub temuan, ditampilkan tombol/badge interaktif `${childSubs.length} Sub Temuan ▼` (`toggleSubHierarchy`) yang membuka baris akordeon anak di bawahnya dengan sub-tabel indentasi bergaris aksen biru.
   - User dapat melihat seluruh peta konten temuan dan sub temuan di dalam dokumen LHP secara komprehensif sebelum memilih item mana yang ingin ditelaah atau diisi.
2. **Tombol "Lihat Detail" & Workspace Pengisian Mandiri (`openItemWorkspace`)**:
   - Baik pada baris Temuan maupun baris Sub Temuan, disediakan tombol **`Lihat Detail`** yang membuka ruang kerja terfokus (*dedicated workspace*) untuk item terpilih.
   - Di dalam workspace:
     - Dilengkapi *breadcrumbs* navigasi (`← Kembali ke Tabel Temuan`, `LHP > T-001 > ST-001`).
     - Menampilkan 4 unsur pokok temuan (`Kondisi`, `Kriteria`, `Sebab`, `Akibat`) dalam grid Apple minimalis.
     - Kotak Rekomendasi & *Financial Strip* target/realisasi/sisa kas negara.
     - Formulir *inline* Rencana Aksi dan Target Jadwal Pelaksanaan.
     - Komponen Bukti Tindak Lanjut (*upload* dokumen, NTPN 16 karakter, nominal setoran, dan verifikasi auditor).
3. **Modal Form Temuan & Sub Temuan yang Adaptif**:
   - Dilengkapi *banner* info temuan induk saat menambah Sub Temuan (`m-parent-banner`).
   - Bidang input kode temuan/sub temuan dilengkapi tombol `Auto` (`autoGenerateKodeInput()`) yang dapat menghasilkan kode otomatis namun tetap dapat disunting manual oleh auditor.
   - Bidang PIC dan Nilai Finansial dapat diatur secara mandiri untuk tiap sub temuan.
4. **Perbaikan Layout Tabel: Mencegah Teks LHA & Angka Progres Bertabrakan** ([public/js/core.js](public/js/core.js), [public/js/ruang-isian.js](public/js/ruang-isian.js), [public/js/dashboard.js](public/js/dashboard.js)):
   - **Badge LHA Compact & Tata Letak Dokumen Dashboard**: Mengubah `dokumenBadge()` agar hanya menampilkan badge compact `LHA` (sama seperti badge `LHP`). Pada tabel prioritas dashboard, menghapus `whitespace-nowrap` dan menempatkan nomor resmi `LHA-INS-001` di baris tersendiri di bawah badge dokumen dengan class `truncate`, terpisah dari sumber dan jenis audit (`Inspektorat · Audit Kinerja`). Ini mencegah teks melebar secara horizontal dan menabrak kolom `Temuan Utama`.
   - **Pencegahan Tumbukan Angka Progres**:
     - Memperlebar porsi kolom Progres dari `8%` menjadi `15%` pada tabel Daftar Temuan (dan `6%` menjadi `13%` pada dashboard).
     - Menetapkan `w-24 shrink-0 min-w-[96px]` (dan `w-20 shrink-0 min-w-[80px]` di dashboard) serta menambahkan `shrink-0` dan `gap-2` pada kontainer teks pecahan (`agg.selesai/agg.total`) dan persentase (`agg.pct%`), sehingga angka `0/1` dan `0%` duduk rapi di kedua sisi ujung bar tanpa saling menimpa (*no overlap*).




