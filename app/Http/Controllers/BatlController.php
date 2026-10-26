<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ChecksKmdiAccess;
use App\Models\Batl;
use App\Models\BuktiTindakLanjut;
use App\Models\Temuan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

/**
 * Berita Acara Tindak Lanjut (BATL).
 * Diterbitkan auditor pemilik temuan setelah bukti terbaru terverifikasi.
 * Biro (PIC) hanya dapat melihat / mengunduh BATL pada temuannya.
 */
class BatlController extends Controller
{
    use ChecksKmdiAccess;

    private const MAX_KB = 10240;
    private const EXT    = 'pdf,png,jpg,jpeg,doc,docx';

    // ── POST /api/batl (multipart/form-data) ──────────────────────
    public function store(Request $request)
    {
        if (! $this->isStaff()) {
            return $this->forbidden('Hanya auditor yang dapat menerbitkan BATL.');
        }

        $v = Validator::make($request->all(), [
            'temuan_id' => ['required', 'integer', 'exists:temuan,id'],
            'nomor'     => ['required', 'string', 'max:120'],
            'tanggal'   => ['required', 'date'],
            'catatan'   => ['nullable', 'string', 'max:5000'],
            'file'      => ['nullable', 'file', 'max:' . self::MAX_KB, 'mimes:' . self::EXT],
        ], [
            'temuan_id.*'    => 'Temuan tidak valid.',
            'nomor.required' => 'Nomor BATL wajib diisi.',
            'nomor.max'      => 'Nomor BATL maksimal 120 karakter.',
            'tanggal.required' => 'Tanggal BATL wajib diisi.',
            'tanggal.date'   => 'Tanggal BATL tidak valid.',
            'file.max'       => 'Ukuran berkas maksimal 10 MB.',
            'file.mimes'     => 'Format berkas BATL harus PDF, gambar, atau Word.',
            'file.uploaded'  => 'Berkas gagal diunggah. Periksa batas upload_max_filesize di server.',
        ]);
        if ($v->fails()) {
            return response()->json(['success' => false, 'message' => $v->errors()->first()], 422);
        }

        $temuan = Temuan::with(['bukti:id,temuan_id,status', 'batl'])->findOrFail((int) $request->input('temuan_id'));
        if (! $this->canManageTemuan($temuan)) {
            return $this->forbidden('Temuan ini bukan milik akun Anda.');
        }
        if ($temuan->batl) {
            return response()->json(['success' => false, 'message' => 'BATL untuk temuan ini sudah terbit.'], 422);
        }
        if ($temuan->tlStatus() !== BuktiTindakLanjut::STATUS_TERVERIFIKASI) {
            return response()->json(['success' => false, 'message' => 'BATL hanya dapat diterbitkan setelah bukti terbaru berstatus terverifikasi.'], 422);
        }

        $path = $name = $mime = $size = null;
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $ext  = strtolower($file->getClientOriginalExtension() ?: $file->guessExtension() ?: 'bin');
            $name = $file->getClientOriginalName();
            $mime = $file->getClientMimeType();
            $size = $file->getSize();
            $path = $file->storeAs('batl/' . $temuan->id, Str::uuid() . '.' . $ext, 'local');
        }

        $batl = Batl::create([
            'temuan_id'        => $temuan->id,
            'nomor'            => trim((string) $request->input('nomor')),
            'tanggal'          => $request->input('tanggal'),
            'catatan'          => trim((string) $request->input('catatan', '')) ?: null,
            'file_path'        => $path,
            'file_name'        => $name,
            'file_mime'        => $mime,
            'file_size'        => $size,
            'diterbitkan_oleh' => $this->username() ?: null,
        ]);

        return response()->json(['success' => true, 'data' => self::present($batl)]);
    }

    // ── GET /api/batl/{id}/file ───────────────────────────────────
    public function file(int $id)
    {
        $batl = Batl::with('temuan')->find($id);
        if (! $batl || ! $batl->file_path || ! Storage::disk('local')->exists($batl->file_path)) {
            return response()->json(['success' => false, 'message' => 'Berkas BATL tidak ditemukan.'], 404);
        }
        if (! $this->canView($batl->temuan)) {
            return $this->forbidden('Anda tidak berhak mengakses berkas ini.');
        }

        return Storage::disk('local')->download($batl->file_path, $batl->file_name ?: basename($batl->file_path));
    }

    // ── DELETE /api/batl/{id}  (batalkan BATL -> proses dibuka lagi) ─
    public function destroy(int $id)
    {
        if (! $this->isStaff()) {
            return $this->forbidden('Hanya auditor yang dapat membatalkan BATL.');
        }

        $batl = Batl::with('temuan')->find($id);
        if (! $batl) {
            return response()->json(['success' => false, 'message' => 'Data tidak ditemukan.'], 404);
        }
        if (! $this->canManageTemuan($batl->temuan)) {
            return $this->forbidden('Temuan ini bukan milik akun Anda.');
        }

        $batl->hapusFile();
        $batl->delete();

        return response()->json(['success' => true]);
    }

    // ── Helper ────────────────────────────────────────────────────
    private function canView(?Temuan $t): bool
    {
        if (! $t) {
            return false;
        }
        if ($this->isPic()) {
            return $this->ownsRow($t->pic);
        }
        return $this->canManageTemuan($t);
    }

    public static function present(Batl $b): array
    {
        return [
            'id'             => $b->id,
            'temuanId'       => $b->temuan_id,
            'nomor'          => $b->nomor,
            'tanggal'        => optional($b->tanggal)->format('Y-m-d'),
            'catatan'        => $b->catatan,
            'fileName'       => $b->file_name,
            'fileSize'       => $b->file_size,
            'fileUrl'        => $b->file_path ? '/api/batl/' . $b->id . '/file' : null,
            'diterbitkanOleh'=> $b->diterbitkan_oleh,
            'dibuat'         => optional($b->created_at)->format('Y-m-d H:i'),
        ];
    }
}
