<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pic;

class PicController extends Controller
{
    // ── GET /api/pic (tidak diubah) ───────────────────────────────
    public function index()
    {
        $list = Pic::orderBy('id')->get()->map(fn($p) => [
            'username' => $p->nama,   // konsisten dengan format GAS: username = nama
            'nama'     => $p->nama,
        ]);

        return response()->json($list);
    }

    // ── POST /api/pic ─────────────────────────────────────────────
    /**
     * Tambah PIC baru ke tabel `pic`.
     * Menerima satu nama, atau beberapa nama dipisah koma / titik koma / baris baru
     * (sesuai teks di form: "bisa lebih dari satu, pisahkan koma").
     * Nama yang sudah ada (tanpa peduli huruf besar/kecil & spasi) dilewati, tidak diduplikasi.
     *
     * Body: { "nama": "Inspektorat, Staf Ahli" }
     * Respon: { success, data: [{username,nama}, ...], created: [...], existing: [...] }
     */
    public function store(Request $request)
    {
        // Sama seperti TemuanController: akun PIC tidak boleh menambah data master
        $role = strtolower((string) (((array) session('kmdi_user', []))['role'] ?? ''));
        if ($role === 'pic') {
            return response()->json(['success' => false, 'message' => 'Akun PIC tidak dapat menambah PIC.'], 403);
        }

        $names = collect(preg_split('/\s*[,;\n]\s*/', (string) $request->input('nama', '')))
            ->map(fn ($n) => trim(preg_replace('/\s+/', ' ', $n)))
            ->filter()
            ->unique(fn ($n) => self::norm($n))
            ->values();

        if ($names->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'Nama PIC wajib diisi.'], 422);
        }
        if ($names->contains(fn ($n) => mb_strlen($n) > 255)) {
            return response()->json(['success' => false, 'message' => 'Nama PIC terlalu panjang (maks 255 karakter).'], 422);
        }

        $existing = Pic::pluck('nama')->keyBy(fn ($n) => self::norm($n));

        $created = [];
        $already = [];
        foreach ($names as $name) {
            $key = self::norm($name);
            if ($existing->has($key)) {
                $already[] = $existing[$key];      // pakai penulisan yang sudah ada di database
                continue;
            }
            $created[] = Pic::create(['nama' => $name])->nama;
        }

        $format = fn ($n) => ['username' => $n, 'nama' => $n];

        return response()->json([
            'success'  => true,
            'data'     => collect(array_merge($already, $created))->map($format)->values(),
            'created'  => $created,
            'existing' => $already,
        ]);
    }

    private static function norm(?string $s): string
    {
        return mb_strtolower(preg_replace('/[^\p{L}\p{N}]/u', '', (string) $s));
    }
}