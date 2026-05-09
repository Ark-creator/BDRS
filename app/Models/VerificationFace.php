<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VerificationFace extends Model
{
    use HasFactory;

    protected $fillable = [
        'verification_id',
        'source',
        'face_count',
        'quality_score',
        'embedding_hash',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'quality_score' => 'decimal:2',
    ];

    public function verification(): BelongsTo
    {
        return $this->belongsTo(Verification::class);
    }
}
