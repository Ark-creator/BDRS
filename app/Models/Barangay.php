<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class Barangay extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
   protected $fillable = [
        'name',
        'municipality_id', // <-- Updated fillable
    ];

    /**
     * Get all of the users for the Barangay.
     */

        public function municipality(): BelongsTo
    {
        return $this->belongsTo(Municipality::class);
    }

  public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get all of the announcements for the Barangay.
     */
    public function announcements(): HasMany
    {
        return $this->hasMany(Announcement::class);
    }
    
    /**
     * Get all of the document types for the Barangay.
     */
    public function documentTypes(): HasMany
    {
        return $this->hasMany(DocumentType::class);
    }

    /**
     * Get all of the document requests for the Barangay.
     */
    public function documentRequests(): HasMany
    {
        return $this->hasMany(DocumentRequest::class);
    }

    /**
     * Get all of the contact messages for the Barangay.
     */
    public function contactMessages(): HasMany
    {
        return $this->hasMany(ContactMessage::class);
    }
}