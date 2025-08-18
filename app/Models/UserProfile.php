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
}
