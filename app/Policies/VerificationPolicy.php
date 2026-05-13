<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Verification;

class VerificationPolicy
{
    public function view(User $user, Verification $verification): bool
    {
        if ((int) $verification->user_id === (int) $user->id) {
            return true;
        }

        if (!in_array($user->role, ['admin', 'super_admin'], true)) {
            return false;
        }

        if ($user->role === 'super_admin') {
            return true;
        }

        return (int) $verification->user?->barangay_id === (int) $user->barangay_id;
    }

    public function update(User $user, Verification $verification): bool
    {
        return (int) $verification->user_id === (int) $user->id && !$verification->isTerminal();
    }

    public function process(User $user, Verification $verification): bool
    {
        return $this->update($user, $verification);
    }

    public function review(User $user, Verification $verification): bool
    {
        if (!in_array($user->role, ['admin', 'super_admin'], true)) {
            return false;
        }

        if ($user->role === 'super_admin') {
            return true;
        }

        return (int) $verification->user?->barangay_id === (int) $user->barangay_id;
    }
}
