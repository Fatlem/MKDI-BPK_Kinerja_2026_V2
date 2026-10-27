<?php

namespace Database\Seeders;

use App\Models\Batl;
use App\Models\BuktiTindakLanjut as Bukti;
use App\Models\Temuan;
use Illuminate\Database\Seeder;

/**
 * Data ASLI temuan BPK (dari Excel "BPK_Kinerja", disimpan di database/seeders/data/bpk_kinerja.json).
 *
 *   php artisan db:seed --class=BpkTemuanSeeder
 *
 * - Kode LHP persis seperti di Excel (LHP-BPK-001 dst), sumber = BPK RI.
 * - Tidak ada bukti / BATL: semua baris mulai dari "Belum Ada Bukti"; alur berjalan dari aplikasi.
 * - Aman dijalankan berulang: temuan yang kodenya sudah ada dilewati (tidak digandakan).
 * - Pemilik data = auditor di AUDITOR_PEMILIK (hanya akun itu dan admin yang bisa melihatnya).
 */
class BpkTemuanSeeder extends Seeder
{
    /** Akun auditor yang memiliki data ini. Ubah bila perlu. */
    private const AUDITOR_PEMILIK = 'Auditor 1';

    /** Nama PIC singkat di Excel -> nama resmi */
    private const PIC_ALIAS = [
        'Deputi 4' => 'Deputi Bidang Koordinasi Sumber Daya Maritim',
    ];

    public function run(): void
    {
        $file = __DIR__ . '/data/bpk_kinerja.json';
        if (! is_file($file)) {
            $this->command?->error('File data/bpk_kinerja.json tidak ditemukan.');
            return;
        }
        $data = json_decode(file_get_contents($file), true);

        $this->bersihkanSisaDummyBpk();

        $sort = (int) Temuan::max('sort_order');
        $dibuat = $dilewati = 0;

        foreach ($data['temuan'] as $g) {
            if (Temuan::where('no', $g['no'])->exists()) {
                $dilewati++;
                continue;
            }

            $parent = null;
            foreach ($g['rincian'] as $i => $r) {
                $row = Temuan::create([
                    'no'                 => $i === 0 ? $g['no'] : null,
                    'sumber'             => Temuan::SUMBER_BPK,
                    'created_by'         => self::AUDITOR_PEMILIK,
                    'temuan'             => $i === 0 ? $g['temuan'] : null,
                    'sub_temuan'         => $r['sub_temuan'],
                    'kriteria'           => $r['kriteria'],
                    'sebab'              => $r['sebab'],
                    'rekomendasi'        => $r['rekomendasi'],
                    'pic'                => $this->rapikanPic($r['pic']),
                    'rencana_aksi'       => $r['rencana_aksi'],
                    'jadwal_pelaksanaan' => $r['jadwal_pelaksanaan'],
                    'output'             => $r['output'],
                    'parent_id'          => $parent?->id,
                    'sort_order'         => ++$sort,
                ]);
                $parent ??= $row;
            }
            $dibuat++;
        }

        $this->command?->info("Data BPK: {$dibuat} temuan dibuat, {$dilewati} dilewati (kode sudah ada). Pemilik: " . self::AUDITOR_PEMILIK . '.');
    }

    private function rapikanPic(?string $pic): ?string
    {
        if (! $pic) {
            return null;
        }
        $list = array_map(fn ($p) => self::PIC_ALIAS[trim($p)] ?? trim($p), explode(',', $pic));
        return implode(', ', array_unique(array_filter($list)));
    }

    /**
     * Jika sebelumnya data Excel ini sempat masuk sebagai dummy (judul berawalan "[DUMMY]", sumber BPK),
     * hapus dulu supaya tidak dobel. Data Inspektorat dummy tidak disentuh.
     */
    private function bersihkanSisaDummyBpk(): void
    {
        $ids = Temuan::where('sumber', Temuan::SUMBER_BPK)->where('temuan', 'like', '[DUMMY] %')->pluck('id');
        if ($ids->isEmpty()) {
            return;
        }
        $ids = $ids->merge(Temuan::whereIn('parent_id', $ids)->pluck('id'))->unique();

        Batl::whereIn('temuan_id', $ids)->delete();
        Bukti::whereIn('temuan_id', $ids)->delete();
        Temuan::whereIn('parent_id', $ids)->delete();
        Temuan::whereIn('id', $ids)->delete();
    }
}
