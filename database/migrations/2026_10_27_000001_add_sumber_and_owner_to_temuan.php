<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * - sumber     : asal audit ('bpk' | 'inspektorat'). Menentukan awalan kode LHP.
 * - created_by : username auditor pemilik temuan. Auditor hanya melihat temuan miliknya.
 *                (baris lama = NULL -> hanya terlihat oleh akun admin)
 *
 * Data lama (semua berasal dari BPK) diberi sumber 'bpk' dan nomor numeriknya
 * diubah ke format kode, misal 1 -> LHP-BPK-001. Nomor yang sudah berformat kode dibiarkan.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('temuan', function (Blueprint $table) {
            $table->string('sumber', 20)->default('bpk')->after('no');
            $table->string('created_by', 100)->nullable()->after('sort_order');
            $table->index('created_by');
        });

        DB::table('temuan')->whereNotNull('no')->orderBy('id')->get(['id', 'no'])->each(function ($r) {
            $no = trim((string) $r->no);
            if ($no !== '' && ctype_digit($no)) {
                DB::table('temuan')->where('id', $r->id)->update([
                    'no' => 'LHP-BPK-' . str_pad($no, 3, '0', STR_PAD_LEFT),
                ]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('temuan', function (Blueprint $table) {
            $table->dropIndex(['created_by']);
            $table->dropColumn(['sumber', 'created_by']);
        });
    }
};
