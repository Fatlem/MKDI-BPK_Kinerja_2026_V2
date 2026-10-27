<?php
/**
 * Daftarkan middleware CheckAuth di bootstrap/app.php (Laravel 11+):
 *
 *   ->withMiddleware(function (Middleware $middleware) {
 *       $middleware->alias([
 *           'auth.mkdi' => \App\Http\Middleware\CheckAuth::class,
 *       ]);
 *   })
 *
 * Atau untuk Laravel 10 (app/Http/Kernel.php), tambahkan ke $routeMiddleware:
 *
 *   'auth.mkdi' => \App\Http\Middleware\CheckAuth::class,
 */
