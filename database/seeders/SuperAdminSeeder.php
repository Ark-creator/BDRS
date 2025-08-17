<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // List of Super Admin users
        $superAdmins = [
            [
                'email' => 'romark7bayan@gmail.com',
                'password' => 'R12345678!',
            ],
            [
                'email' => 'acepadillaace@gmail.com',
                'password' => 'Ace#12345',
            ],
            [
                'email' => 'jmjonatas4@gmail.com',
                'password' => '12345678',
            ],
        ];

        foreach ($superAdmins as $admin) {
            // Create or get the user
            $user = User::firstOrCreate(
                ['email' => $admin['email']],
                [
                    'password' => Hash::make($admin['password']),
                    'role' => 'super_admin',
                    'status' => 'active',
                ]
            );

            // Create a corresponding user profile if it doesn't exist
            if (!$user->profile) {
                UserProfile::factory()->create([
                    'user_id' => $user->id,
                ]);
            }
        }
    }
}
