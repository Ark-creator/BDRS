<?php

namespace Tests\Unit\Jobs\IdentityVerification;

use App\Jobs\IdentityVerification\LivenessDetectionJob;
use App\Models\User;
use App\Models\Verification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class LivenessDetectionJobTest extends TestCase
{
    use RefreshDatabase;

    private Verification $verification;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        config(['identity_verification.storage.disk' => 'local']);
        Storage::disk('local')->put('test/selfie.jpg', 'fake-selfie');
        $this->verification = Verification::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => User::factory()->create()->id,
            'document_type' => 'passport',
            'status' => Verification::STATUS_PROCESSING,
            'selfie_image_path' => 'test/selfie.jpg',
        ]);
    }

    public function test_processes_liveness_and_updates_score(): void
    {
        Http::fake([
            '*/liveness/check' => Http::response([
                'status' => 'completed',
                'score' => 92.0,
                'passed' => true,
            ]),
        ]);

        (new LivenessDetectionJob($this->verification->id))->handle(
            app(\App\Services\IdentityVerification\AiIdentityVerificationClient::class),
            app(\App\Repositories\IdentityVerification\VerificationRepository::class),
        );

        $this->verification->refresh();
        $this->assertEquals(92.0, $this->verification->liveness_score);
    }

    public function test_creates_fraud_alert_on_low_liveness_score(): void
    {
        Http::fake([
            '*/liveness/check' => Http::response([
                'status' => 'completed',
                'score' => 20.0,
                'passed' => false,
            ]),
        ]);

        (new LivenessDetectionJob($this->verification->id))->handle(
            app(\App\Services\IdentityVerification\AiIdentityVerificationClient::class),
            app(\App\Repositories\IdentityVerification\VerificationRepository::class),
        );

        $this->assertDatabaseHas('fraud_alerts', [
            'verification_id' => $this->verification->id,
            'type' => 'liveness_low_score',
        ]);
    }

    public function test_failed_job_marks_for_review(): void
    {
        $job = new LivenessDetectionJob($this->verification->id);
        $job->failed(new \RuntimeException('Liveness check failed'));

        $this->verification->refresh();
        $this->assertSame(Verification::STATUS_REVIEW_REQUIRED, $this->verification->status);
    }
}
