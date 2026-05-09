<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register(): void
    {
        $privateDisk = config('filesystems.private_uploads_disk', 's3-private');
        Storage::fake($privateDisk);

        $response = $this->post('/register', [
            'first_name' => 'Test',
            'last_name' => 'User',
            'middle_name' => null,
            'suffix' => null,
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'province' => 'Nueva Ecija',
            'city' => 'City of Gapan',
            'street_address' => '123 Test Street',
            'phone_number' => '09123456789',
            'birthday' => '2000-01-01',
            'gender' => 'Male',
            'place_of_birth' => 'Gapan City',
            'civil_status' => 'Single',
            'valid_id_type' => 'National ID',
            'valid_id_front_image' => UploadedFile::fake()->image('front.jpg'),
            'valid_id_back_image' => UploadedFile::fake()->image('back.jpg'),
            'face_image' => UploadedFile::fake()->image('face.jpg'),
            'terms' => '1',
        ]);

        $user = User::where('email', 'test@example.com')->firstOrFail();

        $this->assertAuthenticatedAs($user);
        $this->assertTrue($user->hasVerifiedEmail());
        $response->assertRedirect(route('residents.home', absolute: false));
        $this->get(route('residents.home'))->assertOk();
        $this->assertDatabaseHas('users', ['email' => 'test@example.com']);
        $this->assertDatabaseHas('user_profiles', [
            'first_name' => 'Test',
            'last_name' => 'User',
            'barangay' => '',
        ]);

        $profile = $user->profile()->firstOrFail();

        $this->assertNull($user->barangay_id);
        $this->assertStringStartsWith('id_images/', $profile->valid_id_front_path);
        $this->assertStringStartsWith('id_images/', $profile->valid_id_back_path);
        $this->assertStringStartsWith('face_images/', $profile->face_image_path);

        Storage::disk($privateDisk)->assertExists($profile->valid_id_front_path);
        Storage::disk($privateDisk)->assertExists($profile->valid_id_back_path);
        Storage::disk($privateDisk)->assertExists($profile->face_image_path);
    }

}
