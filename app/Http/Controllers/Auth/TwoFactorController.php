<?php

// app/Http/Controllers/Auth/TwoFactorController.php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;

class TwoFactorController extends Controller
{
    /**
     * Show the 2FA verification form.
     */
    public function show(Request $request): Response|RedirectResponse
    {
        if (!$request->session()->has('two_factor_user_id')) {
            return redirect()->route('login');
        }

        return Inertia::render('Auth/TwoFactor');
    }

    /**
     * Handle the 2FA code submission.
     */
    public function verify(Request $request): RedirectResponse
    {
        $request->validate(['two_factor_code' => ['required', 'string']]);

        $userId = $request->session()->get('two_factor_user_id');

        if (!$userId) {
            return redirect()->route('login');
        }

        $user = User::find($userId);

        if (!$user || $user->two_factor_code !== $request->two_factor_code || $user->two_factor_expires_at < now()) {
            return back()->withErrors(['two_factor_code' => 'The provided code is invalid or has expired.']);
        }
        
        // Code is valid, log the user in
        Auth::login($user);
        
        // Clear the 2FA session data and code
        $request->session()->forget('two_factor_user_id');
        $user->two_factor_code = null;
        $user->two_factor_expires_at = null;
        $user->save();
        
        return redirect()->intended(route('residents.home', absolute: false));
    }
}