<?php

namespace App\Listeners;

use App\Events\IdentityVerificationCompleted;
use App\Events\IdentityVerificationRequiresReview;
use App\Events\IdentityVerificationReviewed;
use App\Events\IdentityVerificationSubmitted;
use App\Models\AuditLog;

class RecordIdentityVerificationAudit
{
    public function handle(object $event): void
    {
        if (!property_exists($event, 'verification')) {
            return;
        }

        $action = match ($event::class) {
            IdentityVerificationSubmitted::class => 'identity_verification.submitted',
            IdentityVerificationCompleted::class => 'identity_verification.completed',
            IdentityVerificationRequiresReview::class => 'identity_verification.requires_review',
            IdentityVerificationReviewed::class => 'identity_verification.reviewed',
            default => 'identity_verification.event',
        };

        $actor = property_exists($event, 'actor') ? $event->actor : null;

        AuditLog::create([
            'auditable_type' => $event->verification::class,
            'auditable_id' => $event->verification->id,
            'user_id' => $actor?->id ?? $event->verification->user_id,
            'action' => $action,
            'metadata' => [
                'verification_uuid' => $event->verification->uuid,
                'status' => $event->verification->status,
                'overall_score' => $event->verification->overall_score,
            ],
        ]);
    }
}
