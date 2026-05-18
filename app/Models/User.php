<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'email',
        'password',
        'role',
        'status',
        'two_factor_enabled',
        'two_factor_code',
        'two_factor_expires_at',
        'verification_status',
        'barangay_id',
        'two_factor_method',
        'email_verified_at',
        'last_otp_sent_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = ['full_name', 'is_verified'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_expires_at' => 'datetime',
            'last_otp_sent_at' => 'datetime',
        ];
    }

    protected function fullName(): Attribute
    {
        return Attribute::make(
            get: fn () => trim(
                collect([
                    $this->profile?->first_name,
                    $this->profile?->middle_name,
                    $this->profile?->last_name,
                ])
                    ->filter()
                    ->implode(' ')
            )
        );
    }

    protected function isVerified(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->verification_status === 'verified',
        );
    }

    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class);
    }

    public function documentRequests(): HasMany
    {
        return $this->hasMany(DocumentRequest::class);
    }

    public function verifications(): HasMany
    {
        return $this->hasMany(Verification::class);
    }

    public function barangay(): BelongsTo
    {
        return $this->belongsTo(Barangay::class);
    }

    public function processedRequests(): HasMany
    {
        return $this->hasMany(DocumentRequest::class, 'processed_by');
    }

    public function getFullNameAttribute()
    {
        $profile = $this->profile;

        if (!$profile) {
            return '';
        }

        return trim(
            collect([
                $profile->first_name ?? '',
                $profile->middle_name ?? '',
                $profile->last_name ?? '',
            ])->filter()->implode(' ')
        );
    }

    public function routeNotificationForSemaphore($notification): ?string
    {
        return $this->profile?->phone_number;
    }
}
