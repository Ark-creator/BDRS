<?php

namespace Tests\Feature;

use App\Jobs\IdentityVerification\FaceVerificationJob;
use App\Jobs\IdentityVerification\FinalizeIdentityVerificationJob;
use App\Jobs\IdentityVerification\FraudAnalysisJob;
use App\Jobs\IdentityVerification\LivenessDetectionJob;
use App\Jobs\IdentityVerification\OCRProcessingJob;
use App\Models\User;
use App\Models\Verification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class IdentityVerificationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_upload_images_and_queue_identity_verification(): void
    {
        config(['identity_verification.storage.disk' => 'local']);
        Storage::fake('local');
        Bus::fake();

        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $uploadId = $this->postJson('/api/verification/upload-id', [
            'document_type' => 'passport',
            'id_image' => UploadedFile::fake()->image('passport.jpg', 900, 600),
        ])->assertCreated()
            ->assertJsonPath('status', Verification::STATUS_DRAFT);

        $verification = Verification::where('uuid', $uploadId->json('verification_id'))->firstOrFail();
        Storage::disk('local')->assertExists($verification->id_image_path);

        $this->postJson('/api/verification/upload-selfie', [
            'verification_id' => $verification->uuid,
            'selfie_image' => UploadedFile::fake()->image('selfie.jpg', 800, 800),
        ])->assertOk()
            ->assertJsonPath('selfie_image_uploaded', true);

        $this->postJson('/api/verification/process', [
            'verification_id' => $verification->uuid,
        ])->assertAccepted()
            ->assertJsonPath('status', Verification::STATUS_QUEUED);

        Bus::assertChained([
            OCRProcessingJob::class,
            FaceVerificationJob::class,
            LivenessDetectionJob::class,
            FraudAnalysisJob::class,
            FinalizeIdentityVerificationJob::class,
        ]);

        $this->getJson("/api/verification/status/{$verification->uuid}")
            ->assertOk()
            ->assertJsonPath('status', Verification::STATUS_QUEUED);
    }

    public function test_user_cannot_view_another_users_verification(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $verification = Verification::create([
            'user_id' => $owner->id,
            'document_type' => 'national_id',
            'status' => Verification::STATUS_DRAFT,
        ]);

        Sanctum::actingAs($other);

        $this->getJson("/api/verification/status/{$verification->uuid}")
            ->assertForbidden();
    }
}
