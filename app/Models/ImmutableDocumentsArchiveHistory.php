<?php
// app/Models/ImmutableDocumentsArchiveHistory.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ImmutableDocumentsArchiveHistory extends Model
{
    use HasFactory;

    // Itakda ang pangalan ng table dahil hindi ito standard plural form
    protected $table = 'immutable_documents_archive_history';

    protected $fillable = [
        'user_id',
        'document_type_id',
        'form_data',
        'status',
        'admin_remarks',
        'processed_by',
        'original_created_at',
    ];

    protected $casts = [
        'form_data' => 'array',
        'original_created_at' => 'datetime',
    ];

    // Relationships para madaling makuha ang related data
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function processor()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function documentType()
    {
        return $this->belongsTo(DocumentType::class);
    }
}