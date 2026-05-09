<?php

namespace App\Jobs\IdentityVerification;

use App\Models\Verification;
use App\Repositories\IdentityVerification\VerificationRepository;
use App\Services\IdentityVerification\AiIdentityVerificationClient;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class OCRProcessingJob implements ShouldQueue
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

        $verification->forceFill(['status' => Verification::STATUS_PROCESSING])->save();
        $result = $client->extractOcr($verification);
        $scores = $verification->scores ?? [];
        $scores['ocr'] = $result;

        $expirationDate = $this->expirationDate($result);

        $verification->forceFill([
            'extracted_data' => $result['fields'] ?? $result,
            'ocr_confidence' => round((float) data_get($result, 'confidence', data_get($result, 'ocr_confidence', 0)), 2),
            'id_expires_at' => $expirationDate,
            'scores' => $scores,
        ])->save();

        $repository->recordLog($verification, 'ocr_processed', 'ID OCR extraction completed.', null, 'info', [
            'confidence' => $verification->ocr_confidence,
            'id_expires_at' => $expirationDate?->toDateString(),
        ]);
    }

    public function failed(?Throwable $exception): void
    {
        $this->markForReview('ocr_failed', 'OCR processing failed.', $exception);
    }

    private function expirationDate(array $result): ?Carbon
    {
        $candidate = data_get($result, 'fields.expiration_date')
            ?? data_get($result, 'fields.expiry_date')
            ?? data_get($result, 'fields.expires_at')
            ?? data_get($result, 'expiration_date');

        if (!$candidate) {
            return null;
        }

        try {
            return Carbon::parse($candidate)->startOfDay();
        } catch (Throwable) {
            return null;
        }
    }

    private function markForReview(string $event, string $message, ?Throwable $exception): void
    {
        $verification = Verification::find($this->verificationId);
        if (!$verification) {
            return;
        }

        if (!$verification->isTerminal()) {
            $verification->forceFill([
                'status' => Verification::STATUS_REVIEW_REQUIRED,
                'failure_reason' => $message,
            ])->save();
        }

        $verification->logs()->create([
            'event' => $event,
            'level' => 'error',
            'message' => $message,
            'context' => ['exception' => $exception?->getMessage()],
        ]);
    }
}
