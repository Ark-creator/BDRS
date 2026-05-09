<?php

namespace App\Events;

use App\Models\Verification;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class IdentityVerificationCompleted
{
    use Dispatchable, SerializesModels;

    public function __construct(public Verification $verification) {}
}
