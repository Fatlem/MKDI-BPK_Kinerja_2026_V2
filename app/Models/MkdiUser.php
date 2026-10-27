<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MkdiUser extends Model
{
    protected $table = 'mkdi_users';

    protected $fillable = ['username', 'nama', 'password', 'role'];

    protected $hidden = ['password'];
}
