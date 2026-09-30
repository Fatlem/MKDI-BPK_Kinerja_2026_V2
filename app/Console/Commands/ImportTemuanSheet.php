<?php

namespace App\Console\Commands;

use App\Models\Temuan;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

/**
 * Import data temuan dari Google Sheet (format "BPK Kinerja") ke database.
 *
 * Contoh:
 *   php artisan temuan:import-sheet --dry-run     (cek dulu, tidak menyimpan)
 *   php artisan temuan:import-sheet               (tambah data baru saja)
 *   php artisan temuan:import-sheet --update      (timpa juga data yang sudah ada)
 *   php artisan temuan:import-sheet --file=storage/app/bpk.csv
 */
class ImportTemuanSheet extends Command
{
    protected $signature = 'temuan:import-sheet
        {--url= : Link Google Sheet (default: GOOGLE_SHEET_URL di .env)}
        {--file= : Baca dari file CSV lokal, bukan dari Google Sheet}
        {--update : Timpa data yang sudah ada (default: hanya menambah data baru)}
        {--dry-run : Hanya tampilkan hasil, tidak menyimpan ke database}';

    protected $description = 'Import data temuan dari Google Sheet (format BPK Kinerja) ke database';

    /** Nama header di Sheet (dinormalisasi) => nama field di aplikasi */
    private const FIELDS = [
        'no'                => 'No',
        'temuan'            => 'Temuan',
        'subtemuan'         => 'SubTemuan',
        'kriteria'          => 'Kriteria',
        'sebab'             => 'Sebab',
        'rekomendasi'       => 'Rekomendasi',
        'pic'               => 'PIC',
        'rencanaaksi'       => 'RencanaAksi',
        'jadwalpelaksanaan' => 'JadwalPelaksanaan',
        'output'            => 'Output',
    ];

    /** Nama resmi PIC (sama dengan yang ada di dropdown aplikasi) */
    private const PIC_NAMES = [
        'Biro Manajemen Kinerja Data dan Informasi',
        'Biro Hukum dan Kerjasama',
        'Biro Sumber Daya Manusia dan Organisasi',
        'Biro Umum dan Hubungan Masyarakat',
        'Biro Keuangan dan BMN',
        'Deputi Bidang Koordinasi Tata Niaga dan Distribusi Pangan',
        'Deputi Bidang Koordinasi Usaha Pangan dan Pertanian',
        'Deputi Bidang Koordinasi Keterjangkauan dan Keamanan Pangan',
        'Deputi Bidang Koordinasi Sumber Daya Maritim',
        'Staf Ahli Bidang Konektivitas',
    ];

    /** Singkatan yang dipakai di Sheet => nama resmi */
    private const PIC_ALIAS = [
        'Biro MKDI'   => 'Biro Manajemen Kinerja Data dan Informasi',
        'Biro HKS'    => 'Biro Hukum dan Kerjasama',
        'Biro Hukum'  => 'Biro Hukum dan Kerjasama',
        'Biro SDMO'   => 'Biro Sumber Daya Manusia dan Organisasi',
        'Biro UHM'    => 'Biro Umum dan Hubungan Masyarakat',
        'Biro Umum'   => 'Biro Umum dan Hubungan Masyarakat',
        'Biro KBMN'   => 'Biro Keuangan dan BMN',
        'Biro Keuangan' => 'Biro Keuangan dan BMN',
        'Deputi 1'    => 'Deputi Bidang Koordinasi Tata Niaga dan Distribusi Pangan',
        'Deputi 2'    => 'Deputi Bidang Koordinasi Usaha Pangan dan Pertanian',
        'Deputi 3'    => 'Deputi Bidang Koordinasi Keterjangkauan dan Keamanan Pangan',
        'Deputi 4'    => 'Deputi Bidang Koordinasi Sumber Daya Maritim',
        'Staf Ahli Bid. Konektivitas' => 'Staf Ahli Bidang Konektivitas',
    ];

