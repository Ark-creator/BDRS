<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'price',
        'template_path',
        'requirements_description',
        'is_archived', // Ito ang idinagdag para gumana ang archive
    ];

    /**
     * Get all of the documentRequests for the DocumentType.
     */
    public function documentRequests()
    {
        return $this->hasMany(DocumentRequest::class);
    }
}