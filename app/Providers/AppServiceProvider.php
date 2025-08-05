<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\Facades\Gate;
use App\Models\User;
// use Illuminate\Support\ServiceProvider;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;


class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        

    
        // This Gate checks if a user is an Admin OR a Super Admin.
        // Useful for giving access to regular admin panels.
        Gate::define('be-admin', function (User $user) {
            return in_array($user->role, ['admin', 'super_admin']);
        });

        // This Gate checks if a user is ONLY a Super Admin.
        // Useful for protecting the user management page.
        Gate::define('be-super-admin', function (User $user) {
            return $user->role === 'super_admin';
        });
    }
}
    
