<?php

namespace App\Http\Middleware;

use App\Models\Verification;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIdentityVerificationAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $verification = $request->route('verification');

        if (is_string($verification)) {
            $verification = Verification::where('uuid', $verification)->firstOrFail();
            $request->route()->setParameter('verification', $verification);
        }

        if ($verification instanceof Verification && !$request->user()?->can('view', $verification)) {
            abort(403, 'You are not allowed to view this verification.');
        }

        return $next($request);
    }
}
