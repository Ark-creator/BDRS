<?php

namespace Database\Seeders;

use App\Models\User; // <-- Import the User model
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash; // <-- Import the Hash facade

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create the Super Admin User
        User::firstOrCreate(
            ['email' => 'romark7bayan@gmail.com'], // Find user by email
            [
                'password' => Hash::make('R12345678!'),
                'role' => 'super_admin',
                'status' => 'active',
            ]
        );
    }
}