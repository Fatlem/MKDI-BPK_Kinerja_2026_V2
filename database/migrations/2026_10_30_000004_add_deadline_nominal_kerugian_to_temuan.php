<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Deadline tindak lanjut (kolom "Deadline" di Dashboard) dan nominal kerugian
 * (khusus jenis audit Keuangan). Nullable: data lama tidak berubah.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('temuan', function (Blueprint $table) {
            if (! Schema::hasColumn('temuan', 'deadline')) {
                $table->date('deadline')->nullable();
            }
            if (! Schema::hasColumn('temuan', 'nominal_kerugian')) {
                $table->decimal('nominal_kerugian', 18, 2)->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('temuan', function (Blueprint $table) {
            foreach (['deadline', 'nominal_kerugian'] as $c) {
                if (Schema::hasColumn('temuan', $c)) {
                    $table->dropColumn($c);
                }
            }
        });
    }
};
