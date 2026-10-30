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
        'jenis_audit', 'kondisi', 'akibat',
        'status_dokumen', 'no_lha',
    ];

    public const SUMBER_BPK         = 'bpk';
    public const SUMBER_INSPEKTORAT = 'inspektorat';

    public const DOKUMEN_LHP_SEMENTARA = 'lhp_sementara';
    public const DOKUMEN_LHA           = 'lha';

    /** Awalan kode LHP per sumber audit. Contoh: LHP-BPK-001, LHP-INS-001 */
    public const KODE_PREFIX = [
        self::SUMBER_BPK         => 'LHP-BPK-',
        self::SUMBER_INSPEKTORAT => 'LHP-INS-',
    ];

    public const SUMBER_LABEL = [
        self::SUMBER_BPK         => 'BPK RI',
        self::SUMBER_INSPEKTORAT => 'Inspektorat',
    ];

    public const JENIS_KINERJA   = 'kinerja';
    public const JENIS_KEUANGAN  = 'keuangan';
    public const JENIS_KEPATUHAN = 'kepatuhan';
    public const JENIS_KHUSUS    = 'khusus';

    /** 4 jenis audit pada WORKFLOW.md Fase 1 */
    public const JENIS_AUDIT_LABEL = [
        self::JENIS_KINERJA   => 'Audit Kinerja',
        self::JENIS_KEUANGAN  => 'Audit Keuangan',
        self::JENIS_KEPATUHAN => 'Audit Kepatuhan',
        self::JENIS_KHUSUS    => 'Audit Khusus / Investigatif',
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

    /**
     * Alasan BATL belum boleh terbit, atau null bila sudah boleh.
     * Aturan: (1) bukti terbaru baris ini terverifikasi, (2) bila config
     * etlhp.batl_semua_rekomendasi aktif, seluruh baris satu temuan induk yang memuat
     * rekomendasi juga sudah terverifikasi / BATL.
     */
    public function batlBlocker(): ?string
    {
        $this->loadMissing(['bukti:id,temuan_id,status', 'batl']);

        if ($this->batl) {
            return 'BATL untuk temuan ini sudah terbit.';
        }
        if ($this->tlStatus() !== BuktiTindakLanjut::STATUS_TERVERIFIKASI) {
            return 'BATL hanya dapat diterbitkan setelah bukti terbaru berstatus terverifikasi.';
        }
        if (! config('etlhp.batl_semua_rekomendasi', true)) {
            return null;
        }

        $rootId = $this->parent_id ?: $this->id;
        $group  = Temuan::with(['bukti:id,temuan_id,status', 'batl'])
            ->where(fn ($q) => $q->where('id', $rootId)->orWhere('parent_id', $rootId))
            ->get();

        $belum = $group->filter(function (Temuan $t) {
            if ($t->id === $this->id) {
                return false;
            }
            if (trim((string) $t->rekomendasi) === '') {   // baris tanpa rekomendasi tidak ikut dihitung
                return false;
            }
            return ! in_array($t->tlStatus(), [BuktiTindakLanjut::STATUS_TERVERIFIKASI, 'batl'], true);
        });

        if ($belum->isNotEmpty()) {
            return 'Masih ada ' . $belum->count() . ' rekomendasi lain pada temuan ini yang belum tuntas (terverifikasi). BATL terbit setelah seluruh rekomendasi tuntas.';
        }
        return null;
    }

    /** Ambil baris induk utama dari temuan/sub-temuan ini. */
    public function rootTemuan(): self
    {
        $cur   = $this;
        $guard = 0;
        while ($cur->parent_id && $guard++ < 20) {
            $parent = self::find($cur->parent_id);
            if (! $parent) {
                break;
            }
            $cur = $parent;
        }
        return $cur;
    }

    /**
     * Hitung progres ketuntasan seluruh rekomendasi/sub-temuan dalam satu Temuan Induk (Fase 4 - D7).
     * Mengembalikan ['total' => int, 'tuntas' => int, 'semuaTuntas' => bool].
     */
    public function rekomendasiProgress(): array
    {
        $root  = $this->rootTemuan();
        $items = self::with(['bukti:id,temuan_id,status', 'batl'])
            ->where(fn ($q) => $q->where('id', $root->id)->orWhere('parent_id', $root->id))
            ->get();

        $total  = $items->count();
        $tuntas = $items->filter(fn (self $r) => in_array($r->tlStatus(), [
            BuktiTindakLanjut::STATUS_TERVERIFIKASI,
            'batl',
        ], true))->count();

        return [
            'total'       => $total,
            'tuntas'      => $tuntas,
            'semuaTuntas' => $total > 0 && $tuntas === $total,
        ];
    }

    /**
     * Sinkronisasi status dokumen (LHP Sementara -> LHA) pada Temuan Induk beserta seluruh sub-temuannya.
     * Berubah menjadi LHA hanya jika seluruh rekomendasi pada temuan induk sudah tuntas
     * dan BATL telah ditandatangani oleh kedua pihak (Auditor & Auditee).
     */
    public function syncStatusLha(): void
    {
        $root  = $this->rootTemuan();
        $items = self::with(['bukti:id,temuan_id,status', 'batl'])
            ->where(fn ($q) => $q->where('id', $root->id)->orWhere('parent_id', $root->id))
            ->get();

        $prog = $this->rekomendasiProgress();
        $hasSignedBatl = $items->contains(fn (self $r) => $r->batl && $r->batl->isSignedBoth());

        if ($hasSignedBatl && $prog['semuaTuntas']) {
            $kodeLhp = (string) ($root->no ?: 'LHP-INS-' . str_pad((string) $root->id, 3, '0', STR_PAD_LEFT));
            $kodeLha = preg_replace('/^LHP-/i', 'LHA-', $kodeLhp);
            if ($kodeLha === $kodeLhp) {
                $kodeLha = 'LHA-' . $kodeLhp;
            }

            self::where(fn ($q) => $q->where('id', $root->id)->orWhere('parent_id', $root->id))
                ->update([
                    'status_dokumen' => self::DOKUMEN_LHA,
                    'no_lha'         => $kodeLha,
                ]);
        } else {
            self::where(fn ($q) => $q->where('id', $root->id)->orWhere('parent_id', $root->id))
                ->update([
                    'status_dokumen' => self::DOKUMEN_LHP_SEMENTARA,
                    'no_lha'         => null,
                ]);
        }
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
