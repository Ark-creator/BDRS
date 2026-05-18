<?php

namespace App\Http\Middleware;

use App\Models\WelcomeContent;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ShareFooterData
{
    public function handle(Request $request, Closure $next): Response
    {
        $footerData = cache()->remember('welcome.content', now()->addHour(), function () {
            return WelcomeContent::first();
        });

        view()->share('footerData', $footerData);

        return $next($request);
    }
}