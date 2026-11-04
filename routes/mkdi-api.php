<?php

/*
|--------------------------------------------------------------------------
| API e-TLHP  (dimuat dari routes/web.php dengan prefix `api`)
|--------------------------------------------------------------------------
| Sengaja TIDAK dipindah ke routes/api.php: grup `api` bawaan Laravel tidak
| memakai session, sedangkan login aplikasi ini berbasis session
| (`session('mkdi_user')`). File ini tetap berjalan di grup middleware `web`.
*/

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TemuanController;
use App\Http\Controllers\PicController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\BuktiController;
use App\Http\Controllers\BatlController;

Route::post('/auth/login',  [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout']);
Route::get('/auth/me',      [AuthController::class, 'me']);

Route::middleware('auth.mkdi')->group(function () {
    Route::get('/users/list',     [UserController::class,  'listForLogin']);
    Route::get('/pic',            [PicController::class,   'index']);
    Route::post('/pic',           [PicController::class,   'store']);   // BARU: tambah PIC ke tabel pic
    Route::get('/temuan',                  [TemuanController::class, 'index']);
    Route::get('/temuan/next-no',          [TemuanController::class, 'nextNo']);
    Route::get('/temuan/next-kode-temuan', [TemuanController::class, 'nextKodeTemuan']);
    Route::get('/temuan/next-kode-sub',    [TemuanController::class, 'nextKodeSub']);
    Route::post('/temuan',                 [TemuanController::class, 'store']);
    Route::put('/temuan/{id}',    [TemuanController::class, 'update']);
    Route::delete('/temuan/{id}', [TemuanController::class, 'destroy']);

    // Bukti tindak lanjut (eviden)
    Route::get('/bukti',                 [BuktiController::class, 'index']);
    Route::post('/bukti',                [BuktiController::class, 'store']);
    Route::get('/bukti/{id}/file',       [BuktiController::class, 'file']);
    Route::put('/bukti/{id}/verifikasi', [BuktiController::class, 'verifikasi']);
    Route::delete('/bukti/{id}',         [BuktiController::class, 'destroy']);

    // Berita Acara Tindak Lanjut (BATL) - diterbitkan auditor & disepakati menjadi LHA
    Route::post('/batl',                 [BatlController::class,  'store']);
    Route::post('/batl/{id}/sign',       [BatlController::class,  'sign']);
    Route::get('/batl/{id}/file',        [BatlController::class,  'file']);
    Route::delete('/batl/{id}',          [BatlController::class,  'destroy']);
});
