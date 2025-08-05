<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'document_request_id',
        'amount',
        'status',
        'payment_method',
        'reference_number',
    ];

    /**
     * Get the documentRequest that the payment belongs to.
     */
    public function documentRequest()
    {
        return $this->belongsTo(DocumentRequest::class);
    }
}