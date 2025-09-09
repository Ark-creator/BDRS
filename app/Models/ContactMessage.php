<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Traits\BelongsToTenant;
class ContactMessage extends Model
{
    use HasFactory, BelongsToTenant;

    // Define which attributes are mass assignable
    protected $fillable = [
        'user_id',
        'subject',
        'message',
        'status',
        'barangay_id',
    ];

    /**
     * Get the user that sent the contact message.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    public function replies(): HasMany
    {
        return $this->hasMany(Reply::class);
    }
}