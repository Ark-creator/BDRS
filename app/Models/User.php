<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    /**
     * Mass assignable attributes.
     */
    protected $fillable = [
        'email',
        'password',
        'role',
        'status',
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
    protected $appends = ['full_name'];
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
}
