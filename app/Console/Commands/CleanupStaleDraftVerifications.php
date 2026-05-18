<?php

namespace App\Console\Commands;

use App\Models\Verification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class CleanupStaleDraftVerifications extends Command
{
    protected $signature = 'verifications:cleanup-drafts';
    protected $description = 'Delete draft verifications older than the retention period';

    public function handle(): int
    {
        $retentionHours = config('identity_verification.retention.draft_hours', 24);
        $cutoff = now()->subHours($retentionHours);

        $drafts = Verification::query()
            ->where('status', Verification::STATUS_DRAFT)
            ->where('created_at', '<', $cutoff)
            ->get();

        $count = 0;
        foreach ($drafts as $draft) {
            if ($draft->id_image_path) {
                Storage::disk(config('identity_verification.storage.disk'))->delete($draft->id_image_path);
            }
            if ($draft->selfie_image_path) {
                Storage::disk(config('identity_verification.storage.disk'))->delete($draft->selfie_image_path);
            }
            $draft->delete();
            $count++;
        }

        $this->info("Cleaned up {$count} stale draft verifications");
        return self::SUCCESS;
    }
}
