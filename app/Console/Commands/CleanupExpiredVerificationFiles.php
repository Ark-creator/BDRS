<?php

namespace App\Console\Commands;

use App\Models\Verification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class CleanupExpiredVerificationFiles extends Command
{
    protected $signature = 'verifications:cleanup-files';
    protected $description = 'Remove uploaded files for completed verifications past the retention period';

    public function handle(): int
    {
        $retentionDays = config('identity_verification.retention.completed_days', 90);
        $cutoff = now()->subDays($retentionDays);

        $terminalStatuses = [
            Verification::STATUS_APPROVED,
            Verification::STATUS_REJECTED,
            Verification::STATUS_FAILED,
        ];

        $records = Verification::query()
            ->whereIn('status', $terminalStatuses)
            ->where('updated_at', '<', $cutoff)
            ->get();

        $disk = Storage::disk(config('identity_verification.storage.disk'));
        $fileCount = 0;
        $recordCount = 0;

        foreach ($records as $record) {
            if ($record->id_image_path && $disk->exists($record->id_image_path)) {
                $disk->delete($record->id_image_path);
                $fileCount++;
            }
            if ($record->selfie_image_path && $disk->exists($record->selfie_image_path)) {
                $disk->delete($record->selfie_image_path);
                $fileCount++;
            }
            $record->id_image_path = null;
            $record->selfie_image_path = null;
            $record->save();
            $recordCount++;
        }

        $this->info("Cleaned up {$fileCount} files from {$recordCount} expired verification records");
        return self::SUCCESS;
    }
}
