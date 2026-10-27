<?php

namespace Database\Seeders;

use App\Models\Batl;
use App\Models\BuktiTindakLanjut as Bukti;
use App\Models\Temuan;
use Illuminate\Database\Seeder;

/**
 * Data CONTOH (dummy) sumber Inspektorat untuk mencoba kode LHP-INS dan
 * pemisahan data antar auditor. Data asli BPK ada di BpkTemuanSeeder.
 *
 *   php artisan db:seed --class=DummyDataSeeder
 *
 * - Aman dijalankan berulang: data dummy lama (judul berawalan "[DUMMY]") dihapus dulu.
 * - Butuh akun dari BpkUserSeeder (Auditor 1, Auditor 2).
 * - Berkas bukti sengaja kosong ("Tanpa berkas").
 *
 * Hapus semua dummy saja:
 *   php artisan tinker --execute="Database\Seeders\DummyDataSeeder::bersihkan();"
 */
class DummyDataSeeder extends Seeder
{
    private const TAG = '[DUMMY] ';
    private int $sort = 0;

    public static function bersihkan(): void
    {
        $ids = Temuan::where('temuan', 'like', self::TAG . '%')->pluck('id');
        // sub temuan tidak punya teks "temuan", ikut terhapus lewat parent_id
        $ids = $ids->merge(Temuan::whereIn('parent_id', $ids)->pluck('id'))->unique();

        Batl::whereIn('temuan_id', $ids)->delete();
        Bukti::whereIn('temuan_id', $ids)->delete();
        Temuan::whereIn('parent_id', $ids)->delete();
        Temuan::whereIn('id', $ids)->delete();
    }

    public function run(): void
    {
        self::bersihkan();
        $this->sort = (int) Temuan::max('sort_order');

        $mkdi = 'Biro Manajemen Kinerja Data dan Informasi';
        $keu  = 'Biro Keuangan dan BMN';
        $umum = 'Biro Umum dan Hubungan Masyarakat';

        // Auditor 1: menunggu verifikasi + belum ada bukti
        $this->temuan('Auditor 1', 'inspektorat', 'Dokumen perjalanan dinas tidak lengkap', [
            ['Bukti pertanggungjawaban SPJ kurang', $keu, 'menunggu', [
                ['menunggu', 'SPJ perjalanan dinas triwulan I dilengkapi', null],
            ]],
            ['Laporan perjalanan dinas belum dibuat', $umum, 'belum', []],
        ]);

        // Auditor 2: pending + menunggu verifikasi
        $this->temuan('Auditor 2', 'inspektorat', 'Manajemen data belum terintegrasi', [
            ['Data antar-unit belum terhubung', $mkdi, 'pending', [
                ['pending', 'Dokumen rancangan integrasi data diunggah', 'Mohon lampirkan SK tim integrasi data.'],
            ]],
            ['Kamus data belum ditetapkan', $mkdi, 'menunggu', [
                ['menunggu', 'Draft kamus data dikirim untuk diverifikasi', null],
            ]],
        ]);

        // Auditor 1: contoh alur lengkap sampai BATL, ditolak, dan terverifikasi
        $this->temuan('Auditor 1', 'inspektorat', 'Pengelolaan aset tetap belum tertib', [
            ['Pencatatan BMN belum sesuai kondisi fisik', $keu, 'batl', [
                ['menunggu→ditolak', 'Unggah daftar BMN awal', 'Daftar belum memuat nomor register.'],
                ['terverifikasi', 'Daftar BMN diperbaiki dan dilengkapi nomor register', null],
            ]],
            ['Penyusutan aset belum dihitung', $keu, 'terverifikasi', [
                ['terverifikasi', 'Perhitungan penyusutan sudah dilakukan untuk seluruh aset', 'Sesuai.'],
            ]],
            ['Aset hibah belum dicatat', $umum, 'ditolak', [
                ['ditolak', 'Berita acara hibah dilampirkan', 'Berita acara belum ditandatangani pihak pemberi.'],
            ]],
        ]);

        $this->command?->info('Data dummy Inspektorat dibuat (Auditor 1 dan Auditor 2). Password semua akun: pangan2026.');
    }

