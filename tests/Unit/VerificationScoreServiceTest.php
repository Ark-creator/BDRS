<?php

namespace Tests\Unit;

use App\Models\User;
use App\Models\Verification;
use App\Services\IdentityVerification\VerificationScoreService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VerificationScoreServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_high_confidence_verification_is_approved(): void
    {
        $verification = Verification::create([
            'user_id' => User::factory()->create()->id,
            'document_type' => 'passport',
            'status' => Verification::STATUS_PROCESSING,
            'face_match_score' => 96,
            'ocr_confidence' => 92,
            'liveness_score' => 95,
            'fake_probability' => 5,
        ]);

        $result = app(VerificationScoreService::class)->finalize($verification);

        $this->assertSame(Verification::STATUS_APPROVED, $result->status);
        $this->assertGreaterThanOrEqual(90, (float) $result->overall_score);
    }

    public function test_expired_document_is_rejected(): void
    {
        $verification = Verification::create([
            'user_id' => User::factory()->create()->id,
            'document_type' => 'driver_license',
            'status' => Verification::STATUS_PROCESSING,
            'face_match_score' => 98,
            'ocr_confidence' => 95,
            'liveness_score' => 96,
            'fake_probability' => 2,
            'id_expires_at' => now()->subDay(),
        ]);

        $result = app(VerificationScoreService::class)->finalize($verification);

        $this->assertSame(Verification::STATUS_REJECTED, $result->status);
        $this->assertSame('The submitted ID is expired.', $result->failure_reason);
    }

    public function test_failed_document_validation_is_rejected_even_with_high_scores(): void
    {
        $verification = Verification::create([
            'user_id' => User::factory()->create()->id,
            'document_type' => 'driver_license',
            'status' => Verification::STATUS_PROCESSING,
            'face_match_score' => 98,
            'ocr_confidence' => 95,
            'liveness_score' => 96,
            'fake_probability' => 2,
            'document_validation' => [
                'is_identity_document' => false,
                'is_supported_document' => false,
                'matches_expected_type' => false,
                'issues' => ['id_not_identity_document'],
            ],
        ]);

        $result = app(VerificationScoreService::class)->finalize($verification);

        $this->assertSame(Verification::STATUS_REJECTED, $result->status);
        $this->assertSame('The submitted image does not look like an identity document.', $result->failure_reason);
    }

    public function test_document_type_mismatch_is_rejected(): void
    {
        $verification = Verification::create([
            'user_id' => User::factory()->create()->id,
            'document_type' => 'passport',
            'status' => Verification::STATUS_PROCESSING,
            'face_match_score' => 98,
            'ocr_confidence' => 95,
            'liveness_score' => 96,
            'fake_probability' => 2,
            'document_validation' => [
                'is_identity_document' => true,
                'is_supported_document' => true,
                'detected_document_type' => 'driver_license',
                'matches_expected_type' => false,
                'issues' => ['id_document_type_mismatch'],
            ],
        ]);

        $result = app(VerificationScoreService::class)->finalize($verification);

        $this->assertSame(Verification::STATUS_REJECTED, $result->status);
        $this->assertSame('The submitted ID does not match the selected document type.', $result->failure_reason);
    }
}
