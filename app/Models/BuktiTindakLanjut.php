<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class BuktiTindakLanjut extends Model
{
    public const STATUS_MENUNGGU      = 'menunggu';
    public const STATUS_TERVERIFIKASI = 'terverifikasi';
    public const STATUS_DITOLAK       = 'ditolak';
    public const STATUS_PENDING       = 'pending';   // ditahan auditor (butuh klarifikasi), belum acc / tolak

    protected $table = 'bukti_tindak_lanjut';

    protected $fillable = [
        'temuan_id', 'tanggal_mulai', 'tanggal_selesai', 'uraian',
        'ntpn', 'nominal_setoran',
        'file_path', 'file_name', 'file_mime', 'file_size',
        'status', 'catatan_verifikasi',
        'diunggah_oleh', 'diverifikasi_oleh', 'diverifikasi_pada',
    ];

    protected $casts = [
        'tanggal_mulai'     => 'date',
        'tanggal_selesai'   => 'date',
        'diverifikasi_pada' => 'datetime',
        'nominal_setoran'   => 'decimal:2',
    ];

    public function temuan()
    {
        return $this->belongsTo(Temuan::class, 'temuan_id');
    }

    /** Hapus berkas fisik (kalau ada). Aman dipanggil berulang. */
    public function hapusFile(): void
    {
        if ($this->file_path && Storage::disk('local')->exists($this->file_path)) {
            Storage::disk('local')->delete($this->file_path);
        }
    }
}
