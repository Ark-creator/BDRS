<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Municipality;

class MunicipalitySeeder extends Seeder
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
        $targetMunicipality = 'City of Gapan';

        if (!isset($locations[$targetProvince][$targetMunicipality])) {
            $this->command->error("The location '{$targetMunicipality}, {$targetProvince}' was not found in the JSON file.");
            return;
        }

        // Clear the table to prevent duplicates on re-seeding
        Municipality::query()->delete();
        $this->command->info("Seeding municipality: {$targetMunicipality}...");

        // --- MODIFIED: Insert only the specified municipality with its province ---
        Municipality::create([
            'name' => $targetMunicipality,
            'province' => $targetProvince,
        ]);

        $this->command->info("'{$targetMunicipality}' has been seeded successfully!");
    }
}

