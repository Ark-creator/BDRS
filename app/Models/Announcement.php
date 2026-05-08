<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage; // Import the Storage facade
use App\Models\Traits\BelongsToTenant;

class Announcement extends Model
{
    use HasFactory, BelongsToTenant;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'tag',
        'title',
        'description',
        'image',
        'link',
        'user_id',
        'barangay_id',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['image_url'];

    /**
     * Get the full URL for the announcement's image.
     * This creates the new 'image_url' attribute.
     */
    public function getImageUrlAttribute(): ?string
    {
        if ($this->image) {
            return route('admin.images.proxy', ['path' => $this->image]);
        }
        return null;
    }


    public function barangay(): BelongsTo
{
    return $this->belongsTo(Barangay::class);
}
    /**
     * Get the user that owns the announcement.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
