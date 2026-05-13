<?php

namespace App\Events;

use App\Models\User;
use App\Models\Verification;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class IdentityVerificationSubmitted
{
    use Dispatchable, SerializesModels;

    public function __construct(public Verification $verification, public ?User $actor = null) {}
}
