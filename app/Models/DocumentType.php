<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'price',
        'template_path',
        'requirements_description',
        'is_archived',
        'archived_by',
    ];

    /**
     * Get all of the documentRequests for the DocumentType.
     */
    public function documentRequests()
    {
        return $this->hasMany(DocumentRequest::class);
    }

    /**
     * Get the user who archived the document type.
     */
    public function archivedBy(): BelongsTo
    {
        // Provide a default object with a 'full_name' attribute for deleted users.
        return $this->belongsTo(User::class, 'archived_by')
                    ->withDefault(function ($user, $documentType) {
                        $user->full_name = 'Deleted User';
                    });
    }
}