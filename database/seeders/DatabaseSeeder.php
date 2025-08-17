<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // This tells Laravel to run your other seeder files.
        $this->call([
            SuperAdminSeeder::class,
            DocumentTypeSeeder::class,
            ResidentSeeder::class, // <-- IDAGDAG ITO
        ]);
    }
}