<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Barangay;
use App\Models\UserProfile;
use App\Models\DocumentRequest;
use App\Models\DocumentType;
use Illuminate\Database\Seeder;

class ResidentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all the barangays
        $barangays = Barangay::all();

        // Loop through each barangay to create residents for it
        foreach ($barangays as $barangay) {

            // Get the document types that ONLY belong to the current barangay
            $documentTypeIds = DocumentType::where('barangay_id', $barangay->id)->pluck('id');

            if ($documentTypeIds->isEmpty()) {
                $this->command->warn("No document types found for Barangay '{$barangay->name}'. Skipping resident creation for this barangay.");
                continue; // Move to the next barangay
            }

            // Create 50 residents for the current barangay
            User::factory(50)
                ->state(['barangay_id' => $barangay->id]) // Assign the user to the current barangay
                ->create()
                ->each(function ($user) use ($documentTypeIds) {
                    
                    // Create a profile for each user
                    UserProfile::factory()->create([
                        'user_id' => $user->id,
                    ]);

                    // Each user will request 1 to 3 documents
                    $requestsCount = rand(1, 3);

                    for ($i = 0; $i < $requestsCount; $i++) {
                        DocumentRequest::factory()->create([
                            'user_id' => $user->id,
                            'barangay_id' => $user->barangay_id, // Also add barangay_id here
                            // Randomly pick a document type ID from the ones available for this user's barangay
                            'document_type_id' => $documentTypeIds->random(),
                        ]);
                    }
                });
        }
    }
}