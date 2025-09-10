<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WelcomeContent extends Model
{
    use HasFactory;

    protected $table = 'welcome_content';

    protected $fillable = [
        'footer_logo_url',
        'footer_title',
        'footer_subtitle',
        'footer_address',
        'footer_email',
        'footer_phone',
        'officials',
    ];
    protected $casts = [
        'officials' => 'array',
    ];
}