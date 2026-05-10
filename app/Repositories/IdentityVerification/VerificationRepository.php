<?php

namespace App\Repositories\IdentityVerification;

use App\Models\User;
use App\Models\Verification;
use App\Models\VerificationLog;
use Illuminate\Http\Request;

class VerificationRepository
{
    public function createDraft(User $user, string $documentType): Verification
    {
        return Verification::create([
            'user_id' => $user->id,
            'document_type' => $documentType,
            'status' => Verification::STATUS_DRAFT,
        ]);
    }

    public function findForUserByUuid(User $user, string $uuid): ?Verification
    {
        return Verification::query()
            ->where('uuid', $uuid)
            ->where('user_id', $user->id)
            ->first();
    }

    public function recordLog(
        Verification $verification,
        string $event,
        string $message,
        ?User $actor = null,
        string $level = 'info',
        array $context = [],
        ?Request $request = null
    ): VerificationLog {
        return $verification->logs()->create([
            'user_id' => $actor?->id,
            'event' => $event,
            'level' => $level,
            'message' => $message,
            'context' => $context ?: null,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
        ]);
    }
}
