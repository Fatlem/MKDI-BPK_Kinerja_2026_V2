<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Seeder bawaan Laravel (bisa dihapus kalau tidak perlu)
        // User::factory()->create([
        //     'name' => 'Test User',
        //     'email' => 'test@example.com',
        // ]);

        // Seeder MKDI
        $this->call([
            BpkUserSeeder::class,
            PicSeeder::class,
            BpkTemuanSeeder::class,   // data asli temuan BPK (dari Excel)
        ]);
    }
}