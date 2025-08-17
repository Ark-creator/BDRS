<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class DocumentRequestFactory extends Factory
{
    public function definition(): array
    {
        return [
            // Ang user_id at document_type_id ay ipapasa mula sa Seeder
            'form_data' => json_encode([
                'purpose' => fake()->randomElement([
                    'Job Application', 
                    'School Requirement', 
                    'Business Permit', 
                    'Personal Use',
                    'Loan Application'
                ])
            ]),
            'status' => fake()->randomElement(['Pending', 'Processing', 'Ready To Pickup', 'Claimed', 'Rejected']),
            'admin_remarks' => null,
            'processed_by' => null, // Pwedeng i-set sa ID ng admin kung kailangan
        ];
    }
}