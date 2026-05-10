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

class LivenessDetectionJob implements ShouldQueue
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
        $result = $client->checkLiveness($verification);
        $scores = $verification->scores ?? [];
        $scores['liveness'] = $result;

        $verification->forceFill([
            'liveness_score' => round((float) data_get($result, 'score', data_get($result, 'liveness_score', 0)), 2),
            'scores' => $scores,
        ])->save();

        $issues = (array) data_get($result, 'issues', []);
        if ($verification->liveness_score < (float) config('identity_verification.thresholds.liveness_min')) {
            $verification->fraudAlerts()->firstOrCreate([
                'type' => 'liveness_low_score',
                'status' => 'open',
            ], [
                'severity' => 'high',
                'message' => 'Selfie image failed liveness confidence checks.',
                'metadata' => $result,
            ]);
        }

        if (count(array_intersect($issues, ['selfie_screen_replay_risk', 'selfie_recapture_risk', 'selfie_liveness_texture_low'])) > 0) {
            $verification->fraudAlerts()->firstOrCreate([
                'type' => 'liveness_spoof_signal',
                'status' => 'open',
            ], [
                'severity' => 'high',
                'message' => 'Selfie shows potential spoofing or screen replay signals.',
                'metadata' => $result,
            ]);
        }

        $repository->recordLog($verification, 'liveness_processed', 'Liveness detection completed.', null, 'info', [
            'score' => $verification->liveness_score,
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
                'failure_reason' => 'Liveness detection failed.',
            ])->save();
        }

        $verification->logs()->create([
            'event' => 'liveness_failed',
            'level' => 'error',
            'message' => 'Liveness detection failed.',
            'context' => ['exception' => $exception?->getMessage()],
        ]);
    }
}
