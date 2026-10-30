# Catatan Pengembangan: Penyesuaian Sistem terhadap Workflow Audit (e-TLHP)

Dokumen ini berisi daftar pekerjaan teknis (*to-do list*) untuk menyelaraskan aplikasi **Portal e-TLHP** dengan diagram alur (*flowchart*) pada [WORKFLOW.md](WORKFLOW.md). Rincian perubahan kode tercatat di [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md).

---

## Ringkasan Status Saat Ini (100% Selesai Diimplementasikan)

- [x] **Fase 1 (Pra-Pelaksanaan — 4 Jenis Audit)**: Pilihan `Audit Kinerja`, `Audit Keuangan`, `Audit Kepatuhan`, dan `Audit Khusus / Investigatif` telah tersedia saat membuat/mengubah temuan dan ditampilkan pada daftar temuan & rekap.
- [x] **Fase 2 (4 Unsur Temuan — Kondisi, Kriteria, Sebab, Akibat & Rekomendasi)**: Kolom `Akibat` telah ditambahkan ke database, API, halaman Ruang Isian, dan halaman Detail.
- [x] **Fase 4 - Langkah D3 (Unggah Eviden + Validasi NTPN & Nominal Setoran Kas Negara)**: Form unggah bukti kini mendukung input `NTPN` dan `Nominal Setoran (Rp)` beserta validasi dan tampilannya di riwayat eviden.
- [x] **Fase 4 - Langkah D7 (Validasi Kolektif 100% Rekomendasi Tuntas Sebelum BATL)**: Sistem memvalidasi bahwa seluruh sub-temuan/rekomendasi di bawah satu Temuan Induk telah berstatus `terverifikasi` sebelum BATL dapat diterbitkan.
- [x] **Fase 3 & 4 (Transisi `LHP / Temuan Sementara` &rarr; `LHA Resmi` saat Ditutup & Disepakati Auditor + Auditee)**:
  - Selama proses tindak lanjut masih berjalan, temuan tercatat sebagai **`LHP (Temuan Sementara)`**.
  - Saat seluruh rekomendasi tuntas dan kedua pihak (**Auditor** & **Auditee/Satker**) menandatangani kesepakatan penutupan LHP (BATL), status otomatis berubah menjadi **`LHA Resmi`** dengan kode **`LHA-BPK-xxx` / `LHA-INS-xxx`**.
