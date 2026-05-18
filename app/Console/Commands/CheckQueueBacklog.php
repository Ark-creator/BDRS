<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CheckQueueBacklog extends Command
{
    protected $signature = 'queue:monitor-backlog';
    protected $description = 'Check queue backlog and alert if thresholds exceeded';

    public function handle(): int
    {
        $warningThreshold = config('queue.backlog.warning_threshold', 50);
        $criticalThreshold = config('queue.backlog.critical_threshold', 200);

        $pendingCount = DB::table('jobs')
            ->where('queue', 'identity-verification')
            ->count();

        $failedCount = DB::table('failed_jobs')
            ->where('queue', 'identity-verification')
            ->count();

        $totalBacklog = $pendingCount + $failedCount;

        $this->info("Queue backlog: {$pendingCount} pending, {$failedCount} failed (total: {$totalBacklog})");

        if ($totalBacklog >= $criticalThreshold) {
            $this->error("CRITICAL: Queue backlog {$totalBacklog} exceeds critical threshold {$criticalThreshold}");
            Log::warning('queue.backlog.critical', [
                'pending' => $pendingCount,
                'failed' => $failedCount,
                'total' => $totalBacklog,
                'threshold' => $criticalThreshold,
            ]);
            return self::FAILURE;
        }

        if ($totalBacklog >= $warningThreshold) {
            $this->warn("WARNING: Queue backlog {$totalBacklog} exceeds warning threshold {$warningThreshold}");
            Log::info('queue.backlog.warning', [
                'pending' => $pendingCount,
                'failed' => $failedCount,
                'total' => $totalBacklog,
                'threshold' => $warningThreshold,
            ]);
        }

        return self::SUCCESS;
    }
}
