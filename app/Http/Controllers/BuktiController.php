<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ChecksMkdiAccess;
use App\Models\BuktiTindakLanjut;
use App\Models\Temuan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class BuktiController extends Controller
{
    use ChecksMkdiAccess;

    /** 10 MB dalam KB (aturan "max" Laravel memakai KB) */
    private const MAX_KB = 10240;

    private const EXT = 'pdf,png,jpg,jpeg,doc,docx,xls,xlsx';

    // ── GET /api/bukti?temuan_id=.. ───────────────────────────────
    public function index(Request $request)
    {
        $temuan = Temuan::find((int) $request->query('temuan_id'));
        if (! $temuan) {
            return response()->json(['success' => false, 'message' => 'Temuan tidak ditemukan.'], 404);
        }
        if (! $this->canAccess($temuan)) {
            return $this->forbidden('Temuan ini tidak ditugaskan kepada akun Anda.');
        }

        $rows = BuktiTindakLanjut::where('temuan_id', $temuan->id)
            ->orderByDesc('id')
            ->get()
            ->map(fn ($b) => $this->present($b));

        $temuan->load(['bukti:id,temuan_id,status', 'batl']);
        $root = $temuan->rootTemuan();

        return response()->json([
            'success'       => true,
            'data'          => $rows,
            'tlStatus'      => $temuan->tlStatus(),
            'batl'          => $temuan->batl ? BatlController::present($temuan->batl) : null,
            'canBatl'       => $this->canManageTemuan($temuan) && $this->bisaTerbitBatl($temuan),
            // Alasan BATL belum bisa terbit (mis. rekomendasi lain belum tuntas); hanya untuk sisi auditor
            'batlAlasan'    => ($this->isStaff() && $temuan->tlStatus() === BuktiTindakLanjut::STATUS_TERVERIFIKASI)
                ? $temuan->batlBlocker() : null,
            'progress'      => $temuan->rekomendasiProgress(),
            'statusDokumen' => $root->status_dokumen ?: Temuan::DOKUMEN_LHP_SEMENTARA,
            'noLha'         => $root->no_lha,
        ]);
    }

    // ── POST /api/bukti  (multipart/form-data) ────────────────────
    public function store(Request $request)
    {
        // Nominal boleh dikirim "1.500.000,50" atau "1500000.50"; dinormalkan ke angka murni
        $request->merge([
            'ntpn'            => strtoupper(trim((string) $request->input('ntpn', ''))) ?: null,
            'nominal_setoran' => $this->normalNominal($request->input('nominal_setoran')),
        ]);

        $berkasWajib = (bool) config('etlhp.berkas_wajib', true);

        $v = Validator::make($request->all(), [
            'temuan_id'       => ['required', 'integer', 'exists:temuan,id'],
            'tanggal_mulai'   => ['required', 'date'],
            'tanggal_selesai' => ['required', 'date', 'after_or_equal:tanggal_mulai'],
            'uraian'          => ['required', 'string', 'max:5000'],
            'ntpn'            => ['nullable', 'regex:/^[A-Z0-9]{16}$/', 'required_with:nominal_setoran'],
            'nominal_setoran' => ['nullable', 'numeric', 'min:0', 'max:9999999999999999', 'required_with:ntpn'],
            'file'            => [$berkasWajib ? 'required' : 'nullable', 'file', 'max:' . self::MAX_KB, 'mimes:' . self::EXT],
        ], [
            'temuan_id.*'              => 'Temuan tidak valid.',
            'ntpn.regex'               => 'NTPN harus 16 karakter huruf/angka.',
            'ntpn.required_with'       => 'NTPN wajib diisi bila nominal setoran diisi.',
            'nominal_setoran.numeric'  => 'Nominal setoran harus berupa angka.',
            'nominal_setoran.min'      => 'Nominal setoran tidak boleh negatif.',
            'nominal_setoran.required_with' => 'Nominal setoran wajib diisi bila NTPN diisi.',
            'file.required'            => 'Berkas bukti dukung (eviden) wajib diunggah.',
            'tanggal_mulai.required'   => 'Tanggal mulai tindak lanjut wajib diisi.',
            'tanggal_mulai.date'       => 'Tanggal mulai tidak valid.',
            'tanggal_selesai.required' => 'Tanggal selesai tindak lanjut wajib diisi.',
            'tanggal_selesai.date'     => 'Tanggal selesai tidak valid.',
            'tanggal_selesai.after_or_equal' => 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.',
            'uraian.required'          => 'Uraian progres wajib diisi.',
            'uraian.max'               => 'Uraian progres maksimal 5000 karakter.',
            'file.max'                 => 'Ukuran berkas maksimal 10 MB.',
            'file.mimes'               => 'Format berkas harus PDF, gambar (png/jpg/jpeg), Word, atau Excel.',
            'file.uploaded'            => 'Berkas gagal diunggah. Periksa batas upload_max_filesize di server (minimal 10M).',
            'file.file'                => 'Berkas tidak valid.',
        ]);

        if ($v->fails()) {
            return response()->json(['success' => false, 'message' => $v->errors()->first()], 422);
        }

        $temuan = Temuan::findOrFail((int) $request->input('temuan_id'));
        if ($this->isAuditor()) {
            return $this->forbidden('Bukti diunggah oleh biro/unit PIC, bukan auditor.');
        }
        if (! $this->canAccess($temuan)) {
            return $this->forbidden('Temuan ini tidak ditugaskan kepada akun Anda.');
        }
        if ($temuan->batl()->exists()) {
            return response()->json(['success' => false, 'message' => 'Temuan ini sudah selesai (BATL telah terbit). Bukti baru tidak dapat dikirim.'], 422);
        }

        $path = $name = $mime = $size = null;
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $ext  = strtolower($file->getClientOriginalExtension() ?: $file->guessExtension() ?: 'bin');
            $name = $file->getClientOriginalName();
            $mime = $file->getClientMimeType();
            $size = $file->getSize();
            // Nama di disk acak (uuid) supaya tidak bisa ditebak & tidak bentrok; nama asli disimpan di DB
            $path = $file->storeAs('bukti/' . $temuan->id, Str::uuid() . '.' . $ext, 'local');
        }

        $bukti = BuktiTindakLanjut::create([
            'temuan_id'       => $temuan->id,
            'tanggal_mulai'   => $request->input('tanggal_mulai'),
            'tanggal_selesai' => $request->input('tanggal_selesai'),
            'uraian'          => trim((string) $request->input('uraian')),
            'ntpn'            => $request->input('ntpn') ?: null,
            'nominal_setoran' => $request->input('nominal_setoran') !== null && $request->input('nominal_setoran') !== ''
                                    ? $request->input('nominal_setoran') : null,
            'file_path'       => $path,
            'file_name'       => $name,
            'file_mime'       => $mime,
            'file_size'       => $size,
            'status'          => BuktiTindakLanjut::STATUS_MENUNGGU,
            'diunggah_oleh'   => $this->currentUser()['username'] ?? null,
        ]);

        $temuan->syncStatusLha();

        return response()->json(['success' => true, 'data' => $this->present($bukti)]);
    }

    // ── GET /api/bukti/{id}/file ──────────────────────────────────
    public function file(int $id)
    {
        $bukti = BuktiTindakLanjut::with('temuan')->find($id);
        if (! $bukti || ! $bukti->file_path || ! Storage::disk('local')->exists($bukti->file_path)) {
            return response()->json(['success' => false, 'message' => 'Berkas tidak ditemukan.'], 404);
        }
        if (! $this->canAccess($bukti->temuan)) {
            return $this->forbidden('Anda tidak berhak mengakses berkas ini.');
        }

        return Storage::disk('local')->download($bukti->file_path, $bukti->file_name ?: basename($bukti->file_path));
    }

    // ── PUT /api/bukti/{id}/verifikasi  (auditor pemilik temuan / admin) ─
    public function verifikasi(Request $request, int $id)
    {
        if (! $this->isStaff()) {
            return $this->forbidden('Hanya auditor yang dapat memverifikasi bukti.');
        }

        $bukti = BuktiTindakLanjut::with('temuan')->find($id);
        if (! $bukti) {
            return response()->json(['success' => false, 'message' => 'Data tidak ditemukan.'], 404);
        }
        if (! $this->canManageTemuan($bukti->temuan)) {
            return $this->forbidden('Temuan ini bukan milik akun Anda.');
        }
        if ($bukti->temuan->batl()->exists()) {
            return response()->json(['success' => false, 'message' => 'BATL sudah terbit. Batalkan BATL terlebih dahulu jika verifikasi perlu diubah.'], 422);
        }

        $status  = (string) $request->input('status');
        $catatan = trim((string) $request->input('catatan', ''));

        $allowed = [
            BuktiTindakLanjut::STATUS_TERVERIFIKASI,   // acc
            BuktiTindakLanjut::STATUS_DITOLAK,         // tolak
            BuktiTindakLanjut::STATUS_PENDING,         // tahan
        ];
        if (! in_array($status, $allowed, true)) {
            return response()->json(['success' => false, 'message' => 'Status verifikasi tidak valid.'], 422);
        }
        if (in_array($status, [BuktiTindakLanjut::STATUS_DITOLAK, BuktiTindakLanjut::STATUS_PENDING], true) && $catatan === '') {
            $msg = $status === BuktiTindakLanjut::STATUS_DITOLAK
                ? 'Catatan wajib diisi jika bukti ditolak.'
                : 'Catatan wajib diisi jika bukti ditahan (pending).';
            return response()->json(['success' => false, 'message' => $msg], 422);
        }

        $bukti->update([
            'status'             => $status,
            'catatan_verifikasi' => $catatan !== '' ? $catatan : null,
            'diverifikasi_oleh'  => $this->username() ?: null,
            'diverifikasi_pada'  => now(),
        ]);

        $bukti->temuan->syncStatusLha();

        return response()->json(['success' => true, 'data' => $this->present($bukti)]);
    }

    // ── DELETE /api/bukti/{id} ────────────────────────────────────
    public function destroy(int $id)
    {
        $bukti = BuktiTindakLanjut::with('temuan')->find($id);
        if (! $bukti) {
            return response()->json(['success' => false, 'message' => 'Data tidak ditemukan.'], 404);
        }
        if (! $this->canAccess($bukti->temuan)) {
            return $this->forbidden('Anda tidak berhak menghapus bukti ini.');
        }
        if ($bukti->temuan && $bukti->temuan->batl()->exists()) {
            return $this->forbidden('BATL sudah terbit. Batalkan BATL terlebih dahulu sebelum menghapus bukti.');
        }
        // PIC tidak boleh menghapus bukti yang sudah diverifikasi auditor
        if ($this->isPic() && $bukti->status === BuktiTindakLanjut::STATUS_TERVERIFIKASI) {
            return $this->forbidden('Bukti yang sudah terverifikasi tidak dapat dihapus.');
        }

        $bukti->hapusFile();
        $bukti->delete();

        return response()->json(['success' => true]);
    }

    // ── Helper ────────────────────────────────────────────────────
    /** Admin boleh semua; auditor hanya temuan miliknya; PIC hanya temuan yang PIC-nya dia. */
    private function canAccess(?Temuan $temuan): bool
    {
        if (! $temuan) {
            return false;
        }
        if ($this->isPic()) {
            return $this->ownsRow($temuan->pic);
        }
        if ($this->isAuditor()) {
            return $this->ownsTemuan($temuan->created_by);
        }
        return true;
    }

    /** BATL boleh terbit bila belum ada BATL, bukti terbaru terverifikasi, dan seluruh rekomendasi tuntas. */
    private function bisaTerbitBatl(Temuan $temuan): bool
    {
        return $temuan->batlBlocker() === null;
    }

    /** "Rp 1.500.000,50" / "1.500.000,50" / "1500000.50" -> "1500000.50"; kosong -> null */
    private function normalNominal($v): ?string
    {
        $s = trim(preg_replace('/[^\d.,-]/', '', (string) $v));
        if ($s === '') {
            return null;
        }
        if (str_contains($s, ',')) {                 // format Indonesia: titik ribuan, koma desimal
            $s = str_replace(['.', ','], ['', '.'], $s);
        } elseif (preg_match('/^\d{1,3}(\.\d{3})+$/', $s)) {   // 1.500.000 (titik = ribuan)
            $s = str_replace('.', '', $s);
        }
        return $s;
    }

    private function present(BuktiTindakLanjut $b): array
    {
        return [
            'id'              => $b->id,
            'temuanId'        => $b->temuan_id,
            'tanggalMulai'    => optional($b->tanggal_mulai)->format('Y-m-d'),
            'tanggalSelesai'  => optional($b->tanggal_selesai)->format('Y-m-d'),
            'uraian'          => $b->uraian,
            'ntpn'            => $b->ntpn,
            'nominalSetoran'  => $b->nominal_setoran !== null ? (float) $b->nominal_setoran : null,
            'fileName'        => $b->file_name,
            'fileSize'        => $b->file_size,
            'fileUrl'         => $b->file_path ? '/api/bukti/' . $b->id . '/file' : null,
            'status'          => $b->status,
            'catatan'         => $b->catatan_verifikasi,
            'diunggahOleh'    => $b->diunggah_oleh,
            'diverifikasiOleh'=> $b->diverifikasi_oleh,
            'diverifikasiPada'=> optional($b->diverifikasi_pada)->format('Y-m-d H:i'),
            'dibuat'          => optional($b->created_at)->format('Y-m-d H:i'),
        ];
    }
}
