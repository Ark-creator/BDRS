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
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

 $user = Auth::user();

        if ($user->role === 'super_admin') {
            // Redirect super admins to the user management page
            return redirect()->intended(route('superadmin.users.index', absolute: false));
        } elseif ($user->role === 'admin') {
            // Redirect admins to their specific admin dashboard
            // We will need to create this route and page later
            return redirect()->intended(route('admin.dashboard', absolute: false));
        } else {
            // Redirect all other users (residents) to the default dashboard
            return redirect()->intended(route('dashboard', absolute: false));
        }
        // --- END OF UPDATED LOGIC ---
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
