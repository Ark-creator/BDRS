<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany; // It's good practice to import relation types
use Illuminate\Database\Eloquent\Relations\HasOne; // 1. IMPORT HasOne RELATION TYPE
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Casts\Attribute; // 2. IMPORT Attribute FOR ACCESSOR

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        // 'name', // 3. REMOVED 'name'
        'email',
        'password',
        'role',
        'status',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // 4. ADDED a convenient accessor for the user's full name.
    protected function fullName(): Attribute
    {
        return Attribute::make(
            get: fn () => "{$this->profile?->first_name} {$this->profile?->last_name}",
        );
    }

    /**
     * Get the profile associated with the user.
     */
    public function profile(): HasOne // 5. ADDED the profile() relationship
    {
        return $this->hasOne(UserProfile::class);
    }


    /*
    |--------------------------------------------------------------------------
    | EXISTING RELATIONSHIPS (PRESERVED)
    |--------------------------------------------------------------------------
    */

    /**
     * Get all of the document requests for the User.
     */
    public function documentRequests(): HasMany
    {
        return $this->hasMany(DocumentRequest::class);
    }

    /**
     * Get all of the requests processed by the User (if they are an admin).
     */
    public function processedRequests(): HasMany
    {
        return $this->hasMany(DocumentRequest::class, 'processed_by');
    }
}