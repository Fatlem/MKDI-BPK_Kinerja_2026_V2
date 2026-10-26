<?php

namespace App\Http\Controllers\Concerns;

/**
 * Hak akses KMDI yang dipakai bersama oleh TemuanController dan BuktiController.
 * Sebelumnya logika ini hanya ada di TemuanController (private); dipindah ke sini
 * supaya tidak ditulis dua kali dan tidak bisa berbeda perilaku antar controller.
 */
trait ChecksKmdiAccess
{
    protected function currentUser(): array
    {
        return (array) session('kmdi_user', []);
    }

    /** Role tidak peka huruf besar/kecil ("PIC" / "pic") */
    protected function isPic(): bool
    {
        return strtolower((string) ($this->currentUser()['role'] ?? '')) === 'pic';
    }

    protected function isAdmin(): bool
    {
        return strtolower((string) ($this->currentUser()['role'] ?? '')) === 'admin';
    }

    /** Auditor Inspektorat: hanya mengelola temuan miliknya sendiri */
    protected function isAuditor(): bool
    {
        return strtolower((string) ($this->currentUser()['role'] ?? '')) === 'auditor';
    }

    /** Admin atau auditor (sisi Inspektorat, lawan dari PIC/biro) */
    protected function isStaff(): bool
    {
        return $this->isAdmin() || $this->isAuditor();
    }

    protected function username(): string
    {
        return (string) ($this->currentUser()['username'] ?? '');
    }

    /** Apakah temuan ini milik auditor yang sedang login? (pembanding peka-longgar huruf/spasi) */
    protected function ownsTemuan(?string $createdBy): bool
    {
        $me = self::norm($this->username());
        return $me !== '' && self::norm($createdBy) === $me;
    }

    /**
     * Hak mengelola dari sisi Inspektorat: admin boleh semua,
     * auditor hanya temuan yang dia buat. PIC tidak pernah.
     */
    protected function canManageTemuan(?\App\Models\Temuan $t): bool
    {
        if (! $t) {
            return false;
        }
        if ($this->isAdmin()) {
            return true;
        }
        return $this->isAuditor() && $this->ownsTemuan($t->created_by);
    }

    protected static function norm(?string $s): string
    {
        return strtolower(preg_replace('/[^a-z0-9]/i', '', (string) $s));
    }

    /**
     * Apakah kolom PIC (bisa banyak, dipisah koma) memuat user yang sedang login?
     * Dicocokkan dengan username ATAU nama akun.
     */
    protected function ownsRow(?string $picField): bool
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

    protected function forbidden(string $message)
    {
        return response()->json(['success' => false, 'message' => $message], 403);
    }
}
