<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\Facades\Gate;
use App\Models\User;
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

        // Allow super admins to bypass all checks automatically
        Gate::before(function (User $user, string $ability) {
            if ($user->role === 'super_admin') {
                return true;
            }
        });

        // Gate for Admin dashboard access (admins and super admins)
        Gate::define('be-admin', function (User $user) {
            return $user->role === 'admin';
        });

        // Gate for resident-level pages (residents and admins; superadmin handled by before)
        Gate::define('be-resident', function (User $user) {
            return in_array($user->role, ['resident', 'admin']);
        });

        // Gate for superadmin-only management
        Gate::define('be-super-admin', function (User $user) {
            return $user->role === 'super_admin';
        });
    }
}
