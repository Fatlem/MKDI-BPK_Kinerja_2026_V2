# Refactor UI/UX, PWA & Deadline Countdown

## Fitur baru
- **7 kategori berwarna** (Kondisi, Kriteria, Sebab, Akibat, Rekomendasi, Rencana Aksi, Output): `public/js/categories.js` + token `--cat-*` di `public/css/app-ui.css`. Dipakai di daftar rincian/rekap, workspace item, halaman Detail, dan label modal form. Kartu **Output** kini juga tampil di workspace item.
- **Real-time deadline countdown**: `public/js/deadline.js` (di atas `getDeadlineInfo()` — logika lama tidak diubah). Pill ringkas di tabel/modal, panel besar di header LHP & workspace item, baris "Terdekat" di kartu SLA dashboard. Batas = 23:59:59 WIB; status normal / ≤14 hari / ≤3 hari / lewat / tuntas.
- **PWA**: `manifest.webmanifest`, `sw.js`, `offline.html`, `js/pwa.js`, ikon di `public/icons/`. Tombol "Pasang Aplikasi" (sidebar), indikator offline (header), notifikasi versi baru. `/api/*` tidak pernah di-cache.
- **Responsif**: header mobile diperbaiki (badge tanggal menimpa judul), tabel Daftar Temuan & Dashboard menjadi kartu ≤640px, filter 2 kolom, input 16px, safe-area untuk mode standalone, login sempit.
- **Ikon**: Lucide di-pin 0.468.0 & di-host sendiri; ikon pada label kategori, KPI dashboard, tombol instal, status offline.

## Refactor / pembersihan
- Tailwind Play CDN → `public/css/tailwind.css` (hasil build, konfigurasi identik). Lihat `tools/tailwind/README.md`.
- ExcelJS dimuat lazy saat ekspor; Chart.js & Lucide di-pin dan lokal.
- Gambar dikompres 6,5 MB → 0,57 MB (nama file sama).
- `meta viewport` tidak lagi memblokir zoom (`user-scalable=no` dihapus).
- Dihapus: `welcome.blade.php`, `public/hot`, `public/css/sidebar.css` (tidak dimuat), `ChecksKmdiAccess.php` (tidak dipakai), `Middleware/README_register.php`, kode mati `RI_CARDS`/`riCard`/`riJadwalCard`/`deadlineBadgeHtml`, 34 aturan CSS `.ri-*` mati.
- Pill status duplikat → `statusPillHtml()` di `core.js`.
- Rute: API dipindah ke `routes/mkdi-api.php` (tetap grup `web`, karena login berbasis session); grup duplikat tanpa prefix dihapus (tidak ada pemanggilan frontend di luar `/api/`).

## Perlu Anda cek sebelum deploy
1. Jalankan aplikasi Laravel penuh (di sandbox hanya `php -l` + harness Blade tiruan).
2. `public/build/` tidak dipakai layout mana pun; dibiarkan. Pertimbangkan menghapusnya dan menambahkan `public/hot` ke `.gitignore`.
3. Tambahkan rute/rewrites Vercel agar `/sw.js` & `/manifest.webmanifest` dilayani dari root (contoh: `docs/vercel.json.example`).
4. Setiap mengubah class Tailwind, build ulang `tailwind.css`.
5. Hasil countdown memakai akhir hari tenggat WIB; badge lama "Sisa N hari" (UTC tengah malam) bisa selisih ±1 hari dengan tampilan baru.

## Rekomendasi (belum diterapkan)
- CSRF saat ini dimatikan untuk `/api` padahal auth memakai cookie session; frontend sudah mengirim `X-CSRF-TOKEN`, jadi kemungkinan bisa diaktifkan lagi (uji dulu).
- Vercel: filesystem sementara → `database.sqlite`, upload bukti, dan session file tidak persisten. Gunakan DB eksternal, object storage, dan `SESSION_DRIVER=cookie|database`.

## Perbaikan lanjutan
- `.catch()` pemuatan data kini mencatat error asli ke console (`[e-TLHP] gagal memuat/merender data`), tidak lagi hanya menampilkan toast generik. Tabel kosong + toast "Gagal memuat data dari server" biasanya berarti ada exception saat merender (mis. skrip `deadline.js`/`categories.js` tidak termuat) — lihat Console.

## Catatan hosting (Hostinger / Apache / LiteSpeed)
- Pustaka JS (Lucide, Chart.js, ExcelJS) ada di `public/libs/` — SENGAJA bukan `public/vendor/`, karena folder bernama `vendor` sering diblokir server atau ikut diabaikan (`.gitignore`/unggahan). Jika ikon tidak muncul: buka F12 → Network, cari `libs/lucide-0.468.0.min.js` (harus 200) atau Console `lucide is not defined`.
- Pastikan SELURUH isi `public/` ikut terunggah (terutama `libs/`, `icons/`, `css/tailwind.css`, `sw.js`, `manifest.webmanifest`).
- Hosting Linux membedakan huruf besar/kecil: nama file harus persis sama.
- Setelah deploy: `php artisan view:clear`, lalu Ctrl+Shift+R (dan Unregister service worker lama bila ada).
- Atur `APP_URL` ke `https://domain-anda` agar `asset()` tidak menghasilkan `http://` (diblokir sebagai mixed content).

## Mobile (ronde lanjutan)
- Bilah navigasi bawah (Dashboard · Temuan · Rekap) menggantikan hamburger/drawer; akun, Pasang Aplikasi, dan Keluar ada di menu avatar header.
- Dashboard ringkas: filter dilipat (tombol "Filter" + lencana jumlah filter aktif; status buka/tutup diingat), kartu KPI 2×2 tanpa baris keterangan sekunder (countdown "Terdekat" tetap tampil).
- Tabel hirarki & sub temuan → kartu di ≤640px; kolom Aksi menempel di kanan pada tabel lebar; tombol Edit/Hapus/Tambah Sub berupa ikon.
