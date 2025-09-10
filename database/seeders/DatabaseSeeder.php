<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            // 1. Create Municipalities first, so they have an ID.
            MunicipalitySeeder::class,

            // 2. Then Barangays can be linked to them.
            BarangaySeeder::class,

            // ... other seeders
            SuperAdminSeeder::class,
            DocumentTypeSeeder::class,
            ResidentSeeder::class,
        ]);
    }
}