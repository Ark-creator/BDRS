<?php

namespace Tests\Unit\Jobs\IdentityVerification;

use App\Jobs\IdentityVerification\FaceVerificationJob;
use App\Models\User;
use App\Models\Verification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FaceVerificationJobTest extends TestCase
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
            'document_type' => 'passport',
            'status' => Verification::STATUS_PROCESSING,
            'face_match_score' => null,
            'id_image_path' => 'test/id.jpg',
            'selfie_image_path' => 'test/selfie.jpg',
        ]);
    }

    public function test_compares_faces_and_updates_score(): void
    {
        Http::fake([
            '*/face/compare' => Http::response([
                'status' => 'completed',
                'similarity' => 92.5,
                'matched' => true,
                'id_face' => ['face_count' => 1, 'quality_score' => 90, 'embedding_hash' => 'abc'],
                'selfie_face' => ['face_count' => 1, 'quality_score' => 85, 'embedding_hash' => 'def'],
            ]),
        ]);

        (new FaceVerificationJob($this->verification->id))->handle(
            app(\App\Services\IdentityVerification\AiIdentityVerificationClient::class),
            app(\App\Repositories\IdentityVerification\VerificationRepository::class),
        );

        $this->verification->refresh();
        $this->assertEquals(92.5, $this->verification->face_match_score);
        $this->assertDatabaseHas('verification_faces', [
            'verification_id' => $this->verification->id,
            'source' => 'id',
        ]);
    }

    public function test_creates_fraud_alert_when_multiple_faces_detected(): void
    {
        Http::fake([
            '*/face/compare' => Http::response([
                'status' => 'completed',
                'similarity' => 85.0,
                'matched' => true,
                'id_face' => ['face_count' => 3, 'quality_score' => 70],
                'selfie_face' => ['face_count' => 1, 'quality_score' => 80],
            ]),
        ]);

        (new FaceVerificationJob($this->verification->id))->handle(
            app(\App\Services\IdentityVerification\AiIdentityVerificationClient::class),
            app(\App\Repositories\IdentityVerification\VerificationRepository::class),
        );

        $this->assertDatabaseHas('fraud_alerts', [
            'verification_id' => $this->verification->id,
            'type' => 'multiple_faces',
            'status' => 'open',
        ]);
    }

    public function test_failed_job_marks_for_review(): void
    {
        $job = new FaceVerificationJob($this->verification->id);
        $job->failed(new \RuntimeException('Face comparison failed'));

        $this->verification->refresh();
        $this->assertSame(Verification::STATUS_REVIEW_REQUIRED, $this->verification->status);
    }
}
