<?php

namespace Tests\Feature\IdentityVerification;

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
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class IdentityVerificationFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        config(['identity_verification.storage.disk' => 'local']);
    }

    public function test_full_verification_pipeline_with_mocked_ai_service(): void
    {
        Http::fake([
            '*/ocr/extract' => Http::response([
                'status' => 'completed',
                'confidence' => 92.5,
                'fields' => [
                    'full_name' => 'Juan Dela Cruz',
                    'birthdate' => '1990-01-15',
                    'id_number' => 'A01-23-456789',
                ],
                'document_validation' => [
                    'status' => 'passed',
                    'is_identity_document' => true,
                    'is_supported_document' => true,
                    'detected_document_type' => 'driver_license',
                    'matches_expected_type' => true,
                    'score' => 85,
                    'issues' => [],
                ],
                'issues' => [],
            ]),
            '*/face/compare' => Http::response([
                'status' => 'completed',
                'similarity' => 94.2,
                'matched' => true,
            ]),
            '*/liveness/check' => Http::response([
                'status' => 'completed',
                'score' => 88.0,
                'passed' => true,
            ]),
            '*/fraud/analyze' => Http::response([
                'status' => 'completed',
                'fake_probability' => 3.5,
                'is_fake' => false,
            ]),
        ]);

        Bus::fake();

        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/verification/upload-id', [
            'document_type' => 'driver_license',
            'id_image' => UploadedFile::fake()->image('id.jpg', 900, 600),
        ]);
        $response->assertCreated();
        $uuid = $response->json('verification_id');

        $this->postJson('/api/verification/upload-selfie', [
            'verification_id' => $uuid,
            'selfie_image' => UploadedFile::fake()->image('selfie.jpg', 800, 800),
        ])->assertOk();

        $this->postJson('/api/verification/process', [
            'verification_id' => $uuid,
        ])->assertAccepted();

        Bus::assertChained([
            OCRProcessingJob::class,
            FaceVerificationJob::class,
            LivenessDetectionJob::class,
            FraudAnalysisJob::class,
            FinalizeIdentityVerificationJob::class,
        ]);

        $this->getJson("/api/verification/status/{$uuid}")
            ->assertOk()
            ->assertJsonPath('status', Verification::STATUS_QUEUED);
    }

    public function test_status_transitions_through_pipeline(): void
    {
        $user = User::factory()->create();
        $verification = Verification::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $user->id,
            'document_type' => 'passport',
            'status' => Verification::STATUS_DRAFT,
        ]);

        $this->assertSame(Verification::STATUS_DRAFT, $verification->fresh()->status);

        $verification->update(['status' => Verification::STATUS_QUEUED]);
        $this->assertSame(Verification::STATUS_QUEUED, $verification->fresh()->status);

        $verification->update(['status' => Verification::STATUS_PROCESSING]);
        $this->assertSame(Verification::STATUS_PROCESSING, $verification->fresh()->status);

        $verification->update([
            'status' => Verification::STATUS_APPROVED,
            'overall_score' => 92.5,
            'processed_at' => now(),
        ]);
        $this->assertSame(Verification::STATUS_APPROVED, $verification->fresh()->status);
    }

    public function test_pipeline_handles_ai_service_timeout(): void
    {
        Bus::fake();

        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/verification/upload-id', [
            'document_type' => 'passport',
            'id_image' => UploadedFile::fake()->image('passport.jpg', 900, 600),
        ]);
        $response->assertCreated();
        $uuid = $response->json('verification_id');

        $this->postJson('/api/verification/upload-selfie', [
            'verification_id' => $uuid,
            'selfie_image' => UploadedFile::fake()->image('selfie.jpg', 800, 800),
        ])->assertOk();

        $this->postJson('/api/verification/process', [
            'verification_id' => $uuid,
        ])->assertAccepted();

        $verification = Verification::where('uuid', $uuid)->first();
        $this->assertNotNull($verification);
        $this->assertSame(Verification::STATUS_QUEUED, $verification->status);
    }

    public function test_result_endpoint_returns_scores(): void
    {
        Http::fake();

        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $verification = Verification::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $user->id,
            'document_type' => 'national_id',
            'status' => Verification::STATUS_APPROVED,
            'face_match_score' => 95,
            'ocr_confidence' => 90,
            'liveness_score' => 88,
            'fake_probability' => 5,
            'overall_score' => 92.25,
            'processed_at' => now(),
        ]);

        $this->getJson("/api/verification/result/{$verification->uuid}")
            ->assertOk()
            ->assertJsonPath('status', Verification::STATUS_APPROVED)
            ->assertJsonPath('id', $verification->uuid)
            ->assertJsonStructure([
                'scores' => ['face_match', 'ocr_confidence', 'fake_probability', 'liveness_score', 'overall_score'],
            ]);
    }

    public function test_invalid_image_upload_returns_validation_error(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/verification/upload-id', [
            'document_type' => 'passport',
            'id_image' => UploadedFile::fake()->create('doc.txt', 100),
        ])->assertStatus(422);
    }
}
