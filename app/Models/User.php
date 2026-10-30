<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;

/**
 * Akun login aplikasi (admin / auditor / pic).
 * Memakai tabel `users` (kolom: username, nama, password, role).
 */
class User extends Authenticatable
{
    protected $table = 'users';

    protected $fillable = ['username', 'nama', 'password', 'role'];

    protected $hidden = ['password'];
}
