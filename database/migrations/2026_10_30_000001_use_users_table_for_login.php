<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Akun login (admin / auditor / pic) dipindah ke tabel `users`.
 *
 * - Tabel `users` bawaan Laravel (kolom name/email) tidak dipakai aplikasi ini,
 *   jadi dihapus HANYA kalau masih kosong.
 * - Tabel `mkdi_users` (kolom username/nama/password/role) di-rename menjadi `users`.
 *   Seluruh akun dan password terbawa.
 * - Aman dijalankan berulang: kalau `users` sudah berbentuk akun aplikasi, tidak ada yang dilakukan.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Sudah berbentuk akun aplikasi -> tidak ada yang perlu dikerjakan.
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'username')) {
            return;
        }

        // Tidak ada tabel sumber -> tidak ada yang bisa dipindah.
        if (! Schema::hasTable('mkdi_users')) {
            return;
        }

        // Singkirkan tabel users bawaan Laravel, tapi jangan pernah membuang data.
        if (Schema::hasTable('users')) {
            if (DB::table('users')->count() > 0) {
                throw new RuntimeException(
                    "Tabel `users` bawaan Laravel berisi data, tidak dihapus otomatis. "
                    . "Kosongkan/backup dulu, lalu jalankan migrate lagi."
                );
            }
            Schema::drop('users');
        }

        Schema::rename('mkdi_users', 'users');
    }

    public function down(): void
    {
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'username') && ! Schema::hasTable('mkdi_users')) {
            Schema::rename('users', 'mkdi_users');
        }
    }
};
