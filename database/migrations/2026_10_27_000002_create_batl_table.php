<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Berita Acara Tindak Lanjut (BATL): diterbitkan auditor setelah bukti terverifikasi.
 * Satu rincian temuan hanya punya satu BATL aktif. Terbit BATL = temuan selesai.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('batl', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('temuan_id')->unique();
            $table->string('nomor', 120);
            $table->date('tanggal');
            $table->text('catatan')->nullable();

            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->string('file_mime', 120)->nullable();
            $table->unsignedBigInteger('file_size')->nullable();

            $table->string('diterbitkan_oleh', 100)->nullable();
            $table->timestamps();

            $table->foreign('temuan_id')->references('id')->on('temuan')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('batl');
    }
};
