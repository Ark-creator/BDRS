<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UploadedCredential extends Model
{
    use HasFactory;

    protected $fillable = [
        'document_request_id',
        'file_name',
        'file_path',
    ];

    /**
     * Get the documentRequest that the credential belongs to.
     */
    public function documentRequest()
    {
        return $this->belongsTo(DocumentRequest::class);
    }
}