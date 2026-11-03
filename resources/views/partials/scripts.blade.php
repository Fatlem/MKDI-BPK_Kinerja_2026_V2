@php
    // Urutan penting: router.js membungkus navigate()/doLogout(), jadi dimuat paling akhir;
    // Skrip sidebar ada di partials/sidebar.blade.php dan jalan setelah file-file ini.
    // detail.js & bukti.js memakai fungsi dari ruang-isian.js.
    // categories.js & deadline.js hanya mendefinisikan fungsi (dipakai saat render), jadi aman dimuat awal.
    // Semua file ada di public/js/.
    $mkdiScripts = [
        'core',           // state, apiFetch, helper PIC & status
        'categories',     // 7 kategori uraian temuan (warna, ikon, kartu)
        'deadline',       // countdown batas waktu real-time (WIB)
        'auth',           // login, logout, navigate()
        'dashboard',      // halaman Dashboard (+ filter)
        'ruang-isian',    // Ruang Isian > Temuan (lihat, tambah/ubah, hapus)
        'detail',         // Ruang Isian > Detail (lihat, tambah/ubah)
        'bukti',          // unggah bukti tindak lanjut
        'rekap',          // Rekap & Laporan
        'export-excel',   // ekspor Excel (per tahun)
        'router',
        'pwa',            // service worker, instal, status offline
    ];
@endphp
@foreach ($mkdiScripts as $mkdiFile)
    <script src="{{ asset('js/' . $mkdiFile . '.js') }}?v={{ @filemtime(public_path('js/' . $mkdiFile . '.js')) }}"></script>
@endforeach
