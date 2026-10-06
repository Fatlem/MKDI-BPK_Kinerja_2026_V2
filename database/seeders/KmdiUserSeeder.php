<?php

namespace Database\Seeders;

use App\Models\KmdiUser;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class KmdiUserSeeder extends Seeder
{
    public function run(): void
    {
        $password = 'pangan2026';

        $users = [
            ['admin',     'Administrator',                                               'admin'],
            ['Biro MKDI', 'Biro Manajemen Kinerja Data dan Informasi',                   'pic'],
            ['Biro HKS',  'Biro Hukum dan Kerjasama',                                    'pic'],
            ['Biro SDMO', 'Biro Sumber Daya Manusia dan Organisasi',                     'pic'],
            ['Biro UHM',  'Biro Umum dan Hubungan Masyarakat',                           'pic'],
            ['Biro KBMN', 'Biro Keuangan dan BMN',                                       'pic'],
            ['Deputi 1',  'Deputi Bidang Koordinasi Tata Niaga dan Distribusi Pangan',   'pic'],
            ['Deputi 2',  'Deputi Bidang Koordinasi Usaha Pangan dan Pertanian',         'pic'],
            ['Deputi 3',  'Deputi Bidang Koordinasi Keterjangkauan dan Keamanan Pangan', 'pic'],
            ['Deputi 4',  'Deputi Bidang Koordinasi Sumber Daya Maritim',                'pic'],
        ];

        foreach ($users as [$username, $nama, $role]) {
            KmdiUser::query()->updateOrCreate(
                ['username' => $username],
                ['nama' => $nama, 'password' => Hash::make($password), 'role' => $role]
            );
        }
    }
}