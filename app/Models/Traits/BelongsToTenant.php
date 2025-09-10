<?php

namespace App\Models\Traits;

use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Model;

trait BelongsToTenant
{
    public static function bootBelongsToTenant()
    {
        static::addGlobalScope(new TenantScope);

        // This automatically adds the barangay_id when creating a new record!
        static::creating(function (Model $model) {
            if (session()->has('barangay_id')) {
                $model->barangay_id = session('barangay_id');
            }
        });
    }
}