<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TemuanController;
use App\Http\Controllers\PicController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\BuktiController;
use App\Http\Controllers\BatlController;

Route::view('/',              'app');
Route::view('/dashboard',     'app');
Route::view('/ruang-isian',   'app');
Route::view('/ruang-isian/detail', 'app');
Route::view('/rekap-laporan', 'app');

$apiRoutes = function () {
    Route::post('/auth/login',  [AuthController::class, 'login']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    Route::middleware('auth.kmdi')->group(function () {
        Route::get('/users/list',     [UserController::class,  'listForLogin']);
        Route::get('/pic',            [PicController::class,   'index']);
        Route::post('/pic',           [PicController::class,   'store']);   // BARU: tambah PIC ke tabel pic
        Route::get('/temuan',         [TemuanController::class, 'index']);
        Route::get('/temuan/next-no', [TemuanController::class, 'nextNo']);
        Route::post('/temuan',        [TemuanController::class, 'store']);
        Route::put('/temuan/{id}',    [TemuanController::class, 'update']);
        Route::delete('/temuan/{id}', [TemuanController::class, 'destroy']);

        // Bukti tindak lanjut (eviden)
        Route::get('/bukti',                 [BuktiController::class, 'index']);
        Route::post('/bukti',                [BuktiController::class, 'store']);
        Route::get('/bukti/{id}/file',       [BuktiController::class, 'file']);
        Route::put('/bukti/{id}/verifikasi', [BuktiController::class, 'verifikasi']);
        Route::delete('/bukti/{id}',         [BuktiController::class, 'destroy']);

        // Berita Acara Tindak Lanjut (BATL) - diterbitkan auditor
        Route::post('/batl',                 [BatlController::class,  'store']);
        Route::get('/batl/{id}/file',        [BatlController::class,  'file']);
        Route::delete('/batl/{id}',          [BatlController::class,  'destroy']);
    });
};

// URL resmi: /api/...
Route::prefix('api')
    ->withoutMiddleware([VerifyCsrfToken::class])
    ->group($apiRoutes);

// Fallback tanpa prefix (kalau frontend manggil /auth/login)
Route::withoutMiddleware([VerifyCsrfToken::class])
    ->name('noprefix.')
    ->group($apiRoutes);