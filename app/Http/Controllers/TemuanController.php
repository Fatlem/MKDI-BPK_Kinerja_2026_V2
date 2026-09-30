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

        // Akun PIC hanya menerima temuan yang ditugaskan kepadanya
        // (dilakukan SETELAH propagasi di atas supaya No & Temuan sub-baris tetap terisi)
        if ($this->isPic()) {
            $data = $data->filter(fn ($r) => $this->ownsRow($r['PIC']));
        }

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
    public function store(Request $request)
    {
        // Menambah temuan / sub temuan = tugas admin (Inspektorat)
        if ($this->isPic()) {
            return $this->forbidden('Akun PIC tidak dapat menambah temuan.');
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
    public function update(Request $request, int $id)
    {
        $temuan = Temuan::find($id);
        if (! $temuan) {
            return response()->json(['success' => false, 'message' => 'Data tidak ditemukan.'], 404);
        }

        $fd = $request->all();

        // Akun PIC: hanya boleh mengisi Rencana Aksi, Jadwal, Output
        // dan hanya pada baris yang PIC-nya dia. Kolom lain (A–G) tidak disentuh.
        if ($this->isPic()) {
            if (! $this->ownsRow($temuan->pic)) {
                return $this->forbidden('Temuan ini tidak ditugaskan kepada akun Anda.');
            }

            $allowed = [
                'RencanaAksi'       => 'rencana_aksi',
                'JadwalPelaksanaan' => 'jadwal_pelaksanaan',
                'Output'            => 'output',
            ];
            $changes = [];
            foreach ($allowed as $key => $column) {
                if (array_key_exists($key, $fd)) {
                    $changes[$column] = $fd[$key];
                }
            }
            $temuan->update($changes);

            return response()->json(['success' => true]);
        }

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

    // ── DELETE /api/temuan/{id} ───────────────────────────────────
    public function destroy(int $id)
    {
        if ($this->isPic()) {
            return $this->forbidden('Akun PIC tidak dapat menghapus data.');
        }

        $temuan = Temuan::find($id);
        if (! $temuan) {
            return response()->json(['success' => false, 'message' => 'Data tidak ditemukan.'], 404);
        }

        $temuan->delete();
        return response()->json(['success' => true]);
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

    // ── Hak akses ─────────────────────────────────────────────────
    private function currentUser(): array
    {
        return (array) session('kmdi_user', []);
    }

    /** Role tidak peka huruf besar/kecil ("PIC" / "pic") */
    private function isPic(): bool
    {
        return strtolower((string) ($this->currentUser()['role'] ?? '')) === 'pic';
    }

    private static function norm(?string $s): string
    {
        return strtolower(preg_replace('/[^a-z0-9]/i', '', (string) $s));
    }

    /**
     * Apakah kolom PIC (bisa banyak, dipisah koma) memuat user yang sedang login?
     * Dicocokkan dengan username ATAU nama akun.
     */
    private function ownsRow(?string $picField): bool
    {
        $u = $this->currentUser();
        $mine = array_filter([self::norm($u['username'] ?? ''), self::norm($u['nama'] ?? '')]);
        if (! $mine) {
            return false;
        }

        foreach (preg_split('/\s*[,;\n]\s*/', (string) $picField) as $token) {
            $t = self::norm($token);
            if ($t !== '' && in_array($t, $mine, true)) {
                return true;
            }
        }
        return false;
    }

    private function forbidden(string $message)
    {
        return response()->json(['success' => false, 'message' => $message], 403);
    }
}