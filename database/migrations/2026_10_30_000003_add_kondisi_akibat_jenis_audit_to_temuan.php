<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Melengkapi 4 unsur temuan (Kondisi & Akibat) dan jenis audit (WORKFLOW.md, Fase 1-2).
 * Semua kolom nullable: baris temuan lama tetap valid.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('temuan', function (Blueprint $table) {
            if (! Schema::hasColumn('temuan', 'jenis_audit')) {
                $table->string('jenis_audit', 20)->nullable()->after('sumber');
            }
            if (! Schema::hasColumn('temuan', 'kondisi')) {
                $table->text('kondisi')->nullable()->after('sub_temuan');
            }
            if (! Schema::hasColumn('temuan', 'akibat')) {
                $table->text('akibat')->nullable()->after('sebab');
            }
        });
    }

    public function down(): void
    {
        Schema::table('temuan', function (Blueprint $table) {
            foreach (['jenis_audit', 'kondisi', 'akibat'] as $c) {
                if (Schema::hasColumn('temuan', $c)) {
                    $table->dropColumn($c);
                }
            }
        });
    }
};