    public function handle(): int
    {
        try {
            $csv = $this->option('file') ? $this->readFile($this->option('file')) : $this->downloadSheet();
        } catch (RuntimeException $e) {
            $this->error($e->getMessage());
            return self::FAILURE;
        }

        $unknownPics = [];
        try {
            $records = self::readSheet($csv, $unknownPics);
        } catch (RuntimeException $e) {
            $this->error($e->getMessage());
            return self::FAILURE;
        }

        $this->info('Baris data terbaca dari Sheet: ' . count($records));
        if (!$records) {
            return self::SUCCESS;
        }

        // ── Cocokkan field dengan nama kolom di database (tidak peduli huruf besar/kecil atau underscore)
        $model  = new Temuan();
        $dbCols = Schema::getColumnListing($model->getTable());
        $colMap = [];
        foreach (self::FIELDS as $norm => $field) {
            foreach ($dbCols as $col) {
                if (self::norm($col) === $norm) {
                    $colMap[$field] = $col;
                    break;
                }
            }
        }
        foreach (['No', 'Temuan'] as $must) {
            if (!isset($colMap[$must])) {
                $this->error("Kolom '$must' tidak ditemukan di tabel '{$model->getTable()}'. Kolom yang ada: " . implode(', ', $dbCols));
                return self::FAILURE;
            }
        }
        $missing = array_diff(array_values(self::FIELDS), array_keys($colMap));
        if ($missing) {
            $this->warn('Kolom ini tidak ada di database dan dilewati: ' . implode(', ', $missing));
        }

        $dry    = (bool) $this->option('dry-run');
        $update = (bool) $this->option('update');
        $stat   = ['baru' => 0, 'diperbarui' => 0, 'dilewati' => 0];

        $work = function () use ($records, $model, $colMap, $update, $dry, &$stat) {
            foreach ($records as $rec) {
                $query = $model->newQuery()->where($colMap['No'], $rec['No']);
                if (isset($colMap['SubTemuan'])) {
                    $sub = $rec['SubTemuan'];
                    $query->where(function ($q) use ($colMap, $sub) {
                        $q->where($colMap['SubTemuan'], $sub);
                        if ($sub === '') {
                            $q->orWhereNull($colMap['SubTemuan']);
                        }
                    });
                }
                $existing = $query->first();

                if ($existing && !$update) {
                    $stat['dilewati']++;
                    continue;
                }

                $values = [];
                foreach ($colMap as $field => $col) {
                    $values[$col] = $rec[$field];
                }

                if ($dry) {
                    $stat[$existing ? 'diperbarui' : 'baru']++;
                    continue;
                }

                $row = $existing ?: $model->newInstance();
                $row->forceFill($values)->save();
                $stat[$existing ? 'diperbarui' : 'baru']++;
            }
        };

        $dry ? $work() : DB::transaction($work);

        $this->newLine();
        $this->table(['Hasil', 'Jumlah'], [
            ['Data baru' . ($dry ? ' (simulasi)' : ''), $stat['baru']],
            ['Diperbarui' . ($dry ? ' (simulasi)' : ''), $stat['diperbarui']],
            ['Dilewati (sudah ada, tanpa --update)', $stat['dilewati']],
        ]);

        if ($unknownPics) {
            $this->newLine();
            $this->warn('PIC berikut tidak dikenali dan disimpan apa adanya (rapikan di Sheet kalau perlu):');
            foreach (array_keys($unknownPics) as $p) {
                $this->line('  - ' . $p);
            }
        }

        $this->info($dry ? 'Selesai (dry-run, tidak ada yang disimpan).' : 'Import selesai.');
        return self::SUCCESS;
    }

    // ════════════════════════════════════════════════════════════════
    //  AMBIL DATA
    // ════════════════════════════════════════════════════════════════

