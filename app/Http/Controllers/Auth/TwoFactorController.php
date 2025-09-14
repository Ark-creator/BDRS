<?php
namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\TwoFactorCode; 
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Validation\Rule; // <-- Add this import


class TwoFactorController extends Controller
{
   
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
    
    // SOLID MAY AMBAG NA SA BACKEND SI ACE PADILLA MAS MATAAS NA TF KO SAINYO 
    public function resend(Request $request): RedirectResponse
    {
        // --- START MODIFICATION ---
        $request->validate([
            'method' => ['nullable', 'string', Rule::in(['email', 'sms'])]
        ]);

        $userId = $request->session()->get('two_factor_user_id');

        if (!$userId) {
            return redirect()->route('login');
        }

        $user = User::findOrFail($userId);

        // Determine which method to use for resending
        $resendMethod = $request->input('method', $user->two_factor_method);

        // Temporarily set the user's notification preference for this one request
        $user->two_factor_method = $resendMethod;

        $user->two_factor_code = str_pad(random_int(1, 999999), 6, '0', STR_PAD_LEFT);
        $user->two_factor_expires_at = now()->addMinutes(10);
        $user->save();

        $user->notify(new TwoFactorCode());

        return back()
            ->with('status', 'A new verification code has been sent.')
            ->with('two_factor_method', $resendMethod); // Flash the method used
        // --- END MODIFICATION ---
    }
}