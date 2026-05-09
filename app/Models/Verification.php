<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class Verification extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_QUEUED = 'queued';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_REVIEW_REQUIRED = 'review_required';
    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'uuid',
        'user_id',
        'document_type',
        'status',
        'id_image_path',
        'selfie_image_path',
        'id_image_hash',
        'selfie_image_hash',
        'extracted_data',
        'document_validation',
        'scores',
        'face_match_score',
        'ocr_confidence',
        'fake_probability',
        'liveness_score',
        'overall_score',
        'id_expires_at',
        'failure_reason',
        'submitted_at',
        'processed_at',
        'reviewed_at',
        'reviewed_by',
        'review_notes',
    ];

    protected $casts = [
        'extracted_data' => 'array',
        'document_validation' => 'array',
        'scores' => 'array',
        'face_match_score' => 'decimal:2',
        'ocr_confidence' => 'decimal:2',
        'fake_probability' => 'decimal:2',
        'liveness_score' => 'decimal:2',
        'overall_score' => 'decimal:2',
        'id_expires_at' => 'date',
        'submitted_at' => 'datetime',
        'processed_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    protected $appends = [
        'id_image_url',
        'selfie_image_url',
    ];

    protected static function booted(): void
    {
        static::creating(function (Verification $verification): void {
            if (!$verification->uuid) {
                $verification->uuid = (string) Str::uuid();
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function faces(): HasMany
    {
        return $this->hasMany(VerificationFace::class);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(VerificationLog::class);
    }

    public function fraudAlerts(): HasMany
    {
        return $this->hasMany(FraudAlert::class);
    }

    public function getIdImageUrlAttribute(): ?string
    {
        return $this->temporaryImageUrl('id');
    }

    public function getSelfieImageUrlAttribute(): ?string
    {
        return $this->temporaryImageUrl('selfie');
    }

    public function isTerminal(): bool
    {
        return in_array($this->status, [
            self::STATUS_APPROVED,
            self::STATUS_REJECTED,
            self::STATUS_REVIEW_REQUIRED,
            self::STATUS_FAILED,
        ], true);
    }

    private function temporaryImageUrl(string $type): ?string
    {
        $path = $type === 'id' ? $this->id_image_path : $this->selfie_image_path;

        if (!$path || !$this->exists) {
            return null;
        }

        return URL::temporarySignedRoute(
            'verification.images.show',
            now()->addMinutes((int) config('identity_verification.storage.temporary_url_minutes', 10)),
            ['verification' => $this->uuid, 'type' => $type]
        );
    }
}
