<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Siklus penutupan LHP (Temuan Sementara) -> LHA Resmi melalui
 * tanda tangan kesepakatan antara Auditor dan Auditee (Satker PIC).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('temuan', function (Blueprint $table) {
            if (! Schema::hasColumn('temuan', 'status_dokumen')) {
                $table->string('status_dokumen', 32)->default('lhp_sementara')->after('created_by');
            }
            if (! Schema::hasColumn('temuan', 'no_lha')) {
                $table->string('no_lha', 80)->nullable()->after('status_dokumen');
            }
        });

        Schema::table('batl', function (Blueprint $table) {
            if (! Schema::hasColumn('batl', 'ttd_auditor_oleh')) {
                $table->string('ttd_auditor_oleh', 120)->nullable()->after('diterbitkan_oleh');
            }
            if (! Schema::hasColumn('batl', 'ttd_auditor_pada')) {
                $table->timestamp('ttd_auditor_pada')->nullable()->after('ttd_auditor_oleh');
            }
            if (! Schema::hasColumn('batl', 'ttd_auditee_oleh')) {
                $table->string('ttd_auditee_oleh', 120)->nullable()->after('ttd_auditor_pada');
            }
            if (! Schema::hasColumn('batl', 'ttd_auditee_pada')) {
                $table->timestamp('ttd_auditee_pada')->nullable()->after('ttd_auditee_oleh');
            }
        });
    }

    public function down(): void
    {
        Schema::table('batl', function (Blueprint $table) {
            foreach (['ttd_auditor_oleh', 'ttd_auditor_pada', 'ttd_auditee_oleh', 'ttd_auditee_pada'] as $c) {
                if (Schema::hasColumn('batl', $c)) {
                    $table->dropColumn($c);
                }
            }
        });

        Schema::table('temuan', function (Blueprint $table) {
            foreach (['status_dokumen', 'no_lha'] as $c) {
                if (Schema::hasColumn('temuan', $c)) {
                    $table->dropColumn($c);
                }
            }
        });
    }
};

