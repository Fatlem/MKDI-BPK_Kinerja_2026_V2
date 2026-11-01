<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Concerns\ChecksMkdiAccess;
use App\Models\Temuan;
use App\Models\Pic;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class TemuanController extends Controller
{
    use ChecksMkdiAccess;

    // ── GET /api/temuan ───────────────────────────────────────────
    public function index(Request $request)
    {
        $query = Temuan::with(['bukti:id,temuan_id,status', 'batl', 'parent'])
            ->withCount('bukti');

        // Filter berdasarkan Sumber jika dikirimkan dari frontend / pencarian
        if ($request->filled('sumber')) {
            $sumber = $this->cleanSumber($request->query('sumber'));
            $query->where('sumber', $sumber);
        }

        $rows = $query->orderBy('sort_order')->orderBy('id')->get();

        // Propagasi No & Temuan dari parent ke sub-baris (sama seperti GAS getAllTemuan)
        $lastNo     = '';
        $lastTemuan = '';

        // Tahun sub temuan mengikuti temuan induknya (bukan tanggal sub dibuat),
        // supaya satu temuan tidak terpecah ke beberapa tahun.
        $byId = $rows->keyBy('id');
        $rootOf = function ($r) use ($byId) {
            $guard = 0;
            while ($r->parent_id && isset($byId[$r->parent_id]) && $guard++ < 20) {
                $r = $byId[$r->parent_id];
            }
            return $r;
        };
        $tahunOf = fn ($r) => $rootOf($r)->created_at?->format('Y') ?? '';

        // Jenis audit disimpan di temuan induk; sub temuan mengikuti induknya
        $jenisOf = function ($r) use ($byId) {
            $guard = 0;
            while (! $r->jenis_audit && $r->parent_id && isset($byId[$r->parent_id]) && $guard++ < 20) {
                $r = $byId[$r->parent_id];
            }
            return $r->jenis_audit ?: '';
        };

        $data = $rows->map(function ($r) use (&$lastNo, &$lastTemuan, $rootOf, $tahunOf, $jenisOf) {
            $root  = $rootOf($r);
            $jenis = $r->jenis_audit ?: ($jenisOf($r) ?: Temuan::JENIS_KINERJA);
            $rawNo     = $r->no     ?? '';
            $rawTemuan = $r->temuan ?? '';

            if ($rawNo)     $lastNo     = $rawNo;
            if ($rawTemuan) $lastTemuan = $rawTemuan;

            $isSub = ($r->parent_id !== null);
            $parent = $isSub ? $r->parent : null;

            return [
                '_row'               => $r->id,
                'Id'                 => $r->id,
                'ParentId'           => $r->parent_id,
                'No'                 => $rawNo     ?: $lastNo,
                'KodeTemuan'         => $isSub ? ($parent?->kode_temuan ?: 'T-001') : ($r->kode_temuan ?: 'T-001'),
                'KodeSubTemuan'      => $isSub ? ($r->kode_sub_temuan ?: 'ST-001') : '',
                'Kode'               => $isSub ? ($r->kode_sub_temuan ?: 'ST-001') : ($r->kode_temuan ?: 'T-001'),
                'Temuan'             => $rawTemuan ?: $lastTemuan,
                'SubTemuan'          => $r->sub_temuan          ?? '',
                'Kondisi'            => $r->kondisi             ?? '',
                'Kriteria'           => $r->kriteria            ?? '',
                'Sebab'              => $r->sebab               ?? '',
                'Akibat'             => $r->akibat              ?? '',
                'Rekomendasi'        => $r->rekomendasi         ?? '',
                'PIC'                => $r->pic ?: ($isSub ? ($parent?->pic ?? '') : ''),
                'RencanaAksi'        => $r->rencana_aksi        ?? '',
                'JadwalPelaksanaan'  => $r->jadwal_pelaksanaan  ?? '',
                'Output'             => $r->output              ?? '',
                'isSubRow'           => $isSub,
                'BuktiCount'         => (int) $r->bukti_count,
                'JenisAudit'         => $jenis,
                'JenisAuditLabel'    => Temuan::JENIS_AUDIT_LABEL[$jenis] ?? '',
                'Sumber'             => $r->sumber ?: ($root->sumber ?: Temuan::SUMBER_BPK),
                'SumberLabel'        => Temuan::SUMBER_LABEL[$r->sumber ?: ($root->sumber ?: Temuan::SUMBER_BPK)] ?? '',
                'StatusDokumen'      => $root->status_dokumen ?: Temuan::DOKUMEN_LHP_SEMENTARA,
                'NoLha'              => $root->no_lha ?? '',
                'Tahun'              => $tahunOf($r),
                'TanggalInput'       => $root->created_at?->format('Y-m-d') ?? '',
                'DeadlineDate'       => $root->created_at?->copy()->addDays(60)->format('Y-m-d') ?? '',
                'NilaiTemuan'        => (float) ($r->nilai_temuan ?? 0),
                'NilaiRealisasi'     => (float) ($r->nilai_realisasi ?? 0),
                'Selisih'            => (float) ($r->selisih ?? 0),
                'CreatedBy'          => $r->created_by ?? '',
                'TLStatus'           => $r->tlStatus(),
                'BatlNomor'          => $root->batl?->nomor ?? '',
                'BatlTanggal'        => $root->batl?->tanggal?->format('Y-m-d') ?? '',
                'BatlSignedBoth'     => $root->batl ? $root->batl->isSignedBoth() : false,
            ];
        });

        // Akun PIC hanya menerima temuan yang ditugaskan kepadanya
        if ($this->isPic()) {
            $data = $data->filter(fn ($r) => $this->ownsRow($r['PIC']));
        }

        // Auditor hanya melihat temuan yang dia buat
        if ($this->isAuditor()) {
            $data = $data->filter(fn ($r) => $this->ownsTemuan($r['CreatedBy']));
        }

        return response()->json($data->values());
    }

    // ── GET /api/temuan/next-no?sumber=bpk|inspektorat ────────────
    public function nextNo(Request $request)
    {
        $sumber = $this->cleanSumber($request->query('sumber'));
        return response()->json($this->generateKode($sumber));
    }

    // ── GET /api/temuan/next-kode-temuan?no=LHP-INS-001 ───────────
    public function nextKodeTemuan(Request $request)
    {
        $no = trim((string) $request->query('no'));
        return response()->json($this->generateKodeTemuan($no));
    }

    // ── GET /api/temuan/next-kode-sub?parent_id=12 ────────────────
    public function nextKodeSub(Request $request)
    {
        $parentId = (int) $request->query('parent_id');
        return response()->json($this->generateKodeSub($parentId));
    }

    // ── POST /api/temuan ──────────────────────────────────────────
    public function store(Request $request)
    {
        if (! $this->isStaff()) {
            return $this->forbidden('Hanya auditor yang dapat menambah temuan.');
        }

        $fd       = $request->all();
        $isSub    = filter_var($fd['isSubAdd'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $parentId = $fd['parentRow'] ?? ($fd['parentId'] ?? null);

        $parent = null;
        if ($isSub) {
            $parent = Temuan::find((int) $parentId);
            if (! $parent) {
                return response()->json(['success' => false, 'message' => 'Temuan induk tidak ditemukan.'], 404);
            }
            if (! $this->canManageTemuan($parent)) {
                return $this->forbidden('Temuan induk bukan milik akun Anda.');
            }
        }

        $sumber      = $isSub ? ($parent->sumber ?: Temuan::SUMBER_BPK) : $this->cleanSumber($fd['Sumber'] ?? null);
        $createdBy   = $isSub ? $parent->created_by : $this->username();
        $sortOrder   = $this->resolveSort($isSub ? $parentId : null);
        $nilaiTemuan = $this->cleanNominal($fd['NilaiTemuan'] ?? 0);
        $judulTemuan = trim((string) ($fd['Temuan'] ?? '')) ?: trim((string) ($fd['Kondisi'] ?? ''));

        // Dokumen No (LHP No)
        $docNo = $isSub ? $parent->no : (trim((string) ($fd['No'] ?? '')) ?: $this->generateKode($sumber));

        // Kode Temuan (T-001) / Kode Sub Temuan (ST-001)
        if ($isSub) {
            $kodeSub = trim((string) ($fd['KodeSubTemuan'] ?? ($fd['Kode'] ?? '')));
            if (!$kodeSub) {
                $kodeSub = $this->generateKodeSub((int) $parentId);
            }
            $kodeTemuan = $parent->kode_temuan;
        } else {
            $kodeTemuan = trim((string) ($fd['KodeTemuan'] ?? ($fd['Kode'] ?? '')));
            if (!$kodeTemuan) {
                $kodeTemuan = $this->generateKodeTemuan($docNo);
            }
            $kodeSub = null;
        }

        $jenisAudit = $this->cleanJenis($fd['JenisAudit'] ?? null);
        if (!$jenisAudit && $isSub) {
            $jenisAudit = $parent->jenis_audit ?: Temuan::JENIS_KINERJA;
        }

        $subJudul = $isSub ? (trim((string) ($fd['SubTemuan'] ?? '')) ?: ($judulTemuan ?: null)) : null;
        $picVal = trim((string) ($fd['PIC'] ?? ''));
        if (!$picVal && $isSub && $parent) {
            $picVal = $parent->pic ?? '';
        }

        $temuan = DB::transaction(function () use (
            $isSub, $fd, $docNo, $kodeTemuan, $kodeSub, $sumber, $createdBy, $parentId, $sortOrder, $nilaiTemuan, $judulTemuan, $subJudul, $jenisAudit, $picVal
        ) {
            return Temuan::create([
                'no'                  => $docNo,
                'kode_temuan'         => $kodeTemuan,
                'kode_sub_temuan'     => $kodeSub,
                'sumber'              => $sumber,
                'created_by'          => $createdBy,
                'temuan'              => $isSub ? null : ($judulTemuan ?: null),
                'jenis_audit'         => $jenisAudit ?: Temuan::JENIS_KINERJA,
                'sub_temuan'          => $subJudul,
                'kondisi'             => $fd['Kondisi']           ?? null,
                'kriteria'            => $fd['Kriteria']          ?? null,
                'sebab'               => $fd['Sebab']             ?? null,
                'akibat'              => $fd['Akibat']            ?? null,
                'rekomendasi'         => $fd['Rekomendasi']       ?? null,
                'nilai_temuan'        => $nilaiTemuan,
                'nilai_realisasi'     => 0,
                'selisih'             => $nilaiTemuan,
                'pic'                 => $picVal ?: null,
                'rencana_aksi'        => $fd['RencanaAksi']       ?? null,
                'jadwal_pelaksanaan'  => $fd['JadwalPelaksanaan'] ?? null,
                'output'              => $fd['Output']            ?? null,
                'parent_id'           => $isSub ? $parentId : null,
                'sort_order'          => $sortOrder,
            ]);
        });

        $temuan->syncStatusLha();
        $this->syncPics($picVal);

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

        if (! $this->canManageTemuan($temuan)) {
            return $this->forbidden('Temuan ini bukan milik akun Anda.');
        }

        $temuan->update([
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

        // Kolom baru: hanya diubah bila dikirim (klien lama tidak mengirimnya -> nilai lama dipertahankan)
        $extra = [];
        foreach (['Kondisi' => 'kondisi', 'Akibat' => 'akibat'] as $key => $column) {
            if (array_key_exists($key, $fd)) {
                $extra[$column] = $fd[$key];
            }
        }
        if (array_key_exists('KodeTemuan', $fd)) {
            $extra['kode_temuan'] = trim((string) $fd['KodeTemuan']) ?: null;
        }
        if (array_key_exists('KodeSubTemuan', $fd)) {
            $extra['kode_sub_temuan'] = trim((string) $fd['KodeSubTemuan']) ?: null;
        }
        if (array_key_exists('NilaiTemuan', $fd)) {
            $extra['nilai_temuan'] = $this->cleanNominal($fd['NilaiTemuan']);
        }
        if (array_key_exists('JenisAudit', $fd)) {
            $extra['jenis_audit'] = $this->cleanJenis($fd['JenisAudit']);
        }
        if ($extra) {
            $temuan->update($extra);
        }

        $temuan->syncFinancialRealisasi();
        $this->syncPics($fd['PIC'] ?? '');

        return response()->json(['success' => true]);
    }

    // ── DELETE /api/temuan/{id} ───────────────────────────────────
    // Hanya admin. Menghapus baris utama ikut menghapus seluruh sub temuannya
    // (FK parent_id = set null, kalau tidak dihapus di sini sub temuan jadi yatim).
    public function destroy(int $id)
    {
        if (! $this->isAdmin()) {
            return $this->forbidden('Hanya admin yang dapat menghapus data.');
        }

        $temuan = Temuan::find($id);
        if (! $temuan) {
            return response()->json(['success' => false, 'message' => 'Data tidak ditemukan.'], 404);
        }

        DB::transaction(function () use ($temuan) {
            if ($temuan->parent_id === null) {
                Temuan::where('parent_id', $temuan->id)->get()->each(fn ($sub) => $sub->delete());
            }
            $temuan->delete();
        });

        return response()->json(['success' => true]);
    }

    // ── Helper ────────────────────────────────────────────────────
    private function cleanSumber($v): string
    {
        $v = strtolower(trim((string) $v));
        return array_key_exists($v, Temuan::KODE_PREFIX) ? $v : Temuan::SUMBER_BPK;
    }

    /** Jenis audit valid atau null (belum ditentukan) */
    private function cleanJenis($v): ?string
    {
        $v = strtolower(trim((string) $v));
        return array_key_exists($v, Temuan::JENIS_AUDIT_LABEL) ? $v : null;
    }

    /** Normalisasi string Rupiah ("3.000.000" / "3000000") menjadi float >= 0 */
    private function cleanNominal($v): float
    {
        $s = trim(preg_replace('/[^\d.,-]/', '', (string) $v));
        if ($s === '') {
            return 0.0;
        }
        if (str_contains($s, ',')) {
            $s = str_replace(['.', ','], ['', '.'], $s);
        } elseif (preg_match('/^\d{1,3}(\.\d{3})+$/', $s)) {
            $s = str_replace('.', '', $s);
        }
        return max(0.0, (float) $s);
    }

    private function generateKode(string $sumber): string
    {
        $prefix = Temuan::KODE_PREFIX[$sumber];
        $max = 0;
        foreach (Temuan::whereNotNull('no')->where('no', 'like', $prefix . '%')->pluck('no') as $no) {
            if (preg_match('/(\d+)$/', $no, $m)) {
                $max = max($max, (int) $m[1]);
            }
        }
        return $prefix . str_pad((string) ($max + 1), 3, '0', STR_PAD_LEFT);
    }

    public function generateKodeTemuan(?string $docNo): string
    {
        $max = 0;
        $query = Temuan::whereNull('parent_id');
        if ($docNo) {
            $query->where('no', $docNo);
        }
        foreach ($query->whereNotNull('kode_temuan')->pluck('kode_temuan') as $k) {
            if (preg_match('/(\d+)$/', $k, $m)) {
                $max = max($max, (int) $m[1]);
            }
        }
        return 'T-' . str_pad((string) ($max + 1), 3, '0', STR_PAD_LEFT);
    }

    public function generateKodeSub(int $parentId): string
    {
        $max = 0;
        foreach (Temuan::where('parent_id', $parentId)->whereNotNull('kode_sub_temuan')->pluck('kode_sub_temuan') as $k) {
            if (preg_match('/(\d+)$/', $k, $m)) {
                $max = max($max, (int) $m[1]);
            }
        }
        return 'ST-' . str_pad((string) ($max + 1), 3, '0', STR_PAD_LEFT);
    }

    private function resolveSort(?int $parentId): int
    {
        if (! $parentId) {
            return (Temuan::max('sort_order') ?? 0) + 10;
        }

        $parent     = Temuan::find($parentId);
        $baseOrder  = $parent?->sort_order ?? 0;

        Temuan::where('sort_order', '>', $baseOrder)->increment('sort_order', 10);

        return $baseOrder + 5;
    }

    private function syncPics(?string $picField): void
    {
        $key = fn ($s) => mb_strtolower(preg_replace('/[^\p{L}\p{N}]/u', '', (string) $s));

        $known = [];
        foreach (Pic::pluck('nama') as $n) {
            $known[$key($n)] = true;
        }
        foreach (User::get(['username', 'nama']) as $u) {
            $known[$key($u->username)] = true;
            $known[$key($u->nama)]     = true;
        }

        foreach (preg_split('/\s*[,;\n]\s*/', (string) $picField) as $token) {
            $name = trim(preg_replace('/\s+/', ' ', $token));
            $k    = $key($name);
            if ($k === '' || mb_strlen($name) > 255 || isset($known[$k])) {
                continue;
            }
            Pic::create(['nama' => $name]);
            $known[$k] = true;
        }
    }
}