    private function readFile(string $path): string
    {
        $full = file_exists($path) ? $path : base_path($path);
        if (!file_exists($full)) {
            throw new RuntimeException("File tidak ditemukan: $path");
        }
        return (string) file_get_contents($full);
    }

    private function downloadSheet(): string
    {
        $url = $this->option('url') ?: env('GOOGLE_SHEET_URL');
        if (!$url) {
            throw new RuntimeException('Link Sheet belum diisi. Isi GOOGLE_SHEET_URL di .env atau pakai --url=...');
        }

        $url = self::exportUrl($url);
        $resp = Http::timeout(30)->get($url);

        if (!$resp->successful()) {
            throw new RuntimeException('Gagal mengambil Sheet (HTTP ' . $resp->status() . '). Pastikan Sheet dibagikan sebagai "Siapa saja yang memiliki link dapat melihat".');
        }
        if (stripos((string) $resp->header('Content-Type'), 'text/html') !== false) {
            throw new RuntimeException('Google mengembalikan halaman login, bukan data. Bagikan Sheet sebagai "Siapa saja yang memiliki link dapat melihat".');
        }
        return $resp->body();
    }

    /** Ubah link Sheet biasa menjadi link export CSV (tab sesuai gid di link) */
    public static function exportUrl(string $url): string
    {
        if (stripos($url, 'format=csv') !== false || stripos($url, 'output=csv') !== false) {
            return $url;
        }
        if (!preg_match('#/spreadsheets/d/([a-zA-Z0-9_-]+)#', $url, $m)) {
            throw new RuntimeException('Link Google Sheet tidak dikenali.');
        }
        $gid = preg_match('/[?&#]gid=(\d+)/', $url, $g) ? $g[1] : '0';
        return "https://docs.google.com/spreadsheets/d/{$m[1]}/export?format=csv&gid={$gid}";
    }

    // ════════════════════════════════════════════════════════════════
    //  BACA & RAPIKAN ISI SHEET  (tidak bergantung pada Laravel, mudah dites)
    // ════════════════════════════════════════════════════════════════

    /**
     * @return array<int, array<string,string>>  baris siap simpan (field aplikasi => nilai)
     */
    public static function readSheet(string $csv, array &$unknownPics = []): array
    {
        $csv = preg_replace('/^\xEF\xBB\xBF/', '', $csv);

        $h = fopen('php://temp', 'r+');
        fwrite($h, $csv);
        rewind($h);
        $rows = [];
        while (($r = fgetcsv($h, null, ',', '"', '')) !== false) {
            $rows[] = $r;
        }
        fclose($h);

        // Cari baris header: kolom pertama "No", kedua "Temuan"
        $headerIdx = null;
        foreach ($rows as $i => $r) {
            if (self::norm($r[0] ?? '') === 'no' && self::norm($r[1] ?? '') === 'temuan') {
                $headerIdx = $i;
                break;
            }
        }
        if ($headerIdx === null) {
            throw new RuntimeException('Baris header (No | Temuan | Sub Temuan | ...) tidak ditemukan. Pastikan tab yang dibaca benar.');
        }

        $colIndex = [];   // field => index kolom
        $outputIdx = null;
        foreach ($rows[$headerIdx] as $idx => $head) {
            $n = self::norm($head);
            if (isset(self::FIELDS[$n])) {
                $colIndex[self::FIELDS[$n]] = $idx;
                if ($n === 'output') {
                    $outputIdx = $idx;
                }
            }
        }
        $statusIdx = $outputIdx !== null ? $outputIdx + 1 : null; // kolom status (K) tanpa header

        $records = [];
        $lastNo = '';
        $lastTemuan = '';

        for ($i = $headerIdx + 1; $i < count($rows); $i++) {
            $r = $rows[$i];

            $rec = [];
            foreach (self::FIELDS as $field) {
                $rec[$field] = isset($colIndex[$field]) ? self::clean($r[$colIndex[$field]] ?? '') : '';
            }
            $status = $statusIdx !== null ? self::clean($r[$statusIdx] ?? '') : '';

            if (implode('', $rec) === '' && $status === '') {
                continue; // baris kosong
            }

            // Sel yang di-merge di Sheet hanya terisi di baris pertama -> isi ulang
            $rec['No'] = self::cleanNo($rec['No']);
            if ($rec['No'] === '') {
                $rec['No'] = $lastNo;
                if ($rec['Temuan'] === '') {
                    $rec['Temuan'] = $lastTemuan;
                }
            } else {
                $lastNo = $rec['No'];
                if ($rec['Temuan'] !== '') {
                    $lastTemuan = $rec['Temuan'];
                } else {
                    $rec['Temuan'] = $lastTemuan;
                }
            }
            if ($rec['No'] === '') {
                continue; // tidak bisa ditentukan milik temuan mana
            }

            $rec['PIC']    = self::normalizePics($rec['PIC'], $unknownPics);
            $rec['Output'] = self::withStatusTag($rec['Output'], $status);

            $records[] = $rec;
        }

        return $records;
    }

