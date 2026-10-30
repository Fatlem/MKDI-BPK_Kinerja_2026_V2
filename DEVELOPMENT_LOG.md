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

