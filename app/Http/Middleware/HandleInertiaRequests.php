<?php

namespace App\Http\Middleware;

use App\Models\WelcomeContent;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request)
    {
        $footerData = cache()->remember('welcome.content', now()->addHour(), function () {
            return WelcomeContent::first();
        });

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user()
                    ? $request->user()->load('profile')->append('full_name')
                    : null,
            ],
            'wasm_mode' => config('identity_verification.wasm_mode', false),
            'footerData' => $footerData,
        ]);
    }
}
