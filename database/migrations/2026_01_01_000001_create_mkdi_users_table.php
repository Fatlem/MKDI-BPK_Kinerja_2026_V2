<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Server yang sebelumnya memakai nama lama (kmdi_users): ganti nama tabel,
        // seluruh akun dan password tetap terbawa.
        if (Schema::hasTable('kmdi_users') && ! Schema::hasTable('mkdi_users')) {
            Schema::rename('kmdi_users', 'mkdi_users');
            return;
        }
        if (Schema::hasTable('mkdi_users')) {
            return;
        }

        Schema::create('mkdi_users', function (Blueprint $table) {
            $table->id();
            $table->string('username', 100)->unique();
            $table->string('nama');
            $table->string('password');
            $table->string('role', 50)->default('pic'); // 'admin' | 'auditor' | 'pic'
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mkdi_users');
    }
};
