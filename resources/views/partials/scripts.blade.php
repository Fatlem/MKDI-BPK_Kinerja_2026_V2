@php
    // Urutan penting: router.js membungkus navigate()/doLogout(), jadi dimuat paling akhir;
    // Skrip sidebar ada di partials/sidebar.blade.php dan jalan setelah file-file ini.
    // detail.js & bukti.js memakai fungsi dari ruang-isian.js.
    // Semua file ada di public/js/ (lihat STRUKTUR.md).
    $mkdiScripts = [
        'core',           // state, apiFetch, helper PIC & status
        'auth',           // login, logout, navigate()
        'dashboard',      // halaman Dashboard (+ filter)
        'ruang-isian',    // pustaka bersama: kartu rincian, modal tambah/ubah temuan, hapus (dipakai Dashboard)
        'detail',         // pustaka bersama: modal tambah/ubah isian rincian (halaman Detail sudah digabung ke Dashboard)
        'bukti',          // unggah bukti tindak lanjut
        'notifikasi',     // lonceng notifikasi header (Satker: temuan baru & hasil verifikasi; auditor: bukti baru)
        'rekap',          // Rekap & Laporan
        'export-excel',   // ekspor Excel (per tahun)
        'router',
    ];
@endphp
@foreach ($mkdiScripts as $mkdiFile)
    <script src="{{ asset('js/' . $mkdiFile . '.js') }}?v={{ @filemtime(public_path('js/' . $mkdiFile . '.js')) }}"></script>
@endforeach
