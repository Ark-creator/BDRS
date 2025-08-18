<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DocumentTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('document_types')->insert([
            [
                'name' => 'Solo Parent',
                'description' => 'A certificate for the AKAP program.',
                'template_path' => 'templates/akap.blade.php',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Barangay Clearance',
                'description' => 'A clearance from the barangay office.',
                'template_path' => 'templates/brgy_clearance.blade.php',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'pwd',
                'description' => 'A certificate for a Person with Disability.',
                'template_path' => 'templates/pwd_certificate.blade.php',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'GP Indigency',
                'description' => 'A certificate of indigency for General Purposes.',
                'template_path' => 'templates/gp_indigency.blade.php',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Residency',
                'description' => 'A certificate proving barangay residency.',
                'template_path' => 'templates/cert_residency.blade.php',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Certificate of Indigency',
                'description' => 'A certificate of indigency.',
                'template_path' => 'templates/cert_indigency.blade.php',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}