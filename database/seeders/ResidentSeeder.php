<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserProfile;
use App\Models\DocumentRequest;
use App\Models\DocumentType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ResidentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Kinukuha natin ang lahat ng IDs mula sa document_types table.
        // Mahalaga na nauna nang tumakbo ang DocumentTypeSeeder.
        $documentTypeIds = DocumentType::pluck('id');

        // Check kung may document types na, kung wala, hihinto tayo.
        if ($documentTypeIds->isEmpty()) {
            $this->command->warn('Walang nahanap na Document Types. Pakitakbo muna ang DocumentTypeSeeder.');
            return;
        }

        // Gagawa tayo ng 2500 na sample resident users para umabot sa 2000+ records.
        User::factory(100)->create()->each(function ($user) use ($documentTypeIds) {
            
            // Para sa bawat user na ginawa, gagawan natin sila ng profile.
            UserProfile::factory()->create([
                'user_id' => $user->id,
            ]);

            // Bawat user ay magre-request ng random na bilang
            // ng dokumento (mula 1 hanggang 3).
            $requestsCount = rand(1, 3);

            for ($i = 0; $i < $requestsCount; $i++) {
                DocumentRequest::factory()->create([
                    'user_id' => $user->id,
                    // Random na pipili ng document type id.
                    'document_type_id' => $documentTypeIds->random(),
                ]);
            }
        });
    }
}
