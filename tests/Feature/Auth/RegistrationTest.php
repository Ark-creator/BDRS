<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
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
        Http::fakeSequence()
            ->push([
                'confidence' => 92,
                'issues' => [],
                'fields' => [
                    'full_name' => 'TEST USER',
                    'id_number' => '1234-5678-9012-3456',
                    'birthdate' => '2000-01-01',
                ],
                'document_validation' => [
                    'status' => 'passed',
                    'is_identity_document' => true,
                    'is_supported_document' => true,
                    'detected_document_type' => 'national_id',
                    'expected_document_type' => 'national_id',
                    'matches_expected_type' => true,
                ],
            ])
            ->push([
                'confidence' => 82,
                'issues' => [],
                'fields' => [],
                'document_validation' => [
                    'status' => 'passed',
                    'is_identity_document' => true,
                    'is_supported_document' => true,
                    'detected_document_type' => 'national_id',
                    'expected_document_type' => 'national_id',
                    'matches_expected_type' => true,
                ],
            ])
            ->push([
                'status' => 'passed',
                'passed' => true,
                'score' => 91,
                'face_count' => 1,
                'issues' => [],
            ]);

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

    public function test_id_image_precheck_returns_invalid_for_non_id_photo(): void
    {
        Http::fake([
            '*' => Http::response([
                'confidence' => 22.5,
                'issues' => ['id_not_identity_document'],
                'document_validation' => [
                    'status' => 'failed',
                    'is_identity_document' => false,
                    'is_supported_document' => false,
                    'matches_expected_type' => false,
                ],
            ]),
        ]);

        $this->postJson('/validate-id-image', [
            'valid_id_type' => "Driver's License",
            'valid_id_front_image' => UploadedFile::fake()->image('front.jpg', 900, 600),
        ])->assertOk()
            ->assertJsonPath('status', 'invalid')
            ->assertJsonPath('is_valid', false)
            ->assertJsonPath('message', 'This image does not look like a valid ID. Please retake the photo.');
    }

    public function test_id_image_precheck_allows_continuing_when_ocr_is_unavailable(): void
    {
        Http::fake([
            '*' => Http::response([
                'confidence' => 30,
                'issues' => ['id_ocr_engine_unavailable'],
                'document_validation' => [
                    'status' => 'not_checked',
                    'is_identity_document' => null,
                    'is_supported_document' => null,
                    'matches_expected_type' => null,
                ],
            ]),
        ]);

        $this->postJson('/validate-id-image', [
            'valid_id_type' => 'Passport',
            'valid_id_front_image' => UploadedFile::fake()->image('front.jpg', 900, 600),
        ])->assertOk()
            ->assertJsonPath('status', 'unchecked')
            ->assertJsonPath('is_valid', null);
    }

    public function test_id_image_precheck_rejects_selected_type_mismatch(): void
    {
        Http::fake([
            '*' => Http::response([
                'confidence' => 91,
                'issues' => ['id_document_type_mismatch'],
                'fields' => [
                    'full_name' => 'JUAN DELA CRUZ',
                    'id_number' => 'N03-12-123456',
                    'birthdate' => '1987-10-04',
                ],
                'document_validation' => [
                    'status' => 'failed',
                    'is_identity_document' => true,
                    'is_supported_document' => true,
                    'detected_document_type' => 'driver_license',
                    'expected_document_type' => 'umid',
                    'matches_expected_type' => false,
                ],
            ]),
        ]);

        $this->postJson('/validate-id-image', [
            'image_role' => 'front_id',
            'valid_id_type' => 'UMID Card',
            'valid_id_front_image' => UploadedFile::fake()->image('front.jpg', 900, 600),
        ])->assertOk()
            ->assertJsonPath('status', 'invalid')
            ->assertJsonPath('is_valid', false)
            ->assertJsonPath('document_type', 'umid')
            ->assertJsonPath('message', 'Uploaded ID does not match selected ID type.');
    }

    public function test_back_id_precheck_rejects_non_id_photo(): void
    {
        Http::fake([
            '*' => Http::response([
                'confidence' => 20,
                'issues' => ['id_no_readable_text'],
                'document_validation' => [
                    'status' => 'failed',
                    'is_identity_document' => false,
                    'is_supported_document' => false,
                    'matches_expected_type' => false,
                ],
            ]),
        ]);

        $this->postJson('/validate-id-image', [
            'image_role' => 'back_id',
            'valid_id_type' => "Driver's License",
            'valid_id_back_image' => UploadedFile::fake()->image('back.jpg', 900, 600),
        ])->assertOk()
            ->assertJsonPath('status', 'invalid')
            ->assertJsonPath('is_valid', false)
            ->assertJsonPath('message', 'The back of ID text is not readable. Please retake a clearer photo.');
    }

    public function test_selfie_precheck_rejects_image_without_face(): void
    {
        Http::fake([
            '*' => Http::response([
                'status' => 'failed',
                'passed' => false,
                'score' => 34,
                'face_count' => 0,
                'issues' => ['selfie_no_face_detected'],
            ]),
        ]);

        $this->postJson('/validate-id-image', [
            'image_role' => 'selfie',
            'face_image' => UploadedFile::fake()->image('selfie.jpg', 600, 600),
        ])->assertOk()
            ->assertJsonPath('status', 'invalid')
            ->assertJsonPath('is_valid', false)
            ->assertJsonPath('message', 'No face was detected in the selfie. Please retake a clear face photo.');
    }

}
