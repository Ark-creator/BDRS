<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserProfile extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * This array protects against mass-assignment vulnerabilities by
     * only allowing the specified fields to be filled using create() or update().
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'first_name',
        'middle_name',
        'last_name',
        'phone_number',
        'address',
        'birthday',
        'gender',
        'civil_status',
        'profile_picture_url',
    ];

    /**
     * The attributes that should be cast.
     *
     * This automatically converts attributes to common data types.
     * 'birthday' will be a Carbon instance, which is great for formatting.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'birthday' => 'date',
    ];

    /**
     * Get the user that owns the profile.
     * This defines the "inverse" of the one-to-one relationship.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}