<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Artisan;
use App\Jobs\IdentityVerification\CleanupTemporaryFilesJob;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::job(new CleanupTemporaryFilesJob())->dailyAt('02:15');

Schedule::command('verifications:cleanup-drafts')->hourly();
Schedule::command('verifications:cleanup-files')->dailyAt('03:00');
Schedule::command('payments:reconcile-pending')->dailyAt('06:00');
Schedule::command('queue:monitor-backlog')->everyFiveMinutes();
