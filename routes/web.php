<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;

// ── Halaman (SPA: satu layout, router.js yang memilih tampilan) ──
foreach (['/', '/dashboard', '/temuan', '/ruang-isian', '/ruang-isian/detail', '/rekap-laporan'] as $page) {
    Route::view($page, 'layouts.app');
}

// ── PWA ──
// Di Vercel/hosting statis, file di public/ biasanya dilayani langsung. Rute ini hanya
// jadi cadangan bila permintaan sampai ke PHP, supaya sw.js tetap di scope root ("/").
Route::get('/sw.js', fn () => response()->file(public_path('sw.js'), [
    'Content-Type'           => 'application/javascript; charset=utf-8',
    'Service-Worker-Allowed' => '/',
    'Cache-Control'          => 'no-cache',
]));
Route::get('/manifest.webmanifest', fn () => response()->file(public_path('manifest.webmanifest'), [
    'Content-Type'  => 'application/manifest+json; charset=utf-8',
    'Cache-Control' => 'public, max-age=86400',
]));

// ── API: URL resmi /api/... (lihat routes/mkdi-api.php) ──
Route::prefix('api')
    ->withoutMiddleware([VerifyCsrfToken::class])
    ->group(base_path('routes/mkdi-api.php'));
