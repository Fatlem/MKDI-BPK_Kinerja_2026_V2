<?php

return [
    // BATL hanya boleh terbit bila SEMUA rekomendasi pada temuan induk yang sama sudah
    // terverifikasi (WORKFLOW.md: "100% Seluruh Rekomendasi Tuntas").
    // Set ETLHP_BATL_SEMUA_REKOMENDASI=false di .env untuk kembali ke perilaku lama (per baris).
    'batl_semua_rekomendasi' => filter_var(env('ETLHP_BATL_SEMUA_REKOMENDASI', true), FILTER_VALIDATE_BOOLEAN),

    // Berkas eviden / berkas BATL wajib pada pengiriman BARU. Data lama tidak terpengaruh.
    // Set ETLHP_BERKAS_WAJIB=false di .env untuk kembali ke perilaku lama (opsional).
    'berkas_wajib' => filter_var(env('ETLHP_BERKAS_WAJIB', true), FILTER_VALIDATE_BOOLEAN),
];
