<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Validasi setoran kas negara pada eviden tindak lanjut (WORKFLOW.md, Fase 4 butir 3).
 * Semua kolom nullable: data lama tidak berubah.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bukti_tindak_lanjut', function (Blueprint $table) {
            if (! Schema::hasColumn('bukti_tindak_lanjut', 'ntpn')) {
                $table->string('ntpn', 30)->nullable()->after('uraian');
            }
            if (! Schema::hasColumn('bukti_tindak_lanjut', 'nominal_setoran')) {
                $table->decimal('nominal_setoran', 18, 2)->nullable()->after('ntpn');
            }
        });
    }

    public function down(): void
    {
        Schema::table('bukti_tindak_lanjut', function (Blueprint $table) {
            foreach (['ntpn', 'nominal_setoran'] as $c) {
                if (Schema::hasColumn('bukti_tindak_lanjut', $c)) {
                    $table->dropColumn($c);
                }
            }
        });
    }
};
