<?php

namespace Tests\Unit\Jobs\IdentityVerification;

use App\Events\IdentityVerificationCompleted;
use App\Events\IdentityVerificationRequiresReview;
use App\Jobs\IdentityVerification\FinalizeIdentityVerificationJob;
use App\Models\User;
use App\Models\Verification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class FinalizeIdentityVerificationJobTest extends TestCase
{
    use RefreshDatabase;

    private Verification $verification;

    protected function setUp(): void
    {
        parent::setUp();
        $this->verification = Verification::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => User::factory()->create()->id,
            'document_type' => 'passport',
            'status' => Verification::STATUS_PROCESSING,
            'face_match_score' => 96,
            'ocr_confidence' => 92,
            'liveness_score' => 95,
            'fake_probability' => 5,
        ]);
    }

    public function test_finalizes_approved_verification_and_dispatches_event(): void
    {
        Event::fake();

        (new FinalizeIdentityVerificationJob($this->verification->id))->handle(
            app(\App\Services\IdentityVerification\VerificationScoreService::class),
            app(\App\Repositories\IdentityVerification\VerificationRepository::class),
        );

        $this->verification->refresh();
        $this->assertSame(Verification::STATUS_APPROVED, $this->verification->status);
        $this->assertNotNull($this->verification->overall_score);
        $this->assertNotNull($this->verification->processed_at);

        Event::assertDispatched(IdentityVerificationCompleted::class);
        Event::assertNotDispatched(IdentityVerificationRequiresReview::class);
    }

    public function test_finalizes_review_required_when_borderline_scores(): void
    {
        Event::fake();

        $verification = Verification::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => User::factory()->create()->id,
            'document_type' => 'passport',
            'status' => Verification::STATUS_PROCESSING,
            'face_match_score' => 50,
            'ocr_confidence' => 70,
            'liveness_score' => 75,
            'fake_probability' => 20,
        ]);

        (new FinalizeIdentityVerificationJob($verification->id))->handle(
            app(\App\Services\IdentityVerification\VerificationScoreService::class),
            app(\App\Repositories\IdentityVerification\VerificationRepository::class),
        );

        $verification->refresh();
        $this->assertSame(Verification::STATUS_REVIEW_REQUIRED, $verification->status);

        Event::assertDispatched(IdentityVerificationRequiresReview::class);
    }

    public function test_failed_job_marks_for_review(): void
    {
        $job = new FinalizeIdentityVerificationJob($this->verification->id);
        $job->failed(new \RuntimeException('Finalize failed'));

        $this->verification->refresh();
        $this->assertSame(Verification::STATUS_REVIEW_REQUIRED, $this->verification->status);
        $this->assertStringContainsString('Final scoring failed.', $this->verification->failure_reason);
    }
}
