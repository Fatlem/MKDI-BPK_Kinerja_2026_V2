<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Menambahkan kolom target kewajiban finansial (nilai_temuan), akumulasi realisasi setoran
 * kas negara (nilai_realisasi), dan sisa kewajiban (selisih) pada tabel temuan
 * sesuai proses bisnis e-TLHP (Archive.zip).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('temuan', function (Blueprint $table) {
            if (! Schema::hasColumn('temuan', 'nilai_temuan')) {
                $table->decimal('nilai_temuan', 18, 2)->default(0)->after('rekomendasi');
            }
            if (! Schema::hasColumn('temuan', 'nilai_realisasi')) {
                $table->decimal('nilai_realisasi', 18, 2)->default(0)->after('nilai_temuan');
            }
            if (! Schema::hasColumn('temuan', 'selisih')) {
                $table->decimal('selisih', 18, 2)->default(0)->after('nilai_realisasi');
            }
        });
    }

    public function down(): void
    {
        Schema::table('temuan', function (Blueprint $table) {
            foreach (['nilai_temuan', 'nilai_realisasi', 'selisih'] as $c) {
                if (Schema::hasColumn('temuan', $c)) {
                    $table->dropColumn($c);
                }
            }
        });
    }
};

