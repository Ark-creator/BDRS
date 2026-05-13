<?php

namespace App\Jobs\IdentityVerification;

use App\Models\Verification;
use App\Services\IdentityVerification\VerificationFileStorage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CleanupTemporaryFilesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public function __construct()
    {
        $this->onQueue((string) config('identity_verification.queues.cleanup', 'maintenance'));
    }

    public function handle(VerificationFileStorage $storage): void
    {
        Verification::query()
            ->where('status', Verification::STATUS_DRAFT)
            ->where('updated_at', '<', now()->subDay())
            ->chunkById(100, function ($verifications) use ($storage): void {
                foreach ($verifications as $verification) {
                    $storage->delete($verification->id_image_path);
                    $storage->delete($verification->selfie_image_path);
                    $verification->delete();
                }
            });

        Verification::withTrashed()
            ->whereNotNull('deleted_at')
            ->where('deleted_at', '<', now()->subDays((int) config('identity_verification.storage.retention_days', 365)))
            ->chunkById(100, function ($verifications) use ($storage): void {
                foreach ($verifications as $verification) {
                    $storage->delete($verification->id_image_path);
                    $storage->delete($verification->selfie_image_path);
                    $verification->forceDelete();
                }
            });
    }
}
