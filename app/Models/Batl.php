<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Batl extends Model
{
    protected $table = 'batl';

    protected $fillable = [
        'temuan_id', 'nomor', 'tanggal', 'catatan',
        'file_path', 'file_name', 'file_mime', 'file_size',
        'diterbitkan_oleh',
        'ttd_auditor_oleh', 'ttd_auditor_pada',
        'ttd_auditee_oleh', 'ttd_auditee_pada',
    ];

    protected $casts = [
        'tanggal'          => 'date',
        'ttd_auditor_pada' => 'datetime',
        'ttd_auditee_pada' => 'datetime',
    ];

    public function temuan()
    {
        return $this->belongsTo(Temuan::class, 'temuan_id');
    }

    /** Apakah kesepakatan penutupan LHP sudah ditandatangani oleh kedua pihak (Auditor & Auditee)? */
    public function isSignedBoth(): bool
    {
        return ! empty($this->ttd_auditor_pada) && ! empty($this->ttd_auditee_pada);
    }

    public function hapusFile(): void
    {
        if ($this->file_path && Storage::disk('local')->exists($this->file_path)) {
            Storage::disk('local')->delete($this->file_path);
        }
    }
}
