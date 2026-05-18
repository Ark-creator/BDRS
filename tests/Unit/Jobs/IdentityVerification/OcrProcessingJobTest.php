<?php

namespace Tests\Unit\Jobs\IdentityVerification;

use App\Jobs\IdentityVerification\OCRProcessingJob;
use App\Models\User;
use App\Models\Verification;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class OcrProcessingJobTest extends TestCase
{
    use RefreshDatabase;

    private Verification $verification;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        config(['identity_verification.storage.disk' => 'local']);
        Storage::disk('local')->put('test/id.jpg', 'fake-image-content');
        Storage::disk('local')->put('test/selfie.jpg', 'fake-image-content');
        $this->verification = Verification::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => User::factory()->create()->id,
            'document_type' => 'passport',
            'status' => Verification::STATUS_QUEUED,
            'id_image_path' => 'test/id.jpg',
            'selfie_image_path' => 'test/selfie.jpg',
        ]);
    }

    public function test_processes_ocr_and_updates_verification(): void
    {
        Http::fake([
            '*/ocr/extract' => Http::response([
                'status' => 'completed',
                'confidence' => 95.0,
                'fields' => [
                    'full_name' => 'Juan Dela Cruz',
                    'expiration_date' => '2030-12-31',
                ],
                'document_validation' => [
                    'is_identity_document' => true,
                    'is_supported_document' => true,
                    'matches_expected_type' => true,
                    'issues' => [],
                ],
                'issues' => [],
            ]),
        ]);

        (new OCRProcessingJob($this->verification->id))->handle(
            app(\App\Services\IdentityVerification\AiIdentityVerificationClient::class),
            app(\App\Repositories\IdentityVerification\VerificationRepository::class),
        );

        $this->verification->refresh();
        $this->assertSame(Verification::STATUS_PROCESSING, $this->verification->status);
        $this->assertEquals(95.0, $this->verification->ocr_confidence);
        $this->assertSame('Juan Dela Cruz', $this->verification->extracted_data['full_name']);
        $this->assertTrue(Carbon::parse('2030-12-31')->equalTo($this->verification->id_expires_at));
    }

    public function test_failed_job_marks_for_review(): void
    {
        $job = new OCRProcessingJob($this->verification->id);
        $job->failed(new \RuntimeException('AI service unavailable'));

        $this->verification->refresh();
        $this->assertSame(Verification::STATUS_REVIEW_REQUIRED, $this->verification->status);
        $this->assertStringContainsString('OCR processing failed.', $this->verification->failure_reason);

        $this->assertDatabaseHas('verification_logs', [
            'verification_id' => $this->verification->id,
            'event' => 'ocr_failed',
        ]);
    }
}
