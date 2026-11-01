<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('temuan', function (Blueprint $table) {
            $table->string('kode_temuan', 50)->nullable()->after('no');
            $table->string('kode_sub_temuan', 50)->nullable()->after('sub_temuan');
        });

        // Backfill data yang sudah ada dengan format T-001 / ST-001
        $parents = DB::table('temuan')->whereNull('parent_id')->orderBy('id')->get();
        $docCounters = [];

        foreach ($parents as $p) {
            $docNo = $p->no ?: 'LHP-001';
            if (!isset($docCounters[$docNo])) {
                $docCounters[$docNo] = 1;
            }
            $tCode = 'T-' . str_pad($docCounters[$docNo]++, 3, '0', STR_PAD_LEFT);
            DB::table('temuan')->where('id', $p->id)->update(['kode_temuan' => $tCode]);

            // Anak-anak sub temuan
            $children = DB::table('temuan')->where('parent_id', $p->id)->orderBy('sort_order')->orderBy('id')->get();
            $subIdx = 1;
            foreach ($children as $c) {
                $stCode = 'ST-' . str_pad($subIdx++, 3, '0', STR_PAD_LEFT);
                DB::table('temuan')->where('id', $c->id)->update([
                    'no'              => $docNo,
                    'kode_sub_temuan' => $stCode,
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('temuan', function (Blueprint $table) {
            $table->dropColumn(['kode_temuan', 'kode_sub_temuan']);
        });
    }
};

