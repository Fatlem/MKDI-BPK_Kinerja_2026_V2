@php
    $kmdiScripts = [
        'core',         
        'auth',         
        'dashboard',   
        'ruang-isian',  
        'rekap',        
    ];
@endphp
@foreach ($kmdiScripts as $kmdiFile)
    <script src="{{ asset('js/kmdi/' . $kmdiFile . '.js') }}?v={{ @filemtime(public_path('js/kmdi/' . $kmdiFile . '.js')) }}"></script>
@endforeach
