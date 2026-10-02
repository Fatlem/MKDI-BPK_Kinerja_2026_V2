<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TemuanController;
use App\Http\Controllers\PicController;
use App\Http\Controllers\UserController;

Route::view('/',             'app');
Route::view('/dashboard',    'app');
Route::view('/ruang-isian',  'app');
Route::view('/rekap-laporan','app');

Route::prefix('api')->group(function () {

    Route::post('/auth/login',  [AuthController::class, 'login']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::middleware('auth.kmdi')->group(function () {
        Route::get('/users/list',       [UserController::class,  'listForLogin']);
        Route::get('/pic',              [PicController::class,   'index']);
        Route::get('/temuan',           [TemuanController::class,'index']);
        Route::get('/temuan/next-no',   [TemuanController::class,'nextNo']);
        Route::post('/temuan',          [TemuanController::class,'store']);
        Route::put('/temuan/{id}',      [TemuanController::class,'update']);
        Route::delete('/temuan/{id}',   [TemuanController::class,'destroy']);
    });
});