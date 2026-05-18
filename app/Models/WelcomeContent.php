<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WelcomeContent extends Model
{
    use HasFactory;

    protected $table = 'welcome_content';

    protected $fillable = [
        'footer_logo_path',
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

    public function getFooterLogoUrlAttribute(): ?string
    {
        if ($this->footer_logo_path) {
            return route('images.site-logos', ['path' => $this->footer_logo_path]);
        }
        
        $rawUrl = $this->getRawOriginal('footer_logo_url');
        if ($rawUrl && str_starts_with($rawUrl, '/images/')) {
            return $rawUrl;
        }
        
        return $rawUrl ?: null;
    }

    public function getOfficialsAttribute($value)
    {
        $officials = is_string($value) ? json_decode($value, true) : $value;
        
        if (!is_array($officials)) {
            return [];
        }

        return array_map(function ($official) {
            if (isset($official['photo_path']) && $official['photo_path']) {
                $official['photo_url'] = route('images.officials', ['path' => $official['photo_path']]);
            } elseif (isset($official['photo_url']) && $official['photo_url']) {
                if (str_starts_with($official['photo_url'], '/images/')) {
                    $official['photo_url'] = $official['photo_url'];
                } else {
                    $official['photo_url'] = null;
                }
            }
            return $official;
        }, $officials);
    }
}