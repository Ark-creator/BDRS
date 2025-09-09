<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class UserProfileFactory extends Factory
{
    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'middle_name' => fake()->lastName(),
            'last_name' => fake()->lastName(),
            'suffix' => fake()->randomElement(['Jr.', 'Sr.', 'III', null]),
            'phone_number' => fake()->unique()->phoneNumber(),
            // 'address' => fake()->address(), // REMOVED: This was causing the error.

            // ADDED: New structured address fields
            'province' => 'Nueva Ecija',
            'city' => 'City of Gapan',
            'barangay' => 'San Lorenzo', // Default value
            'street_address' => fake()->streetAddress(),

            'birthday' => fake()->date(),
            'gender' => fake()->randomElement(['Male', 'Female']),
            'civil_status' => fake()->randomElement(['Single', 'Married', 'Widowed']),
        ];
    }
}
