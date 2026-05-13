<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VerificationLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'verification_id',
        'user_id',
        'event',
        'level',
        'message',
        'context',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'context' => 'array',
    ];

    public function verification(): BelongsTo
    {
        return $this->belongsTo(Verification::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
