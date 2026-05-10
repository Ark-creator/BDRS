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

class FraudAnalysisJob implements ShouldQueue
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
        $result = $client->analyzeFraud($verification);
        $scores = $verification->scores ?? [];
        $scores['fraud'] = $result;

        $verification->forceFill([
            'fake_probability' => round((float) data_get($result, 'fake_probability', 100), 2),
            'scores' => $scores,
        ])->save();

        $issues = data_get($result, 'issues', []);
        if ($verification->fake_probability > (float) config('identity_verification.thresholds.fake_probability_max') || count($issues) > 0) {
            $criticalIssues = array_intersect($issues, [
                'id_tamper_suspected',
                'id_screenshot_suspected',
                'id_recapture_suspected',
                'duplicate_id_and_selfie_image',
                'duplicate_uploaded_binary',
            ]);
            $verification->fraudAlerts()->create([
                'type' => 'fraud_analysis',
                'severity' => $verification->fake_probability >= 50 || count($criticalIssues) > 0 ? 'critical' : 'medium',
                'status' => 'open',
                'message' => 'Fraud analysis found risk indicators.',
                'metadata' => $result,
            ]);
        }

        $duplicateUploadExists = Verification::query()
            ->whereKeyNot($verification->id)
            ->where(function ($query) use ($verification): void {
                $query->where('id_image_hash', $verification->id_image_hash)
                    ->orWhere('selfie_image_hash', $verification->selfie_image_hash)
                    ->orWhere('id_image_hash', $verification->selfie_image_hash)
                    ->orWhere('selfie_image_hash', $verification->id_image_hash);
            })
            ->exists();

        if ($duplicateUploadExists) {
            $verification->fraudAlerts()->firstOrCreate([
                'type' => 'duplicate_upload',
                'status' => 'open',
            ], [
                'severity' => 'high',
                'message' => 'The submitted ID or selfie matches a previous upload hash.',
                'metadata' => [
                    'id_image_hash' => $verification->id_image_hash,
                    'selfie_image_hash' => $verification->selfie_image_hash,
                ],
            ]);
        }

        $repository->recordLog($verification, 'fraud_processed', 'Fraud analysis completed.', null, 'info', [
            'fake_probability' => $verification->fake_probability,
            'issues' => $issues,
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
                'failure_reason' => 'Fraud analysis failed.',
            ])->save();
        }

        $verification->logs()->create([
            'event' => 'fraud_failed',
            'level' => 'error',
            'message' => 'Fraud analysis failed.',
            'context' => ['exception' => $exception?->getMessage()],
        ]);
    }
}
