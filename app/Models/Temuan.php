<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Temuan extends Model
{
    protected $table = 'temuan';

    protected $fillable = [
        'no', 'temuan', 'sub_temuan', 'kriteria', 'sebab',
        'rekomendasi', 'pic', 'rencana_aksi', 'jadwal_pelaksanaan',
        'output', 'parent_id', 'sort_order',
        'sumber', 'created_by',
    ];

    public const SUMBER_BPK         = 'bpk';
    public const SUMBER_INSPEKTORAT = 'inspektorat';

    /** Awalan kode LHP per sumber audit. Contoh: LHP-BPK-001, LHP-INS-001 */
    public const KODE_PREFIX = [
        self::SUMBER_BPK         => 'LHP-BPK-',
        self::SUMBER_INSPEKTORAT => 'LHP-INS-',
    ];

    public const SUMBER_LABEL = [
        self::SUMBER_BPK         => 'BPK RI',
        self::SUMBER_INSPEKTORAT => 'Inspektorat',
    ];

    public function parent()
    {
        return $this->belongsTo(Temuan::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Temuan::class, 'parent_id')->orderBy('sort_order');
    }

    public function bukti()
    {
        return $this->hasMany(BuktiTindakLanjut::class, 'temuan_id');
    }

    public function batl()
    {
        return $this->hasOne(Batl::class, 'temuan_id');
    }

    /**
     * Status tindak lanjut (alur kerja), dihitung dari BATL + bukti terbaru:
     * batl | terverifikasi | menunggu | pending | ditolak | belum
     * Relasi `bukti` dan `batl` sebaiknya sudah di-load (eager) saat memanggil ini untuk banyak baris.
     */
    public function tlStatus(): string
    {
        if ($this->batl) {
            return 'batl';
        }
        $last = $this->bukti->sortByDesc('id')->first();
        return $last ? $last->status : 'belum';
    }

    protected static function booted(): void
    {
        // Baris DB bukti ikut terhapus lewat FK cascade; berkas fisiknya dibersihkan di sini
        static::deleting(function (Temuan $t) {
            $t->bukti->each->hapusFile();
            optional($t->batl)->hapusFile();
        });
    }
}
