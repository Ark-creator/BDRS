<?php

namespace Database\Seeders;

use App\Models\Barangay;
use Illuminate\Database\Seeder;

class BarangaySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Define the list of barangays with their name and municipality_id.
        $barangays = [
            ['name' => 'San Lorenzo', 'municipality_id' => 1],
            ['name' => 'Rizaliana', 'municipality_id' => 1],
            ['name' => 'Mabini Homesite', 'municipality_id' => 1],
            ['name' => 'San Josef Norte', 'municipality_id' => 1],
        ];

        // Loop through the array and create each barangay record.
        foreach ($barangays as $barangay) {
            Barangay::create($barangay);
        }
    }
}
