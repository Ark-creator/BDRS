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
        'valid_id_type',
        'valid_id_front_path',
        'valid_id_back_path',
        'face_image_path',
        'signature_data'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'birthday' => 'date',
    ];

    /**
     * Get the user that owns the profile.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * NEW: Accessor to get the user's full name.
     *
     * This combines the first, middle, and last names into a single string.
     * It gracefully handles cases where the middle name is null.
     *
     * @return string
     */
    public function getFullNameAttribute(): string
    {
        // Start with the first name
        $fullName = $this->first_name;

        // Add the middle name if it exists
        if (!empty($this->middle_name)) {
            $fullName .= ' ' . $this->middle_name;
        }

        // Add the last name
        $fullName .= ' ' . $this->last_name;

        return $fullName;
    }
}