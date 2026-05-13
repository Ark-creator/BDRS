<?php

namespace App\Jobs\IdentityVerification;

use App\Models\Verification;
use App\Repositories\IdentityVerification\VerificationRepository;
use App\Services\IdentityVerification\AiIdentityVerificationClient;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class FaceVerificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [30, 120, 300];

    public function __construct(public int $verificationId)
    {
        $this->onQueue((string) config('identity_verification.queues.processing', 'identity-verification'));
    }

    public function handle(AiIdentityVerificationClient $client, VerificationRepository $repository): void
    {
        $verification = Verification::findOrFail($this->verificationId);
        $result = $client->compareFaces($verification);
        $scores = $verification->scores ?? [];
        $scores['face'] = $result;

        $verification->forceFill([
            'face_match_score' => round((float) data_get($result, 'similarity', data_get($result, 'face_match', 0)), 2),
            'scores' => $scores,
        ])->save();

        $this->upsertFace($verification, 'id', $result['id_face'] ?? []);
        $this->upsertFace($verification, 'selfie', $result['selfie_face'] ?? []);

        $idFaceCount = (int) data_get($result, 'id_face.face_count', 0);
        $selfieFaceCount = (int) data_get($result, 'selfie_face.face_count', 0);
        if ($idFaceCount > 1 || $selfieFaceCount > 1) {
            $verification->fraudAlerts()->firstOrCreate([
                'type' => 'multiple_faces',
                'status' => 'open',
            ], [
                'severity' => 'high',
                'message' => 'Multiple faces were detected in one or more uploaded images.',
                'metadata' => [
                    'id_face_count' => $idFaceCount,
                    'selfie_face_count' => $selfieFaceCount,
                ],
            ]);
        }

        $repository->recordLog($verification, 'face_processed', 'Face comparison completed.', null, 'info', [
            'similarity' => $verification->face_match_score,
        ]);
    }

    public function failed(?Throwable $exception): void
    {
        $verification = Verification::find($this->verificationId);
        if (!$verification) {
            return;
        }

        if (!$verification->isTerminal()) {
            $verification->forceFill([
                'status' => Verification::STATUS_REVIEW_REQUIRED,
                'failure_reason' => 'Face verification failed.',
            ])->save();
        }

        $verification->logs()->create([
            'event' => 'face_failed',
            'level' => 'error',
            'message' => 'Face verification failed.',
            'context' => ['exception' => $exception?->getMessage()],
        ]);
    }

    private function upsertFace(Verification $verification, string $source, array $face): void
    {
        $verification->faces()->updateOrCreate([
            'source' => $source,
        ], [
            'face_count' => (int) data_get($face, 'face_count', 0),
            'quality_score' => round((float) data_get($face, 'quality_score', 0), 2),
            'embedding_hash' => data_get($face, 'embedding_hash'),
            'metadata' => $face,
        ]);
    }
}
