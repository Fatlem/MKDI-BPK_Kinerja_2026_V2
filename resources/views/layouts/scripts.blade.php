@php
    // Urutan penting: router.js membungkus navigate()/doLogout(), jadi harus dimuat paling akhir.
    $mkdiScripts = [
        'core',
        'auth',
        'dashboard',
        'ruang-isian',
        'bukti',        // formulir unggah bukti tindak lanjut (butuh fungsi dari ruang-isian.js)
        'rekap',
        'router',
        'sidebar',      // mode ciut sidebar; harus setelah router.js
    ];
@endphp
@foreach ($mkdiScripts as $mkdiFile)
    <script src="{{ asset('js/mkdi/' . $mkdiFile . '.js') }}?v={{ @filemtime(public_path('js/mkdi/' . $mkdiFile . '.js')) }}"></script>
@endforeach
