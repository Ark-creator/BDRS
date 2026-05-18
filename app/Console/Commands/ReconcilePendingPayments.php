<?php

namespace App\Console\Commands;

use App\Models\DocumentRequest;
use Illuminate\Console\Command;

class ReconcilePendingPayments extends Command
{
    protected $signature = 'payments:reconcile-pending';
    protected $description = 'Cancel document requests stuck in pending_payment for over 48 hours';

    public function handle(): int
    {
        $cutoff = now()->subHours(48);

        $staleRequests = DocumentRequest::query()
            ->where('status', 'Pending Payment')
            ->where('created_at', '<', $cutoff)
            ->get();

        $count = 0;
        foreach ($staleRequests as $request) {
            $request->status = 'Cancelled';
            $request->save();
            $count++;
        }

        $this->info("Cancelled {$count} stale pending payment requests");
        return self::SUCCESS;
    }
}
