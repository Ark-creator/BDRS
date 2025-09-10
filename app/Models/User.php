<?php

namespace App\Models;

use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;


use Illuminate\Database\Eloquent\Relations\BelongsTo; 
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable implements MustVerifyEmail 
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Mass assignable attributes.
     */
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

    ];

    /**
     * Attributes hidden from arrays/JSON.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Append custom attributes to arrays/JSON.
     */
    

    /**
     * Attribute casting.
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Accessor for the full name.
     * Returns "First Middle Last" if available, trims extra spaces.
     */
    protected $appends = ['full_name', 'is_verified'];
    protected function fullName(): Attribute
{
    return Attribute::make(
        get: fn () => trim(
            collect([
                $this->profile?->first_name,
                $this->profile?->middle_name,
                $this->profile?->last_name
            ])
            ->filter()
            ->implode(' ')
        )
    );
}

    /**
     * Relationship: One user has one profile.
     */
    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class);
    }

    /**
     * Relationship: All document requests of this user.
     */
    public function documentRequests(): HasMany
    {
        return $this->hasMany(DocumentRequest::class);
    }

    public function barangay(): BelongsTo
{
    return $this->belongsTo(Barangay::class);
}

    /**
     * Relationship: Requests processed by this user.
     */
    public function processedRequests(): HasMany
    {
        return $this->hasMany(DocumentRequest::class, 'processed_by');
    }
    public function getFullNameAttribute()
{
    if (!$this->relationLoaded('profile')) {
        $this->load('profile');
    }

    return trim(
        collect([
            $this->profile->first_name ?? '',
            $this->profile->middle_name ?? '',
            $this->profile->last_name ?? ''
        ])->filter()->implode(' ')
    );
}

 protected function isVerified(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->verification_status === 'verified',
        );
    }

    
}

