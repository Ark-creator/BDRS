<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage; // <-- Import the Storage facade

class DocumentRequest extends Model
{
    use BelongsToTenant, HasFactory;

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
        'claim_voucher_code',
        'barangay_id',
    ];

    protected $casts = [
        'form_data' => 'array',
        'payment_amount' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    protected $appends = [
        'payment_receipt_url',
    ];

    public function scopePending($query)
    {
        return $query->where('status', 'Pending');
    }

    public function scopeActive($query)
    {
        return $query->whereNotIn('status', ['Claimed', 'Rejected']);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopePaid($query)
    {
        return $query->where('payment_status', 'Paid');
    }

    /**
     * Get the full URL for the payment receipt.
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
