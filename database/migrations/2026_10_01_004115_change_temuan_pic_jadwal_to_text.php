<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Kolom `pic` dan `jadwal_pelaksanaan` di tabel `temuan` dibuat sebagai string (VARCHAR 255),
 * sehingga error "Data too long for column 'pic'" muncul saat PIC banyak / jadwal panjang.
 * Diubah menjadi TEXT. Data yang sudah ada tidak berubah.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('temuan', function (Blueprint $table) {
            $table->text('pic')->nullable()->change();
            $table->text('jadwal_pelaksanaan')->nullable()->change();
        });
    }

    public function down(): void
    {
        // sengaja kosong: mengecilkan kolom bisa memotong data
    }
};