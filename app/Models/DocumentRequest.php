<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage; // <-- Import the Storage facade

class DocumentRequest extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'document_type_id',
        'form_data',
        'status',
        'admin_remarks',
        'processed_by',
        'payment_amount',
        'payment_status',
        'payment_receipt_path',
        'paid_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'form_data' => 'array',
        'payment_amount' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = [
        'payment_receipt_url',
    ];

    /**
     * Get the full URL for the payment receipt.
     *
     * @return string|null
     */
    public function getPaymentReceiptUrlAttribute(): ?string
    {
        if ($this->payment_receipt_path) {
            // This now generates a secure URL like: /admin/requests/123/receipt
            return route('admin.requests.receipt', $this);
        }

        return null;
    }

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