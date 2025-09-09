<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Municipality extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'province'];

    /**
     * Get all of the barangays for the Municipality.
     */
    public function barangays(): HasMany
    {
        return $this->hasMany(Barangay::class);
    }
}