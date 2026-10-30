<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ChecksMkdiAccess;
use App\Models\Temuan;
use Illuminate\Support\Str;

/**
 * Notifikasi di header (lonceng), diturunkan dari data yang sudah ada, tanpa tabel baru.
 *
 * Sesuai alur "Biro" pada diagram:
 *   Satker/PIC  : menerima notifikasi temuan baru, hasil verifikasi bukti (acc / pending / tolak), BATL terbit
 *   Auditor/Admin: bukti baru dari Satker yang menunggu verifikasi
 *
 * Status "sudah dibaca" disimpan di browser (waktu terakhir lonceng dibuka).
 */
class NotifikasiController extends Controller
{
    use ChecksMkdiAccess;

    private const MAKS = 40;

    // ── GET /api/notifikasi ───────────────────────────────────────
    public function index()
    {
        $rows = Temuan::with(['bukti', 'batl'])->orderBy('id')->get();
        $byId = $rows->keyBy('id');

        $noOf = function (Temuan $t) use ($byId): string {
            $guard = 0;
            while (! $t->no && $t->parent_id && isset($byId[$t->parent_id]) && $guard++ < 20) {
                $t = $byId[$t->parent_id];
            }
            return (string) ($t->no ?: ('#' . $t->id));
        };
        $judulOf = function (Temuan $t) use ($byId): string {
            $guard = 0;
            while (! $t->temuan && $t->parent_id && isset($byId[$t->parent_id]) && $guard++ < 20) {
                $t = $byId[$t->parent_id];
            }
            return Str::limit(trim(preg_replace('/\s+/', ' ', (string) $t->temuan)), 90);
        };

        $events = [];
        $add = function (string $id, string $tipe, string $judul, string $pesan, $waktu, int $row) use (&$events) {
            if (! $waktu) {
                return;
            }
            $events[] = [
                'id'    => $id,
                'tipe'  => $tipe,
                'judul' => $judul,
                'pesan' => $pesan,
                'waktu' => $waktu->toIso8601String(),
                'row'   => $row,
            ];
        };

        if ($this->isPic()) {
            foreach ($rows->filter(fn (Temuan $t) => $this->ownsRow($t->pic)) as $t) {
                $ref = $noOf($t) . ' - ' . $judulOf($t);

                $add('t' . $t->id, 'temuan_baru', 'Temuan baru ditugaskan', $ref, $t->created_at, $t->id);

                foreach ($t->bukti as $b) {
                    if ($b->status === 'terverifikasi') {
                        $add('b' . $b->id, 'acc', 'Bukti disetujui auditor', $ref, $b->diverifikasi_pada, $t->id);
                    } elseif ($b->status === 'pending') {
                        $add('b' . $b->id, 'pending', 'Bukti ditahan auditor', $ref . ($b->catatan_verifikasi ? ' | ' . Str::limit($b->catatan_verifikasi, 80) : ''), $b->diverifikasi_pada, $t->id);
                    } elseif ($b->status === 'ditolak') {
                        $add('b' . $b->id, 'ditolak', 'Bukti ditolak, perlu perbaikan', $ref . ($b->catatan_verifikasi ? ' | ' . Str::limit($b->catatan_verifikasi, 80) : ''), $b->diverifikasi_pada, $t->id);
                    }
                }
                if ($t->batl) {
                    $add('l' . $t->batl->id, 'batl', 'BATL terbit, tindak lanjut selesai', $ref . ' | ' . $t->batl->nomor, $t->batl->created_at, $t->id);
                }
            }
        } else {
            foreach ($rows->filter(fn (Temuan $t) => $this->canManageTemuan($t)) as $t) {
                $ref = $noOf($t) . ' - ' . $judulOf($t);
                foreach ($t->bukti as $b) {
                    if ($b->status === 'menunggu') {
                        $add('b' . $b->id, 'bukti_baru', 'Bukti baru menunggu verifikasi',
                            $ref . ' | dari ' . ($b->diunggah_oleh ?: 'Satker'), $b->created_at, $t->id);
                    }
                }
            }
        }

        usort($events, fn ($a, $b) => strcmp($b['waktu'], $a['waktu']));

        return response()->json([
            'success' => true,
            'data'    => array_slice($events, 0, self::MAKS),
        ]);
    }
}
