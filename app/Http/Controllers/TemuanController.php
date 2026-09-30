<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Temuan;

class TemuanController extends Controller
{
    // ── GET /api/temuan ───────────────────────────────────────────
    public function index()
    {
        $rows = Temuan::orderBy('sort_order')->orderBy('id')->get();

        // Propagasi No & Temuan dari parent ke sub-baris (sama seperti GAS getAllTemuan)
        $lastNo     = '';
        $lastTemuan = '';

        $data = $rows->map(function ($r) use (&$lastNo, &$lastTemuan) {
            $rawNo     = $r->no     ?? '';
            $rawTemuan = $r->temuan ?? '';

            if ($rawNo)     $lastNo     = $rawNo;
            if ($rawTemuan) $lastTemuan = $rawTemuan;

            return [
                '_row'               => $r->id,
                'No'                 => $rawNo     ?: $lastNo,
                'Temuan'             => $rawTemuan ?: $lastTemuan,
                'SubTemuan'          => $r->sub_temuan          ?? '',
                'Kriteria'           => $r->kriteria            ?? '',
                'Sebab'              => $r->sebab               ?? '',
                'Rekomendasi'        => $r->rekomendasi         ?? '',
                'PIC'                => $r->pic                 ?? '',
                'RencanaAksi'        => $r->rencana_aksi        ?? '',
                'JadwalPelaksanaan'  => $r->jadwal_pelaksanaan  ?? '',
                'Output'             => $r->output              ?? '',
                'isSubRow'           => ($r->parent_id !== null),
            ];
        });

        return response()->json($data->values());
    }

    // ── GET /api/temuan/next-no ───────────────────────────────────
    public function nextNo()
    {
        $max = Temuan::whereNotNull('no')
            ->selectRaw('MAX(CAST(no AS UNSIGNED)) as max_no')
            ->value('max_no');

        return response()->json(($max ?? 0) + 1);
    }

