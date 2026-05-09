<?php

namespace App\Jobs\IdentityVerification;

use App\Events\IdentityVerificationCompleted;
use App\Events\IdentityVerificationRequiresReview;
use App\Models\Verification;
use App\Repositories\IdentityVerification\VerificationRepository;
use App\Services\IdentityVerification\VerificationScoreService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class FinalizeIdentityVerificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;

    public array $backoff = [30, 120];

    public function __construct(public int $verificationId)
    {
        $this->onQueue((string) config('identity_verification.queues.processing', 'identity-verification'));
    }

    public function handle(VerificationScoreService $scoreService, VerificationRepository $repository): void
    {
        $verification = Verification::findOrFail($this->verificationId);
        $verification = $scoreService->finalize($verification);

        $repository->recordLog($verification, 'finalized', 'Verification scoring finalized.', null, 'info', [
            'status' => $verification->status,
            'overall_score' => $verification->overall_score,
        ]);

        if ($verification->status === Verification::STATUS_REVIEW_REQUIRED) {
            event(new IdentityVerificationRequiresReview($verification));

            return;
        }

        event(new IdentityVerificationCompleted($verification));
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
                'failure_reason' => 'Final scoring failed.',
            ])->save();
        }

        $verification->logs()->create([
            'event' => 'finalize_failed',
            'level' => 'error',
            'message' => 'Final scoring failed.',
            'context' => ['exception' => $exception?->getMessage()],
        ]);
    }
}
