<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bukti tindak lanjut (eviden) per baris temuan.
 * Satu baris temuan boleh punya banyak pengiriman; tiap pengiriman maksimal 1 berkas.
 * status: menunggu (menunggu verifikasi Itjen) | terverifikasi | ditolak
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bukti_tindak_lanjut', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('temuan_id');
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai');
            $table->text('uraian');

            $table->string('file_path')->nullable();      // path di disk "local" (private)
            $table->string('file_name')->nullable();      // nama asli berkas
            $table->string('file_mime', 120)->nullable();
            $table->unsignedBigInteger('file_size')->nullable();

            $table->string('status', 20)->default('menunggu');
            $table->text('catatan_verifikasi')->nullable();
            $table->string('diunggah_oleh', 100)->nullable();
            $table->string('diverifikasi_oleh', 100)->nullable();
            $table->timestamp('diverifikasi_pada')->nullable();
            $table->timestamps();

            $table->foreign('temuan_id')->references('id')->on('temuan')->onDelete('cascade');
            $table->index(['temuan_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bukti_tindak_lanjut');
    }
};
