<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Municipality;
use App\Models\Barangay;

class BarangaySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Path to your JSON file in the public directory
        $jsonPath = public_path('ph_locations.json');
        if (!file_exists($jsonPath)) {
            $this->command->error("The file ph_locations.json was not found in the public directory.");
            return;
        }

        $locations = json_decode(file_get_contents($jsonPath), true);
        
        // --- MODIFIED: Define specific targets ---
        $targetProvince = 'Nueva Ecija';
        $targetMunicipality = 'General Tinio';

        // --- MODIFIED: Find the specific municipality from the database ---
        $municipality = Municipality::where('name', $targetMunicipality)->first();

        if (!$municipality) {
            $this->command->error("Municipality '{$targetMunicipality}' not found in the database. Please run the MunicipalitySeeder first.");
            return;
        }

        // Find the list of barangays for the target municipality from the JSON file
        $barangays = $locations[$targetProvince][$targetMunicipality] ?? [];

        if (empty($barangays)) {
            $this->command->error("No barangays found for {$targetMunicipality} in the JSON file.");
            return;
        }
        
        // Clear the table to prevent duplicates on re-seeding
        Barangay::query()->delete();
        $this->command->info("Seeding barangays for {$targetMunicipality}...");

        $barangaysToInsert = [];
        foreach ($barangays as $barangayName) {
            $barangaysToInsert[] = [
                'name' => $barangayName,
                'municipality_id' => $municipality->id, // Assign the correct foreign key
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // Insert all barangays in a single, efficient query
        Barangay::insert($barangaysToInsert);

        $this->command->info(count($barangaysToInsert) . ' barangays for ' . $targetMunicipality . ' have been seeded successfully!');
    }
}

