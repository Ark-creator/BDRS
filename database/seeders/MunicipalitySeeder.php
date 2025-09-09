<?php

namespace Database\Seeders;

use App\Models\Municipality;
use Illuminate\Database\Seeder;

class MunicipalitySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // We can create multiple municipalities within the same province.
        // The first record will have ID = 1, the second will have ID = 2, and so on.
        Municipality::create([
            'name' => 'Gapan City',
            'province' => 'Nueva Ecija'
        ]);

    
    }
}
