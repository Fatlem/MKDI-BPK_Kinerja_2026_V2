<?php

namespace App\Http\Controllers;

use App\Models\MkdiUser;

class UserController extends Controller
{
    /** Daftar user untuk autocomplete di halaman login */
    public function listForLogin()
    {
        $users = MkdiUser::select('username', 'nama', 'role')
            ->where('role', '!=', 'admin')   // sembunyikan admin dari datalist
            ->get()
            ->map(fn($u) => [
                'username' => $u->username,
                'nama'     => $u->nama,
                'role'     => $u->role,
            ]);

        return response()->json($users);
    }
}
