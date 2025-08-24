<?php

namespace App\Http\Controllers\Auth;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Route;
use App\Http\Requests\Auth\LoginRequest;
use App\Notifications\TwoFactorCode; // Add this import


class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }
   

    /**
     * Handle an incoming authentication request.
     */
   // app/Http/Controllers/Auth/AuthenticatedSessionController.php


// ... other imports

public function store(LoginRequest $request): RedirectResponse
{
    $request->authenticate();
    $request->session()->regenerate();
    $user = Auth::user();

    // 1. Check for inactive status first (highest priority)
    if ($user->status === 'inactive') {
        Auth::logout();
        return back()->withErrors([
            'email' => 'Your account is inactive. Please contact the administrator.',
        ]);
    }

    // 2. Check for email verification
    if (!$user->hasVerifiedEmail()) {
        return redirect()->route('verification.notice');
    }

    // 3. Check for 2FA and redirect if enabled
    if ($user->two_factor_enabled) {
        $user->two_factor_code = str_pad(random_int(1, 999999), 6, '0', STR_PAD_LEFT);
        $user->two_factor_expires_at = now()->addMinutes(10);
        $user->save();
        
        $user->notify(new TwoFactorCode());
        
        // This is the key: place the user ID in the session, then log out
        $request->session()->put('two_factor_user_id', $user->id);
        
        Auth::logout();
        
        // ✅ The redirect should be the final action for the 2FA flow.
        return redirect()->route('two_factor.prompt');
    }

    // 4. If all checks pass, proceed with normal login based on role.
    if ($user->role === 'super_admin') {
        return redirect()->intended(route('residents.home', absolute: false));
    } elseif ($user->role === 'admin') {
        return redirect()->intended(route('residents.home', absolute: false));
    } else {
        return redirect()->intended(route('residents.home', absolute: false));
    }
}
    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
