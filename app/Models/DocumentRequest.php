<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'document_type_id',
        'form_data',
        'status',
        'admin_remarks',
        'processed_by',
    ];

    protected $casts = [
        'form_data' => 'array', // Automatically converts the JSON to an array
    ];

    /**
     * Get the user that owns the DocumentRequest.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the admin that processed the DocumentRequest.
     */
    public function processor()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    /**
     * Get the documentType that the request is for.
     */
    public function documentType()
    {
        return $this->belongsTo(DocumentType::class);
    }

    /**
     * Get all of the credentials for the DocumentRequest.
     */
    public function credentials()
    {
        return $this->hasMany(UploadedCredential::class);
    }

    /**
     * Get the payment associated with the DocumentRequest.
     */
    public function payment()
    {
        return $this->hasOne(Payment::class);
    }
}