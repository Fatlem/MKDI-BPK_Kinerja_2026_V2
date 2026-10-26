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
    ];

    protected $casts = ['tanggal' => 'date'];

    public function temuan()
    {
        return $this->belongsTo(Temuan::class, 'temuan_id');
    }

    public function hapusFile(): void
    {
        if ($this->file_path && Storage::disk('local')->exists($this->file_path)) {
            Storage::disk('local')->delete($this->file_path);
        }
    }
}
