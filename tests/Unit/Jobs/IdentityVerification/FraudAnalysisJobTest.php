<?php

namespace Tests\Unit\Jobs\IdentityVerification;

use App\Jobs\IdentityVerification\FraudAnalysisJob;
use App\Models\User;
use App\Models\Verification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FraudAnalysisJobTest extends TestCase
{
    use RefreshDatabase;

    private Verification $verification;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        config(['identity_verification.storage.disk' => 'local']);
        Storage::disk('local')->put('test/id.jpg', 'fake-id');
        Storage::disk('local')->put('test/selfie.jpg', 'fake-selfie');
        $this->verification = Verification::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => User::factory()->create()->id,
            'document_type' => 'national_id',
            'status' => Verification::STATUS_PROCESSING,
            'id_image_path' => 'test/id.jpg',
            'selfie_image_path' => 'test/selfie.jpg',
            'id_image_hash' => 'hash_a',
            'selfie_image_hash' => 'hash_b',
        ]);
    }

    public function test_analyzes_fraud_and_updates_probability(): void
    {
        Http::fake([
            '*/fraud/analyze' => Http::response([
                'status' => 'completed',
                'fake_probability' => 2.0,
                'is_fake' => false,
                'issues' => [],
            ]),
        ]);

        (new FraudAnalysisJob($this->verification->id))->handle(
            app(\App\Services\IdentityVerification\AiIdentityVerificationClient::class),
            app(\App\Repositories\IdentityVerification\VerificationRepository::class),
        );

        $this->verification->refresh();
        $this->assertEquals(2.0, $this->verification->fake_probability);
    }

    public function test_creates_fraud_alert_when_probability_exceeds_threshold(): void
    {
        Http::fake([
            '*/fraud/analyze' => Http::response([
                'status' => 'completed',
                'fake_probability' => 85.0,
                'is_fake' => true,
                'issues' => ['forged_document'],
            ]),
        ]);

        (new FraudAnalysisJob($this->verification->id))->handle(
            app(\App\Services\IdentityVerification\AiIdentityVerificationClient::class),
            app(\App\Repositories\IdentityVerification\VerificationRepository::class),
        );

        $this->assertDatabaseHas('fraud_alerts', [
            'verification_id' => $this->verification->id,
            'type' => 'fraud_analysis',
            'severity' => 'critical',
        ]);
    }

    public function test_detects_duplicate_upload(): void
    {
        Verification::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => User::factory()->create()->id,
            'document_type' => 'national_id',
            'status' => Verification::STATUS_APPROVED,
            'id_image_hash' => 'hash_a',
        ]);

        Http::fake([
            '*/fraud/analyze' => Http::response([
                'status' => 'completed',
                'fake_probability' => 5.0,
                'is_fake' => false,
                'issues' => [],
            ]),
        ]);

        (new FraudAnalysisJob($this->verification->id))->handle(
            app(\App\Services\IdentityVerification\AiIdentityVerificationClient::class),
            app(\App\Repositories\IdentityVerification\VerificationRepository::class),
        );

        $this->assertDatabaseHas('fraud_alerts', [
            'verification_id' => $this->verification->id,
            'type' => 'duplicate_upload',
        ]);
    }

    public function test_failed_job_marks_for_review(): void
    {
        $job = new FraudAnalysisJob($this->verification->id);
        $job->failed(new \RuntimeException('Fraud analysis failed'));

        $this->verification->refresh();
        $this->assertSame(Verification::STATUS_REVIEW_REQUIRED, $this->verification->status);
    }
}
