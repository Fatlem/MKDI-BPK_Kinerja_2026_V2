@php
    // Urutan penting: router.js membungkus navigate()/doLogout(), jadi harus dimuat paling akhir.
    $kmdiScripts = [
        'core',
        'auth',
        'dashboard',
        'ruang-isian',
        'bukti',        // formulir unggah bukti tindak lanjut (butuh fungsi dari ruang-isian.js)
        'rekap',
        'router',
    ];
@endphp
@foreach ($kmdiScripts as $kmdiFile)
    <script src="{{ asset('js/kmdi/' . $kmdiFile . '.js') }}?v={{ @filemtime(public_path('js/kmdi/' . $kmdiFile . '.js')) }}"></script>
@endforeach