    // ── POST /api/temuan ──────────────────────────────────────────
    // Hanya Admin (Inspektorat) yang boleh membuat temuan/sub-temuan baru,
    // karena aksi ini menyentuh kolom A-F (No, Temuan, Sub Temuan, Kriteria,
    // Sebab, Rekomendasi) dan menentukan PIC (kolom G) yang ditugaskan.
    public function store(Request $request)
    {
        if (! $this->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Admin (Inspektorat) yang dapat menambah temuan atau sub-temuan baru.',
            ], 403);
        }

        $fd      = $request->all();
        $isSub   = filter_var($fd['isSubAdd'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $parentId = $fd['parentRow'] ?? null;

        // Tentukan sort_order: sub di-insert tepat setelah parent
        $sortOrder = $this->resolveSort($isSub ? $parentId : null);

        $temuan = Temuan::create([
            'no'                  => $isSub ? null : ($fd['No']     ?? null),
            'temuan'              => $isSub ? null : ($fd['Temuan']  ?? null),
            'sub_temuan'          => $fd['SubTemuan']         ?? null,
            'kriteria'            => $fd['Kriteria']          ?? null,
            'sebab'               => $fd['Sebab']             ?? null,
            'rekomendasi'         => $fd['Rekomendasi']       ?? null,
            'pic'                 => $fd['PIC']               ?? null,
            'rencana_aksi'        => $fd['RencanaAksi']       ?? null,
            'jadwal_pelaksanaan'  => $fd['JadwalPelaksanaan'] ?? null,
            'output'              => $fd['Output']            ?? null,
            'parent_id'           => $isSub ? $parentId : null,
            'sort_order'          => $sortOrder,
        ]);

        return response()->json(['success' => true, 'row' => $temuan->id, 'no' => $temuan->no]);
    }

    // ── PUT /api/temuan/{id} ──────────────────────────────────────
    // Admin: boleh ubah semua kolom (A-J).
    // PIC  : hanya boleh ubah kolom H-J (Rencana Aksi, Jadwal Pelaksanaan, Output),
    //        dan HANYA untuk baris yang kolom PIC-nya (kolom G) memuat username-nya
    //        sendiri. Kolom A-G sama sekali diabaikan/tidak diproses dari request PIC,
    //        meskipun dikirim dari klien.
    public function update(Request $request, int $id)
    {
        $temuan = Temuan::find($id);
        if (! $temuan) {
            return response()->json(['success' => false, 'message' => 'Data tidak ditemukan.'], 404);
        }

        $me   = $this->currentUser();
        $role = $me['role'] ?? null;
        $fd   = $request->all();

        if ($role === 'admin') {
            $temuan->update([
                'no'                  => $fd['No']               ?? $temuan->no,
                'temuan'              => $fd['Temuan']            ?? $temuan->temuan,
                'sub_temuan'          => $fd['SubTemuan']         ?? null,
                'kriteria'            => $fd['Kriteria']          ?? null,
                'sebab'               => $fd['Sebab']             ?? null,
                'rekomendasi'         => $fd['Rekomendasi']       ?? null,
                'pic'                 => $fd['PIC']               ?? null,
                'rencana_aksi'        => $fd['RencanaAksi']       ?? null,
                'jadwal_pelaksanaan'  => $fd['JadwalPelaksanaan'] ?? null,
                'output'              => $fd['Output']            ?? null,
            ]);

            return response()->json(['success' => true]);
        }

        if ($role === 'pic') {
            if (! $this->isOwnerPic($temuan, $me['username'] ?? '')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak berwenang mengubah data milik PIC lain.',
                ], 403);
            }

            // Kolom A-G dikunci untuk PIC: nilai lama dipertahankan apa pun
            // yang dikirim dari klien. Hanya H-J yang benar-benar diproses.
            $temuan->update([
                'rencana_aksi'        => $fd['RencanaAksi']       ?? $temuan->rencana_aksi,
                'jadwal_pelaksanaan'  => $fd['JadwalPelaksanaan'] ?? $temuan->jadwal_pelaksanaan,
                'output'              => $fd['Output']            ?? $temuan->output,
            ]);

            return response()->json(['success' => true]);
        }

        return response()->json(['success' => false, 'message' => 'Sesi tidak valid, silakan login ulang.'], 401);
    }

    // ── DELETE /api/temuan/{id} ───────────────────────────────────
    // Hanya Admin yang dapat menghapus data (aksi destruktif atas temuan resmi).
    public function destroy(int $id)
    {
        if (! $this->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Admin (Inspektorat) yang dapat menghapus data.',
            ], 403);
        }

        $temuan = Temuan::find($id);
        if (! $temuan) {
            return response()->json(['success' => false, 'message' => 'Data tidak ditemukan.'], 404);
        }

        $temuan->delete();
        return response()->json(['success' => true]);
    }

    // ── Helper: Role & Kepemilikan PIC ─────────────────────────────
    private function currentUser(): ?array
    {
        return session('kmdi_user');
    }

    private function isAdmin(): bool
    {
        $me = $this->currentUser();
        return ($me['role'] ?? null) === 'admin';
    }

    /**
     * Kolom PIC disimpan sebagai teks dipisah koma, mis. "Biro A, Biro B".
     * Pisahkan jadi token-token bersih untuk dicocokkan satu per satu.
     */
    private function picTokens(?string $s): array
    {
        if (! $s) return [];
        $parts = preg_split('/\s*[,;\n]\s*/', $s);
        return array_values(array_filter(array_map('trim', $parts)));
    }

    /**
     * Apakah username ini termasuk salah satu PIC yang tercantum di baris $temuan?
     * Dicocokkan case-insensitive & trim, sama seperti pola picKeyOf() di kmdi.js.
     */
    private function isOwnerPic(Temuan $temuan, string $username): bool
    {
        $target = mb_strtolower(trim($username));
        if ($target === '') return false;

        foreach ($this->picTokens($temuan->pic) as $t) {
            if (mb_strtolower($t) === $target) return true;
        }
        return false;
    }

    // ── Helper ────────────────────────────────────────────────────
    /**
     * Hitung sort_order agar sub-baris muncul tepat setelah parent-nya.
     * Tanpa parentId → append di akhir.
     */
    private function resolveSort(?int $parentId): int
    {
        if (! $parentId) {
            return (Temuan::max('sort_order') ?? 0) + 10;
        }

        $parent     = Temuan::find($parentId);
        $baseOrder  = $parent?->sort_order ?? 0;

        // Geser baris-baris di bawah parent agar ada ruang
        Temuan::where('sort_order', '>', $baseOrder)->increment('sort_order', 10);

        return $baseOrder + 5;
    }
}