    /** Rapikan PIC: singkatan -> nama resmi, dipisah koma */
    public static function normalizePics(string $raw, array &$unknown = []): string
    {
        $tokens = [];
        foreach (preg_split('/\s*[,;\n]\s*/', $raw) as $piece) {
            $piece = trim($piece);
            if ($piece === '') {
                continue;
            }

            $known = self::mapPic($piece);
            if ($known) {
                $tokens[] = $known;
                continue;
            }

            // "Deputi 3 dan Biro MKDI" -> dipecah hanya kalau ada bagian yang dikenali
            $parts = preg_split('/\s+dan\s+/i', $piece);
            if (count($parts) > 1 && array_filter($parts, fn ($p) => self::mapPic(trim($p)))) {
                foreach ($parts as $p) {
                    $p = trim($p);
                    if ($p === '') {
                        continue;
                    }
                    $m = self::mapPic($p);
                    if (!$m) {
                        $unknown[$p] = true;
                    }
                    $tokens[] = $m ?: $p;
                }
                continue;
            }

            $unknown[$piece] = true;
            $tokens[] = $piece;
        }
        return implode(', ', array_values(array_unique($tokens)));
    }

    private static function mapPic(string $name): ?string
    {
        $n = self::norm($name);
        foreach (self::PIC_NAMES as $full) {
            if (self::norm($full) === $n) {
                return $full;
            }
        }
        foreach (self::PIC_ALIAS as $alias => $full) {
            if (self::norm($alias) === $n) {
                return $full;
            }
        }
        return null;
    }

    /** Status di kolom K dimasukkan ke Output sebagai tag, sama seperti yang dibuat aplikasi */
    public static function withStatusTag(string $output, string $status): string
    {
        $s = strtolower($status);
        $tag = str_contains($s, 'selesai') ? '[Selesai]'
            : (str_contains($s, 'proses') ? '[Proses]'
            : (str_contains($s, 'belum') ? '[Belum]' : null));

        if ($tag === null || preg_match('/\[(selesai|proses|belum)\]/i', $output)) {
            return $output;
        }
        if ($output === '') {
            return $tag === '[Selesai]' ? 'Selesai [Selesai]' : $tag;
        }
        return $output . ' ' . $tag;
    }

    private static function clean(?string $v): string
    {
        $v = str_replace(["\r\n", "\r", "\xC2\xA0"], ["\n", "\n", ' '], (string) $v);
        return trim($v);
    }

    private static function cleanNo(string $v): string
    {
        return preg_match('/^\d+(\.0+)?$/', $v) ? (string) (int) $v : $v;
    }

    private static function norm(?string $s): string
    {
        return strtolower(preg_replace('/[^a-z0-9]/i', '', (string) $s));
    }
}