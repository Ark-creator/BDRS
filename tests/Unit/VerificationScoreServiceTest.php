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

    public function test_borderline_scores_result_in_review_required(): void
    {
        $verification = Verification::create([
            'user_id' => User::factory()->create()->id,
            'document_type' => 'passport',
            'status' => Verification::STATUS_PROCESSING,
            'face_match_score' => 60,
            'ocr_confidence' => 65,
            'liveness_score' => 62,
            'fake_probability' => 30,
        ]);

        $result = app(VerificationScoreService::class)->finalize($verification);

        $this->assertSame(Verification::STATUS_REVIEW_REQUIRED, $result->status);
    }

    public function test_low_face_match_score_requires_review(): void
    {
        $verification = Verification::create([
            'user_id' => User::factory()->create()->id,
            'document_type' => 'passport',
            'status' => Verification::STATUS_PROCESSING,
            'face_match_score' => 30,
            'ocr_confidence' => 95,
            'liveness_score' => 95,
            'fake_probability' => 2,
        ]);

        $result = app(VerificationScoreService::class)->finalize($verification);

        $this->assertSame(Verification::STATUS_REVIEW_REQUIRED, $result->status);
    }

    public function test_low_liveness_score_requires_review(): void
    {
        $verification = Verification::create([
            'user_id' => User::factory()->create()->id,
            'document_type' => 'passport',
            'status' => Verification::STATUS_PROCESSING,
            'face_match_score' => 95,
            'ocr_confidence' => 95,
            'liveness_score' => 20,
            'fake_probability' => 2,
        ]);

        $result = app(VerificationScoreService::class)->finalize($verification);

        $this->assertSame(Verification::STATUS_REVIEW_REQUIRED, $result->status);
    }

    public function test_high_fraud_probability_requires_review(): void
    {
        $verification = Verification::create([
            'user_id' => User::factory()->create()->id,
            'document_type' => 'passport',
            'status' => Verification::STATUS_PROCESSING,
            'face_match_score' => 95,
            'ocr_confidence' => 95,
            'liveness_score' => 95,
            'fake_probability' => 90,
        ]);

        $result = app(VerificationScoreService::class)->finalize($verification);

        $this->assertSame(Verification::STATUS_REVIEW_REQUIRED, $result->status);
    }

    public function test_low_ocr_confidence_requires_review(): void
    {
        $verification = Verification::create([
            'user_id' => User::factory()->create()->id,
            'document_type' => 'passport',
            'status' => Verification::STATUS_PROCESSING,
            'face_match_score' => 95,
            'ocr_confidence' => 25,
            'liveness_score' => 95,
            'fake_probability' => 2,
        ]);

        $result = app(VerificationScoreService::class)->finalize($verification);

        $this->assertSame(Verification::STATUS_REVIEW_REQUIRED, $result->status);
    }

    public function test_all_scores_failing_below_review_min_is_rejected(): void
    {
        $verification = Verification::create([
            'user_id' => User::factory()->create()->id,
            'document_type' => 'passport',
            'status' => Verification::STATUS_PROCESSING,
            'face_match_score' => 20,
            'ocr_confidence' => 20,
            'liveness_score' => 20,
            'fake_probability' => 80,
        ]);

        $result = app(VerificationScoreService::class)->finalize($verification);

        $this->assertSame(Verification::STATUS_REJECTED, $result->status);
        $this->assertStringContainsString('does not sufficiently match', $result->failure_reason);
    }

    public function test_not_an_identity_document_is_rejected(): void
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
                'is_identity_document' => false,
                'is_supported_document' => true,
                'matches_expected_type' => true,
                'issues' => ['id_not_identity_document'],
            ],
        ]);

        $result = app(VerificationScoreService::class)->finalize($verification);

        $this->assertSame(Verification::STATUS_REJECTED, $result->status);
        $this->assertSame('The submitted image does not look like an identity document.', $result->failure_reason);
    }

    public function test_unsupported_document_type_is_rejected(): void
    {
        $verification = Verification::create([
            'user_id' => User::factory()->create()->id,
            'document_type' => 'unknown',
            'status' => Verification::STATUS_PROCESSING,
            'face_match_score' => 98,
            'ocr_confidence' => 95,
            'liveness_score' => 96,
            'fake_probability' => 2,
            'document_validation' => [
                'is_identity_document' => true,
                'is_supported_document' => false,
                'matches_expected_type' => true,
                'issues' => ['id_unsupported_document_type'],
            ],
        ]);

        $result = app(VerificationScoreService::class)->finalize($verification);

        $this->assertSame(Verification::STATUS_REJECTED, $result->status);
        $this->assertSame('The submitted ID type is not supported for automatic verification.', $result->failure_reason);
    }

    public function test_scores_from_json_column_are_used_when_numeric_scores_null(): void
    {
        $verification = Verification::create([
            'user_id' => User::factory()->create()->id,
            'document_type' => 'passport',
            'status' => Verification::STATUS_PROCESSING,
            'scores' => [
                'face' => ['similarity' => 95],
                'ocr' => ['confidence' => 90],
                'liveness' => ['score' => 92],
                'fraud' => ['fake_probability' => 5],
            ],
        ]);

        $result = app(VerificationScoreService::class)->finalize($verification);

        $this->assertSame(Verification::STATUS_APPROVED, $result->status);
        $this->assertNotNull($result->overall_score);
    }

    public function test_id_no_readable_text_issue_bypasses_auto_approve(): void
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
                'matches_expected_type' => true,
                'issues' => ['id_no_readable_text'],
            ],
        ]);

        $result = app(VerificationScoreService::class)->finalize($verification);

        $this->assertSame(Verification::STATUS_APPROVED, $result->status);
    }
}
