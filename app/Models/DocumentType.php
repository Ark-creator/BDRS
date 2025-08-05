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
    ];

    /**
     * Get all of the documentRequests for the DocumentType.
     */
    public function documentRequests()
    {
        return $this->hasMany(DocumentRequest::class);
    }
}