    /**
     * @param array $rincian  [[subTemuan, pic, statusAkhir, [[statusBukti, uraian, catatan], ...]], ...]
     *                        baris pertama = baris temuan utama, berikutnya = sub temuan
     */
    private function temuan(string $auditor, string $sumber, string $judul, array $rincian): void
    {
        $kode   = $this->kodeBerikut($sumber);
        $parent = null;

        foreach ($rincian as $i => [$sub, $pic, $akhir, $riwayat]) {
            $row = Temuan::create([
                'no'                 => $i === 0 ? $kode : null,
                'sumber'             => $sumber,
                'created_by'         => $auditor,
                'temuan'             => $i === 0 ? self::TAG . $judul : null,
                'sub_temuan'         => $sub,
                'kriteria'           => 'Peraturan perundang-undangan terkait pengelolaan ' . strtolower($judul) . '.',
                'sebab'              => 'Belum ada prosedur dan pengawasan yang memadai.',
                'rekomendasi'        => 'Lakukan perbaikan dan sampaikan bukti tindak lanjut.',
                'pic'                => $pic,
                'rencana_aksi'       => 'Menyusun dan melaksanakan perbaikan sesuai rekomendasi.',
                'jadwal_pelaksanaan' => 'Triwulan IV 2026',
                'output'             => null,
                'parent_id'          => $parent?->id,
                'sort_order'         => ++$this->sort,
            ]);
            $parent ??= $row;

            $this->riwayat($row, $auditor, $pic, $riwayat);

            if ($akhir === 'batl') {
                Batl::create([
                    'temuan_id'        => $row->id,
                    'nomor'            => 'BATL/' . str_pad((string) $row->id, 3, '0', STR_PAD_LEFT) . '/2026',
                    'tanggal'          => now()->subDays(2)->toDateString(),
                    'catatan'          => 'Seluruh rekomendasi telah ditindaklanjuti.',
                    'diterbitkan_oleh' => $auditor,
                ]);
            }
        }
    }

    private function riwayat(Temuan $row, string $auditor, string $pic, array $list): void
    {
        $hari = count($list) * 5;
        foreach ($list as [$status, $uraian, $catatan]) {
            // 'menunggu→ditolak' = pengiriman pertama ditolak, lalu dikirim ulang
            $final = str_contains($status, '→') ? explode('→', $status)[1] : $status;
            $hari -= 5;

            Bukti::create([
                'temuan_id'          => $row->id,
                'tanggal_mulai'      => now()->subDays($hari + 20)->toDateString(),
                'tanggal_selesai'    => now()->subDays($hari + 10)->toDateString(),
                'uraian'             => $uraian,
                'status'             => $final,
                'catatan_verifikasi' => $catatan,
                'diunggah_oleh'      => 'Dummy ' . $pic,
                'diverifikasi_oleh'  => $final === Bukti::STATUS_MENUNGGU ? null : $auditor,
                'diverifikasi_pada'  => $final === Bukti::STATUS_MENUNGGU ? null : now()->subDays($hari),
            ]);
        }
    }

    /** Kode LHP berikutnya, urutannya mengikuti data yang sudah ada. */
    private function kodeBerikut(string $sumber): string
    {
        $prefix = Temuan::KODE_PREFIX[$sumber];
        $max = 0;
        foreach (Temuan::whereNotNull('no')->where('no', 'like', $prefix . '%')->pluck('no') as $no) {
            if (preg_match('/(\d+)$/', $no, $m)) {
                $max = max($max, (int) $m[1]);
            }
        }
        return $prefix . str_pad((string) ($max + 1), 3, '0', STR_PAD_LEFT);
    }
}
